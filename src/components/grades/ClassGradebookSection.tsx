import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Save,
  Download,
  Filter,
  Search,
  Award,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  HelpCircle,
  Check,
  ChevronDown,
  User,
  Zap,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../services/db';
import { Classroom, Student, StudentGradeRecord } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

interface ClassGradebookSectionProps {
  classId: string;
  classNameProp?: string;
  isStandalone?: boolean;
}

export const SUBJECTS_LIST = [
  { id: 'sub_math', name: 'Toán học' },
  { id: 'sub_lit', name: 'Ngữ văn' },
  { id: 'sub_eng', name: 'Tiếng Anh' },
  { id: 'sub_phys', name: 'Vật lý' },
  { id: 'sub_chem', name: 'Hóa học' },
  { id: 'sub_bio', name: 'Sinh học' },
  { id: 'sub_hist', name: 'Lịch sử & Địa lý' },
  { id: 'sub_it', name: 'Tin học' },
  { id: 'sub_gdcd', name: 'Giáo dục công dân' },
  { id: 'sub_tech', name: 'Công nghệ' },
];

export const calculateStudentAverage = (gr: Partial<StudentGradeRecord>): number | undefined => {
  const txScores = [gr.oral1, gr.oral2, gr.test15m1, gr.test15m2].filter(
    (s): s is number => s !== undefined && s !== null && !isNaN(s)
  );
  const mid = gr.midterm !== undefined && !isNaN(gr.midterm) ? gr.midterm : undefined;
  const fin = gr.finalTerm !== undefined && !isNaN(gr.finalTerm) ? gr.finalTerm : undefined;

  let totalScore = txScores.reduce((acc, curr) => acc + curr, 0);
  let totalWeight = txScores.length;

  if (mid !== undefined) {
    totalScore += mid * 2;
    totalWeight += 2;
  }
  if (fin !== undefined) {
    totalScore += fin * 3;
    totalWeight += 3;
  }

  if (totalWeight === 0) return undefined;
  return parseFloat((totalScore / totalWeight).toFixed(1));
};

