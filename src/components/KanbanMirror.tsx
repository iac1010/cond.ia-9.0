import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, TicketStatus } from '../types';

const COLUMNS: { id: TicketStatus; color: string }[] = [
  { id: 'APROVADO', color: 'text-blue-400' },
  { id: 'AGUARDANDO_MATERIAL', color: 'text-amber-400' },
  { id: 'REALIZANDO', color: 'text-purple-400' },
  { id: 'CONCLUIDO', color: 'text-white' },
];

interface KanbanMirrorProps {
  tickets: Ticket[];
  className?: string;
  onColumnClick?: (columnId: TicketStatus) => void;
  showLabel?: boolean;
  isEditMode?: boolean;
}

export function KanbanMirror({ tickets, className = '', onColumnClick, showLabel = true, isEditMode = false }: KanbanMirrorProps) {
  return (
    <div className={`relative bg-slate-900/40 backdrop-blur-2xl border border-white/20 p-3 md:p-5 rounded-3xl md:rounded-[2.2rem] shadow-2xl overflow-hidden ${className}`}>
      {/* Glass Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="flex gap-2 md:gap-4 h-24 md:h-28 relative z-10">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter(t => (t.status || 'APROVADO') === col.id);
          return (
            <div 
              key={col.id} 
              className={`flex-1 flex flex-col gap-1.5 md:gap-2 group/col min-w-0 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isEditMode) {
                  onColumnClick?.(col.id);
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className={`h-1 md:h-1.5 rounded-full ${col.color.replace('text-', 'bg-')} shadow-[0_0_10px_rgba(255,255,255,0.1)] opacity-60 group-hover/col:opacity-100 transition-all`} />
              <div className="flex-1 bg-white/5 rounded-xl md:rounded-2xl p-1.5 md:p-2 flex flex-col gap-1 md:gap-1.5 border border-white/5 group-hover/col:bg-white/10 transition-colors overflow-hidden">
                {colTickets.slice(0, 8).map(t => (
                  <motion.div 
                    key={t.id}
                    layoutId={`mini-${t.id}`}
                    className={`h-1 md:h-1.5 w-full rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all ${
                      t.type === 'TAREFA' 
                        ? 'bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]' 
                        : `${col.color.replace('text-', 'bg-')} shadow-[0_0_12px_rgba(255,255,255,0.3)]`
                    }`}
                  />
                ))}
                {colTickets.length > 8 && (
                  <div className="mt-auto flex justify-center">
                    <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/20" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {showLabel && (
        <div className="mt-3 md:mt-5 flex justify-between items-center px-1 relative z-10 gap-2">
          <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-ping absolute inset-0" />
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white relative" />
            </div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-white/50 truncate">Board Mirror</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[8px] md:text-[10px] font-black text-white/80 bg-white/10 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-lg border border-white/10 backdrop-blur-md">
              {tickets.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
