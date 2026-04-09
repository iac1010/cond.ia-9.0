import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  glass?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md', glass = false }: ModalProps) {
  if (!isOpen) return null;

  const bgClass = glass 
    ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white' 
    : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800';
  
  const titleClass = glass ? 'text-white' : 'text-zinc-900 dark:text-white';
  const closeBtnClass = glass ? 'hover:bg-white/10 text-white/50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400';

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${bgClass} rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} overflow-hidden flex flex-col max-h-[90vh] border transition-all animate-in fade-in zoom-in duration-200`}>
        <div className={`flex justify-between items-center p-8 border-b ${glass ? 'border-white/10' : 'border-zinc-50 dark:border-zinc-800'} shrink-0`}>
          <h2 className={`text-2xl font-black tracking-tight ${titleClass}`}>
            {title}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${closeBtnClass}`}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
