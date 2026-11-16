import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accentTone?: 'cyan' | 'emerald' | 'amber' | 'rose';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['accentTone']>, string> = {
  cyan: 'border-[#00E5F5]/45 bg-[#00E5F5]/10 text-[#00E5F5] shadow-[0_0_14px_rgba(0,229,245,0.16)]',
  emerald: 'border-[#00D6A0]/45 bg-[#00D6A0]/10 text-[#00D6A0] shadow-[0_0_14px_rgba(0,214,160,0.16)]',
  amber: 'border-[#F5E900]/50 bg-[#F5E900]/10 text-[#F5E900] shadow-[0_0_14px_rgba(245,233,0,0.16)]',
  rose: 'border-[#FF287A]/50 bg-[#FF287A]/10 text-[#FF287A] shadow-[0_0_14px_rgba(255,40,122,0.16)]',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accentTone = 'cyan',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`hud-panel bg-[#0B0D19] rounded-[3px] border border-[#183242] p-4 sm:p-5 transition-all duration-150 hover:border-[#00E5F5]/80 ${
        onClick ? 'cursor-pointer group' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[13px] font-medium text-[#A5B0C5] leading-snug line-clamp-2 pt-0.5">
          {label}
        </span>
        {icon && (
          <div
            className={`hud-chamfer-icon w-9 h-9 border flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${TONE_CLASSES[accentTone]}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="font-rajdhani text-[34px] font-bold tracking-tight text-[#F5F7FF] tabular-nums leading-none">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.isPositive ? 'text-[#00D6A0]' : 'text-[#FF287A]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-3 text-xs text-[#A5B0C5] truncate font-medium">
          {subtext}
        </div>
      )}
    </div>
  );
};
