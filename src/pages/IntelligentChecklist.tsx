import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { NBR5674_STANDARDS } from '../constants/maintenance';
import { 
  Calendar, CheckCircle2, AlertTriangle, Clock, Plus, RefreshCw, 
  Building2, Bell, Check, Download, FileText, Home, DollarSign, 
  MessageSquare, Settings, Users, Wrench, Activity, AlertCircle, Zap, Droplets, Menu, Share2, MapPin
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { format, isAfter, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const CircularProgress = ({ value, color = "text-white", size = 120, strokeWidth = 12 }: { value: number, color?: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          className={`${color} drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white drop-shadow-md">{value}%</span>
      </div>
    </div>
  );
};

const DoubleCircularProgress = ({ value }: { value: number }) => {
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Outer track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/5"
        />
        {/* Outer progress */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
          strokeLinecap="round"
        />
        {/* Inner track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 24}
          stroke="currentColor"
          strokeWidth={2}
          fill="transparent"
          className="text-white/30"
          strokeDasharray="4 4"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase tracking-widest text-white/60 mb-1 w-24">Meta de Manutenção Preventiva</span>
        <span className="text-5xl font-bold text-white drop-shadow-md">{value}%</span>
      </div>
    </div>
  );
};

export default function IntelligentChecklist() {
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef<HTMLDivElement>(null);
  const { 
    clients, 
    scheduledMaintenances, 
    generateSchedulesForClient, 
    updateScheduledMaintenance,
    addScheduledMaintenance,
    addNotification,
    companyLogo,
    companyData,
    companySignature
  } = useStore();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [time, setTime] = useState(new Date());
  const [newTask, setNewTask] = useState({
    item: '',
    frequency: 'Mensal' as const,
    category: 'Geral'
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clientSchedules = useMemo(() => {
    return scheduledMaintenances.filter(m => m.clientId === selectedClientId);
  }, [scheduledMaintenances, selectedClientId]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Calculations for dashboard
  const totalTasks = clientSchedules.length;
  const completedTasks = clientSchedules.filter(s => s.status === 'DONE').length;
  const overdueTasks = clientSchedules.filter(s => s.status === 'PENDING' && isAfter(new Date(), parseISO(s.nextDate))).length;
  const pendingTasks = totalTasks - completedTasks - overdueTasks;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingRate = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;
  const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

  const globalStatus = totalTasks > 0 ? Math.max(0, 100 - overdueRate * 2) : 100; // Example formula

  const upcomingTasks = useMemo(() => {
    return [...clientSchedules]
      .filter(s => s.status === 'PENDING')
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
      .slice(0, 4);
  }, [clientSchedules]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const getTasksForDay = (date: Date) => {
    return clientSchedules.filter(s => isSameDay(parseISO(s.nextDate), date) && s.status === 'PENDING');
  };

  const towerData = [
    { name: 'Torre A', uv: 94 },
    { name: 'Torre B', uv: 56 },
    { name: 'Torre C', uv: 94 },
  ];

  const handleGenerate = () => {
    if (!selectedClientId) return;
    generateSchedulesForClient(selectedClientId);
    toast.success('Cronograma gerado com sucesso!');
    addNotification({
      title: 'Cronograma Gerado',
      message: `Cronograma de Manutenção preventiva gerado com sucesso para ${selectedClient?.name}.`,
      type: 'SUCCESS'
    });
  };

  const handleAddTask = () => {
    if (!selectedClientId || !newTask.item) return;
    
    const nextDate = new Date();
    if (newTask.frequency === 'Mensal') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (newTask.frequency === 'Trimestral') nextDate.setMonth(nextDate.getMonth() + 3);
    else if (newTask.frequency === 'Semestral') nextDate.setMonth(nextDate.getMonth() + 6);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);

    addScheduledMaintenance({
      clientId: selectedClientId,
      standardId: 'custom-' + Date.now(),
      item: newTask.item,
      frequency: newTask.frequency,
      nextDate: nextDate.toISOString().split('T')[0],
      status: 'PENDING',
      category: newTask.category
    });

    toast.success('Tarefa adicionada!');
    addNotification({
      title: 'Tarefa Adicionada',
      message: `Tarefa "${newTask.item}" adicionada ao cronograma.`,
      type: 'SUCCESS'
    });

    setShowAddTaskModal(false);
    setNewTask({ item: '', frequency: 'Mensal', category: 'Geral' });
  };

  const handleMarkAsDone = (id: string, frequency: string) => {
    const lastDone = new Date().toISOString().split('T')[0];
    const nextDateObj = new Date();
    
    if (frequency === 'Mensal') nextDateObj.setMonth(nextDateObj.getMonth() + 1);
    else if (frequency === 'Trimestral') nextDateObj.setMonth(nextDateObj.getMonth() + 3);
    else if (frequency === 'Semestral') nextDateObj.setMonth(nextDateObj.getMonth() + 6);
    else nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);

    const nextDate = nextDateObj.toISOString().split('T')[0];

    updateScheduledMaintenance(id, {
      lastDone,
      nextDate,
      status: 'DONE'
    });

    toast.success('Manutenção concluída!');
    addNotification({
      title: 'Manutenção Concluída',
      message: `Manutenção registrada. Próxima data: ${format(nextDateObj, 'dd/MM/yyyy')}`,
      type: 'INFO'
    });
  };

  const handleExportPDF = async () => {
    if (!printRef.current || !selectedClient) return;
    
    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    try {
      toast.loading('Gerando PDF...', { id: 'pdf' });
      await generatePdf(printRef.current, `Manutencao_${selectedClient.name}_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
      toast.success('PDF gerado com sucesso!', { id: 'pdf' });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF', { id: 'pdf' });
    }
  };

  const handleSharePDF = async () => {
    if (!printRef.current || !selectedClient) return;
    
    window.scrollTo(0, 0);

    try {
      toast.loading('Preparando compartilhamento...', { id: 'share-pdf' });
      await sharePdf(printRef.current, `Manutencao_${selectedClient.name}_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
      toast.success('Compartilhamento iniciado!', { id: 'share-pdf' });
    } catch (error: any) {
      console.error('Erro ao compartilhar PDF:', error);
      const errorMsg = error?.message || 'Erro desconhecido';
      if (errorMsg.includes('Compartilhamento não suportado')) {
        toast.error(errorMsg, { id: 'share-pdf' });
      } else {
        toast.error(`Erro ao compartilhar: ${errorMsg}`, { id: 'share-pdf' });
      }
    }
  };

  if (!selectedClientId) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4 md:p-8 font-sans -m-8"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
      >
        <div className="absolute inset-0 bg-[#0a192f]/80 backdrop-blur-xl" />
        <div className="relative z-10 w-full max-w-5xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-12 justify-center">
            <BackButton />
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Wrench className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-light tracking-wide text-center text-white">
              <span className="font-bold text-blue-400">MANUTENÇÃO</span> Preventiva
            </h1>
          </div>
          
          <h2 className="text-xl font-light text-center mb-8 text-white/80">Selecione o Cliente para Gerenciar Manutenções</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all duration-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 group shadow-lg"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                  <Building2 className="w-8 h-8 text-white/50 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">{client.name}</h3>
                  <p className="text-sm text-white/50">{scheduledMaintenances.filter(m => m.clientId === client.id).length} tarefas</p>
                </div>
              </button>
            ))}
            {clients.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-white/50">Nenhum cliente cadastrado. Vá para a aba de Clientes para adicionar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4 md:p-8 font-sans -m-8"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
    >
      {/* Heavy blur overlay for the background */}
      <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-xl" />
      
      {/* Main Dashboard Container - Plastic Transparent Frosted Glass */}
      <div className="relative z-10 w-full max-w-[1400px] bg-gradient-to-br from-[#1e293b]/90 to-[#0f172a]/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 md:p-8 flex flex-col gap-6 overflow-hidden">
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] pointer-events-none" />

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div title="Voltar para seleção">
              <BackButton onClick={() => setSelectedClientId(null)} />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-zinc-500/20 border border-white/20 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-blue-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 tracking-wide drop-shadow-md uppercase">
                  {selectedClient?.name || 'CONDOMÍNIO CONNECT'}
                </h1>
                <p className="text-white/80 text-sm md:text-base">Gestão Transparente, Comunidade Conectada</p>
                <p className="text-white/50 text-xs font-mono mt-1">
                  {format(time, "EEEE, dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center gap-6 text-white/60 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar">
            {[
              { icon: Home, label: 'Visão Geral', path: '/' },
              { icon: DollarSign, label: 'Financeiro', path: '/financial' },
              { icon: MessageSquare, label: 'Comunicação', path: '/notices' },
              { icon: Wrench, label: 'Operacional', path: '/tickets' },
              { icon: Users, label: 'Moradores', path: '/clients' },
              { icon: Settings, label: 'Configurações', path: '/settings' },
            ].map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 transition-colors hover:text-white min-w-[70px] ${location.pathname === item.path ? 'text-white' : ''}`}
              >
                <item.icon className={`w-6 h-6 ${location.pathname === item.path ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
                <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 -mt-2">
          <button
            onClick={handleGenerate}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
          >
            <RefreshCw className="w-3 h-3" /> Gerar Cronograma
          </button>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
          >
            <Plus className="w-3 h-3" /> Nova Tarefa
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-blue-500/30"
          >
            <Download className="w-3 h-3" /> Exportar PDF
          </button>
          <button
            onClick={handleSharePDF}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20"
          >
            <Share2 className="w-3 h-3" /> Compartilhar
          </button>
        </div>

        {/* 3 Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          
          {/* Column 1: Situação Geral */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col shadow-lg backdrop-blur-md flex-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Situação Geral da Manutenção</h2>
              <div className="flex justify-between text-xs font-bold text-white/80 mb-2">
                <span>STATUS GLOBAL: {globalStatus}%</span>
                <span>META: 98%</span>
              </div>
              
              <div className="flex justify-center my-4">
                <CircularProgress value={globalStatus} size={140} />
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                  <div className="w-3 h-3 rounded-full bg-black shadow-[0_0_5px_rgba(0,0,0,0.8)]" />
                  Tarefas Concluídas: {completionRate}%
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                  <div className="w-3 h-3 rounded-full bg-slate-400 shadow-[0_0_5px_rgba(148,163,184,0.8)]" />
                  Tarefas Pendentes: {pendingRate}%
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                  Tarefas Atrasadas: {overdueRate}%
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">Manutenção por Torre (% Concluída)</h3>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={towerData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                      <Bar dataKey="uv" radius={[4, 4, 0, 0]}>
                        {towerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="url(#colorBar)" />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Visão Geral & Próximas */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col shadow-lg backdrop-blur-md relative">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Visão Geral da Manutenção</h2>
                <button className="text-white/40 hover:text-white">•••</button>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden mb-2">
                    <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm text-white/80">Olá, Gestor!</span>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs font-bold text-white/80 mb-4">TAXA DE CONFORMIDADE: {completionRate}%</span>
                  <DoubleCircularProgress value={98} />
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-bold text-white/60 uppercase">Tarefas Críticas:</span>
                  <span className="text-lg font-bold text-white">{overdueTasks}</span>
                  {overdueTasks > 0 && (
                    <AlertTriangle className="w-8 h-8 text-orange-500 mt-2 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                  <div className="w-3 h-3 rounded-full bg-black" />
                  BALANÇO GERAL: 98%
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  Inadimplência: 4%
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg backdrop-blur-md flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Próximas Manutenções Críticas</h2>
                <button className="text-white/40 hover:text-white">•••</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {upcomingTasks.length > 0 ? upcomingTasks.map((task, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleMarkAsDone(task.id, task.frequency)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group"
                    title="Clique para marcar como concluído"
                  >
                    <div className="p-2 bg-white/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                      {i % 4 === 0 ? <Wrench className="w-5 h-5 text-white/70 group-hover:text-blue-400" /> :
                       i % 4 === 1 ? <Zap className="w-5 h-5 text-white/70 group-hover:text-yellow-400" /> :
                       i % 4 === 2 ? <Droplets className="w-5 h-5 text-white/70 group-hover:text-cyan-400" /> :
                       <Activity className="w-5 h-5 text-white/70 group-hover:text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight line-clamp-2">{task.item}</p>
                      <p className="text-[10px] text-white/50">{format(parseISO(task.nextDate), 'dd/MM')}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 text-center py-4 text-white/50 text-sm">
                    Nenhuma manutenção pendente.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Programação & Alertas */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg backdrop-blur-md flex-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Programação Semanal (Tarefas)</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="pb-2 text-[10px] font-bold text-white/50 uppercase w-6 text-center">#</th>
                      {weekDays.map((day, i) => (
                        <th key={i} className="pb-2 text-[10px] font-bold text-white/80 uppercase text-center">
                          {format(day, 'E', { locale: ptBR }).substring(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {[1, 2, 3, 4, 5].map((rowNum, rowIndex) => {
                      return (
                        <tr key={rowIndex} className="border-t border-white/5">
                          <td className="py-2 font-bold text-white/40 text-center text-[10px]">{rowNum}</td>
                          {weekDays.map((colDay, colIndex) => {
                            const tasksForDay = getTasksForDay(colDay);
                            const task = tasksForDay[rowIndex]; // Show one task per row for that day
                            
                            return (
                              <td key={colIndex} className="py-1 px-1">
                                {task ? (
                                  <div className="bg-white/10 border border-white/20 text-white text-[9px] px-1 py-1 rounded text-center truncate w-14 mx-auto" title={task.item}>
                                    {task.item}
                                  </div>
                                ) : (
                                  <div className="w-14 mx-auto h-6"></div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Notificações & Alertas Técnicos</h2>
                <Menu className="w-4 h-4 text-white/40" />
              </div>
              
              <h3 className="text-[10px] font-bold text-white/50 uppercase mb-3">Últimos Avisos Oficiais</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-orange-100">Alerta: Baixo Nível de Água (Cisterna C)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-orange-100">Alerta: Temperatura Elevada Bomba 2</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-100">Notificação: Entrega de Material de Limpeza (23/03)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Nova Tarefa Preventiva</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Item da Manutenção</label>
                <input 
                  type="text"
                  value={newTask.item}
                  onChange={(e) => setNewTask({...newTask, item: e.target.value})}
                  placeholder="Ex: Limpeza de Ar Condicionado"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Frequência</label>
                <select
                  value={newTask.frequency}
                  onChange={(e) => setNewTask({...newTask, frequency: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="Mensal" className="bg-[#1e293b]">Mensal</option>
                  <option value="Trimestral" className="bg-[#1e293b]">Trimestral</option>
                  <option value="Semestral" className="bg-[#1e293b]">Semestral</option>
                  <option value="Anual" className="bg-[#1e293b]">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Categoria</label>
                <input 
                  type="text"
                  value={newTask.category}
                  onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                  placeholder="Ex: Elétrica, Hidráulica..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-white"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddTask}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-all text-white shadow-lg shadow-blue-500/20"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Template (Hidden) */}
      <div className="hidden">
        <div 
          ref={printRef} 
          ref-name="printRef"
          className="bg-white text-zinc-900 font-sans pdf-content relative overflow-hidden"
          style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '0' }}
        >
          {/* Top Accent Line */}
          <div className="h-2 w-full bg-blue-600 mb-0"></div>

          <div className="p-12">
            {/* Header Section */}
            <div className="grid grid-cols-12 gap-8 mb-10 pb-8 border-b border-zinc-200 items-start break-inside-avoid">
              <div className="col-span-7 flex gap-6 items-center">
                {companyLogo ? (
                  <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex items-center justify-center">
                    <img src={companyLogo} alt="Logo" className="h-16 w-auto object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight leading-none mb-2">
                    {companyData?.name || 'IA COMPANY'}
                  </h2>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-zinc-300"></div> CNPJ: {companyData?.document || '---'}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-zinc-300"></div> {companyData?.email || 'contato@empresa.com'}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-zinc-300"></div> {companyData?.phone || '(00) 0000-0000'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-span-5 text-right flex flex-col justify-between h-full">
                <div>
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-3 rounded">
                    ENGENHARIA E MANUTENÇÃO
                  </div>
                  <h1 className="text-3xl font-black tracking-tighter text-black uppercase leading-none">
                    RELATÓRIO TÉCNICO
                  </h1>
                </div>
                <div className="mt-4 flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right whitespace-nowrap">Data Referência</span>
                    <span className="text-sm font-black text-black">{format(new Date(), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right whitespace-nowrap">Protocolo</span>
                    <span className="text-sm font-black text-black">#{selectedClient?.id.substring(0, 8).toUpperCase() || '---'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Card */}
            <div className="mb-10 bg-zinc-50 p-8 rounded-3xl border border-zinc-100 flex flex-col relative overflow-hidden break-inside-avoid">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-5 ml-2">Unidade / Edificação Monitorada</h3>
              <div className="ml-2">
                <p className="text-3xl font-black text-black leading-tight mb-6">
                  {selectedClient?.name || '________________________________'}
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="pt-4 border-t border-zinc-200/50">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Endereço de Atendimento</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-300 mt-0.5" />
                      <p className="text-xs font-bold text-black leading-relaxed">{selectedClient?.address || '---'}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-200/50">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Responsável Técnico</p>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                      <p className="text-xs font-bold text-black leading-relaxed">Engenheiro / Técnico Responsável</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Section */}
            <h2 className="text-xl font-black text-black uppercase tracking-tight mb-6 flex items-center gap-3 break-inside-avoid">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Cronograma de Manutenção Preventiva (NBR 5674)
            </h2>

            <div className="mb-10 rounded-3xl overflow-hidden border border-zinc-200 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    <th className="p-5 w-20 text-center">Status</th>
                    <th className="p-5">Plano de Manutenção / Atividade</th>
                    <th className="p-5 text-center w-32">Periodicidade</th>
                    <th className="p-5 text-right w-40">Próxima Venc.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {clientSchedules.map((schedule, idx) => (
                    <tr key={idx} className="break-inside-avoid">
                      <td className="p-5">
                        <div className="flex justify-center">
                          <div className={`w-6 h-6 rounded-lg border-2 ${schedule.status === 'DONE' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-zinc-200'} flex items-center justify-center`}>
                            {schedule.status === 'DONE' && <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </div>
                      </td>
                      <td className="p-5 uppercase">
                        <p className="text-sm font-black text-zinc-900 leading-tight mb-1">{schedule.item}</p>
                        <p className="text-[10px] font-black text-zinc-400 tracking-wider">CATEGORIA: {schedule.category}</p>
                      </td>
                      <td className="p-5 text-center">
                         <span className="px-2 py-1 bg-zinc-100 text-[9px] font-black text-zinc-500 uppercase rounded">
                           {schedule.frequency}
                         </span>
                      </td>
                      <td className="p-5 text-right font-black text-zinc-900 text-sm font-mono">
                        {format(parseISO(schedule.nextDate), 'dd/MM/yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tech Observations */}
            <div className="mb-10 break-inside-avoid">
               <div className="bg-zinc-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400 mb-6 flex items-center gap-3">
                    <Activity className="w-4 h-4" /> Diagnóstico e Observações Técnicas
                  </h4>
                  <div className="space-y-4">
                    <div className="h-1 w-full bg-white/10 rounded-full mb-6"></div>
                    <p className="text-xs text-white/40 leading-relaxed font-bold italic">
                      "A edificação apresenta conformidade parcial com o plano de manutenção preventiva. Recomenda-se a atenção imediata aos itens com data de vencimento expirada para evitar depreciação patrimonial precoce ou falhas sistêmicas em equipamentos críticos."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-16 grid grid-cols-2 gap-20 break-inside-avoid pt-12 border-t border-zinc-100">
              <div className="text-center flex flex-col items-center">
                <div className="h-20 flex items-end justify-center mb-2 w-full">
                  {companySignature && (
                    <img 
                      src={companySignature} 
                      alt="Assinatura" 
                      className="max-h-full max-w-[200px] object-contain opacity-90" 
                    />
                  )}
                </div>
                <div className="w-full border-t border-zinc-300 pt-4">
                  <p className="text-lg font-black text-black leading-none mb-1">{companyData?.name || 'IA COMPANY'}</p>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Responsável Técnico</p>
                </div>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="h-20 mb-2 w-full"></div>
                <div className="w-full border-t border-zinc-300 pt-4">
                  <p className="text-lg font-black text-black leading-none mb-1">{selectedClient?.name.substring(0, 30)}</p>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Ciente do Gestor / Síndico</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-10 border-t border-zinc-100 flex justify-between items-center break-inside-avoid">
              <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest italic">
                Este relatório atesta a realização das inspeções documentadas. Não substitui ensaios laboratoriais ou laudos específicos de engenharia.
              </p>
              <div className="flex items-center gap-4">
                <p className="text-[9px] font-black text-zinc-900 uppercase tracking-widest">
                   NBR 5674 • PG 01/01
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
