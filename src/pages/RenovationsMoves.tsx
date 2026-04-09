import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Plus, Search, Hammer, Truck, Calendar, User, CheckCircle2, 
  AlertCircle, UserPlus, TrendingUp, Clock, AlertTriangle, 
  Filter, LayoutGrid, List, Share2, Settings as SettingsIcon,
  Home, FolderOpen, PieChart, ChevronRight, MoreHorizontal,
  Building2, XCircle, ArrowLeft, Bell, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, eachDayOfInterval, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Modal } from '../components/Modal';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

import { GlassCard, CircularProgress } from '../components/GlassUI';

export default function RenovationsMoves() {
  const navigate = useNavigate();
  const { renovations, moves, clients, addRenovation, updateRenovation, deleteRenovation, addMove, updateMove, deleteMove, addClient } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'RENOVATIONS' | 'MOVES'>('RENOVATIONS');
  const [isAddingResident, setIsAddingResident] = useState(false);
  
  // Stats calculation
  const totalTasks = renovations.length + moves.length;
  const completedRenovations = renovations.filter(r => r.status === 'COMPLETED').length;
  const pendingRenovations = renovations.filter(r => r.status === 'PENDING').length;
  const pendingMoves = moves.filter(m => m.status === 'PENDING').length;

  const renovationCompletionRate = renovations.length > 0 ? Math.round((completedRenovations / renovations.length) * 100) : 0;
  
  // Chart Data Generation
  const chartData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(date => ({
      name: format(date, 'EEE', { locale: ptBR }),
      obras: renovations.filter(r => isSameDay(new Date(r.startDate), date)).length,
      mudancas: moves.filter(m => isSameDay(new Date(m.date), date)).length,
    }));
  }, [renovations, moves]);

  const towerData = useMemo(() => {
    const towers = Array.from(new Set(clients.map(c => c.tower).filter(Boolean))).sort();
    return towers.map(tower => {
      const towerClients = clients.filter(c => c.tower === tower);
      const towerRenovations = renovations.filter(r => towerClients.some(c => c.id === r.clientId));
      const completed = towerRenovations.filter(r => r.status === 'COMPLETED').length;
      const rate = towerRenovations.length > 0 ? Math.round((completed / towerRenovations.length) * 100) : 0;
      return { name: `Torre ${tower}`, rate };
    }).slice(0, 3); // Limit to 3 for the chart as in the image
  }, [clients, renovations]);

  const [newRenovation, setNewRenovation] = useState({
    clientId: '',
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'PENDING' as const,
    technicianName: ''
  });

  const [newMove, setNewMove] = useState({
    clientId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'IN' as 'IN' | 'OUT',
    status: 'PENDING' as const,
    notes: ''
  });

  const handleAddRenovation = () => {
    if (!newRenovation.clientId || !newRenovation.title) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    addRenovation(newRenovation);
    setIsAdding(false);
    setNewRenovation({ clientId: '', title: '', description: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd'), status: 'PENDING', technicianName: '' });
  };

  const handleAddMove = () => {
    if (!newMove.clientId) {
      toast.error('Selecione um morador');
      return;
    }
    addMove(newMove);
    setIsAdding(false);
    setNewMove({ clientId: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'IN', status: 'PENDING', notes: '' });
  };

  return (
    <div className="min-h-screen -m-6 md:-m-8 p-6 md:p-10 relative overflow-hidden bg-zinc-950">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=2000" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-blue-950/20" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">
        {/* Modern Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Hammer className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Quadros de Gestão Predial</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-blue-400/80 text-sm font-medium">Gestão Central de Obras e Mudanças</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-white/40 text-sm">{format(new Date(), "EEEE, dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
            {[
              { icon: Home, label: 'Início', path: '/' },
              { icon: LayoutGrid, label: 'Visão Geral', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
              { icon: Building2, label: 'Moradores', path: '/clients' },
              { icon: Truck, label: 'Mudanças', onClick: () => setActiveTab('MOVES') },
              { icon: PieChart, label: 'Análise', onClick: () => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' }) },
              { icon: SettingsIcon, label: 'Configurações', path: '/settings' },
            ].map((item: any, i) => (
              <button 
                key={i}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  if (item.onClick) item.onClick();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  item.label === 'Visão Geral' && activeTab === 'RENOVATIONS'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="text-right">
              <div className="text-sm font-bold text-white">Olá, Carlos!</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-black">Administrador</div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/50 p-0.5">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="User" 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </motion.header>

        {/* Bento Grid Content */}
        <div id="stats-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Stats & Towers */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard title="SITUAÇÃO GERAL (Obras & Mudanças)" icon={TrendingUp}>
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">TOTAL DE TAREFAS: <span className="text-emerald-400">95%</span></div>
                <CircularProgress 
                  value={95} 
                  label="TOTAL DE TAREFAS" 
                  sublabel="Meta de Conclusão 98%"
                  color="emerald"
                />
                <div className="w-full space-y-2 mt-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-white/70">Obras Prédio (Conc.):</span>
                    </div>
                    <span className="text-emerald-400">95%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-white/70">Obras Apts (Em And.):</span>
                    </div>
                    <span className="text-blue-400">3%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-white/70">Mudanças (Pend.):</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400">2%</span>
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="OBRAS POR TORRE (% CONCLUÍDA)" icon={Building2}>
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={towerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#ffffff40', fontSize: 10 }} 
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={40}>
                      {towerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#0ea5e9'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4">
                {towerData.map((t, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[10px] font-bold text-white/40 uppercase">{t.name}</div>
                    <div className="text-sm font-bold text-white">{t.rate}%</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Charts & Alerts */}
          <div className="lg:col-span-8 space-y-6">
            <GlassCard title="ESTATÍSTICAS & FLUXOS GERAIS" icon={TrendingUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">CRONOGRAMA DE ATIVIDADES (DIAS)</div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorObras" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMud" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#ffffff40', fontSize: 10 }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="obras" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorObras)" 
                          strokeWidth={3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="mudancas" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorMud)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">98%</div>
                    <div className="text-[10px] font-bold text-white/70 uppercase">TMD TOTAL (Tempo Médio de Renovação): 98%</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">AGENDA DE MUDANÇAS (SEMANAL)</div>
                  <div className="space-y-2">
                    {[
                      { day: 'Seg', label: 'Fornecedor A', status: 'Concl.', color: 'emerald' },
                      { day: 'Ter', label: 'Locação B', status: 'Concl.', color: 'emerald' },
                      { day: 'Qua', label: 'Cisterna C', status: 'Em And.', color: 'amber' },
                      { day: 'Qui', label: 'Cisterna C', status: 'Concl.', color: 'emerald' },
                      { day: 'Sex', label: 'Piscina A', status: 'Em And.', color: 'amber' },
                      { day: 'Sab', label: 'Elevador A', status: 'Pend.', color: 'white' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-white/40 uppercase w-8">{item.day}</span>
                          <span className="text-xs font-bold text-white/80">{item.label}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                          item.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 
                          item.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/40'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">TAREFAS CRÍTICAS: R$ 4.500 (1 OS em atraso)</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard title="NOTIFICAÇÕES & ALERTAS TÉCNICOS" icon={AlertCircle}>
                <div className="space-y-4">
                  {[
                    { type: 'Alerta', msg: 'Baixo Nível de Água (Cisterna C)', color: 'amber' },
                    { type: 'Alerta', msg: 'Temperatura Elevada Bomba 2', color: 'amber' },
                    { type: 'Notificação', msg: 'Entrega de Material de...', color: 'blue' },
                    { type: 'Pasta', msg: 'Entrega de Material de Limpeza (23/03)', color: 'white' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        item.color === 'amber' ? 'bg-amber-500/20' : 
                        item.color === 'blue' ? 'bg-blue-500/20' : 'bg-white/10'
                      }`}>
                        {item.color === 'amber' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : 
                         item.color === 'blue' ? <Bell className="w-5 h-5 text-blue-500" /> : 
                         <FolderOpen className="w-5 h-5 text-white/40" />}
                      </div>
                      <div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${
                          item.color === 'amber' ? 'text-amber-500' : 
                          item.color === 'blue' ? 'text-blue-500' : 'text-white/40'
                        }`}>{item.type}:</div>
                        <div className="text-sm font-bold text-white">{item.msg}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard title="FILTROS & MODELOS POPULARES" icon={Filter}>
                <div className="space-y-3">
                  {[
                    { icon: Filter, label: 'Filtro:', sub: 'Vencidos / Ativos' },
                    { icon: FolderOpen, label: 'Modelo:', sub: 'Aditivo Contratual' },
                    { icon: FileText, label: 'Modelo:', sub: 'Contrato de Prestação de Serviço' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.label}</div>
                        <div className="text-sm font-bold text-white">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Solicitação
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text" 
              placeholder="Buscar por morador ou título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabs for Detailed Lists */}
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('RENOVATIONS')}
            className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'RENOVATIONS' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            Obras e Reformas
          </button>
          <button
            onClick={() => setActiveTab('MOVES')}
            className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'MOVES' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            Mudanças
          </button>
        </div>

        {/* Detailed List Section */}
        <GlassCard title={activeTab === 'RENOVATIONS' ? "Lista de Obras e Reformas" : "Lista de Mudanças"} icon={List}>
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === 'RENOVATIONS' ? (
                <motion.div
                  key="renovations"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {renovations.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map((renovation) => {
                    const client = clients.find(c => c.id === renovation.clientId);
                    return (
                      <div key={renovation.id} className="group flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Hammer className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{renovation.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-xs text-white/40 font-medium">
                                <User className="w-3 h-3" />
                                {client?.name} ({client?.tower}{client?.unit})
                              </div>
                              <div className="w-1 h-1 bg-white/10 rounded-full" />
                              <div className="flex items-center gap-1 text-xs text-white/40 font-medium">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(renovation.startDate), 'dd/MM/yy')}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right">
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                              renovation.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 
                              renovation.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' : 
                              renovation.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {renovation.status}
                            </span>
                            <div className="text-[8px] text-white/20 uppercase font-black tracking-widest mt-1">Status da Obra</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {renovation.status === 'PENDING' && (
                              <button onClick={() => updateRenovation(renovation.id, { status: 'APPROVED' })} className="p-2 text-white/20 hover:text-emerald-400 transition-colors">
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                            )}
                            <button onClick={() => deleteRenovation(renovation.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="moves"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {moves.filter(m => clients.find(c => c.id === m.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())).map((move) => {
                    const client = clients.find(c => c.id === move.clientId);
                    return (
                      <div key={move.id} className="group flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${move.type === 'IN' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                            <Truck className={`w-6 h-6 ${move.type === 'IN' ? 'text-emerald-400' : 'text-amber-400'}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                              Mudança de {move.type === 'IN' ? 'Entrada' : 'Saída'}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-xs text-white/40 font-medium">
                                <User className="w-3 h-3" />
                                {client?.name} ({client?.tower}{client?.unit})
                              </div>
                              <div className="w-1 h-1 bg-white/10 rounded-full" />
                              <div className="flex items-center gap-1 text-xs text-white/40 font-medium">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(move.date), 'dd/MM/yy')}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right">
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                              move.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 
                              move.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' : 
                              move.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {move.status}
                            </span>
                            <div className="text-[8px] text-white/20 uppercase font-black tracking-widest mt-1">Status do Agendamento</div>
                          </div>

                          <div className="flex items-center gap-2">
                            {move.status === 'PENDING' && (
                              <button onClick={() => updateMove(move.id, { status: 'APPROVED' })} className="p-2 text-white/20 hover:text-emerald-400 transition-colors">
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                            )}
                            <button onClick={() => deleteMove(move.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={activeTab === 'RENOVATIONS' ? "Cadastrar Solicitação de Obra" : "Agendar Mudança"}
      >
        <div className="space-y-4">
          {activeTab === 'RENOVATIONS' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Morador / Unidade</label>
                <select
                  value={newRenovation.clientId}
                  onChange={(e) => setNewRenovation({ ...newRenovation, clientId: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="" className="bg-zinc-900">Selecione um morador</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-zinc-900">{c.name} - Apto {c.unit}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Título da Obra</label>
                <input
                  type="text"
                  value={newRenovation.title}
                  onChange={(e) => setNewRenovation({ ...newRenovation, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ex: Reforma da Cozinha"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Data Início</label>
                <input
                  type="date"
                  value={newRenovation.startDate}
                  onChange={(e) => setNewRenovation({ ...newRenovation, startDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Responsável Técnico (ART)</label>
                <input
                  type="text"
                  value={newRenovation.technicianName}
                  onChange={(e) => setNewRenovation({ ...newRenovation, technicianName: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Nome do Engenheiro/Arquiteto"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Morador / Unidade</label>
                <select
                  value={newMove.clientId}
                  onChange={(e) => setNewMove({ ...newMove, clientId: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="" className="bg-zinc-900">Selecione um morador</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-zinc-900">{c.name} - Apto {c.unit}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Tipo</label>
                <select
                  value={newMove.type}
                  onChange={(e) => setNewMove({ ...newMove, type: e.target.value as 'IN' | 'OUT' })}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="IN" className="bg-zinc-900">Entrada (Move-in)</option>
                  <option value="OUT" className="bg-zinc-900">Saída (Move-out)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Data da Mudança</label>
                <input
                  type="date"
                  value={newMove.date}
                  onChange={(e) => setNewMove({ ...newMove, date: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-white/40 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={activeTab === 'RENOVATIONS' ? handleAddRenovation : handleAddMove} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20">Salvar Registro</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
