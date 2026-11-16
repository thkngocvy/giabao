import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Plus,
  Layers,
  Tag,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Screen111TopicManagement } from '../../components/assignments/Screen111TopicManagement';
import { CreateAssignmentFromBankSection } from '../../components/assignments/CreateAssignmentFromBankSection';
import { CreateAssignmentSection } from '../../components/assignments/CreateAssignmentSection';
import { AssignedKpiBar } from '../../components/assignments/assigned-list/AssignedKpiBar';
import {
  AssignedFiltersBar,
  AssignmentSortKey,
  TimeRangeFilter,
} from '../../components/assignments/assigned-list/AssignedFiltersBar';
import {
  AssignmentCardItem,
  CardMenuAction,
} from '../../components/assignments/assigned-list/AssignmentCardItem';
import { StudentSubmissionsPanel } from '../../components/assignments/assigned-list/StudentSubmissionsPanel';
import { GradingWorkspaceModal } from '../../components/assignments/assigned-list/GradingWorkspaceModal';
import { SubmissionFilePreviewModal } from '../../components/assignments/assigned-list/SubmissionFilePreviewModal';
import { getAssignmentReceiveDisplayMeta } from '../../components/assignments/assigned-list/utils';
import {
  AssignmentHistoryModal,
  ClassOverviewReportModal,
  ViewAssignmentContentModal,
} from '../../components/assignments/assigned-list/ViewContentAndHistoryModals';
import {
  AssignmentReportModal,
  DuplicateReassignModal,
  EditMetadataModal,
  ExportReportModal,
  ExtendDeadlineModal,
  PublishGradesModal,
  ReminderModal,
  ResubmitRequestModal,
  ToggleReceivingModal,
  WithdrawAssignmentModal,
} from '../../components/assignments/AssignedAssignmentModals';
import { db } from '../../services/db';
import { Assignment, AssignmentSubmission } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const AssignmentsPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const actor = useMemo(
    () => ({
      id: currentUser?.id || 'user_teacher_1',
      name: currentUser?.fullName || 'Cô Lê Thu Hà',
      role: currentRole,
    }),
    [currentUser, currentRole]
  );

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);

  // Active view section tab: 'all' | 'topics' | 'bank_creator' | 'quick_create' | 'list'
  const tabParam = searchParams.get('tab') as 'all' | 'topics' | 'bank_creator' | 'quick_create' | 'list' | null;
  const [activeTab, setActiveTabState] = useState<'all' | 'topics' | 'bank_creator' | 'quick_create' | 'list'>(
    tabParam && ['all', 'topics', 'bank_creator', 'quick_create', 'list'].includes(tabParam) ? tabParam : 'all'
  );

  const setActiveTab = (tab: 'all' | 'topics' | 'bank_creator' | 'quick_create' | 'list') => {
    setActiveTabState(tab);
    if (tab === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  useEffect(() => {
    if (tabParam && ['all', 'topics', 'bank_creator', 'quick_create', 'list'].includes(tabParam)) {
      setActiveTabState(tabParam);
    } else if (!tabParam) {
      setActiveTabState('all');
    }
  }, [tabParam]);

  // Preselected topic ID when navigating from Screen 111 to Bank Generator
  const [bankTopicId, setBankTopicId] = useState<string | undefined>(undefined);

  // Filter states for Part 3 (Danh sách bài tập đã giao)
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeRangeFilter>('all');
  const [sortBy, setSortBy] = useState<AssignmentSortKey>('created_desc');
  const [selectedFilterTopic, setSelectedFilterTopic] = useState<string | null>(null);
  const [searchAsgTerm, setSearchAsgTerm] = useState<string>('');
  const [asgPage, setAsgPage] = useState<number>(1);
  const ASG_PAGE_SIZE = 5;

  // Prefilled topic when chosen from Quick Create
  const [prefilledTopic, setPrefilledTopic] = useState<string | undefined>(undefined);
  const [prefilledSubject, setPrefilledSubject] = useState<string | undefined>(undefined);

  // Selected students in right-hand panel
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Explicit loading, error & inline success feedback states for Part 3
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Active modals for Part 3 workflows
  const [previewSubmission, setPreviewSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [resubmitTarget, setResubmitTarget] = useState<AssignmentSubmission | null>(null);
  const [extendModal, setExtendModal] = useState<{ asg: Assignment; studentIds?: string[] } | null>(null);
  const [remindModal, setRemindModal] = useState<{ asg: Assignment; studentIds: string[] } | null>(null);
  const [publishModal, setPublishModal] = useState<{ asg: Assignment; submissionIds?: string[] } | null>(null);
  const [toggleReceivingModal, setToggleReceivingModal] = useState<{ asg: Assignment; target: 'open' | 'closed' } | null>(null);
  const [withdrawModalAsg, setWithdrawModalAsg] = useState<Assignment | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{ asg: Assignment; mode: 'duplicate_draft' | 'reassign' } | null>(null);
  const [editMetadataAsg, setEditMetadataAsg] = useState<Assignment | null>(null);
  const [exportModal, setExportModal] = useState<{ studentIds?: string[] } | null>(null);
  const [reportModalAsg, setReportModalAsg] = useState<Assignment | null>(null);
  const [viewContentAsg, setViewContentAsg] = useState<Assignment | null>(null);
  const [historyModalAsg, setHistoryModalAsg] = useState<Assignment | null>(null);
  const [overviewReportOpen, setOverviewReportOpen] = useState<boolean>(false);

  // References for scrolling & preserving active selection across updates
  const bankSectionRef = useRef<HTMLDivElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);
  const listSectionRef = useRef<HTMLDivElement>(null);
  const selectedAsgIdRef = useRef<string | null>(null);

  const notifyAction = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionFeedback({ type, message });
    showToast(message, type);
  };

  const reloadData = () => {
    try {
      setListError(null);
      const list = db.getAssignmentsByPermission(actor.id, actor.role);
      setAssignments(list);
      if (list.length > 0) {
        const targetId = selectedAsgIdRef.current;
        const current = (targetId ? list.find(a => a.id === targetId) : undefined) || list[0];
        selectedAsgIdRef.current = current.id;
        setSelectedAsg(current);
        setSubmissions(db.getSubmissions(current.id));
      } else {
        selectedAsgIdRef.current = null;
        setSelectedAsg(null);
        setSubmissions([]);
      }
    } catch (err: any) {
      setListError(err?.message || 'Không thể tải danh sách bài tập. Vui lòng thử lại.');
    }
  };

  const handleManualRefresh = () => {
    setIsLoadingList(true);
    setListError(null);
    setTimeout(() => {
      reloadData();
      setIsLoadingList(false);
      notifyAction('Đã làm mới danh sách bài tập & dữ liệu bài nộp mới nhất.', 'info');
    }, 180);
  };

  useEffect(() => {
    db.checkAndTriggerOverdueReminders();
    reloadData();
    const unsubscribe = db.subscribe(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, [actor.id, actor.role]);

  const handleSelectAsg = (asg: Assignment) => {
    selectedAsgIdRef.current = asg.id;
    setSelectedAsg(asg);
    setSubmissions(db.getSubmissions(asg.id));
    setSelectedStudentIds([]);
  };

  // When teacher picks a topic in Screen 111 to create an assignment via Bank Generator
  const handleSelectTopicForBankAssignment = (
    topicId: string,
    topicName: string,
    _subject: string,
    _classId: string
  ) => {
    setBankTopicId(topicId);
    setActiveTab('bank_creator');
    showToast(`Đã chọn chủ đề "${topicName}" cho Trình tạo đề từ ngân hàng câu hỏi!`, 'info');
    setTimeout(() => {
      bankSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // When teacher picks a topic in Quick Create form
  const handleSelectTopicForAssignment = (topicName: string, subject: string) => {
    setPrefilledTopic(topicName);
    setPrefilledSubject(subject);
    setActiveTab('quick_create');
    showToast(`Đã chọn chủ đề "${topicName}" cho Form giao bài nhanh!`, 'info');
    setTimeout(() => {
      createSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // When teacher clicks filter by topic in Screen 111
  const handleFilterByTopic = (topicName: string | null) => {
    setSelectedFilterTopic(topicName);
    setAsgPage(1);
    if (topicName) {
      showToast(`Đang lọc danh sách bài tập đã giao theo chủ đề: "${topicName}"`, 'info');
      setTimeout(() => {
        listSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      showToast('Đã xóa lọc theo chủ đề.', 'info');
    }
  };

  // When an assignment is created in Part 2
  const handleAssignmentCreated = (newAsg: Assignment) => {
    selectedAsgIdRef.current = newAsg.id;
    reloadData();
    setTimeout(() => {
      listSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleToggleTickCompleted = (studentId: string, currentVerified: boolean) => {
    if (!selectedAsg) return;
    const nextState = !currentVerified;
    const ok = db.tickStudentCompleted(selectedAsg.id, studentId, nextState);
    if (!ok) {
      showToast('Không thể tick hoàn thành với bài tập ở trạng thái Bản nháp hoặc Đã thu hồi.', 'error');
      return;
    }
    showToast(
      nextState
        ? '✓ Đã tick xác nhận học sinh đã hoàn thành bài tập!'
        : 'Đã hủy xác nhận hoàn thành cho học sinh.',
      nextState ? 'success' : 'info'
    );
  };

  const handleCardMenuAction = (asg: Assignment, action: CardMenuAction) => {
    handleSelectAsg(asg);
    switch (action) {
      case 'view_content':
        setViewContentAsg(asg);
        break;
      case 'edit_metadata':
        setEditMetadataAsg(asg);
        break;
      case 'duplicate_draft':
        setDuplicateModal({ asg, mode: 'duplicate_draft' });
        break;
      case 'reassign':
        setDuplicateModal({ asg, mode: 'reassign' });
        break;
      case 'extend':
        setExtendModal({ asg });
        break;
      case 'toggle_receiving': {
        const eff = db.getEffectiveReceiveStatus(asg);
        setToggleReceivingModal({ asg, target: eff === 'closed' ? 'open' : 'closed' });
        break;
      }
      case 'history':
        setHistoryModalAsg(asg);
        break;
      case 'report':
        setReportModalAsg(asg);
        break;
      case 'withdraw':
        setWithdrawModalAsg(asg);
        break;
    }
  };

  const classes = db.getTeacherPermissions(actor.id, actor.role).classes;
  const availableSubjects = useMemo(() => {
    const base = ['Toán học', 'Tiếng Anh', 'Ngữ văn', 'Vật lý', 'Hóa học', 'Sinh học'];
    return Array.from(new Set([...base, ...assignments.map(a => a.subjectName)]));
  }, [assignments]);

  const hasActiveFilters =
    classFilter !== 'all' ||
    subjectFilter !== 'all' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    timeFilter !== 'all' ||
    Boolean(selectedFilterTopic) ||
    searchAsgTerm.trim().length > 0;

  const resetAllFilters = () => {
    setClassFilter('all');
    setSubjectFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setTimeFilter('all');
    setSelectedFilterTopic(null);
    setSearchAsgTerm('');
    setAsgPage(1);
  };

  // Filtered + Sorted assignments for Part 3
  const filteredAssignments = useMemo(() => {
    const nowMs = Date.now();
    const list = assignments.filter(asg => {
      if (classFilter !== 'all' && asg.classId !== classFilter) return false;
      if (subjectFilter !== 'all' && asg.subjectName !== subjectFilter) return false;
      if (statusFilter === 'overdue_open') {
        if (!getAssignmentReceiveDisplayMeta(asg).isOverdueOpen) return false;
      } else if (statusFilter !== 'all' && db.getEffectiveReceiveStatus(asg) !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'all' && asg.type !== typeFilter) return false;

      if (timeFilter === '7d') {
        const createdMs = new Date(asg.createdAt).getTime();
        if (nowMs - createdMs > 7 * 86400000) return false;
      } else if (timeFilter === '30d') {
        const createdMs = new Date(asg.createdAt).getTime();
        if (nowMs - createdMs > 30 * 86400000) return false;
      } else if (timeFilter === 'overdue') {
        const stats = db.getAssignmentStats(asg);
        const displayMeta = getAssignmentReceiveDisplayMeta(asg);
        if (!displayMeta.isOverdueOpen && stats.overdueMissingCount === 0) return false;
      }

      if (
        selectedFilterTopic &&
        (!asg.topic || !asg.topic.toLowerCase().includes(selectedFilterTopic.toLowerCase().slice(0, 10)))
      ) {
        return false;
      }

      if (searchAsgTerm.trim()) {
        const q = searchAsgTerm.trim().toLowerCase();
        const code = db.getAssignmentCode(asg).toLowerCase();
        return (
          asg.title.toLowerCase().includes(q) ||
          code.includes(q) ||
          Boolean(asg.topic && asg.topic.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'due_asc') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'due_desc') return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (sortBy === 'created_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

      const statsA = db.getAssignmentStats(a);
      const statsB = db.getAssignmentStats(b);
      if (sortBy === 'ungraded_desc') return statsB.ungradedCount - statsA.ungradedCount;

      const rateA = statsA.totalRecipients > 0 ? statsA.submittedCount / statsA.totalRecipients : 0;
      const rateB = statsB.totalRecipients > 0 ? statsB.submittedCount / statsB.totalRecipients : 0;
      if (sortBy === 'sub_rate_asc') return rateA - rateB;
      return rateB - rateA;
    });
  }, [
    assignments,
    classFilter,
    subjectFilter,
    statusFilter,
    typeFilter,
    timeFilter,
    selectedFilterTopic,
    searchAsgTerm,
    sortBy,
  ]);

  useEffect(() => {
    setAsgPage(1);
  }, [classFilter, subjectFilter, statusFilter, typeFilter, timeFilter, selectedFilterTopic, searchAsgTerm, sortBy]);

  const totalAsgPages = Math.max(1, Math.ceil(filteredAssignments.length / ASG_PAGE_SIZE));
  const safeAsgPage = Math.min(asgPage, totalAsgPages);
  const pagedAssignments = useMemo(() => {
    const start = (safeAsgPage - 1) * ASG_PAGE_SIZE;
    return filteredAssignments.slice(start, start + ASG_PAGE_SIZE);
  }, [filteredAssignments, safeAsgPage]);

  const scopeLabel = useMemo(() => {
    const parts: string[] = [];
    if (classFilter !== 'all') {
      const cls = classes.find(c => c.id === classFilter);
      parts.push(`Lớp ${cls?.name || classFilter}`);
    } else {
      parts.push('Tất cả lớp phụ trách');
    }
    if (subjectFilter !== 'all') parts.push(subjectFilter);
    if (statusFilter !== 'all') parts.push(statusFilter);
    return parts.join(' · ');
  }, [classFilter, subjectFilter, statusFilter, classes]);

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        breadcrumbItems={[
          { label: 'Dạy và Học' },
          { label: 'Quản lý & Giao bài tập' },
        ]}
        title="Quản Lý & Giao Bài Tập Về Nhà"
        subtitle="Hệ thống 3 phần: Quản lý chủ đề · Tạo bài tập · Danh sách bài tập đã giao ở dưới"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-[#031526] border border-[#0e3d54] text-cyan-300 px-3 py-1.5 rounded-xl font-bold">
              {assignments.length} bài tập đã giao
            </span>
          </div>
        }
      />

      {/* 4-Section Sub-Nav Bar */}
      <div className="hud-panel p-1.5 bg-[#0A1B2D]/90 backdrop-blur-xl border border-[#00E5FF]/25 rounded-2xl flex flex-wrap items-center gap-1.5 shadow-lg">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] shadow-[0_0_16px_rgba(0,229,255,0.3)]'
              : 'text-[#8BA9BC] hover:text-[#EAFBFF] hover:bg-[#071525]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Toàn cảnh tổng thể</span>
        </button>

        <button
          onClick={() => setActiveTab('topics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'topics'
              ? 'bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] shadow-[0_0_16px_rgba(0,229,255,0.3)]'
              : 'text-[#8BA9BC] hover:text-[#EAFBFF] hover:bg-[#071525]'
          }`}
        >
          <Tag className={`w-3.5 h-3.5 ${activeTab === 'topics' ? 'text-[#030B16]' : 'text-[#00E5FF]'}`} />
          <span>1. Quản lý chủ đề (Màn hình 111)</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_creator')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bank_creator'
              ? 'bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] shadow-[0_0_16px_rgba(0,229,255,0.3)]'
              : 'text-[#8BA9BC] hover:text-[#EAFBFF] hover:bg-[#071525]'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'bank_creator' ? 'text-[#030B16]' : 'text-[#00E5FF]'}`} />
          <span>2. Tạo bài tập từ ngân hàng (5 bước)</span>
        </button>

        <button
          onClick={() => setActiveTab('quick_create')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'quick_create'
              ? 'bg-gradient-to-r from-[#00F5A0] to-[#00E5FF] text-[#030B16] shadow-[0_0_16px_rgba(0,245,160,0.3)]'
              : 'text-[#8BA9BC] hover:text-[#EAFBFF] hover:bg-[#071525]'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 ${activeTab === 'quick_create' ? 'text-[#030B16]' : 'text-[#00F5A0]'}`} />
          <span>3. Giao bài nhanh (Tệp / Văn bản)</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'list'
              ? 'bg-gradient-to-r from-[#087CFF] to-[#A855F7] text-white shadow-[0_0_16px_rgba(168,85,247,0.3)]'
              : 'text-[#8BA9BC] hover:text-[#EAFBFF] hover:bg-[#071525]'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'list' ? 'text-white' : 'text-[#A855F7]'}`} />
          <span>4. Danh sách bài tập đã giao ({assignments.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PHẦN 1: MÀN HÌNH 111 – QUẢN LÝ CHỦ ĐỀ MÔN HỌC THEO BUỔI    */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'topics') && (
        <Screen111TopicManagement
          onSelectTopicForAssignment={handleSelectTopicForBankAssignment}
          onFilterByTopicInList={handleFilterByTopic}
        />
      )}

      {/* ======================================================== */}
      {/* PHẦN 2: TẠO BÀI TẬP TỪ NGÂN HÀNG CÂU HỎI (5 BƯỚC)        */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'bank_creator') && (
        <div ref={bankSectionRef}>
          <CreateAssignmentFromBankSection
            preselectedTopicId={bankTopicId}
            onSuccess={handleAssignmentCreated}
            onNavigateToScreen111={() => {
              setActiveTab('topics');
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* PHẦN 3: GIAO BÀI NHANH (TỆP & COPY-PASTE SẴN CÓ)         */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'quick_create') && (
        <div ref={createSectionRef}>
          <CreateAssignmentSection
            onSuccess={handleAssignmentCreated}
            prefilledTopic={prefilledTopic}
            prefilledSubject={prefilledSubject}
            onClearPrefilledTopic={() => {
              setPrefilledTopic(undefined);
              setPrefilledSubject(undefined);
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* PHẦN 3: DANH SÁCH BÀI TẬP ĐÃ GIAO (NÂNG CẤP TOÀN DIỆN)   */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'list') && (
        <div ref={listSectionRef} className="space-y-4">
          {/* Header of Part 3 */}
          <div className="hud-panel bg-[#041527] rounded-xl border border-[#0e3d54] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                  PHẦN 3
                </span>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Danh Sách Bài Tập Đã Giao & Quản Lý Chấm Bài</span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Quản lý lượt giao bài theo phân quyền, chấm điểm chi tiết, trả bài, gia hạn, nhắc nộp và xuất báo cáo Excel/CSV/PDF
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedFilterTopic && (
                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-700 rounded-xl text-xs text-cyan-200">
                  <span>
                    Đang lọc chủ đề: <strong>{selectedFilterTopic}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFilterTopic(null)}
                    className="text-slate-400 hover:text-white font-bold ml-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
              <button
                type="button"
                disabled={isLoadingList}
                onClick={handleManualRefresh}
                className="px-3 py-1.5 rounded-xl bg-[#03172c] hover:bg-[#06284a] border border-[#0e3d54] text-[#00E5FF] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
                <span>{isLoadingList ? 'Đang tải...' : 'Làm mới'}</span>
              </button>
            </div>
          </div>

          {/* Inline Success / Error / Info Feedback Banner */}
          {actionFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                actionFeedback.type === 'error'
                  ? 'bg-[#FF4D6D]/15 border-[#FF4D6D]/50 text-[#FF4D6D]'
                  : actionFeedback.type === 'success'
                  ? 'bg-[#00F5A0]/12 border-[#00F5A0]/45 text-[#00F5A0]'
                  : 'bg-[#00E5FF]/12 border-[#00E5FF]/45 text-[#00E5FF]'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {actionFeedback.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="p-1 rounded hover:bg-white/10 cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* KPI Bar (Scope-synced + Data Integrity Checks) */}
          <AssignedKpiBar
            assignments={filteredAssignments}
            scopeLabel={scopeLabel}
            onOpenOverviewReport={() => setOverviewReportOpen(true)}
            onOpenExportModal={() => setExportModal({})}
            onReconcileCounts={() => {
              const fixed = db.reconcileAssignmentCachedCounts({
                actorId: actor.id,
                actorName: actor.name,
                actorRole: actor.role,
              });
              reloadData();
              notifyAction(
                fixed > 0
                  ? `Đã đồng bộ bộ đếm cache theo dữ liệu bài nộp thực tế cho ${fixed} lượt giao.`
                  : 'Tất cả bộ đếm đều đã khớp dữ liệu thực tế.',
                fixed > 0 ? 'success' : 'info'
              );
            }}
          />

          {/* Filters, Sorting & Search Bar */}
          <AssignedFiltersBar
            classes={classes}
            subjects={availableSubjects}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            subjectFilter={subjectFilter}
            setSubjectFilter={setSubjectFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            searchTerm={searchAsgTerm}
            setSearchTerm={setSearchAsgTerm}
            onResetFilters={resetAllFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Two-column Layout: Left = Assignment list cards + pagination, Right = 6-tab Student Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Assigned Homework List */}
            <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] p-4 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#0e3d54]">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Danh sách bài tập ({filteredAssignments.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Menu ⋯ trên từng thẻ</span>
                </div>

                {isLoadingList ? (
                  <div className="space-y-2.5 animate-pulse">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="h-28 rounded-xl bg-[#03172c] border border-[#0e3d54]" />
                    ))}
                  </div>
                ) : listError ? (
                  <div className="p-6 text-center text-xs border border-[#FF4D6D]/40 bg-[#FF4D6D]/10 rounded-xl space-y-2">
                    <AlertTriangle className="w-6 h-6 text-[#FF4D6D] mx-auto" />
                    <p className="text-[#FF4D6D] font-semibold">{listError}</p>
                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      className="px-3 py-1 rounded-lg bg-[#03172c] border border-[#00E5FF]/40 text-[#00E5FF] font-semibold cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : pagedAssignments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-[#0e3d54] rounded-xl space-y-2">
                    <FileText className="w-7 h-7 text-slate-500 mx-auto" />
                    <p>Không có bài tập nào phù hợp với bộ lọc hiện tại.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="px-3 py-1 rounded-lg bg-[#03172c] border border-cyan-700 text-cyan-300 font-semibold cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pagedAssignments.map(asg => (
                      <AssignmentCardItem
                        key={asg.id}
                        assignment={asg}
                        isSelected={selectedAsg?.id === asg.id}
                        actor={{ id: actor.id, role: actor.role }}
                        onSelect={handleSelectAsg}
                        onAction={handleCardMenuAction}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination for Assignment Cards */}
              {filteredAssignments.length > ASG_PAGE_SIZE && (
                <div className="flex items-center justify-between pt-3 border-t border-[#0e3d54] text-xs text-[#8BA9BC]">
                  <span className="tabular-nums">
                    {(safeAsgPage - 1) * ASG_PAGE_SIZE + 1}–{Math.min(safeAsgPage * ASG_PAGE_SIZE, filteredAssignments.length)} / {filteredAssignments.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeAsgPage <= 1}
                      onClick={() => setAsgPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 font-bold text-[#00E5FF] tabular-nums">
                      {safeAsgPage}/{totalAsgPages}
                    </span>
                    <button
                      type="button"
                      disabled={safeAsgPage >= totalAsgPages}
                      onClick={() => setAsgPage(p => Math.min(totalAsgPages, p + 1))}
                      className="p-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Selected Assignment Header + 6-Tab Student Workspace */}
            <StudentSubmissionsPanel
              assignment={selectedAsg}
              submissions={submissions}
              actor={actor}
              isLoading={isLoadingList}
              loadError={listError}
              onRetryLoad={handleManualRefresh}
              selectedStudentIds={selectedStudentIds}
              onChangeSelectedStudentIds={setSelectedStudentIds}
              onOpenContent={() => selectedAsg && setViewContentAsg(selectedAsg)}
              onOpenReport={() => selectedAsg && setReportModalAsg(selectedAsg)}
              onOpenHistory={() => selectedAsg && setHistoryModalAsg(selectedAsg)}
              onOpenEditMetadata={() => selectedAsg && setEditMetadataAsg(selectedAsg)}
              onOpenToggleReceiving={target =>
                selectedAsg && setToggleReceivingModal({ asg: selectedAsg, target })
              }
              onOpenExtend={studentIds =>
                selectedAsg && setExtendModal({ asg: selectedAsg, studentIds })
              }
              onOpenPublish={submissionIds =>
                selectedAsg && setPublishModal({ asg: selectedAsg, submissionIds })
              }
              onOpenRemind={studentIds =>
                selectedAsg && setRemindModal({ asg: selectedAsg, studentIds })
              }
              onOpenExportSelected={studentIds => setExportModal({ studentIds })}
              onOpenPreviewSubmission={sub => setPreviewSubmission(sub)}
              onOpenGrading={sub => setGradingSubmission(sub)}
              onOpenRequestResubmit={sub => setResubmitTarget(sub)}
              onToggleTickCompleted={handleToggleTickCompleted}
              onToast={notifyAction}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS CHO TOÀN BỘ LUỒNG NGHIỆP VỤ DANH SÁCH BÀI ĐÃ GIAO */}
      {/* ======================================================== */}

      {previewSubmission && selectedAsg && (
        <SubmissionFilePreviewModal
          isOpen={Boolean(previewSubmission)}
          onClose={() => setPreviewSubmission(null)}
          assignment={selectedAsg}
          submission={previewSubmission}
          actor={actor}
          onOpenGrading={sub => setGradingSubmission(sub)}
          onToast={notifyAction}
        />
      )}

      {gradingSubmission && selectedAsg && (
        <GradingWorkspaceModal
          isOpen={Boolean(gradingSubmission)}
          onClose={() => setGradingSubmission(null)}
          assignment={selectedAsg}
          submission={gradingSubmission}
          allSubmissions={submissions}
          actor={actor}
          onSelectNextSubmission={nextSub => setGradingSubmission(nextSub)}
          onRequestResubmit={sub => setResubmitTarget(sub)}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {resubmitTarget && selectedAsg && (
        <ResubmitRequestModal
          isOpen={Boolean(resubmitTarget)}
          onClose={() => setResubmitTarget(null)}
          assignment={selectedAsg}
          submission={resubmitTarget}
          actor={actor}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {extendModal && (
        <ExtendDeadlineModal
          isOpen={Boolean(extendModal)}
          onClose={() => setExtendModal(null)}
          assignment={extendModal.asg}
          students={db.getAssignmentRecipients(extendModal.asg)}
          preselectedStudentIds={extendModal.studentIds}
          actor={actor}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {remindModal && (
        <ReminderModal
          isOpen={Boolean(remindModal)}
          onClose={() => setRemindModal(null)}
          assignment={remindModal.asg}
          students={db.getAssignmentRecipients(remindModal.asg)}
          initialSelectedIds={remindModal.studentIds}
          actor={actor}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {publishModal && (
        <PublishGradesModal
          isOpen={Boolean(publishModal)}
          onClose={() => setPublishModal(null)}
          assignment={publishModal.asg}
          submissions={db.getSubmissions(publishModal.asg.id)}
          targetSubmissionIds={publishModal.submissionIds}
          actor={actor}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {toggleReceivingModal && (
        <ToggleReceivingModal
          isOpen={Boolean(toggleReceivingModal)}
          onClose={() => setToggleReceivingModal(null)}
          assignment={toggleReceivingModal.asg}
          targetStatus={toggleReceivingModal.target}
          actor={actor}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {withdrawModalAsg && (
        <WithdrawAssignmentModal
          isOpen={Boolean(withdrawModalAsg)}
          onClose={() => setWithdrawModalAsg(null)}
          assignment={withdrawModalAsg}
          actor={actor}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'info');
          }}
        />
      )}

      {duplicateModal && (
        <DuplicateReassignModal
          isOpen={Boolean(duplicateModal)}
          onClose={() => setDuplicateModal(null)}
          assignment={duplicateModal.asg}
          initialMode={duplicateModal.mode}
          actor={actor}
          onSuccess={(newAsg, msg) => {
            selectedAsgIdRef.current = newAsg.id;
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {editMetadataAsg && (
        <EditMetadataModal
          isOpen={Boolean(editMetadataAsg)}
          onClose={() => setEditMetadataAsg(null)}
          assignment={editMetadataAsg}
          submissionsCount={db.getAssignmentStats(editMetadataAsg).submittedCount}
          actor={actor}
          onSuccess={msg => {
            reloadData();
            notifyAction(msg, 'success');
          }}
        />
      )}

      {exportModal && (
        <ExportReportModal
          isOpen={Boolean(exportModal)}
          onClose={() => setExportModal(null)}
          selectedAssignment={selectedAsg}
          filteredAssignments={filteredAssignments}
          selectedStudentIds={exportModal.studentIds}
          actor={actor}
          onSuccess={msg => notifyAction(msg, 'success')}
        />
      )}

      {reportModalAsg && (
        <AssignmentReportModal
          isOpen={Boolean(reportModalAsg)}
          onClose={() => setReportModalAsg(null)}
          assignment={reportModalAsg}
          submissions={db.getSubmissions(reportModalAsg.id)}
          onExportClick={() => {
            setReportModalAsg(null);
            setExportModal({});
          }}
        />
      )}

      {viewContentAsg && (
        <ViewAssignmentContentModal
          isOpen={Boolean(viewContentAsg)}
          onClose={() => setViewContentAsg(null)}
          assignment={viewContentAsg}
          actor={actor}
          onToast={showToast}
        />
      )}

      {historyModalAsg && (
        <AssignmentHistoryModal
          isOpen={Boolean(historyModalAsg)}
          onClose={() => setHistoryModalAsg(null)}
          assignment={historyModalAsg}
        />
      )}

      <ClassOverviewReportModal
        isOpen={overviewReportOpen}
        onClose={() => setOverviewReportOpen(false)}
        assignments={filteredAssignments}
        onOpenExport={() => {
          setOverviewReportOpen(false);
          setExportModal({});
        }}
      />
    </div>
  );
};
