import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Tag,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Printer,
  AlertTriangle,
  Check,
  Edit2,
  Eye,
  Layers,
  ListOrdered,
  Split,
  MessageSquare,
  AlignLeft,
  X,
  FileUp,
  RefreshCw,
  SlidersHorizontal,
  CheckCheck,
  AlertCircle,
  FolderOpen,
  Info,
  Calendar,
  CheckSquare,
  BarChart2,
  Sliders,
  ShieldCheck,
  FileCode,
  Zap,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { db } from '../../services/db';
import { Question, QuestionType, DifficultyLevel, QuestionStatus } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { aiService, GeneratedQuestion, AIGenerationOptions } from '../../services/aiService';

export const QuestionBankPage: React.FC = () => {
  const { showToast } = useToast();

  // --- Main Bank State ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allClasses = useMemo(() => db.getClasses(), []);
  const allTopics = useMemo(() => db.getTopics(), [questions]);

  // Bulk actions selection
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Delete confirm dialog
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Detail preview modal
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);

  // =========================================================================
  // 1. AI QUESTION GENERATOR MODAL STATE (Section 6 & 7)
  // =========================================================================
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSourceType, setAiSourceType] = useState<'text' | 'file'>('text');
  const [aiTopic, setAiTopic] = useState('Phương trình bậc hai và Định lý Vi-ét');
  const [aiLessonContent, setAiLessonContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; content: string } | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // Classification (Phân loại)
  const [aiGrade, setAiGrade] = useState<number>(9);
  const [aiSubject, setAiSubject] = useState('Toán học');
  const [aiChapter, setAiChapter] = useState('Chương IV: Hàm số y = ax² - Phương trình bậc hai một ẩn');
  const [aiLesson, setAiLesson] = useState('Bài 4: Công thức nghiệm của phương trình bậc hai');
  const [aiTagsInput, setAiTagsInput] = useState('Định lý Vi-ét, GDPT 2018, Đề thi vào 10');

  // Generation Config (Cấu hình sinh câu hỏi)
  const [aiTotalCount, setAiTotalCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<'mixed' | DifficultyLevel>('mixed');
  const [aiSelectedTypes, setAiSelectedTypes] = useState<QuestionType[]>([
    'single',
    'true_false',
    'multiple',
    'matching',
    'fill_blank',
    'short_answer',
    'passage_based',
    'essay',
    'ordering',
  ]);
  const [aiIncludeAnswer, setAiIncludeAnswer] = useState(true);
  const [aiIncludeExplanation, setAiIncludeExplanation] = useState(true);
  const [aiIncludeWhyCorrect, setAiIncludeWhyCorrect] = useState(true);
  const [aiIncludeRubric, setAiIncludeRubric] = useState(true);

  // AI Execution state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState<string>('');
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [proposedQuestions, setProposedQuestions] = useState<GeneratedQuestion[]>([]);
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(new Set());

  // Inline edit state for proposed questions
  const [editingProposedIdx, setEditingProposedIdx] = useState<number | null>(null);
  const [editProposedDraft, setEditProposedDraft] = useState<GeneratedQuestion | null>(null);

  // =========================================================================
  // 2. MANUAL CREATE / EDIT MODAL (Section 12)
  // =========================================================================
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [manualSubject, setManualSubject] = useState('Toán học');
  const [manualGrade, setManualGrade] = useState(9);
  const [manualChapter, setManualChapter] = useState('');
  const [manualLesson, setManualLesson] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [manualType, setManualType] = useState<QuestionType>('single');
  const [manualDifficulty, setManualDifficulty] = useState<DifficultyLevel>('medium');
  const [manualStatus, setManualStatus] = useState<QuestionStatus>('approved');
  const [manualContent, setManualContent] = useState('');
  const [manualPassage, setManualPassage] = useState('');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualWhyCorrect, setManualWhyCorrect] = useState('');
  const [manualRubric, setManualRubric] = useState('');
  const [manualTags, setManualTags] = useState('');

  // Type-specific manual fields
  const [manualOptA, setManualOptA] = useState('');
  const [manualOptB, setManualOptB] = useState('');
  const [manualOptC, setManualOptC] = useState('');
  const [manualOptD, setManualOptD] = useState('');
  const [manualCorrectAns, setManualCorrectAns] = useState('A');
  const [manualMultipleAns, setManualMultipleAns] = useState<string[]>(['A']);

  // True/False 4 sub-statements
  const [tfA, setTfA] = useState({ text: '', isCorrect: true });
  const [tfB, setTfB] = useState({ text: '', isCorrect: false });
  const [tfC, setTfC] = useState({ text: '', isCorrect: true });
  const [tfD, setTfD] = useState({ text: '', isCorrect: false });

  // Matching pairs
  const [pair1, setPair1] = useState({ left: '', right: '' });
  const [pair2, setPair2] = useState({ left: '', right: '' });
  const [pair3, setPair3] = useState({ left: '', right: '' });
  const [pair4, setPair4] = useState({ left: '', right: '' });

  // Ordering items
  const [orderItemsText, setOrderItemsText] = useState('Bước 1: Chọn ẩn số\nBước 2: Lập phương trình\nBước 3: Giải phương trình\nBước 4: Đối chiếu điều kiện và kết luận');

  // Fill in blanks & short answer
  const [manualBlankAnswer, setManualBlankAnswer] = useState('');

  // =========================================================================
  // 3. IMPORT WORD / EXCEL & VALIDATION MODAL (Section 13)
  // =========================================================================
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<Question[]>([]);
  const [importErrors, setImportErrors] = useState<{ line: number; message: string; type: 'error' | 'warning' }[]>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<{ index: number; matchedTitle: string; similarity: number }[]>([]);
  const fileImportInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 4. BATCH MCQ TEXT IMPORT MODAL (Quick Add)
  // =========================================================================
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchSubject, setBatchSubject] = useState('Toán học');
  const [batchGrade, setBatchGrade] = useState(9);

  // =========================================================================
  // 5. EXPORT MODAL STATE (Section 14)
  // =========================================================================
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'word' | 'excel' | 'pdf'>('word');
  const [exportScope, setExportScope] = useState<'selected' | 'filtered' | 'all'>('filtered');
  const [exportMode, setExportMode] = useState<'with_answers' | 'student_only'>('with_answers');

  // Load questions from db
  useEffect(() => {
    const loadQuestions = () => {
      setQuestions(db.getQuestions());
    };
    loadQuestions();
    return db.subscribe(loadQuestions);
  }, []);

  // Preset loading for AI config
  useEffect(() => {
    try {
      const saved = localStorage.getItem('thcs_tv_ai_question_preset');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.subject) setAiSubject(parsed.subject);
        if (parsed.grade) setAiGrade(parsed.grade);
        if (parsed.chapter) setAiChapter(parsed.chapter);
        if (parsed.count) setAiTotalCount(parsed.count);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // --- Subject & Meta lists ---
  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lý', 'Tin học', 'GDCD'];
  const grades = [6, 7, 8, 9];

  const questionTypeLabels: Record<QuestionType, { label: string; color: string; desc: string }> = {
    single: { label: 'Trắc nghiệm 1 đáp án', color: 'bg-blue-950/80 text-blue-300 border-blue-800', desc: 'Chọn 1 phương án đúng A/B/C/D' },
    multiple: { label: 'Nhiều đáp án đúng', color: 'bg-purple-950/80 text-purple-300 border-purple-800', desc: 'Chọn các phương án đúng' },
    true_false: { label: 'Đúng / Sai từng ý', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800', desc: 'Chuẩn 4 ý a,b,c,d GDPT 2018' },
    matching: { label: 'Ghép đôi', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-800', desc: 'Nối Cột A với Cột B' },
    ordering: { label: 'Sắp xếp thứ tự', color: 'bg-teal-950/80 text-teal-300 border-teal-800', desc: 'Sắp xếp các bước/quy trình' },
    fill_blank: { label: 'Điền khuyết', color: 'bg-amber-950/80 text-amber-300 border-amber-800', desc: 'Điền vào chỗ trống [_____]' },
    short_answer: { label: 'Trả lời ngắn', color: 'bg-sky-950/80 text-sky-300 border-sky-800', desc: 'Nhập đáp số hoặc từ khóa' },
    essay: { label: 'Tự luận', color: 'bg-rose-950/80 text-rose-300 border-rose-800', desc: 'Tự luận có thang điểm Rubric' },
    passage_based: { label: 'Đoạn văn / Tình huống', color: 'bg-violet-950/80 text-violet-300 border-violet-800', desc: 'Đọc hiểu tình huống thực tế' },
  };

  const difficultyLabels: Record<DifficultyLevel, { label: string; badge: string; color: string }> = {
    easy: { label: 'Nhận biết', badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-800', color: 'text-emerald-400' },
    medium: { label: 'Thông hiểu', badge: 'bg-blue-950/80 text-cyan-400 border-cyan-800', color: 'text-cyan-400' },
    hard: { label: 'Vận dụng', badge: 'bg-amber-950/80 text-amber-400 border-amber-800', color: 'text-amber-400' },
    very_hard: { label: 'Vận dụng cao', badge: 'bg-rose-950/80 text-rose-400 border-rose-800', color: 'text-rose-400' },
  };

  const statusLabels: Record<QuestionStatus, { label: string; badge: string; dot: string }> = {
    approved: { label: 'Đã duyệt', badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800', dot: 'bg-emerald-400' },
    pending: { label: 'Chờ duyệt', badge: 'bg-amber-950/80 text-amber-300 border-amber-800', dot: 'bg-amber-400' },
    draft: { label: 'Bản nháp', badge: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400' },
    flagged: { label: 'Có cảnh báo', badge: 'bg-rose-950/80 text-rose-300 border-rose-800', dot: 'bg-rose-400' },
  };

  // --- Real dynamic metrics (Section 5) ---
  const stats = useMemo(() => {
    const total = questions.length;
    let approved = 0;
    let pending = 0;
    let draft = 0;
    let flagged = 0;

    questions.forEach(q => {
      const s = q.status || 'approved';
      if (s === 'approved') approved++;
      else if (s === 'pending') pending++;
      else if (s === 'draft') draft++;

      if (s === 'flagged' || (q.qualityScore && q.qualityScore < 75) || Boolean(q.qualityWarning)) {
        flagged++;
      }
    });

    return { total, approved, pending, draft, flagged };
  }, [questions]);

  // --- Unique tags list for filter ---
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      q.tags?.forEach(t => set.add(t));
    });
    return Array.from(set).slice(0, 15);
  }, [questions]);

  // --- Filtering Logic ---
  const filteredQuestions = useMemo(() => {
    const selectedClassObj = selectedClassId !== 'all' ? allClasses.find(c => c.id === selectedClassId) : undefined;
    const classTopicQuestionIds = new Set<string>();
    if (selectedClassId !== 'all') {
      allTopics
        .filter(t => t.classId === selectedClassId)
        .forEach(t => t.questionIds?.forEach(qid => classTopicQuestionIds.add(qid)));
    }

    const matchingTopicQuestionIds = new Set<string>();
    const topicQuery = topicSearchQuery.toLowerCase().trim();
    if (topicQuery) {
      allTopics
        .filter(t => (t.title || t.name || '').toLowerCase().includes(topicQuery))
        .forEach(t => t.questionIds?.forEach(qid => matchingTopicQuestionIds.add(qid)));
    }

    return questions.filter(q => {
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
      if (selectedGrade !== 'all' && q.grade !== selectedGrade) return false;
      if (selectedType !== 'all' && q.type !== selectedType) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;

      if (selectedClassId !== 'all') {
        const inClassTopic = classTopicQuestionIds.has(q.id);
        const matchesGrade = selectedClassObj ? q.grade === selectedClassObj.gradeLevel : false;
        const matchesTag = selectedClassObj ? q.tags?.some(tag => tag.toLowerCase().includes(selectedClassObj.name.toLowerCase())) : false;
        if (!inClassTopic && !matchesGrade && !matchesTag) return false;
      }

      if (topicQuery) {
        const inTopicField = (q.topic || '').toLowerCase().includes(topicQuery);
        const inChapterOrLesson = (q.chapter || '').toLowerCase().includes(topicQuery) || (q.lesson || '').toLowerCase().includes(topicQuery);
        const inLinkedTopic = matchingTopicQuestionIds.has(q.id);
        const inTags = q.tags?.some(t => t.toLowerCase().includes(topicQuery));
        if (!inTopicField && !inChapterOrLesson && !inLinkedTopic && !inTags) return false;
      }

      const qStatus = q.status || 'approved';
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'flagged') {
          if (qStatus !== 'flagged' && (!q.qualityWarning || (q.qualityScore && q.qualityScore >= 75))) {
            return false;
          }
        } else if (qStatus !== selectedStatus) {
          return false;
        }
      }

      if (selectedTag !== 'all' && !q.tags?.includes(selectedTag)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inContent = q.content.toLowerCase().includes(query);
        const inTopic = q.topic?.toLowerCase().includes(query);
        const inPassage = q.passage?.toLowerCase().includes(query);
        const inTags = q.tags?.some(t => t.toLowerCase().includes(query));
        const inExp = q.explanation?.toLowerCase().includes(query);
        if (!inContent && !inTopic && !inPassage && !inTags && !inExp) return false;
      }

      return true;
    });
  }, [questions, allClasses, allTopics, selectedClassId, topicSearchQuery, selectedSubject, selectedGrade, selectedType, selectedDifficulty, selectedStatus, selectedTag, searchQuery]);

  // Reset filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setTopicSearchQuery('');
    setSelectedClassId('all');
    setSelectedSubject('all');
    setSelectedGrade('all');
    setSelectedType('all');
    setSelectedDifficulty('all');
    setSelectedStatus('all');
    setSelectedTag('all');
  };

  // --- Checkbox Selection ---
  const isAllSelected = filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.has(q.id));
  const isPartiallySelected = filteredQuestions.some(q => selectedQuestionIds.has(q.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedQuestionIds(new Set());
    } else {
      const next = new Set<string>();
      filteredQuestions.forEach(q => next.add(q.id));
      setSelectedQuestionIds(next);
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Single & Bulk Deletes ---
  const handleConfirmSingleDelete = () => {
    if (!deleteTargetId) return;
    db.deleteQuestion(deleteTargetId);
    setDeleteTargetId(null);
    showToast('Đã xóa câu hỏi khỏi ngân hàng.', 'info');
  };

  const handleConfirmBulkDelete = () => {
    const count = db.deleteQuestions(Array.from(selectedQuestionIds));
    setSelectedQuestionIds(new Set());
    setIsBulkDeleteModalOpen(false);
    showToast(`Đã xóa thành công ${count} câu hỏi đã chọn.`, 'success');
  };

  // --- Bulk status change ---
  const handleBulkChangeStatus = (status: QuestionStatus) => {
    if (selectedQuestionIds.size === 0) return;
    const count = db.bulkUpdateQuestionStatus(Array.from(selectedQuestionIds), status);
    showToast(`Đã cập nhật trạng thái "${statusLabels[status].label}" cho ${count} câu hỏi.`, 'success');
    setSelectedQuestionIds(new Set());
  };

  // --- Duplicate single question ---
  const handleDuplicateQuestion = (q: Question) => {
    const copyData = {
      ...q,
      content: `${q.content} (Bản sao)`,
      status: 'draft' as QuestionStatus,
    };
    const newQ = db.createQuestion(copyData);
    showToast(`Đã nhân bản câu hỏi #${newQ.id.slice(-4)} vào danh sách bản nháp!`, 'success');
  };

  // =========================================================================
  // AI GENERATOR HANDLERS (Section 6 & 7)
  // =========================================================================
  const handleFileUploadForAI = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    const reader = new FileReader();
    reader.onload = evt => {
      const text = String(evt.target?.result || '');
      setUploadedFile({
        name: file.name,
        size: sizeStr,
        content: text.slice(0, 5000),
      });
      setAiLessonContent(text.slice(0, 5000));
      showToast(`Đã tải lên tệp ${file.name} (${sizeStr})`, 'info');
    };
    reader.readAsText(file);
  };

  const handleRemoveAIFile = () => {
    setUploadedFile(null);
    setAiLessonContent('');
    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
  };

  const handleSaveAIConfigPreset = () => {
    const preset = {
      subject: aiSubject,
      grade: aiGrade,
      chapter: aiChapter,
      count: aiTotalCount,
    };
    localStorage.setItem('thcs_tv_ai_question_preset', JSON.stringify(preset));
    showToast('Đã lưu cấu hình tạo câu hỏi AI vào thiết lập cá nhân!', 'success');
  };

  const executeAIGeneration = async (useFallbackPedagogy = false) => {
    setIsGeneratingAI(true);
    setAiErrorMessage(null);
    setAiProgressStep('Đang chuẩn bị dữ liệu & đối soát chương trình GDPT...');

    const payload: AIGenerationOptions = {
      topic: aiTopic,
      lessonContent: aiSourceType === 'file' && uploadedFile ? uploadedFile.content : aiLessonContent,
      subject: aiSubject,
      grade: Number(aiGrade),
      chapter: aiChapter,
      lesson: aiLesson,
      questionTypes: aiSelectedTypes.length > 0 ? aiSelectedTypes : ['single', 'true_false', 'multiple'],
      difficulty: aiDifficulty,
      count: aiTotalCount,
      includeAnswer: aiIncludeAnswer,
      includeExplanation: aiIncludeExplanation,
      includeWhyCorrect: aiIncludeWhyCorrect,
      includeRubric: aiIncludeRubric,
    };

    try {
      let results: any[] = [];
      if (useFallbackPedagogy) {
        setAiProgressStep('Đang khởi tạo bộ câu hỏi sư phạm chuẩn hóa (Pedagogical Engine)...');
        await new Promise(r => setTimeout(r, 600));
        results = aiService.generateFallbackQuestions(payload);
      } else {
        setAiProgressStep('Đang kết nối mô hình Gemini qua máy chủ an toàn...');
        try {
          results = await aiService.generateQuestionsAdvanced(payload);
        } catch (apiErr: any) {
          console.warn('API error, falling back to pedagogical engine:', apiErr);
          setAiProgressStep('Đang chuyển hướng sang Pedagogical Engine chuẩn GDPT 2018...');
          await new Promise(r => setTimeout(r, 500));
          results = aiService.generateFallbackQuestions(payload);
        }
      }

      if (!results || results.length === 0) {
        results = aiService.generateFallbackQuestions(payload);
      }

      // Theo yêu cầu: khi user bấm Auto tạo câu hỏi thì toàn bộ câu hỏi tạo ra sẽ nằm trong tab Chờ duyệt của Ngân hàng câu hỏi
      const questionsToSave = results.map(q => ({
        subject: aiSubject,
        grade: Number(aiGrade),
        chapter: aiChapter || q.chapter || '',
        lesson: aiLesson || q.lesson || '',
        topic: aiTopic || q.topic || 'Tổng hợp',
        type: q.type || 'single',
        content: q.content,
        passage: q.passage,
        options: q.options,
        correctAnswer: q.correctAnswer,
        subQuestions: q.subQuestions,
        matchingPairs: q.matchingPairs,
        orderingItems: q.orderingItems,
        explanation: q.explanation || 'Đang cập nhật lời giải chi tiết.',
        whyCorrect: q.whyCorrect,
        rubric: q.rubric,
        difficulty: q.difficulty || 'medium',
        status: 'pending' as const, // Toàn bộ câu hỏi auto tạo ra được đưa về tab 'Chờ duyệt'
        qualityScore: q.qualityScore ?? 92,
        qualityWarning: q.qualityWarning,
        tags: [aiSubject, `Khối ${aiGrade}`, aiTopic, questionTypeLabels[q.type as QuestionType]?.label || ''].filter(Boolean),
      }));

      const added = db.addBatchQuestions(questionsToSave);

      // Tự động chuyển thẳng sang tab 'Chờ duyệt' để giáo viên kiểm tra và duyệt
      setSelectedStatus('pending');
      setIsAIModalOpen(false);
      setProposedQuestions([]);

      showToast(`✓ Đã tự động tạo thành công ${added.length} câu hỏi và chuyển vào tab "Chờ duyệt"!`, 'success');
    } catch (err: any) {
      console.error('Lỗi khi tạo câu hỏi bằng AI:', err);
      const msg = err?.message || 'Lỗi không xác định khi gọi AI.';
      setAiErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsGeneratingAI(false);
      setAiProgressStep('');
    }
  };

  // Duyệt 1 câu hỏi từ tab Chờ duyệt sang tab Đã duyệt
  const handleApproveSingleQuestion = (questionId: string) => {
    const updated = db.updateQuestion(questionId, { status: 'approved' });
    if (updated) {
      showToast('✓ Đã duyệt câu hỏi thành công! Câu hỏi đã được chuyển sang tab Đã duyệt.', 'success');
    }
  };

  // Duyệt nhanh tất cả câu hỏi trong tab Chờ duyệt
  const handleApproveAllPending = () => {
    const pendingQuestions = questions.filter(q => (q.status || 'approved') === 'pending');
    if (pendingQuestions.length === 0) {
      showToast('Không có câu hỏi nào đang ở trạng thái Chờ duyệt!', 'info');
      return;
    }
    pendingQuestions.forEach(q => {
      db.updateQuestion(q.id, { status: 'approved' });
    });
    showToast(`✓ Đã duyệt thành công toàn bộ ${pendingQuestions.length} câu hỏi sang tab "Đã duyệt"!`, 'success');
  };

  const handleToggleApproveProposed = (idx: number) => {
    setApprovedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSelectAllProposed = () => {
    if (approvedIndices.size === proposedQuestions.length) {
      setApprovedIndices(new Set());
    } else {
      setApprovedIndices(new Set(proposedQuestions.map((_, i) => i)));
    }
  };

  const handleRemoveProposed = (idx: number) => {
    setProposedQuestions(prev => prev.filter((_, i) => i !== idx));
    setApprovedIndices(prev => {
      const next = new Set<number>();
      prev.forEach(val => {
        if (val < idx) next.add(val);
        else if (val > idx) next.add(val - 1);
      });
      return next;
    });
    showToast('Đã loại bỏ câu hỏi khỏi danh sách đề xuất.', 'info');
  };

  // Open inline edit for proposed question
  const handleOpenEditProposed = (idx: number) => {
    setEditingProposedIdx(idx);
    setEditProposedDraft(JSON.parse(JSON.stringify(proposedQuestions[idx])));
  };

  const handleSaveEditProposed = () => {
    if (editingProposedIdx === null || !editProposedDraft) return;
    setProposedQuestions(prev => {
      const next = [...prev];
      next[editingProposedIdx] = editProposedDraft;
      return next;
    });
    setEditingProposedIdx(null);
    setEditProposedDraft(null);
    showToast('Đã cập nhật chỉnh sửa cho câu hỏi!', 'success');
  };

  // Save approved questions into Database
  const handleSaveApprovedToBank = () => {
    if (approvedIndices.size === 0) {
      showToast('Vui lòng chọn ít nhất 1 câu hỏi để duyệt và lưu vào Ngân hàng!', 'warning');
      return;
    }

    let addedCount = 0;
    proposedQuestions.forEach((q, idx) => {
      if (approvedIndices.has(idx)) {
        db.createQuestion({
          subject: aiSubject,
          grade: Number(aiGrade),
          chapter: aiChapter || q.chapter,
          lesson: aiLesson || q.lesson,
          topic: aiTopic || q.topic || 'Tổng hợp',
          type: q.type,
          content: q.content,
          passage: q.passage,
          options: q.options,
          correctAnswer: q.correctAnswer,
          subQuestions: q.subQuestions,
          matchingPairs: q.matchingPairs,
          orderingItems: q.orderingItems,
          explanation: q.explanation || 'Đang cập nhật lời giải.',
          whyCorrect: q.whyCorrect,
          rubric: q.rubric,
          difficulty: q.difficulty,
          status: 'approved',
          qualityScore: q.qualityScore ?? 95,
          qualityWarning: q.qualityWarning,
          tags: [aiSubject, `Khối ${aiGrade}`, aiTopic, questionTypeLabels[q.type]?.label || ''].filter(Boolean),
        });
        addedCount++;
      }
    });

    showToast(`Đã duyệt và lưu thành công ${addedCount} câu hỏi vào Ngân hàng!`, 'success');
    setIsAIModalOpen(false);
    setProposedQuestions([]);
  };

  // =========================================================================
  // SIMILARITY & DUPLICATE DETECTION (Section 13)
  // =========================================================================
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9à-ỹ\s]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9à-ỹ\s]/g, '');
    if (s1 === s2) return 1.0;
    const words1 = new Set(s1.split(/\s+/).filter(Boolean));
    const words2 = new Set(s2.split(/\s+/).filter(Boolean));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  };

  const parseTextQuestions = (rawText: string) => {
    const lines = rawText.split('\n');
    const parsed: Question[] = [];
    const errors: { line: number; message: string; type: 'error' | 'warning' }[] = [];
    const duplicates: { index: number; matchedTitle: string; similarity: number }[] = [];

    let currentQ: Partial<Question> | null = null;
    let currentOptions: { id: string; text: string }[] = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineNum = lineIdx + 1;
      const trimmed = line.trim();
      if (!trimmed) continue;

      const qMatch = trimmed.match(/^(?:Câu\s*(\d+)[:.]|(\d+)[.:]\s*)(.*)/i);
      if (qMatch) {
        if (currentQ && currentQ.content) {
          finishCurrentQuestion();
        }
        currentQ = {
          id: `imp_${Date.now()}_${lineNum}`,
          subject: selectedSubject !== 'all' ? selectedSubject : 'Toán học',
          grade: selectedGrade !== 'all' ? selectedGrade : 9,
          topic: 'Nhập từ file',
          type: 'single',
          content: qMatch[3].trim() || 'Nội dung câu hỏi',
          explanation: '',
          difficulty: 'medium',
          status: 'pending',
          qualityScore: 88,
          tags: ['Import'],
        };
        currentOptions = [];
        continue;
      }

      const optMatch = trimmed.match(/^([A-D])[.:)]\s*(.*)/i);
      if (optMatch && currentQ) {
        currentOptions.push({
          id: optMatch[1].toUpperCase(),
          text: optMatch[2].trim(),
        });
        continue;
      }

      const ansMatch = trimmed.match(/^(?:Đáp\s*án|ĐA|Answer|Key)[:.]\s*([A-D]|true|false|[^\n]+)/i);
      if (ansMatch && currentQ) {
        currentQ.correctAnswer = ansMatch[1].trim().toUpperCase();
        continue;
      }

      const expMatch = trimmed.match(/^(?:Lời\s*giải|HD|Hướng\s*dẫn|Giải\s*thích)[:.]\s*(.*)/i);
      if (expMatch && currentQ) {
        currentQ.explanation = expMatch[1].trim();
        continue;
      }

      const diffMatch = trimmed.match(/^(?:Mức\s*độ|Độ\s*khó)[:.]\s*(.*)/i);
      if (diffMatch && currentQ) {
        const dText = diffMatch[1].toLowerCase();
        if (dText.includes('nhận biết') || dText.includes('dễ') || dText.includes('easy')) currentQ.difficulty = 'easy';
        else if (dText.includes('vận dụng cao') || dText.includes('khó') || dText.includes('very_hard')) currentQ.difficulty = 'very_hard';
        else if (dText.includes('vận dụng') || dText.includes('hard')) currentQ.difficulty = 'hard';
        else currentQ.difficulty = 'medium';
        continue;
      }

      if (currentQ) {
        if (currentQ.explanation) {
          currentQ.explanation += ' ' + trimmed;
        } else if (currentOptions.length === 0) {
          currentQ.content += ' ' + trimmed;
        }
      } else {
        errors.push({
          line: lineNum,
          message: `Dòng không thuộc cấu trúc câu hỏi chuẩn: "${trimmed.slice(0, 40)}..."`,
          type: 'warning',
        });
      }
    }

    if (currentQ && currentQ.content) {
      finishCurrentQuestion();
    }

    function finishCurrentQuestion() {
      if (!currentQ) return;
      if (currentOptions.length > 0) {
        currentQ.options = currentOptions;
      }

      if (!currentQ.correctAnswer) {
        errors.push({
          line: parsed.length + 1,
          message: `Câu "${currentQ.content?.slice(0, 30)}..." chưa có Đáp án đúng!`,
          type: 'error',
        });
        currentQ.correctAnswer = 'A';
      }

      if (currentQ.type === 'single' && currentOptions.length < 2) {
        errors.push({
          line: parsed.length + 1,
          message: `Câu "${currentQ.content?.slice(0, 30)}..." có ít hơn 2 phương án lựa chọn.`,
          type: 'warning',
        });
      }

      const existing = db.getQuestions();
      existing.forEach(eq => {
        const sim = calculateSimilarity(currentQ!.content || '', eq.content);
        if (sim >= 0.75) {
          duplicates.push({
            index: parsed.length,
            matchedTitle: eq.content,
            similarity: Math.round(sim * 100),
          });
        }
      });

      parsed.push(currentQ as Question);
    }

    setParsedPreviewQuestions(parsed);
    setImportErrors(errors);
    setDuplicateWarnings(duplicates);
  };

  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);

          const parsed: Question[] = [];
          const errors: { line: number; message: string; type: 'error' | 'warning' }[] = [];
          const duplicates: { index: number; matchedTitle: string; similarity: number }[] = [];

          jsonRows.forEach((row, rIdx) => {
            const lineNum = rIdx + 2;
            const content = row['Nội dung'] || row['Câu hỏi'] || row['content'] || row['Question'];
            if (!content) {
              errors.push({ line: lineNum, message: 'Dòng Excel trống cột Nội dung câu hỏi', type: 'error' });
              return;
            }

            const optA = row['Đáp án A'] || row['A'] || row['Option A'];
            const optB = row['Đáp án B'] || row['B'] || row['Option B'];
            const optC = row['Đáp án C'] || row['C'] || row['Option C'];
            const optD = row['Đáp án D'] || row['D'] || row['Option D'];
            const correct = String(row['Đáp án đúng'] || row['Đáp án'] || row['Answer'] || 'A').trim().toUpperCase();
            const exp = row['Lời giải'] || row['Giải thích'] || row['Explanation'] || '';
            const diffStr = String(row['Mức độ'] || row['Độ khó'] || 'medium').toLowerCase();

            let diff: DifficultyLevel = 'medium';
            if (diffStr.includes('nhận biết') || diffStr.includes('dễ')) diff = 'easy';
            else if (diffStr.includes('vận dụng cao') || diffStr.includes('khó')) diff = 'very_hard';
            else if (diffStr.includes('vận dụng')) diff = 'hard';

            const options: { id: string; text: string }[] = [];
            if (optA) options.push({ id: 'A', text: String(optA) });
            if (optB) options.push({ id: 'B', text: String(optB) });
            if (optC) options.push({ id: 'C', text: String(optC) });
            if (optD) options.push({ id: 'D', text: String(optD) });

            const newQ: Question = {
              id: `excel_${Date.now()}_${rIdx}`,
              subject: row['Môn học'] || (selectedSubject !== 'all' ? selectedSubject : 'Toán học'),
              grade: Number(row['Khối']) || (selectedGrade !== 'all' ? selectedGrade : 9),
              topic: row['Chủ đề'] || 'Nhập từ Excel',
              type: options.length > 0 ? 'single' : 'short_answer',
              content: String(content),
              options: options.length > 0 ? options : undefined,
              correctAnswer: correct,
              explanation: exp,
              difficulty: diff,
              status: 'pending',
              qualityScore: 90,
              tags: ['Excel Import'],
            };

            db.getQuestions().forEach(eq => {
              const sim = calculateSimilarity(newQ.content, eq.content);
              if (sim >= 0.75) {
                duplicates.push({
                  index: parsed.length,
                  matchedTitle: eq.content,
                  similarity: Math.round(sim * 100),
                });
              }
            });

            parsed.push(newQ);
          });

          setParsedPreviewQuestions(parsed);
          setImportErrors(errors);
          setDuplicateWarnings(duplicates);
          showToast(`Đã nhận diện ${parsed.length} câu hỏi từ tệp ${file.name}`, 'info');
        } catch (err) {
          showToast('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng bảng tính!', 'error');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      const reader = new FileReader();
      reader.onload = evt => {
        const text = String(evt.target?.result || '');
        setImportText(text);
        parseTextQuestions(text);
        showToast(`Đã đọc nội dung tệp ${file.name}`, 'info');
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreviewQuestions.length === 0) {
      showToast('Không có câu hỏi hợp lệ nào để nhập!', 'warning');
      return;
    }

    parsedPreviewQuestions.forEach(q => {
      db.createQuestion(q);
    });

    showToast(`Đã nhập thành công ${parsedPreviewQuestions.length} câu hỏi vào Ngân hàng!`, 'success');
    setIsImportModalOpen(false);
    setParsedPreviewQuestions([]);
    setImportText('');
  };

  // Batch MCQ text import handler
  const handleConfirmBatchMCQ = () => {
    if (!batchRawText.trim()) {
      showToast('Vui lòng dán văn bản danh sách câu hỏi trắc nghiệm!', 'warning');
      return;
    }
    parseTextQuestions(batchRawText);
    setIsBatchModalOpen(false);
    setIsImportModalOpen(true);
  };

  // =========================================================================
  // EXPORT WORD / EXCEL / PDF (Section 14)
  // =========================================================================
  const getQuestionsToExport = () => {
    if (exportScope === 'selected' && selectedQuestionIds.size > 0) {
      return questions.filter(q => selectedQuestionIds.has(q.id));
    }
    if (exportScope === 'all') {
      return questions;
    }
    return filteredQuestions;
  };

  const handleExecuteExport = () => {
    const list = getQuestionsToExport();
    if (list.length === 0) {
      showToast('Không có câu hỏi nào trong danh sách để xuất!', 'warning');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);

    if (exportFormat === 'excel') {
      const exportRows = list.map((q, idx) => ({
        STT: idx + 1,
        'Môn học': q.subject,
        'Khối lớp': q.grade,
        'Chương': q.chapter || '',
        'Bài học': q.lesson || '',
        'Chủ đề': q.topic,
        'Dạng câu hỏi': questionTypeLabels[q.type]?.label || q.type,
        'Mức độ nhận thức': difficultyLabels[q.difficulty]?.label || q.difficulty,
        'Trạng thái': statusLabels[q.status || 'approved']?.label || q.status,
        'Nội dung câu hỏi': q.content,
        'Đáp án A': q.options?.find(o => o.id === 'A')?.text || '',
        'Đáp án B': q.options?.find(o => o.id === 'B')?.text || '',
        'Đáp án C': q.options?.find(o => o.id === 'C')?.text || '',
        'Đáp án D': q.options?.find(o => o.id === 'D')?.text || '',
        ...(exportMode === 'with_answers'
          ? {
              'Đáp án đúng': Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer,
              'Lời giải chi tiết': q.explanation,
              'Giải thích tại sao đúng': q.whyCorrect || '',
              'Hướng dẫn chấm (Rubric)': q.rubric || '',
            }
          : {}),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'NganHangCauHoi');
      XLSX.writeFile(workbook, `THCS_Trung_Vuong_Ngan_Hang_Cau_Hoi_${timestamp}.xlsx`);
      showToast(`Đã xuất ${list.length} câu hỏi sang Excel thành công!`, 'success');
      setIsExportModalOpen(false);
      return;
    }

    if (exportFormat === 'word') {
      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Ngân hàng câu hỏi - THCS Trưng Vương</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.45; color: #000; }
            .header-table { width: 100%; border: none; margin-bottom: 25px; }
            .header-table td { border: none; font-size: 11pt; text-align: center; }
            .main-title { font-size: 16pt; font-weight: bold; text-transform: uppercase; text-align: center; margin: 15px 0 5px 0; }
            .sub-title { font-size: 12pt; text-align: center; font-style: italic; margin-bottom: 25px; }
            .q-card { margin-bottom: 20px; page-break-inside: avoid; }
            .q-title { font-weight: bold; }
            .options-grid { margin-left: 20px; margin-top: 5px; }
            .opt-row { margin-bottom: 4px; }
            .ans-box { background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; padding: 8px 12px; margin-top: 8px; font-size: 11.5pt; }
            .ans-key { font-weight: bold; color: #1d4ed8; }
            table.sheet { width: 100%; border-collapse: collapse; margin-top: 15px; }
            table.sheet th, table.sheet td { border: 1px solid #333; padding: 6px 8px; font-size: 11pt; text-align: center; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 45%;">
                UBND QUẬN HOÀN KIẾM<br>
                <strong>TRƯỜNG THCS TRƯNG VƯƠNG</strong><br>
                <em>Hội đồng Khoa học & Sư phạm</em>
              </td>
              <td style="width: 55%;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
                Độc lập - Tự do - Hạnh phúc<br>
                <em>Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em>
              </td>
            </tr>
          </table>

          <div class="main-title">NGÂN HÀNG CÂU HỎI VÀ ĐỀ THI CHUẨN HÓA</div>
          <div class="sub-title">${exportMode === 'student_only' ? 'PHIẾU ĐỀ BÀI DÀNH CHO HỌC SINH' : 'TÀI LIỆU SƯ PHẠM KÈM HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT'}</div>

          <h3 style="text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 4px;">PHẦN I: DANH SÁCH CÂU HỎI</h3>
          ${list.map((q, idx) => `
            <div class="q-card">
              <div class="q-title">Câu ${idx + 1} (${difficultyLabels[q.difficulty]?.label} - ${q.subject}): ${q.content}</div>
              ${q.passage ? `<div style="font-style: italic; background: #f1f5f9; padding: 8px; margin: 6px 0; border-radius: 4px;">[Ngữ cảnh/Tình huống]: ${q.passage}</div>` : ''}
              ${q.options && q.options.length > 0 ? `
                <div class="options-grid">
                  ${q.options.map(o => `<div class="opt-row"><strong>${o.id}.</strong> ${o.text}</div>`).join('')}
                </div>
              ` : ''}
              ${q.subQuestions && q.subQuestions.length > 0 ? `
                <div style="margin-left: 20px; margin-top: 6px;">
                  ${q.subQuestions.map(sq => `<div><strong>${sq.id})</strong> ${sq.statement}</div>`).join('')}
                </div>
              ` : ''}
              ${q.matchingPairs && q.matchingPairs.length > 0 ? `
                <div style="margin-left: 20px; margin-top: 6px;">
                  <em>Các cặp ghép nối:</em>
                  ${q.matchingPairs.map(p => `<div>• <strong>${p.left}</strong> ghép với <strong>${p.right}</strong></div>`).join('')}
                </div>
              ` : ''}
              ${q.orderingItems && q.orderingItems.length > 0 ? `
                <div style="margin-left: 20px; margin-top: 6px;">
                  ${q.orderingItems.map(item => `<div>• ${item}</div>`).join('')}
                </div>
              ` : ''}

              ${exportMode === 'with_answers' ? `
                <div class="ans-box">
                  <div class="ans-key">ĐÁP ÁN: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</div>
                  <div style="margin-top: 4px;"><strong>Lời giải chi tiết:</strong> ${q.explanation}</div>
                  ${q.whyCorrect ? `<div style="margin-top: 4px;"><strong>Giải thích tại sao đúng:</strong> ${q.whyCorrect}</div>` : ''}
                  ${q.rubric ? `<div style="margin-top: 4px; color: #b45309;"><strong>Barem điểm / Hướng dẫn chấm:</strong><br>${q.rubric.replace(/\n/g, '<br>')}</div>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}

          ${exportMode === 'with_answers' ? `
            <br clear=all style='page-break-before:always' />
            <h3 style="text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 4px;">PHẦN II: MA TRẬN & BẢNG ĐÁP ÁN NHANH</h3>
            <table class="sheet">
              <thead>
                <tr><th>STT</th><th>Câu số</th><th>Môn học</th><th>Dạng bài</th><th>Mức độ</th><th>Đáp án đúng</th></tr>
              </thead>
              <tbody>
                ${list.map((q, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>Câu ${idx + 1}</strong></td>
                    <td>${q.subject}</td>
                    <td>${questionTypeLabels[q.type]?.label}</td>
                    <td>${difficultyLabels[q.difficulty]?.label}</td>
                    <td style="font-weight: bold; color: #1d4ed8;">${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `THCS_Trung_Vuong_Ngan_Hang_Cau_Hoi_${exportMode}_${timestamp}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Đã xuất ${list.length} câu hỏi sang Word (.doc) thành công!`, 'success');
      setIsExportModalOpen(false);
      return;
    }

    if (exportFormat === 'pdf') {
      window.print();
      setIsExportModalOpen(false);
    }
  };

  // =========================================================================
  // MANUAL CREATE / EDIT HANDLERS (Section 12)
  // =========================================================================
  const handleOpenManualCreate = () => {
    setEditingQuestionId(null);
    setManualSubject(selectedSubject !== 'all' ? selectedSubject : 'Toán học');
    setManualGrade(selectedGrade !== 'all' ? selectedGrade : 9);
    setManualChapter('');
    setManualLesson('');
    setManualTopic('');
    setManualType('single');
    setManualDifficulty('medium');
    setManualStatus('approved');
    setManualContent('');
    setManualPassage('');
    setManualExplanation('');
    setManualWhyCorrect('');
    setManualRubric('');
    setManualTags('');

    setManualOptA('');
    setManualOptB('');
    setManualOptC('');
    setManualOptD('');
    setManualCorrectAns('A');
    setManualMultipleAns(['A']);

    setTfA({ text: '', isCorrect: true });
    setTfB({ text: '', isCorrect: false });
    setTfC({ text: '', isCorrect: true });
    setTfD({ text: '', isCorrect: false });

    setPair1({ left: '', right: '' });
    setPair2({ left: '', right: '' });
    setPair3({ left: '', right: '' });
    setPair4({ left: '', right: '' });

    setOrderItemsText('');
    setManualBlankAnswer('');

    setIsManualModalOpen(true);
  };

  const handleOpenManualEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setManualSubject(q.subject);
    setManualGrade(q.grade);
    setManualChapter(q.chapter || '');
    setManualLesson(q.lesson || '');
    setManualTopic(q.topic);
    setManualType(q.type);
    setManualDifficulty(q.difficulty);
    setManualStatus(q.status || 'approved');
    setManualContent(q.content);
    setManualPassage(q.passage || '');
    setManualExplanation(q.explanation);
    setManualWhyCorrect(q.whyCorrect || '');
    setManualRubric(q.rubric || '');
    setManualTags(q.tags?.join(', ') || '');

    // Options
    setManualOptA(q.options?.find(o => o.id === 'A')?.text || '');
    setManualOptB(q.options?.find(o => o.id === 'B')?.text || '');
    setManualOptC(q.options?.find(o => o.id === 'C')?.text || '');
    setManualOptD(q.options?.find(o => o.id === 'D')?.text || '');
    if (Array.isArray(q.correctAnswer)) {
      setManualMultipleAns(q.correctAnswer);
      setManualCorrectAns(q.correctAnswer[0] || 'A');
    } else {
      setManualCorrectAns(q.correctAnswer || 'A');
      setManualMultipleAns([q.correctAnswer || 'A']);
    }

    // Sub-questions
    if (q.subQuestions && q.subQuestions.length >= 4) {
      setTfA({ text: q.subQuestions[0].statement, isCorrect: q.subQuestions[0].isCorrect });
      setTfB({ text: q.subQuestions[1].statement, isCorrect: q.subQuestions[1].isCorrect });
      setTfC({ text: q.subQuestions[2].statement, isCorrect: q.subQuestions[2].isCorrect });
      setTfD({ text: q.subQuestions[3].statement, isCorrect: q.subQuestions[3].isCorrect });
    }

    // Matching
    if (q.matchingPairs && q.matchingPairs.length > 0) {
      setPair1(q.matchingPairs[0] || { left: '', right: '' });
      setPair2(q.matchingPairs[1] || { left: '', right: '' });
      setPair3(q.matchingPairs[2] || { left: '', right: '' });
      setPair4(q.matchingPairs[3] || { left: '', right: '' });
    }

    if (q.orderingItems) {
      setOrderItemsText(q.orderingItems.join('\n'));
    }

    setManualBlankAnswer(Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || '');

    setIsManualModalOpen(true);
  };

  const handleSaveManualQuestion = () => {
    if (!manualContent.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi!', 'warning');
      return;
    }

    const tagsArray = manualTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    let options: { id: string; text: string }[] | undefined;
    let correctAnswer: string | string[] = manualCorrectAns;
    let subQuestions: { id: string; statement: string; isCorrect: boolean }[] | undefined;
    let matchingPairs: { left: string; right: string }[] | undefined;
    let orderingItems: string[] | undefined;

    if (manualType === 'single') {
      options = [
        { id: 'A', text: manualOptA || 'Phương án A' },
        { id: 'B', text: manualOptB || 'Phương án B' },
        { id: 'C', text: manualOptC || 'Phương án C' },
        { id: 'D', text: manualOptD || 'Phương án D' },
      ];
      correctAnswer = manualCorrectAns;
    } else if (manualType === 'multiple') {
      options = [
        { id: 'A', text: manualOptA || 'Phương án A' },
        { id: 'B', text: manualOptB || 'Phương án B' },
        { id: 'C', text: manualOptC || 'Phương án C' },
        { id: 'D', text: manualOptD || 'Phương án D' },
      ];
      correctAnswer = manualMultipleAns;
    } else if (manualType === 'true_false') {
      subQuestions = [
        { id: 'a', statement: tfA.text || 'Mệnh đề a', isCorrect: tfA.isCorrect },
        { id: 'b', statement: tfB.text || 'Mệnh đề b', isCorrect: tfB.isCorrect },
        { id: 'c', statement: tfC.text || 'Mệnh đề c', isCorrect: tfC.isCorrect },
        { id: 'd', statement: tfD.text || 'Mệnh đề d', isCorrect: tfD.isCorrect },
      ];
      correctAnswer = [tfA.isCorrect ? 'true' : 'false', tfB.isCorrect ? 'true' : 'false', tfC.isCorrect ? 'true' : 'false', tfD.isCorrect ? 'true' : 'false'];
    } else if (manualType === 'matching') {
      matchingPairs = [pair1, pair2, pair3, pair4].filter(p => p.left.trim() && p.right.trim());
      correctAnswer = '1-A, 2-B, 3-C, 4-D';
    } else if (manualType === 'ordering') {
      orderingItems = orderItemsText.split('\n').filter(s => s.trim().length > 0);
      correctAnswer = orderingItems.join(' -> ');
    } else if (manualType === 'fill_blank' || manualType === 'short_answer') {
      correctAnswer = manualBlankAnswer.trim() || 'Đáp án';
    } else if (manualType === 'essay') {
      correctAnswer = manualBlankAnswer || 'Lời giải chi tiết';
    }

    const payload = {
      subject: manualSubject,
      grade: manualGrade,
      chapter: manualChapter,
      lesson: manualLesson,
      topic: manualTopic || 'Kiến thức chung',
      type: manualType,
      content: manualContent,
      passage: manualPassage,
      options,
      correctAnswer,
      subQuestions,
      matchingPairs,
      orderingItems,
      explanation: manualExplanation || 'Chưa cập nhật lời giải.',
      whyCorrect: manualWhyCorrect,
      rubric: manualRubric,
      difficulty: manualDifficulty,
      status: manualStatus,
      qualityScore: 95,
      tags: tagsArray.length > 0 ? tagsArray : [manualSubject, `Khối ${manualGrade}`],
    };

    if (editingQuestionId) {
      db.updateQuestion(editingQuestionId, payload);
      showToast('Đã cập nhật câu hỏi thành công!', 'success');
    } else {
      db.createQuestion(payload);
      showToast('Đã tạo câu hỏi mới vào Ngân hàng!', 'success');
    }

    setIsManualModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        breadcrumbItems={[
          { label: 'Dạy và Học' },
          { label: 'Ngân hàng câu hỏi' },
        ]}
        title="Ngân hàng câu hỏi"
        subtitle="Tạo, quản lý và chuẩn hóa câu hỏi bằng AI để xây dựng đề kiểm tra nhanh chóng."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenManualCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo câu hỏi</span>
            </button>

            <button
              onClick={() => {
                setAiErrorMessage(null);
                setProposedQuestions([]);
                setIsAIModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/40 transition-all cursor-pointer hover:scale-[1.02]"
              title="Auto tạo câu hỏi trắc nghiệm tự động chuyển vào tab Chờ duyệt"
            >
              <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
              <span>Auto tạo câu hỏi</span>
            </button>

            <button
              onClick={() => {
                setParsedPreviewQuestions([]);
                setImportErrors([]);
                setDuplicateWarnings([]);
                setImportText('');
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#041527] border border-[#0e3d54] hover:bg-[#07243e] text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Import tài liệu</span>
            </button>

            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 bg-[#041527] border border-[#0e3d54] hover:bg-[#07243e] text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Nhập nhanh danh sách trắc nghiệm từ văn bản thô"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Thêm trắc nghiệm nhanh</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#041527] border border-[#0e3d54] hover:bg-[#07243e] text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Xuất dữ liệu</span>
            </button>
          </div>
        }
      />

      {/* 5 Real Dynamic Metric Cards - Clickable Tab Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`p-3.5 rounded-2xl shadow-sm text-left transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-[#051e36] border-2 border-cyan-400 ring-2 ring-cyan-500/20'
              : 'bg-[#031525] border border-[#0e3d54] hover:border-slate-500'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Tổng số câu hỏi</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đầy đủ các dạng đề thi</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('pending')}
          className={`p-3.5 rounded-2xl shadow-sm text-left transition-all cursor-pointer ${
            selectedStatus === 'pending'
              ? 'bg-amber-950/40 border-2 border-amber-400 ring-2 ring-amber-500/30'
              : 'bg-[#031525] border border-amber-900/50 hover:border-amber-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-amber-300">Tab Chờ duyệt</span>
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">Auto tạo câu hỏi sẽ vào đây</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('approved')}
          className={`p-3.5 rounded-2xl shadow-sm text-left transition-all cursor-pointer ${
            selectedStatus === 'approved'
              ? 'bg-emerald-950/40 border-2 border-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-[#031525] border border-emerald-900/50 hover:border-emerald-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold text-emerald-300">Tab Đã duyệt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.approved}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">Sẵn sàng xuất đề thi</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('draft')}
          className={`p-3.5 rounded-2xl shadow-sm text-left transition-all cursor-pointer ${
            selectedStatus === 'draft'
              ? 'bg-slate-800/80 border-2 border-slate-300 ring-2 ring-slate-400/20'
              : 'bg-[#031525] border border-slate-700/60 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Bản nháp</span>
            <FileCode className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-300">{stats.draft}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đang soạn thảo</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('flagged')}
          className={`p-3.5 rounded-2xl shadow-sm text-left transition-all cursor-pointer col-span-2 md:col-span-1 ${
            selectedStatus === 'flagged'
              ? 'bg-rose-950/40 border-2 border-rose-400 ring-2 ring-rose-500/30'
              : 'bg-[#031525] border border-rose-900/50 hover:border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Cảnh báo chất lượng</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats.flagged}</div>
          <div className="text-[11px] text-slate-400 mt-1">Trùng lặp / lời giải ngắn</div>
        </button>
      </div>

      {/* Filter and Search Bar (Section 10) */}
      <div className="p-4 bg-[#031525] border border-[#0e3d54] rounded-2xl space-y-3">
        {/* Primary Filters Row: Tìm kiếm chủ đề -> Tất cả các lớp -> Môn học -> Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Textbox tìm kiếm chủ đề */}
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={topicSearchQuery}
              onChange={e => setTopicSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chủ đề..."
              className="w-full pl-9 pr-8 py-2 bg-[#020e1a] border border-[#0e3d54] focus:border-cyan-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
            />
            {topicSearchQuery && (
              <button
                type="button"
                onClick={() => setTopicSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Combobox Tất cả các lớp */}
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 bg-[#020e1a] border border-[#0e3d54] focus:border-cyan-500 rounded-xl text-xs text-slate-200 outline-none"
          >
            <option value="all">Tất cả các lớp</option>
            {allClasses.map(c => (
              <option key={c.id} value={c.id}>
                Lớp {c.name} (Khối {c.gradeLevel})
              </option>
            ))}
          </select>

          {/* 3. Combobox Môn học */}
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 bg-[#020e1a] border border-[#0e3d54] focus:border-cyan-500 rounded-xl text-xs text-slate-200 outline-none"
          >
            <option value="all">Tất cả môn học</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* 4. Combobox Trạng thái */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-[#020e1a] border border-[#0e3d54] focus:border-cyan-500 rounded-xl text-xs text-slate-200 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="draft">Bản nháp</option>
            <option value="flagged">Có cảnh báo chất lượng</option>
          </select>
        </div>

        {/* Secondary Search & Attribute Filters */}
        <div className="flex flex-col lg:flex-row gap-3 pt-1">
          {/* General Content Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo nội dung câu hỏi, lời giải, từ khóa tags..."
              className="w-full pl-9 pr-4 py-2 bg-[#020e1a] border border-[#0e3d54] focus:border-cyan-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Additional Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Grade */}
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-300 outline-none"
            >
              <option value="all">Tất cả khối lớp</option>
              {grades.map(g => (
                <option key={g} value={g}>Khối {g}</option>
              ))}
            </select>

            {/* Type */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-300 outline-none"
            >
              <option value="all">Tất cả dạng câu hỏi</option>
              {Object.entries(questionTypeLabels).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-300 outline-none"
            >
              <option value="all">Tất cả mức độ</option>
              {Object.entries(difficultyLabels).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>

            {/* Reset Filters */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </div>

        {/* Tags filter chips */}
        {allAvailableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#0e3d54]/60">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Thẻ từ khóa:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                selectedTag === 'all' ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700' : 'bg-[#020e1a] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Tất cả
            </button>
            {allAvailableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                className={`px-2 py-0.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700'
                    : 'bg-[#020e1a] text-slate-400 hover:text-slate-200 border border-[#0e3d54]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Action Bar (When questions are selected) */}
      {selectedQuestionIds.size > 0 && (
        <div className="p-3 bg-cyan-950/70 border border-cyan-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold">
            <CheckCheck className="w-4 h-4" />
            <span>Đã chọn {selectedQuestionIds.size} câu hỏi</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkChangeStatus('approved')}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Duyệt nhanh</span>
            </button>

            <button
              onClick={() => handleBulkChangeStatus('draft')}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Đưa về Nháp</span>
            </button>

            <button
              onClick={() => {
                setExportScope('selected');
                setIsExportModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-cyan-800 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất {selectedQuestionIds.size} câu</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation for Question Bank Status */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-[#0e3d54]/80">
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedStatus === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm shadow-cyan-950'
              : 'bg-[#031525] text-slate-400 hover:text-white border border-[#0e3d54] hover:border-slate-500'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Tất cả câu hỏi</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedStatus === 'pending'
              ? 'bg-amber-500/25 text-amber-300 border-2 border-amber-400 shadow-md shadow-amber-950 ring-2 ring-amber-500/30'
              : 'bg-[#031525] text-amber-400/90 hover:text-amber-300 border border-amber-900/50 hover:border-amber-700'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Tab Chờ duyệt</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-600 font-mono font-bold">
            {stats.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedStatus === 'approved'
              ? 'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 shadow-md shadow-emerald-950 ring-2 ring-emerald-500/30'
              : 'bg-[#031525] text-emerald-400/90 hover:text-emerald-300 border border-emerald-900/50 hover:border-emerald-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Tab Đã duyệt</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono font-bold">
            {stats.approved}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('draft')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedStatus === 'draft'
              ? 'bg-slate-700/50 text-slate-200 border border-slate-400 shadow-sm'
              : 'bg-[#031525] text-slate-400 hover:text-white border border-[#0e3d54]'
          }`}
        >
          <FileCode className="w-4 h-4 text-slate-400" />
          <span>Bản nháp</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {stats.draft}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('flagged')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedStatus === 'flagged'
              ? 'bg-rose-500/25 text-rose-300 border border-rose-500 shadow-sm'
              : 'bg-[#031525] text-rose-400/80 hover:text-rose-300 border border-rose-900/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Cảnh báo</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono">
            {stats.flagged}
          </span>
        </button>

        {selectedStatus === 'pending' && stats.pending > 0 && (
          <button
            type="button"
            onClick={handleApproveAllPending}
            className="sm:ml-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer shrink-0 transition-transform hover:scale-[1.02]"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Duyệt tất cả {stats.pending} câu chờ duyệt</span>
          </button>
        )}
      </div>

      {/* Question Table / List (Section 11) */}
      <div className="bg-[#031525] border border-[#0e3d54] rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header controls */}
        <div className="p-3.5 border-b border-[#0e3d54] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-300">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={el => {
                  if (el) el.indeterminate = isPartiallySelected;
                }}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-[#020e1a] border-[#0e3d54]"
              />
              <span>Chọn tất cả ({filteredQuestions.length} câu)</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-400">
            Hiển thị <span className="text-white font-bold">{filteredQuestions.length}</span> / {questions.length} câu hỏi
          </div>
        </div>

        {/* Empty State */}
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#020e1a] border border-[#0e3d54] mx-auto flex items-center justify-center text-slate-500">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200">Không tìm thấy câu hỏi phù hợp</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Không có câu hỏi nào khớp với các bộ lọc hiện tại. Thầy/Cô hãy thử tìm kiếm với từ khóa khác hoặc bấm Xóa bộ lọc.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 bg-[#020e1a] border border-[#0e3d54] text-xs font-semibold text-cyan-400 hover:text-white rounded-xl"
              >
                Xóa tất cả bộ lọc
              </button>
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-xl"
              >
                Tạo câu hỏi mới bằng AI
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#0e3d54]/70">
            {filteredQuestions.map((q, idx) => {
              const isSelected = selectedQuestionIds.has(q.id);
              const qStatus = q.status || 'approved';
              const hasWarning = qStatus === 'flagged' || Boolean(q.qualityWarning) || (q.qualityScore && q.qualityScore < 75);

              return (
                <div
                  key={q.id}
                  className={`p-4 transition-colors hover:bg-[#051c33] ${
                    isSelected ? 'bg-cyan-950/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectQuestion(q.id)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-0 bg-[#020e1a] border-[#0e3d54] cursor-pointer"
                      />
                    </div>

                    {/* Question Content & Body */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Meta badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-mono text-[11px] font-bold text-slate-400 bg-[#020e1a] px-2 py-0.5 rounded border border-[#0e3d54]">
                          #{idx + 1}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {q.subject} · K{q.grade}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${questionTypeLabels[q.type]?.color || 'bg-slate-800 text-slate-300'}`}>
                          {questionTypeLabels[q.type]?.label || q.type}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${difficultyLabels[q.difficulty]?.badge}`}>
                          {difficultyLabels[q.difficulty]?.label}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${statusLabels[qStatus]?.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusLabels[qStatus]?.dot}`} />
                          {statusLabels[qStatus]?.label}
                        </span>

                        {q.qualityScore && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.qualityScore >= 90 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            AI Score: {q.qualityScore}/100
                          </span>
                        )}

                        {q.topic && (
                          <span className="text-[11px] text-slate-400 italic">
                            Chủ đề: {q.topic}
                          </span>
                        )}
                      </div>

                      {/* Passage if any */}
                      {q.passage && (
                        <div className="p-2.5 bg-[#020e1a]/80 border border-[#0e3d54] rounded-xl text-xs text-slate-300 italic">
                          <span className="font-bold text-cyan-400 not-italic mr-1.5">[Ngữ cảnh / Tình huống]:</span>
                          {q.passage}
                        </div>
                      )}

                      {/* Main Question Text */}
                      <div className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed">
                        {q.content}
                      </div>

                      {/* Options preview according to question type */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map(opt => {
                            const isCorrect = Array.isArray(q.correctAnswer)
                              ? q.correctAnswer.includes(opt.id)
                              : q.correctAnswer === opt.id;
                            return (
                              <div
                                key={opt.id}
                                className={`p-2 rounded-xl border text-xs flex items-start gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200 font-medium'
                                    : 'bg-[#020e1a] border-[#0e3d54] text-slate-300'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-[#041628] text-slate-400'
                                }`}>
                                  {opt.id}
                                </span>
                                <span className="flex-1">{opt.text}</span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* True/False 4 sub-statements preview */}
                      {q.subQuestions && q.subQuestions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {q.subQuestions.map(sq => (
                            <div
                              key={sq.id}
                              className="p-2 rounded-xl bg-[#020e1a] border border-[#0e3d54] text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cyan-400 uppercase">{sq.id})</span>
                                <span className="text-slate-300">{sq.statement}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sq.isCorrect ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}>
                                {sq.isCorrect ? 'ĐÚNG' : 'SAI'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Matching pairs preview */}
                      {q.matchingPairs && q.matchingPairs.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.matchingPairs.map((p, pIdx) => (
                            <div key={pIdx} className="p-2 rounded-xl bg-[#020e1a] border border-[#0e3d54] text-xs flex items-center justify-between">
                              <span className="font-semibold text-slate-200">{p.left}</span>
                              <ArrowRight className="w-3 h-3 text-cyan-400 mx-2 shrink-0" />
                              <span className="text-cyan-300 text-right">{p.right}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ordering items preview */}
                      {q.orderingItems && q.orderingItems.length > 0 && (
                        <div className="p-2 rounded-xl bg-[#020e1a] border border-[#0e3d54] text-xs text-slate-300 space-y-1">
                          <span className="text-[11px] font-bold text-teal-400">Thứ tự đúng:</span>
                          <div className="space-y-0.5">
                            {q.orderingItems.map((item, idx2) => (
                              <div key={idx2} className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-teal-900/60 text-teal-300 text-[10px] flex items-center justify-center font-bold">
                                  {idx2 + 1}
                                </span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quality Warning Alert if flagged */}
                      {hasWarning && (
                        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span><strong>Cảnh báo chất lượng:</strong> {q.qualityWarning || 'Độ khó chưa tương xứng hoặc lời giải chi tiết cần bổ sung.'}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {q.tags && q.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {q.tags.map(t => (
                            <span key={t} className="text-[10px] text-slate-400 bg-[#020e1a] px-1.5 py-0.5 rounded border border-[#0e3d54]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Menu right side */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Button Duyệt: Click to approve and move to 'Đã duyệt' tab */}
                      {qStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleApproveSingleQuestion(q.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-950/40 transition-all cursor-pointer hover:scale-105"
                          title="Duyệt câu hỏi này (chuyển sang tab Đã duyệt)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                      )}

                      {/* Icon Button Edit: Allowed to edit multiple-choice question */}
                      <button
                        type="button"
                        onClick={() => handleOpenManualEdit(q)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
                          qStatus === 'pending'
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm'
                            : 'text-slate-400 hover:text-amber-300 hover:bg-[#08223a]'
                        }`}
                        title="Chỉnh sửa câu hỏi trắc nghiệm này"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px]">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-[#08223a] rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết câu hỏi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-[#08223a] rounded-lg transition-colors cursor-pointer"
                        title="Nhân bản câu hỏi"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#08223a] rounded-lg transition-colors cursor-pointer"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: AI GENERATOR MODAL (Section 6, 7 & 8)                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAIModalOpen}
        onClose={() => {
          if (!isGeneratingAI) setIsAIModalOpen(false);
        }}
        title="AI Tạo câu hỏi thông minh - Chuẩn hóa ma trận GDPT 2018"
        maxWidth="2xl"
      >
        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Error Banner if API key or connection error */}
          {aiErrorMessage && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-sm text-rose-300">Thông báo cấu hình AI</div>
                  <div className="mt-1">{aiErrorMessage}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-rose-900/60">
                <button
                  onClick={() => executeAIGeneration(false)}
                  className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Thử lại kết nối
                </button>
                <button
                  onClick={() => executeAIGeneration(true)}
                  className="px-3 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>Sinh bộ câu hỏi mẫu (Pedagogical Engine)</span>
                </button>
              </div>
            </div>
          )}

          {/* Section A: Nguồn kiến thức */}
          <div className="p-4 bg-[#03172c] border border-[#0e3d54] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> A. Nguồn kiến thức bài học
              </span>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAiSourceType('text')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    aiSourceType === 'text' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nhập chủ đề
                </button>
                <button
                  type="button"
                  onClick={() => setAiSourceType('file')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    aiSourceType === 'file' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tải tệp DOCX / XLSX / PDF / TXT
                </button>
              </div>
            </div>

            {aiSourceType === 'text' ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-slate-300">Chủ đề hoặc tên bài học:</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="Ví dụ: Định lý Vi-ét và các bài toán thực tế"
                    className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] focus:border-cyan-500 rounded-xl text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Nội dung chi tiết bài học / trích đoạn SGK (tùy chọn):</label>
                  <textarea
                    rows={3}
                    value={aiLessonContent}
                    onChange={e => setAiLessonContent(e.target.value)}
                    placeholder="Dán nội dung lý thuyết, bài giảng hoặc văn bản đọc hiểu vào đây để AI bám sát dữ liệu..."
                    className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] focus:border-cyan-500 rounded-xl text-xs text-slate-200 outline-none resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={aiFileInputRef}
                  onChange={handleFileUploadForAI}
                  accept=".txt,.docx,.xlsx,.xls,.pdf,.csv"
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="p-3 bg-[#020e1a] border border-cyan-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-white">{uploadedFile.name}</div>
                        <div className="text-[10px] text-emerald-400">
                          {uploadedFile.size} · Đã trích xuất nội dung văn bản thành công
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => aiFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                      >
                        Thay thế
                      </button>
                      <button
                        onClick={handleRemoveAIFile}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => aiFileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-[#0e3d54] hover:border-cyan-500 rounded-2xl text-center cursor-pointer transition-colors bg-[#020e1a]/60"
                  >
                    <FileUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-200">Bấm để tải lên tài liệu DOCX, XLSX, PDF hoặc TXT</div>
                    <div className="text-[11px] text-slate-400 mt-1">Hệ thống AI sẽ tự động đọc, phân tích và trích xuất kiến thức trọng tâm</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section B: Phân loại */}
          <div className="p-4 bg-[#03172c] border border-[#0e3d54] rounded-2xl space-y-3">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> B. Phân loại theo chương trình GDPT
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Khối lớp:</label>
                <select
                  value={aiGrade}
                  onChange={e => setAiGrade(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-200 outline-none"
                >
                  {grades.map(g => (
                    <option key={g} value={g}>Khối {g} (THCS Trưng Vương)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Môn học:</label>
                <select
                  value={aiSubject}
                  onChange={e => setAiSubject(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-200 outline-none"
                >
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Chương:</label>
                <input
                  type="text"
                  value={aiChapter}
                  onChange={e => setAiChapter(e.target.value)}
                  placeholder="Ví dụ: Chương 4: Hàm số y=ax²"
                  className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Bài học:</label>
                <input
                  type="text"
                  value={aiLesson}
                  onChange={e => setAiLesson(e.target.value)}
                  placeholder="Ví dụ: Bài 4: Hệ thức Vi-ét và ứng dụng"
                  className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Thẻ từ khóa (Tags):</label>
              <input
                type="text"
                value={aiTagsInput}
                onChange={e => setAiTagsInput(e.target.value)}
                placeholder="Nhập các từ khóa phân cách bởi dấu phẩy..."
                className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Section C: Cấu hình sinh câu hỏi */}
          <div className="p-4 bg-[#03172c] border border-[#0e3d54] rounded-2xl space-y-3">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> C. Cấu hình sinh câu hỏi & ma trận đề
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Tổng số câu hỏi cần tạo:</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={aiTotalCount}
                    onChange={e => setAiTotalCount(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 cursor-pointer"
                  />
                  <span className="w-12 px-2 py-1 bg-[#020e1a] border border-[#0e3d54] rounded-lg text-center font-bold text-xs text-cyan-300">
                    {aiTotalCount} câu
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Mức độ nhận thức:</label>
                <select
                  value={aiDifficulty}
                  onChange={e => setAiDifficulty(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs text-slate-200 outline-none"
                >
                  <option value="mixed">Phân bổ ma trận chuẩn (Nhận biết 40% - Thông hiểu 30% - Vận dụng 20% - Vận dụng cao 10%)</option>
                  <option value="easy">Chỉ tạo mức Nhận biết</option>
                  <option value="medium">Chỉ tạo mức Thông hiểu</option>
                  <option value="hard">Chỉ tạo mức Vận dụng</option>
                  <option value="very_hard">Chỉ tạo mức Vận dụng cao</option>
                </select>
              </div>
            </div>

            {/* Checkbox question types */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Chọn các dạng câu hỏi cần AI sinh:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(questionTypeLabels).map(([key, item]) => {
                  const qKey = key as QuestionType;
                  const isChecked = aiSelectedTypes.includes(qKey);
                  return (
                    <label
                      key={key}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                        isChecked ? 'bg-cyan-950/60 border-cyan-700 text-cyan-200' : 'bg-[#020e1a] border-[#0e3d54] text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setAiSelectedTypes(prev =>
                            prev.includes(qKey) ? prev.filter(t => t !== qKey) : [...prev, qKey]
                          );
                        }}
                        className="rounded text-cyan-600 focus:ring-0"
                      />
                      <span className="truncate">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Option Checkboxes: Answers, Explanations, Rubric */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#0e3d54]/60">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIncludeAnswer}
                  onChange={e => setAiIncludeAnswer(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>Có đáp án chính xác</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIncludeExplanation}
                  onChange={e => setAiIncludeExplanation(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>Có lời giải chi tiết từng bước</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIncludeWhyCorrect}
                  onChange={e => setAiIncludeWhyCorrect(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>Có giải thích tại sao đáp án đúng</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiIncludeRubric}
                  onChange={e => setAiIncludeRubric(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>Có hướng dẫn chấm (Rubric) cho câu tự luận</span>
              </label>
            </div>
          </div>

          {/* Generation Progress Indicator */}
          {isGeneratingAI && (
            <div className="p-4 bg-purple-950/40 border border-purple-800 rounded-2xl text-center space-y-2 animate-pulse">
              <Sparkles className="w-6 h-6 text-purple-400 mx-auto animate-spin" />
              <div className="text-xs font-bold text-purple-200">Đang thực thi tác vụ AI Sư phạm thông minh...</div>
              <div className="text-[11px] text-purple-300 italic">{aiProgressStep || 'Đang xử lý...'}</div>
            </div>
          )}

          {/* Section D: Thao tác & Previews */}
          {proposedQuestions.length > 0 && (
            <div className="p-4 bg-[#03172c] border border-cyan-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#0e3d54]">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Danh sách câu hỏi đề xuất ({proposedQuestions.length})
                  </span>
                  <div className="text-[11px] text-slate-400">
                    Đã chọn duyệt <strong className="text-white">{approvedIndices.size}</strong> câu hỏi
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllProposed}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                  >
                    {approvedIndices.size === proposedQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
              </div>

              {/* Proposed questions card list */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {proposedQuestions.map((q, idx) => {
                  const isApproved = approvedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isApproved
                          ? 'bg-[#020e1a] border-emerald-700/80 shadow-xs'
                          : 'bg-[#020e1a]/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <label className="flex items-center gap-1.5 font-bold cursor-pointer text-slate-200">
                            <input
                              type="checkbox"
                              checked={isApproved}
                              onChange={() => handleToggleApproveProposed(idx)}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span>Câu {idx + 1}</span>
                          </label>

                          <span className={`px-2 py-0.2 rounded-full text-[10px] border ${questionTypeLabels[q.type]?.color}`}>
                            {questionTypeLabels[q.type]?.label}
                          </span>

                          <span className={`px-2 py-0.2 rounded-full text-[10px] border ${difficultyLabels[q.difficulty]?.badge}`}>
                            {difficultyLabels[q.difficulty]?.label}
                          </span>

                          <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                            Score: {q.qualityScore || 95}/100
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditProposed(idx)}
                            className="p-1 text-slate-400 hover:text-amber-300"
                            title="Sửa trực tiếp câu này"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveProposed(idx)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Loại bỏ câu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-100 mt-2">
                        {q.content}
                      </div>

                      {q.passage && (
                        <div className="p-2 bg-[#041527] rounded-lg text-[11px] text-slate-300 italic mt-1.5">
                          [Ngữ cảnh]: {q.passage}
                        </div>
                      )}

                      {/* Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
                          {q.options.map(opt => (
                            <div
                              key={opt.id}
                              className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                                (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt.id) : q.correctAnswer === opt.id)
                                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 font-bold'
                                  : 'bg-[#031525] border-[#0e3d54] text-slate-300'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px]">
                                {opt.id}
                              </span>
                              <span className="truncate">{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-2 text-[11px] text-slate-400 border-t border-[#0e3d54]/60 pt-1.5">
                          <span className="font-bold text-slate-300">Lời giải:</span> {q.explanation}
                        </div>
                      )}

                      {q.whyCorrect && (
                        <div className="text-[11px] text-cyan-300/90 mt-1">
                          <span className="font-bold text-cyan-400">Vì sao đúng:</span> {q.whyCorrect}
                        </div>
                      )}

                      {q.rubric && (
                        <div className="text-[11px] text-amber-300/90 mt-1">
                          <span className="font-bold text-amber-400">Barem chấm:</span> {q.rubric}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#0e3d54]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAIConfigPreset}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lưu cấu hình</span>
              </button>

              <button
                type="button"
                onClick={() => executeAIGeneration(true)}
                className="px-3 py-2 bg-[#041527] border border-[#0e3d54] hover:bg-[#07243e] text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5"
                title="Sinh trực tiếp bằng bộ đề sư phạm chuẩn hóa"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Mẫu đề sư phạm</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAIModalOpen(false)}
                className="px-4 py-2 bg-[#020e1a] border border-[#0e3d54] text-slate-300 rounded-xl text-xs font-semibold hover:bg-[#051c33]"
              >
                Hủy
              </button>

              {proposedQuestions.length > 0 ? (
                <button
                  type="button"
                  onClick={handleSaveApprovedToBank}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu {approvedIndices.size} câu đã duyệt vào Ngân hàng</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isGeneratingAI}
                  onClick={() => executeAIGeneration(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
                  title="Auto tạo câu hỏi - Toàn bộ câu hỏi sinh ra sẽ lưu vào tab Chờ duyệt"
                >
                  <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
                  <span>{isGeneratingAI ? 'Đang Auto tạo câu hỏi...' : 'Auto tạo câu hỏi (Lưu vào Chờ duyệt)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: INLINE EDIT FOR PROPOSED AI QUESTION                             */}
      {/* ========================================================================= */}
      {editProposedDraft && (
        <Modal
          isOpen={editingProposedIdx !== null}
          onClose={() => {
            setEditingProposedIdx(null);
            setEditProposedDraft(null);
          }}
          title="Chỉnh sửa câu hỏi trước khi duyệt vào Ngân hàng"
          maxWidth="lg"
        >
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            <div>
              <label className="font-semibold text-slate-300">Nội dung câu hỏi:</label>
              <textarea
                rows={3}
                value={editProposedDraft.content}
                onChange={e => setEditProposedDraft({ ...editProposedDraft, content: e.target.value })}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300">Mức độ nhận thức:</label>
                <select
                  value={editProposedDraft.difficulty}
                  onChange={e => setEditProposedDraft({ ...editProposedDraft, difficulty: e.target.value as any })}
                  className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 outline-none"
                >
                  {Object.entries(difficultyLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Đáp án đúng:</label>
                <input
                  type="text"
                  value={Array.isArray(editProposedDraft.correctAnswer) ? editProposedDraft.correctAnswer.join(', ') : editProposedDraft.correctAnswer}
                  onChange={e => setEditProposedDraft({ ...editProposedDraft, correctAnswer: e.target.value })}
                  className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 outline-none font-bold text-cyan-400"
                />
              </div>
            </div>

            {/* Options edit if single or multiple */}
            {editProposedDraft.options && editProposedDraft.options.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Các phương án A, B, C, D:</label>
                {editProposedDraft.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="w-6 font-bold text-center text-cyan-400">{opt.id}.</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => {
                        const nextOpts = [...(editProposedDraft.options || [])];
                        nextOpts[i] = { ...nextOpts[i], text: e.target.value };
                        setEditProposedDraft({ ...editProposedDraft, options: nextOpts });
                      }}
                      className="flex-1 p-1.5 bg-[#020e1a] border border-[#0e3d54] rounded-lg text-slate-200 outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-300">Lời giải chi tiết:</label>
              <textarea
                rows={2}
                value={editProposedDraft.explanation}
                onChange={e => setEditProposedDraft({ ...editProposedDraft, explanation: e.target.value })}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
              <button
                onClick={() => {
                  setEditingProposedIdx(null);
                  setEditProposedDraft(null);
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditProposed}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold"
              >
                Lưu chỉnh sửa
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MANUAL CREATE & EDIT QUESTION (Section 12)                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title={editingQuestionId ? 'Chỉnh sửa câu hỏi trong Ngân hàng' : '+ Thêm mới câu hỏi vào Ngân hàng'}
        maxWidth="lg"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-xs">
          {/* Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="font-semibold text-slate-300">Môn học:</label>
              <select
                value={manualSubject}
                onChange={e => setManualSubject(e.target.value)}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300">Khối lớp:</label>
              <select
                value={manualGrade}
                onChange={e => setManualGrade(Number(e.target.value))}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              >
                {grades.map(g => (
                  <option key={g} value={g}>Khối {g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300">Mức độ nhận thức:</label>
              <select
                value={manualDifficulty}
                onChange={e => setManualDifficulty(e.target.value as any)}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              >
                {Object.entries(difficultyLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-300">Dạng câu hỏi:</label>
              <select
                value={manualType}
                onChange={e => setManualType(e.target.value as any)}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 font-bold text-cyan-400"
              >
                {Object.entries(questionTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300">Trạng thái:</label>
              <select
                value={manualStatus}
                onChange={e => setManualStatus(e.target.value as any)}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              >
                <option value="approved">Đã duyệt (Approved)</option>
                <option value="pending">Chờ duyệt (Pending)</option>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="flagged">Có cảnh báo (Flagged)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-300">Chương / Chuyên đề:</label>
              <input
                type="text"
                value={manualChapter}
                onChange={e => setManualChapter(e.target.value)}
                placeholder="Ví dụ: Chương 3: Hệ hai phương trình"
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300">Chủ đề / Bài học:</label>
              <input
                type="text"
                value={manualTopic}
                onChange={e => setManualTopic(e.target.value)}
                placeholder="Ví dụ: Phương pháp thế và cộng đại số"
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              />
            </div>
          </div>

          {/* Passage if passage_based */}
          {(manualType === 'passage_based' || manualPassage) && (
            <div>
              <label className="font-semibold text-cyan-300">Đoạn văn đọc hiểu / Tình huống thực tế:</label>
              <textarea
                rows={3}
                value={manualPassage}
                onChange={e => setManualPassage(e.target.value)}
                placeholder="Dán đoạn văn hoặc ngữ cảnh tình huống tại đây..."
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              />
            </div>
          )}

          {/* Main Content */}
          <div>
            <label className="font-semibold text-slate-300">Nội dung câu hỏi / Yêu cầu đề bài *:</label>
            <textarea
              rows={3}
              value={manualContent}
              onChange={e => setManualContent(e.target.value)}
              placeholder="Nhập nội dung câu hỏi chính xác..."
              className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
            />
          </div>

          {/* Dynamic form according to type */}
          {(manualType === 'single' || manualType === 'multiple') && (
            <div className="space-y-2 p-3 bg-[#020e1a] border border-[#0e3d54] rounded-xl">
              <span className="font-bold text-cyan-400">Các phương án lựa chọn:</span>
              <div className="space-y-1.5">
                {[
                  { id: 'A', val: manualOptA, set: setManualOptA },
                  { id: 'B', val: manualOptB, set: setManualOptB },
                  { id: 'C', val: manualOptC, set: setManualOptC },
                  { id: 'D', val: manualOptD, set: setManualOptD },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="w-5 font-bold text-center text-slate-400">{opt.id}.</span>
                    <input
                      type="text"
                      value={opt.val}
                      onChange={e => opt.set(e.target.value)}
                      placeholder={`Nội dung phương án ${opt.id}...`}
                      className="flex-1 p-1.5 bg-[#031525] border border-[#0e3d54] rounded-lg text-slate-200"
                    />
                    {manualType === 'single' ? (
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="single_ans"
                          checked={manualCorrectAns === opt.id}
                          onChange={() => setManualCorrectAns(opt.id)}
                          className="text-emerald-500"
                        />
                        <span className="text-[11px] text-emerald-400">Đúng</span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={manualMultipleAns.includes(opt.id)}
                          onChange={() => {
                            setManualMultipleAns(prev =>
                              prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]
                            );
                          }}
                          className="text-purple-500 rounded"
                        />
                        <span className="text-[11px] text-purple-400">Đúng</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {manualType === 'true_false' && (
            <div className="space-y-2 p-3 bg-[#020e1a] border border-[#0e3d54] rounded-xl">
              <span className="font-bold text-emerald-400">4 Mệnh đề Đúng/Sai chuẩn GDPT 2018:</span>
              {[
                { id: 'a', st: tfA, set: setTfA },
                { id: 'b', st: tfB, set: setTfB },
                { id: 'c', st: tfC, set: setTfC },
                { id: 'd', st: tfD, set: setTfD },
              ].map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 uppercase w-4">{item.id})</span>
                  <input
                    type="text"
                    value={item.st.text}
                    onChange={e => item.set({ ...item.st, text: e.target.value })}
                    placeholder={`Nội dung khẳng định ý ${item.id}...`}
                    className="flex-1 p-1.5 bg-[#031525] border border-[#0e3d54] rounded-lg text-slate-200"
                  />
                  <select
                    value={item.st.isCorrect ? 'true' : 'false'}
                    onChange={e => item.set({ ...item.st, isCorrect: e.target.value === 'true' })}
                    className="p-1 bg-[#031525] border border-[#0e3d54] rounded text-xs font-bold"
                  >
                    <option value="true">ĐÚNG</option>
                    <option value="false">SAI</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {manualType === 'matching' && (
            <div className="space-y-2 p-3 bg-[#020e1a] border border-[#0e3d54] rounded-xl">
              <span className="font-bold text-indigo-400">Các cặp Ghép đôi (Cột A - Cột B):</span>
              {[
                { p: pair1, set: setPair1, idx: 1 },
                { p: pair2, set: setPair2, idx: 2 },
                { p: pair3, set: setPair3, idx: 3 },
                { p: pair4, set: setPair4, idx: 4 },
              ].map(row => (
                <div key={row.idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.p.left}
                    onChange={e => row.set({ ...row.p, left: e.target.value })}
                    placeholder={`Vế A (${row.idx})`}
                    className="flex-1 p-1.5 bg-[#031525] border border-[#0e3d54] rounded-lg text-slate-200"
                  />
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={row.p.right}
                    onChange={e => row.set({ ...row.p, right: e.target.value })}
                    placeholder={`Vế B tương ứng (${row.idx})`}
                    className="flex-1 p-1.5 bg-[#031525] border border-[#0e3d54] rounded-lg text-slate-200"
                  />
                </div>
              ))}
            </div>
          )}

          {manualType === 'ordering' && (
            <div className="space-y-1 p-3 bg-[#020e1a] border border-[#0e3d54] rounded-xl">
              <span className="font-bold text-teal-400">Các bước theo đúng quy trình (mỗi dòng một bước):</span>
              <textarea
                rows={4}
                value={orderItemsText}
                onChange={e => setOrderItemsText(e.target.value)}
                placeholder="Bước 1: ...&#10;Bước 2: ...&#10;Bước 3: ..."
                className="w-full mt-1 p-2 bg-[#031525] border border-[#0e3d54] rounded-lg text-slate-200"
              />
            </div>
          )}

          {(manualType === 'fill_blank' || manualType === 'short_answer') && (
            <div>
              <label className="font-semibold text-amber-400">Đáp án từ khóa hoặc số chính xác:</label>
              <input
                type="text"
                value={manualBlankAnswer}
                onChange={e => setManualBlankAnswer(e.target.value)}
                placeholder="Ví dụ: 8 hoặc x1=3; x2=4"
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 font-bold"
              />
            </div>
          )}

          {manualType === 'essay' && (
            <div>
              <label className="font-semibold text-rose-400">Barem thang điểm chấm (Rubric):</label>
              <textarea
                rows={3}
                value={manualRubric}
                onChange={e => setManualRubric(e.target.value)}
                placeholder="Ý 1 (0.5đ): Điều kiện...&#10;Ý 2 (1.0đ): Lập phương trình..."
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              />
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-300">Lời giải chi tiết từng bước:</label>
            <textarea
              rows={3}
              value={manualExplanation}
              onChange={e => setManualExplanation(e.target.value)}
              placeholder="Giải thích các bước suy luận và tính toán..."
              className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300">Thẻ từ khóa tags (phân cách bởi dấu phẩy):</label>
            <input
              type="text"
              value={manualTags}
              onChange={e => setManualTags(e.target.value)}
              placeholder="Toán 9, Vi-ét, Thi vào 10..."
              className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0e3d54]">
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveManualQuestion}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
            >
              {editingQuestionId ? 'Lưu thay đổi' : 'Thêm vào Ngân hàng'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: IMPORT WORD / EXCEL & VALIDATION (Section 13)                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập câu hỏi từ Word, Excel hoặc Văn bản chuẩn hóa"
        maxWidth="xl"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-xs">
          <input
            type="file"
            ref={fileImportInputRef}
            onChange={handleImportFileSelected}
            accept=".xlsx,.xls,.docx,.txt,.csv"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#020e1a] border border-[#0e3d54] rounded-2xl">
            <div>
              <div className="font-bold text-slate-200 text-sm">Tải lên tệp Word (.docx) hoặc Excel (.xlsx)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Hệ thống tự động phát hiện định dạng: Câu 1: ... A. B. C. D. Đáp án: A. Lời giải: ...
              </div>
            </div>
            <button
              onClick={() => fileImportInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Chọn tệp từ máy tính</span>
            </button>
          </div>

          <div>
            <label className="font-semibold text-slate-300 mb-1 block">
              Hoặc dán văn bản trực tiếp để hệ thống phân tích:
            </label>
            <textarea
              rows={5}
              value={importText}
              onChange={e => {
                setImportText(e.target.value);
                parseTextQuestions(e.target.value);
              }}
              placeholder={`Câu 1: Phương trình x² - 4 = 0 có tập nghiệm là:
A. {2}
B. {-2}
C. {-2; 2}
D. ∅
Đáp án: C
Lời giải: x² = 4 <=> x = 2 hoặc x = -2.
Mức độ: Nhận biết`}
              className="w-full p-2.5 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 font-mono text-xs outline-none"
            />
          </div>

          {/* Validation Errors & Line warnings */}
          {importErrors.length > 0 && (
            <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Báo cáo lỗi & lưu ý theo dòng ({importErrors.length}):
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {importErrors.map((err, i) => (
                  <div key={i} className="text-[11px] text-amber-200/90 flex items-start gap-1">
                    <span className="font-mono text-amber-400 font-bold shrink-0">[Dòng {err.line}]:</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Warnings */}
          {duplicateWarnings.length > 0 && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl space-y-1">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Phát hiện câu hỏi trùng lặp với Ngân hàng ({duplicateWarnings.length}):
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {duplicateWarnings.map((dup, i) => (
                  <div key={i} className="text-[11px] text-rose-200/90 flex items-start gap-1">
                    <span className="font-bold text-rose-400 shrink-0">Câu {dup.index + 1} ({dup.similarity}% trùng):</span>
                    <span className="truncate">"{dup.matchedTitle}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview list */}
          {parsedPreviewQuestions.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-cyan-300 text-xs">
                Xem trước danh sách ({parsedPreviewQuestions.length} câu hỏi hợp lệ):
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {parsedPreviewQuestions.map((q, idx) => (
                  <div key={idx} className="p-2.5 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>Câu {idx + 1}: {q.content}</span>
                      <span className="text-emerald-400 font-bold">ĐA: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}</span>
                    </div>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                        {q.options.map(o => (
                          <div key={o.id}>{o.id}. {o.text}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0e3d54]">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
            >
              Hủy
            </button>
            <button
              disabled={parsedPreviewQuestions.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer"
            >
              Xác nhận nhập ({parsedPreviewQuestions.length} câu)
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: BATCH MCQ MODAL (Quick Multi Question Text)                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Thêm nhanh nhiều câu hỏi trắc nghiệm"
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Dán văn bản thô gồm nhiều câu trắc nghiệm. Hệ thống sẽ tự động nhận diện từng câu hỏi, các phương án A, B, C, D, đáp án đúng và lời giải:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-300">Môn học:</label>
              <select
                value={batchSubject}
                onChange={e => setBatchSubject(e.target.value)}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-300">Khối lớp:</label>
              <select
                value={batchGrade}
                onChange={e => setBatchGrade(Number(e.target.value))}
                className="w-full mt-1 p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200"
              >
                {grades.map(g => (
                  <option key={g} value={g}>Khối {g}</option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            rows={8}
            value={batchRawText}
            onChange={e => setBatchRawText(e.target.value)}
            placeholder={`Câu 1: Hàm số y = 3x - 5 đồng biến trên ℝ vì:
A. Hệ số a = 3 > 0
B. Hệ số b = -5 < 0
C. Cắt trục tung tại điểm (0; 5)
D. Đi qua gốc tọa độ O
Đáp án: A
Lời giải: Hệ số a = 3 > 0 nên hàm bậc nhất luôn đồng biến trên ℝ.

Câu 2: Số nghiệm của phương trình x² - 6x + 9 = 0 là:
A. Vô nghiệm
B. Có 1 nghiệm kép
C. Có 2 nghiệm phân biệt
D. Có vô số nghiệm
Đáp án: B
Lời giải: Δ' = (-3)² - 9 = 0 nên có nghiệm kép x = 3.`}
            className="w-full p-3 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-200 font-mono text-xs outline-none"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
            <button
              onClick={() => setIsBatchModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmBatchMCQ}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold cursor-pointer"
            >
              Phân tích & Nhập dữ liệu
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: EXPORT CONFIGURATION (Section 14)                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Xuất dữ liệu Ngân hàng câu hỏi"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5">1. Định dạng tệp xuất bản:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'word', label: 'Microsoft Word', icon: FileText, color: 'text-blue-400' },
                { id: 'excel', label: 'Microsoft Excel', icon: FileSpreadsheet, color: 'text-emerald-400' },
                { id: 'pdf', label: 'In / PDF Chuẩn', icon: Printer, color: 'text-rose-400' },
              ].map(fmt => {
                const Icon = fmt.icon;
                const isChecked = exportFormat === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id as any)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${
                      isChecked ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold' : 'bg-[#020e1a] border-[#0e3d54] text-slate-400 hover:bg-[#041628]'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-1 ${fmt.color}`} />
                    <span>{fmt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1.5">2. Phạm vi câu hỏi xuất bản:</label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#020e1a] border border-[#0e3d54] cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'filtered'}
                  onChange={() => setExportScope('filtered')}
                  className="text-cyan-500"
                />
                <span className="text-slate-200 font-medium">Toàn bộ câu hỏi đang lọc ({filteredQuestions.length} câu)</span>
              </label>

              {selectedQuestionIds.size > 0 && (
                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#020e1a] border border-cyan-800 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'selected'}
                    onChange={() => setExportScope('selected')}
                    className="text-cyan-500"
                  />
                  <span className="text-cyan-300 font-bold">Chỉ xuất các câu đã chọn ({selectedQuestionIds.size} câu)</span>
                </label>
              )}

              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#020e1a] border border-[#0e3d54] cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="text-cyan-500"
                />
                <span className="text-slate-200">Toàn bộ ngân hàng ({questions.length} câu)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1.5">3. Chế độ hiển thị đề thi:</label>
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setExportMode('with_answers')}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  exportMode === 'with_answers' ? 'bg-cyan-950 border-cyan-600 text-cyan-200 font-bold' : 'bg-[#020e1a] border-[#0e3d54] text-slate-400'
                }`}
              >
                <div className="font-semibold">Kèm đáp án & lời giải</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Dành cho Giáo viên & Tổ chuyên môn</div>
              </div>

              <div
                onClick={() => setExportMode('student_only')}
                className={`p-2.5 rounded-xl border cursor-pointer ${
                  exportMode === 'student_only' ? 'bg-cyan-950 border-cyan-600 text-cyan-200 font-bold' : 'bg-[#020e1a] border-[#0e3d54] text-slate-400'
                }`}
              >
                <div className="font-semibold">Chỉ câu hỏi (Đề bài)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Dành cho Học sinh làm bài kiểm tra</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0e3d54]">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
            >
              Hủy
            </button>
            <button
              onClick={handleExecuteExport}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải file về máy tính</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 7: VIEW QUESTION DETAIL MODAL                                        */}
      {/* ========================================================================= */}
      {viewingQuestion && (
        <Modal
          isOpen={!!viewingQuestion}
          onClose={() => setViewingQuestion(null)}
          title={`Chi tiết câu hỏi: #${viewingQuestion.id.slice(-6)}`}
          maxWidth="lg"
        >
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-200">
                {viewingQuestion.subject} · Khối {viewingQuestion.grade}
              </span>
              <span className={`px-2 py-0.5 rounded border ${questionTypeLabels[viewingQuestion.type]?.color}`}>
                {questionTypeLabels[viewingQuestion.type]?.label}
              </span>
              <span className={`px-2 py-0.5 rounded border ${difficultyLabels[viewingQuestion.difficulty]?.badge}`}>
                {difficultyLabels[viewingQuestion.difficulty]?.label}
              </span>
              <span className={`px-2 py-0.5 rounded border ${statusLabels[viewingQuestion.status || 'approved']?.badge}`}>
                {statusLabels[viewingQuestion.status || 'approved']?.label}
              </span>
              {viewingQuestion.qualityScore && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  Quality Score: {viewingQuestion.qualityScore}/100
                </span>
              )}
            </div>

            {viewingQuestion.chapter && (
              <div className="text-slate-400 italic">
                Chương: {viewingQuestion.chapter} {viewingQuestion.lesson ? `· ${viewingQuestion.lesson}` : ''}
              </div>
            )}

            {viewingQuestion.passage && (
              <div className="p-3 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-slate-300 italic">
                <span className="font-bold text-cyan-400 not-italic mr-1.5">[Ngữ cảnh / Tình huống thực tế]:</span>
                {viewingQuestion.passage}
              </div>
            )}

            <div className="p-3 bg-[#020e1a] border border-[#0e3d54] rounded-xl text-sm font-semibold text-white leading-relaxed">
              {viewingQuestion.content}
            </div>

            {/* Options */}
            {viewingQuestion.options && viewingQuestion.options.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-300">Các phương án:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewingQuestion.options.map(opt => {
                    const isCorrect = Array.isArray(viewingQuestion.correctAnswer)
                      ? viewingQuestion.correctAnswer.includes(opt.id)
                      : viewingQuestion.correctAnswer === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                          isCorrect ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 font-bold' : 'bg-[#020e1a] border-[#0e3d54] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#041628] flex items-center justify-center font-bold">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* True/False sub questions */}
            {viewingQuestion.subQuestions && (
              <div className="space-y-1">
                <span className="font-bold text-slate-300">Các mệnh đề đúng/sai:</span>
                {viewingQuestion.subQuestions.map(sq => (
                  <div key={sq.id} className="p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl flex items-center justify-between">
                    <span><strong>{sq.id})</strong> {sq.statement}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sq.isCorrect ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                      {sq.isCorrect ? 'ĐÚNG' : 'SAI'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Matching pairs */}
            {viewingQuestion.matchingPairs && (
              <div className="space-y-1">
                <span className="font-bold text-slate-300">Cặp ghép nối:</span>
                {viewingQuestion.matchingPairs.map((p, i) => (
                  <div key={i} className="p-2 bg-[#020e1a] border border-[#0e3d54] rounded-xl flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{p.left}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-300">{p.right}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Answer & Explanation */}
            <div className="p-3 bg-[#020e1a] border border-cyan-800/80 rounded-xl space-y-2">
              <div className="font-bold text-cyan-300">
                ĐÁP ÁN: <span className="text-white text-sm">{Array.isArray(viewingQuestion.correctAnswer) ? viewingQuestion.correctAnswer.join(', ') : viewingQuestion.correctAnswer}</span>
              </div>
              <div>
                <span className="font-bold text-slate-300">Lời giải chi tiết:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{viewingQuestion.explanation}</p>
              </div>
              {viewingQuestion.whyCorrect && (
                <div>
                  <span className="font-bold text-cyan-400">Giải thích tại sao đúng:</span>
                  <p className="text-cyan-200/90 mt-0.5">{viewingQuestion.whyCorrect}</p>
                </div>
              )}
              {viewingQuestion.rubric && (
                <div>
                  <span className="font-bold text-amber-400">Barem thang điểm (Rubric):</span>
                  <pre className="text-amber-200/90 mt-0.5 font-sans whitespace-pre-line">{viewingQuestion.rubric}</pre>
                </div>
              )}
            </div>

            {viewingQuestion.qualityWarning && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span><strong>Cảnh báo chất lượng:</strong> {viewingQuestion.qualityWarning}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#0e3d54]">
              <div className="text-[11px] text-slate-400">
                Chủ đề: {viewingQuestion.topic}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const qToEdit = viewingQuestion;
                    setViewingQuestion(null);
                    handleOpenManualEdit(qToEdit);
                  }}
                  className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setViewingQuestion(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Single Confirm Modal */}
      {deleteTargetId && (
        <Modal
          isOpen={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          title="Xác nhận xóa câu hỏi"
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-300">
              Thầy/Cô có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer"
              >
                Xóa câu hỏi
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Delete Confirm Modal */}
      {isBulkDeleteModalOpen && (
        <Modal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          title={`Xác nhận xóa ${selectedQuestionIds.size} câu hỏi`}
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-300">
              Thầy/Cô có chắc chắn muốn xóa vĩnh viễn <strong className="text-rose-400">{selectedQuestionIds.size}</strong> câu hỏi đã chọn? Thao tác này sẽ loại bỏ dữ liệu khỏi Ngân hàng câu hỏi.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer"
              >
                Xóa tất cả {selectedQuestionIds.size} câu
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
