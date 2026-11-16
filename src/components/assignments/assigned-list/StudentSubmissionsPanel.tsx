import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  History,
  Lock,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  Unlock,
  Users,
} from 'lucide-react';
import {
  Assignment,
  AssignmentSubmission,
  Student,
  StudentTabKey,
  UserRole,
} from '../../../types';
import { db } from '../../../services/db';
import {
  buildStudentRows,
  downloadAssignmentAttachment,
  getAssignmentReceiveDisplayMeta,
  getGradeStatusMeta,
  StudentSubmissionRow,
} from './utils';

interface ActorInfo {
  id: string;
  name: string;
  role: UserRole;
}

interface StudentSubmissionsPanelProps {
  assignment: Assignment | null;
  submissions: AssignmentSubmission[];
  actor: ActorInfo;
  isLoading?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
  selectedStudentIds: string[];
  onChangeSelectedStudentIds: (ids: string[]) => void;
  onOpenContent: () => void;
  onOpenReport: () => void;
  onOpenHistory: () => void;
  onOpenEditMetadata: () => void;
  onOpenToggleReceiving: (target: 'open' | 'closed') => void;
  onOpenExtend: (studentIds?: string[]) => void;
  onOpenPublish: (submissionIds?: string[]) => void;
  onOpenRemind: (studentIds: string[]) => void;
  onOpenExportSelected: (studentIds: string[]) => void;
  onOpenPreviewSubmission: (sub: AssignmentSubmission) => void;
  onOpenGrading: (sub: AssignmentSubmission) => void;
  onOpenRequestResubmit: (sub: AssignmentSubmission) => void;
  onToggleTickCompleted: (studentId: string, currentVerified: boolean) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 6;

export const StudentSubmissionsPanel: React.FC<StudentSubmissionsPanelProps> = ({
  assignment,
  submissions,
  actor,
  isLoading = false,
  loadError = null,
  onRetryLoad,
  selectedStudentIds,
  onChangeSelectedStudentIds,
  onOpenContent,
  onOpenReport,
  onOpenHistory,
  onOpenEditMetadata,
  onOpenToggleReceiving,
  onOpenExtend,
  onOpenPublish,
  onOpenRemind,
  onOpenExportSelected,
  onOpenPreviewSubmission,
  onOpenGrading,
  onOpenRequestResubmit,
  onToggleTickCompleted,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTabKey>('all');
  const [studentQuery, setStudentQuery] = useState('');
  const [page, setPage] = useState(1);

  // Reset pagination & search when switching selected assignment, while keeping activeTab or resetting cleanly
  useEffect(() => {
    setPage(1);
    setStudentQuery('');
    onChangeSelectedStudentIds([]);
  }, [assignment?.id]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, studentQuery]);

  const recipients: Student[] = useMemo(() => {
    if (!assignment) return [];
    return db.getAssignmentRecipients(assignment);
  }, [assignment]);

  const allRows: StudentSubmissionRow[] = useMemo(() => {
    if (!assignment) return [];
    return buildStudentRows(assignment, recipients, submissions);
  }, [assignment, recipients, submissions]);

  const tabCounts = useMemo(() => {
    const submitted = allRows.filter(r => Boolean(r.submission)).length;
    const unsubmitted = allRows.filter(r => !r.submission).length;
    const ungraded = allRows.filter(
      r => Boolean(r.submission) && ['ungraded', 'draft_grade'].includes(r.effectiveGradeStatus)
    ).length;
    const graded = allRows.filter(
      r => Boolean(r.submission) && ['graded', 'published'].includes(r.effectiveGradeStatus)
    ).length;
    const late = allRows.filter(r => Boolean(r.submission) && r.isLate).length;

    return {
      all: allRows.length,
      submitted,
      unsubmitted,
      ungraded,
      graded,
      late,
    };
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    return allRows.filter(row => {
      if (activeTab === 'submitted' && !row.submission) return false;
      if (activeTab === 'unsubmitted' && row.submission) return false;
      if (
        activeTab === 'ungraded' &&
        (!row.submission || !['ungraded', 'draft_grade'].includes(row.effectiveGradeStatus))
      ) {
        return false;
      }
      if (
        activeTab === 'graded' &&
        (!row.submission || !['graded', 'published'].includes(row.effectiveGradeStatus))
      ) {
        return false;
      }
      if (activeTab === 'late' && (!row.submission || !row.isLate)) return false;

      if (q) {
        const matchName = row.student.fullName.toLowerCase().includes(q);
        const matchCode = row.student.studentCode.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [allRows, activeTab, studentQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-[#041527] rounded-2xl border border-[#0e3d54] p-6 space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-[#03172c]" />
        <div className="h-10 rounded-xl bg-[#03172c]" />
        <div className="h-64 rounded-xl bg-[#03172c]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="lg:col-span-2 bg-[#041527] rounded-2xl border border-[#FF4D6D]/50 p-8 text-center text-xs space-y-3">
        <AlertTriangle className="w-8 h-8 text-[#FF4D6D] mx-auto" />
        <div className="font-bold text-[#FF4D6D]">Không thể tải dữ liệu bài nộp</div>
        <p className="text-[#8BA9BC]">{loadError}</p>
        {onRetryLoad && (
          <button
            type="button"
            onClick={onRetryLoad}
            className="px-3.5 py-1.5 rounded-lg bg-[#03172c] hover:bg-[#06284a] border border-[#00E5FF]/40 text-[#00E5FF] font-semibold cursor-pointer"
          >
            Thử tải lại
          </button>
        )}
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="lg:col-span-2 bg-[#041527] rounded-2xl border border-[#0e3d54] p-10 text-center text-xs text-[#8BA9BC] space-y-2">
        <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
        <p>Chọn một bài tập từ danh sách bên trái để xem chi tiết, chấm bài và quản lý học sinh.</p>
      </div>
    );
  }

  const effReceive = db.getEffectiveReceiveStatus(assignment);
  const receiveMeta = getAssignmentReceiveDisplayMeta(assignment);
  const stats = db.getAssignmentStats(assignment);
  const perm = db.checkAssignmentActorPermission(actor.id, actor.role, assignment.classId);
  const canManage = perm.ok;
  const isWithdrawn = effReceive === 'withdrawn';
  const isDraft = effReceive === 'draft';
  const isClosed = effReceive === 'closed';
  const maxScore = Number(assignment.points || 10);
  const maxAttempts = assignment.maxAttempts || 3;

  const selectedRows = allRows.filter(r => selectedStudentIds.includes(r.student.id));
  const selectedPublishableSubmissionIds = selectedRows
    .filter(r => r.submission && r.effectiveGradeStatus === 'graded')
    .map(r => r.submission!.id);
  const allFilteredSelected =
    filteredRows.length > 0 && filteredRows.every(r => selectedStudentIds.includes(r.student.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredRows.map(r => r.student.id));
      onChangeSelectedStudentIds(selectedStudentIds.filter(id => !filteredSet.has(id)));
    } else {
      const merged = Array.from(
        new Set([...selectedStudentIds, ...filteredRows.map(r => r.student.id)])
      );
      onChangeSelectedStudentIds(merged);
    }
  };

  const toggleSelectOne = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      onChangeSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      onChangeSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleDownloadAttachment = () => {
    const res = downloadAssignmentAttachment(assignment, actor);
    if (!res.ok) {
      onToast(res.error, 'error');
      return;
    }
    onToast(`Đang tải tệp "${res.filename}"...`, 'info');
  };

  const tabs: { key: StudentTabKey; label: string; count: number; accent: string }[] = [
    { key: 'all', label: 'Tất cả', count: stats.totalRecipients, accent: 'bg-[#00E5FF] text-[#030B16]' },
    { key: 'submitted', label: 'Đã nộp', count: stats.submittedCount, accent: 'bg-[#087CFF] text-white' },
    { key: 'unsubmitted', label: 'Chưa nộp', count: stats.unsubmittedCount, accent: 'bg-[#FF4D6D] text-white' },
    { key: 'ungraded', label: 'Chưa chấm', count: stats.ungradedCount, accent: 'bg-amber-400 text-[#030B16]' },
    { key: 'graded', label: 'Đã chấm', count: stats.gradedCount, accent: 'bg-[#00F5A0] text-[#030B16]' },
    { key: 'late', label: 'Nộp muộn', count: stats.lateCount, accent: 'bg-orange-400 text-[#030B16]' },
  ];

  const unsubmittedStudentIds = allRows.filter(r => !r.submission).map(r => r.student.id);

  return (
    <div className="lg:col-span-2 bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-sm space-y-4">
      {/* Selected Assignment Header Card (Title & Action Toolbar clearly separated) */}
      <div className="p-4 bg-[#03172c] border border-[#0e3d54] rounded-xl space-y-3">
        {/* Title & Metadata Row */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#020e1a] border border-[#00E5FF]/35 text-[#00E5FF]">
              {db.getAssignmentCode(assignment)}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-700/50">
              {assignment.subjectName} · Lớp {assignment.className}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${receiveMeta.badgeClass}`}>
              {receiveMeta.label}
            </span>
            {assignment.topic && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                Chủ đề: {assignment.topic}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
            {assignment.title}
          </h3>
        </div>

        {/* Dedicated Separated Action Toolbar */}
        <div className="pt-2.5 border-t border-[#0e3d54] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenContent}
              className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-[#00E5FF] border border-[#00E5FF]/35 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem nội dung</span>
            </button>

            <button
              type="button"
              onClick={onOpenReport}
              className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-[#EAFBFF] border border-[#0e3d54] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Phổ điểm</span>
            </button>

            <button
              type="button"
              disabled={!canManage || isWithdrawn || isDraft}
              title={!canManage ? 'Không có quyền' : isWithdrawn || isDraft ? 'Không áp dụng cho trạng thái này' : 'Gia hạn hạn nộp'}
              onClick={() => onOpenExtend()}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700/60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Gia hạn</span>
            </button>

            <button
              type="button"
              disabled={!canManage || stats.gradedCount - stats.publishedCount <= 0}
              title="Trả bài & công bố điểm các bài đã hoàn tất chấm"
              onClick={() => onOpenPublish()}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-[#00F5A0] border border-[#00F5A0]/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trả bài ({Math.max(0, stats.gradedCount - stats.publishedCount)})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={!canManage || isWithdrawn || isDraft}
              onClick={() => onOpenToggleReceiving(isClosed ? 'open' : 'closed')}
              className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-slate-200 border border-[#0e3d54] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isClosed ? <Unlock className="w-3.5 h-3.5 text-[#00F5A0]" /> : <Lock className="w-3.5 h-3.5 text-amber-300" />}
              <span>{isClosed ? 'Mở nhận' : 'Đóng nhận'}</span>
            </button>

            <button
              type="button"
              disabled={!canManage || isWithdrawn}
              onClick={onOpenEditMetadata}
              className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-slate-200 border border-[#0e3d54] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa TT</span>
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-slate-300 border border-[#0e3d54] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Lịch sử thay đổi & gia hạn"
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử</span>
            </button>
          </div>
        </div>

        {/* Status / Overdue-Open / Integrity alerts */}
        {(isDraft || isWithdrawn) && (
          <div className="p-2.5 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 text-xs text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF4D6D] shrink-0" />
            <span>
              {isDraft
                ? 'Bài tập đang ở trạng thái Bản nháp — học sinh chưa nhìn thấy, hệ thống khóa nộp bài và tick xác nhận mới.'
                : `Bài tập đã thu hồi (${assignment.withdrawReason || 'không còn hiệu lực'}) — dữ liệu bài nộp và điểm chấm cũ vẫn được bảo toàn để tra cứu.`}
            </span>
          </div>
        )}

        {receiveMeta.isOverdueOpen && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/45 text-xs text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Bài tập đã <strong>quá hạn nộp</strong> (kể cả thời gian cho trễ) nhưng vẫn đang mở tiếp nhận. Hiện còn{' '}
                <strong className="text-[#FF4D6D]">{stats.overdueMissingCount} học sinh</strong> chưa nộp.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={!canManage}
                onClick={() => onOpenExtend(unsubmittedStudentIds.length > 0 ? unsubmittedStudentIds : undefined)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-semibold text-[11px] cursor-pointer disabled:opacity-40"
              >
                Gia hạn nhóm thiếu
              </button>
              <button
                type="button"
                disabled={!canManage}
                onClick={() => onOpenToggleReceiving('closed')}
                className="px-2.5 py-1 rounded-lg bg-[#041d36] hover:bg-[#062c52] border border-[#0e3d54] text-slate-200 font-semibold text-[11px] cursor-pointer disabled:opacity-40"
              >
                Đóng nhận bài
              </button>
            </div>
          </div>
        )}

        {/* Unified Assignment Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-[#020e1a] rounded-lg border border-[#0e3d54]">
            <span className="text-[10.5px] text-slate-400 block">Hạn nộp lớp</span>
            <span className="font-bold text-cyan-300 tabular-nums">
              {new Date(assignment.dueDate).toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] text-amber-300 block">
              {(assignment.allowLateDays || 0) > 0
                ? `Cho trễ +${assignment.allowLateDays} ngày`
                : 'Không gia hạn trễ tự động'}
            </span>
          </div>

          <div className="p-2.5 bg-[#020e1a] rounded-lg border border-[#0e3d54]">
            <span className="text-[10.5px] text-slate-400 block">Đã nộp thực tế</span>
            <span className="font-bold text-white tabular-nums text-sm">
              {stats.submittedCount} / {stats.totalRecipients} HS
            </span>
            <span className="text-[10px] text-orange-300 block tabular-nums">
              Nộp muộn: {stats.lateCount} · Thiếu quá hạn: {stats.overdueMissingCount}
            </span>
          </div>

          <div className="p-2.5 bg-[#020e1a] rounded-lg border border-[#0e3d54]">
            <span className="text-[10.5px] text-slate-400 block">Chờ chấm điểm</span>
            <span className="font-bold text-amber-300 tabular-nums text-sm">
              {stats.ungradedCount} bài
            </span>
            <span className="text-[10px] text-slate-400 block tabular-nums">
              Trong đó chấm nháp: {stats.draftGradeCount} bài
            </span>
          </div>

          <div className="p-2.5 bg-[#020e1a] rounded-lg border border-[#0e3d54]">
            <span className="text-[10.5px] text-slate-400 block">Đã chấm / Đã trả bài</span>
            <span className="font-bold text-[#00F5A0] tabular-nums text-sm">
              {stats.gradedCount} / {stats.publishedCount} bài
            </span>
            <span className="text-[10px] text-slate-400 block">
              Thang điểm: {maxScore}đ · Tối đa {maxAttempts} lượt
            </span>
          </div>
        </div>

        {/* File / Bank preview strip */}
        {(assignment.fileName || (assignment.selectedQuestions && assignment.selectedQuestions.length > 0)) && (
          <div className="p-2.5 bg-[#020e1a] border border-[#0e3d54] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              {assignment.selectedQuestions && assignment.selectedQuestions.length > 0 && (
                <span className="text-slate-200">
                  <strong className="text-[#00E5FF]">{assignment.selectedQuestions.length} câu hỏi</strong> từ ngân hàng (đã khóa sửa khi có bài nộp)
                </span>
              )}
              {assignment.fileName && (
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Paperclip className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>{assignment.fileName}</span>
                </span>
              )}
            </div>
            {assignment.fileName && (
              <button
                type="button"
                onClick={handleDownloadAttachment}
                className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải đề (kiểm quyền)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6-Tab Student Submissions Workspace */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#0e3d54]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <div>
              <h4 className="font-bold text-white text-sm">
                Danh sách học sinh được giao — Lớp {assignment.className}
              </h4>
              <p className="text-[10.5px] text-[#8BA9BC]">
                Đã chấm ({tabCounts.graded}) ⊂ Đã nộp ({tabCounts.submitted}) · Nộp muộn ({tabCounts.late}) có thể đồng thời Đã chấm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentQuery}
                onChange={e => setStudentQuery(e.target.value)}
                placeholder="Tìm tên / mã học sinh..."
                className="w-full bg-[#020e1a] border border-[#0e3d54] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* 6 Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#03172c] p-1.5 rounded-xl border border-[#0e3d54] text-xs">
          {tabs.map(t => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  isActive ? t.accent : 'text-slate-300 hover:text-white hover:bg-[#062442]'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                    isActive ? 'bg-black/20' : 'bg-[#020e1a] text-[#8BA9BC]'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Select-all & Bulk Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#03172c] border border-[#0e3d54] text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-[#EAFBFF] font-medium">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAllFiltered}
              className="accent-[#00E5FF]"
            />
            <span>
              Chọn tất cả theo bộ lọc ({filteredRows.length} HS)
            </span>
          </label>

          {selectedStudentIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#00E5FF] font-bold mr-1 tabular-nums">
                Đã chọn {selectedStudentIds.length} HS:
              </span>
              <button
                type="button"
                disabled={!canManage || isDraft || isWithdrawn}
                onClick={() => onOpenRemind(selectedStudentIds)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Bell className="w-3 h-3" />
                <span>Nhắc nộp ({selectedStudentIds.length})</span>
              </button>
              <button
                type="button"
                disabled={!canManage || isDraft || isWithdrawn}
                onClick={() => onOpenExtend(selectedStudentIds)}
                className="px-2.5 py-1 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-[#00E5FF] border border-[#00E5FF]/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Clock className="w-3 h-3" />
                <span>Gia hạn ({selectedStudentIds.length})</span>
              </button>
              <button
                type="button"
                disabled={!canManage || selectedPublishableSubmissionIds.length === 0}
                title="Chỉ trả bài được cho các em đã hoàn tất chấm điểm"
                onClick={() => onOpenPublish(selectedPublishableSubmissionIds)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-[#00F5A0] border border-[#00F5A0]/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
                <span>Trả bài ({selectedPublishableSubmissionIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenExportSelected(selectedStudentIds)}
                className="px-2.5 py-1 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-slate-200 border border-[#0e3d54] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Xuất DS ({selectedStudentIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeSelectedStudentIds([])}
                className="px-2 py-1 text-slate-400 hover:text-white cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={!canManage || isDraft || isWithdrawn || unsubmittedStudentIds.length === 0}
                onClick={() => onOpenExtend(unsubmittedStudentIds)}
                className="px-2.5 py-1 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-[#00E5FF] border border-[#00E5FF]/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Clock className="w-3 h-3" />
                <span>Gia hạn riêng chưa nộp ({stats.unsubmittedCount})</span>
              </button>
              <button
                type="button"
                disabled={!canManage || isDraft || isWithdrawn}
                onClick={() => {
                  if (unsubmittedStudentIds.length === 0) {
                    onToast('Tất cả học sinh được giao đã nộp bài.', 'info');
                    return;
                  }
                  onOpenRemind(unsubmittedStudentIds);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700/60 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Bell className="w-3 h-3" />
                <span>Nhắc chưa nộp ({stats.unsubmittedCount})</span>
              </button>
              {activeTab === 'unsubmitted' && unsubmittedStudentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenExportSelected(unsubmittedStudentIds)}
                  className="px-2.5 py-1 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-slate-200 border border-[#0e3d54] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Xuất DS chưa nộp</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Student Rows List */}
        {pagedRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-[#0e3d54] rounded-xl space-y-2">
            <Users className="w-7 h-7 text-slate-500 mx-auto" />
            <p>Không có học sinh nào khớp với tab hoặc từ khóa tìm kiếm hiện tại.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pagedRows.map(row => {
              const { student, submission } = row;
              const checked = selectedStudentIds.includes(student.id);
              const gradeMeta = getGradeStatusMeta(row.effectiveGradeStatus);
              const canResubmit =
                Boolean(submission) &&
                !isClosed &&
                !isWithdrawn &&
                !isDraft &&
                (submission!.attemptNo || 1) < maxAttempts;

              return (
                <div
                  key={student.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    checked
                      ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                      : row.isVerified
                      ? 'border-emerald-700/60 bg-emerald-950/20'
                      : submission
                      ? 'border-cyan-700/50 bg-[#03172c]'
                      : row.isOverdueMissing
                      ? 'border-[#FF4D6D]/50 bg-[#FF4D6D]/5'
                      : 'border-[#0e3d54] bg-[#020e1a]/80'
                  }`}
                >
                  {/* Left: checkbox + avatar + details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelectOne(student.id)}
                      className="mt-1.5 accent-[#00E5FF] cursor-pointer shrink-0"
                    />
                    <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 mt-0.5 tabular-nums">
                      {student.rollNumber}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm">{student.fullName}</span>
                        <span className="text-[11px] text-slate-400">({student.studentCode})</span>

                        {submission ? (
                          <span
                            className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${
                              submission.status === 'resubmit_required'
                                ? 'bg-amber-950 text-amber-300 border-amber-600'
                                : row.isLate
                                ? 'bg-orange-950 text-orange-300 border-orange-600'
                                : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                            }`}
                          >
                            {submission.status === 'resubmit_required'
                              ? 'Yêu cầu làm lại'
                              : row.isLate
                              ? row.latenessLabel
                              : 'Nộp đúng hạn'}
                          </span>
                        ) : (
                          <span
                            className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${
                              row.isOverdueMissing
                                ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/50'
                                : 'bg-slate-900 text-slate-400 border-slate-700'
                            }`}
                          >
                            {row.isOverdueMissing ? 'Chưa nộp (Quá hạn)' : 'Chưa nộp'}
                          </span>
                        )}

                        {submission && (
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${gradeMeta.badgeClass}`}>
                            {gradeMeta.label}
                          </span>
                        )}

                        {submission?.score !== undefined && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-950 text-[#00E5FF] border border-[#00E5FF]/40 tabular-nums">
                            {submission.score}/{maxScore} điểm
                          </span>
                        )}

                        {row.hasCustomDueOverride && (
                          <span
                            className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700"
                            title={`Hạn riêng: ${new Date(row.effectiveDueAt).toLocaleString('vi-VN')}`}
                          >
                            Gia hạn riêng: {new Date(row.effectiveDueAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      {submission ? (
                        <div className="text-[11px] text-slate-300 space-y-0.5">
                          <div className="text-slate-400 tabular-nums">
                            Nộp lúc: <strong className="text-slate-200">{new Date(submission.submittedAt).toLocaleString('vi-VN')}</strong>
                            {' · '}Lượt #{submission.attemptNo || 1}/{maxAttempts}
                            {submission.fileName && (
                              <span>
                                {' · '}Tệp: <strong className="text-white">{submission.fileName}</strong>
                              </span>
                            )}
                          </div>
                          {submission.resubmitNote && (
                            <div className="text-amber-300 text-[11px]">
                              Ghi chú làm lại: {submission.resubmitNote}
                            </div>
                          )}
                          {submission.content && (
                            <div className="italic text-slate-300 bg-[#020e1a] p-1.5 rounded border border-[#0e3d54] text-[11px] line-clamp-2">
                              &ldquo;{submission.content}&rdquo;
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 space-y-0.5">
                          <div>
                            Hạn áp dụng: <strong className="text-slate-300 tabular-nums">{new Date(row.effectiveDueAt).toLocaleString('vi-VN')}</strong>
                            {' · '}PH: {student.parentName || 'Chưa liên kết'} ({student.parentAppStatus === 'not_registered' ? 'Chưa kích hoạt app' : student.parentPhone || '—'})
                          </div>
                          {row.hasCustomDueOverride && assignment.recipientOverrides?.[student.id]?.reason && (
                            <div className="text-indigo-300">
                              Lý do gia hạn riêng: {assignment.recipientOverrides[student.id].reason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons (differentiated for Submitted vs Unsubmitted) */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {submission ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenPreviewSubmission(submission)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-[#00E5FF] border border-[#00E5FF]/35 font-semibold flex items-center gap-1 cursor-pointer"
                          title="Xem nội dung và tệp bài làm học sinh đã nộp"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem bài</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => onOpenGrading(submission)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold cursor-pointer hover:brightness-110 disabled:opacity-40"
                        >
                          {submission.score !== undefined && ['graded', 'published'].includes(row.effectiveGradeStatus)
                            ? 'Sửa điểm'
                            : 'Chấm bài'}
                        </button>

                        <button
                          type="button"
                          disabled={!canManage || !canResubmit}
                          title={
                            !canResubmit
                              ? `Không thể yêu cầu làm lại (hết ${maxAttempts} lượt hoặc bài đã đóng/nháp/thu hồi)`
                              : 'Yêu cầu học sinh làm lại & gia hạn riêng'
                          }
                          onClick={() => onOpenRequestResubmit(submission)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Làm lại</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canManage || isDraft || isWithdrawn}
                          title={
                            isDraft || isWithdrawn
                              ? 'Không thể tick hoàn thành khi bài là Bản nháp hoặc Đã thu hồi'
                              : row.isVerified
                              ? 'Bấm để hủy tick xác nhận'
                              : 'Tick xác nhận đã hoàn thành'
                          }
                          onClick={() => onToggleTickCompleted(student.id, row.isVerified)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            row.isVerified
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                              : 'bg-[#03172c] hover:bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{row.isVerified ? '✓ Đã tick' : 'Tick'}</span>
                        </button>

                        {!row.isVerified && (
                          <button
                            type="button"
                            disabled={!canManage || isDraft || isWithdrawn}
                            onClick={() => onOpenRemind([student.id])}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            title="Nhắc nộp lại học sinh & phụ huynh"
                          >
                            <Bell className="w-3 h-3" />
                            <span>Nhắc</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Dedicated actions specifically for unsubmitted students */}
                        <button
                          type="button"
                          disabled={!canManage || isDraft || isWithdrawn}
                          onClick={() => onOpenExtend([student.id])}
                          className="px-2.5 py-1.5 rounded-lg bg-[#041d36] hover:bg-[#062c52] text-[#00E5FF] border border-[#00E5FF]/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Gia hạn hạn nộp riêng cho học sinh này"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Gia hạn riêng</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canManage || isDraft || isWithdrawn}
                          onClick={() => onOpenRemind([student.id])}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Gửi nhắc nộp riêng tới học sinh & phụ huynh"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Nhắc nộp</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canManage || isDraft || isWithdrawn}
                          title={
                            isDraft || isWithdrawn
                              ? 'Không thể xác nhận với Bản nháp hoặc Đã thu hồi'
                              : 'Xác nhận học sinh đã nộp trực tiếp / hoàn thành ngoại tuyến'
                          }
                          onClick={() => onToggleTickCompleted(student.id, row.isVerified)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#03172c] hover:bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã làm</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredRows.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2 border-t border-[#0e3d54] text-xs text-[#8BA9BC]">
            <span className="tabular-nums">
              Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} / {filteredRows.length} học sinh
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-[#00E5FF] tabular-nums">
                Trang {safePage}/{totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
