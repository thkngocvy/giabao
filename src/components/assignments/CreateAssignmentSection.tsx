import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Calendar,
  Clock,
  Sparkles,
  Paperclip,
  X,
  AlertCircle,
  Copy,
  CheckCircle2,
  FileCheck,
  Send,
  HelpCircle,
  Tag,
  Check
} from 'lucide-react';
import { db } from '../../services/db';
import { Classroom, Assignment, AssignmentTopic } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface CreateAssignmentSectionProps {
  onSuccess: (newAssignment: Assignment) => void;
  prefilledTopic?: string;
  prefilledSubject?: string;
  onClearPrefilledTopic?: () => void;
}

export const CreateAssignmentSection: React.FC<CreateAssignmentSectionProps> = ({
  onSuccess,
  prefilledTopic,
  prefilledSubject,
  onClearPrefilledTopic
}) => {
  const { currentUser, activeClassId } = useAuth();
  const { showToast } = useToast();

  const classes = db.getClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId || classes[0]?.id || 'class_10a1');

  // Form fields
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState(prefilledTopic || '');
  const [subjectName, setSubjectName] = useState(prefilledSubject || 'Toán học');
  const [points, setPoints] = useState(10);
  const [description, setDescription] = useState('');

  // Update when prefilledTopic changes from Part 1
  useEffect(() => {
    if (prefilledTopic) {
      setTopic(prefilledTopic);
    }
    if (prefilledSubject) {
      setSubjectName(prefilledSubject);
    }
  }, [prefilledTopic, prefilledSubject]);

  // a) Đưa file add bằng pdf, docx... HOẶC thêm bằng copy + paste
  const [contentMode, setContentMode] = useState<'file' | 'text' | 'both'>('file');
  const [pastedContent, setPastedContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  } | null>(null);

  // c) Thời gian nộp bài, cho trễ mấy ngày tùy ý
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 3);
  defaultDueDate.setHours(23, 59, 0, 0);
  const [dueDateString, setDueDateString] = useState(defaultDueDate.toISOString().slice(0, 16));

  const [allowLateMode, setAllowLateMode] = useState<string>('2'); // 0, 1, 2, 3, 5, 7, custom
  const [customLateDays, setCustomLateDays] = useState<number>(3);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsCount = selectedClass?.studentCount || db.getStudents(selectedClassId).length || 32;

  // Managed topics from Part 1
  const availableTopics = db.getTopics(subjectName);

  // File drop/upload simulation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          size: sizeStr,
          type: ext,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateAttachFile = (presetType: 'pdf' | 'docx') => {
    if (presetType === 'pdf') {
      setAttachedFile({
        name: `Phieu_BTVN_${subjectName.replace(/\s+/g, '_')}_Lop${selectedClass?.name || '9A1'}.pdf`,
        size: '1.4 MB',
        type: 'pdf',
        dataUrl: '#',
      });
    } else {
      setAttachedFile({
        name: `De_Bai_Tap_${subjectName.replace(/\s+/g, '_')}_ChuyenDe.docx`,
        size: '890 KB',
        type: 'docx',
        dataUrl: '#',
      });
    }
    showToast(`Đã đính kèm tệp mẫu ${presetType.toUpperCase()} thành công!`, 'info');
  };

  const handleApplySamplePrompt = (subject: string) => {
    if (subject === 'Toán') {
      setTitle('Chuyên đề: Phương trình bậc hai & Định lý Vi-ét ứng dụng');
      setTopic('Hệ thức Vi-ét & Phương trình bậc hai');
      setSubjectName('Toán học');
      setDescription('Học sinh làm các bài tập sau vào vở hoặc phiếu in đính kèm, trình bày rõ từng bước giải.');
      setPastedContent(
`BÀI TẬP VỀ NHÀ MÔN TOÁN HỌC - LỚP ${selectedClass?.name || '9A1'}
Chủ đề: Hệ thức Vi-ét và các bài toán liên quan

Bài 1 (3.0 điểm): Cho phương trình: x² - 2(m + 1)x + m² + 2 = 0 (1)
a) Giải phương trình khi m = 1.
b) Tìm giá trị của m để phương trình (1) có hai nghiệm phân biệt x₁, x₂ thỏa mãn: x₁² + x₂² = 12.

Bài 2 (3.0 điểm): Không giải phương trình, hãy tính tổng và tích các nghiệm của phương trình 3x² - 8x + 2 = 0. Sau đó lập phương trình bậc hai có hai nghiệm là 1/x₁ và 1/x₂.

Bài 3 (4.0 điểm - Vận dụng thực tế): Một khu vườn hình chữ nhật có chu vi 56m. Nếu tăng chiều rộng thêm 4m và giảm chiều dài 4m thì diện tích tăng thêm 8m². Tính chiều dài và chiều rộng ban đầu của mảnh vườn.`);
      setContentMode('both');
      handleSimulateAttachFile('pdf');
    } else if (subject === 'Anh') {
      setTitle('Unit 6: Viet Nam: Then and Now - Reading & Grammar Exercises');
      setTopic('Unit 6: Viet Nam: Then and Now - Grammar & Reading');
      setSubjectName('Tiếng Anh');
      setDescription('Complete vocabulary exercises and write a short paragraph (80-100 words).');
      setPastedContent(
`HOMEWORK - ENGLISH 9 - UNIT 6
Topic: Past Simple & Past Continuous / Life in the Past

Part 1: Complete the sentences with the correct form of the verbs in brackets:
1. When my mother was a child, she (not have) ________ a smartphone.
2. In the 1980s, children used to (play) ________ folk games instead of video games.
3. While we (walk) ________ around Hoan Kiem Lake yesterday, it suddenly started to rain.

Part 2: Writing (10 pts)
Write a short paragraph (80 - 100 words) describing changes in transport or school life in Ha Noi over the past 20 years.`);
      setContentMode('text');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài tập!', 'error');
      return;
    }

    const effectiveLateDays = allowLateMode === 'custom' ? customLateDays : parseInt(allowLateMode, 10);

    const newAsg = db.createAssignment({
      classId: selectedClassId,
      className: selectedClass?.name || '9A1',
      subjectId: `sub_${subjectName.toLowerCase()}`,
      subjectName,
      title: title.trim(),
      topic: topic.trim() || undefined,
      description: description.trim() || `Bài tập môn ${subjectName} lớp ${selectedClass?.name || '9A1'}`,
      content: pastedContent.trim() || undefined,
      fileName: attachedFile?.name,
      fileUrl: attachedFile?.dataUrl || '#',
      fileSize: attachedFile?.size,
      dueDate: new Date(dueDateString).toISOString(),
      allowLateDays: effectiveLateDays,
      points,
      status: 'published',
      createdByTeacherId: currentUser?.id || 'user_teacher_1',
      createdByTeacherName: currentUser?.fullName || 'Cô Lê Thu Hà',
      target: 'all',
      totalStudents: studentsCount,
    });

    onSuccess(newAsg);
    showToast(
      `🎉 Đã giao BTVN thành công cho toàn bộ ${studentsCount} học sinh và phụ huynh lớp ${selectedClass?.name || '9A1'}!`,
      'success'
    );

    // Reset inputs
    setTitle('');
    setDescription('');
    setPastedContent('');
    setAttachedFile(null);
    if (onClearPrefilledTopic) onClearPrefilledTopic();
  };

  return (
    <div id="create-assignment-section" className="hud-panel bg-[#0A1B2D]/90 backdrop-blur-xl rounded-2xl border border-[#00E5FF]/30 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#00E5FF]/20 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/35">
              PHẦN 2
            </span>
            <h3 className="text-base font-extrabold text-[#EAFBFF] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#00E5FF]" />
              <span>Tạo & Giao Bài Tập Về Nhà Cho Lớp Học</span>
            </h3>
          </div>
          <p className="text-xs text-[#8BA9BC] mt-1">
            Giao bài tập linh hoạt bằng tệp PDF/Word hoặc Copy-Paste. Tự động giao cho toàn bộ học sinh và đồng thời báo phụ huynh.
          </p>
        </div>

        {/* Quick Sample Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 hidden md:inline">Mẫu nhanh:</span>
          <button
            type="button"
            onClick={() => handleApplySamplePrompt('Toán')}
            className="px-2.5 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Mẫu Toán 9 (File PDF)
          </button>
          <button
            type="button"
            onClick={() => handleApplySamplePrompt('Anh')}
            className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Mẫu Tiếng Anh 9 (Text)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Row 1: Chọn lớp & Môn học & Thang điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Lớp giáo viên đang dạy *
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-bold focus:border-cyan-400"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} ({c.studentCount} học sinh)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Môn học *
            </label>
            <select
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-bold focus:border-cyan-400"
            >
              <option value="Toán học">Toán học</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Vật lý">Vật lý</option>
              <option value="Hóa học">Hóa học</option>
              <option value="Sinh học">Sinh học</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Địa lý">Địa lý</option>
              <option value="Tin học">Tin học</option>
              <option value="Giáo dục công dân">GDCD</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Thang điểm đánh giá
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={points}
              onChange={e => setPoints(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-cyan-300 font-bold focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Row 2: Tiêu đề bài tập */}
        <div>
          <label className="block font-semibold text-slate-200 mb-1">
            Tiêu đề bài tập về nhà *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Chuyên đề: Phương trình bậc hai & Định lý Vi-ét ứng dụng"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-medium focus:border-cyan-400 text-xs"
          />
        </div>

        {/* b) Phần nói về chủ đề giao BTVN (Không bắt buộc) */}
        <div className="p-3 bg-[#03172c] border border-[#0e3d54] rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block font-semibold text-cyan-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              b) Chủ đề / Chuyên đề giao BTVN <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
            </label>
            {prefilledTopic && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Đã chọn từ Quản lý chủ đề
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nhập tên chủ đề hoặc chọn nhanh bên cạnh..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white focus:border-cyan-400 text-xs"
            />

            {/* Quick dropdown from managed topics in Part 1 */}
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-cyan-300 font-medium focus:border-cyan-400 text-xs"
            >
              <option value="">-- Chọn nhanh từ kho chủ đề Phần 1 --</option>
              {availableTopics.map(t => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* a) Màn hình đưa file add bằng pdf, docx... HOẶC thêm bằng copy + paste */}
        <div className="border border-[#0e3d54] rounded-xl p-3.5 bg-[#031526] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0e3d54] pb-2.5">
            <div>
              <span className="font-bold text-white text-xs block">
                a) Phương thức đưa nội dung bài tập cho học sinh
              </span>
              <span className="text-[11px] text-slate-400">
                Cô giáo có thể đính kèm file (PDF, DOCX...), dán đề bài copy+paste, hoặc kết hợp cả hai
              </span>
            </div>

            <div className="flex items-center bg-[#020e1a] p-1 rounded-lg border border-[#0e3d54] shrink-0">
              <button
                type="button"
                onClick={() => setContentMode('file')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  contentMode === 'file'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đính kèm Tệp (PDF/Word)
              </button>
              <button
                type="button"
                onClick={() => setContentMode('text')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  contentMode === 'text'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nhập / Copy + Paste
              </button>
              <button
                type="button"
                onClick={() => setContentMode('both')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  contentMode === 'both'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cả File + Dán đề
              </button>
            </div>
          </div>

          {/* Tab 1: Đính kèm file */}
          {(contentMode === 'file' || contentMode === 'both') && (
            <div className="space-y-2">
              <label className="block font-semibold text-slate-200">
                Tệp đề bài đính kèm (PDF, DOCX, DOC, XLSX, Hình ảnh...)
              </label>

              {attachedFile ? (
                <div className="p-3 bg-[#041d36] border border-cyan-500/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-300 border border-cyan-700/50">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{attachedFile.name}</div>
                      <div className="text-[11px] text-cyan-300 mt-0.5">
                        Kích thước: {attachedFile.size} · Định dạng: {attachedFile.type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Xóa tệp đính kèm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#0e3d54] hover:border-cyan-400/70 rounded-xl p-4 text-center transition-all bg-[#020e1a]/80">
                  <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-slate-200 font-semibold mb-1">
                    Kéo & thả hoặc bấm để tải lên file đề bài (PDF, DOCX...)
                  </p>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Hỗ trợ tệp .pdf, .docx, .doc, .xlsx, .png, .jpg (Tối đa 25MB)
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <label className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-xs">
                      <span>Chọn file từ máy tính</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSimulateAttachFile('pdf')}
                      className="px-2.5 py-1.5 bg-[#041d36] hover:bg-[#062c52] text-cyan-300 border border-cyan-800 rounded-lg font-semibold cursor-pointer transition-colors"
                    >
                      + File mẫu PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAttachFile('docx')}
                      className="px-2.5 py-1.5 bg-[#041d36] hover:bg-[#062c52] text-cyan-300 border border-cyan-800 rounded-lg font-semibold cursor-pointer transition-colors"
                    >
                      + File mẫu Word (.docx)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Thêm bằng Copy + Paste */}
          {(contentMode === 'text' || contentMode === 'both') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-200">
                  Nội dung đề bài (Nhập văn bản hoặc Copy + Paste)
                </label>
                <span className="text-[10px] text-slate-400">
                  Học sinh có thể xem trực tiếp và bấm nút sao chép đề bài
                </span>
              </div>
              <textarea
                rows={contentMode === 'both' ? 3 : 5}
                value={pastedContent}
                onChange={e => setPastedContent(e.target.value)}
                placeholder="Dán nội dung các câu hỏi, bài tập 1, bài tập 2, bài tập 3... hoặc các yêu cầu hướng dẫn học sinh làm bài tại đây..."
                className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-mono text-xs focus:border-cyan-400"
              />
            </div>
          )}

          {/* Ghi chú dặn dò */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Ghi chú & Lời dặn dò của giáo viên (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Các em làm cẩn thận ra vở ghi bài, nộp đúng hạn trước 23:59 nhé!"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white text-xs focus:border-cyan-400"
            />
          </div>
        </div>

        {/* c) Thời gian nộp bài, cho trễ mấy ngày tùy ý */}
        <div className="p-3.5 bg-[#03172c] border border-cyan-700/40 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-white text-xs">
              c) Thời hạn nộp bài & Cho phép nộp trễ tùy ý (Gia hạn)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Hạn chót nộp bài (Ngày & Giờ) *
              </label>
              <input
                type="datetime-local"
                required
                value={dueDateString}
                onChange={e => setDueDateString(e.target.value)}
                className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-cyan-300 font-bold focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Cho phép nộp trễ mấy ngày tùy ý
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={allowLateMode}
                  onChange={e => setAllowLateMode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white font-bold focus:border-cyan-400"
                >
                  <option value="0">Không cho phép trễ (Khóa ngay khi hết hạn)</option>
                  <option value="1">Cho trễ 1 ngày</option>
                  <option value="2">Cho trễ 2 ngày (Khuyên dùng)</option>
                  <option value="3">Cho trễ 3 ngày</option>
                  <option value="5">Cho trễ 5 ngày</option>
                  <option value="7">Cho trễ 7 ngày (1 tuần)</option>
                  <option value="custom">Tự nhập số ngày tùy ý...</option>
                </select>

                {allowLateMode === 'custom' && (
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={customLateDays}
                      onChange={e => setCustomLateDays(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-cyan-300 font-bold text-center"
                    />
                    <span className="text-slate-400 text-xs">ngày</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Banner tự động gửi học sinh & phụ huynh */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-300 block">Quy trình tự động khi nhấn Giao bài:</span>
            <span>
              1. BTVN sẽ tự động giao hết cho <strong>toàn bộ {studentsCount} học sinh</strong> trong lớp {selectedClass?.name || '9A1'}.<br />
              2. Đồng thời tự động gửi thông báo cho <strong>tất cả phụ huynh</strong> có con trong lớp để phụ huynh nhắc nhở học sinh làm bài.
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 font-extrabold text-[#030B16] bg-gradient-to-r from-[#00E5FF] to-[#087CFF] hover:brightness-110 active:scale-[0.98] rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.35)] flex items-center justify-center gap-2 cursor-pointer text-xs transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Giao bài tập cho cả lớp ({studentsCount} HS) & Gửi thông báo Phụ huynh</span>
          </button>
        </div>
      </form>
    </div>
  );
};
