import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { db } from '../../services/db';
import { AssignmentTopic, Assignment } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../common/Modal';

interface TopicManagementSectionProps {
  onSelectTopicForAssignment: (topicName: string, subjectName: string) => void;
  onFilterByTopic: (topicName: string | null) => void;
  selectedFilterTopic: string | null;
}

export const TopicManagementSection: React.FC<TopicManagementSectionProps> = ({
  onSelectTopicForAssignment,
  onFilterByTopic,
  selectedFilterTopic
}) => {
  const { showToast } = useToast();
  const [topics, setTopics] = useState<AssignmentTopic[]>(() => db.getTopics());
  const [assignments, setAssignments] = useState<Assignment[]>(() => db.getAssignments());
  const [subjectFilter, setSubjectFilter] = useState<string>('Tất cả môn');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal create/edit topic
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<AssignmentTopic | null>(null);

  const [topicName, setTopicName] = useState('');
  const [subjectName, setSubjectName] = useState('Toán học');
  const [gradeLevel, setGradeLevel] = useState<number>(9);
  const [description, setDescription] = useState('');
  const [topicColor, setTopicColor] = useState('#06b6d4');

  const reload = () => {
    setTopics(db.getTopics());
    setAssignments(db.getAssignments());
  };

  const handleOpenCreateModal = () => {
    setEditingTopic(null);
    setTopicName('');
    setSubjectName('Toán học');
    setGradeLevel(9);
    setDescription('');
    setTopicColor('#06b6d4');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: AssignmentTopic) => {
    setEditingTopic(t);
    setTopicName(t.name);
    setSubjectName(t.subjectName);
    setGradeLevel(t.gradeLevel || 9);
    setDescription(t.description || '');
    setTopicColor(t.color || '#06b6d4');
    setIsModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) {
      showToast('Vui lòng nhập tên chủ đề!', 'error');
      return;
    }

    if (editingTopic) {
      db.updateTopic(editingTopic.id, {
        name: topicName.trim(),
        subjectName,
        gradeLevel,
        description: description.trim(),
        color: topicColor,
      });
      showToast(`Đã cập nhật chủ đề "${topicName}" thành công!`, 'success');
    } else {
      db.createTopic({
        name: topicName.trim(),
        subjectName,
        gradeLevel,
        description: description.trim(),
        color: topicColor,
      });
      showToast(`Đã thêm chủ đề mới "${topicName}" thành công!`, 'success');
    }

    setIsModalOpen(false);
    reload();
  };

  const handleDeleteTopic = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${name}"?`)) {
      db.deleteTopic(id);
      showToast(`Đã xóa chủ đề "${name}".`, 'info');
      reload();
    }
  };

  // Filter topics
  const filteredTopics = topics.filter(t => {
    if (subjectFilter !== 'Tất cả môn' && t.subjectName !== subjectFilter) {
      return false;
    }
    if (searchTerm.trim() && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const subjects = ['Tất cả môn', 'Toán học', 'Tiếng Anh', 'Ngữ văn', 'Vật lý', 'Hóa học', 'Sinh học', 'Tin học'];
  const colors = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

  return (
    <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#0e3d54] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              PHẦN 1
            </span>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Quản Lý Chủ Đề Bài Tập Về Nhà</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý kho chuyên đề theo môn học, gán bài tập nhanh và theo dõi tiến độ hoàn thành theo từng chủ đề
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-950 flex items-center gap-1.5 cursor-pointer transition-all border border-cyan-400/40 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm chủ đề mới</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Subject pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-horizontal-scrollbar">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer transition-colors ${
                subjectFilter === s
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-[#03172c] text-slate-300 hover:text-white border border-[#0e3d54]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm chủ đề..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#020e1a] border border-[#0e3d54] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-400 focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredTopics.map(top => {
          // Count assignments under this topic
          const matchingAsgs = assignments.filter(
            a => a.topic && a.topic.toLowerCase().includes(top.name.toLowerCase().slice(0, 15))
          );
          const asgCount = matchingAsgs.length;
          const totalSubs = matchingAsgs.reduce((sum, a) => sum + db.getAssignmentStats(a).submittedCount, 0);
          const totalExpected = matchingAsgs.reduce((sum, a) => sum + db.getAssignmentStats(a).totalRecipients, 0);
          const completionRate = totalExpected > 0 ? Math.round((totalSubs / totalExpected) * 100) : 0;

          const isSelectedFilter = selectedFilterTopic === top.name;

          return (
            <div
              key={top.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 text-xs ${
                isSelectedFilter
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-sm shadow-cyan-950'
                  : 'bg-[#03172c] border-[#0e3d54] hover:border-cyan-600/60'
              }`}
            >
              <div className="space-y-2">
                {/* Tag & Subject */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: `${top.color || '#06b6d4'}33`, border: `1px solid ${top.color || '#06b6d4'}` }}
                  >
                    {top.subjectName} · Khối {top.gradeLevel || 9}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(top)}
                      className="p-1 text-slate-400 hover:text-cyan-300 rounded cursor-pointer transition-colors"
                      title="Sửa chủ đề"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(top.id, top.name)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer transition-colors"
                      title="Xóa chủ đề"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topic Name */}
                <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug">
                  {top.name}
                </h4>

                {/* Description */}
                {top.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {top.description}
                  </p>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="pt-2.5 border-t border-[#0e3d54]/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span>Bài tập đã giao: <strong className="text-white">{asgCount}</strong></span>
                  </span>
                  {asgCount > 0 && (
                    <span className="text-emerald-400 font-semibold">
                      Hoàn thành: {completionRate}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {/* Action 1: Giao bài tập cho chủ đề này */}
                  <button
                    onClick={() => onSelectTopicForAssignment(top.name, top.subjectName)}
                    className="flex-1 px-2.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors border border-cyan-400/40"
                    title="Điền chủ đề này vào Form tạo bài tập"
                  >
                    <span>Giao bài chủ đề này</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {/* Action 2: Lọc danh sách bài tập theo chủ đề này */}
                  <button
                    onClick={() => onFilterByTopic(isSelectedFilter ? null : top.name)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] border cursor-pointer transition-colors ${
                      isSelectedFilter
                        ? 'bg-cyan-900 text-cyan-200 border-cyan-400'
                        : 'bg-[#020e1a] hover:bg-[#041d36] text-slate-300 border-[#0e3d54]'
                    }`}
                    title="Lọc các bài tập đã giao ở Phần 3 theo chủ đề này"
                  >
                    {isSelectedFilter ? 'Đang lọc' : 'Lọc BTVN'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-[#0e3d54] rounded-xl space-y-2">
          <BookOpen className="w-6 h-6 text-slate-500 mx-auto" />
          <p>Không tìm thấy chủ đề nào phù hợp.</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-3 py-1.5 bg-[#0284c7] text-white rounded-lg font-semibold cursor-pointer"
          >
            + Tạo chủ đề mới
          </button>
        </div>
      )}

      {/* Modal Add / Edit Topic */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTopic ? 'Chỉnh sửa chủ đề BTVN' : 'Thêm chủ đề BTVN mới'}
          subtitle="Chủ đề giúp phân loại các bài tập theo chuyên đề bài học và bài kiểm tra"
          maxWidth="md"
        >
          <form onSubmit={handleSaveTopic} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Tên chủ đề / Chuyên đề *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Hệ thức Vi-ét & Ứng dụng thực tế"
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
                className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white focus:border-cyan-400 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Môn học *
                </label>
                <select
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white focus:border-cyan-400 text-xs font-bold"
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
                  Khối lớp
                </label>
                <select
                  value={gradeLevel}
                  onChange={e => setGradeLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white focus:border-cyan-400 text-xs font-bold"
                >
                  <option value={6}>Khối 6</option>
                  <option value={7}>Khối 7</option>
                  <option value={8}>Khối 8</option>
                  <option value={9}>Khối 9 (THCS Trưng Vương)</option>
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Mô tả trọng tâm kiến thức & lưu ý
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Rèn kỹ năng tính tổng tích Vi-ét, tìm m để phương trình có hai nghiệm cùng dấu..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-[#0e3d54] rounded-lg bg-[#020e1a] text-white focus:border-cyan-400 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                Màu sắc nhãn chủ đề
              </label>
              <div className="flex items-center gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTopicColor(c)}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      topicColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#0e3d54] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-300 hover:bg-[#06203a] rounded-lg border border-[#0e3d54] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-lg shadow-xs cursor-pointer border border-cyan-500/40"
              >
                {editingTopic ? 'Lưu thay đổi' : 'Thêm chủ đề'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
