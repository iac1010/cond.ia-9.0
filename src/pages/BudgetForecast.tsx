import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { BudgetForecast as BudgetForecastType } from '../types';
import { 
  Brain, TrendingUp, TrendingDown, Calendar, DollarSign, 
  AlertCircle, Loader2, RefreshCw, BarChart3, PieChart as PieChartIcon,
  Search, Filter, LayoutGrid, List, Share2, Settings as SettingsIcon,
  Home, FolderOpen, PieChart, ChevronRight, MoreHorizontal,
  Building2, XCircle, ArrowLeft, Bell, FileText, Target, ShieldCheck,
  Zap, Lightbulb, Activity, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line, 
  PieChart as RechartsPieChart, Cell, Pie, AreaChart, Area 
} from 'recharts';
import { toast } from 'react-hot-toast';

import { GlassCard, CircularProgress } from '../components/GlassUI';

export default function BudgetForecast() {
  const navigate = useNavigate();
  const { budgetForecasts, costs, generateBudgetForecastWithAI, addBudgetForecast } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<BudgetForecastType | null>(budgetForecasts[0] || null);

  const handleGenerateForecast = async () => {
    setIsGenerating(true);
    try {
      // Get last 50 costs for context
      const historicalData = costs
        .slice(-50)
        .map(c => ({
          date: c.date,
          category: c.category,
          amount: c.value,
          description: c.description
        }));

      const forecast = await generateBudgetForecastWithAI(historicalData);
      if (forecast) {
        addBudgetForecast(forecast);
        setSelectedForecast(forecast);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar previsão. Verifique sua chave de API.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (budgetForecasts.length > 0 && !selectedForecast) {
      setSelectedForecast(budgetForecasts[0]);
    }
  }, [budgetForecasts, selectedForecast]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const totalForecastValue = useMemo(() => {
    if (!selectedForecast) return 0;
    return selectedForecast.monthlyProjections.reduce((acc, curr) => acc + curr.value, 0);
  }, [selectedForecast]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative flex flex-col p-4 md:p-8 font-sans -m-8"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
    >
      {/* Heavy blur overlay */}
      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />

      {/* Header Section */}
      <header className="relative z-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-8">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="p-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-white/50 group-hover:text-white" />
          </motion.button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400/60">AI Financial Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">Cérebro Financeiro</h1>
            <p className="text-sm text-white/40 mt-2 font-light max-w-md leading-relaxed">
              Análise preditiva de custos e projeções orçamentárias inteligentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex bg-white/5 p-1 rounded-2xl backdrop-blur-md border border-white/10">
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl text-white/40 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <Home className="w-4 h-4" /> Geral
            </button>
            <button 
              onClick={() => navigate('/financial')}
              className="px-6 py-3 rounded-xl text-white/40 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <DollarSign className="w-4 h-4" /> Financeiro
            </button>
            <button 
              className="px-6 py-3 rounded-xl bg-white/10 text-white shadow-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <Brain className="w-4 h-4" /> Cérebro
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="px-6 py-3 rounded-xl text-white/40 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <SettingsIcon className="w-4 h-4" /> Config
            </button>
          </nav>
          
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateForecast}
            disabled={isGenerating}
            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-8 py-4 flex items-center gap-3 border border-purple-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(168,85,247,0.1)] disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            <span>{isGenerating ? 'Processando...' : 'Gerar Nova Previsão'}</span>
          </motion.button>
        </div>
      </header>

      {!selectedForecast && !isGenerating ? (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <GlassCard className="max-w-xl text-center p-12">
            <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
              <Brain className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Nenhuma Previsão Ativa</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Nossa Inteligência Artificial pode analisar seus gastos históricos para prever o futuro financeiro do condomínio com alta precisão.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateForecast}
              className="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
            >
              Iniciar Análise IA
            </motion.button>
          </GlassCard>
        </div>
      ) : selectedForecast ? (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          
          {/* Left Column - Key Metrics & AI Insights */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard title="Situação Orçamentária" icon={Activity}>
              <div className="flex justify-around items-center py-4">
                <CircularProgress 
                  value={Math.round(selectedForecast.confidence * 100)} 
                  label="Confiança" 
                  sublabel="Precisão IA" 
                  color="purple" 
                />
                <CircularProgress 
                  value={95} 
                  label="Orçamento" 
                  sublabel="Utilização" 
                  color="emerald" 
                />
              </div>
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Projetado</span>
                  </div>
                  <span className="text-lg font-black text-white">
                    R$ {totalForecastValue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Período</span>
                  </div>
                  <span className="text-lg font-black text-white">6 Meses</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Cérebro Financeiro: Insights" icon={Lightbulb}>
              <div className="space-y-4">
                {selectedForecast.insights.map((insight, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="mt-1">
                      {insight.toLowerCase().includes('reduz') || insight.toLowerCase().includes('econom') ? (
                        <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                          <TrendingDown className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                          <TrendingUp className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium group-hover:text-white transition-colors">
                      {insight}
                    </p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Center Column - Charts & Projections */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <GlassCard title="Projeção Mensal de Custos" icon={BarChart3} className="md:col-span-8">
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedForecast.monthlyProjections}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
                        tickFormatter={(value) => `R$ ${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Previsto']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard title="Agenda de Pagamentos" icon={Calendar} className="md:col-span-4">
                <div className="space-y-3 mt-2">
                  {[
                    { day: 'Seg', title: 'Aviso Seg (Elevador A)', status: 'Conc.', color: 'blue' },
                    { day: 'Ter', title: 'Aluguel Ter (Cozinha)', status: 'Em And.', color: 'amber' },
                    { day: 'Qua', title: 'Segurança Qui', status: 'Em And.', color: 'amber' },
                    { day: 'Qui', title: 'Segurança Qui', status: 'Conc.', color: 'blue' },
                    { day: 'Sex', title: 'Piscina A', status: 'Em And.', color: 'amber' },
                    { day: 'Sab', title: 'Elevador A', status: 'Conc.', color: 'blue' },
                    { day: 'Dom', title: 'Bomba 2', status: 'Pend.', color: 'rose' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-white/30 uppercase w-6">{item.day}</span>
                        <span className="text-[11px] text-white/70 font-medium truncate max-w-[100px]">{item.title}</span>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${
                        item.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                        item.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard title="Obras por Torre (Gasto vs. Orçado)" icon={Building2} className="md:col-span-4">
                <div className="h-[180px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Torre A', value: 98 },
                      { name: 'Torre B', value: 92 },
                      { name: 'Torre C', value: 94 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value}%`, 'Utilização']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : '#3b82f6'} fillOpacity={0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-between text-[8px] font-black text-white/30 uppercase tracking-widest">
                  <span>Torre A: 98%</span>
                  <span>Torre B: 92%</span>
                  <span>Torre C: 94%</span>
                </div>
              </GlassCard>

              <GlassCard title="Distribuição por Categoria" icon={PieChartIcon} className="md:col-span-4">
                <div className="h-[180px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={selectedForecast.categories}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={8}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {selectedForecast.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {selectedForecast.categories.slice(0, 4).map((cat, index) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider truncate">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard title="Filtros & Modelos" icon={Filter} className="md:col-span-4">
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-500/20 transition-all">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white/70 uppercase tracking-widest">Filtro: Vencidos</div>
                      <div className="text-[8px] text-white/30 uppercase font-bold">Ativos no Sistema</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-500/20 transition-all">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white/70 uppercase tracking-widest">Modelo: Aditivo</div>
                      <div className="text-[8px] text-white/30 uppercase font-bold">Contrato de Prestação</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl group-hover:bg-purple-500/20 transition-all">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white/70 uppercase tracking-widest">Modelo: Prestação</div>
                      <div className="text-[8px] text-white/30 uppercase font-bold">Serviço de Terceiros</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Bottom Section - Technical Alerts */}
            <GlassCard title="Alertas de Risco & Notificações" icon={Bell}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl group hover:bg-rose-500/10 transition-all">
                  <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Alerta Crítico</div>
                    <div className="text-[11px] text-white/60 font-medium">Possível estouro de orçamento em Manutenção (Torre B)</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl group hover:bg-amber-500/10 transition-all">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Tendência de Alta</div>
                    <div className="text-[11px] text-white/60 font-medium">Aumento projetado de 12% nos custos de energia</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}
