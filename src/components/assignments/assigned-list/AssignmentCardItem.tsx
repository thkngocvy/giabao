import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Copy,
  Edit3,
  Eye,
  History,
  Lock,
  MoreHorizontal,
  Send,
  Tag,
  Trash2,
  Unlock,
} from 'lucide-react';
import { Assignment, UserRole } from '../../../types';
import { db } from '../../../services/db';
import { getAssignmentReceiveDisplayMeta } from './utils';

export type CardMenuAction =
  | 'view_content'
  | 'edit_metadata'
  | 'duplicate_draft'
  | 'reassign'
  | 'extend'
  | 'toggle_receiving'
  | 'history'
  | 'report'
  | 'withdraw';

interface AssignmentCardItemProps {
  assignment: Assignment;
  isSelected: boolean;
  actor: { id: string; role: UserRole };
  onSelect: (asg: Assignment) => void;
  onAction: (asg: Assignment, action: CardMenuAction) => void;
}

export const AssignmentCardItem: React.FC<AssignmentCardItemProps> = ({
  assignment,
  isSelected,
  actor,
  onSelect,
  onAction,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const effReceive = db.getEffectiveReceiveStatus(assignment);
  const receiveMeta = getAssignmentReceiveDisplayMeta(assignment);
  const stats = db.getAssignmentStats(assignment);
  const perm = db.checkAssignmentActorPermission(actor.id, actor.role, assignment.classId);
  const hasManagePerm = perm.ok;
  const dueMs = new Date(assignment.dueDate).getTime();
  const isPastDue = Date.now() > dueMs;
  const progressPct =
    stats.totalRecipients > 0
      ? Math.min(100, Math.round((stats.submittedCount / stats.totalRecipients) * 100))
      : 0;

  const isWithdrawn = effReceive === 'withdrawn';
  const isDraft = effReceive === 'draft';
  const isClosed = effReceive === 'closed';

  const menuItems: {
    key: CardMenuAction;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    disabledReason?: string;
    danger?: boolean;
  }[] = [
    {
      key: 'view_content',
      label: 'Xem nội dung đề bài',
      icon: <Eye className="w-3.5 h-3.5 text-[#00E5FF]" />,
    },
    {
      key: 'edit_metadata',
      label: 'Chỉnh sửa thông tin',
      icon: <Edit3 className="w-3.5 h-3.5 text-[#00E5FF]" />,
      disabled: !hasManagePerm || isWithdrawn,
      disabledReason: !hasManagePerm
        ? 'Không có quyền chỉnh sửa lớp này'
        : isWithdrawn
        ? 'Bài tập đã thu hồi'
        : undefined,
    },
    {
      key: 'duplicate_draft',
      label: 'Sao chép thành bản nháp',
      icon: <Copy className="w-3.5 h-3.5 text-sky-300" />,
      disabled: !hasManagePerm,
      disabledReason: !hasManagePerm ? 'Không có quyền với lớp này' : undefined,
    },
    {
      key: 'reassign',
      label: 'Giao lại cho lớp khác',
      icon: <Send className="w-3.5 h-3.5 text-[#00F5A0]" />,
      disabled: !hasManagePerm,
      disabledReason: !hasManagePerm ? 'Không có quyền giao bài' : undefined,
    },
    {
      key: 'extend',
      label: 'Gia hạn hạn nộp',
      icon: <Clock className="w-3.5 h-3.5 text-amber-300" />,
      disabled: !hasManagePerm || isWithdrawn || isDraft,
      disabledReason: !hasManagePerm
        ? 'Không có quyền'
        : isWithdrawn
        ? 'Bài tập đã thu hồi'
        : isDraft
        ? 'Bản nháp chưa phát hành'
        : undefined,
    },
    {
      key: 'toggle_receiving',
      label: isClosed ? 'Mở lại nhận bài' : 'Đóng nhận bài',
      icon: isClosed ? (
        <Unlock className="w-3.5 h-3.5 text-[#00F5A0]" />
      ) : (
        <Lock className="w-3.5 h-3.5 text-amber-300" />
      ),
      disabled: !hasManagePerm || isWithdrawn || isDraft,
      disabledReason: !hasManagePerm
        ? 'Không có quyền'
        : isWithdrawn
        ? 'Bài tập đã thu hồi'
        : isDraft
        ? 'Bản nháp chưa mở nhận'
        : undefined,
    },
    {
      key: 'history',
      label: 'Lịch sử thay đổi',
      icon: <History className="w-3.5 h-3.5 text-slate-300" />,
    },
    {
      key: 'report',
      label: 'Xem báo cáo & phổ điểm',
      icon: <BarChart3 className="w-3.5 h-3.5 text-[#00E5FF]" />,
    },
    {
      key: 'withdraw',
      label: 'Thu hồi / Lưu trữ',
      icon: <Trash2 className="w-3.5 h-3.5 text-[#FF4D6D]" />,
      danger: true,
      disabled: !hasManagePerm || isWithdrawn,
      disabledReason: !hasManagePerm
        ? 'Không có quyền'
        : isWithdrawn
        ? 'Bài tập đã được thu hồi trước đó'
        : undefined,
    },
  ];

  return (
    <div
      onClick={() => onSelect(assignment)}
      className={`relative p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
        isSelected
          ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[0_0_14px_rgba(0,229,255,0.12)]'
          : 'border-[#0e3d54] bg-[#03172c] hover:bg-[#06203a] hover:border-[#00E5FF]/40'
      }`}
    >
      {/* Top row: Code, Class/Subject, ⋯ menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#020e1a] border border-[#0e3d54] text-[#00E5FF]">
            {db.getAssignmentCode(assignment)}
          </span>
          <span className="font-bold text-cyan-200 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
            Lớp {assignment.className} · {assignment.subjectName}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${receiveMeta.badgeClass}`}>
            {receiveMeta.label}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#020e1a] text-slate-300 border border-[#0e3d54]">
            {assignment.type === 'exam' ? 'Kiểm tra' : 'BTVN'}
          </span>
        </div>

        {/* ⋯ Button */}
        <div ref={menuRef} className="relative shrink-0" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            aria-label={`Thao tác cho ${assignment.title}`}
            onClick={() => setMenuOpen(prev => !prev)}
            className="p-1.5 rounded-lg bg-[#020e1a] hover:bg-[#082c4f] border border-[#0e3d54] hover:border-[#00E5FF]/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 z-40 rounded-xl bg-[#071525] border border-[#00E5FF]/40 shadow-2xl py-1.5">
              {menuItems.map(item => (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  title={item.disabledReason || item.label}
                  onClick={() => {
                    if (item.disabled) return;
                    setMenuOpen(false);
                    onAction(assignment, item.key);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed text-slate-400'
                      : item.danger
                      ? 'text-[#FF4D6D] hover:bg-[#FF4D6D]/15 cursor-pointer font-semibold'
                      : 'text-[#EAFBFF] hover:bg-[#00E5FF]/15 cursor-pointer font-medium'
                  }`}
                >
                  {item.icon}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{item.label}</div>
                    {item.disabled && item.disabledReason && (
                      <div className="text-[10px] text-slate-400 truncate">{item.disabledReason}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title & Topic */}
      <div className="font-bold text-white mt-2 text-sm leading-snug line-clamp-2 flex items-start gap-1.5">
        {(stats.hasCountMismatch || stats.isDraftWithSubmissions) && (
          <span
            className="shrink-0 mt-0.5 text-amber-400"
            title={
              stats.isDraftWithSubmissions
                ? `Cảnh báo: Bản nháp có ${stats.submittedCount} bài nộp`
                : `Bộ đếm cũ (${stats.cachedSubmissionCount}) khác bản ghi thực tế (${stats.submittedCount})`
            }
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        )}
        <span>{assignment.title}</span>
      </div>

      {assignment.topic && (
        <div className="text-[11px] text-cyan-200/80 mt-1 truncate flex items-center gap-1">
          <Tag className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate">{assignment.topic}</span>
        </div>
      )}

      {/* Progress bar computed strictly from actual submission records */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-[#8BA9BC]">
          <span>
            Đã nộp thực tế:{' '}
            <strong className="text-white tabular-nums">
              {stats.submittedCount}/{stats.totalRecipients}
            </strong>{' '}
            <span className="text-[10px]">({progressPct}%)</span>
          </span>
          <span className={`font-semibold tabular-nums ${stats.ungradedCount > 0 ? 'text-amber-300' : 'text-[#00F5A0]'}`}>
            {stats.ungradedCount > 0 ? `Chờ chấm: ${stats.ungradedCount}` : `Đã chấm: ${stats.gradedCount}`}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#020e1a] overflow-hidden border border-[#0e3d54]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00F5A0] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Footer: due date & late/overdue pills */}
      <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-[#0e3d54]/70 flex items-center justify-between gap-2">
        <span className={`flex items-center gap-1 tabular-nums ${isPastDue && !isDraft && !isWithdrawn ? 'text-amber-300 font-semibold' : ''}`}>
          <Clock className="w-3 h-3" />
          Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
        </span>

        <div className="flex items-center gap-2">
          {stats.overdueMissingCount > 0 && (
            <span className="text-[#FF4D6D] font-bold tabular-nums">
              Thiếu quá hạn: {stats.overdueMissingCount}
            </span>
          )}
          {(assignment.allowLateDays || 0) > 0 && (
            <span className="text-amber-300 text-[10px]">Trễ +{assignment.allowLateDays}d</span>
          )}
        </div>
      </div>
    </div>
  );
};
