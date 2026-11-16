import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  HelpCircle,
  FolderOpen,
  Sparkles,
  BarChart3,
  Award,
  AlertTriangle,
  Wrench,
  Bell,
  Settings,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  History,
  MessageSquare,
  Compass,
  CheckSquare,
  Clock,
  Shuffle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isDark?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
  subItems?: { label: string; path: string }[];
}

interface NavGroup {
  id?: string;
  groupLabel?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDark = true }) => {
  const { currentRole, activeClassId } = useAuth();
  const location = useLocation();
  const activeClass = db.getClasses().find(c => c.id === activeClassId) || db.getClasses()[0];

  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    'lop-hoc': true,
    'day-va-hoc': true,
    'theo-doi': true,
    'tien-ich': true,
    'giao-tiep': true,
    'quan-tri': true,
    'van-hanh': true,
  });

  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({
    '/teacher/attendance': true,
    '/teacher/assignments': true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleSubMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubMenus(prev => ({
      ...prev,
      [path]: !(prev[path] ?? true),
    }));
  };

  const getTeacherNav = (): NavGroup[] => [
    {
      id: 'tong-quan',
      items: [
        { label: 'Tổng quan', path: '/teacher/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      id: 'lop-hoc',
      groupLabel: 'LỚP HỌC',
      items: [
        { label: 'Lớp của tôi', path: '/teacher/classes', icon: <BookOpen className="w-4 h-4" /> },
        { label: 'Học sinh', path: '/teacher/students', icon: <Users className="w-4 h-4" /> },
        {
          label: 'Điểm danh',
          path: '/teacher/attendance',
          icon: <ClipboardCheck className="w-4 h-4" />,
          subItems: [
            { label: 'Điểm danh hằng ngày', path: '/teacher/attendance' },
            { label: 'Báo cáo điểm danh', path: '/teacher/attendance-analytics' },
          ],
        },
        { label: 'Thời khóa biểu', path: '/teacher/schedule', icon: <Calendar className="w-4 h-4" /> },
      ],
    },
    {
      id: 'day-va-hoc',
      groupLabel: 'DẠY & HỌC',
      items: [
        { label: 'Ngân hàng câu hỏi', path: '/teacher/question-bank', icon: <HelpCircle className="w-4 h-4" /> },
        {
          label: 'Giao bài tập',
          path: '/teacher/assignments',
          icon: <FileText className="w-4 h-4" />,
          badge: '4',
          subItems: [
            { label: 'Quản lý chủ đề', path: '/teacher/assignments?tab=topics' },
            { label: 'Tạo bài tập', path: '/teacher/assignments?tab=bank_creator' },
            { label: 'Danh sách bài tập đã giao', path: '/teacher/assignments?tab=list' },
          ],
        },
        { label: 'Chấm bài tự động', path: '/teacher/quizzes', icon: <CheckSquare className="w-4 h-4" /> },
        { label: 'Tài liệu số', path: '/teacher/resources', icon: <FolderOpen className="w-4 h-4" /> },
        { label: 'AI HỖ TRỢ', path: '/teacher/ai', icon: <Sparkles className="w-4 h-4 text-[#A855F7]" /> },
      ],
    },
    {
      id: 'theo-doi',
      groupLabel: 'THEO DÕI & ĐÁNH GIÁ',
      items: [
        { label: 'Điểm kiểm tra & Sổ điểm', path: '/teacher/grades', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Chuyên cần', path: '/teacher/attendance-analytics', icon: <UserCheck className="w-4 h-4" /> },
        { label: 'Hành vi & Nề nếp', path: '/teacher/behavior', icon: <Award className="w-4 h-4" /> },
        { label: 'Cảnh báo thông minh', path: '/teacher/alerts', icon: <AlertTriangle className="w-4 h-4 text-[#F5E900]" />, badge: '3' },
      ],
    },
    {
      id: 'tien-ich',
      groupLabel: 'TIỆN ÍCH LỚP HỌC',
      items: [
        { label: 'Công cụ tương tác', path: '/teacher/tools', icon: <Wrench className="w-4 h-4" /> },
        { label: 'Vòng quay may mắn', path: '/teacher/tools/wheel', icon: <Compass className="w-4 h-4" /> },
        { label: 'Chọn học sinh', path: '/teacher/tools/random', icon: <Shuffle className="w-4 h-4" /> },
        { label: 'Đồng hồ đếm ngược', path: '/teacher/tools/timer', icon: <Clock className="w-4 h-4" /> },
      ],
    },
    {
      id: 'giao-tiep',
      groupLabel: 'GIAO TIẾP & BÁO CÁO',
      items: [
        { label: 'Thông báo', path: '/teacher/announcements', icon: <Bell className="w-4 h-4" /> },
        { label: 'Báo cáo tổng kết', path: '/teacher/reports', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Cài đặt', path: '/teacher/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const getStudentNav = (): NavGroup[] => [
    {
      id: 'student-main',
      items: [
        { label: 'Trang chủ', path: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Lịch học', path: '/student/schedule', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Bài tập cần nộp', path: '/student/assignments', icon: <FileText className="w-4 h-4" />, badge: '2' },
        { label: 'Kiểm tra / Quiz', path: '/student/quizzes', icon: <CheckSquare className="w-4 h-4" /> },
        { label: 'Học liệu', path: '/student/resources', icon: <FolderOpen className="w-4 h-4" /> },
        { label: 'Bảng điểm cá nhân', path: '/student/grades', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Chuyên cần', path: '/student/attendance', icon: <ClipboardCheck className="w-4 h-4" /> },
        { label: 'Thành tích & Huy hiệu', path: '/student/achievements', icon: <Award className="w-4 h-4" /> },
        { label: 'Thông báo', path: '/student/announcements', icon: <Bell className="w-4 h-4" /> },
      ],
    },
  ];

  const getParentNav = (): NavGroup[] => [
    {
      id: 'parent-main',
      items: [
        { label: 'Tổng quan con', path: '/parent/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Kết quả học tập', path: '/parent/grades', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Theo dõi chuyên cần', path: '/parent/attendance', icon: <ClipboardCheck className="w-4 h-4" /> },
        { label: 'Bài tập của con', path: '/parent/assignments', icon: <FileText className="w-4 h-4" /> },
        { label: 'Nhận xét giáo viên', path: '/parent/achievements', icon: <Award className="w-4 h-4" /> },
        { label: 'Thời khóa biểu', path: '/parent/schedule', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Thông báo nhà trường', path: '/parent/announcements', icon: <Bell className="w-4 h-4" /> },
        { label: 'Trao đổi với GV', path: '/parent/messages', icon: <MessageSquare className="w-4 h-4" /> },
      ],
    },
  ];

  const getAdminNav = (): NavGroup[] => [
    {
      id: 'admin-dashboard',
      items: [
        { label: 'Dashboard Hệ thống', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      id: 'quan-tri',
      groupLabel: 'QUẢN TRỊ TRƯỜNG HỌC',
      items: [
        { label: 'Thông tin trường', path: '/admin/schools', icon: <GraduationCap className="w-4 h-4" /> },
        { label: 'Năm học & Khối môn', path: '/admin/academic-years', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Quản lý Lớp học', path: '/admin/classes', icon: <BookOpen className="w-4 h-4" /> },
        { label: 'Người dùng & Tài khoản', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
        { label: 'Phân quyền (RBAC)', path: '/admin/roles', icon: <ShieldCheck className="w-4 h-4" /> },
      ],
    },
    {
      id: 'van-hanh',
      groupLabel: 'VẬN HÀNH & AN TOÀN',
      items: [
        { label: 'Báo cáo toàn trường', path: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
        { label: 'Nhật ký Audit Log', path: '/admin/audit-logs', icon: <History className="w-4 h-4" /> },
        { label: 'Cấu hình & Sao lưu DB', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  let navGroups: NavGroup[] = [];
  if (currentRole === 'ADMIN') navGroups = getAdminNav();
  else if (currentRole === 'STUDENT') navGroups = getStudentNav();
  else if (currentRole === 'PARENT') navGroups = getParentNav();
  else navGroups = getTeacherNav();

  useEffect(() => {
    navGroups.forEach(g => {
      if (g.id && g.items.some(it => location.pathname.startsWith(it.path))) {
        setOpenGroups(prev => ({ ...prev, [g.id!]: true }));
      }
    });
  }, [location.pathname]);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 md:z-30 w-64 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col pt-16 ${
          isDark
            ? 'bg-[#071525]/95 backdrop-blur-xl border-r border-[#00E5FF]/20 text-[#EAFBFF]'
            : 'bg-white border-r border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {/* CLASSROOM NODE */}
          <div className={`px-2.5 pb-3 mb-1 border-b ${isDark ? 'border-[#00E5FF]/15' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span
                className={`font-orbitron text-[10px] font-bold tracking-[0.16em] uppercase ${
                  isDark ? 'text-[#00E5FF]' : 'text-sky-700'
                }`}
              >
                CLASSROOM NODE
              </span>
              <span
                className={`font-orbitron text-[10.5px] font-bold tabular-nums ${
                  isDark ? 'text-[#FF4D6D]' : 'text-rose-600'
                }`}
              >
                {activeClass?.studentCount || 32} HS
              </span>
            </div>
            <div
              className={`font-rajdhani text-lg font-bold mt-1 tracking-tight ${
                isDark ? 'text-[#EAFBFF]' : 'text-slate-900'
              }`}
            >
              Lớp {activeClass?.name || '10A1'}
            </div>
          </div>

          {navGroups.map((group, gIdx) => {
            const groupId = group.id || `group-${gIdx}`;
            const isGroupOpen = group.groupLabel ? (openGroups[groupId] ?? true) : true;

            return (
              <div
                key={groupId}
                className={`space-y-1 ${
                  gIdx > 1
                    ? isDark
                      ? 'pt-2 border-t border-[#00E5FF]/15'
                      : 'pt-2 border-t border-slate-100'
                    : ''
                }`}
              >
                {group.groupLabel && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupId)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-orbitron text-[10px] font-bold tracking-[0.16em] transition-colors group cursor-pointer ${
                      isDark
                        ? 'text-[#00E5FF] hover:text-[#EAFBFF] hover:bg-[#0A1B2D]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                    }`}
                  >
                    <span className="uppercase text-left">{group.groupLabel}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-rajdhani font-semibold ${isDark ? 'text-[#8BA9BC]' : 'text-slate-400'}`}>
                        ({group.items.length})
                      </span>
                      {isGroupOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 opacity-75 group-hover:opacity-100" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-75 group-hover:opacity-100" />
                      )}
                    </div>
                  </button>
                )}

                {isGroupOpen && (
                  <div className="space-y-0.5">
                    {group.items.map(item => {
                      const isSubMenuOpen = item.subItems ? (openSubMenus[item.path] ?? true) : false;

                      return (
                        <div key={item.path} className="space-y-0.5">
                          <NavLink
                            to={item.path}
                            end={!item.subItems}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `flex items-center justify-between px-3 py-2 text-[13px] transition-all duration-200 ${
                                isActive
                                  ? isDark
                                    ? 'hud-active-nav'
                                    : 'rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-xs'
                                  : isDark
                                  ? 'rounded-lg text-[#8BA9BC] hover:text-[#00E5FF] hover:bg-[#0A1B2D] font-medium'
                                  : 'rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100/70 font-medium'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={
                                      isActive
                                        ? isDark
                                          ? 'text-[#030B16]'
                                          : 'text-white'
                                        : isDark
                                        ? 'text-[#00E5FF]'
                                        : 'text-slate-500'
                                    }
                                  >
                                    {item.icon}
                                  </span>
                                  <span className="truncate">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.badge && (
                                    <span
                                      className={`font-orbitron text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        isActive
                                          ? isDark
                                            ? 'bg-[#030B16]/20 text-[#030B16]'
                                            : 'bg-white/20 text-white'
                                          : isDark
                                          ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/45'
                                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.subItems && (
                                    <button
                                      type="button"
                                      onClick={e => toggleSubMenu(e, item.path)}
                                      className="p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
                                      aria-label="Mở/đóng menu con"
                                    >
                                      {isSubMenuOpen ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </NavLink>

                          {item.subItems && isSubMenuOpen && (
                            <div className="pl-9 space-y-0.5 py-0.5">
                              {item.subItems.map(sub => {
                                const currentFull = `${location.pathname}${location.search}`;
                                const isSubActive = currentFull === sub.path;
                                return (
                                  <NavLink
                                    key={sub.path}
                                    to={sub.path}
                                    onClick={onClose}
                                    className={`block px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
                                      isSubActive
                                        ? isDark
                                          ? 'text-[#00E5FF] font-bold bg-[#0A1B2D] border border-[#00E5FF]/25'
                                          : 'text-blue-700 font-bold'
                                        : isDark
                                        ? 'text-[#8BA9BC] hover:text-[#EAFBFF] font-medium'
                                        : 'text-slate-500 hover:text-slate-900 font-medium'
                                    }`}
                                  >
                                    {sub.label}
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom signature matching EduTech STUDIO */}
        <div
          className={`px-3.5 py-3 border-t flex items-center gap-2.5 text-[11px] ${
            isDark
              ? 'border-[#00E5FF]/20 bg-[#030B16]/80 text-[#8BA9BC]'
              : 'border-slate-200 bg-slate-50/70 text-slate-600'
          }`}
        >
          <img
            src="/assets/aistudio/image_721c51fd.png"
            alt="EduTech STUDIO"
            className="w-8 h-8 rounded-full object-cover border border-[#00E5FF]/60 shrink-0"
          />
          <div className="min-w-0">
            <div className={`font-orbitron text-xs font-bold tracking-wider truncate ${isDark ? 'text-[#EAFBFF]' : 'text-slate-900'}`}>
              Edu<span className={isDark ? 'text-[#00E5FF]' : 'text-sky-600'}>Tech</span> STUDIO
            </div>
            <div className={`text-[10px] font-medium mt-0.5 truncate ${isDark ? 'text-[#00E5FF]' : 'text-sky-600'}`}>
              Kiến tạo game giáo dục · Lan tỏa tri thức
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
