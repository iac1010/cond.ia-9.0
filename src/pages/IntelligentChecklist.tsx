import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { NBR5674_STANDARDS } from '../constants/maintenance';
import { 
  Calendar, CheckCircle2, AlertTriangle, Clock, Plus, RefreshCw, 
  Building2, Bell, Check, Download, FileText, Home, DollarSign, 
  MessageSquare, Settings, Users, Wrench, Activity, AlertCircle, Zap, Droplets, Menu, Share2, MapPin,
  Search, Trash2, Edit2, Shield
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
    deleteScheduledMaintenance,
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

  // Sidebar Quick Add States
  const [sidebarTask, setSidebarTask] = useState({
    item: '',
    frequency: 'Mensal' as const,
    category: 'Manutenção Elétrica',
    nextDate: new Date().toISOString().split('T')[0]
  });

  const handleAddSidebarTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !sidebarTask.item) {
      toast.error('Por favor, digite o nome da atividade.');
      return;
    }
    addScheduledMaintenance({
      clientId: selectedClientId,
      standardId: 'custom-' + Date.now(),
      item: sidebarTask.item,
      frequency: sidebarTask.frequency,
      nextDate: sidebarTask.nextDate,
      status: 'PENDING',
      category: sidebarTask.category
    });
    toast.success('Atividade agendada!');
    setSidebarTask({
      item: '',
      frequency: 'Mensal',
      category: 'Manutenção Elétrica',
      nextDate: new Date().toISOString().split('T')[0]
    });
  };

  // Dashboard Control Center States
  const [activeTab, setActiveTab] = useState<'activities' | 'schedule' | 'iot-alerts'>('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DONE' | 'OVERDUE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // IoT simulated active building alarms state
  const [iotAlerts, setIotAlerts] = useState([
    { id: 'alert-1', title: 'Nível Crítico de Água', subtitle: 'Cisterna Inferior da Torre A', severity: 'CRITICAL', system: 'Hidráulica', timestamp: 'Há 12 min' },
    { id: 'alert-2', title: 'Sobreaquecimento no Motor', subtitle: 'Bomba de Recalque de Esgoto 2', severity: 'WARNING', system: 'Mecânica', timestamp: 'Há 45 min' },
    { id: 'alert-3', title: 'Tensão Anômala SPDA', subtitle: 'Aterramento Central Para-Raios', severity: 'INFO', system: 'Elétrica', timestamp: 'Hoje, 09:30' },
    { id: 'alert-4', title: 'Bateria Fraca no No-Break', subtitle: 'Controle de Acesso Portaria Principal', severity: 'WARNING', system: 'Segurança', timestamp: 'Ontem' },
  ]);

  // Task Editing & Rescheduling States
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [reschedulingTask, setReschedulingTask] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

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

  const next15DaysTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = addDays(new Date(), 15).toISOString().split('T')[0];
    return clientSchedules.filter(s => {
      const isPending = s.status === 'PENDING';
      const isOverdue = s.status === 'PENDING' && s.nextDate < todayStr;
      return isPending && !isOverdue && s.nextDate >= todayStr && s.nextDate <= targetDate;
    }).length;
  }, [clientSchedules]);

  const availableCategories = useMemo(() => {
    const cats = new Set(clientSchedules.map(s => s.category || 'Geral'));
    return ['ALL', ...Array.from(cats)];
  }, [clientSchedules]);

  const filteredSchedules = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return clientSchedules.filter(task => {
      const effStatus = task.status === 'DONE' ? 'DONE' : (task.nextDate < todayStr ? 'OVERDUE' : 'PENDING');
      
      const matchesSearch = task.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.category || 'Geral').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || effStatus === statusFilter;
      
      const matchesCategory = categoryFilter === 'ALL' || (task.category || 'Geral') === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  }, [clientSchedules, searchTerm, statusFilter, categoryFilter]);

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

  const handleDeleteTask = (id: string) => {
    deleteScheduledMaintenance(id);
    toast.success('Tarefa removida!');
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    updateScheduledMaintenance(editingTask.id, {
      item: editingTask.item,
      frequency: editingTask.frequency,
      category: editingTask.category,
      nextDate: editingTask.nextDate,
      status: editingTask.status
    });
    toast.success('Tarefa atualizada com sucesso!');
    setEditingTask(null);
  };

  const handleReschedule = (id: string, newDate: string) => {
    if (!newDate) return;
    updateScheduledMaintenance(id, {
      nextDate: newDate,
      status: 'PENDING'
    });
    toast.success('Tarefa reagendada!');
    setReschedulingTask(null);
    setRescheduleDate('');
  };

  const handleResolveAlert = (id: string, title: string) => {
    setIotAlerts(prev => prev.filter(a => a.id !== id));
    toast.success(`Alerta "${title}" resolvido!`);
    addNotification({
      title: 'Alerta Resolvido',
      message: `O alerta técnico "${title}" foi resolvido.`,
      type: 'SUCCESS'
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
    <>
      <div 
        className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4 md:p-8 font-sans -m-8"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
      >
      {/* Heavy blur overlay for the background */}
      <div className="absolute inset-0 bg-[#0f172a]/85 backdrop-blur-xl" />
      
      {/* Main Dashboard Container - Plastic Transparent Frosted Glass */}
      <div className="relative z-10 w-full max-w-[1400px] bg-gradient-to-br from-[#1e293b]/95 to-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] p-6 md:p-8 flex flex-col gap-6 overflow-hidden">
        
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
                <p className="text-white/80 text-sm md:text-base font-light">Gestão Transparente, Comunidade Conectada</p>
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
              { icon: Users, label: 'Empresas', path: '/clients' },
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

        {/* Global KPI Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* KPI 1: Compliance Gauge */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-1">CONFORMIDADE GERAL</p>
              <h3 className="text-2xl font-black text-white">{globalStatus}%</h3>
              <p className="text-[10px] text-white/40 mt-1">Meta recomendada: 98%</p>
            </div>
            <div className="shrink-0">
              <CircularProgress value={globalStatus} size={70} strokeWidth={8} />
            </div>
          </div>

          {/* KPI 2: Activities Summary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">ATIVIDADES EM DIA</p>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-white">{completedTasks} / {totalTasks}</h3>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="text-[10px] text-white/40 mt-1">{completionRate}% de conformidade técnica</p>
            </div>
          </div>

          {/* KPI 3: Overdue Activities */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">CRÍTICAS / VENCIDAS</p>
              {overdueTasks > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              ) : (
                <Shield className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="mt-2">
              <h3 className={`text-2xl font-black ${overdueTasks > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{overdueTasks}</h3>
              <p className="text-[10px] text-white/40 mt-1">
                {overdueTasks > 0 ? 'Exige atenção operacional urgente!' : 'Parabéns! Nenhuma pendência.'}
              </p>
            </div>
          </div>

          {/* KPI 4: Next 15 days */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">PRÓXIMOS 15 DIAS</p>
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-white">{next15DaysTasks}</h3>
              <p className="text-[10px] text-white/40 mt-1">Atividades programadas a vencer</p>
            </div>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'activities', label: '📋 Atividades Preventivas', icon: Wrench },
            { id: 'schedule', label: '📅 Agenda Semanal', icon: Calendar },
            { id: 'iot-alerts', label: `🚨 Alertas de Sensores (${iotAlerts.length})`, icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-black border-b-2 transition-all ${
                activeTab === tab.id 
                  ? 'border-yellow-500 text-yellow-500 bg-white/5' 
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 350px)' }}>
          
          {/* LEFT COLUMN: Main Active Desk (Tabs Content) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* TAB 1: ACTIVITIES CONTROL */}
            {activeTab === 'activities' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col shadow-lg backdrop-blur-md">
                
                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-center">
                  
                  {/* Search bar */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-white/40" />
                    <input 
                      type="text"
                      placeholder="Buscar por atividade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-white/30 transition-all placeholder:text-white/30"
                    />
                  </div>

                  {/* Filter dropdowns */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-white/30"
                    >
                      <option value="ALL" className="bg-[#1e293b]">Todos os Status</option>
                      <option value="PENDING" className="bg-[#1e293b]">Pendentes</option>
                      <option value="OVERDUE" className="bg-[#1e293b]">Atrasados</option>
                      <option value="DONE" className="bg-[#1e293b]">Concluídos</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-white/30 max-w-[180px] md:max-w-xs truncate"
                    >
                      <option value="ALL" className="bg-[#1e293b]">Todas Categorias</option>
                      {availableCategories.filter(c => c !== 'ALL').map((cat, i) => (
                        <option key={i} value={cat} className="bg-[#1e293b]">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Table Block */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Atividade / Sistema</th>
                        <th className="py-3 px-4">Frequência</th>
                        <th className="py-3 px-4">Última Realização</th>
                        <th className="py-3 px-4">Próximo Vencimento</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredSchedules.map((task) => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isOverdue = task.status === 'PENDING' && task.nextDate < todayStr;
                        const isDone = task.status === 'DONE';

                        return (
                          <tr key={task.id} className="hover:bg-white/5 transition-colors">
                            {/* Status Column */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[9px] uppercase tracking-wider border border-emerald-500/25">
                                  <Check className="w-3 h-3" /> Realizado
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-bold text-[9px] uppercase tracking-wider border border-red-500/25 animate-pulse">
                                  <AlertTriangle className="w-3 h-3" /> ATRASADO
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 font-bold text-[9px] uppercase tracking-wider border border-yellow-500/25">
                                  <Clock className="w-3 h-3" /> AGENDADO
                                </span>
                              )}
                            </td>

                            {/* Activity Column */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-white mb-0.5">{task.item}</p>
                              <p className="text-[10px] text-white/50">{task.category || 'Geral'}</p>
                            </td>

                            {/* Frequency Column */}
                            <td className="py-4 px-4">
                              <span className="bg-white/10 text-white/80 font-semibold px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider">
                                {task.frequency}
                              </span>
                            </td>

                            {/* Last Done Column */}
                            <td className="py-4 px-4 text-white/60">
                              {task.lastDone ? format(parseISO(task.lastDone), 'dd/MM/yyyy') : '---'}
                            </td>

                            {/* Next Date Column */}
                            <td className="py-4 px-4 font-mono font-medium">
                              {reschedulingTask?.id === task.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="date" 
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="bg-black/60 border border-white/20 text-white rounded px-2 py-1 text-xs outline-none"
                                  />
                                  <button 
                                    onClick={() => handleReschedule(task.id, rescheduleDate)}
                                    className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg transition-colors"
                                    title="Confirmar"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => setReschedulingTask(null)}
                                    className="px-1.5 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-[10px] transition-colors"
                                    title="Cancelar"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <span className={isOverdue ? 'text-red-400 font-bold' : 'text-white'}>
                                  {format(parseISO(task.nextDate), 'dd/MM/yyyy')}
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isDone && (
                                  <button
                                    onClick={() => handleMarkAsDone(task.id, task.frequency)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                                    title="Marcar como Concluído"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setReschedulingTask(task);
                                    setRescheduleDate(task.nextDate);
                                  }}
                                  className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                                  title="Reagendar Data"
                                >
                                  <Calendar className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all"
                                  title="Editar Atividade"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredSchedules.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-white/50 text-sm">
                            {clientSchedules.length === 0 ? (
                              <div className="py-6 flex flex-col items-center">
                                <CheckCircle2 className="w-12 h-12 text-blue-400/50 mb-3" />
                                <p className="font-bold text-white mb-2">Sem Cronograma para este Edifício</p>
                                <p className="text-xs text-white/40 mb-4 max-w-sm">Nenhuma atividade preventiva ativa foi configurada para o condomínio ainda.</p>
                                <button
                                  onClick={handleGenerate}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md"
                                >
                                  Gerar Plano de Atividades Padrão
                                </button>
                              </div>
                            ) : (
                              'Nenhuma manutenção preventiva encontrada com os filtros selecionados.'
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: WEEKLY MATRIX SCHEDULE */}
            {activeTab === 'schedule' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col shadow-lg backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Matriz de Agenda Semanal</h3>
                    <p className="text-xs text-white/40 mt-1">Visão condensada de agendamentos pendentes por dia de trabalho.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-3 text-[10px] font-bold text-white/50 uppercase w-10 text-center">Nº</th>
                        {weekDays.map((day, i) => (
                          <th key={i} className="pb-3 text-[10px] font-bold text-white/80 uppercase text-center border-b border-white/10">
                            <div className="flex flex-col items-center">
                              <span>{format(day, 'EEEE', { locale: ptBR }).split('-')[0]}</span>
                              <span className="text-xs text-yellow-500 font-mono font-bold mt-0.5">{format(day, 'dd/MM')}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-white/5">
                      {[1, 2, 3, 4, 5].map((rowNum, rowIndex) => {
                        return (
                          <tr key={rowIndex} className="hover:bg-white/5">
                            <td className="py-3 font-bold text-white/40 text-center text-[10px]">{rowNum}</td>
                            {weekDays.map((colDay, colIndex) => {
                              const tasksForDay = getTasksForDay(colDay);
                              const task = tasksForDay[rowIndex];
                              
                              return (
                                <td key={colIndex} className="py-2 px-1 text-center">
                                  {task ? (
                                    <div 
                                      onClick={() => handleMarkAsDone(task.id, task.frequency)}
                                      className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg text-center cursor-pointer transition-colors max-w-[120px] mx-auto truncate" 
                                      title={`Clique para Concluir: ${task.item}`}
                                    >
                                      {task.item}
                                    </div>
                                  ) : (
                                    <div className="h-8"></div>
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
            )}

            {/* TAB 3: IoT SENSORS & ALARMS */}
            {activeTab === 'iot-alerts' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col shadow-lg backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Sensores e Telemetria Integrada</h3>
                    <p className="text-xs text-white/40 mt-1">Alerta em tempo real de hardware e automações de infraestrutura do condomínio.</p>
                  </div>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase rounded-lg animate-pulse">
                    Monitoramento Ativo
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {iotAlerts.length > 0 ? iotAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                        alert.severity === 'CRITICAL' 
                          ? 'bg-red-500/5 border-red-500/20' 
                          : alert.severity === 'WARNING'
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-blue-500/5 border-blue-500/20'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          alert.severity === 'CRITICAL' 
                            ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                            : alert.severity === 'WARNING'
                            ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                            : 'bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                        }`}>
                          <AlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              alert.severity === 'CRITICAL' 
                                ? 'bg-red-500/30 text-red-300' 
                                : alert.severity === 'WARNING'
                                ? 'bg-yellow-500/30 text-yellow-300'
                                : 'bg-blue-500/30 text-blue-300'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-[10px] text-white/40">{alert.timestamp}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1.5 leading-tight">{alert.title}</h4>
                          <p className="text-xs text-white/60 mt-0.5">{alert.subtitle}</p>
                          <p className="text-[10px] text-yellow-500/70 font-semibold mt-1">Sistema: {alert.system}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            // Automatically add a high-priority task for this alarm!
                            addScheduledMaintenance({
                              clientId: selectedClientId!,
                              standardId: 'iot-' + alert.id,
                              item: `Reparo emergencial: ${alert.title} (${alert.subtitle})`,
                              frequency: 'Mensal',
                              nextDate: new Date().toISOString().split('T')[0],
                              status: 'PENDING',
                              category: alert.system
                            });
                            toast.success('Tarefa emergencial adicionada para resolução!');
                            handleResolveAlert(alert.id, alert.title);
                          }}
                          className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase transition-all"
                        >
                          Gerar Manutenção
                        </button>
                        <button
                          onClick={() => handleResolveAlert(alert.id, alert.title)}
                          className="px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold uppercase transition-all"
                        >
                          Resolver
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 text-center py-8 text-white/50 text-sm bg-white/5 rounded-xl border border-dashed border-white/10">
                      <Shield className="w-10 h-10 text-emerald-400/50 mx-auto mb-2" />
                      <p className="font-bold text-white">Todos os Sistemas Estáveis</p>
                      <p className="text-xs text-white/40">Nenhuma anomalia de telemetria reportada pelos sensores.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Quick Action Hub & Performance Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. SIDEBAR QUICK ADD ACTIVITY */}
            <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-400" /> Agendar Nova Atividade
              </h3>

              <form onSubmit={handleAddSidebarTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Item ou Equipamento</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Inspeção de Bomba de Incêndio"
                    value={sidebarTask.item}
                    onChange={(e) => setSidebarTask({ ...sidebarTask, item: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Periodicidade</label>
                    <select
                      value={sidebarTask.frequency}
                      onChange={(e) => setSidebarTask({ ...sidebarTask, frequency: e.target.value as any })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-white/30"
                    >
                      <option value="Mensal" className="bg-[#1e293b]">Mensal</option>
                      <option value="Trimestral" className="bg-[#1e293b]">Trimestral</option>
                      <option value="Semestral" className="bg-[#1e293b]">Semestral</option>
                      <option value="Anual" className="bg-[#1e293b]">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Próxima Data</label>
                    <input 
                      type="date"
                      required
                      value={sidebarTask.nextDate}
                      onChange={(e) => setSidebarTask({ ...sidebarTask, nextDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Categoria</label>
                  <select
                    value={sidebarTask.category}
                    onChange={(e) => setSidebarTask({ ...sidebarTask, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none"
                  >
                    <option value="Manutenção Elétrica" className="bg-[#1e293b]">Elétrica</option>
                    <option value="Manutenção Hidráulica" className="bg-[#1e293b]">Hidráulica</option>
                    <option value="Manutenção Civil" className="bg-[#1e293b]">Civil</option>
                    <option value="Manutenção de Segurança" className="bg-[#1e293b]">Segurança</option>
                    <option value="Manutenção de Prevenção e Combate a Incêndio" className="bg-[#1e293b]">Combate a Incêndio</option>
                    <option value="Manutenção de Elevadores" className="bg-[#1e293b]">Elevadores</option>
                    <option value="Geral" className="bg-[#1e293b]">Outros</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Agendar Atividade
                </button>
              </form>
            </div>

            {/* 2. REPORT EXPORTING ACTIONS */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-white mb-3">Relatório de Conformidade (NBR 5674)</h3>
              <p className="text-[11px] text-white/50 leading-relaxed mb-4">
                Exporte o relatório técnico assinado digitalmente contendo todo o histórico de inspeções, diagnósticos preventivos e status dos equipamentos críticos.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportPDF}
                  className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-blue-500/20 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar PDF
                </button>
                
                <button
                  onClick={handleSharePDF}
                  className="bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/10 flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Compartilhar
                </button>
              </div>
            </div>

            {/* 3. TOWER STATUS BARS */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Métricas por Torre</h3>
              
              <div className="space-y-4">
                {[
                  { name: 'Torre A (Residencial)', rate: 94, color: 'bg-emerald-500' },
                  { name: 'Torre B (Corporativo)', rate: 56, color: 'bg-yellow-500' },
                  { name: 'Torre C (Área de Lazer)', rate: 94, color: 'bg-emerald-500' },
                ].map((tower, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-white/70">{tower.name}</span>
                      <span className="text-white">{tower.rate}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tower.color}`} style={{ width: `${tower.rate}%` }} />
                    </div>
                  </div>
                ))}
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

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateTask(editingTask);
            }} 
            className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">Editar Tarefa Preventiva</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Item da Manutenção</label>
                <input 
                  type="text"
                  required
                  value={editingTask.item}
                  onChange={(e) => setEditingTask({...editingTask, item: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Frequência</label>
                <select
                  value={editingTask.frequency}
                  onChange={(e) => setEditingTask({...editingTask, frequency: e.target.value as any})}
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
                  required
                  value={editingTask.category || ''}
                  onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Próxima Data de Vencimento</label>
                <input 
                  type="date"
                  required
                  value={editingTask.nextDate}
                  onChange={(e) => setEditingTask({...editingTask, nextDate: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Status</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({...editingTask, status: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="PENDING" className="bg-[#1e293b]">Pendente</option>
                  <option value="DONE" className="bg-[#1e293b]">Concluída</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-all text-white shadow-lg shadow-blue-500/20"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
