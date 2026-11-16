import React from 'react';

interface OmniClassLogoProps {
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

export const OmniClassLogo: React.FC<OmniClassLogoProps> = ({ size = 'md', isDark = true }) => {
  const dimensions =
    size === 'lg'
      ? 'w-16 h-16'
      : size === 'sm'
      ? 'w-7 h-7'
      : 'w-9 h-9';

  return (
    <div
      className={`${dimensions} rounded-[3px] flex items-center justify-center shrink-0 border transition-transform ${
        isDark
          ? 'bg-[#070B14] border-[#183242] shadow-[0_0_16px_rgba(0,229,245,0.22)]'
          : 'bg-sky-50 border-sky-200 shadow-xs'
      }`}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[78%] h-[78%]"
      >
        {/* Outer Cyan Hexagon */}
        <polygon
          points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5"
          stroke={isDark ? '#00E5F5' : '#0284C7'}
          strokeWidth="2.2"
          fill={isDark ? 'rgba(0, 229, 245, 0.06)' : 'rgba(2, 132, 199, 0.08)'}
        />
        {/* Inner Pink Hexagon */}
        <polygon
          points="20,9.5 29.5,15 29.5,25 20,30.5 10.5,25 10.5,15"
          stroke={isDark ? '#FF287A' : '#E11D48'}
          strokeWidth="1.8"
          fill="none"
        />
        {/* Glowing Core Node */}
        <circle
          cx="20"
          cy="20"
          r="2.8"
          fill={isDark ? '#00E5F5' : '#0284C7'}
        />
      </svg>
    </div>
  );
};
