import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  History,
  RotateCcw,
  Save,
  Send,
} from 'lucide-react';
import { Modal } from '../../common/Modal';
import { db } from '../../../services/db';
import {
  Assignment,
  AssignmentSubmission,
  UserRole,
} from '../../../types';
import { formatLatenessDuration, getGradeStatusMeta } from './utils';
import { SubmissionAttachmentPreview } from './SubmissionFilePreviewModal';

interface ActorInfo {
  id: string;
  name: string;
  role: UserRole;
}

interface GradingWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submission: AssignmentSubmission;
  allSubmissions: AssignmentSubmission[];
  actor: ActorInfo;
  onSelectNextSubmission: (nextSub: AssignmentSubmission) => void;
  onRequestResubmit: (sub: AssignmentSubmission) => void;
  onSuccess: (msg: string) => void;
}

export const GradingWorkspaceModal: React.FC<GradingWorkspaceModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission,
  allSubmissions,
  actor,
  onSelectNextSubmission,
  onRequestResubmit,
  onSuccess,
}) => {
  const maxScore = Number(assignment.points || 10);
  const effGradeStatus = db.getSubmissionEffectiveGradeStatus(submission);
  const isRevising =
    (effGradeStatus === 'graded' || effGradeStatus === 'published') &&
    submission.score !== undefined;

  const selectedQuestions = assignment.selectedQuestions || [];
  const hasBankQuestions = selectedQuestions.length > 0;

  const buildInitialQuestionScores = (sub: AssignmentSubmission): Record<string, number> => {
    const map: Record<string, number> = {};
    selectedQuestions.forEach(sq => {
      if (sub.questionScores && sub.questionScores[sq.questionId] !== undefined) {
        map[sq.questionId] = sub.questionScores[sq.questionId];
      } else {
        map[sq.questionId] = 0;
      }
    });
    return map;
  };

  const [questionScores, setQuestionScores] = useState<Record<string, number>>(() =>
    buildInitialQuestionScores(submission)
  );
  const [score, setScore] = useState<string>(
    submission.score !== undefined ? String(submission.score) : ''
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [confirmRevisionChecked, setConfirmRevisionChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState<boolean>(false);
  const [pendingNextSub, setPendingNextSub] = useState<AssignmentSubmission | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuestionScores(buildInitialQuestionScores(submission));
      setScore(submission.score !== undefined ? String(submission.score) : '');
      setFeedback(submission.feedback || '');
      setRevisionReason('');
      setConfirmRevisionChecked(false);
      setError(null);
      setShowUnsavedPrompt(false);
      setPendingNextSub(null);
    }
  }, [isOpen, submission.id, submission.version]);

  // Auto-sum per-question scores if any per-question score was entered
  const handleQuestionScoreChange = (qid: string, rawVal: string, qMax: number) => {
    const parsed = rawVal === '' ? 0 : Math.max(0, Math.min(qMax, Number(rawVal)));
    const nextMap = { ...questionScores, [qid]: Number.isNaN(parsed) ? 0 : parsed };
    setQuestionScores(nextMap);
    const summed = selectedQuestions.reduce((acc, sq) => acc + (nextMap[sq.questionId] || 0), 0);
    setScore(String(Number(summed.toFixed(2))));
  };

  // Next ungraded submission in queue (excluding current)
  const nextUngradedSubmission = useMemo(() => {
    return allSubmissions.find(
      s =>
        s.id !== submission.id &&
        ['ungraded', 'draft_grade'].includes(db.getSubmissionEffectiveGradeStatus(s))
    );
  }, [allSubmissions, submission.id]);

  // Track dirty state for leave confirmation
  const isDirty = useMemo(() => {
    const initialScoreStr = submission.score !== undefined ? String(submission.score) : '';
    const initialFeedback = submission.feedback || '';
    const qChanged = hasBankQuestions
      ? selectedQuestions.some(
          sq => (questionScores[sq.questionId] || 0) !== (submission.questionScores?.[sq.questionId] || 0)
        )
      : false;
    return score !== initialScoreStr || feedback !== initialFeedback || qChanged || revisionReason.trim().length > 0;
  }, [score, feedback, questionScores, revisionReason, submission, hasBankQuestions, selectedQuestions]);

  const effectiveDue = db.getStudentEffectiveDueDate(assignment, submission.studentId);
  const lateness = formatLatenessDuration(submission.submittedAt, effectiveDue);
  const effReceive = db.getEffectiveReceiveStatus(assignment);
  const maxAttempts = assignment.maxAttempts || 3;
  const canRequestResubmit =
    effReceive !== 'closed' &&
    effReceive !== 'withdrawn' &&
    (submission.attemptNo || 1) < maxAttempts;

  const handleRequestClose = () => {
    if (isDirty) {
      setPendingNextSub(null);
      setShowUnsavedPrompt(true);
      return;
    }
    onClose();
  };

  const executeSave = (
    targetStatus: 'draft_grade' | 'graded' | 'published',
    moveToNextAfterSave = false
  ) => {
    setError(null);
    const numScore = Number(score);
    if (score.trim() === '' || Number.isNaN(numScore) || numScore < 0 || numScore > maxScore) {
      setError(`Điểm số phải là số hợp lệ từ 0 đến ${maxScore}.`);
      return;
    }

    if (isRevising) {
      if (revisionReason.trim().length < 5) {
        setError('Bài đã chấm điểm — bắt buộc nhập lý do sửa điểm tối thiểu 5 ký tự.');
        return;
      }
      if (!confirmRevisionChecked) {
        setError('Vui lòng tích xác nhận điều chỉnh điểm để ghi nhận vào lịch sử bất biến.');
        return;
      }
    }

    const finalGradeStatus: 'draft_grade' | 'graded' | 'published' =
      targetStatus === 'published'
        ? 'published'
        : isRevising && effGradeStatus === 'published'
        ? 'published'
        : targetStatus;

    const res = db.saveSubmissionGrade({
      submissionId: submission.id,
      score: numScore,
      questionScores: hasBankQuestions ? questionScores : undefined,
      feedback: feedback.trim(),
      gradeStatus: finalGradeStatus,
      revisionReason: isRevising ? revisionReason.trim() : undefined,
      expectedVersion: submission.version || 1,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    if (finalGradeStatus === 'published' && targetStatus === 'published') {
      db.publishAssignmentGrades({
        assignmentId: assignment.id,
        submissionIds: [submission.id],
        notify: true,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
      });
    }

    const msg =
      finalGradeStatus === 'draft_grade'
        ? `Đã lưu chấm nháp cho em ${submission.studentName} (${numScore}/${maxScore}đ — chưa công bố).`
        : targetStatus === 'published'
        ? `Đã chấm & trả bài công bố điểm cho em ${submission.studentName}: ${numScore}/${maxScore}đ.`
        : isRevising
        ? `Đã sửa điểm em ${submission.studentName}: ${submission.score} → ${numScore}/${maxScore}đ.`
        : `Đã hoàn tất chấm bài em ${submission.studentName}: ${numScore}/${maxScore}đ.`;

    onSuccess(msg);

    if (moveToNextAfterSave && nextUngradedSubmission) {
      onSelectNextSubmission(nextUngradedSubmission);
    } else {
      onClose();
    }
  };

  const gradeBadge = getGradeStatusMeta(effGradeStatus);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleRequestClose}
      title={
        isRevising
          ? `Sửa Điểm & Chấm Chi Tiết · ${submission.studentName}`
          : `Chấm Bài & Nhận Xét · ${submission.studentName}`
      }
      subtitle={`${db.getAssignmentCode(assignment)} · Lớp ${assignment.className} · Lần nộp #${submission.attemptNo || 1}`}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Unsaved changes dialog (replaces window.confirm) */}
        {showUnsavedPrompt && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/60 text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-300">Bạn có thay đổi điểm/nhận xét chưa lưu!</div>
                <div className="text-[11px] text-amber-200/90">
                  Nếu thoát bây giờ, dữ liệu vừa nhập cho em {submission.studentName} sẽ bị mất.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-3 py-1.5 rounded-lg bg-[#071525] border border-[#00E5FF]/30 text-[#EAFBFF] font-semibold cursor-pointer"
              >
                Ở lại chấm tiếp
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  if (pendingNextSub) onSelectNextSubmission(pendingNextSub);
                  else onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FF4D6D] text-white font-bold cursor-pointer"
              >
                Bỏ thay đổi & Rời đi
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Metadata strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Học sinh</span>
            <strong className="text-[#EAFBFF]">{submission.studentName}</strong>
            {submission.studentCode && (
              <span className="text-[10.5px] text-[#8BA9BC] ml-1">({submission.studentCode})</span>
            )}
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Thời gian nộp</span>
            <strong className="text-[#EAFBFF] tabular-nums">
              {new Date(submission.submittedAt).toLocaleString('vi-VN')}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">So với hạn của HS</span>
            <strong className={lateness.isLate ? 'text-amber-300' : 'text-[#00F5A0]'}>
              {lateness.isLate ? lateness.label : 'Đúng hạn'}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Trạng thái chấm</span>
            <span className={`inline-block mt-0.5 text-[10.5px] font-bold px-2 py-0.5 rounded border ${gradeBadge.badgeClass}`}>
              {gradeBadge.label}
            </span>
          </div>
        </div>

        {/* Two-column body: Left = Student Submission + File, Right = Answer Key / Per-Question Score + Final Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Student Content & Attachment */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#00E5FF]/15 pb-2">
                <span className="font-bold text-[#00E5FF] flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Nội dung bài làm của học sinh
                </span>
                <span className="text-[11px] text-[#8BA9BC] tabular-nums">
                  Lần nộp #{submission.attemptNo || 1}/{maxAttempts}
                </span>
              </div>

              {submission.topic && (
                <div className="text-[11.5px]">
                  <span className="text-[#8BA9BC]">Chủ đề bài nộp: </span>
                  <strong className="text-[#EAFBFF]">{submission.topic}</strong>
                </div>
              )}

              {submission.fileName && (
                <SubmissionAttachmentPreview
                  assignment={assignment}
                  submission={submission}
                  actor={actor}
                  onError={msg => setError(msg)}
                />
              )}

              <div className="p-3 rounded-lg bg-[#030B16] border border-[#00E5FF]/15 font-mono text-[11.5px] text-[#EAFBFF] max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {submission.content || 'Học sinh nộp bài qua tệp đính kèm.'}
              </div>
            </div>

            {/* Revision history if any */}
            {submission.revisions && submission.revisions.length > 0 && (
              <div className="p-3 rounded-xl bg-[#071525] border border-amber-500/30 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Lịch sử sửa điểm bất biến ({submission.revisions.length})</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {submission.revisions.map(rev => (
                    <div
                      key={rev.id}
                      className="text-[11px] p-2 rounded-lg bg-[#0A1B2D] border border-amber-500/20 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#EAFBFF] tabular-nums">
                          {rev.oldScore ?? '—'} → {rev.newScore}/{maxScore}
                        </span>
                        <span className="text-[#8BA9BC] tabular-nums">
                          {rev.changedBy} · {new Date(rev.changedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-[#8BA9BC]">Lý do: {rev.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Per-question Rubric / Answer Key + Score Form */}
          <div className="space-y-3">
            {hasBankQuestions ? (
              <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#00E5FF]/15 pb-2">
                  <span className="font-bold text-[#00E5FF] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Đáp án / Barem & Chấm từng câu ({selectedQuestions.length} câu)
                  </span>
                  <span className="text-[11px] text-[#00F5A0] font-semibold">Tự cộng tổng điểm</span>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {selectedQuestions.map((sq, idx) => {
                    const q = sq.snapshot || db.getQuestions().find(item => item.id === sq.questionId);
                    return (
                      <div
                        key={sq.questionId || idx}
                        className="p-2.5 rounded-lg bg-[#030B16] border border-[#0e3d54] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#EAFBFF]">
                            Câu {idx + 1} ({sq.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.25"
                              min={0}
                              max={sq.points}
                              value={questionScores[sq.questionId] ?? 0}
                              onChange={e =>
                                handleQuestionScoreChange(sq.questionId, e.target.value, sq.points)
                              }
                              className="w-16 px-2 py-1 rounded bg-[#071525] border border-[#00E5FF]/35 text-[#00E5FF] font-bold text-right tabular-nums"
                            />
                            <span className="text-[#8BA9BC] tabular-nums">/ {sq.points}đ</span>
                          </div>
                        </div>
                        {q?.content && (
                          <div className="text-[11px] text-slate-300 line-clamp-2">{q.content}</div>
                        )}
                        {q?.correctAnswer && (
                          <div className="text-[11px] text-[#00F5A0]">
                            Đáp án đúng: <strong>{q.correctAnswer}</strong>
                          </div>
                        )}
                        {q?.rubric && (
                          <div className="text-[11px] text-purple-300">
                            Barem: {q.rubric}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-1">
                <div className="font-bold text-[#00E5FF] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Đề bài & Barem tham chiếu</span>
                </div>
                <div className="text-[11px] text-[#8BA9BC] max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {assignment.instructions || assignment.content || assignment.description}
                </div>
              </div>
            )}

            {/* Total score + feedback */}
            <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/25 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                <div>
                  <label className="block font-semibold text-[#EAFBFF] mb-1">
                    Tổng điểm (0 – {maxScore}) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max={maxScore}
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    placeholder={`0 - ${maxScore}`}
                    className="w-full px-3 py-2 border border-[#00E5FF]/35 rounded-lg bg-[#030B16] text-[#00E5FF] font-rajdhani text-xl font-bold tabular-nums"
                  />
                  {isRevising && (
                    <div className="mt-1 text-[11px] text-amber-300 font-semibold tabular-nums">
                      Điểm cũ: {submission.score} → Mới: {score || '—'}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#EAFBFF] mb-1">
                    Nhận xét chi tiết cho học sinh
                  </label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Ghi nhận ưu điểm và hướng dẫn sửa sai..."
                    className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#030B16] text-[#EAFBFF] text-xs"
                  />
                </div>
              </div>

              {isRevising && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 space-y-2">
                  <div>
                    <label className="block font-semibold text-amber-300 mb-1">
                      Lý do sửa điểm * (tối thiểu 5 ký tự — lưu lịch sử bất biến)
                    </label>
                    <input
                      type="text"
                      value={revisionReason}
                      onChange={e => setRevisionReason(e.target.value)}
                      placeholder="Ví dụ: Cộng bổ sung 0.5đ phần biện luận câu 2 theo barem..."
                      className="w-full px-3 py-2 border border-amber-500/40 rounded-lg bg-[#030B16] text-[#EAFBFF]"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-amber-200">
                    <input
                      type="checkbox"
                      checked={confirmRevisionChecked}
                      onChange={e => setConfirmRevisionChecked(e.target.checked)}
                      className="accent-amber-400"
                    />
                    <span>
                      Xác nhận sửa điểm từ <strong>{submission.score}</strong> thành{' '}
                      <strong>{score || '—'}</strong> và ghi nhật ký bất biến
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="pt-3 border-t border-[#00E5FF]/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canRequestResubmit}
              title={
                !canRequestResubmit
                  ? `Không thể yêu cầu làm lại (đã dùng ${submission.attemptNo || 1}/${maxAttempts} lượt hoặc bài đã đóng/thu hồi)`
                  : 'Yêu cầu học sinh nộp lại bài'
              }
              onClick={() => {
                onClose();
                onRequestResubmit(submission);
              }}
              className="px-3 py-2 rounded-xl bg-[#071525] hover:bg-amber-950/60 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yêu cầu làm lại</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-3.5 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] hover:text-[#EAFBFF] font-semibold cursor-pointer"
            >
              Đóng
            </button>

            {!isRevising && (
              <button
                type="button"
                onClick={() => executeSave('draft_grade')}
                className="px-3.5 py-2 rounded-xl bg-[#071525] hover:bg-[#0E253D] border border-amber-500/45 text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu nháp</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => executeSave('graded')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRevising ? 'Xác nhận sửa điểm' : 'Hoàn tất chấm'}</span>
            </button>

            {nextUngradedSubmission && (
              <button
                type="button"
                onClick={() => executeSave('graded', true)}
                className="px-4 py-2 rounded-xl bg-[#03172c] hover:bg-[#062a4d] border border-[#00E5FF] text-[#00E5FF] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Chấm tiếp ({nextUngradedSubmission.studentName})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {effGradeStatus !== 'published' && (
              <button
                type="button"
                onClick={() => executeSave('published')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00E5FF] text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Trả bài / Công bố</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
