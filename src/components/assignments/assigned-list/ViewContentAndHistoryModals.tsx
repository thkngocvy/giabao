import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Clock,
  Download,
  Edit3,
  FileText,
  History,
  Lock,
  Paperclip,
  Search,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Modal } from '../../common/Modal';
import { db } from '../../../services/db';
import { Assignment, UserRole } from '../../../types';
import { downloadAssignmentAttachment, getAssignmentReceiveDisplayMeta } from './utils';

interface ViewContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  actor: { id: string; name: string; role: UserRole };
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ViewAssignmentContentModal: React.FC<ViewContentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  actor,
  onToast,
}) => {
  const stats = db.getAssignmentStats(assignment);
  const receiveMeta = getAssignmentReceiveDisplayMeta(assignment);
  const questions = assignment.selectedQuestions || [];

  const handleDownload = () => {
    const res = downloadAssignmentAttachment(assignment, actor);
    if (!res.ok) {
      onToast(res.error, 'error');
      return;
    }
    onToast(`Đang tải tệp "${res.filename}"...`, 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nội Dung Đề Bài · ${assignment.title}`}
      subtitle={`${db.getAssignmentCode(assignment)} · Lớp ${assignment.className} · ${assignment.subjectName}`}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-xs">
        {stats.submittedCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Đã có <strong>{stats.submittedCount}</strong> bài nộp của học sinh. Hệ thống khóa chỉnh sửa câu hỏi, đáp án và thang điểm ({assignment.points}đ) để bảo toàn tính công bằng dữ liệu đã nộp/chấm.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Trạng thái nhận bài</span>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded border text-[10.5px] font-bold ${receiveMeta.badgeClass}`}>
              {receiveMeta.label}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Hạn nộp gốc</span>
            <strong className="text-[#EAFBFF] tabular-nums">
              {new Date(assignment.dueDate).toLocaleString('vi-VN')}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Thang điểm & Lượt nộp</span>
            <strong className="text-[#00E5FF] tabular-nums">
              {assignment.points} điểm · Tối đa {assignment.maxAttempts || 3} lượt
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Quy tắc tính điểm</span>
            <strong className="text-[#EAFBFF]">
              {assignment.gradingPolicy === 'highest' ? 'Điểm cao nhất' : 'Lần nộp gần nhất'}
            </strong>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
          <div className="font-bold text-[#00E5FF] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Mô tả & Hướng dẫn làm bài</span>
          </div>
          <p className="text-[#EAFBFF] leading-relaxed whitespace-pre-wrap">
            {assignment.instructions || assignment.description}
          </p>
          {assignment.content && (
            <div className="p-3 rounded-lg bg-[#030B16] border border-[#00E5FF]/15 font-mono text-[11px] text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {assignment.content}
            </div>
          )}
          {assignment.fileName && (
            <div className="p-2.5 rounded-lg bg-[#0A1B2D] border border-[#00E5FF]/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span className="font-semibold text-[#EAFBFF]">{assignment.fileName}</span>
                {assignment.fileSize && <span className="text-[#8BA9BC]">({assignment.fileSize})</span>}
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF]/40 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải đề bài</span>
              </button>
            </div>
          )}
        </div>

        {questions.length > 0 && (
          <div className="space-y-2.5">
            <div className="font-bold text-[#EAFBFF] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#00E5FF]" />
              <span>Danh sách câu hỏi snapshot ({questions.length} câu)</span>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {questions.map((item, idx) => {
                const q = item.snapshot || db.getQuestions().find(it => it.id === item.questionId);
                return (
                  <div key={item.questionId || idx} className="p-3 rounded-xl bg-[#071525] border border-[#0e3d54] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00E5FF]">
                        Câu {idx + 1} · {item.points} điểm
                      </span>
                      <span className="text-[10.5px] uppercase text-[#8BA9BC]">
                        {item.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                      </span>
                    </div>
                    <div className="text-[#EAFBFF] whitespace-pre-wrap">{q?.content || 'Nội dung câu hỏi'}</div>
                    {q?.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {q.options.map(opt => (
                          <div
                            key={opt.id}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                              q.correctAnswer === opt.id
                                ? 'bg-[#00F5A0]/15 border-[#00F5A0]/50 text-[#00F5A0] font-semibold'
                                : 'bg-[#030B16] border-[#0e3d54] text-slate-300'
                            }`}
                          >
                            {opt.id}. {opt.text}
                          </div>
                        ))}
                      </div>
                    )}
                    {q?.explanation && (
                      <div className="text-[11px] text-[#8BA9BC] bg-[#030B16] p-2 rounded border border-[#0e3d54]">
                        <strong className="text-[#00E5FF]">Lời giải: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#EAFBFF] font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface AssignmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
}

export const AssignmentHistoryModal: React.FC<AssignmentHistoryModalProps> = ({
  isOpen,
  onClose,
  assignment,
}) => {
  const subs = db.getSubmissions(assignment.id);
  const events = assignment.events || [];
  const overrides = Object.entries(assignment.recipientOverrides || {});
  const revisions = subs.flatMap(sub =>
    (sub.revisions || []).map(rev => ({
      ...rev,
      studentName: sub.studentName,
    }))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lịch Sử Thay Đổi & Nhật Ký Gia Hạn · ${assignment.title}`}
      subtitle={`${db.getAssignmentCode(assignment)} · Phiên bản v${assignment.version || 1}`}
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        {/* Custom deadline overrides */}
        <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
          <div className="font-bold text-[#00E5FF] flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Học sinh được gia hạn riêng ({overrides.length})</span>
          </div>
          {overrides.length === 0 ? (
            <div className="text-[#8BA9BC]">Toàn lớp đang áp dụng hạn chung: {new Date(assignment.dueDate).toLocaleString('vi-VN')}.</div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {overrides.map(([studentId, ov]) => {
                const st = db.getStudentById(studentId);
                return (
                  <div key={studentId} className="p-2 rounded-lg bg-[#0A1B2D] border border-[#00E5FF]/15 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <strong className="text-[#EAFBFF]">{st?.fullName || studentId}</strong>
                      <span className="text-[#8BA9BC] ml-2">→ Hạn riêng: {new Date(ov.dueOverrideAt).toLocaleString('vi-VN')}</span>
                      <div className="text-[11px] text-[#8BA9BC]">Lý do: {ov.reason}</div>
                    </div>
                    <span className="text-[10.5px] text-[#8BA9BC] tabular-nums">
                      {ov.updatedBy} · {new Date(ov.updatedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
            <div className="font-bold text-[#EAFBFF] flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#00E5FF]" />
              <span>Nhật ký thao tác lượt giao ({events.length})</span>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {events.length === 0 ? (
                <div className="text-[#8BA9BC]">Chưa phát sinh sự kiện thay đổi.</div>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-[#0A1B2D] border border-[#00E5FF]/15 space-y-0.5">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-bold text-[#00E5FF]">{ev.eventType}</span>
                      <span className="text-[#8BA9BC] tabular-nums">{new Date(ev.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="text-[#EAFBFF]">{ev.summary}</div>
                    <div className="text-[10.5px] text-[#8BA9BC]">Thực hiện: {ev.actorName}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
            <div className="font-bold text-[#EAFBFF] flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-300" />
              <span>Lịch sử sửa điểm ({revisions.length})</span>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {revisions.length === 0 ? (
                <div className="text-[#8BA9BC]">Chưa có lần điều chỉnh điểm nào.</div>
              ) : (
                revisions.map(rev => (
                  <div key={rev.id} className="p-2.5 rounded-lg bg-[#0A1B2D] border border-amber-500/25 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#EAFBFF]">{rev.studentName}</strong>
                      <span className="font-bold text-amber-300 tabular-nums">
                        {rev.oldScore ?? '—'} → {rev.newScore}
                      </span>
                    </div>
                    <div className="text-[#8BA9BC]">Lý do: {rev.reason}</div>
                    <div className="text-[10.5px] text-[#8BA9BC] tabular-nums">
                      {rev.changedBy} · {new Date(rev.changedAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#EAFBFF] font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface ClassOverviewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  onOpenExport: () => void;
}

export const ClassOverviewReportModal: React.FC<ClassOverviewReportModalProps> = ({
  isOpen,
  onClose,
  assignments,
  onOpenExport,
}) => {
  const [reportClassId, setReportClassId] = useState<string>('all');
  const [reportSubject, setReportSubject] = useState<string>('all');
  const [studentQuery, setStudentQuery] = useState<string>('');

  const classes = db.getClasses();
  const subjects = useMemo(
    () => Array.from(new Set(assignments.map(a => a.subjectName))),
    [assignments]
  );

  const scopedAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (reportClassId !== 'all' && a.classId !== reportClassId) return false;
      if (reportSubject !== 'all' && a.subjectName !== reportSubject) return false;
      return db.getEffectiveReceiveStatus(a) !== 'draft' && db.getEffectiveReceiveStatus(a) !== 'withdrawn';
    });
  }, [assignments, reportClassId, reportSubject]);

  const analytics = useMemo(() => {
    let totalExpected = 0;
    let totalSubmitted = 0;
    let totalGraded = 0;
    const allScoresNormalized: number[] = [];
    const supportMap = new Map<
      string,
      { studentName: string; studentCode: string; className: string; missingOverdue: number; lowScores: number; resubmitReq: number; avgSum: number; scoreCnt: number }
    >();

    const buckets = [
      { label: '0 – 3.9', count: 0, color: '#FF4D6D' },
      { label: '4.0 – 5.4', count: 0, color: '#F59E0B' },
      { label: '5.5 – 6.9', count: 0, color: '#38BDF8' },
      { label: '7.0 – 8.4', count: 0, color: '#00E5FF' },
      { label: '8.5 – 10', count: 0, color: '#00F5A0' },
    ];

    scopedAssignments.forEach(asg => {
      const stats = db.getAssignmentStats(asg);
      totalExpected += stats.totalRecipients;
      totalSubmitted += stats.submittedCount;
      totalGraded += stats.gradedCount;

      const subs = db.getSubmissions(asg.id);
      const subMap = new Map(subs.map(s => [s.studentId, s]));
      const recipients = db.getAssignmentRecipients(asg);
      const maxScore = Number(asg.points || 10);
      const nowMs = Date.now();
      const graceMs = (asg.allowLateDays || 0) * 86400000;

      recipients.forEach(st => {
        if (!supportMap.has(st.id)) {
          supportMap.set(st.id, {
            studentName: st.fullName,
            studentCode: st.studentCode,
            className: st.className,
            missingOverdue: 0,
            lowScores: 0,
            resubmitReq: 0,
            avgSum: 0,
            scoreCnt: 0,
          });
        }
        const entry = supportMap.get(st.id)!;
        const sub = subMap.get(st.id);
        const effDueMs = new Date(db.getStudentEffectiveDueDate(asg, st.id)).getTime();

        if (!sub && nowMs > effDueMs + graceMs) {
          entry.missingOverdue++;
        }
        if (sub) {
          if (sub.status === 'resubmit_required') entry.resubmitReq++;
          if (sub.score !== undefined) {
            const norm10 = maxScore > 0 ? (sub.score / maxScore) * 10 : 0;
            allScoresNormalized.push(norm10);
            entry.avgSum += norm10;
            entry.scoreCnt++;
            if (norm10 < 5) entry.lowScores++;

            if (norm10 < 4) buckets[0].count++;
            else if (norm10 < 5.5) buckets[1].count++;
            else if (norm10 < 7) buckets[2].count++;
            else if (norm10 < 8.5) buckets[3].count++;
            else buckets[4].count++;
          }
        }
      });
    });

    const atRiskStudents = Array.from(supportMap.entries())
      .map(([id, v]) => ({ id, ...v }))
      .filter(v => {
        const matchesQuery =
          !studentQuery.trim() ||
          v.studentName.toLowerCase().includes(studentQuery.toLowerCase()) ||
          v.studentCode.toLowerCase().includes(studentQuery.toLowerCase());
        return matchesQuery && (v.missingOverdue > 0 || v.lowScores > 0 || v.resubmitReq > 0);
      })
      .sort((a, b) => b.missingOverdue * 3 + b.lowScores * 2 - (a.missingOverdue * 3 + a.lowScores * 2));

    const submissionRate = totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : 0;
    const gradingProgress = totalSubmitted > 0 ? Math.round((totalGraded / totalSubmitted) * 100) : 0;
    const avgScore10 =
      allScoresNormalized.length > 0
        ? (allScoresNormalized.reduce((a, b) => a + b, 0) / allScoresNormalized.length).toFixed(2)
        : '—';

    return {
      totalExpected,
      totalSubmitted,
      unsubmitted: Math.max(0, totalExpected - totalSubmitted),
      totalGraded,
      submissionRate,
      gradingProgress,
      avgScore10,
      buckets,
      atRiskStudents,
    };
  }, [scopedAssignments, studentQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Báo Cáo Tổng Hợp & Học Sinh Cần Hỗ Trợ"
      subtitle={`Phân tích theo ${scopedAssignments.length} lượt giao bài tập chính thức`}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={reportClassId}
              onChange={e => setReportClassId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#030B16] border border-[#0e3d54] text-white font-semibold"
            >
              <option value="all">Tất cả lớp</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>Lớp {c.name}</option>
              ))}
            </select>
            <select
              value={reportSubject}
              onChange={e => setReportSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#030B16] border border-[#0e3d54] text-white font-semibold"
            >
              <option value="all">Tất cả môn</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Lọc tên / mã học sinh..."
                value={studentQuery}
                onChange={e => setStudentQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#030B16] border border-[#0e3d54] text-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenExport}
            className="px-3 py-1.5 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 border border-[#00E5FF]/40 text-[#00E5FF] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất báo cáo (Excel / CSV / PDF)</span>
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Tỷ lệ nộp bài</div>
            <div className="font-rajdhani text-2xl font-bold text-[#00E5FF] tabular-nums">
              {analytics.submissionRate}%
            </div>
            <div className="text-[10.5px] text-[#8BA9BC] tabular-nums">
              {analytics.totalSubmitted}/{analytics.totalExpected} lượt nộp
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Chưa nộp</div>
            <div className="font-rajdhani text-2xl font-bold text-[#FF4D6D] tabular-nums">
              {analytics.unsubmitted}
            </div>
            <div className="text-[10.5px] text-[#8BA9BC]">Lượt HS chưa nộp</div>
          </div>
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Tiến độ chấm điểm</div>
            <div className="font-rajdhani text-2xl font-bold text-[#00F5A0] tabular-nums">
              {analytics.gradingProgress}%
            </div>
            <div className="text-[10.5px] text-[#8BA9BC] tabular-nums">
              {analytics.totalGraded}/{analytics.totalSubmitted} bài đã chấm
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Điểm TB chung (hệ 10)</div>
            <div className="font-rajdhani text-2xl font-bold text-amber-300 tabular-nums">
              {analytics.avgScore10}
            </div>
            <div className="text-[10.5px] text-[#8BA9BC]">Tính trên các bài đã chấm</div>
          </div>
        </div>

        {/* Distribution chart */}
        <div className="p-4 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
          <div className="font-bold text-[#EAFBFF] flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
            <span>Phân phối điểm số toàn phạm vi lọc</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.12)" />
                <XAxis dataKey="label" tick={{ fill: '#8BA9BC', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#8BA9BC', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A1B2D',
                    borderColor: 'rgba(0,229,255,0.35)',
                    borderRadius: '8px',
                    color: '#EAFBFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Số bài chấm" radius={[6, 6, 0, 0]}>
                  {analytics.buckets.map((b, i) => (
                    <Cell key={i} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* At-risk students list */}
        <div className="p-3.5 rounded-xl bg-[#071525] border border-[#FF4D6D]/30 space-y-2">
          <div className="font-bold text-[#EAFBFF] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#FF4D6D]" />
              <span>Học sinh cần quan tâm / hỗ trợ ({analytics.atRiskStudents.length})</span>
            </span>
            <span className="text-[11px] text-[#8BA9BC]">Thiếu quá hạn, điểm &lt; 5.0 hoặc cần làm lại</span>
          </div>
          {analytics.atRiskStudents.length === 0 ? (
            <div className="p-4 text-center text-[#8BA9BC] border border-dashed border-[#0e3d54] rounded-lg">
              Không ghi nhận học sinh nào thiếu quá hạn hoặc có điểm dưới trung bình trong bộ lọc này.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-[#0e3d54] rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-[#030B16] text-[11px] text-[#8BA9BC] uppercase">
                  <tr>
                    <th className="px-3 py-2">Học sinh</th>
                    <th className="px-3 py-2">Lớp</th>
                    <th className="px-3 py-2 text-center">Thiếu quá hạn</th>
                    <th className="px-3 py-2 text-center">Bài điểm &lt; 5</th>
                    <th className="px-3 py-2 text-center">Cần làm lại</th>
                    <th className="px-3 py-2 text-right">ĐTB các bài</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0e3d54]">
                  {analytics.atRiskStudents.map(st => (
                    <tr key={st.id} className="hover:bg-[#0A1B2D]">
                      <td className="px-3 py-2 font-semibold text-[#EAFBFF]">
                        {st.studentName} <span className="text-[#8BA9BC] font-normal">({st.studentCode})</span>
                      </td>
                      <td className="px-3 py-2 text-cyan-300">{st.className}</td>
                      <td className="px-3 py-2 text-center font-bold text-[#FF4D6D] tabular-nums">
                        {st.missingOverdue}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-amber-300 tabular-nums">
                        {st.lowScores}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-sky-300 tabular-nums">
                        {st.resubmitReq}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#EAFBFF] tabular-nums">
                        {st.scoreCnt > 0 ? (st.avgSum / st.scoreCnt).toFixed(2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
