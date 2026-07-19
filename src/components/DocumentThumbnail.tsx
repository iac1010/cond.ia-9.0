import React from 'react';
import { 
  FileText, ShieldCheck, Clock, CheckCircle2, 
  AlertCircle, Shield, Award, Calendar, Landmark
} from 'lucide-react';
import { DigitalFolderItem } from '../types';

interface DocumentThumbnailProps {
  item: DigitalFolderItem;
  size?: 'sm' | 'md' | 'lg';
}

export function DocumentThumbnail({ item, size = 'md' }: DocumentThumbnailProps) {
  // Configurar tamanhos
  const sizeClasses = {
    sm: 'w-20 h-28 text-[5px]',
    md: 'w-32 h-44 text-[7px]',
    lg: 'w-44 h-60 text-[9px]'
  };

  const isDark = true; // No DocumentManagement, o tema de fundo é escuro por padrão

  // Cores dinâmicas por categoria
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'assembleia': return 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30';
      case 'contratos': return 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30';
      case 'convivência': return 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30';
      case 'governança': return 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/30';
      default: return 'from-slate-500/20 to-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const catColor = getCategoryColor(item.category);

  return (
    <div className="relative group/thumb cursor-pointer">
      {/* Efeito de pilha de folhas (stacked paper) para realismo de alto padrão */}
      <div className="absolute inset-0 bg-white/5 dark:bg-zinc-800/20 rounded-2xl translate-x-1.5 translate-y-1.5 border border-white/5 shadow-md -z-10 transition-transform group-hover/thumb:translate-x-2.5 group-hover/thumb:translate-y-2.5" />
      <div className="absolute inset-0 bg-white/10 dark:bg-zinc-800/40 rounded-2xl translate-x-0.5 translate-y-0.5 border border-white/10 shadow-sm -z-10 transition-transform group-hover/thumb:translate-x-1.5 group-hover/thumb:translate-y-1.5" />

      {/* Folha Principal do Documento */}
      <div 
        className={`${sizeClasses[size]} relative bg-zinc-950 border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col justify-between overflow-hidden select-none select-none`}
      >
        {/* Marca d'água de fundo (Subtle Legal Stamp/Shield) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none scale-150 rotate-12">
          {item.category.toLowerCase() === 'contratos' ? (
            <Award className="w-full h-full text-white" />
          ) : item.category.toLowerCase() === 'assembleia' ? (
            <Landmark className="w-full h-full text-white" />
          ) : (
            <Shield className="w-full h-full text-white" />
          )}
        </div>

        {/* Linha brilhante no topo */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-60" />

        {/* Cabeçalho do Documento */}
        <div className="space-y-1 shrink-0">
          <div className="flex justify-between items-center text-[5px] text-white/40 tracking-wider font-mono">
            <span className="flex items-center gap-0.5">
              <FileText className="w-1.5 h-1.5 text-blue-400" />
              DOC-{item.id.slice(0, 4).toUpperCase()}
            </span>
            <span>{new Date(item.date).toLocaleDateString('pt-BR', { year: '2-digit', month: '2-digit' })}</span>
          </div>
          <div className="h-[0.5px] bg-white/10 w-full" />
        </div>

        {/* Conteúdo Simulado (Título e linhas de texto) */}
        <div className="flex-grow flex flex-col justify-center my-2 space-y-1.5">
          <h5 className="font-black text-white/95 leading-tight tracking-tight uppercase line-clamp-2 text-center text-[7px] md:text-[8px]">
            {item.title.replace('Assinatura: ', '')}
          </h5>
          
          {/* Parágrafos Simulados com variação de tamanho de linhas */}
          <div className="space-y-1 px-1 opacity-40">
            <div className="h-[2px] bg-white/20 w-full rounded-full" />
            <div className="h-[2px] bg-white/20 w-11/12 rounded-full" />
            <div className="h-[2px] bg-white/15 w-9/12 rounded-full" />
            
            {/* Cláusula Destacada */}
            <div className="my-1 py-0.5 px-1 border-l border-blue-500/30 bg-blue-500/5 rounded-r">
              <div className="h-[1.5px] bg-blue-400/40 w-10/12 rounded-full mb-0.5" />
              <div className="h-[1.5px] bg-blue-400/30 w-8/12 rounded-full" />
            </div>

            <div className="h-[2px] bg-white/20 w-10/12 rounded-full" />
            <div className="h-[2px] bg-white/15 w-6/12 rounded-full" />
          </div>
        </div>

        {/* Rodapé do Documento com Assinaturas & Selo ICP-Brasil */}
        <div className="space-y-1 shrink-0">
          <div className="h-[0.5px] bg-white/10 w-full mb-1" />
          <div className="flex justify-between items-end text-[5px] text-white/30 font-bold font-mono">
            
            {/* Campo de Assinaturas */}
            <div className="space-y-0.5">
              <div className="h-[1px] bg-white/20 w-8" />
              <span>Signatário</span>
            </div>

            {/* Selo ICP-Brasil / QR Code Simulado */}
            <div className="w-3.5 h-3.5 bg-white/10 rounded flex items-center justify-center p-0.5 border border-white/5">
              <div className="grid grid-cols-2 gap-[0.5px] w-full h-full">
                <div className="bg-white/80 rounded-[0.2px]" />
                <div className="bg-white/40 rounded-[0.2px]" />
                <div className="bg-white/30 rounded-[0.2px]" />
                <div className="bg-white/90 rounded-[0.2px]" />
              </div>
            </div>

          </div>
        </div>

        {/* OVERLAYS DE CARIMBO / ASSINADO */}
        {item.status === 'VALIDATED' && (
          <div className="absolute bottom-2.5 right-1 select-none pointer-events-none transform rotate-[-12deg] bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-1 py-0.5 rounded shadow-lg text-[6px] font-black tracking-widest uppercase flex items-center gap-0.5 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-1.5 h-1.5 text-emerald-400" />
            ASSINADO
          </div>
        )}

        {item.status === 'PENDING' && (
          <div className="absolute bottom-2.5 right-1 select-none pointer-events-none transform rotate-[8deg] bg-amber-500/10 border border-amber-500/50 text-amber-400 px-1 py-0.5 rounded shadow-lg text-[5px] font-black tracking-widest uppercase flex items-center gap-0.5">
            <Clock className="w-1.5 h-1.5 text-amber-400" />
            COLETANDO
          </div>
        )}

        {item.status === 'REJECTED' && (
          <div className="absolute bottom-2.5 right-1 select-none pointer-events-none transform rotate-[-5deg] bg-rose-500/10 border border-rose-500/50 text-rose-400 px-1 py-0.5 rounded shadow-lg text-[5px] font-black tracking-widest uppercase flex items-center gap-0.5">
            <AlertCircle className="w-1.5 h-1.5 text-rose-400" />
            RECUSADO
          </div>
        )}

      </div>
    </div>
  );
}
