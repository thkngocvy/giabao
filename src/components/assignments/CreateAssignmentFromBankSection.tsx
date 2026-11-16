import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  Eye,
  Check,
  Send,
  Save,
  Calendar,
  ChevronDown,
  CheckSquare,
  Zap,
  Sliders
} from 'lucide-react';
import { db } from '../../services/db';
import { aiService, GeneratedQuestion } from '../../services/aiService';
import {
  Assignment,
  Question,
  AssignmentFormat,
  AssignmentType,
  QuestionType
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../common/Modal';

interface CreateAssignmentFromBankSectionProps {
  preselectedTopicId?: string;
  onSuccess: (newAsg: Assignment) => void;
  onNavigateToScreen111: (topicId?: string) => void;
}

export const CreateAssignmentFromBankSection: React.FC<CreateAssignmentFromBankSectionProps> = ({
  preselectedTopicId,
  onSuccess,
  onNavigateToScreen111,
}) => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useToast();

  const teacherId = currentUser?.id || 'user_teacher_1';
  const teacherName = currentUser?.fullName || 'Cô Lê Thu Hà';

  // Live subscription to DB so newly AI-generated questions update eligible counts immediately
  const [dbTick, setDbTick] = useState<number>(0);
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setDbTick(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  // Permission: Assigned classes and subjects
  const { classes: allowedClasses, classSubjectsMap } = useMemo(() => {
    return db.getTeacherPermissions(teacherId, currentRole);
  }, [teacherId, currentRole, dbTick]);

  // Current Wizard Step: 1, 2, 3, 4, 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // --- BƯỚC 1: THÔNG TIN CƠ BẢN & CHỦ ĐỀ BÀI HỌC ---
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('homework');
  const [title, setTitle] = useState<string>('');
  const [classId, setClassId] = useState<string>(allowedClasses[0]?.id || 'class_10a1');
  const [subjectName, setSubjectName] = useState<string>('Toán học');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [allowLateDays, setAllowLateDays] = useState<number>(2);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string>('');

  // Derived Date & Time strings for Cyberpunk Date & Time pickers (Section E)
  const dueDatePart = useMemo(() => {
    if (dueDate && dueDate.includes('T')) return dueDate.split('T')[0];
    return new Date().toISOString().slice(0, 10);
  }, [dueDate]);

  const dueTimePart = useMemo(() => {
    if (dueDate && dueDate.includes('T')) return dueDate.split('T')[1].slice(0, 5);
    return '23:59';
  }, [dueDate]);

  const handleDueDatePartChange = (newDate: string) => {
    if (!newDate) return;
    setDueDate(`${newDate}T${dueTimePart || '23:59'}`);
  };

  const handleDueTimePartChange = (newTime: string) => {
    if (!newTime) return;
    setDueDate(`${dueDatePart}T${newTime}`);
  };

  // Available subjects for the selected class
  const availableSubjects = useMemo(() => {
    return classSubjectsMap[classId] || ['Toán học'];
  }, [classId, classSubjectsMap]);

  // Topics for class & subject from Screen 111, grouped by current vs previous sessions
  const availableTopics = useMemo(() => {
    const all = db.getTopics({ classId, subjectName });
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [classId, subjectName, dbTick]);

  const currentSessionTopics = useMemo(
    () => availableTopics.filter(t => t.sessionType === 'current'),
    [availableTopics]
  );
  const previousSessionTopics = useMemo(
    () => availableTopics.filter(t => t.sessionType !== 'current'),
    [availableTopics]
  );

  // Sync preselectedTopicId if passed from Screen 111
  useEffect(() => {
    if (preselectedTopicId) {
      const t = db.getTopicById(preselectedTopicId);
      if (t) {
        if (t.classId) setClassId(t.classId);
        if (t.subjectName) setSubjectName(t.subjectName);
        setSelectedTopicIds([preselectedTopicId]);
        if (!title) {
          setTitle(`Bài tập: ${t.title || t.name}`);
        }
      }
    }
  }, [preselectedTopicId]);

  // Auto-select first topic if none selected and availableTopics exists on initial load
  useEffect(() => {
    if (selectedTopicIds.length === 0 && availableTopics.length > 0 && !preselectedTopicId) {
      setSelectedTopicIds([availableTopics[0].id]);
    }
  }, [availableTopics.length]);

  // When class changes, ensure valid subject
  useEffect(() => {
    if (!availableSubjects.includes(subjectName)) {
      setSubjectName(availableSubjects[0] || 'Toán học');
    }
  }, [classId, availableSubjects, subjectName]);

  // --- BƯỚC 2: CẤU HÌNH DẠNG BÀI & SỐ LƯỢNG CÂU PHỤ THUỘC ---
  const [assignmentFormat, setAssignmentFormat] = useState<AssignmentFormat>('mixed'); // 'mixed' | 'mcq_only' | 'essay_only'
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all'); // 'all' | 'easy' | 'medium' | 'hard'
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');

  // Counts chosen by teacher
  const [numMcq, setNumMcq] = useState<number>(4);
  const [numEssay, setNumEssay] = useState<number>(2);

  // Warning when question counts become invalid due to filter changes
  const [countInvalidWarning, setCountInvalidWarning] = useState<string | null>(null);

  // Cyber AI Auto-Generate State (Section D)
  const [isAutoGenerating, setIsAutoGenerating] = useState<boolean>(false);
  const [autoGenResult, setAutoGenResult] = useState<{ count: number; mcqAdded: number; essayAdded: number } | null>(null);

  // Calculate eligible question pool per selected topic (preserves selection order)
  const topicPools = useMemo(() => {
    return selectedTopicIds
      .map(tid => {
        const topicObj = availableTopics.find(t => t.id === tid) || db.getTopicById(tid);
        if (!topicObj) return null;
        const pool = db.getEligibleQuestionsForTopics([tid], {
          difficulty: selectedDifficulty,
          format: 'all',
        });
        return {
          topic: topicObj,
          topicId: topicObj.id,
          topicTitle: topicObj.title || topicObj.name,
          mcqQuestions: pool.mcqQuestions,
          essayQuestions: pool.essayQuestions,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [selectedTopicIds, availableTopics, selectedDifficulty, dbTick]);

  // Formatted equal percentage share per selected topic (e.g., 1->100%, 2->50%, 4->25%, 3->33.3%)
  const topicSharePercentLabel = useMemo(() => {
    const count = topicPools.length;
    if (count <= 0) return '0%';
    const raw = 100 / count;
    return Number.isInteger(raw) ? `${raw}%` : `${Number(raw.toFixed(1))}%`;
  }, [topicPools.length]);

  // Calculate eligible question pool from all selected topics (deduplicated)
  const eligibleData = useMemo(() => {
    return db.getEligibleQuestionsForTopics(selectedTopicIds, {
      difficulty: selectedDifficulty,
      format: 'all',
    });
  }, [selectedTopicIds, selectedDifficulty, dbTick]);

  // Maximum selectable counts bounded strictly by eligible questions in bank
  const maxSelectableMcq = Math.min(20, eligibleData.mcqCount);
  const maxSelectableEssay = Math.min(10, eligibleData.essayCount);

  useEffect(() => {
    let warning: string | null = null;

    if (assignmentFormat === 'mcq_only' || assignmentFormat === 'mixed') {
      if (numMcq > maxSelectableMcq && maxSelectableMcq > 0) {
        warning = `Số câu trắc nghiệm đã chọn (${numMcq} câu) vượt quá số câu đủ điều kiện hiện có (${maxSelectableMcq} câu). Vui lòng chọn lại.`;
        setNumMcq(maxSelectableMcq);
      } else if (maxSelectableMcq === 0 && (assignmentFormat === 'mcq_only' || assignmentFormat === 'mixed')) {
        warning = 'Chưa có đủ câu trắc nghiệm đủ điều kiện từ các chủ đề đã chọn. Bạn có thể bấm "AUTO TẠO CÂU HỎI" để AI bổ sung ngay.';
        setNumMcq(0);
      } else if (numMcq === 0 && maxSelectableMcq > 0) {
        setNumMcq(Math.min(4, maxSelectableMcq));
      }
    }

    if (assignmentFormat === 'essay_only' || assignmentFormat === 'mixed') {
      if (numEssay > maxSelectableEssay && maxSelectableEssay > 0) {
        warning = `Số câu tự luận đã chọn (${numEssay} câu) vượt quá số câu đủ điều kiện hiện có (${maxSelectableEssay} câu). Vui lòng chọn lại.`;
        setNumEssay(maxSelectableEssay);
      } else if (maxSelectableEssay === 0 && (assignmentFormat === 'essay_only' || assignmentFormat === 'mixed')) {
        warning = 'Chưa có đủ câu tự luận đủ điều kiện từ các chủ đề đã chọn. Bạn có thể bấm "AUTO TẠO CÂU HỎI" để AI bổ sung ngay.';
        setNumEssay(0);
      } else if (numEssay === 0 && maxSelectableEssay > 0) {
        setNumEssay(Math.min(2, maxSelectableEssay));
      }
    }

    setCountInvalidWarning(warning);
  }, [selectedTopicIds, assignmentFormat, selectedDifficulty, maxSelectableMcq, maxSelectableEssay]);

  // Total required questions
  const totalRequiredQuestions = useMemo(() => {
    if (assignmentFormat === 'mcq_only') return numMcq;
    if (assignmentFormat === 'essay_only') return numEssay;
    return numMcq + numEssay;
  }, [assignmentFormat, numMcq, numEssay]);

  // Is Question Source Sufficient?
  const isMcqSufficient = assignmentFormat === 'essay_only' || (numMcq > 0 && numMcq <= maxSelectableMcq);
  const isEssaySufficient = assignmentFormat === 'mcq_only' || (numEssay > 0 && numEssay <= maxSelectableEssay);
  const isQuestionSourceValid = selectedTopicIds.length > 0 && isMcqSufficient && isEssaySufficient;

  // --- BƯỚC 3: CHỌN CÂU HỎI & HOÁN ĐỔI CÂU ---
  const [selectedQuestionsList, setSelectedQuestionsList] = useState<Question[]>([]);
  const [questionPointsMap, setQuestionPointsMap] = useState<Record<string, number>>({});
  const [questionSourceTopicMap, setQuestionSourceTopicMap] = useState<Record<string, { topicId: string; topicTitle: string }>>({});
  const [lastSelectionSignature, setLastSelectionSignature] = useState<string>('');

  const selectionSignature = useMemo(() => {
    return `${[...selectedTopicIds].sort().join(',')}|${assignmentFormat}|${selectedDifficulty}|${numMcq}|${numEssay}|${dbTick}`;
  }, [selectedTopicIds, assignmentFormat, selectedDifficulty, numMcq, numEssay, dbTick]);

  // --- BƯỚC 4: THIẾT LẬP ĐIỂM SỐ & QUY CHẾ LÀM BÀI ---
  const [maxScore, setMaxScore] = useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(45);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [showAnswersPolicy, setShowAnswersPolicy] = useState<'after_submit' | 'after_deadline' | 'manual'>('after_deadline');

  // Helper: Proportional equal distribution across all selected topic pools (e.g. 4 topics -> 25% each, 2 topics -> 50% each)
  const selectProportionalQuestions = (
    pools: typeof topicPools,
    category: 'mcqQuestions' | 'essayQuestions',
    totalCount: number,
    usedIds: Set<string>,
    randomize: boolean
  ) => {
    const picked: Question[] = [];
    const perTopicTarget: Record<string, number> = {};
    const perTopicActual: Record<string, number> = {};
    const sourceTopicMap: Record<string, { topicId: string; topicTitle: string }> = {};

    pools.forEach(p => {
      perTopicTarget[p.topicId] = 0;
      perTopicActual[p.topicId] = 0;
    });

    if (totalCount <= 0 || pools.length === 0) {
      return { picked, perTopicTarget, perTopicActual, sourceTopicMap, hasShortfall: false };
    }

    const nTopics = pools.length;
    const baseQuota = Math.floor(totalCount / nTopics);
    const remainder = totalCount % nTopics;

    // Build index order for remainder slots so uneven counts distribute fairly
    const indices = pools.map((_, idx) => idx);
    if (randomize && remainder > 0) {
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    const remainderSet = new Set(indices.slice(0, remainder));

    pools.forEach((p, idx) => {
      perTopicTarget[p.topicId] = baseQuota + (remainderSet.has(idx) ? 1 : 0);
    });

    // Prepare candidate arrays per topic
    const candidateBuckets = pools.map(p => {
      const list = [...p[category]];
      if (randomize) {
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
      }
      return { topicId: p.topicId, topicTitle: p.topicTitle, list };
    });

    // Pass 1: Take proportional quota from each selected topic
    candidateBuckets.forEach(bucket => {
      const target = perTopicTarget[bucket.topicId] || 0;
      let taken = 0;
      for (const q of bucket.list) {
        if (taken >= target) break;
        if (usedIds.has(q.id)) continue;
        usedIds.add(q.id);
        picked.push(q);
        sourceTopicMap[q.id] = { topicId: bucket.topicId, topicTitle: bucket.topicTitle };
        taken += 1;
      }
      perTopicActual[bucket.topicId] = taken;
    });

    const hasShortfall = pools.some(p => perTopicActual[p.topicId] < perTopicTarget[p.topicId]);

    // Pass 2: Shortfall fallback — round-robin from remaining unused questions across selected topics
    let guard = 0;
    while (picked.length < totalCount && guard < totalCount * nTopics + 10) {
      let addedInPass = false;
      for (const bucket of candidateBuckets) {
        if (picked.length >= totalCount) break;
        const nextUnused = bucket.list.find(q => !usedIds.has(q.id));
        if (nextUnused) {
          usedIds.add(nextUnused.id);
          picked.push(nextUnused);
          sourceTopicMap[nextUnused.id] = { topicId: bucket.topicId, topicTitle: bucket.topicTitle };
          perTopicActual[bucket.topicId] = (perTopicActual[bucket.topicId] || 0) + 1;
          addedInPass = true;
        }
      }
      if (!addedInPass) break;
      guard += 1;
    }

    return { picked, perTopicTarget, perTopicActual, sourceTopicMap, hasShortfall };
  };

  // Live deterministic allocation breakdown for UI preview in Section C & Confirm Modal
  const plannedAllocation = useMemo(() => {
    if (topicPools.length === 0) {
      return { rows: [] as Array<{
        topicId: string;
        topicTitle: string;
        shareLabel: string;
        targetMcq: number;
        actualMcq: number;
        availableMcq: number;
        targetEssay: number;
        actualEssay: number;
        availableEssay: number;
        totalPlanned: number;
        isShortfall: boolean;
      }>, hasAnyShortfall: false };
    }

    const expectedMcq = assignmentFormat === 'essay_only' ? 0 : numMcq;
    const expectedEssay = assignmentFormat === 'mcq_only' ? 0 : numEssay;
    const usedIds = new Set<string>();

    const mcqPlan = selectProportionalQuestions(topicPools, 'mcqQuestions', expectedMcq, usedIds, false);
    const essayPlan = selectProportionalQuestions(topicPools, 'essayQuestions', expectedEssay, usedIds, false);

    const rows = topicPools.map(p => {
      const targetMcq = mcqPlan.perTopicTarget[p.topicId] || 0;
      const actualMcq = mcqPlan.perTopicActual[p.topicId] || 0;
      const targetEssay = essayPlan.perTopicTarget[p.topicId] || 0;
      const actualEssay = essayPlan.perTopicActual[p.topicId] || 0;
      return {
        topicId: p.topicId,
        topicTitle: p.topicTitle,
        shareLabel: topicSharePercentLabel,
        targetMcq,
        actualMcq,
        availableMcq: p.mcqQuestions.length,
        targetEssay,
        actualEssay,
        availableEssay: p.essayQuestions.length,
        totalPlanned: actualMcq + actualEssay,
        isShortfall: actualMcq < targetMcq || actualEssay < targetEssay,
      };
    });

    return {
      rows,
      hasAnyShortfall: mcqPlan.hasShortfall || essayPlan.hasShortfall,
    };
  }, [topicPools, assignmentFormat, numMcq, numEssay, topicSharePercentLabel]);

  const distributePointsEqually = (qList: Question[], totalPoints: number = 10) => {
    if (qList.length === 0) return {};
    const map: Record<string, number> = {};

    const mcqList = qList.filter(q => q.type !== 'essay');
    const essayList = qList.filter(q => q.type === 'essay');

    if (mcqList.length > 0 && essayList.length > 0) {
      const mcqTotal = Number((totalPoints * 0.4).toFixed(2));
      const essayTotal = Number((totalPoints - mcqTotal).toFixed(2));
      const mcqEach = Number((mcqTotal / mcqList.length).toFixed(2));
      const essayEach = Number((essayTotal / essayList.length).toFixed(2));

      mcqList.forEach(q => (map[q.id] = mcqEach));
      essayList.forEach(q => (map[q.id] = essayEach));
    } else {
      const each = Number((totalPoints / qList.length).toFixed(2));
      qList.forEach(q => (map[q.id] = each));
    }

    setQuestionPointsMap(map);
    return map;
  };

  // Auto-generate or initialize question list proportionally across all selected topics
  const handleGenerateQuestions = (): Question[] => {
    const usedIds = new Set<string>();
    const expectedMcq = assignmentFormat === 'essay_only' ? 0 : numMcq;
    const expectedEssay = assignmentFormat === 'mcq_only' ? 0 : numEssay;

    const mcqRes = selectProportionalQuestions(topicPools, 'mcqQuestions', expectedMcq, usedIds, true);
    const essayRes = selectProportionalQuestions(topicPools, 'essayQuestions', expectedEssay, usedIds, true);

    const chosen: Question[] = [...mcqRes.picked, ...essayRes.picked];
    const combinedTopicMap = { ...mcqRes.sourceTopicMap, ...essayRes.sourceTopicMap };

    setSelectedQuestionsList(chosen);
    setQuestionSourceTopicMap(combinedTopicMap);
    setLastSelectionSignature(selectionSignature);
    distributePointsEqually(chosen, maxScore);
    return chosen;
  };

  // Handle AI Auto-Generation right from Cyber AI Panel (Section D)
  // Generates distinct topic-specific questions for EACH selected topic so proportional distribution works cleanly
  const handleAutoGenerateQuestionsForSelectedTopics = async () => {
    if (isAutoGenerating) return;

    const activeTopicIds =
      selectedTopicIds.length > 0
        ? selectedTopicIds
        : availableTopics.length > 0
        ? [availableTopics[0].id]
        : [];

    if (activeTopicIds.length === 0) {
      showToast('Chưa có chủ đề nào cho lớp & môn học này. Hãy tạo chủ đề tại Màn hình 111 trước!', 'warning');
      onNavigateToScreen111();
      return;
    }

    if (selectedTopicIds.length === 0) {
      setSelectedTopicIds(activeTopicIds);
    }

    const targetTopics = availableTopics.filter(t => activeTopicIds.includes(t.id));
    const targetClass = allowedClasses.find(c => c.id === classId);
    const parsedGrade = Number(targetClass?.name?.match(/\d+/)?.[0]) || 10;

    const requestedTypes: QuestionType[] =
      assignmentFormat === 'mcq_only'
        ? ['single', 'multiple', 'true_false']
        : assignmentFormat === 'essay_only'
        ? ['essay']
        : ['single', 'true_false', 'essay'];

    const targetDifficulty =
      selectedDifficulty === 'easy' || selectedDifficulty === 'medium' || selectedDifficulty === 'hard'
        ? selectedDifficulty
        : undefined;

    // Per-topic generation count: when multiple topics are ticked, generate balanced MCQ + Essay per topic
    const perTopicCount = targetTopics.length > 1 ? (assignmentFormat === 'mixed' ? 3 : 2) : assignmentFormat === 'mixed' ? 5 : 4;

    setIsAutoGenerating(true);
    setAutoGenResult(null);

    try {
      let totalAdded = 0;
      let totalMcqAdded = 0;
      let totalEssayAdded = 0;

      for (const topicItem of targetTopics) {
        const topicName = topicItem.title || topicItem.name;
        const payload = {
          topic: topicName,
          lessonContent: topicItem.content || topicItem.description || '',
          subject: subjectName,
          grade: parsedGrade,
          questionTypes: requestedTypes,
          difficulty: (selectedDifficulty === 'all' ? 'medium' : selectedDifficulty) as 'easy' | 'medium' | 'hard',
          count: perTopicCount,
        };

        let generated: GeneratedQuestion[] = [];
        try {
          generated = await aiService.generateQuestionsAdvanced(payload);
        } catch {
          generated = aiService.generateFallbackQuestions(payload);
        }

        if (!generated || generated.length === 0) {
          generated = aiService.generateFallbackQuestions(payload);
        }

        // Ensure requested formats exist for this specific topic
        if (assignmentFormat !== 'mcq_only' && !generated.some(q => q.type === 'essay')) {
          const essayFallback = aiService.generateFallbackQuestions({
            ...payload,
            questionTypes: ['essay'],
            count: 1,
          });
          const essays = essayFallback.filter(q => q.type === 'essay');
          if (essays.length > 0) {
            generated = [...generated, ...essays.slice(0, 1)];
          } else {
            generated.push({
              type: 'essay',
              content: `Trình bày phương pháp giải và áp dụng kiến thức chủ đề "${topicName}" để giải quyết một bài toán thực tế môn ${subjectName}.`,
              correctAnswer: 'Học sinh nêu đầy đủ cơ sở lý thuyết, các bước biến đổi logic và kết luận chính xác.',
              explanation: `Vận dụng trọng tâm kiến thức "${topicName}" theo chuẩn chương trình GDPT 2018.`,
              rubric: 'Nêu đúng công thức/định lý: 40%; Biến đổi tính toán chuẩn xác: 40%; Kết luận rõ ràng: 20%.',
              difficulty: selectedDifficulty === 'easy' || selectedDifficulty === 'hard' ? selectedDifficulty : 'medium',
              topic: topicName,
              qualityScore: 95,
            });
          }
        }

        if (assignmentFormat !== 'essay_only' && !generated.some(q => q.type !== 'essay')) {
          const mcqFallback = aiService.generateFallbackQuestions({
            ...payload,
            questionTypes: ['single', 'multiple'],
            count: 2,
          });
          generated = [...generated, ...mcqFallback.filter(q => q.type !== 'essay').slice(0, 2)];
        }

        const questionsToSave = generated.map(q => ({
          subject: subjectName,
          grade: parsedGrade,
          chapter: q.chapter || 'Chương trình GDPT 2018',
          lesson: topicItem.lessonDate || 'Buổi hiện tại',
          topic: topicName,
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
          difficulty: targetDifficulty || q.difficulty || 'medium',
          status: 'approved' as const,
          qualityScore: q.qualityScore || 94,
          tags: [subjectName, topicName, 'AI Auto'],
        }));

        const added = db.addBatchQuestions(questionsToSave);
        const addedIds = added.map(item => item.id);
        totalAdded += added.length;
        totalMcqAdded += added.filter(q => q.type !== 'essay').length;
        totalEssayAdded += added.filter(q => q.type === 'essay').length;

        const mergedQids = Array.from(new Set([...(topicItem.questionIds || []), ...addedIds]));
        db.updateTopic(topicItem.id, { questionIds: mergedQids });
      }

      setDbTick(prev => prev + 1);
      setAutoGenResult({ count: totalAdded, mcqAdded: totalMcqAdded, essayAdded: totalEssayAdded });

      showToast(
        `✨ AI đã tạo thành công ${totalAdded} câu hỏi (${totalMcqAdded} Trắc nghiệm, ${totalEssayAdded} Tự luận) phân bổ vào ${targetTopics.length} chủ đề đã chọn!`,
        'success'
      );
    } catch (err: any) {
      showToast('Không thể auto tạo câu hỏi: ' + (err?.message || 'Lỗi kết nối'), 'error');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  // Replace / Swap single question (prioritizes same source topic to preserve proportional split)
  const handleSwapQuestion = (indexToSwap: number) => {
    const currentQ = selectedQuestionsList[indexToSwap];
    if (!currentQ) return;

    const isEssay = currentQ.type === 'essay';
    const currentSelectedIds = new Set(selectedQuestionsList.map(q => q.id));
    const sourceMeta = questionSourceTopicMap[currentQ.id];

    // Prefer unused question from the SAME topic first to preserve topic ratios (e.g. 25% / 50%)
    let replacement: Question | undefined;
    let replacementTopicMeta = sourceMeta;

    if (sourceMeta) {
      const samePool = topicPools.find(p => p.topicId === sourceMeta.topicId);
      const sameCategoryList = samePool ? (isEssay ? samePool.essayQuestions : samePool.mcqQuestions) : [];
      const sameTopicAlternatives = sameCategoryList.filter(q => !currentSelectedIds.has(q.id));
      if (sameTopicAlternatives.length > 0) {
        replacement = sameTopicAlternatives[Math.floor(Math.random() * sameTopicAlternatives.length)];
      }
    }

    if (!replacement) {
      const fallbackPools = topicPools.filter(p => p.topicId !== sourceMeta?.topicId);
      for (const p of fallbackPools) {
        const list = isEssay ? p.essayQuestions : p.mcqQuestions;
        const alts = list.filter(q => !currentSelectedIds.has(q.id));
        if (alts.length > 0) {
          replacement = alts[Math.floor(Math.random() * alts.length)];
          replacementTopicMeta = { topicId: p.topicId, topicTitle: p.topicTitle };
          break;
        }
      }
    }

    if (!replacement) {
      showToast('Không còn câu hỏi thay thế nào khác trong ngân hàng câu hỏi của các chủ đề này.', 'info');
      return;
    }

    const nextList = [...selectedQuestionsList];
    nextList[indexToSwap] = replacement;
    setSelectedQuestionsList(nextList);

    if (replacementTopicMeta) {
      setQuestionSourceTopicMap(prev => ({
        ...prev,
        [replacement!.id]: replacementTopicMeta!,
      }));
    }

    setQuestionPointsMap(prev => ({
      ...prev,
      [replacement!.id]: prev[currentQ.id] || (isEssay ? 2.0 : 0.5),
    }));

    showToast(`✓ Đã đổi câu hỏi số ${indexToSwap + 1} sang câu hỏi mới!`, 'success');
  };

  // Toggle selection in Manual mode
  const handleToggleManualQuestion = (q: Question) => {
    const exists = selectedQuestionsList.some(item => item.id === q.id);
    let nextList: Question[] = [];
    if (exists) {
      nextList = selectedQuestionsList.filter(item => item.id !== q.id);
    } else {
      const isEssay = q.type === 'essay';
      const currentMcqCount = selectedQuestionsList.filter(item => item.type !== 'essay').length;
      const currentEssayCount = selectedQuestionsList.filter(item => item.type === 'essay').length;

      if (!isEssay && assignmentFormat !== 'essay_only' && currentMcqCount >= numMcq) {
        showToast(`Đã chọn đủ ${numMcq} câu trắc nghiệm theo cấu hình!`, 'info');
        return;
      }
      if (isEssay && assignmentFormat !== 'mcq_only' && currentEssayCount >= numEssay) {
        showToast(`Đã chọn đủ ${numEssay} câu tự luận theo cấu hình!`, 'info');
        return;
      }

      nextList = [...selectedQuestionsList, q];
    }

    setSelectedQuestionsList(nextList);
    distributePointsEqually(nextList, maxScore);
  };

  // Calculate total points sum
  const currentTotalPoints = useMemo(() => {
    let sum = 0;
    selectedQuestionsList.forEach(q => {
      sum += Number(questionPointsMap[q.id] || 0);
    });
    return Number(sum.toFixed(2));
  }, [selectedQuestionsList, questionPointsMap]);

  const isPointsBalanced = Math.abs(currentTotalPoints - maxScore) < 0.05;

  // --- BƯỚC 5 & FOOTER MODALS: XEM TRƯỚC ĐỀ & XÁC NHẬN GIAO BÀI ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Target class students count
  const targetClassStudents = useMemo(() => {
    return db.getStudents(classId);
  }, [classId, dbTick]);

  // Ensure a valid selectedQuestionsList exists matching current topics, proportions, numMcq & numEssay
  const ensureReadyQuestionSelection = (): { list: Question[]; pointsMap: Record<string, number> } => {
    const expectedMcq = assignmentFormat === 'essay_only' ? 0 : numMcq;
    const expectedEssay = assignmentFormat === 'mcq_only' ? 0 : numEssay;
    const currentMcq = selectedQuestionsList.filter(q => q.type !== 'essay').length;
    const currentEssay = selectedQuestionsList.filter(q => q.type === 'essay').length;

    const isSignatureValid = selectionMode === 'manual' || lastSelectionSignature === selectionSignature;

    if (
      isSignatureValid &&
      selectedQuestionsList.length === totalRequiredQuestions &&
      currentMcq === expectedMcq &&
      currentEssay === expectedEssay &&
      selectedQuestionsList.length > 0
    ) {
      return { list: selectedQuestionsList, pointsMap: questionPointsMap };
    }

    const chosen = handleGenerateQuestions();
    const freshMap = distributePointsEqually(chosen, maxScore);
    return { list: chosen, pointsMap: freshMap };
  };

  const validateBeforeAction = (requireTitle = true): boolean => {
    if (requireTitle && !title.trim()) {
      showToast('Vui lòng nhập tên bài tập hoặc bài kiểm tra!', 'error');
      return false;
    }
    if (selectedTopicIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 chủ đề môn học từ danh sách!', 'error');
      return false;
    }
    if (!isQuestionSourceValid) {
      showToast(
        'Số lượng câu hỏi chưa đủ điều kiện. Hãy điều chỉnh số lượng hoặc bấm "AUTO TẠO CÂU HỎI"!',
        'error'
      );
      return false;
    }
    if (new Date(dueDate) <= new Date(startDate)) {
      showToast('Hạn nộp bài phải sau thời điểm bắt đầu!', 'error');
      return false;
    }
    return true;
  };

  // Footer Left: Xem trước đề
  const handleOpenPreviewModal = () => {
    if (selectedTopicIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 chủ đề để xem trước đề!', 'warning');
      return;
    }
    if (!isQuestionSourceValid) {
      showToast('Ngân hàng câu hỏi của chủ đề đang thiếu câu hỏi. Hãy bấm "AUTO TẠO CÂU HỎI" trước!', 'warning');
      return;
    }
    ensureReadyQuestionSelection();
    setIsPreviewModalOpen(true);
  };

  // Footer Right: Giao bài ngay
  const handleOpenPublishConfirm = () => {
    if (!validateBeforeAction(true)) return;
    ensureReadyQuestionSelection();
    setIsConfirmModalOpen(true);
  };

  // Step Navigation Validation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateBeforeAction(true)) return;
      ensureReadyQuestionSelection();
      setCurrentStep(3);
    } else if (currentStep === 2) {
      if (!isQuestionSourceValid) {
        showToast('Số lượng câu hỏi yêu cầu vượt quá nguồn câu đủ điều kiện. Vui lòng điều chỉnh hoặc AI Auto tạo!', 'error');
        return;
      }
      handleGenerateQuestions();
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedQuestionsList.length !== totalRequiredQuestions) {
        showToast(`Bạn cần chọn đủ chính xác ${totalRequiredQuestions} câu hỏi (Đã chọn: ${selectedQuestionsList.length} câu)!`, 'error');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!isPointsBalanced) {
        showToast(`Tổng điểm các câu (${currentTotalPoints}đ) chưa khớp với thang điểm tối đa (${maxScore}đ). Vui lòng bấm "Chia đều điểm" hoặc điều chỉnh!`, 'error');
        return;
      }
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle Save Draft or Publish Assignment
  const handlePublishAssignment = async (status: 'published' | 'draft') => {
    if (isSubmitting) return;
    if (!validateBeforeAction(true)) return;

    setIsSubmitting(true);

    try {
      const { list: finalQuestions, pointsMap: finalPointsMap } = ensureReadyQuestionSelection();

      const targetClass = allowedClasses.find(c => c.id === classId);
      const className = targetClass?.name || '10A1';

      const topicObjects = db.getTopics().filter(t => selectedTopicIds.includes(t.id));
      const topicNames = topicObjects.map(t => t.title || t.name);

      const selectedQuestionsFormatted = finalQuestions.map(q => ({
        questionId: q.id,
        points: Number(finalPointsMap[q.id] || (q.type === 'essay' ? 2 : 0.5)),
        type: q.type,
      }));

      const newAssignment = db.createAssignmentFromBank({
        title: title.trim(),
        classId,
        className,
        subjectId: `sub_${subjectName.toLowerCase()}`,
        subjectName,
        type: assignmentType,
        assignmentFormat,
        topicIds: selectedTopicIds,
        topicNames,
        dueDate,
        allowLateDays: Number(allowLateDays || 0),
        points: maxScore,
        selectedQuestions: selectedQuestionsFormatted,
        timeLimitMinutes: timeLimitMinutes > 0 ? timeLimitMinutes : undefined,
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        showAnswersPolicy,
        instructions: instructions.trim(),
        status,
        createdByTeacherId: teacherId,
        createdByTeacherName: teacherName,
      });

      setIsConfirmModalOpen(false);
      setIsPreviewModalOpen(false);
      showToast(
        status === 'published'
          ? `🎉 Đã giao thành công ${assignmentType === 'exam' ? 'Bài kiểm tra' : 'BTVN'} "${title}" cho Lớp ${className}!`
          : `✓ Đã lưu bản nháp "${title}" thành công.`,
        'success'
      );

      onSuccess(newAssignment);
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'Có lỗi xảy ra khi tạo đề. Vui lòng thử lại!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDifficultyLabel = (diff: string) => {
    if (diff === 'easy') return 'Nhận biết';
    if (diff === 'hard') return 'Vận dụng';
    return 'Thông hiểu';
  };

  const renderTopicRow = (t: any, isCurrentSession: boolean) => {
    const isSelected = selectedTopicIds.includes(t.id);
    const stats = db.getTopicStats(t.id);

    return (
      <div
        key={t.id}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedTopicIds(prev =>
              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
            );
          }
        }}
        onClick={() => {
          setSelectedTopicIds(prev =>
            prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
          );
        }}
        className={`group p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
          isSelected
            ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#EAFBFF] shadow-[0_0_20px_rgba(0,229,255,0.16)]'
            : 'bg-[#071525]/80 border-[#00E5FF]/15 text-[#EAFBFF] hover:border-[#00E5FF]/50 hover:bg-[#0C2138]'
        }`}
      >
        {/* Custom Neon Checkbox */}
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
            isSelected
              ? 'bg-gradient-to-br from-[#00E5FF] to-[#087CFF] border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.65)]'
              : 'bg-[#030B16] border-[#00E5FF]/35 group-hover:border-[#00E5FF]'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-[#030B16] stroke-[3]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-[#EAFBFF] truncate group-hover:text-[#00E5FF] transition-colors">
              {t.title || t.name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {isSelected && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/40 tabular-nums whitespace-nowrap">
                  Tỷ lệ: {topicSharePercentLabel}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${
                  isCurrentSession
                    ? 'bg-[#00E5FF]/12 text-[#00E5FF] border-[#00E5FF]/35'
                    : 'bg-[#071525] text-[#8BA9BC] border-[#00E5FF]/20'
                }`}
              >
                Buổi: {t.lessonDate || 'Hôm nay'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-[11px]">
            <span className="text-[#8BA9BC] truncate max-w-md">
              {t.description || t.content || `Chủ đề môn ${t.subjectName}`}
            </span>
            <div className="flex items-center gap-2 shrink-0 tabular-nums font-medium">
              <span className="px-2 py-0.5 rounded bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
                {stats.eligibleMcqCount} TN
              </span>
              <span className="px-2 py-0.5 rounded bg-[#A855F7]/15 text-[#d8b4fe] border border-[#A855F7]/35">
                {stats.eligibleEssayCount} TL
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="hud-panel bg-[#0A1B2D]/90 backdrop-blur-xl border border-[#00E5FF]/25 rounded-2xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
      {/* HEADER & INTERACTIVE STEPPER */}
      <div className="p-5 sm:p-6 border-b border-[#00E5FF]/20 bg-gradient-to-r from-[#071525]/95 via-[#0A1B2D]/90 to-[#071525]/95">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#087CFF]/20 border border-[#00E5FF]/45 flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-bold text-[#EAFBFF] tracking-tight">
                  Tạo Bài Tập & Đề Kiểm Tra Thông Minh
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-md font-semibold bg-[#00E5FF]/12 text-[#00E5FF] border border-[#00E5FF]/35">
                  AI Question Studio
                </span>
              </div>
              <p className="text-xs text-[#8BA9BC] mt-1">
                Liên kết chủ đề môn học, cấu hình ma trận câu hỏi, tự động sinh đề bằng AI và giao bài tức thì cho cả lớp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-lg bg-[#071525] border border-[#00E5FF]/25 text-xs font-semibold text-[#EAFBFF] tabular-nums">
              Bước <span className="text-[#00E5FF] font-bold">{currentStep}</span> / 5
            </div>
          </div>
        </div>

        {/* CLICKABLE CYBERPUNK STEPPER BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {[
            { step: 1, label: '1. Cấu hình & Chủ đề' },
            { step: 2, label: '2. Dạng bài & Số câu' },
            { step: 3, label: '3. Chọn câu & Hoán đổi' },
            { step: 4, label: '4. Điểm & Quy chế' },
            { step: 5, label: '5. Xem trước & Giao bài' },
          ].map(s => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step <= currentStep || s.step <= 2) {
                    setCurrentStep(s.step);
                  } else if (validateBeforeAction(true)) {
                    ensureReadyQuestionSelection();
                    setCurrentStep(s.step);
                  }
                }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00E5FF]/18 to-[#087CFF]/18 border-[#00E5FF] text-[#EAFBFF] font-bold shadow-[0_0_16px_rgba(0,229,255,0.2)]'
                    : isCompleted
                    ? 'bg-[#071525] border-[#00F5A0]/40 text-[#00F5A0] hover:border-[#00F5A0]'
                    : 'bg-[#071525]/60 border-[#00E5FF]/15 text-[#8BA9BC] hover:border-[#00E5FF]/40 hover:text-[#EAFBFF]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 tabular-nums ${
                    isActive
                      ? 'bg-gradient-to-br from-[#00E5FF] to-[#087CFF] text-[#030B16]'
                      : isCompleted
                      ? 'bg-[#00F5A0] text-[#030B16]'
                      : 'bg-[#0A1B2D] text-[#8BA9BC] border border-[#00E5FF]/20'
                  }`}
                >
                  {isCompleted ? '✓' : s.step}
                </div>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: COMPLETE ASSIGNMENT BUILDER (INFO + SECTIONS A, B, C, D, E)      */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* TOP METADATA CARD: LOẠI BÀI, TÊN BÀI, LỚP, MÔN HỌC */}
            <div className="cyber-glass-card rounded-2xl p-5 space-y-5">
              {/* Loại hình giao bài */}
              <div>
                <label className="block text-xs font-semibold text-[#EAFBFF] mb-2.5">
                  Loại hình giao bài
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setAssignmentType('homework')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                      assignmentType === 'homework'
                        ? 'bg-[#00E5FF]/12 border-[#00E5FF] text-[#EAFBFF] shadow-[0_0_18px_rgba(0,229,255,0.18)]'
                        : 'bg-[#071525] border-[#00E5FF]/20 text-[#8BA9BC] hover:border-[#00E5FF]/50 hover:text-[#EAFBFF]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${assignmentType === 'homework' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-[#0A1B2D] text-[#8BA9BC]'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#EAFBFF]">Bài Tập Về Nhà (BTVN)</div>
                      <div className="text-[11px] text-[#8BA9BC] mt-0.5 leading-relaxed">
                        Rèn luyện kiến thức theo chủ đề, hỗ trợ gia hạn nộp trễ linh hoạt.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignmentType('exam')}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                      assignmentType === 'exam'
                        ? 'bg-[#00E5FF]/12 border-[#00E5FF] text-[#EAFBFF] shadow-[0_0_18px_rgba(0,229,255,0.18)]'
                        : 'bg-[#071525] border-[#00E5FF]/20 text-[#8BA9BC] hover:border-[#00E5FF]/50 hover:text-[#EAFBFF]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${assignmentType === 'exam' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-[#0A1B2D] text-[#8BA9BC]'}`}>
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#EAFBFF]">Bài Kiểm Tra Định Kỳ / Đột Xuất</div>
                      <div className="text-[11px] text-[#8BA9BC] mt-0.5 leading-relaxed">
                        Đếm ngược thời gian làm bài, trộn câu hỏi và lưu điểm chính thức.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tên bài tập + Lớp + Môn học */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-[#EAFBFF] mb-1.5">
                    Tên bài tập / bài kiểm tra <span className="text-[#FF4D6D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Kiểm tra 15 phút: Phương trình bậc hai & Định lý Vi-ét..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#071525] border border-[#00E5FF]/30 text-[#EAFBFF] placeholder-[#8BA9BC]/60 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#00E5FF]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-[#EAFBFF] mb-1.5">
                    Lớp nhận bài <span className="text-[#FF4D6D]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={classId}
                      onChange={e => {
                        setClassId(e.target.value);
                        setSelectedTopicIds([]);
                      }}
                      className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/30 text-[#EAFBFF] rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-semibold focus:border-[#00E5FF]"
                    >
                      {allowedClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          Lớp {c.name} ({db.getStudents(c.id).length} HS)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-[#EAFBFF] mb-1.5">
                    Môn học <span className="text-[#FF4D6D]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={subjectName}
                      onChange={e => {
                        setSubjectName(e.target.value);
                        setSelectedTopicIds([]);
                      }}
                      className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/30 text-[#EAFBFF] rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-semibold focus:border-[#00E5FF]"
                    >
                      {availableSubjects.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* A. KHU VỰC LIÊN KẾT VỚI CHỦ ĐỀ MÔN HỌC                        */}
            {/* ============================================================= */}
            <div className="cyber-glass-card rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#00E5FF]/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/35 flex items-center justify-center text-[#00E5FF] shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#EAFBFF]">
                      Liên kết với chủ đề môn học <span className="text-[#FF4D6D]">*</span>
                    </h4>
                    <p className="text-xs text-[#8BA9BC]">
                      Chọn 1 chủ đề (100%), 2 chủ đề (50%/chủ đề), 4 chủ đề (25%/chủ đề)... Hệ thống tự chia đều câu trắc nghiệm &amp; tự luận theo đúng tỷ lệ
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {selectedTopicIds.length > 0 && (
                    <span className="px-3 py-1 rounded-lg bg-[#00F5A0]/12 border border-[#00F5A0]/40 text-[#00F5A0] text-xs font-bold tabular-nums">
                      Mỗi chủ đề: {topicSharePercentLabel}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/45 text-[#00E5FF] text-xs font-bold tabular-nums shadow-[0_0_12px_rgba(0,229,255,0.18)]">
                    Đã chọn: {selectedTopicIds.length} chủ đề
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateToScreen111()}
                    className="px-3 py-1.5 rounded-lg bg-[#071525] hover:bg-[#0E253D] border border-[#00E5FF]/25 hover:border-[#00E5FF]/60 text-[#00E5FF] text-xs font-semibold transition-all cursor-pointer"
                  >
                    + Quản lý chủ đề
                  </button>
                </div>
              </div>

              {availableTopics.length === 0 ? (
                <div className="p-5 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 text-[#EAFBFF] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-[#FF4D6D]">
                        Chưa có chủ đề nào cho Lớp {allowedClasses.find(c => c.id === classId)?.name} môn {subjectName}
                      </div>
                      <p className="text-[#8BA9BC] mt-0.5">
                        Hãy thêm chủ đề bài học ở Màn hình 111 để bắt đầu tạo bài tập từ ngân hàng câu hỏi.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToScreen111()}
                    className="px-4 py-2 rounded-xl bg-[#FF4D6D] hover:brightness-110 text-white font-bold text-xs shrink-0 cursor-pointer transition-all"
                  >
                    Tạo chủ đề ngay →
                  </button>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto pr-1.5 space-y-4">
                  {currentSessionTopics.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
                        <span>Buổi học hiện tại ({currentSessionTopics.length})</span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        {currentSessionTopics.map(t => renderTopicRow(t, true))}
                      </div>
                    </div>
                  )}

                  {previousSessionTopics.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#00E5FF]/10">
                      <div className="text-[11px] font-bold text-[#8BA9BC] uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                        <span>Các buổi học trước ({previousSessionTopics.length})</span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        {previousSessionTopics.map(t => renderTopicRow(t, false))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* B. DẠNG BÀI VÀ ĐỘ KHÓ (BỐ CỤC 2 CỘT CÂN ĐỐI)                  */}
            {/* ============================================================= */}
            <div className="cyber-glass-card rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#00E5FF]/15">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-[#00E5FF]" />
                  <h4 className="text-sm sm:text-base font-bold text-[#EAFBFF]">
                    Dạng bài và độ khó
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 bg-[#071525] p-1 rounded-xl border border-[#00E5FF]/20">
                  <button
                    type="button"
                    onClick={() => setSelectionMode('auto')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectionMode === 'auto'
                        ? 'bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold shadow-sm'
                        : 'text-[#8BA9BC] hover:text-[#EAFBFF]'
                    }`}
                  >
                    Tự động ngẫu nhiên
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode('manual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectionMode === 'manual'
                        ? 'bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold shadow-sm'
                        : 'text-[#8BA9BC] hover:text-[#EAFBFF]'
                    }`}
                  >
                    Chọn thủ công
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#EAFBFF] mb-2">
                    Dạng bài kiểm tra / bài tập
                  </label>
                  <div className="relative">
                    <select
                      value={assignmentFormat}
                      onChange={e => setAssignmentFormat(e.target.value as AssignmentFormat)}
                      className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-4 pr-10 py-3 text-sm font-semibold transition-all focus:border-[#00E5FF]"
                    >
                      <option value="mixed">Kết hợp Trắc nghiệm & Tự luận</option>
                      <option value="mcq_only">Chỉ Trắc nghiệm khách quan (Chấm tự động)</option>
                      <option value="essay_only">Chỉ Tự luận trình bày chi tiết</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-[#8BA9BC] mt-1.5">
                    {assignmentFormat === 'mixed'
                      ? 'Phối hợp câu hỏi trắc nghiệm nhanh và bài tự luận đánh giá tư duy.'
                      : assignmentFormat === 'mcq_only'
                      ? '100% câu hỏi trắc nghiệm, hệ thống tự động chấm điểm ngay sau khi nộp.'
                      : '100% bài tự luận giúp học sinh trình bày lập luận và đính kèm bài làm.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EAFBFF] mb-2">
                    Mức độ nhận thức (Độ khó)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDifficulty}
                      onChange={e => setSelectedDifficulty(e.target.value)}
                      className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-4 pr-10 py-3 text-sm font-semibold transition-all focus:border-[#00E5FF]"
                    >
                      <option value="all">Tất cả mức độ (Phân bổ cân bằng)</option>
                      <option value="easy">Nhận biết (Dễ)</option>
                      <option value="medium">Thông hiểu (Trung bình)</option>
                      <option value="hard">Vận dụng & Vận dụng cao (Khó)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-[#8BA9BC] mt-1.5">
                    Bộ lọc độ khó áp dụng cho cả nguồn câu hỏi có sẵn và tác vụ AI tạo câu hỏi mới.
                  </p>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* C. SỐ CÂU HỎI (2 CARD CÂN ĐỐI)                                */}
            {/* ============================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#EAFBFF]">
                    Cấu hình số câu hỏi
                  </h4>
                  <p className="text-xs text-[#8BA9BC]">
                    Giới hạn tự động theo số lượng câu hỏi đủ điều kiện trong các chủ đề đã chọn
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#0A1B2D] border border-[#00E5FF]/35 text-xs font-semibold text-[#EAFBFF] tabular-nums">
                  Tổng đề thi: <span className="text-[#00E5FF] font-bold text-sm ml-1">{totalRequiredQuestions} câu</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* CARD 1: SỐ CÂU TRẮC NGHIỆM (1 - 20) */}
                <div
                  className={`cyber-glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                    assignmentFormat === 'essay_only'
                      ? 'opacity-50 pointer-events-none'
                      : maxSelectableMcq === 0
                      ? 'border-[#FF4D6D]/50 shadow-[0_0_24px_rgba(255,77,109,0.12)]'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/35 flex items-center justify-center text-[#00E5FF] shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#EAFBFF]">Số câu trắc nghiệm</div>
                        <div className="text-[11px] text-[#8BA9BC]">Phạm vi chọn: 1 – 20 câu</div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${
                        eligibleData.mcqCount > 0
                          ? 'bg-[#00F5A0]/12 text-[#00F5A0] border-[#00F5A0]/35'
                          : 'bg-[#FF4D6D]/12 text-[#FF4D6D] border-[#FF4D6D]/40'
                      }`}
                    >
                      Hiện có: {eligibleData.mcqCount} câu
                    </span>
                  </div>

                  {assignmentFormat === 'essay_only' ? (
                    <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/15 text-xs text-[#8BA9BC]">
                      Đang chọn dạng bài Chỉ Tự luận — không sử dụng câu hỏi trắc nghiệm.
                    </div>
                  ) : maxSelectableMcq === 0 ? (
                    <div className="p-3.5 rounded-xl bg-[#FF4D6D]/12 border border-[#FF4D6D]/45 text-[#FF4D6D] text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Thiếu câu trắc nghiệm đủ điều kiện</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoGenerateQuestionsForSelectedTopics}
                        disabled={isAutoGenerating}
                        className="px-2.5 py-1 rounded-lg bg-[#FF4D6D]/20 hover:bg-[#FF4D6D]/30 border border-[#FF4D6D]/50 text-[#EAFBFF] font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
                      >
                        AI tạo ngay
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#8BA9BC]">
                        Chọn số câu đưa vào đề
                      </label>
                      <div className="relative">
                        <select
                          value={numMcq}
                          onChange={e => setNumMcq(Number(e.target.value))}
                          className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-4 pr-10 py-2.5 font-bold text-sm tabular-nums focus:border-[#00E5FF]"
                        >
                          {Array.from({ length: maxSelectableMcq }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>
                              {n} câu trắc nghiệm
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 2: SỐ CÂU TỰ LUẬN (1 - 10) */}
                <div
                  className={`cyber-glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                    assignmentFormat === 'mcq_only'
                      ? 'opacity-50 pointer-events-none'
                      : maxSelectableEssay === 0
                      ? 'border-[#FF4D6D]/50 shadow-[0_0_24px_rgba(255,77,109,0.12)]'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#A855F7]/20 border border-[#A855F7]/45 flex items-center justify-center text-[#d8b4fe] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#EAFBFF]">Số câu tự luận</div>
                        <div className="text-[11px] text-[#8BA9BC]">Phạm vi chọn: 1 – 10 câu</div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${
                        eligibleData.essayCount > 0
                          ? 'bg-[#00F5A0]/12 text-[#00F5A0] border-[#00F5A0]/35'
                          : 'bg-[#FF4D6D]/12 text-[#FF4D6D] border-[#FF4D6D]/40'
                      }`}
                    >
                      Hiện có: {eligibleData.essayCount} câu
                    </span>
                  </div>

                  {assignmentFormat === 'mcq_only' ? (
                    <div className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/15 text-xs text-[#8BA9BC]">
                      Đang chọn dạng bài Chỉ Trắc nghiệm — không sử dụng câu hỏi tự luận.
                    </div>
                  ) : maxSelectableEssay === 0 ? (
                    <div className="p-3.5 rounded-xl bg-[#FF4D6D]/12 border border-[#FF4D6D]/45 text-[#FF4D6D] text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Thiếu câu tự luận đủ điều kiện</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoGenerateQuestionsForSelectedTopics}
                        disabled={isAutoGenerating}
                        className="px-2.5 py-1 rounded-lg bg-[#FF4D6D]/20 hover:bg-[#FF4D6D]/30 border border-[#FF4D6D]/50 text-[#EAFBFF] font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
                      >
                        AI tạo ngay
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#8BA9BC]">
                        Chọn số câu đưa vào đề
                      </label>
                      <div className="relative">
                        <select
                          value={numEssay}
                          onChange={e => setNumEssay(Number(e.target.value))}
                          className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-4 pr-10 py-2.5 font-bold text-sm tabular-nums focus:border-[#00E5FF]"
                        >
                          {Array.from({ length: maxSelectableEssay }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>
                              {n} câu tự luận
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bảng phân bổ tỷ lệ câu hỏi theo từng chủ đề đã chọn */}
              {plannedAllocation.rows.length > 0 && (
                <div className="cyber-glass-card rounded-2xl p-4 sm:p-5 space-y-3 border border-[#00E5FF]/25">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#00E5FF]/15">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-[#EAFBFF]">
                        Phân bổ tỷ lệ câu hỏi theo chủ đề ({plannedAllocation.rows.length} chủ đề · {topicSharePercentLabel}/chủ đề)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#00F5A0] font-semibold tabular-nums">
                      Tự động chia đều Trắc nghiệm &amp; Tự luận
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {plannedAllocation.rows.map(row => (
                      <div
                        key={row.topicId}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                          row.isShortfall
                            ? 'bg-[#FF4D6D]/8 border-[#FF4D6D]/40'
                            : 'bg-[#071525]/85 border-[#00E5FF]/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#EAFBFF] truncate" title={row.topicTitle}>
                            {row.topicTitle}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/35 text-[10px] font-bold tabular-nums shrink-0">
                            {row.shareLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] tabular-nums">
                          <div className="flex items-center gap-1.5">
                            {assignmentFormat !== 'essay_only' && (
                              <span className="text-[#00F5A0] font-semibold">{row.actualMcq} TN</span>
                            )}
                            {assignmentFormat === 'mixed' && <span className="text-[#8BA9BC]">·</span>}
                            {assignmentFormat !== 'mcq_only' && (
                              <span className="text-[#d8b4fe] font-semibold">{row.actualEssay} TL</span>
                            )}
                          </div>
                          <span className="text-[#8BA9BC]">
                            Tổng: <strong className="text-[#EAFBFF]">{row.totalPlanned}</strong> câu
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {plannedAllocation.hasAnyShortfall && (
                    <div className="p-2.5 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/35 text-[11px] text-[#EAFBFF] flex items-center justify-between gap-2">
                      <span>
                        Một số chủ đề có ít câu hơn hạn mức tỷ lệ — hệ thống đã tự động bù câu từ các chủ đề đã chọn còn lại. Bấm <b>AUTO TẠO CÂU HỎI</b> nếu muốn AI bổ sung đủ cho từng chủ đề.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* D. KHU VỰC AUTO TẠO CÂU HỎI (CYBER AI PANEL NỔI BẬT NHẤT)     */}
            {/* ============================================================= */}
            <div className="relative overflow-hidden rounded-2xl border border-[#00E5FF]/60 bg-gradient-to-r from-[#041426] via-[#08213D] to-[#0B1638] p-5 sm:p-6 shadow-[0_0_38px_-6px_rgba(0,229,255,0.28),0_18px_40px_-14px_rgba(0,0,0,0.9)] transition-all duration-300 hover:border-[#00E5FF] hover:shadow-[0_0_46px_-4px_rgba(0,229,255,0.38)]">
              {/* Top subtle gradient highlight bar */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#00E5FF] via-[#087CFF] to-[#A855F7]" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00E5FF]/25 to-[#A855F7]/25 border border-[#00E5FF]/55 flex items-center justify-center text-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.3)] shrink-0">
                    {isAutoGenerating ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-[#00E5FF]" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-[#00E5FF]" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-orbitron text-xs sm:text-sm font-extrabold tracking-wider text-[#00E5FF] uppercase">
                        Cyber AI Question Generator
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#A855F7]/20 text-[#e9d5ff] border border-[#A855F7]/45">
                        GDPT 2018
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-[#EAFBFF]">
                      Tự động tạo bộ câu hỏi thông minh từ chủ đề đã chọn
                    </h4>
                    <p className="text-xs text-[#8BA9BC] leading-relaxed max-w-2xl">
                      Hệ thống AI phân tích nội dung bài học môn <strong className="text-[#EAFBFF]">{subjectName}</strong> để sinh ngay câu hỏi trắc nghiệm &amp; tự luận kèm đáp án, giải thích chi tiết và tự động liên kết vào chủ đề của bạn.
                    </p>

                    {isAutoGenerating && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00E5FF]/12 border border-[#00E5FF]/35 text-xs font-semibold text-[#00E5FF]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang phân tích chủ đề và khởi tạo bộ câu hỏi mới...</span>
                      </div>
                    )}

                    {!isAutoGenerating && autoGenResult && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00F5A0]/12 border border-[#00F5A0]/45 text-xs font-semibold text-[#00F5A0]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Hoàn tất! Đã bổ sung {autoGenResult.count} câu hỏi ({autoGenResult.mcqAdded} TN, {autoGenResult.essayAdded} TL) vào ngân hàng chủ đề.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isAutoGenerating}
                    onClick={handleAutoGenerateQuestionsForSelectedTopics}
                    className="w-full lg:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] hover:brightness-110 active:scale-[0.98] text-[#030B16] font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_26px_rgba(0,229,255,0.42)] hover:shadow-[0_0_36px_rgba(0,229,255,0.65)] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isAutoGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ĐANG TẠO CÂU HỎI...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>AUTO TẠO CÂU HỎI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* E. HẠN NỘP BÀI VÀ THỜI GIAN LÀM BÀI (2 CỘT CYBERPUNK)         */}
            {/* ============================================================= */}
            <div className="cyber-glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#00E5FF]/15">
                <Clock className="w-4 h-4 text-[#00E5FF]" />
                <h4 className="text-sm sm:text-base font-bold text-[#EAFBFF]">
                  Hạn nộp bài và thời gian làm bài
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Cột 1: Cyberpunk Date Picker + Time Input cho Hạn nộp */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#EAFBFF]">
                    Hạn nộp bài chót (Ngày &amp; Giờ) <span className="text-[#FF4D6D]">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                      <input
                        type="date"
                        value={dueDatePart}
                        onChange={e => handleDueDatePartChange(e.target.value)}
                        className="w-full bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold tabular-nums focus:border-[#00E5FF]"
                      />
                    </div>

                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                      <input
                        type="time"
                        value={dueTimePart}
                        onChange={e => handleDueTimePartChange(e.target.value)}
                        className="w-full bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold tabular-nums focus:border-[#00E5FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8BA9BC] mb-1">
                        Thời điểm mở bài
                      </label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-[#071525] border border-[#00E5FF]/25 text-[#EAFBFF] rounded-xl px-3 py-2 text-xs tabular-nums focus:border-[#00E5FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#8BA9BC] mb-1">
                        Cho phép nộp trễ
                      </label>
                      <div className="relative">
                        <select
                          value={allowLateDays}
                          onChange={e => setAllowLateDays(Number(e.target.value))}
                          className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/25 text-[#EAFBFF] rounded-xl pl-3 pr-8 py-2 text-xs font-medium focus:border-[#00E5FF]"
                        >
                          <option value={0}>Không cho phép (Khóa ngay)</option>
                          <option value={1}>Cho phép trễ 1 ngày</option>
                          <option value={2}>Cho phép trễ 2 ngày</option>
                          <option value={3}>Cho phép trễ 3 ngày</option>
                          <option value={5}>Cho phép trễ 5 ngày</option>
                          <option value={7}>Cho phép trễ 7 ngày</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#00E5FF] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Thời gian làm bài (phút) + Hướng dẫn */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#EAFBFF]">
                      Thời gian làm bài (phút)
                    </label>
                    <span className="text-[11px] text-[#00E5FF] font-semibold tabular-nums">
                      {timeLimitMinutes > 0 ? `${timeLimitMinutes} phút đếm ngược` : 'Không giới hạn'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Clock className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                      <input
                        type="number"
                        min={0}
                        max={240}
                        step={5}
                        value={timeLimitMinutes}
                        onChange={e => setTimeLimitMinutes(Math.max(0, Number(e.target.value)))}
                        placeholder="Nhập số phút (0 = Không giới hạn)"
                        className="w-full bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-10 pr-14 py-2.5 text-sm font-bold tabular-nums focus:border-[#00E5FF]"
                      />
                      <span className="text-xs font-medium text-[#8BA9BC] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        phút
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {[15, 45, 90, 0].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTimeLimitMinutes(preset)}
                          className={`px-2.5 py-2.5 rounded-xl border text-xs font-bold tabular-nums transition-all cursor-pointer ${
                            timeLimitMinutes === preset
                              ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF]'
                              : 'bg-[#071525] border-[#00E5FF]/20 text-[#8BA9BC] hover:border-[#00E5FF]/50 hover:text-[#EAFBFF]'
                          }`}
                        >
                          {preset === 0 ? '∞' : `${preset}p`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#8BA9BC] mb-1">
                      Chỉ dẫn &amp; Dặn dò học sinh (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Trình bày rõ các bước đối với câu tự luận, nộp đúng hạn..."
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      className="w-full bg-[#071525] border border-[#00E5FF]/25 text-[#EAFBFF] placeholder-[#8BA9BC]/60 rounded-xl px-3.5 py-2 text-xs focus:border-[#00E5FF]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 2: CẤU HÌNH DẠNG BÀI & LOGIC SỐ CÂU PHỤ THUỘC (CHI TIẾT)             */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 text-xs max-w-4xl mx-auto">
            {countInvalidWarning && (
              <div className="p-4 rounded-xl bg-[#FF4D6D]/12 border border-[#FF4D6D]/45 text-[#EAFBFF] flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-[#FF4D6D]">Cảnh báo số lượng câu hỏi</div>
                  <div className="text-xs text-[#EAFBFF]/80 mt-0.5">{countInvalidWarning}</div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[#EAFBFF] font-semibold mb-2.5 text-sm">
                Chọn dạng bài kiểm tra / bài tập
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {[
                  {
                    id: 'mixed',
                    title: '1. Trắc nghiệm & Tự luận',
                    desc: 'Kết hợp cả câu hỏi trắc nghiệm khách quan và bài tự luận trình bày.',
                  },
                  {
                    id: 'mcq_only',
                    title: '2. Chỉ Trắc nghiệm',
                    desc: '100% câu hỏi trắc nghiệm khách quan (chuẩn chấm tự động).',
                  },
                  {
                    id: 'essay_only',
                    title: '3. Chỉ Tự luận',
                    desc: '100% bài tự luận (chứng minh hình học, giải toán, viết văn).',
                  },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAssignmentFormat(item.id as AssignmentFormat)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      assignmentFormat === item.id
                        ? 'bg-[#00E5FF]/12 border-[#00E5FF] text-[#EAFBFF] shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                        : 'bg-[#071525] border-[#00E5FF]/20 text-[#8BA9BC] hover:border-[#00E5FF]/50'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#00E5FF]">{item.title}</div>
                    <div className="text-xs text-[#8BA9BC] mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#EAFBFF] font-semibold mb-1.5">Mức độ nhận thức (Độ khó)</label>
                <div className="relative">
                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="w-full appearance-none bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl pl-3.5 pr-10 py-2.5 font-semibold"
                  >
                    <option value="all">Tất cả mức độ (Phân bổ theo ma trận đề)</option>
                    <option value="easy">Nhận biết (Dễ)</option>
                    <option value="medium">Thông hiểu (Trung bình)</option>
                    <option value="hard">Vận dụng &amp; Vận dụng cao (Khó)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#00E5FF] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[#EAFBFF] font-semibold mb-1.5">Chế độ chọn câu hỏi</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectionMode('auto')}
                    className={`p-2.5 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                      selectionMode === 'auto'
                        ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF]'
                        : 'bg-[#071525] border-[#00E5FF]/20 text-[#8BA9BC]'
                    }`}
                  >
                    Tự động ngẫu nhiên
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode('manual')}
                    className={`p-2.5 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                      selectionMode === 'manual'
                        ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF]'
                        : 'bg-[#071525] border-[#00E5FF]/20 text-[#8BA9BC]'
                    }`}
                  >
                    Chọn thủ công từ danh sách
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(assignmentFormat === 'mixed' || assignmentFormat === 'mcq_only') && (
                <div className="cyber-glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#EAFBFF]">Số câu Trắc nghiệm (1 – 20)</span>
                    <span className="text-[#00F5A0] font-semibold">Có sẵn: {eligibleData.mcqCount}</span>
                  </div>
                  <select
                    value={numMcq}
                    disabled={maxSelectableMcq === 0}
                    onChange={e => setNumMcq(Number(e.target.value))}
                    className="w-full bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl p-2.5 font-bold"
                  >
                    {maxSelectableMcq === 0 ? (
                      <option value={0}>0 câu (Thiếu câu đủ điều kiện)</option>
                    ) : (
                      Array.from({ length: maxSelectableMcq }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>
                          {n} câu trắc nghiệm
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {(assignmentFormat === 'mixed' || assignmentFormat === 'essay_only') && (
                <div className="cyber-glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#EAFBFF]">Số câu Tự luận (1 – 10)</span>
                    <span className="text-[#d8b4fe] font-semibold">Có sẵn: {eligibleData.essayCount}</span>
                  </div>
                  <select
                    value={numEssay}
                    disabled={maxSelectableEssay === 0}
                    onChange={e => setNumEssay(Number(e.target.value))}
                    className="w-full bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl p-2.5 font-bold"
                  >
                    {maxSelectableEssay === 0 ? (
                      <option value={0}>0 câu (Thiếu câu đủ điều kiện)</option>
                    ) : (
                      Array.from({ length: maxSelectableEssay }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>
                          {n} câu tự luận
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 3: CHỌN CÂU HỎI & HOÁN ĐỔI CÂU                                        */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#071525] border border-[#00E5FF]/25">
              <div>
                <h4 className="font-bold text-[#EAFBFF] text-sm">
                  {selectionMode === 'auto'
                    ? 'Danh sách câu hỏi được chọn tự động từ ngân hàng'
                    : 'Tích chọn câu hỏi thủ công theo đúng số lượng'}
                </h4>
                <p className="text-[#8BA9BC] text-xs mt-0.5">
                  {selectionMode === 'auto'
                    ? 'Bạn có thể bấm "Đổi câu" cho bất kỳ câu hỏi nào mà không làm mất cấu hình đề.'
                    : `Cần chọn đủ ${assignmentFormat !== 'essay_only' ? numMcq : 0} câu trắc nghiệm và ${assignmentFormat !== 'mcq_only' ? numEssay : 0} câu tự luận.`}
                </p>
              </div>

              {selectionMode === 'auto' && (
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A1B2D] hover:bg-[#0E253D] border border-[#00E5FF]/40 text-[#00E5FF] font-semibold text-xs cursor-pointer transition-all shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Xáo trộn lại toàn bộ</span>
                </button>
              )}
            </div>

            {selectionMode === 'manual' ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1.5">
                {eligibleData.questions.map(q => {
                  const isChecked = selectedQuestionsList.some(item => item.id === q.id);
                  const isEssay = q.type === 'essay';

                  return (
                    <div
                      key={q.id}
                      onClick={() => handleToggleManualQuestion(q)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,0.16)]'
                          : 'bg-[#071525] border-[#00E5FF]/15 hover:border-[#00E5FF]/45'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-[#00E5FF] border-[#00E5FF]' : 'bg-[#030B16] border-[#00E5FF]/35'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-[#030B16] stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isEssay
                                ? 'bg-[#A855F7]/15 text-[#d8b4fe] border-[#A855F7]/40'
                                : 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40'
                            }`}
                          >
                            {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                          </span>
                          <span className="text-[11px] text-[#8BA9BC]">
                            {renderDifficultyLabel(q.difficulty)} · {q.topic}
                          </span>
                        </div>
                        <p className="text-[#EAFBFF] font-medium text-xs leading-relaxed">{q.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1.5">
                {selectedQuestionsList.map((q, idx) => {
                  const isEssay = q.type === 'essay';
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-[#071525] border border-[#00E5FF]/20 flex items-start justify-between gap-3 hover:border-[#00E5FF]/50 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="w-6 h-6 rounded-lg bg-[#00E5FF]/18 border border-[#00E5FF]/35 text-[#00E5FF] font-bold flex items-center justify-center text-xs tabular-nums">
                            {idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isEssay
                                ? 'bg-[#A855F7]/15 text-[#d8b4fe] border-[#A855F7]/40'
                                : 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40'
                            }`}
                          >
                            {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                          </span>
                          <span className="text-[11px] text-[#8BA9BC]">
                            {renderDifficultyLabel(q.difficulty)} · {questionSourceTopicMap[q.id]?.topicTitle || q.topic}
                          </span>
                        </div>

                        <p className="text-[#EAFBFF] font-medium text-xs leading-relaxed">{q.content}</p>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5 text-[11px] text-[#8BA9BC]">
                            {q.options.map(opt => (
                              <span key={opt.id} className="line-clamp-1">
                                <b className="text-[#00E5FF]">{opt.id}.</b> {opt.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSwapQuestion(idx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A1B2D] hover:bg-[#0E253D] border border-[#00E5FF]/30 text-[#00E5FF] font-semibold text-xs transition-all shrink-0 cursor-pointer"
                        title="Đổi câu hỏi này bằng câu khác trong ngân hàng"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Đổi câu</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 4: THIẾT LẬP ĐIỂM SỐ & QUY CHẾ LÀM BÀI                                */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 text-xs max-w-5xl mx-auto">
            <div className="cyber-glass-card p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#00E5FF]/15">
                <div>
                  <h4 className="font-bold text-[#EAFBFF] text-sm">Thiết lập thang điểm từng câu</h4>
                  <p className="text-xs text-[#8BA9BC]">
                    Tổng điểm các câu phải khớp với thang điểm tối đa ({maxScore} điểm).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8BA9BC]">Thang điểm:</span>
                    <select
                      value={maxScore}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setMaxScore(val);
                        distributePointsEqually(selectedQuestionsList, val);
                      }}
                      className="bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl px-3 py-1.5 font-bold text-sm"
                    >
                      <option value={10}>Thang 10 điểm</option>
                      <option value={20}>Thang 20 điểm</option>
                      <option value={100}>Thang 100 điểm</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => distributePointsEqually(selectedQuestionsList, maxScore)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold text-xs cursor-pointer hover:brightness-110 transition-all"
                  >
                    Chia đều điểm tự động
                  </button>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold border ${
                  isPointsBalanced
                    ? 'bg-[#00F5A0]/12 border-[#00F5A0]/40 text-[#00F5A0]'
                    : 'bg-[#FF4D6D]/12 border-[#FF4D6D]/45 text-[#FF4D6D]'
                }`}
              >
                <span>
                  {isPointsBalanced
                    ? '✓ Tổng điểm các câu đã khớp chính xác với thang điểm tối đa!'
                    : `Tổng điểm hiện tại: ${currentTotalPoints} / ${maxScore} điểm (Lệch ${Math.abs(
                        currentTotalPoints - maxScore
                      ).toFixed(2)} điểm). Hãy điều chỉnh cho khớp.`}
                </span>
                <span className="font-mono text-sm tabular-nums">{currentTotalPoints} / {maxScore}đ</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1.5">
                {selectedQuestionsList.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-[#071525] border border-[#00E5FF]/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#0A1B2D] border border-[#00E5FF]/30 text-[#00E5FF] text-xs flex items-center justify-center font-bold tabular-nums shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-[#EAFBFF] text-xs truncate">{q.content}</span>
                      <span className="text-[10px] text-[#8BA9BC] uppercase shrink-0">
                        {q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#8BA9BC] text-xs">Điểm:</span>
                      <input
                        type="number"
                        step={0.25}
                        min={0.25}
                        max={20}
                        value={questionPointsMap[q.id] || 0.5}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setQuestionPointsMap(prev => ({
                            ...prev,
                            [q.id]: val,
                          }));
                        }}
                        className="w-16 bg-[#0A1B2D] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-lg px-2 py-1 text-center font-bold text-xs tabular-nums"
                      />
                      <span className="text-[#8BA9BC] text-xs">đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cyber-glass-card p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#EAFBFF] font-semibold mb-1.5">
                  Số lần làm bài tối đa
                </label>
                <select
                  value={maxAttempts}
                  onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl p-2.5 font-medium"
                >
                  <option value={1}>1 lần duy nhất</option>
                  <option value={2}>Tối đa 2 lần (Lấy điểm cao nhất)</option>
                  <option value={3}>Tối đa 3 lần</option>
                  <option value={99}>Không giới hạn số lần làm</option>
                </select>
              </div>

              <div>
                <label className="block text-[#EAFBFF] font-semibold mb-1.5">
                  Thời điểm công bố đáp án &amp; lời giải
                </label>
                <select
                  value={showAnswersPolicy}
                  onChange={e => setShowAnswersPolicy(e.target.value as any)}
                  className="w-full bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] rounded-xl p-2.5 font-medium"
                >
                  <option value="after_deadline">Chỉ hiện sau khi hết hạn nộp bài (Khuyên dùng)</option>
                  <option value="after_submit">Hiện ngay sau khi học sinh nộp bài</option>
                  <option value="manual">Khi giáo viên chủ động công bố</option>
                </select>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2.5 text-[#EAFBFF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={e => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                  />
                  <span>Xáo trộn thứ tự câu hỏi khi học sinh làm bài</span>
                </label>

                <label className="flex items-center gap-2.5 text-[#EAFBFF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={e => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                  />
                  <span>Xáo trộn thứ tự phương án trắc nghiệm (A, B, C, D)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 5: XEM TRƯỚC ĐỀ THI NHƯ HỌC SINH SẼ THẤY                              */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-5 text-xs max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#071525] border border-[#00E5FF]/45 shadow-[0_0_30px_rgba(0,229,255,0.12)]">
              <div className="text-center pb-4 border-b border-[#00E5FF]/20">
                <div className="text-xs text-[#8BA9BC] uppercase tracking-widest font-semibold">
                  TRƯỜNG THCS TRƯNG VƯƠNG · ĐỀ BÀI TRỰC TUYẾN
                </div>
                <h3 className="text-lg font-extrabold text-[#EAFBFF] mt-1.5 uppercase tracking-wide">
                  {title || 'BÀI TẬP MÔN ' + subjectName.toUpperCase()}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#8BA9BC] mt-2">
                  <span>
                    Môn: <b className="text-[#00E5FF]">{subjectName}</b>
                  </span>
                  <span>·</span>
                  <span>
                    Lớp: <b className="text-[#EAFBFF]">{allowedClasses.find(c => c.id === classId)?.name}</b>
                  </span>
                  <span>·</span>
                  <span>
                    Thời gian:{' '}
                    <b className="text-[#00E5FF]">
                      {timeLimitMinutes > 0 ? `${timeLimitMinutes} phút` : 'Không giới hạn'}
                    </b>
                  </span>
                  <span>·</span>
                  <span>
                    Thang điểm: <b className="text-[#00F5A0]">{maxScore} điểm</b>
                  </span>
                </div>
                {instructions && (
                  <div className="mt-3 p-3 rounded-xl bg-[#0A1B2D] text-xs text-[#EAFBFF]/90 italic border border-[#00E5FF]/20">
                    "{instructions}"
                  </div>
                )}
              </div>

              <div className="py-4 space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                {selectedQuestionsList.map((q, idx) => {
                  const pts = questionPointsMap[q.id] || (q.type === 'essay' ? 2 : 0.5);
                  const isEssay = q.type === 'essay';

                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-[#0A1B2D] border border-[#00E5FF]/20">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="font-bold text-[#00E5FF] text-xs tabular-nums">
                          Câu {idx + 1} ({pts} điểm)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#071525] border border-[#00E5FF]/20 text-[#8BA9BC]">
                            {questionSourceTopicMap[q.id]?.topicTitle || q.topic}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                              isEssay
                                ? 'bg-[#A855F7]/15 text-[#d8b4fe] border-[#A855F7]/35'
                                : 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/35'
                            }`}
                          >
                            {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[#EAFBFF] text-xs leading-relaxed font-medium mb-3">{q.content}</p>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map(opt => (
                            <div
                              key={opt.id}
                              className="p-2.5 rounded-lg bg-[#071525] border border-[#00E5FF]/20 text-[#EAFBFF] flex items-center gap-2"
                            >
                              <span className="w-5 h-5 rounded-md bg-[#0A1B2D] border border-[#00E5FF]/30 text-[#00E5FF] font-bold text-xs flex items-center justify-center shrink-0">
                                {opt.id}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isEssay && (
                        <div className="mt-2 p-2.5 rounded-lg bg-[#A855F7]/12 border border-[#A855F7]/35 text-[#e9d5ff] text-[11px]">
                          <b>Barem chấm dự kiến:</b> {q.rubric || 'Đầy đủ lập luận và kết luận chính xác.'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-[#8BA9BC] text-[11px] pt-3 border-t border-[#00E5FF]/20">
                Học sinh làm bài trực tiếp trên hệ thống hoặc đính kèm bài giải. Hạn nộp:{' '}
                <span className="text-[#EAFBFF] font-semibold">{new Date(dueDate).toLocaleString('vi-VN')}</span>.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* F. THANH NÚT HÀNH ĐỘNG CUỐI TRANG (FOOTER BAR)                           */}
      {/* ========================================================================= */}
      <div className="px-5 sm:px-6 py-4 border-t border-[#00E5FF]/25 bg-[#071525]/95 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Bên trái: Xem trước đề (Eye icon) + Quay lại */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled={isSubmitting || isAutoGenerating}
            onClick={handleOpenPreviewModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A1B2D] hover:bg-[#0E253D] active:scale-[0.98] text-[#00E5FF] border border-[#00E5FF]/40 hover:border-[#00E5FF] hover:shadow-[0_0_16px_rgba(0,229,255,0.22)] font-semibold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            <span>Xem trước đề</span>
          </button>

          {currentStep > 1 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A1B2D] hover:bg-[#0E253D] active:scale-[0.98] text-[#8BA9BC] hover:text-[#EAFBFF] border border-[#00E5FF]/20 font-semibold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          )}
        </div>

        {/* Bên phải: Lưu nháp + (Tùy chỉnh câu / Tiếp tục) + Giao bài ngay */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          <button
            type="button"
            disabled={isSubmitting || isAutoGenerating}
            onClick={() => handlePublishAssignment('draft')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A1B2D] hover:bg-[#0E253D] active:scale-[0.98] text-[#EAFBFF] border border-[#00E5FF]/30 hover:border-[#00E5FF]/70 font-semibold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#00E5FF]" />}
            <span>Lưu nháp</span>
          </button>

          {currentStep < 5 && (
            <button
              type="button"
              disabled={isSubmitting || isAutoGenerating}
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A1B2D] hover:bg-[#0E253D] active:scale-[0.98] text-[#8BA9BC] hover:text-[#00E5FF] border border-[#00E5FF]/25 font-semibold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <span>{currentStep === 1 ? 'Tùy chỉnh câu & điểm' : `Tiếp tục: Bước ${currentStep + 1}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting || isAutoGenerating}
            onClick={handleOpenPublishConfirm}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] hover:brightness-110 active:scale-[0.98] text-[#030B16] font-extrabold text-xs sm:text-sm shadow-[0_0_24px_rgba(0,229,255,0.4)] hover:shadow-[0_0_32px_rgba(0,229,255,0.62)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang giao bài...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Giao bài ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL (Triggered by "Xem trước đề") */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Xem Trước Đề Thi & Phiếu Bài Tập"
        subtitle={`Môn ${subjectName} · Lớp ${allowedClasses.find(c => c.id === classId)?.name || '10A1'} · ${totalRequiredQuestions} câu hỏi`}
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[#071525] border border-[#00E5FF]/35 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[#EAFBFF]">
                {title.trim() || `Bài tập ôn luyện môn ${subjectName}`}
              </div>
              <div className="text-[#8BA9BC] mt-1 flex flex-wrap items-center gap-2">
                <span>Thời gian: <strong className="text-[#00E5FF]">{timeLimitMinutes > 0 ? `${timeLimitMinutes} phút` : 'Không giới hạn'}</strong></span>
                <span>·</span>
                <span>Hạn nộp: <strong className="text-[#EAFBFF]">{new Date(dueDate).toLocaleString('vi-VN')}</strong></span>
                <span>·</span>
                <span>Thang điểm: <strong className="text-[#00F5A0]">{maxScore} điểm</strong></span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                handleGenerateQuestions();
                showToast('Đã làm mới thứ tự câu hỏi xem trước!', 'info');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0A1B2D] hover:bg-[#0E253D] border border-[#00E5FF]/35 text-[#00E5FF] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi ngẫu nhiên</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {selectedQuestionsList.map((q, idx) => {
              const pts = questionPointsMap[q.id] || (q.type === 'essay' ? 2 : 0.5);
              const isEssay = q.type === 'essay';
              return (
                <div key={q.id} className="p-4 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-[#00E5FF] tabular-nums">
                      Câu {idx + 1} ({pts} điểm)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#0A1B2D] border border-[#00E5FF]/20 text-[#8BA9BC]">
                        {questionSourceTopicMap[q.id]?.topicTitle || q.topic}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          isEssay
                            ? 'bg-[#A855F7]/15 text-[#d8b4fe] border-[#A855F7]/35'
                            : 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/35'
                        }`}
                      >
                        {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[#EAFBFF] text-xs leading-relaxed font-medium">{q.content}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                      {q.options.map(opt => (
                        <div
                          key={opt.id}
                          className="p-2 rounded-lg bg-[#0A1B2D] border border-[#00E5FF]/15 text-[#EAFBFF] flex items-center gap-2"
                        >
                          <span className="w-5 h-5 rounded bg-[#071525] text-[#00E5FF] font-bold flex items-center justify-center shrink-0">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isEssay && (
                    <div className="mt-2 p-2 rounded-lg bg-[#A855F7]/12 border border-[#A855F7]/30 text-[#e9d5ff] text-[11px]">
                      <b>Gợi ý chấm:</b> {q.rubric || 'Đầy đủ lập luận và kết quả chính xác.'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#00E5FF]/20">
            <button
              type="button"
              onClick={() => {
                setIsPreviewModalOpen(false);
                setCurrentStep(3);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#071525] hover:bg-[#0E253D] border border-[#00E5FF]/30 text-[#00E5FF] font-semibold cursor-pointer"
            >
              Chỉnh sửa từng câu hỏi →
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/20 text-[#8BA9BC] hover:text-[#EAFBFF] font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  handleOpenPublishConfirm();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-extrabold cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Giao bài ngay</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* CONFIRM PUBLISH MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Xác Nhận Phát Hành Bài Tập / Bài Kiểm Tra"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[#071525] border border-[#00E5FF]/35 text-[#EAFBFF] space-y-2.5">
            <div className="text-sm font-bold text-[#EAFBFF] mb-2">{title}</div>
            <div className="flex justify-between">
              <span className="text-[#8BA9BC]">Lớp nhận bài:</span>
              <span className="font-semibold text-[#EAFBFF]">
                Lớp {allowedClasses.find(c => c.id === classId)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8BA9BC]">Số lượng học sinh nhận:</span>
              <span className="font-semibold text-[#00E5FF] tabular-nums">{targetClassStudents.length} học sinh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8BA9BC]">Phụ huynh nhận thông báo:</span>
              <span className="font-semibold text-[#00E5FF] tabular-nums">{targetClassStudents.length} phụ huynh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8BA9BC]">Tổng số câu hỏi:</span>
              <span className="font-semibold text-[#EAFBFF] tabular-nums">
                {selectedQuestionsList.length} câu ({assignmentFormat !== 'essay_only' ? numMcq : 0} TN +{' '}
                {assignmentFormat !== 'mcq_only' ? numEssay : 0} TL)
              </span>
            </div>
            {topicPools.length > 0 && (
              <div className="pt-2 mt-2 border-t border-[#00E5FF]/15 space-y-1.5">
                <div className="text-[#8BA9BC] font-semibold">
                  Phân bổ theo chủ đề ({topicSharePercentLabel}/chủ đề):
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {topicPools.map(p => {
                    const countFromTopic = selectedQuestionsList.filter(
                      q => questionSourceTopicMap[q.id]?.topicId === p.topicId
                    ).length;
                    return (
                      <div key={p.topicId} className="flex items-center justify-between text-[11px] bg-[#0A1B2D] px-2.5 py-1.5 rounded-lg border border-[#00E5FF]/15">
                        <span className="text-[#EAFBFF] truncate pr-2">{p.topicTitle}</span>
                        <span className="text-[#00F5A0] font-bold tabular-nums shrink-0">
                          {countFromTopic} câu ({topicSharePercentLabel})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#8BA9BC]">Thời gian làm bài:</span>
              <span className="font-semibold text-[#00E5FF] tabular-nums">
                {timeLimitMinutes > 0 ? `${timeLimitMinutes} phút` : 'Không giới hạn'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8BA9BC]">Hạn chót nộp bài:</span>
              <span className="font-semibold text-[#00F5A0] tabular-nums">
                {new Date(dueDate).toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8BA9BC]">Quy chế nộp trễ:</span>
              <span className="font-semibold text-[#00F5A0]">
                {allowLateDays > 0 ? `Cho phép nộp muộn ${allowLateDays} ngày` : 'Khóa đúng hạn'}
              </span>
            </div>
          </div>

          <p className="text-[#8BA9BC] text-xs">
            Sau khi bấm xác nhận, hệ thống sẽ tự động gửi thông báo trực tiếp đến tất cả học sinh và phụ huynh trong lớp.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#00E5FF]/20">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] hover:text-[#EAFBFF] text-xs font-semibold cursor-pointer"
            >
              Xem lại đề
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePublishAssignment('published')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] hover:brightness-110 text-[#030B16] text-xs font-extrabold shadow-[0_0_20px_rgba(0,229,255,0.35)] cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang giao bài...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Xác Nhận &amp; Giao Bài Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
