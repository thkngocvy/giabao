import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showClock?: boolean;
}

const formatVietnameseDate = (date: Date): string => {
  const formatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatTime24 = (date: Date): string => {
  return date.toLocaleTimeString('vi-VN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  breadcrumbItems,
  showClock = true,
}) => {
  const { isDark } = useTheme();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!showClock) return;
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [showClock]);

  return (
    <div className="space-y-1.5 pb-1">
      {(breadcrumbItems && breadcrumbItems.length > 0) || showClock ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {breadcrumbItems && breadcrumbItems.length > 0 ? (
              <nav
              className={`flex items-center space-x-1.5 text-xs font-medium ${
                isDark ? 'text-[#8BA9BC]' : 'text-slate-500'
              }`}
              aria-label="Breadcrumb"
            >
              <Link
                to="/"
                className={`transition-colors flex items-center gap-1 ${
                  isDark ? 'hover:text-[#00E5FF]' : 'hover:text-sky-600'
                }`}
                title="Trang chủ"
              >
                <Home className={`w-3.5 h-3.5 ${isDark ? 'text-[#00E5FF]' : 'text-sky-600'}`} />
              </Link>
              {breadcrumbItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#1E4463]' : 'text-slate-300'}`} />
                  {item.href ? (
                    <Link
                      to={item.href}
                      className={`transition-colors ${
                        isDark ? 'hover:text-[#00E5FF]' : 'hover:text-sky-600'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        idx === breadcrumbItems.length - 1
                          ? isDark
                            ? 'text-[#00E5FF] font-semibold'
                            : 'text-sky-700 font-semibold'
                          : isDark
                          ? 'text-[#8BA9BC]'
                          : 'text-slate-500'
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          ) : (
            <div />
          )}

          {showClock && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs transition-all backdrop-blur-md ${
                isDark
                  ? 'bg-[#0A1B2D]/85 border-[#00E5FF]/25 shadow-[0_0_16px_rgba(0,229,255,0.1)]'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
              title="Thời gian thực hệ thống"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${
                  isDark
                    ? 'bg-[#00F5A0] shadow-[0_0_8px_#00F5A0]'
                    : 'bg-emerald-500'
                }`}
              />
              <Clock className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#00E5FF]' : 'text-sky-600'}`} />
              <span
                className={`font-orbitron text-[11px] font-bold tabular-nums tracking-wider ${
                  isDark ? 'text-[#00E5FF]' : 'text-sky-700'
                }`}
              >
                {formatTime24(now)}
              </span>
              <span className={isDark ? 'text-[#1E4463] select-none' : 'text-slate-300 select-none'}>|</span>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isDark ? 'text-[#8BA9BC]' : 'text-slate-600'
                }`}
              >
                {formatVietnameseDate(now)}
              </span>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 min-w-0">
          <h1
            className={`font-rajdhani text-2xl sm:text-[30px] font-bold tracking-tight leading-tight ${
              isDark ? 'text-[#EAFBFF]' : 'text-slate-900'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <span className={`text-xs font-medium ${isDark ? 'text-[#8BA9BC]' : 'text-slate-500'}`}>
              {subtitle}
            </span>
          )}
        </div>

        {action && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{action}</div>}
      </div>
    </div>
  );
};
