import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  TrendingUp,
  Award,
  Bell,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Paperclip,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SubmitHomeworkModal } from '../../components/assignments/SubmitHomeworkModal';
import { db } from '../../services/db';
import { Assignment, AssignmentSubmission, AppNotification, Student } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // 3. Học sinh có thể nhận đc chỉ khi gv giao btvn và chính hs đó cũng có trong lớp:
  const student: Student =
    db.getStudents().find(s => s.fullName.includes('Minh Nhật') || s.id === 'std_01') ||
    db.getStudents()[0];

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [submittingAsg, setSubmittingAsg] = useState<Assignment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    db.checkAndTriggerOverdueReminders();
    // Only visible assignments for this student (excludes draft, scheduled, withdrawn, non-targeted)
    const classAsgs = db.getVisibleAssignmentsForStudent(student.id, student.classId);
    setAssignments(classAsgs);

    // Get notifications for this student
    const notifs = db.getNotifications('STUDENT', student.id, student.classId);
    setNotifications(notifs);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = db.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [student.id, student.classId]);

  const myGrades = db.getGrades(student.classId).find(g => g.studentId === student.id);

  // Helper: Format test paper content if created from question bank
  const getAsgFormattedContent = (asg: Assignment): string => {
    if (asg.selectedQuestions && asg.selectedQuestions.length > 0) {
      let text = `TRƯỜNG THCS TRƯNG VƯƠNG\n`;
      text += `ĐỀ BÀI: ${asg.title.toUpperCase()}\n`;
      text += `Môn: ${asg.subjectName} - Lớp: ${asg.className}\n`;
      if (asg.timeLimitMinutes) text += `Thời gian làm bài: ${asg.timeLimitMinutes} phút\n`;
      if (asg.topic) text += `Chủ đề: ${asg.topic}\n`;
      text += `Thang điểm: ${asg.points} điểm\n`;
      text += `------------------------------------\n\n`;

      asg.selectedQuestions.forEach((sq, idx) => {
        const q = sq.snapshot || db.getQuestions().find(item => item.id === sq.questionId);
        text += `Câu ${idx + 1} (${sq.points} điểm)${sq.type === 'essay' ? ' [Tự luận]' : ' [Trắc nghiệm]'}: ${q?.content || ''}\n`;
        if (q?.options && q.options.length > 0) {
          q.options.forEach(opt => {
            text += `  ${opt.id}. ${opt.text}\n`;
          });
        }
        text += `\n`;
      });
      return text;
    }
    return asg.content || `Nội dung đề bài: ${asg.title}\nMôn: ${asg.subjectName}\nLớp: ${asg.className}\nHạn nộp: ${asg.dueDate}\n\n${asg.description}`;
  };

  // 1 là tải file bài tập về
  const handleDownloadTeacherFile = (asg: Assignment) => {
    const filename = asg.fileName || `De_Bai_${asg.subjectName}_${asg.className}.txt`;
    const element = document.createElement('a');
    const fileContent = getAsgFormattedContent(asg);
    const file = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`Đang tải tệp "${filename}" về máy tính...`, 'info');
  };

  // 2 là copy paste bài tập cô đã giao
  const handleCopyPrompt = (asg: Assignment) => {
    const textToCopy = getAsgFormattedContent(asg);
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(asg.id);
    showToast('Đã sao chép nội dung toàn bộ đề bài vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Count pending homework (exclude closed assignments unless resubmit required, count missing/resubmit_required)
  const pendingHomeworkCount = assignments.filter(asg => {
    const sub = db.getStudentSubmission(asg.id, student.id);
    if (sub?.status === 'resubmit_required') return true;
    const isVerified = sub?.isTeacherVerified || asg.completedStudentIds?.includes(student.id);
    return !sub && !isVerified;
  }).length;

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        breadcrumbItems={[
          { label: 'Góc học tập' },
          { label: `Lớp ${student.className}` },
        ]}
        title={`Chào em, ${currentUser?.fullName || student.fullName}!`}
        subtitle={`Mã học sinh: ${student.studentCode} · Trường THCS Trưng Vương`}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-[#031526] border border-[#0e3d54] text-cyan-300 px-3 py-1.5 rounded-xl font-bold">
              Lớp {student.className}
            </span>
          </div>
        }
      />

      {/* Student KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Điểm trung bình (ĐTB)</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1 tabular-nums">{student.gpa}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">Môn Toán: {myGrades?.averageScore ?? '8.7'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Chuyên cần</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{student.attendanceRate}%</div>
          <span className="text-xs text-emerald-400 mt-0.5 block">Đầy đủ · Không nghỉ buổi nào</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">BTVN cần hoàn thành</span>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">
            {pendingHomeworkCount} bài
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {pendingHomeworkCount > 0 ? 'Khẩn trương làm bài' : 'Đã làm hết bài tập'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041527] border border-[#0e3d54] shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Điểm thi đua nề nếp</span>
          <div className="text-2xl font-bold text-purple-400 mt-1 tabular-nums">+{student.behaviorPoints}</div>
          <span className="text-xs text-purple-300 mt-0.5 block">Tổ 1 · Tích cực phát biểu</span>
        </div>
      </div>

      {/* 3. Phần thông báo của học sinh: Ở phần thông báo giao BTVN của cô giáo, hs có thể bấm nút Nộp BTVN */}
      {notifications.length > 0 && (
        <div className="bg-[#041527] rounded-2xl border border-cyan-800/60 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#0e3d54] pb-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400 animate-bounce" />
              <h3 className="text-sm font-bold text-white">
                Thông báo BTVN & Lời nhắc từ cô giáo ({notifications.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Nhận được trực tiếp khi cô giao bài cho lớp {student.className}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifications.slice(0, 4).map(notif => {
              const matchedAsg = assignments.find(a => a.id === notif.assignmentId);
              const sub = matchedAsg ? db.getStudentSubmission(matchedAsg.id, student.id) : null;
              const isVerified = sub?.isTeacherVerified || matchedAsg?.completedStudentIds?.includes(student.id);

              const isOverdueAlert = notif.type === 'assignment_overdue_alert';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2.5 ${
                    isOverdueAlert
                      ? 'bg-rose-950/40 border-rose-700/60 shadow-xs'
                      : isVerified
                      ? 'bg-emerald-950/30 border-emerald-700/50'
                      : 'bg-[#03172c] border-[#0e3d54] hover:border-cyan-500/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isOverdueAlert
                          ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                          : isVerified
                          ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      }`}>
                        {isOverdueAlert ? '⚠️ Nhắc nhở quá hạn' : isVerified ? '✓ Đã hoàn thành' : 'BTVN Mới'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="font-bold text-white text-xs mt-1">{notif.title}</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{notif.message}</p>
                  </div>

                  {/* Button nộp BTVN trực tiếp ngay trong thông báo */}
                  {matchedAsg && (
                    <div className="pt-2 border-t border-[#0e3d54]/70 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400">
                        Hạn: {new Date(db.getStudentEffectiveDueDate(matchedAsg, student.id)).toLocaleDateString('vi-VN')}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Tải file */}
                        <button
                          type="button"
                          onClick={() => handleDownloadTeacherFile(matchedAsg)}
                          className="p-1.5 text-cyan-300 hover:text-white bg-[#020e1a] border border-[#0e3d54] rounded-lg"
                          title="Tải file đề bài"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Nộp BTVN */}
                        {db.getEffectiveReceiveStatus(matchedAsg) === 'closed' ? (
                          <span className="text-amber-300 font-semibold text-[11px]">Đã đóng nhận</span>
                        ) : isVerified && sub?.status !== 'resubmit_required' ? (
                          <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cô đã tick ✓
                          </span>
                        ) : sub ? (
                          <button
                            onClick={() => setSubmittingAsg(matchedAsg)}
                            className="px-2.5 py-1 bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 rounded-lg font-semibold text-[11px] border border-cyan-500/40 cursor-pointer"
                          >
                            {sub.status === 'resubmit_required' ? 'Làm lại ngay' : 'Nộp lại bài'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setSubmittingAsg(matchedAsg)}
                            className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 border border-cyan-400/40"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Nộp BTVN</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Homework List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Homework of this student's class */}
        <div className="lg:col-span-2 bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#0e3d54] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Bài tập về nhà môn học - Lớp {student.className}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các bài tập được cô giáo giao cho lớp em đang học
              </p>
            </div>
            <span className="text-xs text-cyan-300 font-mono font-bold bg-[#03172c] border border-[#0e3d54] px-2.5 py-1 rounded-lg">
              {assignments.length} bài tập
            </span>
          </div>

          <div className="space-y-3.5">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-[#0e3d54] rounded-xl space-y-1">
                <p>Hiện chưa có bài tập về nhà nào cho lớp {student.className}.</p>
                <p className="text-[11px] text-slate-500">Khi cô giáo giao bài, bài tập sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              assignments.map(asg => {
                const subVis = db.getSubmissionVisibleToStudentOrParent(asg.id, student.id);
                const mySub = subVis?.submission;
                const isGradePublished = Boolean(subVis?.isGradePublished);
                const isVerified = mySub?.isTeacherVerified || asg.completedStudentIds?.includes(student.id);
                const effReceive = db.getEffectiveReceiveStatus(asg);
                const isClosed = effReceive === 'closed';
                const maxAttempts = asg.maxAttempts || 3;
                const attemptsUsed = mySub?.attemptNo || 0;
                const noAttemptsLeft = attemptsUsed >= maxAttempts;

                const effectiveDueIso = db.getStudentEffectiveDueDate(asg, student.id);
                const hasCustomDue = Boolean(asg.recipientOverrides?.[student.id]?.dueOverrideAt);
                const dueTime = new Date(effectiveDueIso).getTime();
                const nowTime = Date.now();
                const isPastDue = nowTime > dueTime;
                const graceMs = (asg.allowLateDays || 0) * 86400000;
                const isPastGrace = nowTime > dueTime + graceMs;

                return (
                  <div
                    key={asg.id}
                    className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                      mySub?.status === 'resubmit_required'
                        ? 'bg-amber-950/25 border-amber-600/70'
                        : isVerified
                        ? 'bg-emerald-950/20 border-emerald-700/60'
                        : isPastDue && !mySub
                        ? 'bg-rose-950/20 border-rose-700/70'
                        : 'bg-[#03172c] border-[#0e3d54] hover:border-cyan-500/60'
                    }`}
                  >
                    {/* Header info */}
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
                        <span className="text-[11px] text-slate-400">
                          Thang điểm: {asg.points}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isClosed && (
                          <span className="text-xs font-bold text-amber-300 bg-amber-950/90 border border-amber-700 px-2.5 py-0.5 rounded-full">
                            Đã đóng nhận bài
                          </span>
                        )}
                        {mySub?.status === 'resubmit_required' ? (
                          <span className="text-xs font-bold text-amber-300 bg-amber-950 border border-amber-600 px-2.5 py-0.5 rounded-full">
                            Cô yêu cầu làm lại
                          </span>
                        ) : isGradePublished ? (
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã trả bài ({mySub?.score}/{asg.points})
                          </span>
                        ) : isVerified ? (
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cô đã tick hoàn thành
                          </span>
                        ) : mySub ? (
                          <span className="text-xs font-bold text-cyan-300 bg-cyan-950 border border-cyan-700 px-2.5 py-0.5 rounded-full">
                            {mySub.status === 'late' ? 'Đã nộp (Muộn) · Chờ trả bài' : 'Đã nộp · Chờ cô trả bài'}
                          </span>
                        ) : isPastGrace ? (
                          <span className="text-xs font-bold text-rose-300 bg-rose-950 border border-rose-700 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Đã quá hạn
                          </span>
                        ) : isPastDue ? (
                          <span className="text-xs font-bold text-amber-300 bg-amber-950 border border-amber-700 px-2 py-0.5 rounded-full">
                            Trong thời gian gia hạn
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                            Chưa làm
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-bold text-white text-sm">{asg.title}</h4>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">{asg.description}</p>
                    </div>

                    {/* Prompt Preview & File */}
                    {(asg.fileName || asg.content) && (
                      <div className="p-3 bg-[#020e1a] border border-[#0e3d54] rounded-lg space-y-2">
                        {asg.fileName && (
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2 text-white">
                              <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                              <span>File đính kèm của cô: <strong>{asg.fileName}</strong></span>
                              {asg.fileSize && <span className="text-slate-400">({asg.fileSize})</span>}
                            </div>
                            <span className="text-cyan-300">Nhấn &quot;Tải file đề bài&quot; bên dưới</span>
                          </div>
                        )}

                        {asg.content && (
                          <div className="font-mono text-[11px] text-slate-300 bg-[#031526] p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                            {asg.content}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deadline and grace info */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {hasCustomDue ? 'Hạn nộp riêng của em:' : 'Hạn nộp:'}{' '}
                        <strong className="text-white">{new Date(effectiveDueIso).toLocaleString('vi-VN')}</strong>
                      </span>
                      {(asg.allowLateDays || 0) > 0 && (
                        <span className="text-amber-400 font-semibold">
                          (Cho phép nộp trễ {asg.allowLateDays} ngày)
                        </span>
                      )}
                    </div>

                    {/* Previous submission view if exists */}
                    {mySub && (
                      <div className="p-2.5 bg-[#021021] border border-cyan-800/40 rounded-lg space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-cyan-300">
                            Bài làm em đã nộp (Lượt {mySub.attemptNo || 1}/{maxAttempts}): &quot;{mySub.topic || 'Bài giải'}&quot;
                          </span>
                          <span className="text-slate-400">
                            Lúc: {new Date(mySub.submittedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {mySub.fileName && (
                          <div className="text-slate-300">Tệp đã gửi: <strong>{mySub.fileName}</strong></div>
                        )}
                        {mySub.resubmitNote && (
                          <div className="text-amber-300 font-medium">
                            Hướng dẫn làm lại từ cô: {mySub.resubmitNote}
                          </div>
                        )}
                        {isGradePublished && mySub.score !== undefined ? (
                          <div className="text-emerald-400 font-bold text-xs">
                            Điểm số giáo viên trả bài: {mySub.score}/{asg.points}
                            {mySub.feedback && (
                              <span className="text-slate-300 font-normal italic ml-2">&ldquo;{mySub.feedback}&rdquo;</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">
                            Điểm số và nhận xét sẽ hiển thị sau khi cô giáo hoàn tất chấm &amp; bấm Trả bài.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-[#0e3d54] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* 1 là tải file bài tập về */}
                        <button
                          type="button"
                          onClick={() => handleDownloadTeacherFile(asg)}
                          className="px-3 py-1.5 bg-[#021b30] hover:bg-[#03294a] text-cyan-300 border border-cyan-700/60 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Tải tệp bài tập về máy"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải file đề bài</span>
                        </button>

                        {/* 2 là copy paste bài tập cô đã giao */}
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(asg)}
                          className="px-3 py-1.5 bg-[#021b30] hover:bg-[#03294a] text-slate-300 border border-[#0e3d54] rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Sao chép đề bài"
                        >
                          {copiedId === asg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === asg.id ? 'Đã sao chép' : 'Sao chép đề bài'}</span>
                        </button>
                      </div>

                      {/* Nút nộp BTVN */}
                      <button
                        type="button"
                        disabled={isClosed || noAttemptsLeft}
                        title={
                          isClosed
                            ? 'Bài tập đã đóng nhận bài'
                            : noAttemptsLeft
                            ? `Đã hết ${maxAttempts} lượt nộp cho phép`
                            : undefined
                        }
                        onClick={() => setSubmittingAsg(asg)}
                        className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all border disabled:opacity-45 disabled:cursor-not-allowed ${
                          isVerified && mySub?.status !== 'resubmit_required'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/40 shadow-sm shadow-cyan-950'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {isClosed
                            ? 'Đã đóng nhận'
                            : noAttemptsLeft
                            ? `Hết lượt (${attemptsUsed}/${maxAttempts})`
                            : mySub?.status === 'resubmit_required'
                            ? 'Nộp lại theo yêu cầu'
                            : mySub
                            ? 'Nộp lại bài'
                            : 'Nộp BTVN ngay'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Today's Schedule & Reminders */}
        <div className="space-y-4">
          {/* Homework Reminder Card */}
          <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#0e3d54]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Nhắc nhở học tập</span>
              </h3>
              <span className="text-xs text-cyan-300 font-semibold">Tự động nhắc</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 bg-[#03172c] border border-cyan-800/40 rounded-xl space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Quy trình nộp bài chuẩn:
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  1. Tải file đề bài hoặc copy đề bài.<br />
                  2. Làm bài ra vở hoặc file máy tính.<br />
                  3. Bấm <strong>&quot;Nộp BTVN&quot;</strong>, nhập chủ đề và đính kèm file hoặc dán lời giải.<br />
                  4. Sau khi nộp, cô giáo sẽ nhận được tin và <strong>tick xác nhận đã làm</strong>.
                </p>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-700/50 rounded-xl space-y-1 text-amber-200 text-[11px]">
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Lưu ý về thời hạn nộp:
                </div>
                <p>
                  Khi hết hạn nộp (kể cả thời gian cho phép trễ), hệ thống sẽ tự động nhắc nhở em phải làm cho xong và gửi thông báo cho phụ huynh để đôn đốc.
                </p>
              </div>
            </div>
          </div>

          {/* Today's Schedule Card */}
          <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#0e3d54]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Lịch học hôm nay</span>
              </h3>
              <span className="text-xs text-cyan-300 font-semibold">Lớp {student.className}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#03172c] border border-[#0e3d54]">
                <span className="font-bold text-cyan-300 tabular-nums">Tiết 1 - 2 (07:30 - 09:05)</span>
                <div className="font-bold text-white text-sm mt-0.5">Toán học</div>
                <div className="text-slate-400 text-[11px]">Cô Lê Thu Hà · Phòng A.201</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#03172c] border border-[#0e3d54]">
                <span className="font-bold text-slate-400 tabular-nums">Tiết 3 (09:25 - 10:10)</span>
                <div className="font-bold text-white text-sm mt-0.5">Vật lý</div>
                <div className="text-slate-400 text-[11px]">Thầy Quang Minh · Lab Lý</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#03172c] border border-[#0e3d54]">
                <span className="font-bold text-slate-400 tabular-nums">Tiết 4 (10:15 - 11:00)</span>
                <div className="font-bold text-white text-sm mt-0.5">Tiếng Anh</div>
                <div className="text-slate-400 text-[11px]">Cô Hồng Hạnh · Phòng A.201</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Homework Submission Modal */}
      {submittingAsg && (
        <SubmitHomeworkModal
          isOpen={!!submittingAsg}
          onClose={() => setSubmittingAsg(null)}
          assignment={submittingAsg}
          student={student}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
};
