import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Paperclip,
  X,
  Send,
  HelpCircle
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { Assignment, AssignmentSubmission, Student } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface SubmitHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  student: Student;
  onSuccess: (submission: AssignmentSubmission) => void;
}

export const SubmitHomeworkModal: React.FC<SubmitHomeworkModalProps> = ({
  isOpen,
  onClose,
  assignment,
  student,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [topic, setTopic] = useState(''); // Nhập chủ đề để truyền lại cho cô giáo
  const [contentMode, setContentMode] = useState<'file' | 'text' | 'both'>('file');
  const [content, setContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  } | null>(null);

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!assignment) return null;

  const existingSub = db.getStudentSubmission(assignment.id, student.id);
  const effReceive = db.getEffectiveReceiveStatus(assignment);
  const maxAttempts = assignment.maxAttempts || 3;
  const attemptsUsed = existingSub?.attemptNo || 0;
  const isBlocked =
    effReceive === 'closed' ||
    effReceive === 'withdrawn' ||
    effReceive === 'draft' ||
    effReceive === 'scheduled' ||
    attemptsUsed >= maxAttempts;

  // Check student's effective deadline (includes personal overrides)
  const effectiveDueIso = db.getStudentEffectiveDueDate(assignment, student.id);
  const dueTime = new Date(effectiveDueIso).getTime();
  const nowTime = Date.now();
  const isPastDue = nowTime > dueTime;
  const graceMs = (assignment.allowLateDays || 0) * 86400000;
  const isPastGrace = nowTime > dueTime + graceMs;

  const handleCopyPrompt = () => {
    const textToCopy = assignment.content || assignment.description || assignment.title;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPrompt(true);
    showToast('Đã sao chép đề bài vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownloadTeacherFile = () => {
    // Simulate real download
    const filename = assignment.fileName || `De_Bai_${assignment.subjectName}_${assignment.className}.pdf`;
    const element = document.createElement('a');
    const fileContent = assignment.content || `Nội dung đề bài: ${assignment.title}\nMôn: ${assignment.subjectName}\nLớp: ${assignment.className}\nHạn nộp: ${assignment.dueDate}`;
    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`Đang tải tệp "${filename}" về máy tính...`, 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          size: sizeStr,
          type: ext,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateAttachFile = () => {
    setAttachedFile({
      name: `${student.fullName.replace(/\s+/g, '')}_BaiLam_${assignment.subjectName}.pdf`,
      size: '1.2 MB',
      type: 'pdf',
      dataUrl: '#',
    });
    showToast('Đã đính kèm tệp bài làm PDF thành công!', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (isBlocked) {
      const reason =
        effReceive === 'closed' || effReceive === 'withdrawn'
          ? 'Bài tập đã đóng nhận bài hoặc đã thu hồi.'
          : effReceive === 'draft' || effReceive === 'scheduled'
          ? 'Bài tập chưa đến thời gian mở nhận bài.'
          : `Em đã sử dụng hết ${maxAttempts} lượt nộp cho phép.`;
      setSubmitError(reason);
      showToast(reason, 'error');
      return;
    }

    if (!topic.trim()) {
      showToast('Vui lòng nhập chủ đề bài nộp để truyền lại cho cô giáo!', 'error');
      return;
    }

    if (!attachedFile && !content.trim()) {
      showToast('Vui lòng tải lên tệp bài làm hoặc dán nội dung bài giải!', 'error');
      return;
    }

    try {
      const saved = db.submitAssignment({
        assignmentId: assignment.id,
        studentId: student.id,
        studentName: student.fullName,
        studentCode: student.studentCode,
        topic: topic.trim(),
        content: content.trim() || undefined,
        fileName: attachedFile?.name,
        fileUrl: attachedFile?.dataUrl || '#',
        fileSize: attachedFile?.size,
        status: isPastDue ? 'late' : 'submitted',
      });

      onSuccess(saved);
      onClose();
      showToast(
        '🎉 Đã nộp bài tập thành công! Cô giáo đã nhận được thông báo để kiểm tra và chấm điểm.',
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Không thể nộp bài tập lúc này. Vui lòng thử lại.';
      setSubmitError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nộp bài tập: ${assignment.title}`}
      subtitle={`Môn ${assignment.subjectName} · Lớp ${assignment.className} · Học sinh: ${student.fullName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Phần 1: Xem đề bài của cô giáo */}
        <div className="p-3.5 bg-[#03172c] border border-cyan-800/50 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              Đề bài của cô giáo giao
            </span>

            <div className="flex items-center gap-2">
              {/* 1 là tải file bài tập về */}
              <button
                type="button"
                onClick={handleDownloadTeacherFile}
                className="px-2.5 py-1 bg-cyan-900/70 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Tải tệp bài tập về máy"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file đề bài {assignment.fileName ? `(${assignment.fileName})` : ''}</span>
              </button>

              {/* 2 là copy paste bài tập cô đã giao */}
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-2.5 py-1 bg-[#041d36] hover:bg-[#062c52] text-slate-200 border border-[#0e3d54] rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Sao chép toàn bộ đề bài vào clipboard"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Đã sao chép' : 'Sao chép đề bài'}</span>
              </button>
            </div>
          </div>

          {/* Hiển thị chủ đề nếu có */}
          {assignment.topic && (
            <div className="text-[11px] text-slate-300">
              <span className="text-slate-400">Chủ đề bài học:</span>{' '}
              <span className="font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                {assignment.topic}
              </span>
            </div>
          )}

          {/* Deadline info */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Hạn nộp áp dụng: <strong className="text-white">{new Date(effectiveDueIso).toLocaleString('vi-VN')}</strong>
            </span>
            {(assignment.allowLateDays || 0) > 0 && (
              <span className="text-amber-400 font-semibold">
                (Được phép nộp trễ {assignment.allowLateDays} ngày)
              </span>
            )}
          </div>

          {/* Nội dung đề bài hiển thị */}
          <div className="p-3 bg-[#020e1a] border border-[#0e3d54] rounded-lg max-h-36 overflow-y-auto font-mono text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap">
            {assignment.content || assignment.description}
          </div>
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/70 text-rose-200 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{submitError}</span>
          </div>
        )}

        {isBlocked && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/70 text-rose-200 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <span className="font-bold block">Hiện không thể nộp bài cho nhiệm vụ này</span>
              <span>
                {effReceive === 'closed' || effReceive === 'withdrawn'
                  ? 'Giáo viên đã đóng nhận bài hoặc thu hồi bài tập.'
                  : effReceive === 'draft' || effReceive === 'scheduled'
                  ? 'Bài tập chưa đến thời điểm mở nhận.'
                  : `Em đã sử dụng hết ${attemptsUsed}/${maxAttempts} lượt nộp cho phép.`}
              </span>
            </div>
          </div>
        )}

        {existingSub?.status === 'resubmit_required' && existingSub.resubmitNote && (
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/70 text-amber-200 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold block">Cô giáo yêu cầu nộp lại bài (Lượt {attemptsUsed + 1}/{maxAttempts})</span>
              <span>{existingSub.resubmitNote}</span>
            </div>
          </div>
        )}

        {/* Warning if overdue */}
        {isPastDue && !isBlocked && (
          <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
            isPastGrace
              ? 'bg-rose-950/50 border-rose-700/60 text-rose-200'
              : 'bg-amber-950/50 border-amber-700/60 text-amber-200'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold block">
                {isPastGrace ? 'Đã quá thời gian gia hạn!' : 'Đã quá hạn nộp chính thức!'}
              </span>
              <span>
                {isPastGrace
                  ? 'Bài nộp hiện tại đã vượt quá số ngày cho phép nộp trễ. Hệ thống sẽ ghi nhận nộp quá hạn và thông báo tới phụ huynh.'
                  : `Bài nộp sẽ được ghi nhận là "Nộp muộn" nhưng vẫn trong thời gian gia hạn (${assignment.allowLateDays} ngày).`}
              </span>
            </div>
          </div>
        )}

        {/* Form nộp bài của học sinh */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Ô nhập chủ đề để truyền lại cho cô giáo */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Chủ đề bài nộp (Truyền lại qua cho cô giáo) *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Bài giải chuyên đề Vi-ét & Ứng dụng thực tế - Em Phạm Minh Nhật"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-cyan-300 font-medium focus:border-cyan-400 text-xs"
            />
          </div>

          {/* Chọn phương thức: Dán nội dung HOẶC add file */}
          <div className="border border-[#0e3d54] rounded-xl p-3 bg-[#031526] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#0e3d54]">
              <span className="font-semibold text-white">
                Phương thức nộp bài giải
              </span>
              <div className="flex items-center bg-[#020e1a] p-1 rounded-lg border border-[#0e3d54]">
                <button
                  type="button"
                  onClick={() => setContentMode('file')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    contentMode === 'file'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Đính kèm File
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('text')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    contentMode === 'text'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dán / Copy+Paste
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('both')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    contentMode === 'both'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cả hai
                </button>
              </div>
            </div>

            {/* Đính kèm file bài làm */}
            {(contentMode === 'file' || contentMode === 'both') && (
              <div className="space-y-2">
                <label className="block font-semibold text-slate-300 text-[11px]">
                  Tệp bài làm (PDF, Word, Ảnh chụp bài giải từ điện thoại / máy tính)
                </label>

                {attachedFile ? (
                  <div className="p-2.5 bg-[#041d36] border border-cyan-500/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-300 border border-cyan-800">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{attachedFile.name}</div>
                        <div className="text-[10px] text-cyan-300">
                          {attachedFile.size} · Định dạng: {attachedFile.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#0e3d54] hover:border-cyan-400/70 rounded-xl p-3 text-center bg-[#020e1a]">
                    <Upload className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <p className="text-[11px] text-slate-300 mb-1.5">
                      Tải lên tệp bài làm của em (PDF, DOCX, Ảnh JPG/PNG)
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <label className="px-3 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg font-semibold cursor-pointer shadow-xs">
                        <span>Chọn file từ máy</span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSimulateAttachFile}
                        className="px-2.5 py-1 bg-[#041d36] hover:bg-[#062c52] text-cyan-300 border border-cyan-800 rounded-lg font-semibold cursor-pointer"
                      >
                        + File mẫu bài giải PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dán nội dung copy+paste */}
            {(contentMode === 'text' || contentMode === 'both') && (
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300 text-[11px]">
                  Nội dung bài giải (Copy + Paste hoặc gõ trực tiếp)
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Dán các bước giải, đáp án câu 1, câu 2, câu 3... hoặc ghi chú của em gửi cô giáo tại đây..."
                  className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-mono text-xs focus:border-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Button nộp bài */}
          <div className="pt-2 border-t border-[#0e3d54] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-300 hover:bg-[#06203a] rounded-lg border border-[#0e3d54] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isBlocked}
              className="px-5 py-2 font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-950 flex items-center gap-2 cursor-pointer border border-cyan-400/40 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài cho cô giáo</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
