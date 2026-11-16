import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Assignment } from '../../../types';
import { db } from '../../../services/db';
import { getAssignmentReceiveDisplayMeta } from './utils';

interface AssignedKpiBarProps {
  assignments: Assignment[];
  scopeLabel: string;
  onOpenOverviewReport: () => void;
  onOpenExportModal: () => void;
  onReconcileCounts?: () => void;
}

export const AssignedKpiBar: React.FC<AssignedKpiBarProps> = ({
  assignments,
  scopeLabel,
  onOpenOverviewReport,
  onOpenExportModal,
  onReconcileCounts,
}) => {
  let activeReceivingCount = 0;
  let overdueOpenCount = 0;
  let draftCount = 0;
  let withdrawnCount = 0;
  let overdueMissingStudentsTotal = 0;
  let overdueAssignmentsCount = 0;
  let pendingGradingSubmissionsTotal = 0;
  let totalSubmittedAll = 0;
  let totalRecipientsAll = 0;
  let hasStaleCacheMismatch = false;
  const anomalyMessages: string[] = [];

  assignments.forEach(asg => {
    const eff = db.getEffectiveReceiveStatus(asg);
    const displayMeta = getAssignmentReceiveDisplayMeta(asg);
    const stats = db.getAssignmentStats(asg);

    if (eff === 'open') {
      activeReceivingCount++;
      if (displayMeta.isOverdueOpen) overdueOpenCount++;
    }
    if (eff === 'draft') draftCount++;
    if (eff === 'withdrawn') withdrawnCount++;

    if (stats.overdueMissingCount > 0) {
      overdueAssignmentsCount++;
      overdueMissingStudentsTotal += stats.overdueMissingCount;
    }

    pendingGradingSubmissionsTotal += stats.ungradedCount;
    if (eff !== 'draft' && eff !== 'withdrawn') {
      totalSubmittedAll += stats.submittedCount;
      totalRecipientsAll += stats.totalRecipients;
    }

    if (stats.isDraftWithSubmissions) {
      anomalyMessages.push(
        `Bản nháp "${asg.title}" đang có ${stats.submittedCount} bản ghi bài nộp (đã khóa nộp mới và giữ nguyên để kiểm tra).`
      );
    } else if (stats.hasCountMismatch) {
      hasStaleCacheMismatch = true;
      anomalyMessages.push(
        `"${asg.title}": bộ đếm cũ ghi ${stats.cachedSubmissionCount}/${stats.totalRecipients} nhưng thực tế có ${stats.submittedCount} bài nộp — KPI, thẻ & tab đã đồng bộ theo ${stats.submittedCount} bản ghi thực tế.`
      );
    }
  });

  const overallSubmissionRate =
    totalRecipientsAll > 0 ? Math.round((totalSubmittedAll / totalRecipientsAll) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Header action strip with explicit scope */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#8BA9BC]">
          <span className="px-2 py-0.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] font-semibold">
            Phạm vi KPI: {scopeLabel}
          </span>
          <span className="hidden sm:inline text-[11px]">
            (Đã chấm ⊂ Đã nộp · Không cộng dồn các tab để tính tổng)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenOverviewReport}
            className="px-3 py-1.5 rounded-lg bg-[#03172c] hover:bg-[#06284a] border border-[#00E5FF]/35 text-[#00E5FF] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Báo cáo & Thống kê</span>
          </button>
          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-3 py-1.5 rounded-lg bg-[#03172c] hover:bg-[#06284a] border border-[#00F5A0]/35 text-[#00F5A0] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel / CSV / PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Standardized KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#041527] border border-[#0e3d54] hover:border-[#00E5FF]/40 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#8BA9BC]">
            <span>Tổng lượt giao</span>
            <Layers className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="font-rajdhani text-2xl font-bold text-[#EAFBFF] mt-1 tabular-nums">
            {assignments.length}{' '}
            <span className="text-xs font-sans font-normal text-[#8BA9BC]">lượt giao</span>
          </div>
          <div className="text-[11px] text-[#8BA9BC] mt-0.5 tabular-nums">
            Nháp: {draftCount} · Thu hồi: {withdrawnCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#041527] border border-[#0e3d54] hover:border-[#00F5A0]/40 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#8BA9BC]">
            <span>Lượt đang mở nhận</span>
            <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />
          </div>
          <div className="font-rajdhani text-2xl font-bold text-[#00F5A0] mt-1 tabular-nums">
            {activeReceivingCount}{' '}
            <span className="text-xs font-sans font-normal text-[#8BA9BC]">lượt mở</span>
          </div>
          <div className="text-[11px] text-[#8BA9BC] mt-0.5 tabular-nums flex items-center justify-between gap-1 flex-wrap">
            <span>
              Tỷ lệ nộp: <strong className="text-[#EAFBFF]">{overallSubmissionRate}%</strong> ({totalSubmittedAll}/{totalRecipientsAll})
            </span>
            {overdueOpenCount > 0 && (
              <span className="text-rose-300 font-semibold">
                {overdueOpenCount} quá hạn vẫn mở
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#041527] border border-[#0e3d54] hover:border-[#FF4D6D]/40 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#8BA9BC]">
            <span>Quá hạn còn thiếu</span>
            <Clock className="w-4 h-4 text-[#FF4D6D]" />
          </div>
          <div className="font-rajdhani text-2xl font-bold text-[#FF4D6D] mt-1 tabular-nums">
            {overdueMissingStudentsTotal}{' '}
            <span className="text-xs font-sans font-normal text-[#8BA9BC]">lượt HS</span>
          </div>
          <div className="text-[11px] text-[#8BA9BC] mt-0.5 tabular-nums">
            Tại {overdueAssignmentsCount} lượt giao (đã tính gia hạn riêng)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#041527] border border-[#0e3d54] hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-[#8BA9BC]">
            <span>Bài nộp chờ chấm</span>
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-rajdhani text-2xl font-bold text-amber-300 mt-1 tabular-nums">
            {pendingGradingSubmissionsTotal}{' '}
            <span className="text-xs font-sans font-normal text-[#8BA9BC]">bài nộp</span>
          </div>
          <div className="text-[11px] text-[#8BA9BC] mt-0.5">
            Gồm bài chưa chấm & chấm nháp
          </div>
        </div>
      </div>

      {/* Data Integrity Notification Banner (never hides anomalies) */}
      {anomalyMessages.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-amber-300">
                Kiểm tra toàn vẹn dữ liệu ({anomalyMessages.length} cảnh báo):
              </div>
              {anomalyMessages.map((msg, i) => (
                <div key={i} className="text-[11px] leading-relaxed">
                  • {msg}
                </div>
              ))}
            </div>
          </div>
          {hasStaleCacheMismatch && onReconcileCounts && (
            <button
              type="button"
              onClick={onReconcileCounts}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
            >
              Đồng bộ bộ đếm cache
            </button>
          )}
        </div>
      )}
    </div>
  );
};
