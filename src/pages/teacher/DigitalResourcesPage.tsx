import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Video,
  Presentation,
  BookOpen,
  Pin,
  Eye,
  Trash2,
  Share2,
  HardDrive,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { db } from '../../services/db';
import { LearningResource } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export const DigitalResourcesPage: React.FC = () => {
  const { showToast } = useToast();

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Modal Upload Resource
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Toán học');
  const [newGrade, setNewGrade] = useState(9);
  const [newUnit, setNewUnit] = useState('');
  const [newType, setNewType] = useState<'pdf' | 'video' | 'pptx' | 'docx'>('pdf');

  useEffect(() => {
    const loadData = () => {
      setResources(db.getResources());
    };
    loadData();
    return db.subscribe(loadData);
  }, []);

  const handleUploadResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề tài liệu!', 'warning');
      return;
    }

    db.addResource({
      title: newTitle.trim(),
      type: newType,
      gradeLevel: Number(newGrade),
      subjectName: newSubject,
      unit: newUnit.trim() || 'Học kỳ 2',
      fileUrl: '#',
      fileSize: '4.2 MB',
      uploadedBy: 'Cô Lê Thu Hà',
      isPinned: false,
    });

    showToast('Đã tải lên tài liệu số mới thành công!', 'success');
    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewUnit('');
  };

  const handleDelete = (id: string, title: string) => {
    db.deleteResource(id);
    showToast(`Đã xóa tài liệu: ${title}`, 'info');
  };

  const filteredResources = resources.filter(res => {
    const matchSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGrade = selectedGrade === 'all' || res.gradeLevel === selectedGrade;
    const matchType = selectedType === 'all' || res.type === selectedType;
    const matchSubject = selectedSubject === 'all' || res.subjectName === selectedSubject;
    return matchSearch && matchGrade && matchType && matchSubject;
  });

  const getFormatIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'pptx':
        return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-cyan-400" />;
    }
  };

  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Tin học'];

  return (
    <div className="space-y-5 text-slate-100">
      <PageHeader
        breadcrumbItems={[
          { label: 'Dạy và Học' },
          { label: 'Tài liệu số' },
        ]}
        title="Kho Tài Liệu Số & Học Liệu Điện Tử"
        subtitle="Hệ thống lưu trữ bài giảng, chuyên đề, giáo án điện tử và ngân hàng đề thi trường THCS Trưng Vương"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer border border-cyan-500/40"
            >
              <Plus className="w-4 h-4" />
              <span>Tải lên tài liệu mới</span>
            </button>
          </div>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng tài liệu số</div>
          <div className="text-xl font-extrabold text-white mt-1 tabular-nums">{resources.length} tệp</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Sẵn sàng tải về & chia sẻ</div>
        </div>
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Tài liệu ghim trọng tâm</div>
          <div className="text-xl font-extrabold text-amber-400 mt-1 tabular-nums">
            {resources.filter(r => r.isPinned).length} tài liệu
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ưu tiên ôn thi & giảng dạy</div>
        </div>
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Lượt tải về</div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1 tabular-nums">
            {resources.reduce((acc, cur) => acc + (cur.downloadCount || 0), 0)} lượt
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Phục vụ học sinh & GV</div>
        </div>
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Dung lượng sử dụng</div>
          <div className="text-xl font-extrabold text-purple-400 mt-1 tabular-nums">1.2 GB / 50 GB</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đám mây trường học</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#041527] p-3.5 sm:p-4 rounded-xl border border-[#0e3d54] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tài liệu, bài giảng, chuyên đề, chuyên đề ôn tập..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#020e1a] border border-[#0e3d54] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="bg-[#020e1a] border border-[#0e3d54] text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#020e1a] border border-[#0e3d54] text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Tất cả khối lớp</option>
              <option value={6}>Khối 6</option>
              <option value={7}>Khối 7</option>
              <option value={8}>Khối 8</option>
              <option value={9}>Khối 9</option>
            </select>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-[#020e1a] border border-[#0e3d54] text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="pdf">Tài liệu PDF</option>
              <option value="pptx">Slide PowerPoint (PPTX)</option>
              <option value="video">Bài giảng Video</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(res => (
          <div
            key={res.id}
            className="bg-[#041527] rounded-xl border border-[#0e3d54] p-4.5 hover:border-cyan-400/80 hover:shadow-lg hover:shadow-cyan-950/30 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#020e1a] border border-[#0e3d54] flex items-center justify-center shrink-0">
                    {getFormatIcon(res.type)}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                      {res.subjectName} · Khối {res.gradeLevel}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 mt-0.5 leading-snug">
                      {res.title}
                    </h4>
                  </div>
                </div>

                {res.isPinned && (
                  <span className="p-1 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800 shrink-0" title="Tài liệu ghim trọng tâm">
                    <Pin className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="mt-3 text-xs text-slate-400 space-y-1">
                <div className="line-clamp-1">{res.unit}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Dung lượng: <strong className="text-slate-300 font-mono">{res.fileSize}</strong></span>
                  <span>{res.downloadCount || 0} lượt tải</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#0e3d54] flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Đăng bởi: {res.uploadedBy}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => showToast(`Bắt đầu tải về: ${res.title}`, 'success')}
                  className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-cyan-500/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về</span>
                </button>
                <button
                  onClick={() => handleDelete(res.id, res.title)}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Tải lên tài liệu số mới"
        maxWidth="md"
      >
        <form onSubmit={handleUploadResource} className="space-y-4 text-xs text-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Tiêu đề tài liệu *</label>
            <input
              type="text"
              placeholder="VD: Đề cương ôn tập HK2, Chuyên đề phương trình..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Môn học</label>
              <select
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Khối lớp</label>
              <select
                value={newGrade}
                onChange={e => setNewGrade(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white"
              >
                <option value={6}>Khối 6</option>
                <option value={7}>Khối 7</option>
                <option value={8}>Khối 8</option>
                <option value={9}>Khối 9</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Định dạng tệp</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white"
              >
                <option value="pdf">Tài liệu PDF (.pdf)</option>
                <option value="pptx">Bài giảng PowerPoint (.pptx)</option>
                <option value="video">Video bài giảng (.mp4)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Chương / Chuyên đề</label>
              <input
                type="text"
                placeholder="VD: Chương 3: Góc với đường tròn"
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#020e1a] border border-[#0e3d54] text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-dashed border-[#0e3d54] bg-[#020e1a] text-center">
            <FolderOpen className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
            <div className="font-semibold text-slate-200">Chọn tệp từ máy tính để tải lên</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Dung lượng tối đa: 100 MB</p>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#0e3d54]">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold cursor-pointer"
            >
              Lưu tài liệu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
