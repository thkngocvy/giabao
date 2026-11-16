import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('teacher@smartclass.edu.vn');
  const [password, setPassword] = useState('123456');

  const demoAccounts = [
    {
      role: 'TEACHER' as UserRole,
      title: 'Giáo viên Chủ nhiệm',
      name: 'Cô Lê Thu Hà',
      desc: 'Quản lý lớp 9A1, điểm danh, chấm bài, nhập điểm, AI hỗ trợ',
      email: 'teacher@smartclass.edu.vn',
      path: '/teacher/dashboard',
      color: 'border-[#00E5F5]/40 hover:border-[#00E5F5] bg-[#0B0D19]',
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Quản trị viên (Admin)',
      name: 'Thầy Phạm Hải Đăng',
      desc: 'Quản lý toàn trường THCS Trưng Vương, phân quyền, môn học, audit log',
      email: 'admin@smartclass.edu.vn',
      path: '/admin/dashboard',
      color: 'border-[#A855F7]/40 hover:border-[#A855F7] bg-[#0B0D19]',
    },
    {
      role: 'STUDENT' as UserRole,
      title: 'Học sinh',
      name: 'Phạm Minh Nhật',
      desc: 'Xem lịch học, nộp bài tập toán, làm quiz trắc nghiệm, xem điểm',
      email: 'student@smartclass.edu.vn',
      path: '/student/dashboard',
      color: 'border-[#00D6A0]/40 hover:border-[#00D6A0] bg-[#0B0D19]',
    },
    {
      role: 'PARENT' as UserRole,
      title: 'Phụ huynh',
      name: 'Phạm Quốc Trung',
      desc: 'Theo dõi con Minh Nhật, xem chuyên cần, bài tập, nhắn tin với GV',
      email: 'parent@smartclass.edu.vn',
      path: '/parent/dashboard',
      color: 'border-[#F5E900]/40 hover:border-[#F5E900] bg-[#0B0D19]',
    },
  ];

  const handleQuickLogin = (acc: typeof demoAccounts[0]) => {
    switchRole(acc.role);
    showToast(`Đăng nhập thành công với vai trò ${acc.title}`, 'success');
    navigate(acc.path);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email);
    if (success) {
      showToast('Đăng nhập thành công!', 'success');
      navigate('/teacher/dashboard');
    } else {
      showToast('Email không tìm thấy trong hệ thống demo!', 'error');
    }
  };

  return (
    <div className="min-h-screen cyber-grid-bg bg-[#05080F] text-[#F5F7FF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-20 h-20 rounded-full overflow-hidden border-2 border-[#00E5F5]/75 shadow-[0_0_24px_rgba(0,229,245,0.35)] bg-[#070B14]">
          <img
            src="/assets/aistudio/image_721c51fd.png"
            alt="EduTech STUDIO"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="mt-4 font-orbitron text-2xl font-bold tracking-[0.06em] text-[#F5F7FF]">
          Edu<span className="text-[#00E5F5]">Tech</span>{' '}
          <span className="text-lg tracking-[0.2em] text-[#F5F7FF]">STUDIO</span>
        </h2>
        <p className="mt-1 text-sm text-[#00E5F5] font-medium">
          Kiến tạo game giáo dục · Lan tỏa tri thức
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        {/* Quick 1-click test roles grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-orbitron text-[11px] font-bold text-[#00E5F5] uppercase tracking-wider">
              Chọn vai trò trải nghiệm ngay (1-Click Demo)
            </span>
            <span className="text-xs text-[#A5B0C5]">Không cần gõ mật khẩu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {demoAccounts.map(acc => (
              <button
                key={acc.role}
                onClick={() => handleQuickLogin(acc)}
                className={`hud-panel text-left p-4 rounded-[3px] border transition-all duration-150 flex flex-col justify-between group cursor-pointer ${acc.color}`}
              >
                <div>
                  <div className="text-xs font-semibold text-[#A5B0C5]">{acc.title}</div>
                  <div className="font-rajdhani font-bold text-[#F5F7FF] text-base mt-0.5 group-hover:text-[#00E5F5] transition-colors">
                    {acc.name}
                  </div>
                  <div className="text-xs text-[#A5B0C5] mt-2 line-clamp-2 leading-relaxed">
                    {acc.desc}
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-[#183242] flex items-center justify-between text-xs font-semibold text-[#00E5F5]">
                  <span>Vào cổng ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="hud-panel bg-[#0B0D19] py-8 px-6 shadow-xl border border-[#183242] rounded-[3px] sm:px-10 max-w-md mx-auto">
          <form className="space-y-4" onSubmit={handleFormLogin}>
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FF]">
                Email tài khoản
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-[#183242] rounded-[3px] text-sm text-[#F5F7FF] bg-[#070B14] focus:outline-none focus:border-[#00E5F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F5F7FF]">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-[#183242] rounded-[3px] text-sm text-[#F5F7FF] bg-[#070B14] focus:outline-none focus:border-[#00E5F5]"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#A5B0C5]">
                <input type="checkbox" defaultChecked className="rounded-[2px] border-[#183242] bg-[#070B14] text-[#00E5F5]" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <span className="text-[#00E5F5] hover:underline cursor-pointer">Quên mật khẩu?</span>
            </div>

            <button
              type="submit"
              className="hud-chamfer-btn w-full flex justify-center py-2.5 px-4 text-sm font-extrabold text-[#05080F] bg-[#00E5F5] transition-all cursor-pointer"
            >
              Đăng nhập hệ thống
            </button>
          </form>

          <div className="mt-6 border-t border-[#183242] pt-4 text-center text-xs text-[#A5B0C5]">
            Hệ thống OmniClass hỗ trợ bảo mật xác thực & PostgreSQL RBAC.
          </div>
        </div>
      </div>
    </div>
  );
};