export const getClassification = (avg?: number): { label: string; badgeBg: string; textClass: string } => {
  if (avg === undefined || isNaN(avg)) {
    return { label: 'Chưa đủ điểm', badgeBg: 'bg-slate-800 text-slate-400 border border-slate-700', textClass: 'text-slate-400' };
  }
  if (avg >= 8.0) {
    return { label: 'Giỏi (Tốt)', badgeBg: 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300', textClass: 'text-emerald-400' };
  }
  if (avg >= 6.5) {
    return { label: 'Khá', badgeBg: 'bg-sky-950/80 border border-sky-600/60 text-sky-300', textClass: 'text-sky-400' };
  }
  if (avg >= 5.0) {
    return { label: 'Đạt (TB)', badgeBg: 'bg-amber-950/80 border border-amber-600/60 text-amber-300', textClass: 'text-amber-400' };
  }
  return { label: 'Chưa đạt', badgeBg: 'bg-rose-950/80 border border-rose-600/60 text-rose-300', textClass: 'text-rose-400' };
};

export const ClassGradebookSection: React.FC<ClassGradebookSectionProps> = ({
  classId,
  classNameProp,
  isStandalone = false
}) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [currentClass, setCurrentClass] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('sub_math');
  const [semester, setSemester] = useState<1 | 2>(2);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<'all' | 'gioi' | 'kha' | 'dat' | 'chuadat' | 'thieu'>('all');

  const [gradeRecords, setGradeRecords] = useState<StudentGradeRecord[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [quickFillColumn, setQuickFillColumn] = useState<keyof StudentGradeRecord | ''>('');
  const [quickFillValue, setQuickFillValue] = useState('');
  const [showQuickFillModal, setShowQuickFillModal] = useState(false);

  // Load class & students
  useEffect(() => {
    const cls = db.getClassById(classId);
    if (cls) {
      setCurrentClass(cls);
    }
    const stdList = db.getStudents(classId);
    setStudents(stdList);
  }, [classId]);

  // Load grades from db for selected class, semester and subject
  useEffect(() => {
    const rawGrades = db.getGrades(classId, semester);
    // Filter or adjust for subject
    const subjectGrades = rawGrades.filter(g => (g.subjectId || 'sub_math') === selectedSubjectId);

    // Make sure all students have a record
    const stdList = db.getStudents(classId);
    const existingMap = new Map(subjectGrades.map(g => [g.studentId, g]));

    const merged: StudentGradeRecord[] = stdList.map((st, idx) => {
      const exist = existingMap.get(st.id);
      if (exist) {
        // compute fresh average if missing or recalculate
        const avg = calculateStudentAverage(exist);
        return { ...exist, averageScore: avg ?? exist.averageScore };
      }
      return {
        id: `gr_${st.id}_${selectedSubjectId}_s${semester}`,
        studentId: st.id,
        studentName: st.fullName,
        studentCode: st.studentCode || `HS-TV2024-${String(idx + 1).padStart(3, '0')}`,
        classId,
        subjectId: selectedSubjectId,
        semester,
      };
    });

    setGradeRecords(merged);
    setIsDirty(false);
  }, [classId, semester, selectedSubjectId, students.length]);

  // Handle cell input change
  const handleCellChange = (
    studentId: string,
    field: 'oral1' | 'oral2' | 'test15m1' | 'test15m2' | 'midterm' | 'finalTerm' | 'note',
    rawVal: string
  ) => {
    setGradeRecords(prev =>
      prev.map(item => {
        if (item.studentId !== studentId) return item;

        if (field === 'note') {
          return { ...item, note: rawVal };
        }

        // Numerical scores
        let parsedVal: number | undefined = undefined;
        if (rawVal.trim() !== '') {
          // Replace comma with dot
          const normalized = rawVal.replace(',', '.');
          const num = parseFloat(normalized);
          if (!isNaN(num)) {
            // clamp between 0 and 10
            parsedVal = Math.min(10, Math.max(0, parseFloat(num.toFixed(1))));
          }
        }

        const updated: StudentGradeRecord = {
          ...item,
          [field]: parsedVal,
        };

        // Recalculate average immediately
        updated.averageScore = calculateStudentAverage(updated);
        return updated;
      })
    );
    setIsDirty(true);
  };

  // Quick fill handler
  const handleApplyQuickFill = () => {
    if (!quickFillColumn) return;
    const num = quickFillValue.trim() === '' ? undefined : parseFloat(quickFillValue.replace(',', '.'));
    if (num !== undefined && (isNaN(num) || num < 0 || num > 10)) {
      showToast('Điểm điền nhanh phải từ 0 đến 10!', 'warning');
      return;
    }

    setGradeRecords(prev =>
      prev.map(item => {
        const updated: StudentGradeRecord = {
          ...item,
          [quickFillColumn]: num,
        };
        updated.averageScore = calculateStudentAverage(updated);
        return updated;
      })
    );
    setIsDirty(true);
    setShowQuickFillModal(false);
    showToast(`Đã áp dụng điền nhanh cho cột!`, 'success');
  };

  // Save all grades to database
  const handleSaveAll = () => {
    db.batchSaveGrades(gradeRecords);
    setIsDirty(false);
    showToast(`Đã lưu thành công điểm kiểm tra môn ${currentSubjectName}!`, 'success');
  };

  // Export to Excel file
  const handleExportExcel = () => {
    const school = db.getSchool();
    const className = currentClass?.name || classNameProp || '9A1';
    const subjectName = currentSubjectName;

    const dataRows = gradeRecords.map((gr, idx) => {
      const avg = gr.averageScore ?? calculateStudentAverage(gr);
      const rating = getClassification(avg).label;
      return {
        'STT': idx + 1,
        'Mã học sinh': gr.studentCode,
        'Họ và tên': gr.studentName,
        'KTTX 1 (Miệng 1)': gr.oral1 ?? '',
        'KTTX 2 (Miệng 2)': gr.oral2 ?? '',
        'KTTX 3 (15 Phút 1)': gr.test15m1 ?? '',
        'KTTX 4 (15 Phút 2)': gr.test15m2 ?? '',
        'Giữa kì (Hệ số 2)': gr.midterm ?? '',
        'Cuối kì (Hệ số 3)': gr.finalTerm ?? '',
        'Điểm Trung Bình (ĐTB)': avg ?? '',
        'Xếp loại': rating,
        'Ghi chú': gr.note || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Diem_${className}`);

    const fileName = `Bang_Diem_Kiem_Tra_${className}_${subjectName.replace(/\s+/g, '_')}_HK${semester}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    showToast(`Đã xuất bảng điểm Excel: ${fileName}`, 'info');
  };

  const currentSubjectName = useMemo(() => {
    return SUBJECTS_LIST.find(s => s.id === selectedSubjectId)?.name || 'Toán học';
  }, [selectedSubjectId]);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return gradeRecords.filter(r => {
      const matchesSearch =
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentCode.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const avg = r.averageScore ?? calculateStudentAverage(r);
      if (filterRating === 'all') return true;
      if (filterRating === 'gioi') return avg !== undefined && avg >= 8.0;
      if (filterRating === 'kha') return avg !== undefined && avg >= 6.5 && avg < 8.0;
      if (filterRating === 'dat') return avg !== undefined && avg >= 5.0 && avg < 6.5;
      if (filterRating === 'chuadat') return avg !== undefined && avg < 5.0;
      if (filterRating === 'thieu') return avg === undefined;
      return true;
    });
  }, [gradeRecords, searchTerm, filterRating]);

  // Statistics calculation
  const stats = useMemo(() => {
    let sum = 0;
    let count = 0;
    let gioi = 0;
    let kha = 0;
    let dat = 0;
    let chuaDat = 0;
    let thieu = 0;

    gradeRecords.forEach(r => {
      const avg = r.averageScore ?? calculateStudentAverage(r);
      if (avg !== undefined && !isNaN(avg)) {
        sum += avg;
        count++;
        if (avg >= 8.0) gioi++;
        else if (avg >= 6.5) kha++;
        else if (avg >= 5.0) dat++;
        else chuaDat++;
      } else {
        thieu++;
      }
    });

    const classAvg = count > 0 ? (sum / count).toFixed(1) : '-';
    return {
      total: gradeRecords.length,
      completed: count,
      classAvg,
      gioi,
      kha,
      dat,
      chuaDat,
      thieu,
    };
  }, [gradeRecords]);

  return (
    <div className="space-y-4 text-slate-100">
      {/* 1. Header & Controls */}
      <div className="bg-[#041527] p-4 rounded-2xl border border-[#0e3d54] shadow-xs space-y-4">
        {/* Top row: Subject, Semester & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Selector */}
            <div className="flex items-center gap-1.5 bg-[#020e1a] px-3 py-1.5 rounded-xl border border-[#0e3d54]">
              <span className="text-xs font-semibold text-slate-400">Môn:</span>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
              >
                {SUBJECTS_LIST.map(sub => (
                  <option key={sub.id} value={sub.id} className="bg-[#03172c] text-white">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Tabs */}
            <div className="flex items-center gap-1 bg-[#020e1a] p-1 rounded-xl border border-[#0e3d54]">
              <button
                type="button"
                onClick={() => setSemester(1)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  semester === 1
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Học kỳ I
              </button>
              <button
                type="button"
                onClick={() => setSemester(2)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  semester === 2
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Học kỳ II
              </button>
            </div>

            {/* Status indicator */}
            {isDirty ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[11px] font-semibold animate-pulse">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Có điểm chưa lưu</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Đã đồng bộ</span>
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickFillModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#03172c] border border-[#0e3d54] hover:bg-[#062440] hover:border-cyan-500 text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Điền nhanh điểm cho một cột"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Điền nhanh</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#03172c] border border-[#0e3d54] hover:bg-[#062440] hover:border-emerald-500 text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Xuất bảng điểm ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                isDirty
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950 ring-2 ring-cyan-400/40'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-cyan-950 border border-cyan-500/40'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu điểm kiểm tra</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#0e3d54]">
          <div className="p-2.5 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
            <span className="text-[11px] text-slate-400 block font-medium">ĐTB cả lớp</span>
            <div className="text-lg font-black text-cyan-300 mt-0.5 tabular-nums">
              {stats.classAvg}
              <span className="text-[11px] font-normal text-slate-500 ml-1">/ 10</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
            <span className="text-[11px] text-slate-400 block font-medium">Sĩ số lớp</span>
            <div className="text-lg font-bold text-white mt-0.5 tabular-nums">
              {stats.total} <span className="text-[11px] font-normal text-slate-500">học sinh</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
            <span className="text-[11px] text-emerald-400 block font-medium">Giỏi (Tốt ≥ 8.0)</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">
              {stats.gioi} <span className="text-[10px] text-slate-500">({Math.round((stats.gioi / (stats.total || 1)) * 100)}%)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
            <span className="text-[11px] text-sky-400 block font-medium">Khá (6.5 - 7.9)</span>
            <div className="text-lg font-bold text-sky-400 mt-0.5 tabular-nums">
              {stats.kha} <span className="text-[10px] text-slate-500">({Math.round((stats.kha / (stats.total || 1)) * 100)}%)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
            <span className="text-[11px] text-amber-400 block font-medium">Đạt (5.0 - 6.4)</span>
            <div className="text-lg font-bold text-amber-400 mt-0.5 tabular-nums">
              {stats.dat} <span className="text-[10px] text-slate-500">({Math.round((stats.dat / (stats.total || 1)) * 100)}%)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
            <span className="text-[11px] text-rose-400 block font-medium">Chưa đạt / Thiếu</span>
            <div className="text-lg font-bold text-rose-400 mt-0.5 tabular-nums">
              {stats.chuaDat + stats.thieu} <span className="text-[10px] text-slate-500">HS</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-cyan-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, mã HS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#020e1a] border border-[#0e3d54] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Classification Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            <span className="text-slate-400 text-[11px] mr-1 hidden md:inline">Lọc:</span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'gioi', label: 'Giỏi (≥8.0)' },
              { id: 'kha', label: 'Khá (6.5-7.9)' },
              { id: 'dat', label: 'Đạt (5.0-6.4)' },
              { id: 'chuadat', label: 'Chưa đạt' },
              { id: 'thieu', label: 'Chưa đủ điểm' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterRating(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterRating === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-[#06203a] border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Formula Guideline Banner */}
      <div className="bg-[#03172c] border border-[#0e3d54] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Quy định tính điểm THCS (Bộ GD&ĐT): <strong className="text-cyan-300">KTTX (Hệ số 1)</strong> + <strong className="text-amber-300">Giữa kì (Hệ số 2)</strong> + <strong className="text-rose-300">Cuối kì (Hệ số 3)</strong>.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Điểm sẽ tự động tính ĐTB môn ngay khi điền điểm (thang điểm 0 - 10)
        </span>
      </div>

      {/* 3. The Core Examination Grade Table */}
      <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] overflow-hidden shadow-lg">
        <div className="overflow-x-auto custom-horizontal-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            {/* Top Multi-Header Row for Grouping */}
            <thead>
              <tr className="bg-[#051c33] border-b border-[#0e3d54] text-slate-400 text-[11px] uppercase tracking-wider">
                <th colSpan={3} className="px-3 py-2 border-r border-[#0e3d54] text-center font-bold text-slate-300">
                  Thông tin học sinh
                </th>
                <th colSpan={4} className="px-3 py-2 border-r border-[#0e3d54] text-center font-bold text-cyan-300 bg-cyan-950/40">
                  Kiểm tra thường xuyên (KTTX) • Hệ số 1
                </th>
                <th className="px-3 py-2 border-r border-[#0e3d54] text-center font-bold text-amber-300 bg-amber-950/40">
                  Giữa kì (GK) • Hệ số 2
                </th>
                <th className="px-3 py-2 border-r border-[#0e3d54] text-center font-bold text-rose-300 bg-rose-950/40">
                  Cuối kì (CK) • Hệ số 3
                </th>
                <th className="px-3 py-2 border-r border-[#0e3d54] text-center font-bold text-emerald-300 bg-emerald-950/40">
                  ĐTB Môn
                </th>
                <th className="px-3 py-2 border-r border-[#0e3d54] text-center font-bold text-slate-300">
                  Xếp loại
                </th>
                <th className="px-3 py-2 text-center font-bold text-slate-300">
                  Nhận xét / Ghi chú
                </th>
              </tr>

              {/* Sub-Header Row with Column Names */}
              <tr className="bg-[#062440] border-b border-[#0e3d54] text-cyan-200 font-semibold text-[11px]">
                <th className="px-2.5 py-2 text-center w-10">STT</th>
                <th className="px-2.5 py-2 text-center w-24">Mã HS</th>
                <th className="px-3 py-2 min-w-[170px] border-r border-[#0e3d54]">Họ và tên</th>

                {/* KTTX Columns */}
                <th className="px-2 py-2 text-center w-16" title="Kiểm tra miệng 1">KTTX 1</th>
                <th className="px-2 py-2 text-center w-16" title="Kiểm tra miệng 2">KTTX 2</th>
                <th className="px-2 py-2 text-center w-16" title="Kiểm tra 15 phút lần 1">KTTX 3</th>
                <th className="px-2 py-2 text-center w-16 border-r border-[#0e3d54]" title="Kiểm tra 15 phút lần 2">KTTX 4</th>

                {/* Giữa kỳ */}
                <th className="px-2.5 py-2 text-center w-20 border-r border-[#0e3d54] text-amber-300">
                  ĐĐGgk (x2)
                </th>

                {/* Cuối kỳ */}
                <th className="px-2.5 py-2 text-center w-20 border-r border-[#0e3d54] text-rose-300">
                  ĐĐGck (x3)
                </th>

                {/* ĐTB */}
                <th className="px-3 py-2 text-center w-20 border-r border-[#0e3d54] text-emerald-300 font-black">
                  ĐTBm
                </th>

                {/* Rating */}
                <th className="px-3 py-2 text-center w-24 border-r border-[#0e3d54]">
                  Xếp loại
                </th>

                {/* Notes */}
                <th className="px-3 py-2 min-w-[140px]">
                  Ghi chú
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#0e3d54]/70">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-400">
                    Không tìm thấy học sinh phù hợp với điều kiện tìm kiếm/lọc.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((gr, idx) => {
                  const studentObj = students.find(s => s.id === gr.studentId);
                  const avg = gr.averageScore ?? calculateStudentAverage(gr);
                  const classif = getClassification(avg);

                  return (
                    <tr key={gr.id} className="hover:bg-[#06203a] transition-colors group">
                      {/* STT */}
                      <td className="px-2.5 py-2.5 text-center text-slate-400 font-semibold tabular-nums">
                        {idx + 1}
                      </td>

                      {/* Mã HS */}
                      <td className="px-2.5 py-2.5 text-center font-mono text-slate-400 text-[11px]">
                        {gr.studentCode}
                      </td>

                      {/* Student info */}
                      <td className="px-3 py-2.5 border-r border-[#0e3d54]">
                        <div className="flex items-center gap-2.5">
                          {studentObj?.avatarUrl ? (
                            <img
                              src={studentObj.avatarUrl}
                              alt={gr.studentName}
                              className="w-7 h-7 rounded-full object-cover border border-cyan-500/40 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-cyan-900/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold shrink-0 text-xs">
                              {gr.studentName.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <span className="font-bold text-white block group-hover:text-cyan-300 transition-colors">
                              {gr.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {studentObj?.team || 'Tổ 1'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* KTTX 1 */}
                      <td className="px-1.5 py-1.5 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gr.oral1 !== undefined ? gr.oral1 : ''}
                          onChange={e => handleCellChange(gr.studentId, 'oral1', e.target.value)}
                          placeholder="-"
                          className="w-12 text-center py-1 rounded-lg border border-[#0e3d54] bg-[#020e1a] text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-semibold tabular-nums transition-all focus:outline-none hover:border-cyan-500/60"
                        />
                      </td>

                      {/* KTTX 2 */}
                      <td className="px-1.5 py-1.5 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gr.oral2 !== undefined ? gr.oral2 : ''}
                          onChange={e => handleCellChange(gr.studentId, 'oral2', e.target.value)}
                          placeholder="-"
                          className="w-12 text-center py-1 rounded-lg border border-[#0e3d54] bg-[#020e1a] text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-semibold tabular-nums transition-all focus:outline-none hover:border-cyan-500/60"
                        />
                      </td>

                      {/* KTTX 3 (15P 1) */}
                      <td className="px-1.5 py-1.5 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gr.test15m1 !== undefined ? gr.test15m1 : ''}
                          onChange={e => handleCellChange(gr.studentId, 'test15m1', e.target.value)}
                          placeholder="-"
                          className="w-12 text-center py-1 rounded-lg border border-[#0e3d54] bg-[#020e1a] text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-semibold tabular-nums transition-all focus:outline-none hover:border-cyan-500/60"
                        />
                      </td>

                      {/* KTTX 4 (15P 2) */}
                      <td className="px-1.5 py-1.5 text-center border-r border-[#0e3d54]">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gr.test15m2 !== undefined ? gr.test15m2 : ''}
                          onChange={e => handleCellChange(gr.studentId, 'test15m2', e.target.value)}
                          placeholder="-"
                          className="w-12 text-center py-1 rounded-lg border border-[#0e3d54] bg-[#020e1a] text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-semibold tabular-nums transition-all focus:outline-none hover:border-cyan-500/60"
                        />
                      </td>

                      {/* Giữa kì (x2) */}
                      <td className="px-2 py-1.5 text-center border-r border-[#0e3d54] bg-amber-950/15">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gr.midterm !== undefined ? gr.midterm : ''}
                          onChange={e => handleCellChange(gr.studentId, 'midterm', e.target.value)}
                          placeholder="-"
                          className="w-14 text-center py-1 rounded-lg border border-amber-800/60 bg-[#020e1a] text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-bold tabular-nums transition-all focus:outline-none"
                        />
                      </td>

                      {/* Cuối kì (x3) */}
                      <td className="px-2 py-1.5 text-center border-r border-[#0e3d54] bg-rose-950/15">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gr.finalTerm !== undefined ? gr.finalTerm : ''}
                          onChange={e => handleCellChange(gr.studentId, 'finalTerm', e.target.value)}
                          placeholder="-"
                          className="w-14 text-center py-1 rounded-lg border border-rose-800/60 bg-[#020e1a] text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 text-xs font-bold tabular-nums transition-all focus:outline-none"
                        />
                      </td>

                      {/* ĐTB Môn (Live Auto-Calculated) */}
                      <td className="px-3 py-2.5 text-center border-r border-[#0e3d54] bg-cyan-950/30">
                        {avg !== undefined ? (
                          <span className={`text-sm font-black tabular-nums ${classif.textClass}`}>
                            {avg.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Xếp loại Badge */}
                      <td className="px-2.5 py-2.5 text-center border-r border-[#0e3d54]">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${classif.badgeBg}`}>
                          {classif.label}
                        </span>
                      </td>

                      {/* Nhận xét / Ghi chú */}
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={gr.note || ''}
                          onChange={e => handleCellChange(gr.studentId, 'note', e.target.value)}
                          placeholder="Nhận xét ngắn..."
                          className="w-full px-2 py-1 rounded-lg border border-[#0e3d54] bg-[#020e1a] text-xs text-slate-300 focus:border-cyan-400 focus:outline-none placeholder-slate-600"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Fill Modal */}
      {showQuickFillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#041527] border border-[#0e3d54] rounded-2xl p-5 max-w-md w-full shadow-2xl text-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#0e3d54]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Điền nhanh điểm kiểm tra cả lớp</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickFillModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Tính năng này cho phép giáo viên điền nhanh cùng một mức điểm cho tất cả học sinh trong một cột kiểm tra (hoặc để trống để xóa cột).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chọn cột kiểm tra:
                </label>
                <select
                  value={quickFillColumn}
                  onChange={e => setQuickFillColumn(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020e1a] border border-[#0e3d54] text-xs font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">-- Chọn cột cần điền --</option>
                  <option value="oral1">KTTX 1 (Miệng 1)</option>
                  <option value="oral2">KTTX 2 (Miệng 2)</option>
                  <option value="test15m1">KTTX 3 (15 Phút 1)</option>
                  <option value="test15m2">KTTX 4 (15 Phút 2)</option>
                  <option value="midterm">Giữa kì (Hệ số 2)</option>
                  <option value="finalTerm">Cuối kì (Hệ số 3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mức điểm điền nhanh (0 đến 10, để trống nếu muốn xóa):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 8.5 hoặc 10"
                  value={quickFillValue}
                  onChange={e => setQuickFillValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020e1a] border border-[#0e3d54] text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
              <button
                type="button"
                onClick={() => setShowQuickFillModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#03172c] border border-[#0e3d54] text-slate-300 hover:bg-[#06203a]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyQuickFill}
                disabled={!quickFillColumn}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-md shadow-cyan-950 cursor-pointer"
              >
                Áp dụng cho cả lớp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
