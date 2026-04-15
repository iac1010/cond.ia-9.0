import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Hammer, AlertTriangle, CheckCircle2, Clock, 
  TrendingUp, Building2, Bell, ArrowRight, Activity
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, 
  LineChart, Line, Tooltip as RechartsTooltip
} from 'recharts';
import { Ticket } from '../types';
import { safeFormatDate } from '../utils/dateUtils';

interface TicketsMirrorProps {
  tickets: Ticket[];
  className?: string;
  showLabel?: boolean;
  isEditMode?: boolean;
}

export function TicketsMirror({ tickets: allTickets, className = '', showLabel = true, isEditMode = false }: TicketsMirrorProps) {
  const navigate = useNavigate();
  const tickets = allTickets.filter(t => t.type !== 'TAREFA');
  // Data processing
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTickets = tickets.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const currentMonthCount = currentMonthTickets.length;
  const currentMonthConcluded = currentMonthTickets.filter(t => t.status === 'CONCLUIDO').length;
  const currentMonthPercent = currentMonthCount > 0 ? Math.round((currentMonthConcluded / currentMonthCount) * 100) : 0;

  const total = tickets.length;
  const concluded = tickets.filter(t => t.status === 'CONCLUIDO').length;
  const inProgress = tickets.filter(t => t.status === 'REALIZANDO' || t.status === 'AGUARDANDO_MATERIAL').length;
  const pending = tickets.filter(t => t.status === 'PENDENTE_APROVACAO' || t.status === 'APROVADO').length;
  
  const percentConcluded = total > 0 ? Math.round((concluded / total) * 100) : 0;

  const pieData = [
    { name: 'Concluídas', value: concluded, color: '#22c55e' },
    { name: 'Em Andamento', value: inProgress, color: '#3b82f6' },
    { name: 'Pendentes', value: pending, color: '#f59e0b' },
  ];

  // OS by Tower (Location)
  const towerDataMap = tickets.reduce((acc: any, t) => {
    const loc = t.location || 'Geral';
    if (!acc[loc]) acc[loc] = { name: loc, total: 0, concluded: 0 };
    acc[loc].total++;
    if (t.status === 'CONCLUIDO') acc[loc].concluded++;
    return acc;
  }, {});

  const towerData = Object.values(towerDataMap).map((d: any) => ({
    name: d.name,
    percent: Math.round((d.concluded / d.total) * 100),
    value: d.total
  })).slice(0, 3);

  // Real Weekly Flow
  const realWeeklyFlow = [...tickets]
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    })
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      day: safeFormatDate(t.date, { weekday: 'short' }).toUpperCase().replace('.', ''),
      task: t.title || 'Sem título',
      status: t.status === 'CONCLUIDO' ? 'Conc.' : t.status === 'REALIZANDO' || t.status === 'AGUARDANDO_MATERIAL' ? 'Em And.' : 'Pend.',
      color: t.status === 'CONCLUIDO' ? 'text-emerald-400' : t.status === 'REALIZANDO' || t.status === 'AGUARDANDO_MATERIAL' ? 'text-amber-400' : 'text-orange-400'
    }));

  // Line Chart Data (Mocked)
  const lineData = [
    { name: 'Seg', val: 400 },
    { name: 'Ter', val: 800 },
    { name: 'Qua', val: 600 },
    { name: 'Qui', val: 1100 },
    { name: 'Sex', val: 900 },
    { name: 'Sáb', val: 1400 },
    { name: 'Dom', val: 1200 },
  ];

  return (
    <div className={`relative bg-slate-900/70 backdrop-blur-[40px] border border-white/20 p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden text-white ${className}`}>
      {/* Glass Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      {/* Header */}
      {showLabel && (
        <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10 gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="p-2 md:p-2.5 bg-rose-500/20 rounded-xl md:rounded-2xl border border-rose-500/30 shadow-lg shadow-rose-500/10 shrink-0">
              <Hammer className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-white truncate">Gestão de OS</h3>
              <p className="text-[8px] md:text-[10px] text-white/80 font-bold uppercase tracking-widest truncate">Monitoramento Live</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/10 backdrop-blur-md shrink-0">
            <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
        {/* Column 1: General Situation */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-white/5 backdrop-blur-sm">
            <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white mb-3 md:mb-4 flex items-center gap-2 truncate">
              <Activity className="w-2.5 md:w-3 h-2.5 md:h-3" /> Situação Geral
            </h4>
            <div className="relative h-32 md:h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-black tracking-tighter">{percentConcluded}%</span>
                <span className="text-[6px] md:text-[7px] font-bold uppercase text-white/40 tracking-widest">Concluídas</span>
              </div>
            </div>
            <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[9px] md:text-[10px]">
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-white/60 font-bold uppercase tracking-tight truncate">{item.name}</span>
                  </div>
                  <span className="font-black text-white/90 shrink-0 ml-1">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-white/5 backdrop-blur-sm">
            <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white mb-2 md:mb-3 flex items-center gap-2 truncate">
              <Building2 className="w-2.5 md:w-3 h-2.5 md:h-3" /> OS por Torre
            </h4>
            <div className="space-y-2 md:space-y-3">
              {towerData.length > 0 ? towerData.map((tower) => (
                <div key={tower.name} className="space-y-1">
                  <div className="flex justify-between text-[8px] md:text-[9px] font-bold uppercase tracking-tight">
                    <span className="text-white/60 truncate mr-1">{tower.name}</span>
                    <span className="text-white shrink-0">{tower.percent}%</span>
                  </div>
                  <div className="h-1 md:h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${tower.percent}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    />
                  </div>
                </div>
              )) : (
                <p className="text-[8px] md:text-[10px] text-white/30 italic">Sem dados</p>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Detailed View & Chart */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-3xl p-4 border border-white/5 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Visão Detalhada</h4>
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 - (213.6 * currentMonthPercent) / 100}
                    className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black">{currentMonthPercent}%</span>
                </div>
              </div>
              <div className="w-full">
                <p className="text-[7px] font-black uppercase text-white/40 mb-0.5">OS no Mês Vigente</p>
                <p className="text-xl font-black text-white leading-tight">{currentMonthCount}</p>
                <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-1">
                  {currentMonthConcluded} Concluídas
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 mx-auto w-fit">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-[7px] font-black text-amber-400 uppercase">
                    {currentMonthTickets.filter(t => t.status !== 'CONCLUIDO').length} Pendentes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl p-4 border border-white/5 h-48">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-4">Soluções de OS (Dias)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <Line 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Weekly Flow & Alerts */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-4">Fluxo de OS Semanal</h4>
            <div className="space-y-1.5">
              {realWeeklyFlow.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditMode) {
                      navigate(`/tickets/${item.id}`);
                    }
                  }}
                  className={`flex items-center justify-between bg-white/5 p-1.5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group/item ${isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[7px] font-black text-white/30 uppercase w-5 shrink-0">{item.day}</span>
                    <span className="text-[8px] font-bold truncate text-white/80 group-hover/item:text-white transition-colors">{item.task}</span>
                  </div>
                  <span className={`text-[6px] font-black uppercase px-1 py-0.5 rounded-md bg-white/5 shrink-0 ml-1 ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
              {realWeeklyFlow.length === 0 && (
                <p className="text-[8px] text-white/30 italic text-center py-4">Nenhuma OS recente</p>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-4">Notificações & Alertas</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="p-2 bg-orange-500/20 rounded-xl h-fit">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/90 leading-tight">Baixo Nível de Água (Cisterna C)</p>
                  <p className="text-[8px] text-white/40 uppercase mt-0.5">Há 15 minutos</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl h-fit">
                  <Bell className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/90 leading-tight">Entrega de Material de Limpeza (23/03)</p>
                  <p className="text-[8px] text-white/40 uppercase mt-0.5">Agendado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-end relative z-10">
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors group">
          Ver Relatório Completo
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
