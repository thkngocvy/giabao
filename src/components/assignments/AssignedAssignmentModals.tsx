import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  History,
  Lock,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  Unlock,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import {
  Assignment,
  AssignmentSubmission,
  Student,
  UserRole,
} from '../../types';
import { formatLatenessDuration, printReportViaHiddenIframe } from './assigned-list/utils';

// Neutralize CSV formula injection (=, +, -, @, tab, cr)
export function sanitizeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  const needsPrefix = /^[=+\-@\t\r]/.test(str);
  const safe = needsPrefix ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function formatDatetimeLocalValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date(Date.now() + 2 * 86400000);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ActorInfo {
  id: string;
  name: string;
  role: UserRole;
}

// =========================================================================
// MOD-01: GIA HẠN HẠN NỘP
// =========================================================================
interface ExtendDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  students: Student[];
  preselectedStudentIds?: string[];
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const ExtendDeadlineModal: React.FC<ExtendDeadlineModalProps> = ({
  isOpen,
  onClose,
  assignment,
  students,
  preselectedStudentIds = [],
  actor,
  onSuccess,
}) => {
  const [scope, setScope] = useState<'all' | 'selected'>(
    preselectedStudentIds.length > 0 ? 'selected' : 'all'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(preselectedStudentIds);
  const [newDueAt, setNewDueAt] = useState<string>(() => {
    const base = new Date(assignment.dueDate).getTime();
    const next = Math.max(base, Date.now()) + 2 * 86400000;
    return formatDatetimeLocalValue(new Date(next).toISOString());
  });
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScope(preselectedStudentIds.length > 0 ? 'selected' : 'all');
      setSelectedIds(preselectedStudentIds);
      const base = new Date(assignment.dueDate).getTime();
      const next = Math.max(base, Date.now()) + 2 * 86400000;
      setNewDueAt(formatDatetimeLocalValue(new Date(next).toISOString()));
      setReason('');
      setError(null);
    }
  }, [isOpen, assignment.id, preselectedStudentIds]);

  const toggleStudent = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (scope === 'selected' && selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 học sinh để gia hạn riêng.');
      return;
    }
    if (!newDueAt || new Date(newDueAt).getTime() <= Date.now()) {
      setError('Hạn nộp mới phải sau thời điểm hiện tại.');
      return;
    }
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      setError('Lý do gia hạn bắt buộc từ 10 đến 500 ký tự.');
      return;
    }

    const res = db.extendAssignmentDeadline({
      assignmentId: assignment.id,
      recipientIds: scope === 'selected' ? selectedIds : undefined,
      newDueAt: new Date(newDueAt).toISOString(),
      reason: trimmedReason,
      expectedVersion: assignment.version || 1,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    onSuccess(
      scope === 'selected'
        ? `Đã gia hạn riêng cho ${selectedIds.length} học sinh.`
        : `Đã gia hạn bài "${assignment.title}" cho toàn lớp ${assignment.className}.`
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gia Hạn Thời Gian Nộp Bài"
      subtitle={`${db.getAssignmentCode(assignment)} · ${assignment.title}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block font-semibold text-[#EAFBFF]">Phạm vi áp dụng</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                scope === 'all'
                  ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#EAFBFF]'
                  : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
              }`}
            >
              <div className="font-bold">Toàn lớp {assignment.className}</div>
              <div className="text-[11px] opacity-80 mt-0.5">Cập nhật hạn chung của bài tập</div>
            </button>
            <button
              type="button"
              onClick={() => setScope('selected')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                scope === 'selected'
                  ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#EAFBFF]'
                  : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
              }`}
            >
              <div className="font-bold">Gia hạn riêng ({selectedIds.length} HS)</div>
              <div className="text-[11px] opacity-80 mt-0.5">Không ảnh hưởng học sinh khác</div>
            </button>
          </div>
        </div>

        {scope === 'selected' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#EAFBFF]">Chọn học sinh gia hạn riêng:</span>
              <span className="text-[11px] text-[#00E5FF] tabular-nums">Đã chọn {selectedIds.length}/{students.length}</span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-[#00E5FF]/20 rounded-xl p-2 bg-[#071525] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {students.map(st => {
                const checked = selectedIds.includes(st.id);
                return (
                  <label
                    key={st.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 text-[#EAFBFF]'
                        : 'border-transparent hover:bg-[#0E253D] text-[#8BA9BC]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudent(st.id)}
                      className="accent-[#00E5FF]"
                    />
                    <span className="truncate font-medium">{st.rollNumber}. {st.fullName}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">
            Hạn nộp mới * <span className="text-[11px] font-normal text-[#8BA9BC]">(Hạn hiện tại: {new Date(assignment.dueDate).toLocaleString('vi-VN')})</span>
          </label>
          <input
            type="datetime-local"
            required
            value={newDueAt}
            onChange={e => setNewDueAt(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF] text-xs"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-[#EAFBFF]">Lý do gia hạn * (10–500 ký tự)</label>
            <span className={`text-[11px] tabular-nums ${reason.trim().length < 10 ? 'text-[#8BA9BC]' : 'text-[#00F5A0]'}`}>
              {reason.trim().length}/500
            </span>
          </div>
          <textarea
            rows={3}
            required
            maxLength={500}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ví dụ: Lớp có lịch kiểm tra tập trung môn Văn nên gia hạn thêm 2 ngày cho học sinh hoàn thiện..."
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF] text-xs"
          />
        </div>

        {/* Lịch sử gia hạn trước đây */}
        {(assignment.events || []).some(ev => ev.eventType === 'EXTEND_DEADLINE') && (
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-1.5 max-h-28 overflow-y-auto">
            <div className="font-semibold text-[#00E5FF] text-[11px] flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử gia hạn trước đó:</span>
            </div>
            {(assignment.events || [])
              .filter(ev => ev.eventType === 'EXTEND_DEADLINE')
              .slice(0, 4)
              .map(ev => (
                <div key={ev.id} className="text-[11px] text-[#8BA9BC] border-t border-[#00E5FF]/10 pt-1">
                  <span className="text-[#EAFBFF]">{ev.summary}</span>{' '}
                  <span className="opacity-75">({new Date(ev.createdAt).toLocaleString('vi-VN')})</span>
                </div>
              ))}
          </div>
        )}

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] hover:text-[#EAFBFF] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Xác nhận gia hạn</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =========================================================================
// MOD-02: NHẮC NỘP BÀI CÓ CHỌN ĐỐI TƯỢNG + ANTI-SPAM
// =========================================================================
interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  students: Student[];
  initialSelectedIds: string[];
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  assignment,
  students,
  initialSelectedIds,
  actor,
  onSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [channel, setChannel] = useState<'app_and_parent' | 'student_only' | 'parent_only'>('app_and_parent');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{ sentCount: number; skippedNames: string[]; parentSkippedCount: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      setChannel('app_and_parent');
      const dueStr = new Date(assignment.dueDate).toLocaleString('vi-VN');
      setMessage(
        `Nhắc nhở em {ten_hoc_sinh} khẩn trương hoàn thành bài tập "${assignment.title}" (Môn ${assignment.subjectName}). Hạn nộp: ${dueStr}.`
      );
      setError(null);
      setResultSummary(null);
    }
  }, [isOpen, assignment.id, initialSelectedIds]);

  const previewStudent = students.find(s => selectedIds.includes(s.id)) || students[0];
  const previewText = message.replace(/\{ten_hoc_sinh\}/g, previewStudent?.fullName || 'Học sinh');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 học sinh.');
      return;
    }
    if (!message.trim() || message.trim().length > 1000) {
      setError('Nội dung nhắc nộp không được để trống và tối đa 1000 ký tự.');
      return;
    }

    const res = db.sendTargetedReminders({
      assignmentId: assignment.id,
      studentIds: selectedIds,
      channel,
      message,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setResultSummary({ sentCount: res.sentCount, skippedNames: res.skippedNames, parentSkippedCount: res.parentSkippedCount });
    if (res.sentCount > 0) {
      onSuccess(
        `Đã gửi nhắc nhở tới ${res.sentCount} đối tượng${res.skippedNames.length > 0 ? ` (bỏ qua ${res.skippedNames.length})` : ''}.`
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gửi Nhắc Nộp Bài Tập"
      subtitle={`${db.getAssignmentCode(assignment)} · ${assignment.title}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSend} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resultSummary && (
          <div className="p-3.5 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/40 text-[#EAFBFF] space-y-1.5">
            <div className="font-bold text-[#00F5A0] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Kết quả gửi thông báo: Đã gửi {resultSummary.sentCount} lượt</span>
            </div>
            {resultSummary.parentSkippedCount > 0 && (
              <div className="text-[11px] text-amber-300">
                Lưu ý: {resultSummary.parentSkippedCount} phụ huynh chưa cấu hình/kích hoạt kênh nhận thông báo nên chỉ gửi qua app học sinh.
              </div>
            )}
            {resultSummary.skippedNames.length > 0 && (
              <div className="text-[11px] text-[#8BA9BC]">
                Đã bỏ qua {resultSummary.skippedNames.length} học sinh (hoàn thành, thiếu cấu hình hoặc vừa nhắc trong 5 phút):{' '}
                <span className="text-amber-300">{resultSummary.skippedNames.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[#EAFBFF]">Danh sách học sinh nhận nhắc ({selectedIds.length} em)</label>
            <button
              type="button"
              onClick={() =>
                setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.id))
              }
              className="text-[11px] text-[#00E5FF] hover:underline cursor-pointer"
            >
              {selectedIds.length === students.length ? 'Bỏ chọn tất cả' : 'Chọn cả lớp'}
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto border border-[#00E5FF]/20 rounded-xl p-2 bg-[#071525] flex flex-wrap gap-1.5">
            {students.map(st => {
              const active = selectedIds.includes(st.id);
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() =>
                    setSelectedIds(prev => (prev.includes(st.id) ? prev.filter(x => x !== st.id) : [...prev, st.id]))
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00E5FF]/15 border-[#00E5FF]/60 text-[#EAFBFF]'
                      : 'bg-[#0A1B2D] border-[#00E5FF]/15 text-[#8BA9BC]'
                  }`}
                >
                  {active ? '✓ ' : ''}{st.fullName}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1.5">Kênh gửi thông báo</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'app_and_parent', label: 'Học sinh & Phụ huynh' },
              { id: 'student_only', label: 'Chỉ Học sinh (App)' },
              { id: 'parent_only', label: 'Chỉ Phụ huynh' },
            ].map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id as any)}
                className={`px-3 py-2 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                  channel === ch.id
                    ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                    : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-[#EAFBFF]">
              Nội dung tin nhắn <span className="text-[11px] font-normal text-[#8BA9BC]">(Dùng {'{ten_hoc_sinh}'} để chèn tên)</span>
            </label>
            <span className="text-[11px] text-[#8BA9BC] tabular-nums">{message.length}/1000</span>
          </div>
          <textarea
            rows={3}
            maxLength={1000}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF] text-xs"
          />
        </div>

        <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-1">
          <div className="text-[11px] font-semibold text-[#00E5FF]">Xem trước tin nhắn thực tế:</div>
          <p className="text-[#EAFBFF] leading-relaxed">{previewText}</p>
        </div>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] hover:text-[#EAFBFF] font-semibold cursor-pointer"
          >
            {resultSummary ? 'Đóng' : 'Hủy'}
          </button>
          <button
            type="submit"
            disabled={selectedIds.length === 0 || !message.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Gửi nhắc nhở ngay</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =========================================================================
// ACT-11 / ACT-12 / MOD-03: XEM BÀI NỘP, CHẤM ĐIỂM & SỬA ĐIỂM CÓ LỊCH SỬ
// =========================================================================
interface SubmissionGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submission: AssignmentSubmission;
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const SubmissionGradingModal: React.FC<SubmissionGradingModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission,
  actor,
  onSuccess,
}) => {
  const maxScore = Number(assignment.points || 10);
  const effGradeStatus = db.getSubmissionEffectiveGradeStatus(submission);
  const isRevising = (effGradeStatus === 'graded' || effGradeStatus === 'published') && submission.score !== undefined;

  const [score, setScore] = useState<string>(submission.score !== undefined ? String(submission.score) : '8.5');
  const [feedback, setFeedback] = useState<string>(submission.feedback || 'Bài làm rõ ràng, trình bày logic.');
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScore(submission.score !== undefined ? String(submission.score) : String(Math.min(maxScore, 8.5)));
      setFeedback(submission.feedback || 'Bài làm rõ ràng, đúng trọng tâm.');
      setRevisionReason('');
      setError(null);
    }
  }, [isOpen, submission.id, submission.version]);

  const handleSave = (targetStatus: 'draft_grade' | 'graded' | 'published') => {
    setError(null);
    const numScore = Number(score);
    if (score.trim() === '' || Number.isNaN(numScore) || numScore < 0 || numScore > maxScore) {
      setError(`Điểm số phải là số hợp lệ từ 0 đến ${maxScore}.`);
      return;
    }
    if (isRevising && revisionReason.trim().length < 5) {
      setError('Bài đã chấm điểm — bắt buộc nhập lý do sửa điểm tối thiểu 5 ký tự.');
      return;
    }

    const res = db.saveSubmissionGrade({
      submissionId: submission.id,
      score: numScore,
      feedback: feedback.trim(),
      gradeStatus: isRevising && effGradeStatus === 'published' ? 'published' : targetStatus,
      revisionReason: isRevising ? revisionReason : undefined,
      expectedVersion: submission.version || 1,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    onSuccess(
      targetStatus === 'draft_grade'
        ? `Đã lưu chấm nháp cho em ${submission.studentName} (điểm chưa công bố).`
        : isRevising
        ? `Đã cập nhật sửa điểm em ${submission.studentName} thành ${numScore}/${maxScore}.`
        : `Đã hoàn tất chấm bài em ${submission.studentName}: ${numScore}/${maxScore}đ.`
    );
    onClose();
  };

  const handleDownloadSubmissionFile = () => {
    const filename = submission.fileName || `BaiLam_${submission.studentName}.txt`;
    if (submission.fileUrl && (submission.fileUrl.startsWith('data:') || submission.fileUrl.startsWith('blob:'))) {
      const a = document.createElement('a');
      a.href = submission.fileUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const body = submission.content || `Bài nộp của học sinh: ${submission.studentName}\nTệp: ${filename}\nNộp lúc: ${submission.submittedAt}`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRevising ? `Sửa Điểm · ${submission.studentName}` : `Xem & Chấm Bài · ${submission.studentName}`}
      subtitle={`${db.getAssignmentCode(assignment)} · Lần nộp #${submission.attemptNo || 1} · Lúc ${new Date(submission.submittedAt).toLocaleString('vi-VN')}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Nội dung bài nộp của học sinh */}
        <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#00E5FF]/15 pb-2">
            <span className="font-bold text-[#00E5FF] flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Bài làm học sinh gửi lên
            </span>
            <span className="text-[11px] text-[#8BA9BC] tabular-nums">
              {submission.status === 'late' ? 'Trạng thái: Nộp muộn' : 'Trạng thái: Đúng hạn'}
            </span>
          </div>

          {submission.topic && (
            <div>
              <span className="text-[#8BA9BC]">Chủ đề bài nộp: </span>
              <strong className="text-[#EAFBFF]">{submission.topic}</strong>
            </div>
          )}

          {submission.fileName && (
            <div className="p-2.5 rounded-lg bg-[#0A1B2D] border border-[#00E5FF]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span className="font-semibold text-[#EAFBFF]">{submission.fileName}</span>
                {submission.fileSize && <span className="text-[#8BA9BC]">({submission.fileSize})</span>}
              </div>
              <button
                type="button"
                onClick={handleDownloadSubmissionFile}
                className="px-2.5 py-1 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF]/40 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Tải tệp</span>
              </button>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#030B16] border border-[#00E5FF]/15 font-mono text-[11.5px] text-[#EAFBFF] max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {submission.content || 'Học sinh nộp bài qua tệp đính kèm.'}
          </div>
        </div>

        {/* Form chấm điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-[#EAFBFF] mb-1">
              Điểm số (0 – {maxScore}) *
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              max={maxScore}
              value={score}
              onChange={e => setScore(e.target.value)}
              className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#00E5FF] font-rajdhani text-lg font-bold tabular-nums"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-[#EAFBFF] mb-1">
              Nhận xét cho học sinh
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Ghi nhận ưu điểm và điểm cần khắc phục..."
              className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF] text-xs"
            />
          </div>
        </div>

        {/* Lý do sửa điểm (bắt buộc khi đã chấm trước đó) */}
        {isRevising && (
          <div>
            <label className="block font-semibold text-amber-300 mb-1">
              Lý do sửa điểm * (Bắt buộc tối thiểu 5 ký tự — lưu lịch sử bất biến)
            </label>
            <input
              type="text"
              value={revisionReason}
              onChange={e => setRevisionReason(e.target.value)}
              placeholder="Ví dụ: Cộng bổ sung 0.5đ phần lập luận câu 3 theo barem..."
              className="w-full px-3 py-2 border border-amber-500/40 rounded-lg bg-[#071525] text-[#EAFBFF] text-xs"
            />
          </div>
        )}

        {/* Lịch sử sửa điểm */}
        {submission.revisions && submission.revisions.length > 0 && (
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
            <div className="font-bold text-[#00E5FF] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử chỉnh sửa điểm ({submission.revisions.length})</span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {submission.revisions.map(rev => (
                <div key={rev.id} className="text-[11px] flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#00E5FF]/10 last:border-0">
                  <div>
                    <span className="font-bold text-[#EAFBFF] tabular-nums">
                      {rev.oldScore ?? '—'} → {rev.newScore}/{maxScore}
                    </span>
                    <span className="text-[#8BA9BC] ml-2">({rev.reason})</span>
                  </div>
                  <span className="text-[#8BA9BC] tabular-nums">
                    {rev.changedBy} · {new Date(rev.changedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#00E5FF]/20 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-[#8BA9BC]">
            Trạng thái điểm hiện tại:{' '}
            <strong className="text-[#00E5FF]">
              {effGradeStatus === 'published'
                ? 'Đã trả bài (Công bố)'
                : effGradeStatus === 'graded'
                ? 'Đã chấm (Chưa trả bài)'
                : effGradeStatus === 'draft_grade'
                ? 'Chấm nháp (Ẩn với HS)'
                : 'Chưa chấm'}
            </strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] hover:text-[#EAFBFF] font-semibold cursor-pointer"
            >
              Đóng
            </button>
            {!isRevising && (
              <button
                type="button"
                onClick={() => handleSave('draft_grade')}
                className="px-3.5 py-2 rounded-xl bg-[#071525] hover:bg-[#0E253D] border border-amber-500/40 text-amber-300 font-bold cursor-pointer"
              >
                Lưu chấm nháp
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSave('graded')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold cursor-pointer hover:brightness-110"
            >
              {isRevising ? 'Lưu sửa điểm' : 'Hoàn tất chấm'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// =========================================================================
// MOD-04: TRẢ BÀI / CÔNG BỐ ĐIỂM
// =========================================================================
interface PublishGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submissions: AssignmentSubmission[];
  targetSubmissionIds?: string[];
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const PublishGradesModal: React.FC<PublishGradesModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submissions,
  targetSubmissionIds,
  actor,
  onSuccess,
}) => {
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scopedSubs = submissions.filter(s => {
    return !targetSubmissionIds || targetSubmissionIds.length === 0 || targetSubmissionIds.includes(s.id);
  });
  const draftGradeSubs = scopedSubs.filter(s => db.getSubmissionEffectiveGradeStatus(s) === 'draft_grade');
  const pendingPublish = scopedSubs.filter(
    s => db.getSubmissionEffectiveGradeStatus(s) === 'graded' && s.score !== undefined
  );
  const alreadyPublished = scopedSubs.filter(
    s => db.getSubmissionEffectiveGradeStatus(s) === 'published' && s.score !== undefined
  );

  useEffect(() => {
    if (isOpen) {
      setNotify(true);
      setError(null);
    }
  }, [isOpen]);

  const handlePublish = () => {
    setError(null);
    if (pendingPublish.length === 0) {
      setError(
        draftGradeSubs.length > 0
          ? `Có ${draftGradeSubs.length} bài đang ở trạng thái "Chấm nháp". Vui lòng bấm "Hoàn tất chấm" trước khi công bố điểm.`
          : 'Không có bài nào ở trạng thái "Đã chấm (chờ trả)" để công bố.'
      );
      return;
    }
    const ids = pendingPublish.map(s => s.id);
    const res = db.publishAssignmentGrades({
      assignmentId: assignment.id,
      submissionIds: ids,
      notify,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSuccess(`Đã trả bài & công bố điểm cho ${res.publishedCount} học sinh.`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trả Bài & Công Bố Điểm"
      subtitle={`${db.getAssignmentCode(assignment)} · ${assignment.title}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] font-medium">
            {error}
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8BA9BC]">Bài đã hoàn tất chấm (sẵn sàng công bố):</span>
            <strong className="text-[#00E5FF] tabular-nums">{pendingPublish.length} bài</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8BA9BC]">Bài đã công bố trước đó:</span>
            <strong className="text-[#00F5A0] tabular-nums">{alreadyPublished.length} bài</strong>
          </div>
          {draftGradeSubs.length > 0 && (
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px]">
              Có <strong>{draftGradeSubs.length}</strong> bài đang &ldquo;Chấm nháp&rdquo; — hệ thống tự động loại khỏi đợt công bố để tránh lộ điểm chưa hoàn tất.
            </div>
          )}
          <p className="text-[11px] text-[#8BA9BC] pt-1 border-t border-[#00E5FF]/15">
            Sau khi trả bài, học sinh và phụ huynh sẽ xem được điểm số và nhận xét chi tiết trên cổng thông tin.
          </p>
        </div>

        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20 cursor-pointer">
          <input
            type="checkbox"
            checked={notify}
            onChange={e => setNotify(e.target.checked)}
            className="accent-[#00E5FF]"
          />
          <span className="text-[#EAFBFF] font-medium">
            Gửi thông báo điểm số tới Học sinh và Phụ huynh ngay khi công bố
          </span>
        </label>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={pendingPublish.length === 0}
            onClick={handlePublish}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00E5FF] text-[#030B16] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Công bố điểm ({pendingPublish.length})
          </button>
        </div>
      </div>
    </Modal>
  );
};

// =========================================================================
// MOD-05: ĐÓNG / MỞ LẠI NHẬN BÀI
// =========================================================================
interface ToggleReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  targetStatus: 'open' | 'closed';
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const ToggleReceivingModal: React.FC<ToggleReceivingModalProps> = ({
  isOpen,
  onClose,
  assignment,
  targetStatus,
  actor,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isClosing = targetStatus === 'closed';

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (reason.trim().length < 5) {
      setError('Vui lòng nhập lý do tối thiểu 5 ký tự.');
      return;
    }

    const res = db.toggleAssignmentReceiving({
      assignmentId: assignment.id,
      targetStatus,
      reason,
      expectedVersion: assignment.version || 1,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }

    onSuccess(isClosing ? `Đã đóng nhận bài "${assignment.title}".` : `Đã mở lại nhận bài "${assignment.title}".`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isClosing ? 'Đóng Nhận Bài Nộp' : 'Mở Lại Nhận Bài Nộp'}
      subtitle={`${db.getAssignmentCode(assignment)} · ${assignment.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] font-medium">
            {error}
          </div>
        )}

        <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
          isClosing ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#EAFBFF]'
        }`}>
          {isClosing ? <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" /> : <Unlock className="w-4 h-4 shrink-0 mt-0.5 text-[#00E5FF]" />}
          <p className="leading-relaxed">
            {isClosing
              ? 'Khi đóng nhận bài, học sinh sẽ bị chặn gửi bài nộp mới hoặc nộp lại; các bài đã nộp và điểm chấm vẫn được giữ nguyên.'
              : 'Khi mở lại, học sinh chưa nộp hoặc được yêu cầu làm lại có thể tiếp tục gửi bài.'}
          </p>
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">
            Lý do {isClosing ? 'đóng nhận bài' : 'mở lại nhận bài'} * (tối thiểu 5 ký tự)
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={isClosing ? 'Ví dụ: Đã chốt danh sách bài nộp để chấm điểm...' : 'Ví dụ: Mở lại cho học sinh nộp bổ sung...'}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF] text-xs"
          />
        </div>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${
              isClosing
                ? 'bg-amber-500 text-[#030B16] hover:brightness-110'
                : 'bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16]'
            }`}
          >
            {isClosing ? 'Xác nhận đóng bài' : 'Xác nhận mở lại'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =========================================================================
// MOD-06: THU HỒI BÀI TẬP (SOFT-DELETE)
// =========================================================================
interface WithdrawAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const WithdrawAssignmentModal: React.FC<WithdrawAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  actor,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setConfirmationText('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = db.withdrawAssignment({
      assignmentId: assignment.id,
      reason,
      confirmationText,
      expectedVersion: assignment.version || 1,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }

    onSuccess(`Đã thu hồi bài tập "${assignment.title}" (dữ liệu bài nộp & điểm được bảo toàn).`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thu Hồi Lượt Giao Bài Tập"
      subtitle={`${db.getAssignmentCode(assignment)} · ${assignment.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] font-medium">
            {error}
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 text-[#EAFBFF] flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-[#FF4D6D]">Thu hồi an toàn (Soft-delete)</div>
            <p className="text-[#8BA9BC] leading-relaxed">
              Bài tập sẽ ẩn khỏi danh sách cần làm của học sinh/phụ huynh và khóa nhận bài mới. Toàn bộ bài nộp thực tế ({db.getAssignmentStats(assignment).submittedCount}), điểm số và lịch sử audit vẫn được giữ nguyên.
            </p>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">Lý do thu hồi * (tối thiểu 5 ký tự)</label>
          <textarea
            rows={2}
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ví dụ: Giao nhầm lớp hoặc thay thế bằng đề ôn tập mới..."
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">
            Gõ <span className="text-[#FF4D6D] font-mono">THU HOI</span> hoặc tên chính xác của bài tập để xác nhận *
          </label>
          <input
            type="text"
            required
            value={confirmationText}
            onChange={e => setConfirmationText(e.target.value)}
            placeholder="THU HOI"
            className="w-full px-3 py-2 border border-[#FF4D6D]/40 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#FF4D6D] hover:brightness-110 text-white font-bold cursor-pointer"
          >
            Xác nhận thu hồi
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =========================================================================
// MOD-07: SAO CHÉP / GIAO LẠI CHO LỚP KHÁC
// =========================================================================
interface DuplicateReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  initialMode: 'duplicate_draft' | 'reassign';
  actor: ActorInfo;
  onSuccess: (newAssignment: Assignment, msg: string) => void;
}

export const DuplicateReassignModal: React.FC<DuplicateReassignModalProps> = ({
  isOpen,
  onClose,
  assignment,
  initialMode,
  actor,
  onSuccess,
}) => {
  const permittedClasses = db.getTeacherPermissions(actor.id, actor.role).classes;
  const [mode, setMode] = useState<'duplicate_draft' | 'reassign'>(initialMode);
  const [targetClassId, setTargetClassId] = useState<string>(
    permittedClasses.find(c => c.id !== assignment.classId)?.id || assignment.classId
  );
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>(() =>
    formatDatetimeLocalValue(new Date(Date.now() + 3 * 86400000).toISOString())
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setTargetClassId(
        initialMode === 'reassign'
          ? permittedClasses.find(c => c.id !== assignment.classId)?.id || assignment.classId
          : assignment.classId
      );
      setNewTitle(initialMode === 'duplicate_draft' ? `[Bản sao] ${assignment.title}` : assignment.title);
      setNewDueDate(formatDatetimeLocalValue(new Date(Date.now() + 3 * 86400000).toISOString()));
      setError(null);
    }
  }, [isOpen, assignment.id, initialMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = db.duplicateOrReassignAssignment({
      sourceAssignmentId: assignment.id,
      mode,
      targetClassId,
      newDueDate: new Date(newDueDate).toISOString(),
      newTitle,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    if (!res.ok) {
      setError(res.error);
      return;
    }

    onSuccess(
      res.assignment,
      mode === 'duplicate_draft'
        ? `Đã sao chép thành bản nháp "${res.assignment.title}" (0 bài nộp/điểm).`
        : `Đã giao lại "${res.assignment.title}" cho lớp ${res.assignment.className}.`
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'duplicate_draft' ? 'Sao Chép Thành Bản Nháp' : 'Giao Lại Bài Tập Cho Lớp Khác'}
      subtitle={`Nguồn: ${db.getAssignmentCode(assignment)} · ${assignment.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('duplicate_draft')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer ${
              mode === 'duplicate_draft'
                ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#EAFBFF]'
                : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Sao chép bản nháp</span>
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">0 bài nộp, chưa gửi HS</div>
          </button>
          <button
            type="button"
            onClick={() => setMode('reassign')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer ${
              mode === 'reassign'
                ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#EAFBFF]'
                : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Giao lại ngay</span>
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">Phát hành & thông báo lớp mới</div>
          </button>
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">
            Lớp học nhận bài * (Theo phân quyền giảng dạy)
          </label>
          <select
            value={targetClassId}
            onChange={e => setTargetClassId(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          >
            {permittedClasses.map(c => (
              <option key={c.id} value={c.id}>
                Lớp {c.name} ({c.studentCount} học sinh)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">Tên bài tập mới</label>
          <input
            type="text"
            required
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">Hạn nộp mới *</label>
          <input
            type="datetime-local"
            required
            value={newDueDate}
            onChange={e => setNewDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold cursor-pointer"
          >
            {mode === 'duplicate_draft' ? 'Tạo bản nháp' : 'Giao lại bài tập'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =========================================================================
// MOD-08: YÊU CẦU HỌC SINH LÀM LẠI
// =========================================================================
interface ResubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submission: AssignmentSubmission;
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const ResubmitRequestModal: React.FC<ResubmitRequestModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission,
  actor,
  onSuccess,
}) => {
  const maxAttempts = assignment.maxAttempts || 3;
  const currentAttempt = submission.attemptNo || 1;
  const [newDueAt, setNewDueAt] = useState<string>(() =>
    formatDatetimeLocalValue(new Date(Date.now() + 2 * 86400000).toISOString())
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewDueAt(formatDatetimeLocalValue(new Date(Date.now() + 2 * 86400000).toISOString()));
      setReason('');
      setError(null);
    }
  }, [isOpen, submission.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = db.requestStudentResubmit({
      assignmentId: assignment.id,
      studentId: submission.studentId,
      newDueAt: new Date(newDueAt).toISOString(),
      reason,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSuccess(`Đã gửi yêu cầu làm lại bài cho em ${submission.studentName}.`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Yêu Cầu Làm Lại · ${submission.studentName}`}
      subtitle={`${db.getAssignmentCode(assignment)} · Lượt hiện tại: ${currentAttempt}/${maxAttempts}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] font-medium">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20 flex items-center justify-between">
          <span className="text-[#8BA9BC]">Số lần làm bài đã dùng:</span>
          <strong className={`tabular-nums ${currentAttempt >= maxAttempts ? 'text-[#FF4D6D]' : 'text-[#00E5FF]'}`}>
            {currentAttempt} / {maxAttempts} lượt
          </strong>
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">Hạn nộp lại mới *</label>
          <input
            type="datetime-local"
            required
            value={newDueAt}
            onChange={e => setNewDueAt(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">Hướng dẫn / Lý do yêu cầu làm lại *</label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ví dụ: Ảnh chụp bài làm bị mờ trang 2, em chụp lại rõ nét và bổ sung lời giải câu 4..."
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={currentAttempt >= maxAttempts}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gửi yêu cầu làm lại</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =========================================================================
// ACT-04: CHỈNH SỬA THÔNG TIN METADATA BÀI TẬP
// =========================================================================
interface EditMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submissionsCount: number;
  actor: ActorInfo;
  onSuccess: (msg: string) => void;
}

export const EditMetadataModal: React.FC<EditMetadataModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submissionsCount,
  actor,
  onSuccess,
}) => {
  const [title, setTitle] = useState(assignment.title);
  const [instructions, setInstructions] = useState(assignment.instructions || assignment.description || '');
  const [allowLateDays, setAllowLateDays] = useState(assignment.allowLateDays || 0);
  const [gradingPolicy, setGradingPolicy] = useState<'latest' | 'highest'>(assignment.gradingPolicy || 'latest');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(assignment.title);
      setInstructions(assignment.instructions || assignment.description || '');
      setAllowLateDays(assignment.allowLateDays || 0);
      setGradingPolicy(assignment.gradingPolicy || 'latest');
      setError(null);
    }
  }, [isOpen, assignment.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = db.updateAssignmentMetadata({
      assignmentId: assignment.id,
      title,
      instructions,
      allowLateDays,
      gradingPolicy,
      expectedVersion: assignment.version || 1,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }

    onSuccess(`Đã cập nhật thông tin bài tập "${res.assignment.title}".`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh Sửa Thông Tin Bài Tập"
      subtitle={`${db.getAssignmentCode(assignment)} · Bảo toàn nguyên vẹn snapshot câu hỏi & bài nộp`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">Tiêu đề bài tập *</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#EAFBFF] mb-1">Hướng dẫn / Ghi chú làm bài</label>
          <textarea
            rows={3}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#EAFBFF] mb-1">Cho phép nộp trễ (ngày)</label>
            <input
              type="number"
              min={0}
              max={30}
              value={allowLateDays}
              onChange={e => setAllowLateDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF] tabular-nums"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#EAFBFF] mb-1">Quy tắc tính điểm nhiều lần</label>
            <select
              value={gradingPolicy}
              disabled={submissionsCount > 0}
              onChange={e => setGradingPolicy(e.target.value as 'latest' | 'highest')}
              className="w-full px-3 py-2 border border-[#00E5FF]/25 rounded-lg bg-[#071525] text-[#EAFBFF] disabled:opacity-50"
            >
              <option value="latest">Lấy điểm lần nộp gần nhất</option>
              <option value="highest">Lấy điểm cao nhất</option>
            </select>
            {submissionsCount > 0 && (
              <p className="text-[10.5px] text-amber-300 mt-1">
                Đã có {submissionsCount} bài nộp nên hệ thống khóa thay đổi quy tắc tính điểm.
              </p>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =========================================================================
// MOD-09: XUẤT BÁO CÁO EXCEL (.XLSX), CSV & IN PDF
// =========================================================================
interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssignment: Assignment | null;
  filteredAssignments: Assignment[];
  selectedStudentIds?: string[];
  actor?: ActorInfo;
  onSuccess: (msg: string) => void;
}

const REPORT_COLUMNS = [
  { key: 'studentCode', label: 'Mã học sinh' },
  { key: 'studentName', label: 'Họ và tên' },
  { key: 'status', label: 'Trạng thái nộp' },
  { key: 'lateness', label: 'Đúng hạn / Nộp muộn' },
  { key: 'submittedAt', label: 'Thời gian nộp' },
  { key: 'score', label: 'Điểm số' },
  { key: 'gradeStatus', label: 'Trạng thái chấm/trả' },
  { key: 'feedback', label: 'Nhận xét giáo viên' },
] as const;

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  selectedAssignment,
  filteredAssignments,
  selectedStudentIds = [],
  actor,
  onSuccess,
}) => {
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [scope, setScope] = useState<'selected_students' | 'current' | 'filtered_list'>(
    selectedStudentIds.length > 0 && selectedAssignment
      ? 'selected_students'
      : selectedAssignment
      ? 'current'
      : 'filtered_list'
  );
  const [selectedCols, setSelectedCols] = useState<string[]>(REPORT_COLUMNS.map(c => c.key));
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScope(
        selectedStudentIds.length > 0 && selectedAssignment
          ? 'selected_students'
          : selectedAssignment
          ? 'current'
          : 'filtered_list'
      );
      setSelectedCols(REPORT_COLUMNS.map(c => c.key));
      setExportError(null);
      setIsExporting(false);
    }
  }, [isOpen, selectedAssignment?.id, selectedStudentIds.length]);

  const toggleCol = (key: string) => {
    setSelectedCols(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const handleExport = () => {
    setExportError(null);
    setIsExporting(true);
    try {
      // RBAC check
      if (actor) {
        if ((scope === 'current' || scope === 'selected_students') && selectedAssignment) {
          const perm = db.checkAssignmentActorPermission(actor.id, actor.role, selectedAssignment.classId);
          if (!perm.ok) {
            setExportError(perm.error);
            setIsExporting(false);
            return;
          }
        }
      }

      const rows: Record<string, string | number>[] = [];

      if ((scope === 'current' || scope === 'selected_students') && selectedAssignment) {
        const allRecipients = db.getAssignmentRecipients(selectedAssignment);
        const students =
          scope === 'selected_students' && selectedStudentIds.length > 0
            ? allRecipients.filter(s => selectedStudentIds.includes(s.id))
            : allRecipients;
        const subs = db.getSubmissions(selectedAssignment.id);

        students.forEach(st => {
          const sub = subs.find(s => s.studentId === st.id);
          const effGrade = db.getSubmissionEffectiveGradeStatus(sub);
          const isVerified = sub?.isTeacherVerified || selectedAssignment.completedStudentIds?.includes(st.id);
          const effDue = db.getStudentEffectiveDueDate(selectedAssignment, st.id);
          const lateness = sub ? formatLatenessDuration(sub.submittedAt, effDue) : null;

          const row: Record<string, string | number> = {};
          if (selectedCols.includes('studentCode')) row['Mã học sinh'] = st.studentCode;
          if (selectedCols.includes('studentName')) row['Họ và tên'] = st.fullName;
          if (selectedCols.includes('status')) {
            row['Trạng thái nộp'] = sub
              ? sub.status === 'resubmit_required'
                ? 'Yêu cầu làm lại'
                : sub.status === 'late' || lateness?.isLate
                ? 'Nộp muộn'
                : 'Đã nộp'
              : isVerified
              ? 'GV đã tick hoàn thành'
              : 'Chưa nộp';
          }
          if (selectedCols.includes('lateness')) {
            row['Đúng hạn / Nộp muộn'] = sub
              ? lateness?.isLate
                ? lateness.label
                : 'Đúng hạn'
              : '—';
          }
          if (selectedCols.includes('submittedAt')) {
            row['Thời gian nộp'] = sub ? new Date(sub.submittedAt).toLocaleString('vi-VN') : '—';
          }
          if (selectedCols.includes('score')) {
            row['Điểm số'] = sub?.score !== undefined ? sub.score : '—';
          }
          if (selectedCols.includes('gradeStatus')) {
            row['Trạng thái chấm/trả'] =
              effGrade === 'published'
                ? 'Đã trả bài'
                : effGrade === 'graded'
                ? 'Đã chấm'
                : effGrade === 'draft_grade'
                ? 'Chấm nháp'
                : 'Chưa chấm';
          }
          if (selectedCols.includes('feedback')) {
            row['Nhận xét giáo viên'] = sub?.feedback || '';
          }
          rows.push(row);
        });
      } else {
        const permittedList = actor
          ? filteredAssignments.filter(a => db.checkAssignmentActorPermission(actor.id, actor.role, a.classId).ok)
          : filteredAssignments;

        permittedList.forEach(asg => {
          const stats = db.getAssignmentStats(asg);
          const subs = db.getSubmissions(asg.id);
          const gradedScores = subs.filter(s => s.score !== undefined).map(s => s.score as number);
          const avg = gradedScores.length > 0
            ? (gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length).toFixed(2)
            : '—';

          rows.push({
            'Mã lượt giao': db.getAssignmentCode(asg),
            'Tên bài tập': asg.title,
            'Lớp': asg.className,
            'Môn học': asg.subjectName,
            'Hạn nộp': new Date(asg.dueDate).toLocaleString('vi-VN'),
            'Đã nộp': `${stats.submittedCount}/${stats.totalRecipients}`,
            'Chờ chấm': stats.ungradedCount,
            'Đã chấm': stats.gradedCount,
            'Điểm TB': avg,
            'Trạng thái nhận': db.getEffectiveReceiveStatus(asg),
          });
        });
      }

      if (rows.length === 0) {
        setExportError('Không có dữ liệu phù hợp để xuất báo cáo.');
        setIsExporting(false);
        return;
      }

      const baseName =
        (scope === 'current' || scope === 'selected_students') && selectedAssignment
          ? `BaoCao_${db.getAssignmentCode(selectedAssignment)}_${selectedAssignment.className}`
          : `DanhSach_BaiTap_DaGiao_${new Date().toISOString().slice(0, 10)}`;

      if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'BaoCao');
        XLSX.writeFile(wb, `${baseName}.xlsx`);
      } else if (format === 'csv') {
        const headers = Object.keys(rows[0]);
        const csvLines = [
          headers.map(sanitizeCsvCell).join(','),
          ...rows.map(r => headers.map(h => sanitizeCsvCell(r[h])).join(',')),
        ];
        const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const headers = Object.keys(rows[0]);
        const matrix = rows.map(r => headers.map(h => r[h] ?? ''));
        printReportViaHiddenIframe({
          title:
            (scope === 'current' || scope === 'selected_students') && selectedAssignment
              ? `Bảng Điểm & Nộp Bài: ${selectedAssignment.title}`
              : 'Tổng Hợp Danh Sách Bài Tập Đã Giao',
          subtitle:
            (scope === 'current' || scope === 'selected_students') && selectedAssignment
              ? `${db.getAssignmentCode(selectedAssignment)} · Lớp ${selectedAssignment.className} · ${selectedAssignment.subjectName}`
              : `Phạm vi lọc: ${rows.length} lượt giao`,
          summaryItems: [
            { label: 'Tổng số dòng', value: `${rows.length}` },
            { label: 'Người xuất', value: actor?.name || 'Giáo viên' },
            { label: 'Định dạng', value: 'PDF / Bản in' },
            { label: 'Trạng thái', value: 'Đã kiểm quyền' },
          ],
          headers,
          rows: matrix,
        });
      }

      onSuccess(`Đã xuất báo cáo ${format.toUpperCase()} (${rows.length} dòng).`);
      onClose();
    } catch (err: any) {
      setExportError(err?.message || 'Xuất báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xuất Báo Cáo Bài Tập"
      subtitle="Hỗ trợ Excel (.xlsx), CSV UTF-8 (chống formula injection) và In/Lưu PDF"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {exportError && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] font-medium">
            {exportError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block font-semibold text-[#EAFBFF]">Phạm vi xuất dữ liệu</label>
          <div className="grid grid-cols-1 gap-2">
            {selectedAssignment && selectedStudentIds.length > 0 && (
              <button
                type="button"
                onClick={() => setScope('selected_students')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  scope === 'selected_students'
                    ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#EAFBFF]'
                    : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
                }`}
              >
                <div className="font-bold">Chỉ {selectedStudentIds.length} học sinh đang tick chọn</div>
                <div className="text-[11px] opacity-80 mt-0.5 truncate">{selectedAssignment.title}</div>
              </button>
            )}
            {selectedAssignment && (
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  scope === 'current'
                    ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#EAFBFF]'
                    : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
                }`}
              >
                <div className="font-bold">Toàn bộ học sinh của bài đang chọn</div>
                <div className="text-[11px] opacity-80 mt-0.5 truncate">{selectedAssignment.title}</div>
              </button>
            )}
            <button
              type="button"
              onClick={() => setScope('filtered_list')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                scope === 'filtered_list'
                  ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#EAFBFF]'
                  : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
              }`}
            >
              <div className="font-bold">Tổng hợp danh sách bài tập theo bộ lọc ({filteredAssignments.length} bài)</div>
              <div className="text-[11px] opacity-80 mt-0.5">Tỷ lệ nộp, số bài chờ chấm, điểm trung bình</div>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block font-semibold text-[#EAFBFF]">Định dạng tệp</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                format === 'xlsx'
                  ? 'border-[#00F5A0] bg-[#00F5A0]/15 text-[#00F5A0]'
                  : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                format === 'csv'
                  ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                  : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                format === 'pdf'
                  ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                  : 'border-[#00E5FF]/20 bg-[#071525] text-[#8BA9BC]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>In / PDF</span>
            </button>
          </div>
        </div>

        {(scope === 'current' || scope === 'selected_students') && (
          <div className="space-y-1.5">
            <label className="block font-semibold text-[#EAFBFF]">Chọn cột dữ liệu xuất</label>
            <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
              {REPORT_COLUMNS.map(col => (
                <label key={col.key} className="flex items-center gap-2 cursor-pointer text-[#EAFBFF]">
                  <input
                    type="checkbox"
                    checked={selectedCols.includes(col.key)}
                    onChange={() => toggleCol(col.key)}
                    className="accent-[#00E5FF]"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#00E5FF]/20 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isExporting || ((scope === 'current' || scope === 'selected_students') && selectedCols.length === 0)}
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Đang xuất...' : format === 'pdf' ? 'Mở bản in PDF' : 'Tải xuống ngay'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

// =========================================================================
// ACT-02 & /reports: BÁO CÁO PHỔ ĐIỂM & NHẬT KÝ THAY ĐỔI BẤT BIẾN
// =========================================================================
interface AssignmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submissions: AssignmentSubmission[];
  onExportClick: () => void;
}

export const AssignmentReportModal: React.FC<AssignmentReportModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submissions,
  onExportClick,
}) => {
  const maxScore = Number(assignment.points || 10);
  const stats = db.getAssignmentStats(assignment);
  const gradedSubs = submissions.filter(s => s.score !== undefined);
  const avgScore =
    gradedSubs.length > 0
      ? (gradedSubs.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSubs.length).toFixed(2)
      : '—';

  const buckets = [
    { label: '0 – 3.9', count: 0, color: '#FF4D6D' },
    { label: '4.0 – 5.4', count: 0, color: '#F59E0B' },
    { label: '5.5 – 6.9', count: 0, color: '#38BDF8' },
    { label: '7.0 – 8.4', count: 0, color: '#00E5FF' },
    { label: '8.5 – 10', count: 0, color: '#00F5A0' },
  ];

  gradedSubs.forEach(s => {
    const normalized = maxScore > 0 ? ((s.score || 0) / maxScore) * 10 : 0;
    if (normalized < 4) buckets[0].count++;
    else if (normalized < 5.5) buckets[1].count++;
    else if (normalized < 7) buckets[2].count++;
    else if (normalized < 8.5) buckets[3].count++;
    else buckets[4].count++;
  });

  const events = assignment.events || [];
  const allRevisions = submissions.flatMap(sub =>
    (sub.revisions || []).map(rev => ({
      id: rev.id,
      studentName: sub.studentName,
      oldScore: rev.oldScore,
      newScore: rev.newScore,
      reason: rev.reason,
      changedBy: rev.changedBy,
      changedAt: rev.changedAt,
    }))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Báo Cáo Chuyên Sâu & Audit Log · ${assignment.title}`}
      subtitle={`${db.getAssignmentCode(assignment)} · Lớp ${assignment.className} · ${assignment.subjectName}`}
      maxWidth="3xl"
    >
      <div className="space-y-5 text-xs">
        {/* Top Metrics (strictly from db.getAssignmentStats) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Tổng sĩ số giao</div>
            <div className="font-rajdhani text-xl font-bold text-[#EAFBFF] mt-0.5 tabular-nums">
              {stats.totalRecipients} HS
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Đã nộp / Nộp muộn</div>
            <div className="font-rajdhani text-xl font-bold text-[#00E5FF] mt-0.5 tabular-nums">
              {stats.submittedCount} / {stats.lateCount}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Đã chấm / Đã trả</div>
            <div className="font-rajdhani text-xl font-bold text-[#00F5A0] mt-0.5 tabular-nums">
              {stats.gradedCount} / {stats.publishedCount}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <div className="text-[11px] text-[#8BA9BC]">Điểm trung bình</div>
            <div className="font-rajdhani text-xl font-bold text-amber-300 mt-0.5 tabular-nums">
              {avgScore} {avgScore !== '—' ? `/ ${maxScore}` : ''}
            </div>
          </div>
        </div>

        {/* Score Histogram */}
        <div className="p-4 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[#EAFBFF] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
              <span>Phổ điểm bài tập (quy đổi thang 10)</span>
            </h4>
            <button
              type="button"
              onClick={onExportClick}
              className="px-3 py-1 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF] font-semibold flex items-center gap-1 cursor-pointer hover:bg-[#00E5FF]/25"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel/CSV</span>
            </button>
          </div>
          {gradedSubs.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-[#8BA9BC] border border-dashed border-[#00E5FF]/20 rounded-lg">
              Chưa có bài nộp nào được chấm điểm để vẽ phổ điểm.
            </div>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets}>
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
                  <Bar dataKey="count" name="Số học sinh" radius={[6, 6, 0, 0]}>
                    {buckets.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Audit Events & Grade Revisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
            <h4 className="font-bold text-[#EAFBFF] flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#00E5FF]" />
              <span>Nhật ký thay đổi lượt giao ({events.length})</span>
            </h4>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {events.length === 0 ? (
                <div className="text-[#8BA9BC]">Chưa phát sinh sự kiện điều chỉnh nào.</div>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className="p-2 rounded-lg bg-[#0A1B2D] border border-[#00E5FF]/15 space-y-0.5">
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
            <h4 className="font-bold text-[#EAFBFF] flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-300" />
              <span>Lịch sử sửa điểm ({allRevisions.length})</span>
            </h4>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {allRevisions.length === 0 ? (
                <div className="text-[#8BA9BC]">Chưa có lần điều chỉnh điểm nào.</div>
              ) : (
                allRevisions.map(rev => (
                  <div key={rev.id} className="p-2 rounded-lg bg-[#0A1B2D] border border-amber-500/25 space-y-0.5">
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
      </div>
    </Modal>
  );
};
