import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { useTheme } from '../contexts/ThemeContext';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDark
        ? 'bg-[#030B16] text-[#EAFBFF] selection:bg-[#00E5FF] selection:text-[#030B16]'
        : 'bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white'
    }`}>
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} isDark={isDark} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDark={isDark} />
        <main className={`flex-1 md:pl-64 min-w-0 transition-colors duration-200 ${
          isDark ? 'cyber-grid-bg text-[#EAFBFF]' : 'bg-slate-50 text-slate-900'
        }`}>
          <div className="p-4 sm:p-5 lg:p-6 max-w-[1550px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
