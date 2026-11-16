import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth,
  size,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawSize = (size || maxWidth || 'lg').replace(/^max-w-/, '');
  const maxWidthClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };
  const resolvedClass = maxWidthClasses[rawSize] || (size?.startsWith('max-w-') ? size : 'max-w-lg');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`hud-panel bg-[#0B0D19] rounded-[3px] border border-[#183242] shadow-2xl w-full ${resolvedClass} max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150 text-[#F5F7FF]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#183242] bg-[#070B14]">
          <div>
            <h3 className="font-rajdhani text-lg font-bold text-[#F5F7FF] tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-[#00E5F5]/85 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#A5B0C5] hover:text-[#F5F7FF] p-1.5 rounded-[3px] hover:bg-[#10182B] border border-transparent hover:border-[#183242] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-[#00E5F5]" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
