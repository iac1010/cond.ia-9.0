import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'red' | 'blue' | 'emerald' | 'orange' | 'indigo';
  subtitle?: string;
}

const colorStyles = {
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

const iconBgStyles = {
  red: 'bg-red-600',
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-600',
  orange: 'bg-orange-600',
  indigo: 'bg-indigo-600',
};

const subtitleColorStyles = {
  red: 'text-red-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  orange: 'text-orange-600',
  indigo: 'text-indigo-600',
};

export function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 card-shadow flex flex-col gap-6 transition-all hover:translate-y-[-4px]">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBgStyles[color]} shadow-lg shadow-current/20`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-4xl font-black text-zinc-900 tracking-tighter mb-1">{value}</p>
        <p className="text-sm text-zinc-500 font-bold leading-tight">{title}</p>
        {subtitle && (
          <p className={`text-[10px] font-black uppercase tracking-widest ${subtitleColorStyles[color]} mt-3 flex items-center gap-1`}>
            <span className="w-1 h-1 rounded-full bg-current"></span>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
