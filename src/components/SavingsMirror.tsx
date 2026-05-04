import React from 'react';
import { motion } from 'framer-motion';
import { SavingsGoal } from '../types';
import { Target, CheckCircle2, Plus, Trash2 } from 'lucide-react';

interface SavingsMirrorProps {
  goals: SavingsGoal[];
  className?: string;
  hideFooter?: boolean;
  showAll?: boolean;
  onAddMoney?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SavingsMirror({ 
  goals, 
  className = "", 
  hideFooter = false, 
  showAll = false,
  onAddMoney,
  onDelete
}: SavingsMirrorProps) {
  const displayGoals = showAll ? goals : goals.filter(g => g.status === 'IN_PROGRESS').slice(0, 3);
  
  return (
    <div className={`relative bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl overflow-hidden ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {displayGoals.length > 0 ? (
          displayGoals.map((goal, idx) => {
            const progress = Math.min(100, (goal.currentAmount / (goal.targetAmount || 1)) * 100);
            return (
              <motion.div 
                key={goal.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group relative"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/20 truncate">{goal.category || 'Objetivo'}</span>
                    <span className="text-[11px] font-black text-white group-hover:text-amber-400 transition-colors truncate">{goal.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onAddMoney && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddMoney(goal.id);
                        }}
                        className="p-1 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all"
                        title="Adicionar Dinheiro"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(goal.id);
                        }}
                        className="p-1 bg-rose-500/20 text-rose-400 rounded-md hover:bg-rose-500/40 transition-all"
                        title="Excluir Meta"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <div className={`p-1 rounded-md ${goal.status === 'COMPLETED' ? 'bg-white/10 text-white' : 'bg-amber-500/20 text-amber-400'}`}>
                      {goal.status === 'COMPLETED' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Target className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                    <span className="text-white/20">Progresso</span>
                    <span className="text-white/80">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.2 }}
                      className={`h-full rounded-full ${goal.status === 'COMPLETED' ? 'bg-white' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Atual</span>
                    <span className="text-[9px] font-bold text-white truncate">R$ {goal.currentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Meta</span>
                    <span className="text-[9px] font-bold text-white/40 truncate">R$ {goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 opacity-30">
            <Target className="w-16 h-16 mb-4 text-white/50" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-white/50 text-center">Nenhuma meta encontrada</span>
          </div>
        )}
      </div>
      
      {!hideFooter && displayGoals.length > 0 && (
        <div className="mt-8 flex items-center justify-between px-2 relative z-10 border-t border-white/5 pt-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute inset-0" />
              <div className="w-2 h-2 rounded-full bg-amber-400 relative" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Objetivos em Tempo Real</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
            {goals.filter(g => g.status === 'COMPLETED').length} Concluídas
          </div>
        </div>
      )}
    </div>
  );
}
