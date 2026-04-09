import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = "", 
  hover = true,
  title,
  subtitle,
  icon: Icon,
  action,
  noPadding = false
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
    className={`
      relative overflow-hidden
      bg-white/10 dark:bg-zinc-900/40 
      backdrop-blur-xl backdrop-saturate-150
      border border-white/20 dark:border-white/10
      shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
      rounded-3xl
      ${className}
    `}
  >
    {/* Header if title or icon exists */}
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-purple-400" />}
          <div>
            <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">{title}</h3>
            {subtitle && <p className="text-[8px] text-white/30 uppercase mt-0.5 tracking-widest">{subtitle}</p>}
          </div>
        </div>
        {action && action}
      </div>
    )}
    
    {/* Subtle inner glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    <div className={`relative z-10 h-full ${noPadding ? '' : 'p-6'}`}>
      {children}
    </div>
  </motion.div>
);

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value, 
  size = 60, 
  strokeWidth = 6, 
  color = "text-primary",
  label,
  sublabel
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-white/10 dark:text-white/5"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            className={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold">{Math.round(value)}%</span>
        </div>
      </div>
      {(label || sublabel) && (
        <div className="text-center">
          {label && <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{label}</div>}
          {sublabel && <div className="text-[8px] text-white/30 uppercase mt-0.5">{sublabel}</div>}
        </div>
      )}
    </div>
  );
};
