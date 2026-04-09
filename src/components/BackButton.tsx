import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: 'glass' | 'minimal' | 'solid';
  className?: string;
  iconSize?: number;
  onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  to = '/', 
  label, 
  variant = 'glass',
  className = '',
  iconSize = 8,
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  const iconClass = `w-${iconSize} h-${iconSize}`;

  if (variant === 'minimal') {
    return (
      <button 
        onClick={handleClick}
        className={`flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group ${className}`}
        aria-label={label || "Voltar"}
      >
        <ArrowLeft className={`w-5 h-5 group-hover:-translate-x-1 transition-transform`} />
        {label && <span className="text-sm font-black uppercase tracking-widest">{label}</span>}
      </button>
    );
  }

  if (variant === 'solid') {
    return (
      <button 
        onClick={handleClick}
        className={`p-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-95 ${className}`}
        aria-label={label || "Voltar"}
      >
        <ArrowLeft className={iconClass} />
      </button>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className={`p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white border border-white/10 backdrop-blur-md shadow-xl active:scale-95 ${className}`}
      aria-label={label || "Voltar"}
    >
      <ArrowLeft className={iconClass} />
    </button>
  );
};
