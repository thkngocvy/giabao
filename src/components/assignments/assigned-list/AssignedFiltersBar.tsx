import React from 'react';
import { ArrowUpDown, RotateCcw, Search } from 'lucide-react';
import { Classroom } from '../../../types';

export type AssignmentSortKey =
  | 'due_asc'
  | 'due_desc'
  | 'created_desc'
  | 'sub_rate_asc'
  | 'sub_rate_desc'
  | 'ungraded_desc';

export type TimeRangeFilter = 'all' | '7d' | '30d' | 'overdue';

interface AssignedFiltersBarProps {
  classes: Classroom[];
  subjects: string[];
  classFilter: string;
  setClassFilter: (val: string) => void;
  subjectFilter: string;
  setSubjectFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  timeFilter: TimeRangeFilter;
  setTimeFilter: (val: TimeRangeFilter) => void;
  sortBy: AssignmentSortKey;
  setSortBy: (val: AssignmentSortKey) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const AssignedFiltersBar: React.FC<AssignedFiltersBarProps> = ({
  classes,
  subjects,
  classFilter,
  setClassFilter,
  subjectFilter,
  setSubjectFilter,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  timeFilter,
  setTimeFilter,
  sortBy,
  setSortBy,
  searchTerm,
  setSearchTerm,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-[#041527] rounded-xl border border-[#0e3d54] p-3 space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            aria-label="Lọc theo lớp"
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-semibold focus:border-cyan-400"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Lớp {c.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo môn học"
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-semibold focus:border-cyan-400"
          >
            <option value="all">Tất cả môn học</option>
            {subjects.map(subj => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-semibold focus:border-cyan-400"
          >
            <option value="all">Mọi trạng thái nhận</option>
            <option value="open">Đang nhận bài</option>
            <option value="overdue_open">Quá hạn (vẫn mở nhận)</option>
            <option value="scheduled">Lên lịch mở</option>
            <option value="closed">Đã đóng nhận</option>
            <option value="draft">Bản nháp</option>
            <option value="withdrawn">Đã thu hồi</option>
          </select>

          <select
            aria-label="Lọc theo loại bài"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-semibold focus:border-cyan-400"
          >
            <option value="all">Tất cả loại bài</option>
            <option value="homework">Bài tập về nhà (BTVN)</option>
            <option value="exam">Bài kiểm tra</option>
          </select>

          <select
            aria-label="Lọc theo thời gian"
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value as TimeRangeFilter)}
            className="px-2.5 py-1.5 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-semibold focus:border-cyan-400"
          >
            <option value="all">Mọi thời gian</option>
            <option value="7d">7 ngày gần nhất</option>
            <option value="30d">30 ngày gần nhất</option>
            <option value="overdue">Đang quá hạn</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-[#020e1a] border border-[#0e3d54] rounded-lg px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#00E5FF]" />
            <select
              aria-label="Sắp xếp bài tập"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as AssignmentSortKey)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="created_desc" className="bg-[#020e1a]">Mới giao nhất</option>
              <option value="due_asc" className="bg-[#020e1a]">Hạn nộp gần nhất</option>
              <option value="due_desc" className="bg-[#020e1a]">Hạn nộp xa nhất</option>
              <option value="ungraded_desc" className="bg-[#020e1a]">Chờ chấm nhiều nhất</option>
              <option value="sub_rate_asc" className="bg-[#020e1a]">Tỷ lệ nộp thấp → cao</option>
              <option value="sub_rate_desc" className="bg-[#020e1a]">Tỷ lệ nộp cao → thấp</option>
            </select>
          </div>

          <div className="relative flex-1 sm:w-60 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên, mã BT-, chủ đề..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#020e1a] border border-[#0e3d54] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-lg bg-[#03172c] hover:bg-[#06284a] border border-[#0e3d54] text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
