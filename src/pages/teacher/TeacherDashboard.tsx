import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  Calendar,
  ArrowRight,
  Compass,
  Sparkles,
  ClipboardCheck,
  ChevronRight,
  TrendingUp,
  Users,
  CheckCircle2,
  FileCode2,
  Radar,
} from 'lucide-react';
import { db } from '../../services/db';
import { Classroom, SmartAlert, AuditLog } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../contexts/AuthContext';

const CLASS_ACCENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setActiveClassId } = useAuth();

  const [classes, setClasses] = useState<Classroom[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [kpiStats, setKpiStats] = useState({
    totalStudents: 0,
    presentCount: 0,
    attendanceRate: '96.8%',
    absentCount: 1,
    lateCount: 1,
    pendingGradingCount: 1,
    latestAssignmentTitle: 'Bài tập Hàm số bậc hai',
  });

  useEffect(() => {
    const loadData = () => {
      const clsList = db.getClasses();
      const alertList = db.getAlerts().filter(a => a.status !== 'resolved');
      const studentsList = db.getStudents();
      const sessions = db.getAttendanceSessions();
      const assignments = db.getAssignments();

      // Compute real attendance snapshot from latest session or aggregate
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let totalAttendedPool = 0;

      if (sessions.length > 0) {
        const latestSession = sessions[sessions.length - 1];
        presentCount = latestSession.summary?.present ?? 0;
        absentCount =
          (latestSession.summary?.absentExcused ?? 0) +
          (latestSession.summary?.absentUnexcused ?? 0);
        lateCount = latestSession.summary?.late ?? 0;
        totalAttendedPool = latestSession.summary?.total || studentsList.length || 1;
      } else {
        presentCount = Math.max(0, studentsList.length - 2);
        absentCount = 1;
        lateCount = 1;
        totalAttendedPool = studentsList.length || 1;
      }

      const avgAttendance =
        studentsList.length > 0
          ? (
              studentsList.reduce((sum, s) => sum + (s.attendanceRate ?? 96.8), 0) /
              studentsList.length
            ).toFixed(1)
          : ((presentCount / Math.max(1, totalAttendedPool)) * 100).toFixed(1);

      // Compute pending submissions to grade from DB
      let ungradedSubs = 0;
      assignments.forEach(a => {
        const subs = db.getSubmissions(a.id);
        ungradedSubs += subs.filter(s => s.status !== 'graded').length;
      });
      const publishedAssignments = assignments.filter(a => a.status === 'published');
      const pendingGradingCount =
        ungradedSubs > 0 ? ungradedSubs : publishedAssignments.length;
      const latestAssignmentTitle =
        publishedAssignments[0]?.title ||
        assignments[0]?.title ||
        'Chưa có bài tập chờ chấm';

      setClasses(clsList);
      setAlerts(alertList);
      setRecentLogs(db.getAuditLogs().slice(0, 5));
      setKpiStats({
        totalStudents: studentsList.length || clsList.reduce((acc, c) => acc + c.studentCount, 0),
        presentCount,
        attendanceRate: `${avgAttendance}%`,
        absentCount,
        lateCount,
        pendingGradingCount,
        latestAssignmentTitle,
      });
    };
    loadData();
    return db.subscribe(loadData);
  }, []);

  const handleOpenClass = (classId: string) => {
    setActiveClassId(classId);
    navigate(`/teacher/classes/${classId}`);
  };

  return (
    <div className="space-y-5 text-[#F5F7FF]">
      {/* Page Header: Breadcrumb + Xin chào + 2 Action Buttons */}
      <PageHeader
        breadcrumbItems={[
          { label: 'Tổng quan' },
          { label: 'Bàn làm việc giáo viên' },
        ]}
        title={`Xin chào, ${currentUser?.fullName || 'Cô Nguyễn Thị Mai'}!`}
        action={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/teacher/schedule')}
              className="hud-chamfer-btn inline-flex items-center gap-2 px-4 py-2 bg-[#00E5F5] text-[#05080F] text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              <span>Thời khóa biểu</span>
            </button>
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B0D19] border border-[#183242] hover:border-[#00D6A0] text-[#F5F7FF] rounded-[3px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <ClipboardCheck className="w-4 h-4 text-[#00D6A0]" />
              <span>Điểm danh</span>
            </button>
          </div>
        }
      />

      {/* 4 KPI Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng học sinh phụ trách"
          value={kpiStats.totalStudents}
          subtext={`Thuộc ${classes.length} lớp học`}
          icon={<Users className="w-4 h-4" />}
          accentTone="cyan"
          onClick={() => navigate('/teacher/students')}
        />
        <StatCard
          label="Có mặt hôm nay"
          value={kpiStats.presentCount}
          trend={{ value: `${kpiStats.attendanceRate} chuyên cần`, isPositive: true }}
          subtext={`Vắng: ${kpiStats.absentCount} · Đi muộn: ${kpiStats.lateCount}`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accentTone="emerald"
          onClick={() => navigate('/teacher/attendance')}
        />
        <StatCard
          label="Bài tập chờ chấm"
          value={kpiStats.pendingGradingCount}
          subtext={kpiStats.latestAssignmentTitle}
          icon={<FileCode2 className="w-4 h-4" />}
          accentTone="amber"
          onClick={() => navigate('/teacher/assignments')}
        />
        <StatCard
          label="Cảnh báo học tập & nề nếp"
          value={alerts.length}
          subtext="Cần theo dõi và hỗ trợ"
          icon={<Radar className="w-4 h-4" />}
          accentTone="rose"
          onClick={() => navigate('/teacher/alerts')}
        />
      </div>

      {/* TÁC VỤ NHANH THƯỜNG DÙNG */}
      <div className="hud-panel bg-[#0B0D19] rounded-[3px] border border-[#183242] p-4 sm:p-5">
        <div className="font-orbitron text-[11px] font-bold text-[#00E5F5] uppercase tracking-[0.22em] mb-4">
          TÁC VỤ NHANH THƯỜNG DÙNG
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Thời khóa biểu (Cyan #00E5F5) */}
          <button
            onClick={() => navigate('/teacher/schedule')}
            className="flex flex-col items-center justify-center py-5 px-3 rounded-[3px] border border-[#183242] bg-[#070B14] hover:bg-[#10182B] hover:border-[#00E5F5] hover:shadow-[0_0_16px_rgba(0,229,245,0.16)] active:scale-[0.98] transition-all text-center group cursor-pointer"
          >
            <div className="hud-chamfer-icon w-10 h-10 bg-[#00E5F5]/10 text-[#00E5F5] border border-[#00E5F5]/45 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F7FF] group-hover:text-[#00E5F5]">Thời khóa biểu</span>
          </button>

          {/* 2. Điểm danh (Green #00D6A0) */}
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="flex flex-col items-center justify-center py-5 px-3 rounded-[3px] border border-[#183242] bg-[#070B14] hover:bg-[#10182B] hover:border-[#00D6A0] hover:shadow-[0_0_16px_rgba(0,214,160,0.16)] active:scale-[0.98] transition-all text-center group cursor-pointer"
          >
            <div className="hud-chamfer-icon w-10 h-10 bg-[#00D6A0]/10 text-[#00D6A0] border border-[#00D6A0]/45 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F7FF] group-hover:text-[#00D6A0]">Điểm danh</span>
          </button>

          {/* 3. Giao bài tập (Purple #A855F7) */}
          <button
            onClick={() => navigate('/teacher/assignments')}
            className="flex flex-col items-center justify-center py-5 px-3 rounded-[3px] border border-[#A855F7]/30 bg-[#070B14] hover:bg-[#10182B] hover:border-[#A855F7] hover:shadow-[0_0_16px_rgba(168,85,247,0.18)] active:scale-[0.98] transition-all text-center group cursor-pointer"
          >
            <div className="hud-chamfer-icon w-10 h-10 bg-[#A855F7]/12 text-[#A855F7] border border-[#A855F7]/45 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F7FF] group-hover:text-[#A855F7]">Giao bài tập</span>
          </button>

          {/* 4. Nhập sổ điểm (Cyan-Blue #38BDF8) */}
          <button
            onClick={() => navigate('/teacher/grades')}
            className="flex flex-col items-center justify-center py-5 px-3 rounded-[3px] border border-[#183242] bg-[#070B14] hover:bg-[#10182B] hover:border-[#38BDF8] hover:shadow-[0_0_16px_rgba(56,189,248,0.16)] active:scale-[0.98] transition-all text-center group cursor-pointer"
          >
            <div className="hud-chamfer-icon w-10 h-10 bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/45 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F7FF] group-hover:text-[#38BDF8]">Nhập sổ điểm</span>
          </button>

          {/* 5. Vòng quay lớp (Yellow #F5E900) */}
          <button
            onClick={() => navigate('/teacher/tools/wheel')}
            className="flex flex-col items-center justify-center py-5 px-3 rounded-[3px] border border-[#F5E900]/40 bg-[#070B14] hover:bg-[#10182B] hover:border-[#F5E900] hover:shadow-[0_0_16px_rgba(245,233,0,0.16)] active:scale-[0.98] transition-all text-center group cursor-pointer"
          >
            <div className="hud-chamfer-icon w-10 h-10 bg-[#F5E900]/10 text-[#F5E900] border border-[#F5E900]/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F7FF] group-hover:text-[#F5E900]">Vòng quay lớp</span>
          </button>

          {/* 6. AI Soạn bài (Pink #FF287A) */}
          <button
            onClick={() => navigate('/teacher/ai')}
            className="flex flex-col items-center justify-center py-5 px-3 rounded-[3px] border border-[#FF287A]/40 bg-[#070B14] hover:bg-[#10182B] hover:border-[#FF287A] hover:shadow-[0_0_16px_rgba(255,40,122,0.18)] active:scale-[0.98] transition-all text-center group cursor-pointer"
          >
            <div className="hud-chamfer-icon w-10 h-10 bg-[#FF287A]/12 text-[#FF287A] border border-[#FF287A]/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#F5F7FF] group-hover:text-[#FF287A]">AI Soạn bài</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Left 2 Cols (Lớp học đang phụ trách) + Right 1 Col (Cảnh báo thông minh) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Column: My Classes (2 spans) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-rajdhani text-lg font-bold text-[#F5F7FF] tracking-tight">
              Lớp học đang phụ trách ({classes.length})
            </h2>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="text-xs font-bold text-[#00E5F5] hover:text-[#33EEFA] flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map((cls, idx) => {
              const accentColor = cls.color || CLASS_ACCENT_COLORS[idx % CLASS_ACCENT_COLORS.length];
              return (
                <div
                  key={cls.id}
                  onClick={() => handleOpenClass(cls.id)}
                  className="hud-panel bg-[#0B0D19] rounded-[3px] border border-[#183242] p-5 hover:border-[#00E5F5] transition-all duration-150 cursor-pointer group flex flex-col justify-between"
                >
                  {/* Top Neon Accent Strip */}
                  <div
                    className="absolute top-0 left-3 right-3 h-[2px]"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-medium text-[#A5B0C5]">
                          Khối {cls.gradeLevel} · Phòng {cls.roomNumber}
                        </span>
                        <h3 className="font-rajdhani text-xl font-bold text-[#F5F7FF] group-hover:text-[#00E5F5] transition-colors mt-1">
                          Lớp {cls.name}
                        </h3>
                      </div>
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] shrink-0 mt-1"
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 0 8px ${accentColor}`,
                        }}
                      />
                    </div>

                    <div className="mt-3 text-xs text-[#A5B0C5] space-y-1.5">
                      <div>
                        GVCN: <span className="font-bold text-[#F5F7FF]">{cls.homeroomTeacherName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>
                          Sĩ số: <strong className="font-rajdhani text-sm text-[#F5F7FF] tabular-nums">{cls.studentCount}</strong> học sinh
                        </span>
                        <span>·</span>
                        <span className="font-orbitron text-[#00E5F5] text-[10px]">Mã: {cls.joinCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#183242] flex items-center justify-between text-xs font-semibold text-[#00E5F5]">
                    <span>Mở không gian lớp học</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's Schedule Timeline */}
          <div className="hud-panel bg-[#0B0D19] rounded-[3px] border border-[#183242] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00E5F5]" />
                <h3 className="font-rajdhani text-base font-bold text-[#F5F7FF]">Lịch giảng dạy hôm nay</h3>
              </div>
              <button
                onClick={() => navigate('/teacher/schedule')}
                className="text-xs font-semibold text-[#00E5F5] hover:underline cursor-pointer"
              >
                Xem tuần
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[3px] bg-[#070B14] border border-[#183242] text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-orbitron text-[10px] font-bold text-[#00E5F5] bg-[#00E5F5]/10 px-2.5 py-1 rounded-[2px] border border-[#00E5F5]/40 tabular-nums">
                    Tiết 1-2
                  </span>
                  <div>
                    <span className="font-bold text-[#F5F7FF]">Toán học · Lớp 10A1</span>
                    <div className="text-[#A5B0C5] text-[11px] mt-0.5">07:30 - 09:05 · Phòng A.302</div>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenClass('class_10a1')}
                  className="hud-chamfer-btn px-3.5 py-1.5 bg-[#00E5F5] text-[#05080F] font-bold transition-colors cursor-pointer"
                >
                  Vào lớp
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[3px] bg-[#070B14] border border-[#183242] text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-orbitron text-[10px] font-semibold text-[#A5B0C5] bg-[#0B0D19] px-2.5 py-1 rounded-[2px] border border-[#183242] tabular-nums">
                    Tiết 4
                  </span>
                  <div>
                    <span className="font-bold text-[#F5F7FF]">Toán học · Lớp 10A2</span>
                    <div className="text-[#A5B0C5] text-[11px] mt-0.5">10:15 - 11:00 · Phòng A.304</div>
                  </div>
                </div>
                <span className="text-[#A5B0C5] text-[11px] font-medium">Chưa bắt đầu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Smart Alerts & Activity Stream (1 span) */}
        <div className="space-y-4">
          <div className="hud-panel bg-[#0B0D19] rounded-[3px] border border-[#183242] p-5">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF287A] shrink-0" />
                <h3 className="font-rajdhani text-base font-bold text-[#F5F7FF] leading-snug">
                  Cảnh báo thông minh
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#FF287A] tabular-nums text-right leading-snug shrink-0">
                {alerts.length} việc cần làm
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-xs text-[#A5B0C5] py-4 text-center">
                  Không có cảnh báo nào đang tồn tại.
                </div>
              ) : (
                alerts.map(alt => (
                  <div
                    key={alt.id}
                    onClick={() => navigate('/teacher/alerts')}
                    className="p-3.5 rounded-[3px] border border-[#183242] bg-[#070B14] hover:bg-[#10182B] hover:border-[#00E5F5]/80 transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#F5F7FF] gap-2">
                      <span className="truncate">{alt.studentName} ({alt.className})</span>
                      <span
                        className={`font-orbitron text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[2px] shrink-0 ${
                          alt.level === 'critical'
                            ? 'bg-[#FF287A]/15 text-[#FF287A] border border-[#FF287A]/40'
                            : 'bg-[#F5E900]/12 text-[#F5E900] border border-[#F5E900]/40'
                        }`}
                      >
                        {alt.level === 'critical' ? 'NGHIÊM TRỌNG' : 'CẦN CHÚ Ý'}
                      </span>
                    </div>
                    <div className="text-[#A5B0C5] text-[11px] mt-1.5 line-clamp-2 leading-relaxed">
                      {alt.description}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => navigate('/teacher/alerts')}
              className="mt-4 w-full py-2.5 text-center text-xs font-semibold text-[#00E5F5] hover:bg-[#10182B] rounded-[3px] transition-colors border border-dashed border-[#183242] cursor-pointer"
            >
              Xem toàn bộ cảnh báo
            </button>
          </div>

          {/* Activity Logs Stream */}
          <div className="hud-panel bg-[#0B0D19] rounded-[3px] border border-[#183242] p-5">
            <h3 className="font-rajdhani text-base font-bold text-[#F5F7FF] mb-3.5">Hoạt động gần đây</h3>
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="text-xs border-l-2 border-[#00E5F5] pl-3 py-0.5">
                  <div className="font-semibold text-[#F5F7FF] leading-tight">
                    {log.details}
                  </div>
                  <div className="text-[11px] text-[#A5B0C5] mt-1 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {log.userName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
