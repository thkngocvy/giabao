import React, { useState, useMemo, useRef } from 'react';
import {
  Tag,
  Plus,
  Search,
  BookOpen,
  CheckCircle2,
  FileText,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  Calendar,
  Clock,
  Copy,
  Archive,
  AlertTriangle,
  HelpCircle,
  FileQuestion,
  Eye,
  Check,
  X,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db } from '../../services/db';
import { aiService } from '../../services/aiService';
import { AssignmentTopic, Question, Classroom, TopicStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../common/Modal';
import { TopicLessonDocModal } from './TopicLessonDocModal';

interface Screen111TopicManagementProps {
  onSelectTopicForAssignment: (topicId: string, topicName: string, subjectName: string, classId: string) => void;
  onFilterByTopicInList?: (topicName: string | null) => void;
}

export const Screen111TopicManagement: React.FC<Screen111TopicManagementProps> = ({
  onSelectTopicForAssignment,
  onFilterByTopicInList
}) => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useToast();

  const teacherId = currentUser?.id || 'user_teacher_1';
  const teacherName = currentUser?.fullName || 'Cô Lê Thu Hà';

  // Permission: Assigned classes and subjects
  const { classes: allowedClasses, classSubjectsMap } = useMemo(() => {
    return db.getTeacherPermissions(teacherId, currentRole);
  }, [teacherId, currentRole]);

  const [topics, setTopics] = useState<AssignmentTopic[]>(() => db.getTopics());

  // Filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('ay_2024_2025');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Create / Edit Topic
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  const [formClassId, setFormClassId] = useState<string>('class_10a1');
  const [formSubjectName, setFormSubjectName] = useState<string>('Toán học');
  const [formLessonDate, setFormLessonDate] = useState<string>('Buổi 1');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formSessionType, setFormSessionType] = useState<'current' | 'previous'>('current');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formStatus, setFormStatus] = useState<TopicStatus>('ready');
  const [formColor, setFormColor] = useState<string>('#06b6d4');
  const [formQuestionIds, setFormQuestionIds] = useState<string[]>([]);

  // Duplicate warning confirmation state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Detail & Question Management Modal
  const [viewingTopic, setViewingTopic] = useState<AssignmentTopic | null>(null);

  // Dedicated Modal for "Quản lý câu hỏi theo chủ đề" (Yêu cầu trong ảnh)
  const [managingQuestionsTopic, setManagingQuestionsTopic] = useState<AssignmentTopic | null>(null);
  const [manageQuestionsFilterType, setManageQuestionsFilterType] = useState<'all' | 'mcq' | 'essay'>('all');
  const [manageQuestionsFilterStatus, setManageQuestionsFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [manageQuestionsSearch, setManageQuestionsSearch] = useState<string>('');
  const [questionVersion, setQuestionVersion] = useState<number>(0);

  // Delete confirmation modal (iframe-safe) & Clone highlight
  const [deletingTopic, setDeletingTopic] = useState<AssignmentTopic | null>(null);
  const [recentlyClonedId, setRecentlyClonedId] = useState<string | null>(null);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const scrollTable = (delta: number) => {
    tableScrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Open Lesson Plan / Word Document Teaching Mode Modal
  const [selectedLessonDocTopic, setSelectedLessonDocTopic] = useState<AssignmentTopic | null>(null);

  // Add Question from Bank Modal
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerType, setPickerType] = useState<'all' | 'mcq' | 'essay'>('all');
  const [pickerDifficulty, setPickerDifficulty] = useState<string>('all');
  const [pickerSelectedQids, setPickerSelectedQids] = useState<Set<string>>(new Set());

  // Quick Create Question Modal
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [newQType, setNewQType] = useState<'single' | 'essay'>('single');
  const [newQContent, setNewQContent] = useState('');
  const [newQCorrectAnswer, setNewQCorrectAnswer] = useState('A');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQOptionA, setNewQOptionA] = useState('');
  const [newQOptionB, setNewQOptionB] = useState('');
  const [newQOptionC, setNewQOptionC] = useState('');
  const [newQOptionD, setNewQOptionD] = useState('');
  const [newQRubric, setNewQRubric] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Auto Generate State
  const [isAutoGeneratingTopicQuestions, setIsAutoGeneratingTopicQuestions] = useState(false);

  // Edit Question Modal State
  const [editingQuestionItem, setEditingQuestionItem] = useState<Question | null>(null);
  const [editQContent, setEditQContent] = useState('');
  const [editQOptA, setEditQOptA] = useState('');
  const [editQOptB, setEditQOptB] = useState('');
  const [editQOptC, setEditQOptC] = useState('');
  const [editQOptD, setEditQOptD] = useState('');
  const [editQCorrectAnswer, setEditQCorrectAnswer] = useState('A');
  const [editQExplanation, setEditQExplanation] = useState('');
  const [editQDifficulty, setEditQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const reloadTopics = () => {
    setTopics(db.getTopics());
    setQuestionVersion(v => v + 1);
  };

  // Available subjects for the selected class in Form
  const formAvailableSubjects = useMemo(() => {
    return classSubjectsMap[formClassId] || ['Toán học'];
  }, [formClassId, classSubjectsMap]);

  // Filtered topics list
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      // Permission check: if teacher, must be in allowedClasses
      if (currentRole === 'TEACHER') {
        const isClassAllowed = allowedClasses.some(c => c.id === t.classId);
        if (!isClassAllowed) return false;
      }
      if (selectedClassId !== 'all' && t.classId !== selectedClassId) return false;
      if (selectedSubject !== 'all' && t.subjectName.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (selectedSessionType !== 'all' && t.sessionType !== selectedSessionType) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (t.title || t.name || '').toLowerCase().includes(q);
        const matchContent = (t.content || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }
      return true;
    });
  }, [topics, currentRole, allowedClasses, selectedClassId, selectedSubject, selectedSessionType, selectedStatus, searchQuery]);

  // Handlers for Form
  const handleOpenCreateForm = () => {
    setEditingTopicId(null);
    setDuplicateWarning(null);
    const defaultClass = allowedClasses[0]?.id || 'class_10a1';
    setFormClassId(defaultClass);
    setFormSubjectName(classSubjectsMap[defaultClass]?.[0] || 'Toán học');
    setFormLessonDate('Buổi 1');
    setFormPeriod(1);
    setFormSessionType('current');
    setFormTitle('');
    setFormContent('');
    setFormStatus('ready');
    setFormColor('#06b6d4');
    setFormQuestionIds([]);
    setIsFormModalOpen(true);
  };

  const handleOpenEditForm = (t: AssignmentTopic) => {
    setEditingTopicId(t.id);
    setDuplicateWarning(null);
    setFormClassId(t.classId || 'class_10a1');
    setFormSubjectName(t.subjectName);
    setFormLessonDate(t.lessonDate || 'Buổi 1');
    setFormPeriod(t.period || 1);
    setFormSessionType(t.sessionType || 'current');
    setFormTitle(t.title || t.name);
    setFormContent(t.content || t.description || '');
    setFormStatus(t.status || 'ready');
    setFormColor(t.color || '#06b6d4');
    setFormQuestionIds(t.questionIds || []);
    setIsFormModalOpen(true);
  };

  const handleSaveTopic = (e?: React.FormEvent, forceDuplicate: boolean = false) => {
    if (e) e.preventDefault();

    if (!formTitle.trim()) {
      showToast('Vui lòng nhập tên chủ đề (tối đa 200 ký tự)!', 'error');
      return;
    }
    if (formTitle.trim().length > 200) {
      showToast(`Tên chủ đề vượt quá 200 ký tự (${formTitle.trim().length}/200). Vui lòng rút gọn!`, 'error');
      return;
    }
    if (formContent.length > 8000) {
      showToast(`Nội dung chủ đề vượt quá 8.000 ký tự (${formContent.length}/8.000). Vui lòng rút gọn!`, 'error');
      return;
    }

    const targetClass = allowedClasses.find(c => c.id === formClassId);
    const className = targetClass?.name || '9A1';

    if (editingTopicId) {
      const res = db.updateTopic(editingTopicId, {
        title: formTitle.trim(),
        name: formTitle.trim(),
        classId: formClassId,
        className,
        subjectName: formSubjectName,
        lessonDate: formLessonDate,
        period: Number(formPeriod),
        sessionType: formSessionType,
        content: formContent,
        status: formStatus,
        color: formColor,
        questionIds: formQuestionIds,
      });

      if (!res.success) {
        showToast(res.error || 'Cập nhật chủ đề thất bại!', 'error');
        return;
      }
      showToast(`✓ Đã cập nhật chủ đề "${formTitle.trim()}" thành công!`, 'success');
    } else {
      const res = db.createTopic(
        {
          title: formTitle.trim(),
          name: formTitle.trim(),
          classId: formClassId,
          className,
          subjectId: `sub_${formSubjectName.toLowerCase()}`,
          subjectName: formSubjectName,
          gradeLevel: targetClass?.gradeLevel || 9,
          academicYearId: selectedAcademicYear,
          lessonDate: formLessonDate,
          period: Number(formPeriod),
          sessionType: formSessionType,
          content: formContent,
          description: formTitle.trim(),
          status: formStatus,
          color: formColor,
          questionIds: formQuestionIds,
          createdBy: teacherId,
          createdByName: teacherName,
        },
        { allowDuplicateWarning: forceDuplicate }
      );

      if (!res.success) {
        if (res.isDuplicateWarning) {
          setDuplicateWarning(res.error || 'Cảnh báo trùng tên chủ đề trong cùng lớp, môn và buổi học.');
          return;
        }
        showToast(res.error || 'Tạo chủ đề thất bại!', 'error');
        return;
      }
      showToast(`✓ Đã tạo thành công chủ đề mới "${formTitle.trim()}"!`, 'success');
    }

    setIsFormModalOpen(false);
    reloadTopics();
  };

  const handleCloneTopic = (t: AssignmentTopic) => {
    const res = db.cloneTopic(t.id, teacherId, teacherName);
    if (res.success && res.topic) {
      if (selectedStatus !== 'all' && selectedStatus !== 'draft') {
        setSelectedStatus('all');
      }
      setRecentlyClonedId(res.topic.id);
      setTimeout(() => setRecentlyClonedId(null), 4000);
      showToast(`✓ Đã nhân bản chủ đề "${t.title || t.name}" → "${res.topic.title}" (Bản nháp).`, 'success');
      reloadTopics();
    } else {
      showToast(res.error || 'Nhân bản thất bại', 'error');
    }
  };

  const handleDeleteTopic = (t: AssignmentTopic) => {
    setDeletingTopic(t);
  };

  const confirmDeleteTopic = () => {
    if (!deletingTopic) return;
    const title = deletingTopic.title || deletingTopic.name;
    const res = db.deleteTopic(deletingTopic.id);
    if (res.success) {
      if (res.archivedInstead) {
        showToast(`ℹ ${res.error}`, 'info');
      } else {
        showToast(`✓ Đã xóa chủ đề "${title}".`, 'info');
      }
      setDeletingTopic(null);
      reloadTopics();
    } else {
      showToast(res.error || 'Không thể xóa chủ đề.', 'error');
    }
  };

  // Open question bank picker modal from Form or View
  const handleOpenBankPicker = () => {
    setPickerSelectedQids(new Set(formQuestionIds));
    setPickerSearch('');
    setPickerType('all');
    setPickerDifficulty('all');
    setIsBankPickerOpen(true);
  };

  const handleOpenBankPickerForTopic = (t: AssignmentTopic) => {
    setFormClassId(t.classId || 'class_10a1');
    setFormSubjectName(t.subjectName);
    setEditingTopicId(t.id);
    setFormQuestionIds(t.questionIds || []);
    setPickerSelectedQids(new Set(t.questionIds || []));
    setPickerSearch('');
    setPickerType('all');
    setPickerDifficulty('all');
    setIsBankPickerOpen(true);
  };

  const handleSaveBankPicker = () => {
    const updated = Array.from(pickerSelectedQids);
    setFormQuestionIds(updated);
    if (editingTopicId) {
      db.linkQuestionsToTopic(editingTopicId, updated);
      reloadTopics();
      const updatedTopic = db.getTopicById(editingTopicId) || null;
      if (viewingTopic && viewingTopic.id === editingTopicId) {
        setViewingTopic(updatedTopic);
      }
      if (managingQuestionsTopic && managingQuestionsTopic.id === editingTopicId) {
        setManagingQuestionsTopic(updatedTopic);
      }
    }
    setIsBankPickerOpen(false);
    showToast(`Đã gắn ${updated.length} câu hỏi vào chủ đề!`, 'success');
  };

  // Quick create question and link to current topic
  const handleCreateNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQContent.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi!', 'error');
      return;
    }

    const options =
      newQType === 'single'
        ? [
            { id: 'A', text: newQOptionA || 'Phương án A' },
            { id: 'B', text: newQOptionB || 'Phương án B' },
            { id: 'C', text: newQOptionC || 'Phương án C' },
            { id: 'D', text: newQOptionD || 'Phương án D' },
          ]
        : undefined;

    const newQ = db.createQuestion({
      subject: formSubjectName,
      grade: 9,
      topic: formTitle || 'Chủ đề bài học',
      type: newQType,
      content: newQContent.trim(),
      options,
      correctAnswer: newQType === 'single' ? newQCorrectAnswer : 'Theo barem chấm',
      explanation: newQExplanation.trim() || 'Lời giải chi tiết đang được cập nhật.',
      rubric: newQType === 'essay' ? newQRubric.trim() : undefined,
      difficulty: newQDifficulty,
      points: newQType === 'essay' ? 2.0 : 0.5,
      status: 'approved',
      tags: [formSubjectName, 'Màn hình 111', formTitle || 'Chủ đề'],
    });

    setFormQuestionIds(prev => [...prev, newQ.id]);
    if (editingTopicId) {
      db.linkQuestionsToTopic(editingTopicId, [newQ.id]);
      reloadTopics();
      const updatedTopic = db.getTopicById(editingTopicId) || null;
      if (viewingTopic && viewingTopic.id === editingTopicId) {
        setViewingTopic(updatedTopic);
      }
      if (managingQuestionsTopic && managingQuestionsTopic.id === editingTopicId) {
        setManagingQuestionsTopic(updatedTopic);
      }
    }

    setIsCreateQuestionOpen(false);
    setNewQContent('');
    setNewQOptionA('');
    setNewQOptionB('');
    setNewQOptionC('');
    setNewQOptionD('');
    setNewQExplanation('');
    setNewQRubric('');
    showToast(`✓ Đã tạo câu hỏi mới và tự động gắn vào chủ đề!`, 'success');
  };

  const handleUnlinkQuestion = (topicId: string, qid: string) => {
    db.unlinkQuestionFromTopic(topicId, qid);
    reloadTopics();
    const updatedTopic = db.getTopicById(topicId) || null;
    if (viewingTopic && viewingTopic.id === topicId) {
      setViewingTopic(updatedTopic);
    }
    if (managingQuestionsTopic && managingQuestionsTopic.id === topicId) {
      setManagingQuestionsTopic(updatedTopic);
    }
    showToast('Đã gỡ câu hỏi khỏi chủ đề (câu hỏi vẫn lưu trong ngân hàng gốc).', 'info');
  };

  const handleOpenEditQuestionItem = (q: Question) => {
    setEditingQuestionItem(q);
    setEditQContent(q.content);
    setEditQOptA(q.options?.find(o => o.id === 'A')?.text || '');
    setEditQOptB(q.options?.find(o => o.id === 'B')?.text || '');
    setEditQOptC(q.options?.find(o => o.id === 'C')?.text || '');
    setEditQOptD(q.options?.find(o => o.id === 'D')?.text || '');
    setEditQCorrectAnswer((Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer) || 'A');
    setEditQExplanation(q.explanation || '');
    setEditQDifficulty((q.difficulty as any) || 'medium');
  };

  const handleSaveEditQuestionItem = () => {
    if (!editingQuestionItem) return;
    if (!editQContent.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi!', 'warning');
      return;
    }

    const updatedOptions = editingQuestionItem.type !== 'essay' ? [
      { id: 'A', text: editQOptA },
      { id: 'B', text: editQOptB },
      { id: 'C', text: editQOptC },
      { id: 'D', text: editQOptD },
    ] : undefined;

    db.updateQuestion(editingQuestionItem.id, {
      content: editQContent,
      options: updatedOptions,
      correctAnswer: editQCorrectAnswer,
      explanation: editQExplanation,
      difficulty: editQDifficulty,
    });

    setEditingQuestionItem(null);
    reloadTopics();
    showToast('✓ Đã cập nhật nội dung câu hỏi trắc nghiệm!', 'success');
  };

  const handleAutoGenerateForTopic = async () => {
    const topicTitle = formTitle.trim();
    if (!topicTitle) {
      showToast('Vui lòng nhập Tên chủ đề bài học trước khi tạo câu hỏi tự động!', 'warning');
      return;
    }

    setIsAutoGeneratingTopicQuestions(true);
    try {
      const payload = {
        topic: topicTitle,
        lessonContent: formContent,
        subject: formSubjectName,
        grade: 10,
        count: 3,
        difficulty: 'medium' as const,
      };

      let results: any[] = [];
      try {
        results = await aiService.generateQuestionsAdvanced(payload);
      } catch {
        results = aiService.generateFallbackQuestions(payload);
      }

      if (!results || results.length === 0) {
        results = aiService.generateFallbackQuestions(payload);
      }

      const questionsToSave = results.map(q => ({
        subject: formSubjectName,
        grade: 10,
        chapter: '',
        lesson: formLessonDate || 'Buổi 1',
        topic: topicTitle,
        type: q.type || 'single',
        content: q.content,
        passage: q.passage,
        options: q.options,
        correctAnswer: q.correctAnswer,
        subQuestions: q.subQuestions,
        matchingPairs: q.matchingPairs,
        orderingItems: q.orderingItems,
        explanation: q.explanation || 'Lời giải chi tiết chuẩn GDPT 2018.',
        whyCorrect: q.whyCorrect,
        rubric: q.rubric,
        difficulty: q.difficulty || 'medium',
        status: 'pending' as const,
        qualityScore: 92,
        tags: [formSubjectName, topicTitle, 'Auto tạo'],
      }));

      const added = db.addBatchQuestions(questionsToSave);
      const addedIds = added.map(item => item.id);
      setFormQuestionIds(prev => Array.from(new Set([...prev, ...addedIds])));

      showToast(`✓ Đã Auto tạo ${added.length} câu hỏi và chuyển vào tab Chờ duyệt của Ngân hàng câu hỏi!`, 'success');
    } catch (err: any) {
      showToast('Lỗi khi auto tạo câu hỏi: ' + (err?.message || 'Không xác định'), 'error');
    } finally {
      setIsAutoGeneratingTopicQuestions(false);
    }
  };

  const handleAutoGenerateForManagingTopic = async (topic: AssignmentTopic) => {
    setIsAutoGeneratingTopicQuestions(true);
    try {
      const topicTitle = topic.title || topic.name;
      const payload = {
        topic: topicTitle,
        lessonContent: topic.content || topic.description || '',
        subject: topic.subjectName,
        grade: 10,
        count: 3,
        difficulty: 'medium' as const,
      };

      let results: any[] = [];
      try {
        results = await aiService.generateQuestionsAdvanced(payload);
      } catch {
        results = aiService.generateFallbackQuestions(payload);
      }

      if (!results || results.length === 0) {
        results = aiService.generateFallbackQuestions(payload);
      }

      const questionsToSave = results.map(q => ({
        subject: topic.subjectName,
        grade: 10,
        chapter: '',
        lesson: topic.lessonDate || 'Buổi 1',
        topic: topicTitle,
        type: q.type || 'single',
        content: q.content,
        passage: q.passage,
        options: q.options,
        correctAnswer: q.correctAnswer,
        subQuestions: q.subQuestions,
        matchingPairs: q.matchingPairs,
        orderingItems: q.orderingItems,
        explanation: q.explanation || 'Lời giải chi tiết chuẩn GDPT 2018.',
        whyCorrect: q.whyCorrect,
        rubric: q.rubric,
        difficulty: q.difficulty || 'medium',
        status: 'pending' as const,
        qualityScore: 92,
        tags: [topic.subjectName, topicTitle, 'Auto tạo'],
      }));

      const added = db.addBatchQuestions(questionsToSave);
      const addedIds = added.map(item => item.id);
      const updatedQids = Array.from(new Set([...(topic.questionIds || []), ...addedIds]));

      db.updateTopic(topic.id, { questionIds: updatedQids });
      setManagingQuestionsTopic({ ...topic, questionIds: updatedQids });
      setTopics(db.getTopics());

      showToast(`✓ Đã Auto tạo ${added.length} câu hỏi và chuyển vào tab Chờ duyệt của Ngân hàng câu hỏi!`, 'success');
    } catch (err: any) {
      showToast('Lỗi khi auto tạo câu hỏi: ' + (err?.message || 'Không xác định'), 'error');
    } finally {
      setIsAutoGeneratingTopicQuestions(false);
    }
  };

  // Questions available in bank for picker
  const allBankQuestions = useMemo(() => db.getQuestions(), []);
  const filteredBankQuestions = useMemo(() => {
    return allBankQuestions.filter(q => {
      if (formSubjectName && q.subject.toLowerCase() !== formSubjectName.toLowerCase()) {
        return false;
      }
      if (pickerType === 'mcq' && q.type === 'essay') return false;
      if (pickerType === 'essay' && q.type !== 'essay') return false;
      if (pickerDifficulty !== 'all' && q.difficulty !== pickerDifficulty) return false;
      if (pickerSearch.trim()) {
        const s = pickerSearch.toLowerCase().trim();
        const matchContent = q.content.toLowerCase().includes(s);
        const matchTopic = (q.topic || '').toLowerCase().includes(s);
        if (!matchContent && !matchTopic) return false;
      }
      return true;
    });
  }, [allBankQuestions, formSubjectName, pickerType, pickerDifficulty, pickerSearch]);

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & STATS */}
      <div className="hud-panel bg-[#041527] border border-[#0e3d54] rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#0e3d54]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Màn Hình 111 – Quản Lý Chủ Đề Môn Học Theo Buổi
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                  Phân quyền GV
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Quản lý kiến thức trọng tâm theo buổi học, liên kết ngân hàng câu hỏi và chuẩn bị nguồn câu đủ điều kiện ra đề
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateForm}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chủ Đề Mới</span>
            </button>
          </div>
        </div>

        {/* 3.1. BỘ LỌC TOÀN DIỆN MÀN HÌNH 111 */}
        <div className="space-y-3 pt-4">
          {/* Hàng bộ lọc chính: Textbox tìm kiếm chủ đề -> Tất cả các lớp -> Môn học -> Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Textbox tìm kiếm chủ đề */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tìm kiếm chủ đề</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm chủ đề..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg pl-8 pr-7 py-2 text-xs focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                />
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Combobox Tất cả các lớp */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lớp học</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Tất cả các lớp</option>
                {allowedClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} {c.homeroomTeacherId === teacherId ? '(GVCN)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Combobox Môn học */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Môn học</label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Tất cả môn học</option>
                <option value="Toán học">Toán học</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Tin học">Tin học</option>
              </select>
            </div>

            {/* 4. Combobox Trạng thái */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Trạng thái</label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ready">Đã hoàn thiện</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>

          {/* Hàng bộ lọc phụ: Năm học / Kỳ & Buổi học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Năm học / kỳ */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Năm học / Kỳ</label>
              <select
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="ay_2024_2025">2024 - 2025 (Học kỳ II)</option>
                <option value="ay_2023_2024">2023 - 2024 (Đã kết thúc)</option>
              </select>
            </div>

            {/* Buổi học / Ngày */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Buổi học</label>
              <select
                value={selectedSessionType}
                onChange={e => setSelectedSessionType(e.target.value)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Tất cả buổi học</option>
                <option value="current">Buổi hiện tại</option>
                <option value="previous">Các buổi trước</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3.1. BẢNG DANH SÁCH CHỦ ĐỀ */}
      <div className="hud-panel bg-[#041527] border border-[#0e3d54] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#0e3d54] flex flex-wrap items-center justify-between gap-3 bg-[#03172c]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Danh sách chủ đề bài học</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              {filteredTopics.length} chủ đề
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <div className="hidden sm:flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Đã hoàn thiện
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Bản nháp
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
                Lưu trữ
              </span>
            </div>

            {filteredTopics.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollTable(-220)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#041527] hover:bg-[#06203a] border border-[#0e3d54] text-cyan-300 font-semibold text-[11px] cursor-pointer transition-colors"
                  title="Cuộn bảng sang trái"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trái</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollTable(220)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#041527] hover:bg-[#06203a] border border-[#0e3d54] text-cyan-300 font-semibold text-[11px] cursor-pointer transition-colors"
                  title="Cuộn bảng sang phải"
                >
                  <span>Phải</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
            <p className="text-base font-medium">Không tìm thấy chủ đề bài học phù hợp với bộ lọc</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Thử xóa bộ lọc tìm kiếm hoặc bấm nút "Thêm Chủ Đề Mới" để thiết lập kiến thức trọng tâm cho buổi học của lớp bạn.
            </p>
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo chủ đề đầu tiên</span>
            </button>
          </div>
        ) : (
          <div ref={tableScrollRef} className="overflow-x-auto custom-horizontal-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#0e3d54] bg-[#020f1c]/70 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[260px]">Tên chủ đề & Nội dung</th>
                  <th className="py-3 px-3 min-w-[120px]">Lớp & Môn</th>
                  <th className="py-3 px-3 min-w-[140px]">Buổi học</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Câu TN đủ ĐK</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Câu TL đủ ĐK</th>
                  <th className="py-3 px-3 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-3 min-w-[130px]">Người tạo & Cập nhật</th>
                  <th className="sticky right-0 z-20 bg-[#051c33] border-l border-[#0e3d54] shadow-[-8px_0_12px_rgba(2,15,28,0.65)] py-3 px-4 text-center whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0e3d54]">
                {filteredTopics.map(t => {
                  const stats = db.getTopicStats(t.id);
                  const isReady = t.status === 'ready';
                  const isDraft = t.status === 'draft';
                  const isArchived = t.status === 'archived';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-[#06203a]/50 transition-colors group ${
                        recentlyClonedId === t.id ? 'bg-cyan-950/50 ring-1 ring-inset ring-cyan-400/60' : ''
                      }`}
                    >
                      {/* Tên chủ đề */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: t.color || '#06b6d4' }}
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => setViewingTopic(t)}
                              className="text-left font-semibold text-white text-sm line-clamp-1 group-hover:text-cyan-300 transition-colors cursor-pointer hover:underline"
                              title="Bấm để xem chi tiết chủ đề"
                            >
                              {t.title || t.name}
                            </button>
                            <div className="text-slate-400 text-xs line-clamp-2 mt-0.5 font-normal">
                              {t.content || t.description || 'Chưa có nội dung thuyết minh.'}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-slate-500">Mã: {t.id}</span>
                              {stats.usedInAssignmentsCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                  Đã dùng {stats.usedInAssignmentsCount} bài tập
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingTopic(t)}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#03172c] hover:bg-cyan-950 text-cyan-400 border border-[#0e3d54] cursor-pointer"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>Xem</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectTopicForAssignment(
                                    t.id,
                                    t.title || t.name,
                                    t.subjectName,
                                    t.classId || 'class_10a1'
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 font-semibold cursor-pointer transition-colors"
                              >
                                <FileText className="w-2.5 h-2.5" />
                                <span>Tạo đề</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Lớp & Môn */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-white">{t.className || '9A1'}</div>
                        <div className="text-slate-400 text-[11px]">{t.subjectName}</div>
                      </td>

                      {/* Buổi / Ngày học */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          <span>{t.lessonDate || '2025-02-24'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400">Tiết {t.period || 1}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              t.sessionType === 'current'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {t.sessionType === 'current' ? 'Buổi hiện tại' : 'Buổi trước'}
                          </span>
                        </div>
                      </td>

                      {/* Số câu TN đủ ĐK */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                            stats.eligibleMcqCount > 0
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {stats.eligibleMcqCount} câu
                        </span>
                      </td>

                      {/* Số câu TL đủ ĐK */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                            stats.eligibleEssayCount > 0
                              ? 'bg-purple-950/80 text-purple-400 border border-purple-800'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {stats.eligibleEssayCount} câu
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isReady && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã hoàn thiện
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                            <Clock className="w-3 h-3" />
                            Bản nháp
                          </span>
                        )}
                        {isArchived && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <Archive className="w-3 h-3" />
                            Đã lưu trữ
                          </span>
                        )}
                      </td>

                      {/* Người tạo & cập nhật */}
                      <td className="py-3.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        <div>{t.createdByName || 'Cô Lê Thu Hà'}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">
                          {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                        </div>
                      </td>

                      {/* Thao tác (5 icon button chuẩn theo ảnh chụp: Quản lý câu hỏi theo chủ đề, Open/View, Nhân bản, Chỉnh sửa, Xóa) */}
                      <td className="sticky right-0 z-10 bg-[#041527] border-l border-[#0e3d54] shadow-[-8px_0_12px_rgba(2,15,28,0.55)] py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* 1. Quản lý câu hỏi theo chủ đề (Xanh lá - FileQuestion) */}
                          <button
                            type="button"
                            title={`Quản lý câu hỏi theo chủ đề (${t.questionIds?.length || 0} câu)`}
                            onClick={() => {
                              setManageQuestionsFilterType('all');
                              setManageQuestionsFilterStatus('all');
                              setManageQuestionsSearch('');
                              setManagingQuestionsTopic(t);
                            }}
                            className="relative w-9 h-9 rounded-xl bg-emerald-950/60 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          >
                            <FileQuestion className="w-4 h-4" />
                            {(t.questionIds?.length || 0) > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow">
                                {t.questionIds?.length}
                              </span>
                            )}
                          </button>

                          {/* 2. Mở giáo án giảng dạy như trang Word (Cyan - BookOpen) */}
                          <button
                            type="button"
                            title="Mở giáo án giảng dạy như trang Word"
                            onClick={() => setSelectedLessonDocTopic(t)}
                            className="w-9 h-9 rounded-xl bg-cyan-950/60 hover:bg-cyan-600 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* 3. Nhân bản chủ đề (Slate - Copy) */}
                          <button
                            type="button"
                            title="Nhân bản chủ đề"
                            onClick={() => handleCloneTopic(t)}
                            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/40 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* 4. Edit: Chỉnh sửa chủ đề (Xanh dương - Edit2) */}
                          <button
                            type="button"
                            title="Edit: Chỉnh sửa chủ đề"
                            onClick={() => handleOpenEditForm(t)}
                            className="w-9 h-9 rounded-xl bg-blue-950/60 hover:bg-blue-600 border border-blue-500/40 hover:border-blue-400 text-blue-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* 5. Delete: Xóa chủ đề (Đỏ - Trash2) */}
                          <button
                            type="button"
                            title="Delete: Xóa chủ đề"
                            onClick={() => handleDeleteTopic(t)}
                            className="w-9 h-9 rounded-xl bg-rose-950/60 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-400 text-rose-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3.2. FORM THÊM / SỬA CHỦ ĐỀ MODAL (CHUẨN THEO ẢNH ĐÍNH KÈM) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingTopicId ? 'Chỉnh sửa chủ đề bài học' : 'Thêm chủ đề bài học mới'}
        subtitle="Thiết lập nội dung và liên kết câu hỏi theo buổi học"
        maxWidth="3xl"
      >
        <form onSubmit={e => handleSaveTopic(e, false)} className="space-y-4 text-xs">
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm">Cảnh báo trùng tên chủ đề!</div>
                <div className="text-xs text-amber-300/90 mt-0.5">{duplicateWarning}</div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveTopic(undefined, true)}
                    className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs cursor-pointer"
                  >
                    Vẫn lưu chủ đề này
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                  >
                    Đổi tên khác
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DÒNG 1: LỚP HỌC * | MÔN HỌC * | BUỔI HỌC * (TEXTBOX) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Lớp học */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Lớp học <span className="text-red-400">*</span>
              </label>
              <select
                value={formClassId}
                onChange={e => {
                  setFormClassId(e.target.value);
                  const subjs = classSubjectsMap[e.target.value] || ['Toán học'];
                  if (!subjs.includes(formSubjectName)) {
                    setFormSubjectName(subjs[0] || 'Toán học');
                  }
                }}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              >
                {allowedClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} {c.homeroomTeacherId === teacherId ? '(GVCN)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Môn học */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Môn học <span className="text-red-400">*</span>
              </label>
              <select
                value={formSubjectName}
                onChange={e => setFormSubjectName(e.target.value)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              >
                {formAvailableSubjects.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Buổi học * (Kiểu textbox theo đúng ảnh đính kèm) */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Buổi học <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formLessonDate}
                onChange={e => setFormLessonDate(e.target.value)}
                placeholder="Ví dụ: Buổi 1 - Đại số"
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400 text-xs placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* DÒNG 2: TÊN CHỦ ĐỀ BÀI HỌC * (TỐI ĐA 200 KÝ TỰ) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">
                Tên chủ đề bài học <span className="text-red-400">*</span> (tối đa 200 ký tự)
              </label>
              <span
                className={`text-[11px] font-mono ${
                  formTitle.length > 200 ? 'text-red-400 font-bold' : 'text-slate-500'
                }`}
              >
                {formTitle.length}/200
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="Ví dụ: Hệ phương trình bậc nhất nhiều ẩn..."
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 text-sm"
            />
          </div>

          {/* DÒNG 3: NỘI DUNG CHI TIẾT CHỦ ĐỀ (TỐI ĐA 8.000 KÝ TỰ) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">
                Nội dung chi tiết chủ đề (tối đa 8.000 ký tự)
              </label>
              <span
                className={`text-[11px] font-mono ${
                  formContent.length > 8000
                    ? 'text-red-400 font-bold'
                    : formContent.length > 7000
                    ? 'text-amber-400'
                    : 'text-slate-500'
                }`}
              >
                {formContent.length}/8000
              </span>
            </div>
            <textarea
              rows={6}
              placeholder="Nhập mô tả chi tiết nội dung kiến thức trọng tâm của chủ đề..."
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              className={`w-full bg-[#03172c] border ${
                formContent.length > 8000 ? 'border-red-500' : 'border-[#0e3d54]'
              } text-white rounded-lg p-3 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 text-xs font-mono leading-relaxed`}
            />
            {formContent.length > 8000 && (
              <p className="text-red-400 text-[11px] mt-1">
                ⚠️ Nội dung đã vượt quá giới hạn 8.000 ký tự. Vui lòng rút gọn để có thể lưu.
              </p>
            )}
          </div>

          {/* DÒNG 4: TRẠNG THÁI CHỦ ĐỀ | LIÊN KẾT CÂU HỎI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Trạng thái chủ đề */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Trạng thái chủ đề</label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as TopicStatus)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-400 text-xs"
              >
                <option value="ready">Đã hoàn thiện (Ready for Assignment)</option>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="archived">Lưu trữ (Archived)</option>
              </select>
            </div>

            {/* Liên kết câu hỏi */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Liên kết câu hỏi</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenBankPicker}
                  className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-[#020d18] hover:bg-[#06203a] border border-[#0e3d54] rounded-lg text-cyan-300 hover:text-white transition-colors cursor-pointer group"
                >
                  <span className="font-semibold text-xs text-cyan-400 group-hover:text-cyan-300">
                    {formQuestionIds.length > 0 ? `Đã chọn ${formQuestionIds.length} câu hỏi` : '+ Gắn câu hỏi từ ngân hàng'}
                  </span>
                  <span className="text-[11px] text-slate-400 italic">
                    (Tự động từ NHCH)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateQuestionOpen(true)}
                  className="px-3 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                  title="Tạo nhanh câu hỏi mới và tự động gắn vào chủ đề"
                >
                  + Tạo câu mới
                </button>
                <button
                  type="button"
                  onClick={handleAutoGenerateForTopic}
                  disabled={isAutoGeneratingTopicQuestions}
                  className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 text-white text-xs font-bold shadow-md shadow-purple-950/40 cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
                  title="Auto tạo câu hỏi trắc nghiệm - toàn bộ câu hỏi tạo ra sẽ lưu vào tab Chờ duyệt của Ngân hàng câu hỏi"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                  <span>{isAutoGeneratingTopicQuestions ? 'Đang tạo...' : 'Auto tạo câu hỏi'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* NÚT THAO TÁC */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0e3d54]">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                setFormStatus('draft');
                setTimeout(() => handleSaveTopic(), 50);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-medium cursor-pointer"
            >
              Lưu bản nháp
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md cursor-pointer"
            >
              {editingTopicId ? 'Lưu Thay Đổi Chủ Đề' : 'Lưu Chủ Đề (Hoàn thiện)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3.3. MODAL CHI TIẾT CHỦ ĐỀ & QUẢN LÝ CÂU HỎI LIÊN KẾT */}
      {viewingTopic && (
        <Modal
          isOpen={!!viewingTopic}
          onClose={() => setViewingTopic(null)}
          title={`Chi Tiết Chủ Đề: ${viewingTopic.title || viewingTopic.name}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-[#03172c] border border-[#0e3d54] grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block">Lớp áp dụng:</span>
                <span className="font-semibold text-white text-sm">{viewingTopic.className || '9A1'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Môn học:</span>
                <span className="font-semibold text-cyan-400 text-sm">{viewingTopic.subjectName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Buổi học:</span>
                <span className="font-medium text-slate-200">
                  {viewingTopic.lessonDate || 'Buổi 1'} (Tiết {viewingTopic.period || 1})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Trạng thái:</span>
                <span className="font-semibold text-emerald-400 uppercase">{viewingTopic.status}</span>
              </div>
            </div>

            {/* Thanh công cụ 5 chức năng quản lý chủ đề */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#020d18] border border-[#0e3d54]">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Thao tác với chủ đề:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* 1. Quản lý câu hỏi theo chủ đề */}
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTopic;
                    setViewingTopic(null);
                    setManagingQuestionsTopic(t);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 hover:text-white font-semibold text-xs cursor-pointer transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Quản lý câu hỏi ({viewingTopic.questionIds?.length || 0})</span>
                </button>

                {/* 4. Chỉnh sửa */}
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTopic;
                    setViewingTopic(null);
                    handleOpenEditForm(t);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-medium text-xs cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </button>

                {/* 2. Nhân bản */}
                <button
                  type="button"
                  onClick={() => {
                    handleCloneTopic(viewingTopic);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white font-medium text-xs cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Nhân bản</span>
                </button>

                {/* 3. Xóa */}
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTopic;
                    setViewingTopic(null);
                    handleDeleteTopic(t);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 hover:text-red-300 font-medium text-xs cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>

                {/* Open */}
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTopic;
                    setViewingTopic(null);
                    setSelectedLessonDocTopic(t);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Giáo án Word</span>
                </button>
              </div>
            </div>

            {/* Nội dung 8.000 ký tự */}
            <div>
              <h4 className="text-slate-300 font-semibold mb-1">Nội dung chi tiết chủ đề:</h4>
              <div className="p-3.5 rounded-xl bg-[#020f1c] border border-[#0e3d54] text-slate-300 font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {viewingTopic.content || viewingTopic.description || 'Chưa cập nhật nội dung bài giảng.'}
              </div>
            </div>

            {/* Danh sách câu hỏi đã gắn & Thống kê đủ điều kiện */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-slate-200 font-semibold text-sm">Câu hỏi thuộc chủ đề</h4>
                  {(() => {
                    const stats = db.getTopicStats(viewingTopic.id);
                    return (
                      <span className="text-xs text-slate-400">
                        (Tổng: <b className="text-white">{stats.totalQuestions}</b> câu | Đủ ĐK:{' '}
                        <b className="text-emerald-400">{stats.eligibleMcqCount}</b> TN,{' '}
                        <b className="text-purple-400">{stats.eligibleEssayCount}</b> TL)
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFormClassId(viewingTopic.classId || 'class_10a1');
                      setFormSubjectName(viewingTopic.subjectName);
                      setEditingTopicId(viewingTopic.id);
                      setFormQuestionIds(viewingTopic.questionIds || []);
                      handleOpenBankPicker();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs cursor-pointer"
                  >
                    + Thêm từ ngân hàng
                  </button>
                </div>
              </div>

              {(!viewingTopic.questionIds || viewingTopic.questionIds.length === 0) ? (
                <div className="py-8 text-center text-slate-500 bg-[#03172c] rounded-xl border border-dashed border-[#0e3d54]">
                  Chưa có câu hỏi nào được gắn với chủ đề này. Hãy bấm "Thêm từ ngân hàng" để gắn câu hỏi.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {viewingTopic.questionIds.map(qid => {
                    const q = db.getQuestions().find(item => item.id === qid);
                    if (!q) return null;
                    const isEligible = db.isQuestionEligible(q);

                    return (
                      <div
                        key={qid}
                        className="p-3 rounded-xl bg-[#03172c] border border-[#0e3d54] flex items-start justify-between gap-3 hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                q.type === 'essay'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              }`}
                            >
                              {q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              Độ khó: <b>{q.difficulty}</b>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Điểm: <b>{q.points || (q.type === 'essay' ? 2 : 0.5)}đ</b>
                            </span>
                            {isEligible ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                <Check className="w-3 h-3" /> Đủ điều kiện ra đề
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                                <AlertTriangle className="w-3 h-3" /> Chưa hoàn thiện đáp án
                              </span>
                            )}
                          </div>
                          <p className="text-slate-200 font-medium text-xs line-clamp-2">{q.content}</p>
                          {q.correctAnswer && (
                            <p className="text-emerald-400/90 text-[11px] mt-1 line-clamp-1">
                              Đáp án: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleUnlinkQuestion(viewingTopic.id, qid)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          title="Gỡ khỏi chủ đề này"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="flex items-center justify-between pt-3 border-t border-[#0e3d54]">
              <div className="text-slate-500 text-xs">
                Mẹo: Có thể dùng chủ đề này để cấu hình đề bài tập hoặc bài kiểm tra trong mục Tạo bài tập.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingTopic(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTopic;
                    setViewingTopic(null);
                    setSelectedLessonDocTopic(t);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-md"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Mở Trang Word Giảng Dạy (Open)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTopic;
                    setViewingTopic(null);
                    onSelectTopicForAssignment(
                      t.id,
                      t.title || t.name,
                      t.subjectName,
                      t.classId || 'class_10a1'
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Ra Bài Tập Từ Chủ Đề Này
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL GẮN CÂU HỎI TỪ NGÂN HÀNG VÀO CHỦ ĐỀ */}
      <Modal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        title={`Gắn Câu Hỏi Từ Ngân Hàng Vào Chủ Đề (${formSubjectName})`}
        maxWidth="4xl"
      >
        <div className="space-y-4 text-xs">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#03172c] border border-[#0e3d54]">
            <div>
              <label className="block text-slate-400 mb-1">Loại câu hỏi</label>
              <select
                value={pickerType}
                onChange={e => setPickerType(e.target.value as any)}
                className="w-full bg-[#020f1c] border border-[#0e3d54] text-white rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="all">Tất cả (Trắc nghiệm + Tự luận)</option>
                <option value="mcq">Chỉ trắc nghiệm</option>
                <option value="essay">Chỉ tự luận</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Mức độ nhận thức</label>
              <select
                value={pickerDifficulty}
                onChange={e => setPickerDifficulty(e.target.value)}
                className="w-full bg-[#020f1c] border border-[#0e3d54] text-white rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="all">Tất cả độ khó</option>
                <option value="easy">Nhận biết (Dễ)</option>
                <option value="medium">Thông hiểu (Trung bình)</option>
                <option value="hard">Vận dụng (Khó)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Tìm nội dung</label>
              <input
                type="text"
                placeholder="Tìm câu hỏi..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                className="w-full bg-[#020f1c] border border-[#0e3d54] text-white rounded-lg px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Tìm thấy {filteredBankQuestions.length} câu hỏi phù hợp</span>
            <span className="font-semibold text-cyan-400">
              Đã tích chọn: {pickerSelectedQids.size} câu
            </span>
          </div>

          {/* Questions list */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {filteredBankQuestions.map(q => {
              const isChecked = pickerSelectedQids.has(q.id);
              const isEligible = db.isQuestionEligible(q);

              return (
                <div
                  key={q.id}
                  onClick={() => {
                    const next = new Set(pickerSelectedQids);
                    if (isChecked) next.delete(q.id);
                    else next.add(q.id);
                    setPickerSelectedQids(next);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-cyan-950/40 border-cyan-500'
                      : 'bg-[#03172c] border-[#0e3d54] hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.type === 'essay'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                      </span>
                      <span className="text-[10px] text-slate-400">Độ khó: {q.difficulty}</span>
                      <span className="text-[10px] text-slate-400">
                        Điểm gợi ý: {q.points || (q.type === 'essay' ? 2 : 0.5)}đ
                      </span>
                      {isEligible ? (
                        <span className="text-[10px] text-emerald-400 font-medium">✓ Đủ ĐK ra đề</span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-medium">⚠️ Thiếu đáp án</span>
                      )}
                    </div>
                    <p className="text-white font-medium text-xs line-clamp-2">{q.content}</p>
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 mt-1 text-[11px] text-slate-400">
                        {q.options.slice(0, 4).map(opt => (
                          <span key={opt.id} className="line-clamp-1">
                            <b>{opt.id}.</b> {opt.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0e3d54]">
            <button
              type="button"
              onClick={() => setIsBankPickerOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveBankPicker}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
            >
              Lưu {pickerSelectedQids.size} Câu Hỏi Vào Chủ Đề
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL TẠO CÂU HỎI MỚI GẮN VÀO CHỦ ĐỀ */}
      <Modal
        isOpen={isCreateQuestionOpen}
        onClose={() => setIsCreateQuestionOpen(false)}
        title="Tạo Câu Hỏi Mới Thuộc Chủ Đề Này"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateNewQuestion} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Dạng câu hỏi</label>
              <select
                value={newQType}
                onChange={e => setNewQType(e.target.value as any)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
              >
                <option value="single">Trắc nghiệm một đáp án đúng</option>
                <option value="essay">Tự luận (Yêu cầu barem chấm)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Độ khó</label>
              <select
                value={newQDifficulty}
                onChange={e => setNewQDifficulty(e.target.value as any)}
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
              >
                <option value="easy">Nhận biết (Dễ)</option>
                <option value="medium">Thông hiểu (Trung bình)</option>
                <option value="hard">Vận dụng (Khó)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Nội dung câu hỏi *</label>
            <textarea
              required
              rows={3}
              value={newQContent}
              onChange={e => setNewQContent(e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2.5 text-xs font-mono"
            />
          </div>

          {newQType === 'single' ? (
            <div className="space-y-2">
              <label className="block text-slate-400">Các phương án lựa chọn:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Phương án A"
                  value={newQOptionA}
                  onChange={e => setNewQOptionA(e.target.value)}
                  className="bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Phương án B"
                  value={newQOptionB}
                  onChange={e => setNewQOptionB(e.target.value)}
                  className="bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Phương án C"
                  value={newQOptionC}
                  onChange={e => setNewQOptionC(e.target.value)}
                  className="bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Phương án D"
                  value={newQOptionD}
                  onChange={e => setNewQOptionD(e.target.value)}
                  className="bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-400">Đáp án đúng:</span>
                {(['A', 'B', 'C', 'D'] as const).map(k => (
                  <label key={k} className="flex items-center gap-1 text-white cursor-pointer">
                    <input
                      type="radio"
                      name="correctAnswerRadio"
                      value={k}
                      checked={newQCorrectAnswer === k}
                      onChange={() => setNewQCorrectAnswer(k)}
                    />
                    <span>{k}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-400 mb-1">Hướng dẫn chấm / Barem tự luận (Rubric)</label>
              <textarea
                rows={2}
                value={newQRubric}
                onChange={e => setNewQRubric(e.target.value)}
                placeholder="VD: Ý 1 (0.5đ), Ý 2 (1.0đ), Kết luận (0.5đ)..."
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Lời giải chi tiết</label>
            <textarea
              rows={2}
              value={newQExplanation}
              onChange={e => setNewQExplanation(e.target.value)}
              placeholder="Giải thích các bước..."
              className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
            <button
              type="button"
              onClick={() => setIsCreateQuestionOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
            >
              Lưu & Tự Động Gắn Chủ Đề
            </button>
          </div>
        </form>
      </Modal>

      {/* 3.3. MODAL CHUYÊN BIỆT: 1. QUẢN LÝ CÂU HỎI THEO CHỦ ĐỀ */}
      {managingQuestionsTopic && (
        <Modal
          isOpen={!!managingQuestionsTopic}
          onClose={() => setManagingQuestionsTopic(null)}
          title={`Quản Lý Câu Hỏi Theo Chủ Đề: ${managingQuestionsTopic.title || managingQuestionsTopic.name}`}
          subtitle={`Lớp: ${managingQuestionsTopic.className || '9A1'} · Môn: ${managingQuestionsTopic.subjectName} · ${managingQuestionsTopic.lessonDate || 'Buổi 1'}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {/* Top KPI stats */}
            {(() => {
              const stats = db.getTopicStats(managingQuestionsTopic.id);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#03172c] border border-[#0e3d54]">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tổng số câu đã gắn</span>
                    <span className="text-lg font-bold text-white">{stats.totalQuestions} câu</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Trắc nghiệm đủ ĐK</span>
                    <span className="text-lg font-bold text-emerald-400">{stats.eligibleMcqCount} câu</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tự luận đủ ĐK</span>
                    <span className="text-lg font-bold text-purple-400">{stats.eligibleEssayCount} câu</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Số bài tập đang dùng</span>
                    <span className="text-lg font-bold text-cyan-400">{stats.usedInAssignmentsCount} bài</span>
                  </div>
                </div>
              );
            })()}

            {/* Controls Bar: Filter, Search & Add actions */}
            {(() => {
              const allQuestionsMap = new Map(db.getQuestions().map(q => [q.id, q]));
              const topicQuestionsAll = (managingQuestionsTopic.questionIds || [])
                .map(qid => allQuestionsMap.get(qid))
                .filter((q): q is Question => Boolean(q));
              const pendingInTopic = topicQuestionsAll.filter(q => q.status === 'pending');

              const filteredTopicQuestions = topicQuestionsAll.filter(q => {
                if (manageQuestionsFilterType === 'mcq' && q.type === 'essay') return false;
                if (manageQuestionsFilterType === 'essay' && q.type !== 'essay') return false;
                if (manageQuestionsFilterStatus === 'approved' && q.status !== 'approved') return false;
                if (manageQuestionsFilterStatus === 'pending' && q.status !== 'pending') return false;
                if (manageQuestionsSearch.trim()) {
                  const s = manageQuestionsSearch.toLowerCase().trim();
                  if (!q.content.toLowerCase().includes(s)) return false;
                }
                return true;
              });

              return (
                <div className="space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-[#03172c] border border-[#0e3d54]">
                    {/* Type & Status filters + Search */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm câu hỏi trong chủ đề..."
                          value={manageQuestionsSearch}
                          onChange={e => setManageQuestionsSearch(e.target.value)}
                          className="w-48 bg-[#020d18] border border-[#0e3d54] text-white rounded-lg pl-7 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
                        />
                        <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2 top-2" />
                      </div>

                      <div className="flex items-center bg-[#020d18] border border-[#0e3d54] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setManageQuestionsFilterType('all')}
                          className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                            manageQuestionsFilterType === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setManageQuestionsFilterType('mcq')}
                          className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                            manageQuestionsFilterType === 'mcq' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Trắc nghiệm
                        </button>
                        <button
                          type="button"
                          onClick={() => setManageQuestionsFilterType('essay')}
                          className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                            manageQuestionsFilterType === 'essay' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tự luận
                        </button>
                      </div>

                      <select
                        value={manageQuestionsFilterStatus}
                        onChange={e => setManageQuestionsFilterStatus(e.target.value as any)}
                        className="bg-[#020d18] border border-[#0e3d54] text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
                      >
                        <option value="all">Mọi trạng thái ({topicQuestionsAll.length})</option>
                        <option value="approved">Đã duyệt ({topicQuestionsAll.filter(q => q.status === 'approved').length})</option>
                        <option value="pending">Chờ duyệt ({pendingInTopic.length})</option>
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {pendingInTopic.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            pendingInTopic.forEach(pq => db.updateQuestion(pq.id, { status: 'approved' }));
                            reloadTopics();
                            showToast(`✓ Đã duyệt tất cả ${pendingInTopic.length} câu hỏi sang tab "Đã duyệt"!`, 'success');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt tất cả ({pendingInTopic.length})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenBankPickerForTopic(managingQuestionsTopic)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm từ ngân hàng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoGenerateForManagingTopic(managingQuestionsTopic)}
                        disabled={isAutoGeneratingTopicQuestions}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-purple-950/40"
                        title="Auto tạo câu hỏi trắc nghiệm - toàn bộ câu hỏi tạo ra sẽ lưu vào tab Chờ duyệt của Ngân hàng câu hỏi"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                        <span>{isAutoGeneratingTopicQuestions ? 'Đang tạo...' : 'Auto tạo câu hỏi'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormClassId(managingQuestionsTopic.classId || 'class_10a1');
                          setFormSubjectName(managingQuestionsTopic.subjectName);
                          setEditingTopicId(managingQuestionsTopic.id);
                          setFormTitle(managingQuestionsTopic.title || managingQuestionsTopic.name);
                          setIsCreateQuestionOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs transition-colors cursor-pointer border border-[#0e3d54]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo câu mới</span>
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  {topicQuestionsAll.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-[#03172c] rounded-xl border border-dashed border-[#0e3d54] space-y-3">
                      <FileQuestion className="w-10 h-10 mx-auto text-emerald-400 opacity-70" />
                      <p className="text-sm font-semibold">Chủ đề này chưa có câu hỏi nào được liên kết</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Hãy bấm nút <b>"Thêm từ ngân hàng"</b>, <b>"Auto tạo câu hỏi"</b> hoặc <b>"Tạo câu mới"</b> để bổ sung câu hỏi vào chủ đề này.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenBankPickerForTopic(managingQuestionsTopic)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        + Gắn câu hỏi từ ngân hàng
                      </button>
                    </div>
                  ) : filteredTopicQuestions.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 bg-[#03172c] rounded-xl border border-dashed border-[#0e3d54]">
                      Không có câu hỏi nào khớp với bộ lọc hiện tại.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {filteredTopicQuestions.map((q, qIndex) => {
                        const isEligible = db.isQuestionEligible(q);
                        const isMcq = q.type !== 'essay';

                        return (
                          <div
                            key={`${q.id}_${questionVersion}`}
                            className="p-3.5 rounded-xl bg-[#03172c] border border-[#0e3d54] hover:border-cyan-500/50 transition-colors space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-xs text-white">Câu {qIndex + 1}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isMcq
                                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                      : 'bg-purple-950 text-purple-300 border border-purple-800'
                                  }`}
                                >
                                  {isMcq ? 'Trắc nghiệm' : 'Tự luận'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    q.status === 'pending'
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                  }`}
                                >
                                  {q.status === 'pending' ? '⏳ Chờ duyệt' : '✓ Đã duyệt'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                                  Độ khó: <b>{q.difficulty}</b>
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Điểm: <b>{q.points || (isMcq ? 0.5 : 2)}đ</b>
                                </span>
                                {isEligible ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                                    <Check className="w-3 h-3" /> Đủ điều kiện ra đề
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                                    <AlertTriangle className="w-3 h-3" /> Thiếu đáp án bắt buộc
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Duyệt Button if pending */}
                                {q.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      db.updateQuestion(q.id, { status: 'approved' });
                                      reloadTopics();
                                      showToast('✓ Đã duyệt câu hỏi sang tab "Đã duyệt" của Ngân hàng câu hỏi!', 'success');
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm hover:scale-105"
                                    title="Duyệt câu hỏi này (chuyển sang tab Đã duyệt)"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Duyệt</span>
                                  </button>
                                )}

                                {/* Edit Icon Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditQuestionItem(q)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-colors cursor-pointer"
                                  title="Chỉnh sửa câu hỏi trắc nghiệm này"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUnlinkQuestion(managingQuestionsTopic.id, q.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition-colors cursor-pointer text-xs"
                                  title="Gỡ khỏi chủ đề này (không xóa khỏi ngân hàng)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Gỡ</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-slate-100 font-medium text-xs leading-relaxed whitespace-pre-line">
                              {q.content}
                            </p>

                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                {q.options.map(opt => {
                                  const isCorrect = q.correctAnswer === opt.id || (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id));
                                  return (
                                    <div
                                      key={opt.id}
                                      className={`p-2 rounded-lg border text-xs ${
                                        isCorrect
                                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300 font-semibold'
                                          : 'bg-[#020d18] border-[#0e3d54] text-slate-300'
                                      }`}
                                    >
                                      <span className="font-bold mr-1">{opt.id}.</span>
                                      <span>{opt.text}</span>
                                      {isCorrect && <span className="ml-1 text-[10px] text-emerald-400">(Đáp án đúng)</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {(q.explanation || (q as any).rubricGuide) && (
                              <div className="p-2.5 rounded-lg bg-[#020d18] border border-[#0e3d54] text-[11px] text-slate-300 space-y-1">
                                <span className="font-semibold text-cyan-400 block">Lời giải / Tiêu chí chấm:</span>
                                <p className="text-slate-400 whitespace-pre-line">
                                  {q.explanation || (q as any).rubricGuide}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#0e3d54]">
              <span className="text-xs text-slate-400">
                Chủ đề: <b className="text-white">{managingQuestionsTopic.title || managingQuestionsTopic.name}</b>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManagingQuestionsTopic(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = managingQuestionsTopic;
                    setManagingQuestionsTopic(null);
                    onSelectTopicForAssignment(
                      t.id,
                      t.title || t.name,
                      t.subjectName,
                      t.classId || 'class_10a1'
                    );
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ra Đề Từ Chủ Đề Này</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 3.4. MODAL TRANG WORD / GIÁO ÁN ĐIỆN TỬ GIẢNG DẠY (OPEN BUTTON) */}
      <TopicLessonDocModal
        isOpen={!!selectedLessonDocTopic}
        topic={selectedLessonDocTopic}
        onClose={() => setSelectedLessonDocTopic(null)}
        onTopicUpdated={upd => {
          setTopics(db.getTopics());
          if (selectedLessonDocTopic?.id === upd.id) {
            setSelectedLessonDocTopic(upd);
          }
        }}
        onOpenCreateExam={onSelectTopicForAssignment}
      />

      {/* MODAL CHỈNH SỬA CÂU HỎI TRẮC NGHIỆM */}
      {editingQuestionItem && (
        <Modal
          isOpen={!!editingQuestionItem}
          onClose={() => setEditingQuestionItem(null)}
          title="Chỉnh sửa câu hỏi trắc nghiệm"
          maxWidth="2xl"
        >
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nội dung câu hỏi *:</label>
              <textarea
                rows={3}
                value={editQContent}
                onChange={e => setEditQContent(e.target.value)}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2.5 text-xs font-mono"
              />
            </div>

            {editingQuestionItem.type !== 'essay' && (
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Các phương án lựa chọn A, B, C, D:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-bold text-cyan-400">A.</span>
                    <input
                      type="text"
                      value={editQOptA}
                      onChange={e => setEditQOptA(e.target.value)}
                      placeholder="Phương án A"
                      className="flex-1 bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-bold text-cyan-400">B.</span>
                    <input
                      type="text"
                      value={editQOptB}
                      onChange={e => setEditQOptB(e.target.value)}
                      placeholder="Phương án B"
                      className="flex-1 bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-bold text-cyan-400">C.</span>
                    <input
                      type="text"
                      value={editQOptC}
                      onChange={e => setEditQOptC(e.target.value)}
                      placeholder="Phương án C"
                      className="flex-1 bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-bold text-cyan-400">D.</span>
                    <input
                      type="text"
                      value={editQOptD}
                      onChange={e => setEditQOptD(e.target.value)}
                      placeholder="Phương án D"
                      className="flex-1 bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-[#0e3d54]">
                  <span className="text-slate-300 font-semibold">Đáp án đúng:</span>
                  {(['A', 'B', 'C', 'D'] as const).map(k => (
                    <label key={k} className="flex items-center gap-1 text-white cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="editRadioAnswer"
                        value={k}
                        checked={editQCorrectAnswer === k}
                        onChange={() => setEditQCorrectAnswer(k)}
                        className="text-cyan-500"
                      />
                      <span className={editQCorrectAnswer === k ? 'text-cyan-400' : 'text-slate-300'}>{k}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mức độ nhận thức:</label>
                <select
                  value={editQDifficulty}
                  onChange={e => setEditQDifficulty(e.target.value as any)}
                  className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs"
                >
                  <option value="easy">Nhận biết (Dễ)</option>
                  <option value="medium">Thông hiểu (Trung bình)</option>
                  <option value="hard">Vận dụng (Khó)</option>
                  <option value="very_hard">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trạng thái duyệt:</label>
                <div className="p-2 bg-[#020d18] border border-[#0e3d54] rounded-lg text-slate-300 flex items-center justify-between">
                  <span className="capitalize">{editingQuestionItem.status === 'approved' ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}</span>
                  {editingQuestionItem.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        db.updateQuestion(editingQuestionItem.id, { status: 'approved' });
                        setEditingQuestionItem({ ...editingQuestionItem, status: 'approved' });
                        reloadTopics();
                        showToast('✓ Đã duyệt câu hỏi sang tab "Đã duyệt"!', 'success');
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Duyệt ngay
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lời giải chi tiết:</label>
              <textarea
                rows={2}
                value={editQExplanation}
                onChange={e => setEditQExplanation(e.target.value)}
                placeholder="Nhập lời giải hoặc hướng dẫn làm bài..."
                className="w-full bg-[#03172c] border border-[#0e3d54] text-white rounded-lg p-2 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0e3d54]">
              <button
                type="button"
                onClick={() => setEditingQuestionItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEditQuestionItem}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Lưu Thay Đổi Câu Hỏi
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL XÁC NHẬN XÓA CHỦ ĐỀ (IFRAME-SAFE) */}
      {deletingTopic && (
        <Modal
          isOpen={!!deletingTopic}
          onClose={() => setDeletingTopic(null)}
          title="Xác nhận xóa chủ đề bài học"
          maxWidth="md"
        >
          {(() => {
            const stats = db.getTopicStats(deletingTopic.id);
            const title = deletingTopic.title || deletingTopic.name;
            const isUsed = stats.usedInAssignmentsCount > 0;
            return (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white">
                      {isUsed
                        ? 'Chủ đề đang được bài tập sử dụng'
                        : `Bạn có chắc chắn muốn xóa chủ đề "${title}"?`}
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {isUsed
                        ? `Chủ đề "${title}" đang gắn với ${stats.usedInAssignmentsCount} bài tập đã giao. Để bảo toàn dữ liệu bài làm của học sinh, hệ thống sẽ chuyển chủ đề sang trạng thái "Đã lưu trữ" thay vì xóa vĩnh viễn.`
                        : 'Chủ đề sẽ bị xóa khỏi danh sách quản lý. Các câu hỏi trong Ngân hàng câu hỏi gốc vẫn được giữ nguyên.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
                  <button
                    type="button"
                    onClick={() => setDeletingTopic(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteTopic}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isUsed ? 'Chuyển sang Lưu trữ' : 'Xác nhận Xóa'}</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
