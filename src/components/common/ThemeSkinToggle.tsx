import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

interface ThemeSkinToggleProps {
  showLabel?: boolean;
  className?: string;
  variant?: 'pill' | 'button';
}

export const ThemeSkinToggle: React.FC<ThemeSkinToggleProps> = ({
  showLabel = true,
  className = '',
  variant = 'pill',
}) => {
  const { theme, isDark, setTheme } = useTheme();
  const { showToast } = useToast();

  const handleSelect = (selectedTheme: 'dark' | 'light') => {
    if (theme === selectedTheme) return;
    setTheme(selectedTheme);
    showToast(
      selectedTheme === 'dark'
        ? 'Đã bật chế độ Tối (Cyber-HUD)'
        : 'Đã bật chế độ Sáng',
      'info'
    );
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => handleSelect(isDark ? 'light' : 'dark')}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-[3px] text-xs font-bold border transition-all cursor-pointer ${
          isDark
            ? 'bg-[#0B0D19] border-[#183242] text-[#00E5F5] hover:bg-[#10182B] hover:border-[#00E5F5]/80 shadow-[0_0_12px_rgba(0,229,245,0.12)]'
            : 'bg-white border-slate-300 text-slate-800 hover:border-sky-400 shadow-xs'
        } ${className}`}
        title={`Chuyển sang chế độ ${isDark ? 'Sáng' : 'Tối'}`}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-[#00E5F5]" />
            {showLabel && <span>Chế độ Sáng</span>}
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-sky-600" />
            {showLabel && <span>Chế độ Tối</span>}
          </>
        )}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-[3px] border transition-all select-none ${
        isDark
          ? 'bg-[#0B0D19] border-[#183242] shadow-[inset_0_1px_0_rgba(0,229,245,0.08)]'
          : 'bg-slate-100 border-slate-200 shadow-xs'
      } ${className}`}
      title="Chuyển chế độ giao diện Sáng / Tối"
    >
      <button
        type="button"
        onClick={() => handleSelect('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[11px] transition-all cursor-pointer ${
          !isDark
            ? 'bg-white text-sky-700 border border-sky-200 font-extrabold shadow-xs'
            : 'text-[#A5B0C5] hover:text-[#00E5F5] hover:bg-[#10182B] font-semibold border border-transparent'
        }`}
        title="Chế độ Sáng"
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-[#F5E900]'}`} />
        {showLabel && <span>Sáng</span>}
      </button>

      <button
        type="button"
        onClick={() => handleSelect('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[11px] transition-all cursor-pointer ${
          isDark
            ? 'bg-[#00E5F5] text-[#05080F] font-extrabold shadow-[0_0_12px_rgba(0,229,245,0.3)] border border-[#00E5F5]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 font-semibold border border-transparent'
        }`}
        title="Chế độ Tối (Cyber-HUD)"
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-[#05080F]' : 'text-slate-500'}`} />
        {showLabel && <span>Tối</span>}
      </button>
    </div>
  );
};
