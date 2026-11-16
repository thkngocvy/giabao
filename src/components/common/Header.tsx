import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  Layers,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, AppNotification } from '../../types';
import { db } from '../../services/db';
import { ThemeSkinToggle } from './ThemeSkinToggle';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isDark?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isDark = true }) => {
  const { currentUser, currentRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const targetId = currentRole === 'STUDENT' ? 'std_01' : currentRole === 'PARENT' ? 'user_parent_1' : currentUser?.id;
  const [notifications, setNotifications] = useState<AppNotification[]>(() => db.getNotifications(currentRole, targetId));

  useEffect(() => {
    db.checkAndTriggerOverdueReminders();
    setNotifications(db.getNotifications(currentRole, targetId));
    const unsubscribe = db.subscribe(() => {
      setNotifications(db.getNotifications(currentRole, targetId));
    });
    return () => unsubscribe();
  }, [currentRole, targetId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const roles: { role: UserRole; label: string; path: string; color: string }[] = [
    { role: 'TEACHER', label: 'Giáo viên', path: '/teacher/dashboard', color: 'bg-[#00E5F5]' },
    { role: 'ADMIN', label: 'Quản trị viên (Admin)', path: '/admin/dashboard', color: 'bg-[#A855F7]' },
    { role: 'STUDENT', label: 'Học sinh', path: '/student/dashboard', color: 'bg-[#00D6A0]' },
    { role: 'PARENT', label: 'Phụ huynh', path: '/parent/dashboard', color: 'bg-[#F5E900]' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-xl h-16 flex items-center justify-between px-4 sm:px-6 transition-all border-b ${
        isDark
          ? 'bg-[#030B16]/90 border-[#00E5FF]/20 text-[#EAFBFF]'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      {/* Left: EduTech STUDIO Logo & Brand Name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`p-2 -ml-2 rounded-lg md:hidden transition-colors cursor-pointer ${
            isDark
              ? 'text-[#8BA9BC] hover:text-[#EAFBFF] hover:bg-[#0A1B2D]'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          aria-label="Mở menu"
        >
          <Layers className={`w-5 h-5 ${isDark ? 'text-[#00E5FF]' : 'text-sky-600'}`} />
        </button>

        <Link to="/" className="flex items-center gap-3 group min-w-0">
          <div className={`w-10 h-10 rounded-full overflow-hidden border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
            isDark
              ? 'bg-[#071525] border-[#00E5FF]/70 shadow-[0_0_18px_rgba(0,229,255,0.3)]'
              : 'bg-sky-50 border-sky-400 shadow-sm'
          }`}>
            <img
              src="/assets/aistudio/image_721c51fd.png"
              alt="EduTech STUDIO Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 leading-tight truncate">
              <span className={`font-orbitron text-[15px] font-bold tracking-[0.04em] ${
                isDark ? 'text-[#EAFBFF]' : 'text-slate-900'
              }`}>
                Edu<span className={isDark ? 'text-[#00E5FF]' : 'text-sky-600'}>Tech</span>
              </span>
              <span className={`font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase ${
                isDark ? 'text-[#EAFBFF]' : 'text-slate-600'
              }`}>
                STUDIO
              </span>
            </div>
            <div className={`text-[10.5px] font-medium leading-tight truncate hidden sm:block ${
              isDark ? 'text-[#00E5FF]' : 'text-sky-600'
            }`}>
              Kiến tạo game giáo dục · Lan tỏa tri thức
            </div>
          </div>
        </Link>
      </div>

      {/* Center: System Status Bar */}
      <div className="hidden lg:flex items-center justify-center px-3">
        <div
          className={`hud-banner-pill flex items-center gap-3.5 px-6 py-1.5 ${
            !isDark ? 'bg-slate-100 border border-slate-200 rounded-lg' : ''
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] inline-block shrink-0" />
          <span
            className={`font-orbitron text-[10.5px] font-bold uppercase tracking-[0.26em] whitespace-nowrap ${
              isDark ? 'text-[#EAFBFF]' : 'text-sky-800'
            }`}
          >
            AI-POWERED CLASS MANAGEMENT SYSTEM
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7] inline-block shrink-0" />
        </div>
      </div>

      {/* Right: Theme Switcher, Role Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <ThemeSkinToggle className="hidden sm:inline-flex" />

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-orbitron text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
              isDark
                ? 'border-[#00E5FF]/25 bg-[#0A1B2D] hover:border-[#00E5FF] hover:shadow-[0_0_12px_rgba(0,229,255,0.2)] text-[#00E5FF]'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-sky-700'
            }`}
            title="Đổi vai trò người dùng"
          >
            <span>{currentRole}</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {showRoleMenu && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl py-2 z-50 ${
                isDark
                  ? 'hud-panel bg-[#0A1B2D] border-[#00E5FF]/30'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`px-3.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-[#00E5FF]' : 'text-sky-700'
                }`}
              >
                Chuyển đổi vai trò
              </div>
              <div className="mt-1 space-y-0.5">
                {roles.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setShowRoleMenu(false);
                      navigate(r.path);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      currentRole === r.role
                        ? isDark
                          ? 'bg-[#00E5FF]/15 text-[#00E5FF] font-bold'
                          : 'bg-sky-50 text-sky-700 font-bold'
                        : isDark
                        ? 'text-[#8BA9BC] hover:bg-[#071525] hover:text-[#EAFBFF] font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${r.color}`} />
                      <span>{r.label}</span>
                    </div>
                    {currentRole === r.role && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
              setShowUserMenu(false);
            }}
            className={`p-2 rounded-lg relative transition-all cursor-pointer border ${
              isDark
                ? 'border-transparent text-[#8BA9BC] hover:text-[#EAFBFF] hover:bg-[#0A1B2D] hover:border-[#00E5FF]/25'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            aria-label="Thông báo"
          >
            <Bell className={`w-4 h-4 ${isDark ? 'text-[#EAFBFF]' : 'text-slate-700'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF4D6D] shadow-[0_0_8px_#FF4D6D]" />
            )}
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-88 sm:w-96 rounded-xl border shadow-2xl p-3.5 z-50 max-h-[85vh] overflow-y-auto ${
                isDark
                  ? 'hud-panel bg-[#0A1B2D] border-[#00E5FF]/30'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 border-b mb-2 ${
                  isDark ? 'border-[#00E5FF]/20' : 'border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-[#EAFBFF]' : 'text-slate-900'
                  }`}
                >
                  <Bell className={`w-3.5 h-3.5 ${isDark ? 'text-[#00E5FF]' : 'text-sky-600'}`} />
                  Thông báo hệ thống ({notifications.length})
                </span>
                <button
                  onClick={() => {
                    db.markAllNotificationsRead(currentRole);
                    setNotifications(db.getNotifications(currentRole, targetId));
                  }}
                  className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                    isDark ? 'text-[#00E5F5]' : 'text-sky-600'
                  }`}
                >
                  Đã đọc tất cả
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#A5B0C5]">
                  Không có thông báo mới nào.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {notifications.slice(0, 10).map(n => {
                    const isSubmission = n.type === 'submission_new';
                    const isOverdue = n.type === 'assignment_overdue_alert';

                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-[3px] border transition-all ${
                          !n.isRead
                            ? isDark
                              ? 'bg-[#0B0D19] border-[#00E5F5]/50'
                              : 'bg-sky-50 border-sky-200'
                            : isDark
                            ? 'bg-[#070B14] border-[#183242]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-orbitron font-bold px-1.5 py-0.5 rounded-[2px] ${
                              isSubmission
                                ? 'bg-[#00E5F5]/15 text-[#00E5F5] border border-[#00E5F5]/40'
                                : isOverdue
                                ? 'bg-[#FF287A]/15 text-[#FF287A] border border-[#FF287A]/40'
                                : 'bg-[#00D6A0]/15 text-[#00D6A0] border border-[#00D6A0]/40'
                            }`}
                          >
                            {isSubmission ? 'Bài nộp mới' : isOverdue ? 'Quá hạn' : 'BTVN'}
                          </span>
                          <span className="text-[10px] font-rajdhani font-semibold text-[#A5B0C5]">
                            {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className={`font-bold text-xs mt-1.5 ${isDark ? 'text-[#F5F7FF]' : 'text-slate-900'}`}>
                          {n.title}
                        </div>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-[#A5B0C5]' : 'text-slate-600'}`}>
                          {n.message}
                        </p>

                        <div className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 ${isDark ? 'border-[#183242]' : 'border-slate-200'}`}>
                          {currentRole === 'TEACHER' && isSubmission && (
                            <button
                              onClick={() => {
                                db.tickNotificationCompleted(n.id);
                                setNotifications(db.getNotifications(currentRole, targetId));
                              }}
                              className={`px-2.5 py-1 rounded-[3px] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                                n.isCompletedTick
                                  ? 'bg-[#00D6A0] text-[#05080F] border-[#00D6A0]'
                                  : 'bg-[#00E5F5] hover:bg-[#33EEFA] text-[#05080F] border-[#00E5F5]'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{n.isCompletedTick ? '✓ Đã tick làm' : 'Tick HS đã làm'}</span>
                            </button>
                          )}

                          {currentRole === 'STUDENT' && n.assignmentId && (
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/student/dashboard');
                              }}
                              className="px-2.5 py-1 bg-[#00E5F5] hover:bg-[#33EEFA] text-[#05080F] rounded-[3px] text-[11px] font-bold cursor-pointer"
                            >
                              Xem & Nộp BTVN
                            </button>
                          )}

                          {currentRole === 'PARENT' && (
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/parent/dashboard');
                              }}
                              className="px-2.5 py-1 bg-[#F5E900] hover:opacity-90 text-[#05080F] rounded-[3px] text-[11px] font-bold cursor-pointer"
                            >
                              Xem bài tập của con
                            </button>
                          )}

                          <button
                            onClick={() => {
                              db.markNotificationRead(n.id);
                              setNotifications(db.getNotifications(currentRole, targetId));
                            }}
                            className="text-[10px] text-[#A5B0C5] hover:text-[#F5F7FF] cursor-pointer ml-auto"
                          >
                            Đánh dấu đã đọc
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRoleMenu(false);
              setShowNotifications(false);
            }}
            className={`flex items-center gap-2.5 p-1 pr-2.5 rounded-[3px] border border-transparent transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#0B0D19] hover:border-[#183242]' : 'hover:bg-slate-100 hover:border-slate-200'
            }`}
          >
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.fullName || 'Avatar'}
              referrerPolicy="no-referrer"
              className={`w-8 h-8 rounded-[3px] object-cover border ${
                isDark ? 'border-[#183242]' : 'border-slate-300'
              }`}
            />
            <span
              className={`hidden lg:inline text-xs font-bold max-w-[150px] truncate ${
                isDark ? 'text-[#F5F7FF]' : 'text-slate-800'
              }`}
            >
              {currentUser?.fullName}
            </span>
            <ChevronDown className="hidden lg:inline w-3.5 h-3.5 text-[#A5B0C5]" />
          </button>

          {showUserMenu && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-[3px] border shadow-2xl py-2 z-50 ${
                isDark
                  ? 'hud-panel bg-[#0B0D19] border-[#183242]'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className={`px-4 py-2.5 border-b ${isDark ? 'border-[#183242]' : 'border-slate-200'}`}>
                <div className={`text-xs font-bold truncate ${isDark ? 'text-[#F5F7FF]' : 'text-slate-900'}`}>
                  {currentUser?.fullName}
                </div>
                <div className="text-[11px] text-[#A5B0C5] truncate">{currentUser?.email}</div>
                <div
                  className={`font-orbitron text-[10px] font-bold mt-1 uppercase tracking-wider ${
                    isDark ? 'text-[#00E5F5]' : 'text-sky-700'
                  }`}
                >
                  {currentUser?.role}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(`/${currentRole.toLowerCase()}/profile`);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 cursor-pointer ${
                    isDark ? 'text-[#A5B0C5] hover:bg-[#10182B] hover:text-[#F5F7FF]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#00E5F5]" />
                  <span>Hồ sơ cá nhân</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/teacher/schedule');
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 cursor-pointer ${
                    isDark ? 'text-[#A5B0C5] hover:bg-[#10182B] hover:text-[#F5F7FF]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-[#00E5F5]" />
                  <span>Thời khóa biểu</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/teacher/ai');
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 cursor-pointer ${
                    isDark ? 'text-[#A5B0C5] hover:bg-[#10182B] hover:text-[#F5F7FF]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Trợ lý AI SmartClass</span>
                </button>
              </div>

              <div className={`border-t pt-1 ${isDark ? 'border-[#183242]' : 'border-slate-200'}`}>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#FF287A] hover:bg-[#FF287A]/10 flex items-center gap-2.5 font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
