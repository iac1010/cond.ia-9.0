import React from 'react';
import { TrendingUp, Target, MapPin, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export const CommercialMirror: React.FC = () => {
  const { sales } = useStore();
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status === 'SALE';
  });

  const monthlyProposals = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status === 'PROPOSAL';
  });

  const uniqueAreas = Array.from(new Set(sales.map(s => s.area))).filter(Boolean);

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white">Gestão Comercial</h3>
        </div>
        <button
          onClick={() => navigate('/commercial')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors group"
        >
          <Plus className="w-5 h-5 text-white/60 group-hover:text-white" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-white/40 mb-1">Vendas (Mês)</p>
          <p className="text-2xl font-bold text-white">{monthlySales.length}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-white">
            <TrendingUp className="w-3 h-3" />
            <span>Meta: 10</span>
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-white/40 mb-1">Propostas</p>
          <p className="text-2xl font-bold text-white">{monthlyProposals.length}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400">
            <Target className="w-3 h-3" />
            <span>Em negociação</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-3 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-white/60">Áreas Mapeadas</span>
        </div>
        <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[80px] custom-scrollbar">
          {uniqueAreas.length > 0 ? (
            uniqueAreas.map((area, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-[10px] text-purple-300"
              >
                {area}
              </span>
            ))
          ) : (
            <p className="text-[10px] text-white/20 italic">Nenhuma área registrada</p>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate('/commercial')}
        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 group"
      >
        Acessar Central Comercial
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
