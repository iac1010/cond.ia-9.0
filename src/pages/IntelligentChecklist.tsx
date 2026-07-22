import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { NBR5674_STANDARDS } from '../constants/maintenance';
import { 
  Calendar, CheckCircle2, AlertTriangle, Clock, Plus, RefreshCw, 
  Building2, Bell, Check, Download, FileText, Home, DollarSign, 
  MessageSquare, Settings, Users, Wrench, Activity, AlertCircle, Zap, Droplets, Menu, Share2, MapPin,
  Search, Trash2, Edit2, Shield, Camera, Image as ImageIcon, ChevronRight, X, ArrowRight
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
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientFilterTab, setClientFilterTab] = useState<'all' | 'pending' | 'has_tasks'>('all');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedClientIdForTask, setSelectedClientIdForTask] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add_maintenance' || params.get('action') === 'new') {
      setShowAddTaskModal(true);
    }
  }, []);
  
  // Shortcut Modal: Criar Nova Página Inteligente
  const [showCreateIntelligentPageModal, setShowCreateIntelligentPageModal] = useState(false);
  const [createPageMode, setCreatePageMode] = useState<'custom' | 'nbr5674' | 'mindmap'>('custom');
  const [targetClientForPage, setTargetClientForPage] = useState<string>('');
  const [newPageName, setNewPageName] = useState('');
  const [newPageInitialTask, setNewPageInitialTask] = useState('');
  const [newPageFreq, setNewPageFreq] = useState<'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' | 'Atividade Única'>('Mensal');

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
    nextDate: new Date().toISOString().split('T')[0],
    time: ''
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
      time: sidebarTask.time,
      status: 'PENDING',
      category: sidebarTask.category
    });
    toast.success('Atividade agendada!');
    setSidebarTask({
      item: '',
      frequency: 'Mensal',
      category: 'Manutenção Elétrica',
      nextDate: new Date().toISOString().split('T')[0],
      time: ''
    });
  };

  // Dashboard Control Center States
  const [activeTab, setActiveTab] = useState<'activities' | 'schedule' | 'iot-alerts' | 'visit-reports'>('activities');
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

  // Visit Reports States
  const [visitReports, setVisitReports] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`visitReports_${selectedClientId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Whenever selectedClientId or visitReports changes, update localStorage
  useEffect(() => {
    if (selectedClientId) {
      localStorage.setItem(`visitReports_${selectedClientId}`, JSON.stringify(visitReports));
    }
  }, [visitReports, selectedClientId]);

  // Load visit reports when selectedClientId changes
  useEffect(() => {
    if (selectedClientId) {
      try {
        const saved = localStorage.getItem(`visitReports_${selectedClientId}`);
        setVisitReports(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setVisitReports([]);
      }
    }
  }, [selectedClientId]);

  // Form states for creating a new visit report
  const [showVisitReportModal, setShowVisitReportModal] = useState(false);
  const [selectedMaintTaskId, setSelectedMaintTaskId] = useState('');
  const [reportTechnician, setReportTechnician] = useState('');
  const [reportStatus, setReportStatus] = useState<'CONFORME' | 'RESSALVA' | 'CRITICO'>('CONFORME');
  const [reportObservations, setReportObservations] = useState('');
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [photoZoomUrl, setPhotoZoomUrl] = useState<string | null>(null);
  const [autoCompleteTask, setAutoCompleteTask] = useState(true);

  const reportPrintRef = useRef<HTMLDivElement>(null);

  // Preset inspection photos for quick testing
  const PRESET_INSPECTION_PHOTOS = [
    { name: 'Quadro Elétrico', url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80' },
    { name: 'Bomba d\'Água', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
    { name: 'Elevador', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80' },
    { name: 'Gerador', url: 'https://images.unsplash.com/photo-1597491833453-7a9763241511?auto=format&fit=crop&w=600&q=80' },
    { name: 'Incêndio', url: 'https://images.unsplash.com/photo-1606206591513-bc15147b69cd?auto=format&fit=crop&w=600&q=80' },
    { name: 'Infiltração', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' }
  ];

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
    const targetClientId = selectedClientIdForTask || selectedClientId;
    if (!targetClientId) {
      toast.error('Por favor, selecione um cliente.');
      return;
    }
    if (!newTask.item) {
      toast.error('Informe o item da manutenção.');
      return;
    }
    
    const nextDate = new Date();
    if (newTask.frequency === 'Mensal') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (newTask.frequency === 'Trimestral') nextDate.setMonth(nextDate.getMonth() + 3);
    else if (newTask.frequency === 'Semestral') nextDate.setMonth(nextDate.getMonth() + 6);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);

    addScheduledMaintenance({
      clientId: targetClientId,
      standardId: 'custom-' + Date.now(),
      item: newTask.item,
      frequency: newTask.frequency,
      nextDate: nextDate.toISOString().split('T')[0],
      status: 'PENDING',
      category: newTask.category || 'Geral'
    });

    toast.success('Atividade de Manutenção adicionada!');
    addNotification({
      title: 'Manutenção Adicionada',
      message: `Atividade "${newTask.item}" adicionada com sucesso.`,
      type: 'SUCCESS'
    });

    setShowAddTaskModal(false);
    setNewTask({ item: '', frequency: 'Mensal', category: 'Geral' });
  };

  const handleCreateIntelligentPage = () => {
    if (createPageMode === 'mindmap') {
      navigate('/installation-mindmap');
      setShowCreateIntelligentPageModal(false);
      return;
    }

    if (!targetClientForPage) {
      toast.error('Selecione um cliente para vincular a nova página.');
      return;
    }

    const clientObj = clients.find(c => c.id === targetClientForPage);

    if (createPageMode === 'nbr5674') {
      generateSchedulesForClient(targetClientForPage);
      toast.success(`Protocolo NBR 5674 gerado para ${clientObj?.name || 'o cliente'}!`);
      addNotification({
        title: 'Nova Página NBR 5674 Criada',
        message: `Página NBR 5674 gerada para ${clientObj?.name}.`,
        type: 'SUCCESS'
      });
      setSelectedClientId(targetClientForPage);
      setShowCreateIntelligentPageModal(false);
      return;
    }

    if (!newPageName) {
      toast.error('Informe o nome da página/checklist inteligente.');
      return;
    }

    const taskItem = newPageInitialTask || `Inspecao Inicial - ${newPageName}`;

    const nextDate = new Date();
    if (newPageFreq === 'Mensal') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (newPageFreq === 'Trimestral') nextDate.setMonth(nextDate.getMonth() + 3);
    else if (newPageFreq === 'Semestral') nextDate.setMonth(nextDate.getMonth() + 6);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);

    addScheduledMaintenance({
      clientId: targetClientForPage,
      standardId: 'custom-page-' + Date.now(),
      item: taskItem,
      frequency: newPageFreq,
      nextDate: nextDate.toISOString().split('T')[0],
      status: 'PENDING',
      category: newPageName
    });

    toast.success(`Página Inteligente "${newPageName}" criada com sucesso!`);
    addNotification({
      title: 'Página Inteligente Criada',
      message: `Nova página de checklist "${newPageName}" criada para ${clientObj?.name}.`,
      type: 'SUCCESS'
    });

    setSelectedClientId(targetClientForPage);
    setShowCreateIntelligentPageModal(false);
    setNewPageName('');
    setNewPageInitialTask('');
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setReportPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddVisitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const matchedTask = clientSchedules.find(s => s.id === selectedMaintTaskId);

    const newReport = {
      id: 'report-' + Date.now(),
      clientId: selectedClientId,
      clientName: selectedClient?.name || 'Condomínio',
      date: reportDate,
      technician: reportTechnician || 'Técnico Especialista',
      status: reportStatus,
      taskId: selectedMaintTaskId || undefined,
      taskName: matchedTask ? matchedTask.item : 'Visita de Inspeção Geral',
      observations: reportObservations,
      photos: reportPhotos
    };

    setVisitReports(prev => [newReport, ...prev]);

    // If autocomplete is on and a task is selected, mark it as done
    if (selectedMaintTaskId && autoCompleteTask && matchedTask) {
      handleMarkAsDone(selectedMaintTaskId, matchedTask.frequency);
    }

    toast.success('Relatório de Visita salvo!');
    setShowVisitReportModal(false);

    // Reset Form
    setSelectedMaintTaskId('');
    setReportTechnician('');
    setReportStatus('CONFORME');
    setReportObservations('');
    setReportPhotos([]);
    setReportDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteVisitReport = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir este relatório de visita?')) {
      setVisitReports(prev => prev.filter(r => r.id !== id));
      toast.success('Relatório de visita excluído!');
    }
  };

  const handleExportReportPDF = async (reportItem: any) => {
    if (!selectedClient) return;
    
    toast.loading('Gerando laudo técnico da visita em PDF...', { id: 'pdf-report' });
    
    try {
      const printContainer = document.getElementById(`print-report-container-${reportItem.id}`);
      if (printContainer) {
        window.scrollTo(0, 0);
        await generatePdf(printContainer, `Laudo_Vistoria_${selectedClient.name.replace(/\s+/g, '_')}_${reportItem.date.replace(/-/g, '_')}.pdf`);
        toast.success('Laudo PDF gerado com sucesso!', { id: 'pdf-report' });
      } else {
        throw new Error('Container de impressão não encontrado');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF do relatório:', error);
      toast.error('Erro ao gerar PDF do relatório', { id: 'pdf-report' });
    }
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
      time: editingTask.time,
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
    const totalClientsCount = clients.length;
    const totalMaintenancesCount = scheduledMaintenances.length;
    const pendingMaintenancesCount = scheduledMaintenances.filter(m => m.status === 'PENDING').length;
    const doneMaintenancesCount = scheduledMaintenances.filter(m => m.status === 'DONE').length;

    const filteredClientsList = clients.filter(client => {
      const clientTasks = scheduledMaintenances.filter(m => m.clientId === client.id);
      const matchesSearch = client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
        (client.address && client.address.toLowerCase().includes(clientSearchQuery.toLowerCase())) ||
        (client.document && client.document.toLowerCase().includes(clientSearchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (clientFilterTab === 'has_tasks') return clientTasks.length > 0;
      if (clientFilterTab === 'pending') return clientTasks.some(m => m.status === 'PENDING');
      return true;
    });

    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white font-sans p-4 md:p-8 relative overflow-hidden -m-8">
        {/* Futuristic background glow circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          {/* TOP HEADER BANNER */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-zinc-900/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-[#39FF14] to-indigo-500" />
            
            <div className="flex items-center gap-4">
              <BackButton />
              <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-500/40 rounded-2xl text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] shrink-0">
                <Wrench className="w-8 h-8 text-[#39FF14]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    NBR 5674 &bull; MANUTENÇÃO
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-[#39FF14] border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping" />
                    SISTEMA ATIVO
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-1">
                  MANUTENÇÃO <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#39FF14]">PREVENTIVA</span>
                </h1>
                <p className="text-zinc-400 text-xs md:text-sm font-medium mt-0.5">
                  Selecione um cliente para gerenciar rotinas, checklists inteligentes e emissão de laudos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  setSelectedClientIdForTask(clients[0]?.id || '');
                  setShowAddTaskModal(true);
                }}
                className="p-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/40 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl group cursor-pointer"
                title="Criar nova rotina de manutenção preventiva"
              >
                <Plus size={16} className="text-white group-hover:rotate-90 transition-transform" />
                <span>CRIAR MANUTENÇÃO</span>
              </button>

              <button
                onClick={() => {
                  setTargetClientForPage(clients[0]?.id || '');
                  setShowCreateIntelligentPageModal(true);
                }}
                className="p-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl group cursor-pointer"
                title="Criar nova página de checklist inteligente ou diagrama"
              >
                <Zap size={16} className="text-[#39FF14] group-hover:scale-125 transition-transform" />
                <span>Criar Nova Página Inteligente</span>
              </button>

              <button
                onClick={() => navigate('/clients')}
                className="p-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
              >
                <Users size={16} className="text-blue-400" />
                <span>Gerenciar Clientes</span>
              </button>
            </div>
          </div>

          {/* KPI STATS BAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 shrink-0">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total de Clientes</p>
                <p className="text-2xl font-black text-white">{totalClientsCount}</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 shrink-0">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Tarefas Agendadas</p>
                <p className="text-2xl font-black text-white">{totalMaintenancesCount}</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Pendentes</p>
                <p className="text-2xl font-black text-amber-400">{pendingMaintenancesCount}</p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[#39FF14] shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Concluídas</p>
                <p className="text-2xl font-black text-[#39FF14]">{doneMaintenancesCount}</p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl">
            {/* Search Bar */}
            <div className="relative flex items-center w-full sm:w-96 bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-[#39FF14]/50 transition-all">
              <Search size={16} className="text-zinc-400 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome do condomínio, endereço..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full font-medium"
              />
              {clientSearchQuery && (
                <button onClick={() => setClientSearchQuery('')} className="p-1 text-zinc-400 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setClientFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  clientFilterTab === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                onClick={() => setClientFilterTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  clientFilterTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Com Pendências
              </button>
              <button
                onClick={() => setClientFilterTab('has_tasks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  clientFilterTab === 'has_tasks'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Com Tarefas
              </button>
            </div>
          </div>

          {/* CLIENTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClientsList.map(client => {
              const clientTasks = scheduledMaintenances.filter(m => m.clientId === client.id);
              const pendingCount = clientTasks.filter(m => m.status === 'PENDING').length;
              const doneCount = clientTasks.filter(m => m.status === 'DONE').length;
              const totalCount = clientTasks.length;
              const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-[#39FF14]/50 transition-all duration-300 rounded-2xl p-6 shadow-2xl group flex flex-col justify-between backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-[#39FF14] to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />

                  <div className="space-y-4">
                    {/* Header with icon/logo and badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/20 flex items-center justify-center group-hover:border-[#39FF14]/50 group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all shrink-0">
                        <Building2 className="w-6 h-6 text-blue-400 group-hover:text-[#39FF14] transition-colors" />
                      </div>

                      {pendingCount > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                          <Clock size={10} /> {pendingCount} Pendente{pendingCount > 1 ? 's' : ''}
                        </span>
                      ) : totalCount > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-[#39FF14] flex items-center gap-1">
                          <CheckCircle2 size={10} /> Em Dia
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-800 border border-white/10 text-zinc-400">
                          Sem Tarefas
                        </span>
                      )}
                    </div>

                    {/* Client Title and Address */}
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-[#39FF14] transition-colors line-clamp-1">
                        {client.name}
                      </h3>
                      {client.address ? (
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1 line-clamp-1">
                          <MapPin size={12} className="text-zinc-500 shrink-0" />
                          <span>{client.address}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 mt-1 italic">
                          Endereço não especificado
                        </p>
                      )}
                    </div>

                    {/* Progress Bar & Details */}
                    {totalCount > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <span>Conclusão das Tarefas</span>
                          <span className="text-white font-mono">{doneCount}/{totalCount} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-white/5 p-0.5">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-[#39FF14] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card CTA Footer */}
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-400 group-hover:text-[#39FF14] transition-colors">
                    <span>Acessar Checklists</span>
                    <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredClientsList.length === 0 && (
              <div className="col-span-full bg-zinc-900/60 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl">
                <Building2 size={48} className="mx-auto text-zinc-600 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">Nenhum Cliente Encontrado</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
                  {clientSearchQuery 
                    ? `Nenhum resultado corresponde à busca "${clientSearchQuery}". Tente outros termos.` 
                    : 'Sua conta ainda não possui clientes cadastrados para gerenciar manutenções.'}
                </p>
                <button
                  onClick={() => navigate('/clients')}
                  className="p-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-xl transition-all"
                >
                  Cadastrar Primeiro Cliente
                </button>
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
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <p className="text-white/50 text-xs font-mono">
                    {format(time, "EEEE, dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                  
                  <button
                    onClick={() => {
                      setSelectedClientIdForTask(selectedClientId || '');
                      setShowAddTaskModal(true);
                    }}
                    className="p-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-400/40 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                    title="Criar nova manutenção preventiva"
                  >
                    <Plus size={12} className="text-white" />
                    <span>CRIAR MANUTENÇÃO</span>
                  </button>

                  <button
                    onClick={() => {
                      setTargetClientForPage(selectedClientId || '');
                      setShowCreateIntelligentPageModal(true);
                    }}
                    className="p-1.5 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/60 border border-emerald-400/40 text-[#39FF14] hover:text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                  >
                    <Zap size={12} className="text-[#39FF14]" />
                    <span>+ Página Inteligente</span>
                  </button>
                </div>
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
        <div className="flex border-b border-white/10 overflow-x-auto whitespace-nowrap scrollbar-none">
          {[
            { id: 'activities', label: '📋 Atividades', icon: Wrench },
            { id: 'schedule', label: '📅 Agenda Semanal', icon: Calendar },
            { id: 'visit-reports', label: '📸 Relatório de Visita', icon: Camera },
            { id: 'iot-alerts', label: `🚨 Alertas (${iotAlerts.length})`, icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-black border-b-2 transition-all shrink-0 ${
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
                                  {task.time ? <span className="text-white/50 text-[11px] ml-1">às {task.time}</span> : null}
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isDone && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedMaintTaskId(task.id);
                                        setReportObservations(`Vistoria preventiva realizada com sucesso para o item "${task.item}". Equipamento inspecionado e testado em conformidade com as normas técnicas vigentes.`);
                                        setShowVisitReportModal(true);
                                      }}
                                      className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all"
                                      title="Fazer Relatório de Visita"
                                    >
                                      <Camera className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleMarkAsDone(task.id, task.frequency)}
                                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                                      title="Marcar como Concluído"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </>
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

            {/* TAB 4: VISIT TECHNICAL REPORTS & PHOTOS */}
            {activeTab === 'visit-reports' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col shadow-lg backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-cyan-400" /> Relatórios de Visita Técnica
                    </h3>
                    <p className="text-xs text-white/40 mt-1">
                      Registro de vistorias preventivas com fotos, observações e laudo técnico para exportação.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMaintTaskId('');
                      setReportObservations('');
                      setShowVisitReportModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-500/10 transition-all transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" /> Registrar Visita
                  </button>
                </div>

                <div className="space-y-6">
                  {visitReports.length > 0 ? (
                    visitReports.map((report) => {
                      const statusStyles = {
                        CONFORME: { bg: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400', label: 'Conforme' },
                        RESSALVA: { bg: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400', label: 'Com Ressalva' },
                        CRITICO: { bg: 'bg-red-500/15 border-red-500/25 text-red-400', label: 'Crítico / Atenção' }
                      };

                      const currentStatus = statusStyles[report.status as keyof typeof statusStyles] || statusStyles.CONFORME;

                      return (
                        <div 
                          key={report.id} 
                          className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all"
                        >
                          {/* Hidden print container with a gorgeous, high-fidelity technical layout */}
                          <div 
                            id={`print-report-container-${report.id}`} 
                            style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '210mm', minHeight: '297mm', background: '#ffffff', color: '#1e293b' }}
                          >
                            <div className="p-12 bg-white text-slate-800 font-sans min-h-[297mm] flex flex-col justify-between">
                              <div>
                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
                                  <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Laudo Técnico de Vistoria</h1>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Sistema Integrado de Manutenção Predial • {selectedClient?.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded font-mono text-xs font-bold">
                                      ID: #{report.id.split('-')[1] || report.id}
                                    </span>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{format(parseISO(report.date), 'dd/MM/yyyy')}</p>
                                  </div>
                                </div>

                                {/* Metadata Grid */}
                                <div style={{ display: 'flex', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '32px', width: '100%' }}>
                                  <div style={{ flex: '1' }}>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Cliente / Condomínio</p>
                                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedClient?.name}</p>
                                    <p className="text-slate-500 mt-1">{selectedClient?.address || 'Endereço não cadastrado'}</p>
                                  </div>
                                  <div style={{ flex: '1' }}>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Responsável Técnico</p>
                                    <p className="font-bold text-slate-800 text-sm mt-0.5">{report.technician}</p>
                                    <p className="text-slate-500 mt-1">CREA/CFT registrado</p>
                                  </div>
                                </div>

                                {/* Task Details & Assessment */}
                                <div className="mb-8">
                                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">Escopo e Avaliação</h3>
                                  <div className="flex justify-between items-center mb-4">
                                    <div>
                                      <p className="text-slate-500 text-xs">Atividade Relacionada:</p>
                                      <p className="font-bold text-slate-800 text-sm">{report.taskName}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-slate-500 text-xs mb-1">Status de Conformidade:</p>
                                      <span className={`inline-block px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${
                                        report.status === 'CONFORME' 
                                          ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' 
                                          : report.status === 'RESSALVA'
                                          ? 'bg-yellow-100 border border-yellow-300 text-yellow-800'
                                          : 'bg-red-100 border border-red-300 text-red-800'
                                      }`}>
                                        {report.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Observations / Findings */}
                                <div className="mb-8 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">Observações e Recomendações Técnicas</h3>
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{report.observations}</p>
                                </div>

                                {/* Inspection Photos Grid */}
                                {report.photos && report.photos.length > 0 && (
                                  <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-4">Registro Fotográfico de Evidências</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
                                      {report.photos.map((photo: string, idx: number) => (
                                        <div key={idx} style={{ width: 'calc(50% - 8px)', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', backgroundColor: '#f8fafc', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                          <div className="h-44 w-full flex items-center justify-center overflow-hidden rounded bg-black">
                                            <img src={photo} alt={`Evidência ${idx + 1}`} className="max-h-full max-w-full object-contain text-slate-400" />
                                          </div>
                                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 font-mono">Evidência #{idx + 1} - Registro de Campo</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Technical Signatures */}
                              <div className="border-t border-slate-200 pt-8 mt-12 text-center text-[10px]" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px', marginTop: '48px', display: 'flex', justifyContent: 'space-between', width: '100%', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                                  <div style={{ width: '100%', maxWidth: '192px', borderBottom: '1px solid #94a3b8', height: '40px', marginBottom: '8px' }}></div>
                                  <p style={{ fontWeight: '700', color: '#334155', margin: '0' }}>{report.technician}</p>
                                  <p style={{ color: '#94a3b8', fontWeight: '500', margin: '0', fontSize: '10px' }}>Responsável Técnico</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                                  <div style={{ width: '100%', maxWidth: '192px', borderBottom: '1px solid #94a3b8', height: '40px', marginBottom: '8px' }}></div>
                                  <p style={{ fontWeight: '700', color: '#334155', margin: '0' }}>Responsável Administrativo</p>
                                  <p style={{ color: '#94a3b8', fontWeight: '500', margin: '0', fontSize: '10px' }}>{selectedClient?.name}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Display card */}
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border ${currentStatus.bg}`}>
                                  {currentStatus.label}
                                </span>
                                <span className="text-[10px] text-white/40 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-white/30" /> {format(parseISO(report.date), 'dd/MM/yyyy')}
                                </span>
                                <span className="text-white/20">•</span>
                                <span className="text-[10px] text-white/50 font-medium text-white/60">
                                  Técnico: <strong className="text-white/80">{report.technician}</strong>
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white mb-2">
                                {report.taskName}
                              </h4>

                              <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line bg-white/[0.01] border border-white/5 rounded-xl p-3 mb-4">
                                {report.observations}
                              </p>

                              {/* Horizontal scroll of photos */}
                              {report.photos && report.photos.length > 0 && (
                                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                                  {report.photos.map((photo: string, index: number) => (
                                    <div 
                                      key={index} 
                                      onClick={() => setPhotoZoomUrl(photo)}
                                      className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10 hover:border-cyan-400/50 cursor-zoom-in transition-all group"
                                    >
                                      <img src={photo} alt="Inspeção" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Camera className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions Column */}
                            <div className="flex md:flex-col justify-end md:justify-start gap-2 self-end md:self-stretch shrink-0">
                              <button
                                onClick={() => handleExportReportPDF(report)}
                                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Laudo PDF
                              </button>
                              <button
                                onClick={() => handleDeleteVisitReport(report.id)}
                                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-white/50 text-sm bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <Camera className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="font-bold text-white text-base">Nenhum Relatório de Visita</p>
                      <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                        Registre a vistoria técnica da sua atividade preventiva para gerar relatórios detalhados com anexos fotográficos.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedMaintTaskId('');
                          setReportObservations('');
                          setShowVisitReportModal(true);
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Registrar Primeira Visita
                      </button>
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

                  <div>
                    <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5">Horário</label>
                    <input 
                      type="time"
                      value={sidebarTask.time || ''}
                      onChange={(e) => setSidebarTask({ ...sidebarTask, time: e.target.value })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setShowAddTaskModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-2xl text-blue-400">
                <Plus size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Adicionar Manutenção</h2>
                <p className="text-xs text-zinc-400">Agende uma rotina preventiva de manutenção</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Cliente / Condomínio</label>
                <select
                  value={selectedClientIdForTask || selectedClientId || ''}
                  onChange={(e) => setSelectedClientIdForTask(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white text-xs font-semibold"
                >
                  <option value="" disabled>Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Item da Manutenção</label>
                <input 
                  type="text"
                  value={newTask.item}
                  onChange={(e) => setNewTask({...newTask, item: e.target.value})}
                  placeholder="Ex: Inspeção dos Extintores / Limpeza de Reservatório"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Frequência</label>
                  <select
                    value={newTask.frequency}
                    onChange={(e) => setNewTask({...newTask, frequency: e.target.value as any})}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 outline-none focus:border-blue-500 transition-all text-white text-xs font-semibold"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Atividade Única">Atividade Única</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Categoria</label>
                  <input 
                    type="text"
                    value={newTask.category}
                    onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                    placeholder="Ex: Elétrica"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleAddTask}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-black text-xs uppercase tracking-wider transition-all text-white shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Intelligent Page Modal */}
      {showCreateIntelligentPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg shadow-2xl relative my-8 overflow-hidden">
            <button 
              type="button"
              onClick={() => setShowCreateIntelligentPageModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-[#39FF14]">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Criar Nova Página Inteligente</h2>
                <p className="text-xs text-zinc-400">Gere rotinas preditivas ou checklists customizados</p>
              </div>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setCreatePageMode('custom')}
                className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  createPageMode === 'custom'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Customizada
              </button>
              <button
                type="button"
                onClick={() => setCreatePageMode('nbr5674')}
                className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  createPageMode === 'nbr5674'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                NBR 5674
              </button>
              <button
                type="button"
                onClick={() => setCreatePageMode('mindmap')}
                className={`py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  createPageMode === 'mindmap'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mapa IoT
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Client */}
              {createPageMode !== 'mindmap' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Cliente / Condomínio Alvo</label>
                  <select
                    value={targetClientForPage || selectedClientId || ''}
                    onChange={(e) => setTargetClientForPage(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white text-xs font-semibold"
                  >
                    <option value="" disabled>Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Page Fields */}
              {createPageMode === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Nome da Página / Categoria Especial</label>
                    <input
                      type="text"
                      placeholder="Ex: Rotina Semanal de Geradores e Nobreaks"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Atividade Inicial Recomendada</label>
                    <input
                      type="text"
                      placeholder="Ex: Checar nível de óleo e combustível do gerador"
                      value={newPageInitialTask}
                      onChange={(e) => setNewPageInitialTask(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Frequência Padrão</label>
                    <select
                      value={newPageFreq}
                      onChange={(e) => setNewPageFreq(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-white text-xs font-semibold"
                    >
                      <option value="Mensal">Mensal</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                      <option value="Atividade Única">Atividade Única</option>
                    </select>
                  </div>
                </>
              )}

              {/* NBR 5674 Info */}
              {createPageMode === 'nbr5674' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 space-y-2 text-xs text-blue-200">
                  <p className="font-bold flex items-center gap-2 text-blue-400">
                    <CheckCircle2 size={16} /> Protocolo de Manutenção Predial NBR 5674
                  </p>
                  <p className="text-zinc-300">
                    Esta opção gera automaticamente a lista completa de rotinas técnicas de manutenção (Sistemas Elétricos, Hidráulicos, SPDA, Elevadores, Incêndio e Impermeabilização) para o condomínio selecionado.
                  </p>
                </div>
              )}

              {/* Mind Map Info */}
              {createPageMode === 'mindmap' && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 space-y-2 text-xs text-purple-200">
                  <p className="font-bold flex items-center gap-2 text-purple-400">
                    <Activity size={16} /> Mapa Mental e Diagrama de Instalações IoT
                  </p>
                  <p className="text-zinc-300">
                    Acesse a página de mapa mental com diagrama interativo dos pontos de instalação e sensores da edificação.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateIntelligentPageModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleCreateIntelligentPage}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-black text-xs uppercase tracking-wider transition-all text-white shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {createPageMode === 'mindmap' ? 'Abrir Mapa' : 'Criar Página'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Template (Hidden off-screen to allow proper style calculation) */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '210mm', minHeight: '297mm', background: '#ffffff' }}>
        <div 
          ref={printRef} 
          ref-name="printRef"
          className="bg-white text-zinc-900 font-sans pdf-content relative overflow-hidden"
          style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '0', boxSizing: 'border-box' }}
        >
          {/* Top Accent Line */}
          <div className="h-2 w-full bg-blue-600 mb-0"></div>

          <div className="p-12">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-zinc-200 break-inside-avoid w-full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', borderBottom: '1px solid #e4e4e7', paddingBottom: '32px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', width: '60%' }}>
                {companyLogo ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', border: '1px solid #f4f4f5', borderRadius: '16px', backgroundColor: '#fafafa', width: '70px', height: '70px', flexShrink: 0 }}>
                    <img src={companyLogo} alt="Logo" className="max-h-full max-w-full object-contain" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#2563eb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench style={{ width: '32px', height: '32px', color: '#ffffff' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#000000', textTransform: 'uppercase', marginBottom: '4px', lineHeight: '1.1' }}>
                    {companyData?.name || 'IA COMPANY'}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', margin: '0' }}>
                      CNPJ: {companyData?.document || '---'}
                    </p>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', margin: '0' }}>
                      {companyData?.email || 'contato@empresa.com'}
                    </p>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', margin: '0' }}>
                      {companyData?.phone || '(00) 0000-0000'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '40%', textAlign: 'right' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  ENGENHARIA E MANUTENÇÃO
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#000000', textTransform: 'uppercase', lineHeight: '1', margin: '0' }}>
                  RELATÓRIO TÉCNICO
                </h1>
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase' }}>Data Referência:</span>
                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#000000' }}>{format(new Date(), 'dd/MM/yyyy')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase' }}>Protocolo:</span>
                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#000000' }}>#{selectedClient?.id.substring(0, 8).toUpperCase() || '---'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Card */}
            <div className="mb-10 bg-zinc-50 p-8 rounded-3xl border border-zinc-100 flex flex-col relative overflow-hidden break-inside-avoid" style={{ padding: '32px', borderRadius: '24px', border: '1px solid #f4f4f5', backgroundColor: '#fafafa', position: 'relative', overflow: 'hidden', marginBottom: '40px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: '0', left: '0', width: '6px', height: '100%', backgroundColor: '#2563eb' }}></div>
              <h3 style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#a1a1aa', marginBottom: '16px', marginLeft: '8px', marginTop: '0' }}>Unidade / Edificação Monitorada</h3>
              <div style={{ marginLeft: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: '900', color: '#000000', lineHeight: '1.2', marginBottom: '24px', marginTop: '0' }}>
                  {selectedClient?.name || '________________________________'}
                </p>
                <div style={{ display: 'flex', gap: '32px', width: '100%' }}>
                  <div style={{ flex: '1', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '4px', marginTop: '0' }}>Endereço de Atendimento</p>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin style={{ width: '14px', height: '14px', color: '#d4d4d8', flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#000000', margin: '0', lineHeight: '1.4' }}>{selectedClient?.address || '---'}</p>
                    </div>
                  </div>
                  <div style={{ flex: '1', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
                    <p style={{ fontSize: '9px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '4px', marginTop: '0' }}>Responsável Técnico</p>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#000000', margin: '0', lineHeight: '1.4' }}>Engenheiro / Técnico Responsável</p>
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
                        {schedule.time ? ` às ${schedule.time}` : ''}
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
            <div className="mt-16 break-inside-avoid pt-12 border-t border-zinc-100" style={{ marginTop: '64px', paddingTop: '48px', borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', gap: '40px', width: '100%', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '45%' }}>
                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px', width: '100%' }}>
                  {companySignature && (
                    <img 
                      src={companySignature} 
                      alt="Assinatura" 
                      className="max-h-full max-w-[200px] object-contain opacity-90" 
                      style={{ maxHeight: '100%', maxWidth: '200px', objectFit: 'contain', opacity: '0.9' }}
                    />
                  )}
                </div>
                <div style={{ width: '100%', borderTop: '1px solid #d4d4d8', paddingTop: '16px' }}>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#000000', margin: '0', marginBottom: '4px', lineHeight: '1' }}>{companyData?.name || 'IA COMPANY'}</p>
                  <p style={{ fontSize: '9px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', margin: '0' }}>Responsável Técnico</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '45%' }}>
                <div style={{ height: '80px', marginBottom: '8px', width: '100%' }}></div>
                <div style={{ width: '100%', borderTop: '1px solid #d4d4d8', paddingTop: '16px' }}>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#000000', margin: '0', marginBottom: '4px', lineHeight: '1' }}>{selectedClient?.name.substring(0, 30)}</p>
                  <p style={{ fontSize: '9px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', margin: '0' }}>Ciente do Gestor / Síndico</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-10 border-t border-zinc-100 break-inside-avoid" style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <p style={{ fontSize: '9px', fontWeight: '700', color: '#d4d4d8', textTransform: 'uppercase', letterSpacing: '1px', fontStyle: 'italic', margin: '0', width: '75%' }}>
                Este relatório atesta a realização das inspeções documentadas. Não substitui ensaios laboratoriais ou laudos específicos de engenharia.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', width: '25%', justifyContent: 'flex-end' }}>
                <p style={{ fontSize: '9px', fontWeight: '900', color: '#18181b', textTransform: 'uppercase', letterSpacing: '1px', margin: '0' }}>
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
                  <option value="Mensal" className="bg-[#18181b] text-white">Mensal</option>
                  <option value="Trimestral" className="bg-[#18181b] text-white">Trimestral</option>
                  <option value="Semestral" className="bg-[#18181b] text-white">Semestral</option>
                  <option value="Anual" className="bg-[#18181b] text-white">Anual</option>
                  <option value="Atividade Única" className="bg-[#18181b] text-white">Atividade Única</option>
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
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Horário da Manutenção</label>
                <input 
                  type="time"
                  value={editingTask.time || ''}
                  onChange={(e) => setEditingTask({...editingTask, time: e.target.value})}
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

      {/* Visit Report Modal */}
      {showVisitReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#1e293b] border border-white/10 rounded-[2rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl my-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <Camera className="text-cyan-400" /> Registrar Relatório de Visita
            </h2>
            <p className="text-xs text-white/50 mb-6">
              Registre observações técnicas e anexe imagens para comprovação e geração de laudos em PDF.
            </p>
            
            <form onSubmit={handleAddVisitReport} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Atividade Preventiva Relacionada</label>
                  <select
                    value={selectedMaintTaskId}
                    onChange={(e) => {
                      setSelectedMaintTaskId(e.target.value);
                      const matched = clientSchedules.find(s => s.id === e.target.value);
                      if (matched) {
                        setReportObservations(`Vistoria preventiva realizada com sucesso para o item "${matched.item}". Equipamento inspecionado e testado em conformidade com as normas técnicas vigentes.`);
                      } else {
                        setReportObservations('');
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white text-xs"
                  >
                    <option value="" className="bg-[#1e293b]">Visita de Inspeção Geral (Nenhuma atividade específica)</option>
                    {clientSchedules.map(task => (
                      <option key={task.id} value={task.id} className="bg-[#1e293b]">
                        {task.status === 'DONE' ? '✅' : '⏳'} {task.item} ({task.category || 'Geral'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Data da Visita</label>
                  <input 
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Técnico Responsável</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva (Técnico Residente)"
                    value={reportTechnician}
                    onChange={(e) => setReportTechnician(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Status da Avaliação</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'CONFORME', label: 'Conforme', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10' },
                      { id: 'RESSALVA', label: 'Ressalva', color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10' },
                      { id: 'CRITICO', label: 'Crítico', color: 'border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10' },
                    ].map(status => (
                      <button
                        type="button"
                        key={status.id}
                        onClick={() => setReportStatus(status.id as any)}
                        className={`py-2 px-1 border rounded-xl text-center text-xs font-black transition-all ${
                          reportStatus === status.id
                            ? 'bg-white text-black border-white shadow-md'
                            : status.color
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Parecer Técnico / Observações</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva as condições técnicas encontradas, ações tomadas e recomendações..."
                  value={reportObservations}
                  onChange={(e) => setReportObservations(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white text-xs resize-none"
                />
              </div>

              {/* Photos Attachment and Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Fotos da Vistoria (Anexos de Evidência)</label>
                <p className="text-[10px] text-white/40 mb-3">Selecione fotos reais do seu dispositivo ou use fotos de exemplo pré-configuradas para demonstração rápida.</p>
                
                {/* Sample Presets */}
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold flex items-center">Fotos Rápidas:</span>
                  {PRESET_INSPECTION_PHOTOS.map((preset, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => {
                        if (reportPhotos.includes(preset.url)) {
                          setReportPhotos(prev => prev.filter(u => u !== preset.url));
                        } else {
                          setReportPhotos(prev => [...prev, preset.url]);
                        }
                      }}
                      className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        reportPhotos.includes(preset.url)
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm shadow-cyan-500/15'
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>

                {/* File Upload zone */}
                <div className="relative border border-dashed border-white/10 rounded-xl p-4 text-center hover:bg-white/[0.02] hover:border-white/20 transition-all group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-1.5 group-hover:text-cyan-400 transition-colors" />
                  <p className="text-xs text-white/60 font-bold">Arraste ou clique para enviar fotos do dispositivo</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Suporta formatos de imagem padrão (PNG, JPG, HEIC)</p>
                </div>

                {/* Preview Gallery */}
                {reportPhotos.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 max-h-36 overflow-y-auto bg-black/30 p-2.5 rounded-xl border border-white/5">
                    {reportPhotos.map((photo, index) => (
                      <div key={index} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 group">
                        <img src={photo} alt="Anexo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setReportPhotos(prev => prev.filter((_, i) => i !== index))}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedMaintTaskId && (
                <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="autoCompleteTask"
                    checked={autoCompleteTask}
                    onChange={(e) => setAutoCompleteTask(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <label htmlFor="autoCompleteTask" className="text-xs text-emerald-400 font-semibold cursor-pointer select-none">
                    Marcar a atividade preventiva relacionada como Concluída automaticamente
                  </label>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowVisitReportModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-white text-xs uppercase tracking-widest cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-bold transition-all text-white text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Salvar Relatório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {photoZoomUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out"
          onClick={() => setPhotoZoomUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center">
            <img src={photoZoomUrl} alt="Visualização em Alta Resolução" className="max-w-full max-h-full rounded-xl object-contain shadow-2xl border border-white/10" referrerPolicy="no-referrer" />
            <button
              onClick={() => setPhotoZoomUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-cyan-400 font-black text-sm tracking-wider uppercase bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer"
            >
              Fechar X
            </button>
          </div>
        </div>
      )}
    </>
  );
}
