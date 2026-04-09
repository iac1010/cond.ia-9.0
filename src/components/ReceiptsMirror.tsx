import React from 'react';
import { motion } from 'framer-motion';
import { Receipt } from '../types';
import { TrendingUp, FileCheck } from 'lucide-react';

interface ReceiptsMirrorProps {
  receipts: Receipt[];
  className?: string;
  hideFooter?: boolean;
}

export function ReceiptsMirror({ receipts, className = "", hideFooter = false }: ReceiptsMirrorProps) {
  const recentReceipts = [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  const maxAmount = Math.max(...recentReceipts.map(r => r.value), 1);
  
  return (
    <div className={`relative bg-slate-900/40 backdrop-blur-2xl border border-white/20 p-3 md:p-5 rounded-3xl md:rounded-[2.2rem] shadow-2xl overflow-hidden ${className}`}>
      {/* Glass Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col gap-2 md:gap-3 relative z-10">
        {recentReceipts.length > 0 ? (
          recentReceipts.map((receipt, idx) => {
            const width = (receipt.value / maxAmount) * 100;
            return (
              <div key={receipt.id} className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <FileCheck className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
                </div>
                <div className="flex-1 flex flex-col gap-0.5 md:gap-1 min-w-0">
                  <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black uppercase tracking-wider text-white/60 gap-2">
                    <span className="truncate">{receipt.description}</span>
                    <span className="text-emerald-400 shrink-0">R$ {receipt.value.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-0.5 md:h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-2 md:py-4 opacity-30">
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 mb-1 md:mb-2 text-white/50" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-white/50">Sem receitas</span>
          </div>
        )}
      </div>
      
      {!hideFooter && (
        <div className="mt-3 md:mt-4 flex items-center gap-2 md:gap-2.5 px-1 relative z-10">
          <div className="relative shrink-0">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 relative" />
          </div>
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-white/50 truncate">Fluxo de Entrada</span>
        </div>
      )}
    </div>
  );
}
