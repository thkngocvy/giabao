import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  FileText,
  Award,
  MessageSquare,
  Send,
  Calendar,
  Clock,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Download,
  Copy,
  Check,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { db } from '../../services/db';
import { Student, ChatMessage, AttendanceSession, Assignment, AppNotification } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const ParentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const students = db.getStudents();
  const [selectedStudent, setSelectedStudent] = useState<Student>(students[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [viewingAsg, setViewingAsg] = useState<Assignment | null>(null);

  const loadData = () => {
    db.checkAndTriggerOverdueReminders();
    if (selectedStudent) {
      setMessages(db.getMessages(currentUser?.id || 'user_parent_1', 'user_teacher_1'));
      // Only visible assignments for this child (excludes draft, scheduled, withdrawn, non-targeted)
      const asgs = db.getVisibleAssignmentsForStudent(selectedStudent.id, selectedStudent.classId);
      setAssignments(asgs);

      // Get notifications for parent of this student
      const notifs = db.getNotifications('PARENT', selectedStudent.id, selectedStudent.classId);
      setNotifications(notifs);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = db.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [selectedStudent, currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = db.sendMessage({
      senderId: currentUser?.id || 'user_parent_1',
      senderName: currentUser?.fullName || 'Phạm Quốc Trung',
      senderRole: 'PARENT',
      receiverId: 'user_teacher_1',
      receiverName: 'Cô Lê Thu Hà',
      studentId: selectedStudent.id,
      studentName: selectedStudent.fullName,
      content: chatInput.trim(),
    });

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
    showToast('Đã gửi tin nhắn đến Giáo viên Chủ nhiệm!', 'success');
  };

  const handleDownloadTeacherFile = (asg: Assignment) => {
    const filename = asg.fileName || `De_Bai_${asg.subjectName}_${asg.className}.pdf`;
    const element = document.createElement('a');
    const fileContent = asg.content || `Nội dung đề bài: ${asg.title}\nMôn: ${asg.subjectName}\nLớp: ${asg.className}\nHạn nộp: ${asg.dueDate}`;
    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`Đang tải tệp đề bài "${filename}" về máy tính...`, 'info');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        breadcrumbItems={[
          { label: 'Cổng phụ huynh' },
          { label: `Học sinh: ${selectedStudent.fullName}` },
        ]}
        title="Cổng Thông Tin Phụ Huynh Học Sinh"
        subtitle="Theo dõi BTVN cô giáo giao, nhắc nhở con làm bài và liên lạc với Giáo viên Chủ nhiệm"
        action={
          <div className="flex items-center gap-2 p-1 bg-[#041527] border border-[#0e3d54] rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-400 pl-2">Chọn con:</span>
            <select
              value={selectedStudent.id}
              onChange={e => {
                const match = students.find(s => s.id === e.target.value);
                if (match) setSelectedStudent(match);
              }}
              className="px-2 py-1 text-xs font-bold text-cyan-300 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              {students.slice(0, 3).map(st => (
                <option key={st.id} value={st.id} className="bg-[#031526] text-white">
                  {st.fullName} (Lớp {st.className})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Child KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Chuyên cần tháng này</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
            {selectedStudent.attendanceRate}%
          </div>
          <span className="text-xs text-emerald-400 mt-0.5 block">Đầy đủ · Đúng giờ</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Điểm trung bình (ĐTB)</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1 tabular-nums">
            {selectedStudent.gpa} / 10
          </div>
          <span className="text-xs text-cyan-300 mt-0.5 block">Xếp loại Học lực Tốt</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Hạnh kiểm học kỳ 2</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {selectedStudent.conduct}
          </div>
          <span className="text-xs text-purple-300 mt-0.5 block">Xếp loại Tốt</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">BTVN cần theo dõi</span>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">
            {assignments.length} bài
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Lớp {selectedStudent.className}</span>
        </div>
      </div>

      {/* 2. Thông báo BTVN tự động gửi tới phụ huynh để nhắc nhở con */}
      {notifications.length > 0 && (
        <div className="p-4 bg-[#041527] border border-cyan-700/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#0e3d54] pb-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Thông báo BTVN & Nhắc nhở từ Giáo viên gửi tới Phụ huynh ({notifications.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Nhận tức thì khi cô giao bài hoặc gửi nhắc nhở đôn đốc con
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifications.slice(0, 4).map(notif => {
              const isReminder = notif.type === 'parent_homework_reminder';
              const isVerified = notif.type === 'submission_verified';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isReminder
                      ? 'bg-amber-950/40 border-amber-700/60'
                      : isVerified
                      ? 'bg-emerald-950/30 border-emerald-700/50'
                      : 'bg-[#03172c] border-[#0e3d54]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isReminder
                        ? 'bg-amber-900 text-amber-200 border border-amber-700'
                        : isVerified
                        ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {isReminder ? '🔔 Nhắc nhở BTVN' : isVerified ? '✓ Đã hoàn thành' : 'BTVN Mới'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs">{notif.title}</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{notif.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Homework for this student + Teacher Comments */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section: BTVN của con */}
          <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#0e3d54] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Bài tập về nhà của con {selectedStudent.fullName} ({assignments.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Lớp {selectedStudent.className} · THCS Trưng Vương
              </span>
            </div>

            <div className="space-y-3">
              {assignments.map(asg => {
                const subVis = db.getSubmissionVisibleToStudentOrParent(asg.id, selectedStudent.id);
                const sub = subVis?.submission;
                const isGradePublished = Boolean(subVis?.isGradePublished);
                const isVerified = sub?.isTeacherVerified || asg.completedStudentIds?.includes(selectedStudent.id);

                const effectiveDueIso = db.getStudentEffectiveDueDate(asg, selectedStudent.id);
                const hasCustomDue = Boolean(asg.recipientOverrides?.[selectedStudent.id]?.dueOverrideAt);
                const dueTime = new Date(effectiveDueIso).getTime();
                const nowTime = Date.now();
                const isPastDue = nowTime > dueTime;
                const graceMs = (asg.allowLateDays || 0) * 86400000;
                const isPastGrace = nowTime > dueTime + graceMs;

                return (
                  <div
                    key={asg.id}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      sub?.status === 'resubmit_required'
                        ? 'bg-amber-950/25 border-amber-600/70'
                        : isVerified
                        ? 'bg-emerald-950/20 border-emerald-700/60'
                        : isPastDue && !sub
                        ? 'bg-rose-950/20 border-rose-700/60'
                        : 'bg-[#03172c] border-[#0e3d54]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                          {asg.subjectName}
                        </span>
                        {asg.topic && (
                          <span className="font-semibold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800 text-[11px]">
                            Chủ đề: {asg.topic}
                          </span>
                        )}
                        <h4 className="font-bold text-white text-sm">{asg.title}</h4>
                      </div>

                      {/* Status */}
                      <div>
                        {sub?.status === 'resubmit_required' ? (
                          <span className="text-xs font-bold text-amber-300 bg-amber-950 border border-amber-600 px-2.5 py-0.5 rounded-full">
                            Cô yêu cầu con làm lại
                          </span>
                        ) : isGradePublished ? (
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã trả bài: {sub?.score}/{asg.points} điểm
                          </span>
                        ) : isVerified ? (
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cô giáo đã tick làm xong
                          </span>
                        ) : sub ? (
                          <span className="text-xs font-bold text-cyan-300 bg-cyan-950 border border-cyan-700 px-2.5 py-0.5 rounded-full">
                            Con đã nộp bài (Chờ cô trả bài)
                          </span>
                        ) : isPastGrace ? (
                          <span className="text-xs font-bold text-rose-300 bg-rose-950 border border-rose-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Quá hạn nộp! Cần nhắc con
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-700 px-2.5 py-0.5 rounded-full">
                            Con chưa nộp (Cần nhắc con)
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs">{asg.description}</p>

                    {isGradePublished && sub?.feedback && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/25 border border-emerald-700/40 text-[11px] text-emerald-200">
                        <strong>Nhận xét của cô giáo:</strong> {sub.feedback}
                      </div>
                    )}

                    {sub?.resubmitNote && (
                      <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-700/50 text-[11px] text-amber-200">
                        <strong>Lưu ý làm lại:</strong> {sub.resubmitNote}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#0e3d54]/70">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {hasCustomDue ? 'Hạn riêng của con:' : 'Hạn nộp:'}{' '}
                          <strong className="text-white">{new Date(effectiveDueIso).toLocaleString('vi-VN')}</strong>
                        </span>
                        {(asg.allowLateDays || 0) > 0 && (
                          <span className="text-amber-400 font-semibold">(Gia hạn trễ {asg.allowLateDays} ngày)</span>
                        )}
                      </div>

                      <button
                        onClick={() => setViewingAsg(asg)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline text-xs"
                      >
                        Xem chi tiết đề bài của cô
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher Comment Card */}
          <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#0e3d54]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Nhận xét của Giáo viên Chủ nhiệm</h3>
              </div>
              <span className="text-xs text-cyan-300">Cô Lê Thu Hà</span>
            </div>
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/60 text-xs leading-relaxed text-purple-200">
              &ldquo;Em {selectedStudent.fullName} có tinh thần tự giác cao, bài tập môn Toán luôn hoàn thành đúng hạn và rất tích cực giúp đỡ các bạn trong tổ. Gia đình tiếp tục động viên con giữ vững phong độ!&rdquo;
            </div>
          </div>
        </div>

        {/* Right Column: Direct Chat with Homeroom Teacher */}
        <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-xs flex flex-col justify-between h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#0e3d54]">
              <div>
                <h3 className="text-sm font-bold text-white">Trao đổi với GVCN</h3>
                <span className="text-xs text-cyan-400">Cô Lê Thu Hà (Lớp {selectedStudent.className})</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Đang trực tuyến" />
            </div>

            <div className="py-3 space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.senderRole === 'PARENT' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                      m.senderRole === 'PARENT'
                        ? 'bg-[#0284c7] text-white rounded-br-xs'
                        : 'bg-[#03172c] border border-[#0e3d54] text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 tabular-nums">
                    {new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="pt-2 border-t border-[#0e3d54] flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Nhắn tin đôn đốc con hoặc hỏi cô giáo..."
              className="flex-1 px-3 py-2 border border-[#0e3d54] rounded-lg text-xs text-white bg-[#020e1a] focus:border-cyan-400"
            />
            <button
              type="submit"
              className="p-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal xem đề bài của cô */}
      {viewingAsg && (
        <Modal
          isOpen={!!viewingAsg}
          onClose={() => setViewingAsg(null)}
          title={`Đề bài tập: ${viewingAsg.title}`}
          subtitle={`Môn ${viewingAsg.subjectName} · Lớp ${viewingAsg.className}`}
          maxWidth="lg"
        >
          <div className="space-y-3.5 text-xs">
            {viewingAsg.topic && (
              <div className="p-2.5 bg-[#03172c] border border-[#0e3d54] rounded-lg">
                <span className="text-slate-400 text-[11px]">Chủ đề bài học:</span>{' '}
                <strong className="text-cyan-300">{viewingAsg.topic}</strong>
              </div>
            )}

            <div className="p-3 bg-[#020e1a] border border-[#0e3d54] rounded-lg font-mono text-[11px] text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
              {viewingAsg.content || viewingAsg.description}
            </div>

            {viewingAsg.fileName && (
              <div className="p-3 bg-[#03172c] border border-cyan-800/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Tệp đính kèm: <strong>{viewingAsg.fileName}</strong></span>
                </div>
                <button
                  onClick={() => handleDownloadTeacherFile(viewingAsg)}
                  className="px-3 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file về</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-[#0e3d54] flex justify-end">
              <button
                onClick={() => setViewingAsg(null)}
                className="px-4 py-2 bg-[#03172c] hover:bg-[#06203a] border border-[#0e3d54] text-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
