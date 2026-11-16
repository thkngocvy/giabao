import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Upload,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Edit3,
  Save,
  Eye,
  EyeOff,
  Highlighter,
  Check,
  Copy,
  X,
  Sparkles,
  Calendar,
  User,
  Clock,
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { AssignmentTopic, Question } from '../../types';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';

interface TopicLessonDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: AssignmentTopic | null;
  onTopicUpdated?: (updatedTopic: AssignmentTopic) => void;
  onOpenCreateExam?: (topicId: string, topicName: string, subjectName: string, classId: string) => void;
}

export const TopicLessonDocModal: React.FC<TopicLessonDocModalProps> = ({
  isOpen,
  onClose,
  topic,
  onTopicUpdated,
  onOpenCreateExam,
}) => {
  const { showToast } = useToast();

  // Mode: 'view' (Reading / Teaching mode) | 'edit' (Soạn thảo)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  // Fullscreen / Projector Presentation mode
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // Document style: 'word' (Classic A4 white) | 'chalkboard' (Dark board high contrast) | 'sepia' (Warm eye care)
  const [docTheme, setDocTheme] = useState<'word' | 'chalkboard' | 'sepia'>('word');
  // Font size: 'sm' (14px) | 'base' (16px) | 'lg' (18px) | 'xl' (21px)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  // Active highlight color: null | 'yellow' | 'cyan' | 'pink'
  const [activeHighlightColor, setActiveHighlightColor] = useState<'yellow' | 'cyan' | 'pink' | null>(null);
  const [highlightedBlocks, setHighlightedBlocks] = useState<Record<number, 'yellow' | 'cyan' | 'pink'>>({});
  const [isConfirmTemplateOpen, setIsConfirmTemplateOpen] = useState<boolean>(false);

  // Content state
  const [content, setContent] = useState<string>('');
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Linked questions for interactive teaching
  const [linkedQuestions, setLinkedQuestions] = useState<Question[]>([]);
  const [showAnswersMap, setShowAnswersMap] = useState<Record<string, boolean>>({});

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileText, setUploadedFileText] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docContainerRef = useRef<HTMLDivElement>(null);

  // Copy state
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load topic data
  useEffect(() => {
    if (topic) {
      setTopicTitle(topic.title || topic.name || 'Chủ đề bài học');
      setContent(topic.content || topic.description || defaultLessonPlanTemplate(topic));
      
      // Load linked questions
      if (topic.questionIds && topic.questionIds.length > 0) {
        const allQ = db.getQuestions();
        const filtered = allQ.filter(q => topic.questionIds?.includes(q.id));
        setLinkedQuestions(filtered);
      } else {
        // Fallback: search questions with matching subject
        const allQ = db.getQuestions().filter(q => q.subject.toLowerCase() === (topic.subjectName || '').toLowerCase());
        setLinkedQuestions(allQ.slice(0, 4));
      }
    }
  }, [topic]);

  if (!isOpen || !topic) return null;

  // Template CV 5512 helper
  function defaultLessonPlanTemplate(t: AssignmentTopic): string {
    return `I. MỤC TIÊU BÀI DẠY (YÊU CẦU CẦN ĐẠT - CV 5512)
1. Về kiến thức:
- Giúp học sinh nắm vững các khái niệm, định nghĩa và công thức cốt lõi của chủ đề "${t.title || t.name}".
- Nhận biết các dạng toán điển hình và vận dụng linh hoạt các phương pháp giải phù hợp.

2. Về năng lực:
- Năng lực tư duy logic và mô hình hóa toán học.
- Năng lực giải quyết vấn đề, tự học và hợp tác nhóm trong quá trình thảo luận.

3. Về phẩm chất:
- Rèn luyện tính cẩn thận, chính xác, trung thực và tinh thần kỷ luật trong học tập.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- Giáo viên: Máy tính kết nối màn hình tương tác / Smart TV, Kế hoạch bài dạy, Phiếu học tập số 1 & 2.
- Học sinh: Sách giáo khoa, vở ghi lý thuyết, máy tính cầm tay, đồ dùng học tập.

III. TIẾN TRÌNH DẠY HỌC & HOẠT ĐỘNG TRỌNG TÂM
1. Hoạt động 1: Khởi động & Đặt vấn đề (5 - 7 phút)
- Tình huống thực tế dẫn dắt vào bài toán trọng tâm.
- Nhắc lại kiến thức liên quan của buổi học trước để tạo liên kết logic.

2. Hoạt động 2: Hình thành kiến thức mới (18 - 20 phút)
- Định nghĩa & Công thức chính:
  [Giáo viên trình bày công thức cốt lõi trên bảng và màn hình trình chiếu]
- Ví dụ mẫu minh họa 1:
  Đề bài: Giải bài toán mẫu cơ bản áp dụng định nghĩa.
  Lời giải: Trình bày từng bước chuẩn xác để học sinh ghi chép vào vở.

3. Hoạt động 3: Luyện tập củng cố tại lớp (12 - 15 phút)
- Học sinh làm bài tập tương tác nhanh theo cá nhân và theo cặp.
- Giáo viên quan sát, chấm chữa và nhận xét trực tiếp trên bảng.

4. Hoạt động 4: Vận dụng & Hướng dẫn tự học (3 - 5 phút)
- Tóm tắt sơ đồ tư duy toàn bộ bài học.
- Giao bài tập về nhà trên hệ thống SmartClass để học sinh rèn luyện.`;
  }

  // Toggle single question answer visibility for classroom interaction
  const toggleQuestionAnswer = (qId: string) => {
    setShowAnswersMap(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Toggle all answers at once
  const toggleAllAnswers = (show: boolean) => {
    const newMap: Record<string, boolean> = {};
    linkedQuestions.forEach(q => {
      newMap[q.id] = show;
    });
    setShowAnswersMap(newMap);
  };

  // Save lesson content to database
  const handleSaveLessonPlan = () => {
    setIsSaving(true);
    const result = db.updateTopic(topic.id, {
      title: topicTitle,
      name: topicTitle,
      content: content,
    });

    setTimeout(() => {
      setIsSaving(false);
      if (result.success && result.topic) {
        showToast('Đã lưu nội dung giáo án thành công!', 'success');
        setIsEditMode(false);
        if (onTopicUpdated) {
          onTopicUpdated(result.topic);
        }
      } else {
        showToast(result.error || 'Lỗi khi lưu giáo án.', 'error');
      }
    }, 300);
  };

  // File upload reader
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (extension === 'docx') {
        // Fast docx xml text extraction
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const raw = decoder.decode(buffer);

        // Extract paragraphs
        const pMatches = raw.match(/<w:p[\s>][\s\S]*?<\/w:p>/g);
        if (pMatches && pMatches.length > 0) {
          const lines = pMatches.map(p => {
            const tMatches = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
            if (!tMatches) return '';
            return tMatches.map(t => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')).join('');
          }).filter(l => l.trim().length > 0);

          if (lines.length > 0) {
            setUploadedFileText(lines.join('\n\n'));
            setIsUploadModalOpen(true);
            return;
          }
        }

        // Fallback for docx
        const matches = raw.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
        if (matches && matches.length > 0) {
          const extracted = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
          setUploadedFileText(extracted);
          setIsUploadModalOpen(true);
          return;
        }
      }

      // Read as plain text for .txt, .md, .doc, .json
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setUploadedFileText(text);
        setIsUploadModalOpen(true);
      };
      reader.readAsText(file, 'utf-8');
    } catch (err) {
      console.error('Lỗi đọc tệp:', err);
      showToast('Không thể đọc tệp này. Vui lòng thử lại với định dạng .docx, .doc, .txt hoặc .md', 'error');
    }
  };

  // Apply uploaded file text
  const handleConfirmUpload = () => {
    if (!uploadedFileText.trim()) {
      showToast('Tệp không có nội dung văn bản hợp lệ.', 'error');
      return;
    }

    let finalContent = '';
    if (uploadMode === 'replace') {
      finalContent = uploadedFileText;
    } else {
      finalContent = content ? `${content}\n\n--- NỘI DUNG TẢI LÊN MỚI ---\n\n${uploadedFileText}` : uploadedFileText;
    }

    setContent(finalContent);
    setIsUploadModalOpen(false);
    setUploadedFileText('');
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Auto-save to database
    const res = db.updateTopic(topic.id, { content: finalContent });
    if (res.success && res.topic && onTopicUpdated) {
      onTopicUpdated(res.topic);
    }
    showToast(`Đã nạp nội dung từ "${uploadedFileName}" vào giáo án!`, 'success');
  };

  // Apply official template CV 5512 (iframe-safe confirmation)
  const handleApplyTemplate5512 = () => {
    setIsConfirmTemplateOpen(true);
  };

  const confirmApplyTemplate5512 = () => {
    const template = defaultLessonPlanTemplate(topic);
    setContent(template);
    const res = db.updateTopic(topic.id, { content: template });
    if (res.success && res.topic && onTopicUpdated) {
      onTopicUpdated(res.topic);
    }
    setIsConfirmTemplateOpen(false);
    showToast('Đã áp dụng mẫu giáo án chuẩn CV 5512!', 'success');
  };

  // Print document
  const handlePrint = () => {
    window.print();
  };

  // Download as Word .doc file
  const handleDownloadWordDoc = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${topicTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #000; margin: 2cm; }
          h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 5px; }
          h2 { font-size: 14pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: #002060; }
          .header-table { width: 100%; border: none; margin-bottom: 20px; }
          .header-table td { vertical-align: top; font-size: 11pt; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .meta-table td, .meta-table th { border: 1px solid #7f7f7f; padding: 6px 10px; font-size: 11pt; }
          .meta-table th { background-color: #f2f2f2; }
          p { margin: 6px 0; text-align: justify; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 50%; text-align: center;">
              <strong>UBND QUẬN HOÀN KIẾM</strong><br/>
              <strong>TRƯỜNG THCS TRƯNG VƯƠNG</strong><br/>
              <span>Tổ chuyên môn: ${topic.subjectName}</span>
            </td>
            <td style="width: 50%; text-align: center;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
              <span>-----------------</span>
            </td>
          </tr>
        </table>
        <h1>KẾ HOẠCH BÀI DẠY (GIÁO ÁN ĐIỆN TỬ)</h1>
        <h2 style="text-align: center; text-transform: uppercase;">CHỦ ĐỀ: ${topicTitle}</h2>
        
        <table class="meta-table">
          <tr>
            <td><strong>Môn học:</strong> ${topic.subjectName}</td>
            <td><strong>Lớp giảng dạy:</strong> ${topic.className || '9A1'}</td>
          </tr>
          <tr>
            <td><strong>Buổi học:</strong> ${topic.lessonDate || 'Theo phân phối'} (Tiết ${topic.period || 1})</td>
            <td><strong>Thời lượng:</strong> 45 phút</td>
          </tr>
          <tr>
            <td><strong>Giáo viên soạn giảng:</strong> ${topic.createdByName || 'Cô Lê Thu Hà'}</td>
            <td><strong>Năm học:</strong> 2024 - 2025</td>
          </tr>
        </table>

        <div>
          ${content.replace(/\n/g, '<br/>')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Giao_An_${(topic.subjectName || 'Mon').replace(/\s+/g, '_')}_${topicTitle.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đang tải file Word (.doc) về máy tính!', 'info');
  };

  // Copy full content
  const handleCopyAll = () => {
    navigator.clipboard.writeText(`${topicTitle}\n\n${content}`);
    setIsCopied(true);
    showToast('Đã sao chép nội dung giáo án vào bộ nhớ tạm!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Font size class mapping
  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
  };

  // Theme styling mapping for the paper
  const themePaperClasses = {
    word: 'word-a4-paper bg-white text-slate-900 border border-slate-300 shadow-2xl',
    chalkboard: 'bg-[#031424] text-slate-100 border border-cyan-800/80 shadow-2xl shadow-cyan-950/50',
    sepia: 'sepia-a4-paper bg-[#faf6ee] text-[#3c2f1f] border border-[#e2d8c3] shadow-2xl',
  };

  const toggleBlockHighlight = (idx: number) => {
    if (!activeHighlightColor) return;
    setHighlightedBlocks(prev => {
      const next = { ...prev };
      if (next[idx] === activeHighlightColor) {
        delete next[idx];
      } else {
        next[idx] = activeHighlightColor;
      }
      return next;
    });
  };

  const getHighlightClass = (idx: number) => {
    const color = highlightedBlocks[idx];
    if (color === 'yellow') return 'bg-yellow-200/80 text-slate-900 rounded px-2 py-1';
    if (color === 'cyan') return 'bg-cyan-200/75 text-slate-900 rounded px-2 py-1';
    if (color === 'pink') return 'bg-pink-200/75 text-slate-900 rounded px-2 py-1';
    return '';
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${
        isFullscreen ? 'p-0 bg-black' : 'p-2 sm:p-4 bg-black/85 backdrop-blur-xs'
      } animate-in fade-in duration-150`}
    >
      <div
        className={`flex flex-col w-full h-full ${
          isFullscreen ? 'rounded-none' : 'rounded-2xl'
        } bg-[#041628] border border-[#0e3d54] shadow-2xl overflow-hidden`}
      >
        {/* =================================================================== */}
        {/* 1. TOP WORD RIBBON BAR (Thanh công cụ chuẩn trang Word giảng dạy) */}
        {/* =================================================================== */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#031322] border-b border-[#0e3d54] text-slate-200 gap-2 shrink-0">
          {/* Left: Document info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate max-w-xs md:max-w-md">
                  {topicTitle}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {topic.className || '9A1'} · {topic.subjectName}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Giáo án điện tử
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{topic.lessonDate ? `Buổi: ${topic.lessonDate}` : 'Buổi 12'}</span>
                <span>•</span>
                <span>Tiết {topic.period || 1}</span>
                <span>•</span>
                <span>Soạn bởi: {topic.createdByName || 'Cô Lê Thu Hà'}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Upload File Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".docx,.doc,.txt,.md"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload file giáo án từ máy tính (.docx, .doc, .txt, .md)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#07253f] hover:bg-[#0a355c] border border-cyan-700/50 text-cyan-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file lên</span>
            </button>

            {/* Quick CV 5512 template */}
            <button
              onClick={handleApplyTemplate5512}
              title="Áp dụng mẫu chuẩn Công văn 5512"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#07253f] hover:bg-[#0a355c] border border-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Mẫu CV 5512</span>
            </button>

            {/* Toggle Mode: View (Teaching) vs Edit (Soạn thảo) */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isEditMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Xem Giảng Dạy' : 'Soạn Thảo'}</span>
            </button>

            {/* Save Button (when editing) */}
            {isEditMode && (
              <button
                onClick={handleSaveLessonPlan}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Lưu</span>
              </button>
            )}

            {/* Font size control */}
            <div className="flex items-center bg-[#07253f] border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  fontSize === 'sm' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Cỡ chữ nhỏ"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  fontSize === 'base' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Cỡ chữ chuẩn"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  fontSize === 'lg' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Cỡ chữ lớn cho học sinh"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  fontSize === 'xl' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Cỡ chữ chiếu lớp học"
              >
                A++
              </button>
            </div>

            {/* Theme / Paper style */}
            <div className="hidden md:flex items-center bg-[#07253f] border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setDocTheme('word')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  docTheme === 'word' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Trang giấy trắng chuẩn Word"
              >
                Word A4
              </button>
              <button
                onClick={() => setDocTheme('chalkboard')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  docTheme === 'chalkboard' ? 'bg-cyan-900 text-cyan-200 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Bảng đen / Chiếu tối"
              >
                Bảng Đen
              </button>
              <button
                onClick={() => setDocTheme('sepia')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  docTheme === 'sepia' ? 'bg-[#e8dec8] text-[#3c2f1f] shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Màu ấm dịu mắt"
              >
                Ấm áp
              </button>
            </div>

            {/* Print button */}
            <button
              onClick={handlePrint}
              title="In ra giấy hoặc lưu thành file PDF"
              className="p-1.5 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download Word .doc */}
            <button
              onClick={handleDownloadWordDoc}
              title="Tải về file Word (.doc)"
              className="p-1.5 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Copy full content */}
            <button
              onClick={handleCopyAll}
              title="Sao chép toàn bộ văn bản giáo án"
              className="p-1.5 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Presentation / Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Thu nhỏ giao diện' : 'Toàn màn hình giảng dạy (Trình chiếu)'}
              className="p-1.5 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-cyan-400 hover:text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Create exam shortcut */}
            {onOpenCreateExam && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateExam(topic.id, topic.title || topic.name, topic.subjectName, topic.classId || 'class_10a1');
                }}
                className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tạo Đề Từ Chủ Đề Này</span>
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-950/60 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. SUB-TOOLBAR: TEACHING HELPERS & HIGHLIGHT (Chỉ hiện khi Xem bài giảng) */}
        {/* =================================================================== */}
        {!isEditMode && (
          <div className="flex flex-wrap items-center justify-between px-6 py-2 bg-[#020d18] border-b border-[#0e3d54] text-xs text-slate-300 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Chế độ Giáo án Giảng dạy cho Lớp {topic.className || '9A1'}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Hiển thị chuẩn văn bản Word, sẵn sàng chiếu lên màn hình lớp học
              </span>
            </div>

            {/* Teaching interactive buttons */}
            <div className="flex items-center gap-2">
              {/* Highlight tool */}
              <div className="flex items-center gap-1 bg-[#051c30] px-2 py-1 rounded-lg border border-[#0e3d54]">
                <Highlighter className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-slate-400 mr-1">Bút dạ:</span>
                <button
                  onClick={() => setActiveHighlightColor(activeHighlightColor === 'yellow' ? null : 'yellow')}
                  className={`w-4 h-4 rounded-full bg-yellow-300 border ${
                    activeHighlightColor === 'yellow' ? 'ring-2 ring-white scale-110' : 'opacity-70'
                  }`}
                  title="Bút dạ vàng"
                />
                <button
                  onClick={() => setActiveHighlightColor(activeHighlightColor === 'cyan' ? null : 'cyan')}
                  className={`w-4 h-4 rounded-full bg-cyan-300 border ${
                    activeHighlightColor === 'cyan' ? 'ring-2 ring-white scale-110' : 'opacity-70'
                  }`}
                  title="Bút dạ xanh ngọc"
                />
                <button
                  onClick={() => setActiveHighlightColor(activeHighlightColor === 'pink' ? null : 'pink')}
                  className={`w-4 h-4 rounded-full bg-pink-300 border ${
                    activeHighlightColor === 'pink' ? 'ring-2 ring-white scale-110' : 'opacity-70'
                  }`}
                  title="Bút dạ hồng"
                />
                {activeHighlightColor && (
                  <button
                    onClick={() => setActiveHighlightColor(null)}
                    className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                  >
                    Tắt bút
                  </button>
                )}
              </div>

              {/* Show/Hide all classroom questions answers */}
              {linkedQuestions.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAllAnswers(false)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#051c30] hover:bg-[#082a48] border border-[#0e3d54] text-[11px] text-amber-300 transition-colors cursor-pointer"
                    title="Ẩn tất cả đáp án để gọi học sinh lên bảng trả lời"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Ẩn đáp án (Để HS làm)</span>
                  </button>
                  <button
                    onClick={() => toggleAllAnswers(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#051c30] hover:bg-[#082a48] border border-[#0e3d54] text-[11px] text-emerald-300 transition-colors cursor-pointer"
                    title="Hiện tất cả đáp án để chữa bài cho cả lớp"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Hiện đáp án</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. MAIN WORKSPACE / WORD CANVAS CONTAINER */}
        {/* =================================================================== */}
        <div
          ref={docContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#020b14] flex justify-center selection:bg-yellow-300 selection:text-slate-900"
        >
          {isEditMode ? (
            /* SOẠN THẢO VĂN BẢN TRỰC TIẾP */
            <div className="w-full max-w-4xl space-y-4">
              <div className="p-4 rounded-2xl bg-[#041628] border border-[#0e3d54] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên chủ đề bài dạy (Tối đa 200 ký tự)
                  </label>
                  <input
                    type="text"
                    value={topicTitle}
                    onChange={e => setTopicTitle(e.target.value)}
                    maxLength={200}
                    className="w-full bg-[#020d18] border border-[#0e3d54] rounded-xl px-4 py-2.5 text-white font-bold text-base focus:border-cyan-400 focus:outline-none"
                    placeholder="Nhập tên chủ đề..."
                  />
                </div>

                {/* Quick insert toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#0e3d54]/70">
                  <span className="text-xs text-slate-400">Chèn nhanh:</span>
                  <button
                    type="button"
                    onClick={() => setContent(prev => prev + '\n\n### 1. Khái niệm & Định lý cốt lõi\n- ')}
                    className="px-2.5 py-1 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-cyan-300 text-xs font-medium cursor-pointer"
                  >
                    + Mục lý thuyết
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent(prev => prev + '\n\n**Ví dụ mẫu 1:** Cho phương trình...\n*Lời giải:*\nBước 1: ...\nBước 2: ...')}
                    className="px-2.5 py-1 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-cyan-300 text-xs font-medium cursor-pointer"
                  >
                    + Ví dụ mẫu
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent(prev => prev + '\n\n> **LƯU Ý QUAN TRỌNG:** Học sinh thường mắc lỗi...')}
                    className="px-2.5 py-1 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-amber-300 text-xs font-medium cursor-pointer"
                  >
                    + Ghi chú lưu ý
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent(prev => prev + '\n\nIV. BÀI TẬP VỀ NHÀ:\n1. Bài 1 trang ... SGK.\n2. Bài 2 trang ... SGK.')}
                    className="px-2.5 py-1 rounded-lg bg-[#07253f] hover:bg-[#0a355c] text-emerald-300 text-xs font-medium cursor-pointer"
                  >
                    + BTVN
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nội dung giáo án chi tiết (Hỗ trợ định dạng văn bản, công thức, đề mục)
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      {content.length} / 8.000 ký tự
                    </span>
                  </div>
                  <textarea
                    rows={20}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={8000}
                    className="w-full bg-[#020d18] border border-[#0e3d54] rounded-xl p-4 text-slate-100 font-mono text-sm leading-relaxed focus:border-cyan-400 focus:outline-none resize-y"
                    placeholder="Nhập hoặc dán nội dung giáo án..."
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Hủy chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLessonPlan}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Giáo Án Bài Dạy</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TRANG GIẤY WORD A4 CHUẨN IN ẤN & GIẢNG DẠY */
            <div
              className={`w-full max-w-[850px] min-h-[1150px] p-8 sm:p-14 rounded-sm transition-all ${
                themePaperClasses[docTheme]
              } ${fontSizeClasses[fontSize]}`}
              style={{
                fontFamily: docTheme === 'word' ? '"Times New Roman", Times, serif' : 'system-ui, sans-serif'
              }}
            >
              {/* HEADER QUỐC HIỆU / CƠ QUAN CHỦ QUẢN */}
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-current/20 text-center text-xs sm:text-sm">
                <div>
                  <div className="font-bold uppercase tracking-wider">UBND QUẬN HOÀN KIẾM</div>
                  <div className="font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
                    TRƯỜNG THCS TRƯNG VƯƠNG
                  </div>
                  <div className="italic text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tổ chuyên môn: {topic.subjectName}
                  </div>
                </div>

                <div>
                  <div className="font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-semibold text-xs sm:text-sm">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-slate-400 text-xs">***</div>
                </div>
              </div>

              {/* TIÊU ĐỀ LỚN CỦA GIÁO ÁN */}
              <div className="text-center my-6 space-y-1">
                <div className="text-xs uppercase tracking-widest font-bold opacity-75">
                  KẾ HOẠCH BÀI DẠY THEO CHỦ ĐỀ (GIÁO ÁN ĐIỆN TỬ)
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-blue-900 dark:text-cyan-300">
                  {topicTitle}
                </h1>
                <div className="text-xs italic text-slate-500 dark:text-slate-400">
                  (Biên soạn theo chương trình GDPT 2018 - Chuẩn Công văn 5512/BGDĐT)
                </div>
              </div>

              {/* BẢNG THÔNG TIN HÀNH CHÍNH BUỔI DẠY */}
              <div className="my-6 border border-current/30 rounded-lg overflow-hidden text-xs sm:text-sm">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-current/20">
                      <td className="p-2.5 font-bold w-1/4 bg-current/5">Lớp giảng dạy:</td>
                      <td className="p-2.5 w-1/4 font-semibold text-cyan-600 dark:text-cyan-300">
                        Lớp {topic.className || '9A1'}
                      </td>
                      <td className="p-2.5 font-bold w-1/4 bg-current/5">Môn học:</td>
                      <td className="p-2.5 w-1/4 font-semibold">{topic.subjectName}</td>
                    </tr>
                    <tr className="border-b border-current/20">
                      <td className="p-2.5 font-bold bg-current/5">Buổi học / Ngày:</td>
                      <td className="p-2.5">
                        {topic.lessonDate ? `Buổi ${topic.lessonDate}` : 'Buổi 12 (24/02/2025)'}
                      </td>
                      <td className="p-2.5 font-bold bg-current/5">Tiết học:</td>
                      <td className="p-2.5">Tiết {topic.period || 1} (Thời lượng: 45 phút)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-current/5">Giáo viên soạn giảng:</td>
                      <td className="p-2.5 font-semibold">{topic.createdByName || 'Cô Lê Thu Hà'}</td>
                      <td className="p-2.5 font-bold bg-current/5">Năm học:</td>
                      <td className="p-2.5">2024 - 2025 (Học kỳ II)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* NỘI DUNG CHÍNH CỦA GIÁO ÁN */}
              <div className="space-y-4 my-8 text-justify">
                {content.split('\n\n').map((paragraph, pIdx) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return null;

                  // Heading check: Roman numerals I., II., III. or ### or CAPITALS
                  const isMainHeading = /^(I|II|III|IV|V|VI|VII)\.\s+/i.test(trimmed) || trimmed.startsWith('# ');
                  const isSubHeading = /^(1|2|3|4|5|6)\.\s+/i.test(trimmed) || trimmed.startsWith('## ') || trimmed.startsWith('### ');
                  const isCallout = trimmed.startsWith('> ') || trimmed.includes('LƯU Ý');
                  const hlClass = getHighlightClass(pIdx);
                  const interactiveClass = activeHighlightColor ? 'cursor-crosshair hover:ring-2 hover:ring-amber-400/60 transition-all' : '';

                  if (isMainHeading) {
                    return (
                      <h2
                        key={pIdx}
                        onClick={() => toggleBlockHighlight(pIdx)}
                        className={`text-base sm:text-lg font-bold uppercase mt-6 pt-2 border-b border-current/20 ${
                          docTheme === 'chalkboard' ? 'text-cyan-300' : 'text-blue-900'
                        } ${hlClass} ${interactiveClass}`}
                      >
                        {trimmed.replace(/^#+\s*/, '')}
                      </h2>
                    );
                  }

                  if (isSubHeading) {
                    return (
                      <h3
                        key={pIdx}
                        onClick={() => toggleBlockHighlight(pIdx)}
                        className={`text-sm sm:text-base font-bold mt-4 ${
                          docTheme === 'chalkboard' ? 'text-cyan-200' : 'text-slate-800'
                        } ${hlClass} ${interactiveClass}`}
                      >
                        {trimmed.replace(/^#+\s*/, '')}
                      </h3>
                    );
                  }

                  if (isCallout) {
                    return (
                      <div
                        key={pIdx}
                        onClick={() => toggleBlockHighlight(pIdx)}
                        className={`p-3 my-3 rounded-lg bg-amber-500/10 border-l-4 border-amber-500 ${
                          docTheme === 'chalkboard' ? 'text-amber-200' : 'text-amber-900'
                        } text-xs sm:text-sm italic ${hlClass} ${interactiveClass}`}
                      >
                        {trimmed.replace(/^>\s*/, '')}
                      </div>
                    );
                  }

                  // Bullet lists
                  if (trimmed.includes('\n- ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const lines = trimmed.split('\n');
                    return (
                      <ul
                        key={pIdx}
                        onClick={() => toggleBlockHighlight(pIdx)}
                        className={`list-disc pl-6 space-y-1 my-2 ${hlClass} ${interactiveClass}`}
                      >
                        {lines.map((l, lIdx) => (
                          <li key={lIdx} className="leading-relaxed">
                            {l.replace(/^[-*]\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p
                      key={pIdx}
                      onClick={() => toggleBlockHighlight(pIdx)}
                      className={`leading-relaxed my-2 ${hlClass} ${interactiveClass}`}
                    >
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {/* ============================================================= */}
              {/* PHẦN ĐẶC BIỆT: BÀI TẬP MINH HỌA & CÂU HỎI TƯƠNG TÁC TẠI LỚP */}
              {/* ============================================================= */}
              {linkedQuestions.length > 0 && (
                <div className="mt-10 pt-6 border-t-2 border-dashed border-current/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold uppercase text-blue-900 dark:text-cyan-300">
                        IV. BÀI TẬP MINH HỌA & CÂU HỎI TƯƠNG TÁC TẠI LỚP ({linkedQuestions.length} câu)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Giáo viên có thể chiếu từng câu, bấm nút "Ẩn/Hiện đáp án" khi gọi học sinh trả lời
                      </p>
                    </div>

                    <button
                      onClick={() => toggleAllAnswers(Object.values(showAnswersMap).some(Boolean) ? false : true)}
                      className="self-start sm:self-auto text-xs px-2.5 py-1 rounded bg-current/10 hover:bg-current/20 font-semibold cursor-pointer transition-colors"
                    >
                      {Object.values(showAnswersMap).some(Boolean) ? 'Ẩn tất cả đáp án' : 'Hiện tất cả đáp án'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {linkedQuestions.map((q, idx) => {
                      const isAnswerVisible = Boolean(showAnswersMap[q.id]);
                      const isMcq = q.type !== 'essay';

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl border border-current/20 bg-current/[0.02] space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-cyan-600 dark:text-cyan-400">
                                Câu {idx + 1}:
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-current/10">
                                {isMcq ? 'Trắc nghiệm' : 'Tự luận'}
                              </span>
                              <span className="text-[11px] opacity-70">
                                ({q.points || (isMcq ? 0.5 : 1.5)} điểm)
                              </span>
                            </div>

                            {/* Show/Hide single answer */}
                            <button
                              onClick={() => toggleQuestionAnswer(q.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 transition-colors cursor-pointer"
                            >
                              {isAnswerVisible ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Ẩn lời giải</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Hiện lời giải</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Nội dung câu hỏi */}
                          <div className="font-medium text-sm leading-relaxed whitespace-pre-line">
                            {q.content}
                          </div>

                          {/* Phương án trắc nghiệm nếu có */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                              {q.options.map(opt => {
                                const isCorrectOpt =
                                  isAnswerVisible &&
                                  (q.correctAnswer === opt.id ||
                                    (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id)));

                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-lg border transition-all ${
                                      isCorrectOpt
                                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                                        : 'border-current/10 bg-current/[0.01]'
                                    }`}
                                  >
                                    <span className="font-bold mr-1.5">{opt.id}.</span>
                                    <span>{opt.text}</span>
                                    {isCorrectOpt && (
                                      <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400">
                                        (Đáp án đúng)
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Lời giải chi tiết / Rubric khi được mở */}
                          {isAnswerVisible && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 text-xs space-y-1 animate-in fade-in">
                              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Đáp án & Lời giải hướng dẫn:</span>
                              </div>
                              <div className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                                {q.explanation ||
                                  (q as any).rubricGuide ||
                                  `Đáp án đúng: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}`}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CHỮ KÝ PHÊ DUYỆT CHUẨN GIÁO ÁN */}
              <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-current/20 text-center text-xs sm:text-sm">
                <div>
                  <div className="font-bold uppercase tracking-wider">TỔ TRƯỞNG CHUYÊN MÔN</div>
                  <div className="italic text-xs text-slate-500 dark:text-slate-400 mt-0.5">(Ký và duyệt)</div>
                  <div className="h-16 flex items-center justify-center font-serif italic text-cyan-600 dark:text-cyan-400">
                    Đã duyệt chuyên môn
                  </div>
                  <div className="font-semibold">Thầy Hoàng Hải Nam</div>
                </div>

                <div>
                  <div className="italic text-xs text-slate-500 dark:text-slate-400">
                    Hà Nội, ngày 24 tháng 02 năm 2025
                  </div>
                  <div className="font-bold uppercase tracking-wider mt-0.5">GIÁO VIÊN SOẠN GIẢNG</div>
                  <div className="italic text-xs text-slate-500 dark:text-slate-400">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-center justify-center font-serif italic text-cyan-600 dark:text-cyan-400">
                    Lê Thu Hà
                  </div>
                  <div className="font-semibold">{topic.createdByName || 'Cô Lê Thu Hà'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. MODAL XÁC NHẬN TẢI LÊN NỘI DUNG TỪ FILE (.docx, .doc, .txt) */}
      {/* =================================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#041628] rounded-2xl border border-[#0e3d54] shadow-2xl max-w-xl w-full p-6 text-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#0e3d54] pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <Upload className="w-5 h-5" />
                <span>Nạp Nội Dung Từ Tệp: {uploadedFileName}</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800 text-slate-300">
                Đã trích xuất thành công <strong>{uploadedFileText.length} ký tự</strong> từ tệp.
                Vui lòng chọn cách áp dụng nội dung vào giáo án hiện tại:
              </div>

              {/* Mode selection */}
              <div className="grid grid-cols-2 gap-3">
                <label
                  onClick={() => setUploadMode('replace')}
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    uploadMode === 'replace'
                      ? 'bg-cyan-950/80 border-cyan-400 text-white'
                      : 'bg-[#03172c] border-[#0e3d54] text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm text-cyan-300">Thay thế toàn bộ</span>
                  <span className="text-[11px]">Xóa nội dung cũ và thay bằng nội dung tệp này</span>
                </label>

                <label
                  onClick={() => setUploadMode('append')}
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    uploadMode === 'append'
                      ? 'bg-cyan-950/80 border-cyan-400 text-white'
                      : 'bg-[#03172c] border-[#0e3d54] text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm text-emerald-300">Nối tiếp vào sau</span>
                  <span className="text-[11px]">Giữ nội dung cũ và bổ sung nội dung tệp vào cuối</span>
                </label>
              </div>

              {/* Preview extracted text */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Xem trước nội dung trích xuất:
                </label>
                <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-[#020d18] border border-[#0e3d54] text-slate-300 font-mono text-[11px] whitespace-pre-line">
                  {uploadedFileText.slice(0, 800)}
                  {uploadedFileText.length > 800 && '... [Và các đoạn văn tiếp theo]'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmUpload}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Áp Dụng Vào Giáo Án</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN ÁP DỤNG MẪU CV 5512 (IFRAME-SAFE) */}
      {isConfirmTemplateOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#041628] rounded-2xl border border-[#0e3d54] shadow-2xl max-w-md w-full p-5 text-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              <span>Áp dụng mẫu giáo án chuẩn Công văn 5512?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nội dung hiện tại sẽ được thay thế bằng khung giáo án chuẩn Công văn 5512 của Bộ GD&ĐT cho chủ đề <strong className="text-white">"{topicTitle}"</strong>.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0e3d54]">
              <button
                type="button"
                onClick={() => setIsConfirmTemplateOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmApplyTemplate5512}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Áp dụng mẫu CV 5512
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
