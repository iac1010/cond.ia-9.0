import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Tag, Edit2, CheckSquare, 
  TrendingUp, Play, Pause, RotateCcw, Brain, Award, Calendar, 
  Clock, BarChart3, PieChart as PieIcon, Layers, AlertCircle, Sparkles, Filter, Check, X,
  FileText, Activity, Zap, ShieldAlert, ArrowLeftRight, Star, Paperclip, Eye, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { BackButton } from '../components/BackButton';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  category: 'Trabalho' | 'Pessoal' | 'Fazer Diariamente' | 'Urgente';
  createdAt: string;
  priority?: 'Alta' | 'Média' | 'Baixa';
  difficulty?: 'Fácil' | 'Média' | 'Difícil';
  estimatedMinutes?: number;
  notes?: string;
  completedAt?: string;
  starred?: boolean;
  installationDetails?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  osNumber?: string;
}

const CATEGORIES = ['Trabalho', 'Pessoal', 'Fazer Diariamente', 'Urgente'] as const;
const PRIORITIES = ['Alta', 'Média', 'Baixa'] as const;
const DIFFICULTIES = ['Fácil', 'Média', 'Difícil'] as const;

const NEON_COLORS = {
  green: '#39FF14',
  blue: '#3b82f6',
  purple: '#a855f7',
  rose: '#f43f5e',
  amber: '#f59e0b',
  zinc: '#71717a'
};

const CATEGORY_STYLES = {
  Trabalho: {
    bg: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
    dot: 'bg-blue-500',
    badge: 'border-blue-500/30'
  },
  Pessoal: {
    bg: 'bg-purple-500/10 border-purple-500/25 text-purple-400',
    dot: 'bg-purple-500',
    badge: 'border-purple-500/30'
  },
  'Fazer Diariamente': {
    bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'border-emerald-500/30'
  },
  Urgente: {
    bg: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
    dot: 'bg-rose-500',
    badge: 'border-rose-500/30'
  }
};

const PRIORITY_STYLES = {
  Alta: { text: 'text-rose-400 border-rose-500/30 bg-rose-500/5', color: '#f43f5e', icon: ShieldAlert },
  Média: { text: 'text-amber-400 border-amber-500/30 bg-amber-500/5', color: '#f59e0b', icon: AlertCircle },
  Baixa: { text: 'text-sky-400 border-sky-500/30 bg-sky-500/5', color: '#0ea5e9', icon: Check }
};

const DIFFICULTY_STYLES = {
  Fácil: { text: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
  Média: { text: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
  Difícil: { text: 'text-purple-400 border-purple-500/30 bg-purple-500/5' }
};

export default function TasksProductivity() {
  const navigate = useNavigate();
  const { addTicket, companyData, companyLogo } = useStore();
  const [activeTab, setActiveTab] = useState<'tasks' | 'metrics'>('tasks');
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  
  // State for document viewing modal
  const [viewingTask, setViewingTask] = useState<DailyTask | null>(null);

  // States for filter and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Completados' | 'Pendentes'>('Pendentes');

  // Form creation / editing states
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DailyTask['category']>('Trabalho');
  const [formPriority, setFormPriority] = useState<DailyTask['priority']>('Média');
  const [formDifficulty, setFormDifficulty] = useState<DailyTask['difficulty']>('Média');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState<number>(30);
  const [formNotes, setFormNotes] = useState('');
  const [formInstallationDetails, setFormInstallationDetails] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formOsNumber, setFormOsNumber] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load and populate tasks
  const loadTasksFromStorage = () => {
    const saved = localStorage.getItem('condfy_daily_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DailyTask[];
        
        // Ensure all historical completed tasks have some estimated time and priority if missing
        const filledTasks = parsed.map(t => ({
          ...t,
          priority: t.priority || 'Média',
          difficulty: t.difficulty || 'Média',
          estimatedMinutes: t.estimatedMinutes !== undefined ? t.estimatedMinutes : 30,
          notes: t.notes || '',
          completedAt: t.completed && !t.completedAt ? t.createdAt || new Date().toISOString() : t.completedAt,
          installationDetails: t.installationDetails || '',
          attachmentName: t.attachmentName || '',
          attachmentUrl: t.attachmentUrl || '',
          osNumber: t.osNumber || ''
        }));
        setTasks(filledTasks);
      } catch (e) {
        setTasks([]);
      }
    } else {
      // Default seed tasks with structured classifications to render nice analytics
      const defaultTasks: DailyTask[] = [
        { 
          id: '1', 
          title: 'Vistoriar casa de bombas do bloco A', 
          completed: true, 
          category: 'Fazer Diariamente', 
          priority: 'Alta', 
          difficulty: 'Média', 
          estimatedMinutes: 20, 
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3.5 * 3600000).toISOString(),
          notes: 'Tudo de acordo, nível do óleo do motor lubrificado.'
        },
        { 
          id: '2', 
          title: 'Fechamento mensal da cota condominial', 
          completed: true, 
          category: 'Trabalho', 
          priority: 'Alta', 
          difficulty: 'Difícil', 
          estimatedMinutes: 90, 
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
          completedAt: new Date(Date.now() - 22 * 3600000).toISOString(),
          notes: 'Envio realizado no e-mail geral.' 
        },
        { 
          id: '3', 
          title: 'Troca de lâmpadas no estacionamento', 
          completed: false, 
          category: 'Trabalho', 
          priority: 'Média', 
          difficulty: 'Fácil', 
          estimatedMinutes: 15, 
          createdAt: new Date().toISOString(),
          notes: 'Separar escada de alumínio.' 
        },
        { 
          id: '4', 
          title: 'Contratar manutenção preventiva dos portões', 
          completed: false, 
          category: 'Urgente', 
          priority: 'Alta', 
          difficulty: 'Média', 
          estimatedMinutes: 45, 
          createdAt: new Date().toISOString() 
        },
        { 
          id: '5', 
          title: 'Organizar armário do salão de festas', 
          completed: true, 
          category: 'Pessoal', 
          priority: 'Baixa', 
          difficulty: 'Fácil', 
          estimatedMinutes: 60, 
          createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
          completedAt: new Date(Date.now() - 47 * 3600000).toISOString()
        }
      ];
      setTasks(defaultTasks);
      localStorage.setItem('condfy_daily_tasks', JSON.stringify(defaultTasks));
    }
  };

  useEffect(() => {
    loadTasksFromStorage();

    const handleTasksUpdatedEvent = () => {
      loadTasksFromStorage();
    };

    window.addEventListener('condfy_daily_tasks_updated', handleTasksUpdatedEvent);
    return () => {
      window.removeEventListener('condfy_daily_tasks_updated', handleTasksUpdatedEvent);
    };
  }, []);

  // Auto-open form on parameter query (?new=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setIsFormOpen(true);
      // Clean up parameter in URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Save to LocalStorage whenever tasks update
  const saveTasks = (newTasks: DailyTask[]) => {
    setTasks(newTasks);
    localStorage.setItem('condfy_daily_tasks', JSON.stringify(newTasks));
    window.dispatchEvent(new Event('condfy_daily_tasks_updated'));
  };

  // Create or Update task
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTask) {
      // Update existing task
      const updated = tasks.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            title: formTitle,
            category: formCategory,
            priority: formPriority,
            difficulty: formDifficulty,
            estimatedMinutes: formEstimatedMinutes,
            notes: formNotes,
            installationDetails: formInstallationDetails,
            attachmentName: formAttachmentName,
            attachmentUrl: formAttachmentUrl,
            osNumber: formOsNumber
          };
        }
        return t;
      });
      saveTasks(updated);
      toast.success('Tarefa atualizada!');
    } else {
      // Create new task
      const newTask: DailyTask = {
        id: Date.now().toString(),
        title: formTitle,
        completed: false,
        category: formCategory,
        createdAt: new Date().toISOString(),
        priority: formPriority,
        difficulty: formDifficulty,
        estimatedMinutes: formEstimatedMinutes,
        notes: formNotes,
        installationDetails: formInstallationDetails,
        attachmentName: formAttachmentName,
        attachmentUrl: formAttachmentUrl,
        osNumber: formOsNumber
      };
      saveTasks([newTask, ...tasks]);
      
      // Also add to Kanban board as a Ticket of type TAREFA
      const formattedObservations = [
        formNotes || 'Sem observações.',
        formInstallationDetails ? `Instalação: ${formInstallationDetails}` : '',
        formOsNumber ? `OS Nº: ${formOsNumber}` : '',
        formAttachmentName ? `Anexo: ${formAttachmentName}` : ''
      ].filter(Boolean).join('\n');

      addTicket({
        title: formTitle,
        type: 'TAREFA',
        status: 'APROVADO',
        date: new Date().toISOString().split('T')[0],
        technician: 'Administrador',
        observations: formattedObservations,
        maintenanceCategory: formCategory,
        color: formPriority === 'Alta' ? '#f43f5e' : formPriority === 'Média' ? '#f59e0b' : '#0ea5e9'
      });

      toast.success('Tarefa operacional criada e adicionada ao Kanban! 📋');
    }

    resetFormState();
  };

  const resetFormState = () => {
    setFormTitle('');
    setFormCategory('Trabalho');
    setFormPriority('Média');
    setFormDifficulty('Média');
    setFormEstimatedMinutes(30);
    setFormNotes('');
    setFormInstallationDetails('');
    setFormAttachmentName('');
    setFormAttachmentUrl('');
    setFormOsNumber('');
    setEditingTask(null);
    setIsFormOpen(false);
  };

  // Trigger editing a task
  const handleStartEdit = (task: DailyTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setFormTitle(task.title);
    setFormCategory(task.category);
    setFormPriority(task.priority || 'Média');
    setFormDifficulty(task.difficulty || 'Média');
    setFormEstimatedMinutes(task.estimatedMinutes !== undefined ? task.estimatedMinutes : 30);
    setFormNotes(task.notes || '');
    setFormInstallationDetails(task.installationDetails || '');
    setFormAttachmentName(task.attachmentName || '');
    setFormAttachmentUrl(task.attachmentUrl || '');
    setFormOsNumber(task.osNumber || '');
    setIsFormOpen(true);
  };

  // Toggle completion
  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const isCompletedNow = !t.completed;
        if (isCompletedNow) {
          toast.success('Excelente trabalho! ✨', { icon: '🏆' });
        }
        return {
          ...t,
          completed: isCompletedNow,
          completedAt: isCompletedNow ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Delete task
  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = tasks.filter(t => t.id !== id);
    saveTasks(filtered);
    toast.success('Tarefa removida!');
  };

  // Toggle Star / Highlight state
  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.map(t => {
      if (t.id === id) {
        const isStarred = !t.starred;
        if (isStarred) {
          toast.success('Tarefa em destaque! ⭐');
        } else {
          toast.success('Tarefa removida dos destaques');
        }
        return { ...t, starred: isStarred };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Helper filters
  const filteredTasks = useMemo(() => {
    const list = tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'Todos' || t.category === categoryFilter;
      const matchesPriority = priorityFilter === 'Todos' || t.priority === priorityFilter;
      const matchesStatus = statusFilter === 'Todos' || 
                            (statusFilter === 'Completados' && t.completed) || 
                            (statusFilter === 'Pendentes' && !t.completed);
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });

    // Sort logic: Starred (destaque) tasks first, then by date (newest first)
    return list.slice().sort((a, b) => {
      const aStarred = a.starred ? 1 : 0;
      const bStarred = b.starred ? 1 : 0;
      if (aStarred !== bStarred) {
        return bStarred - aStarred; // Starred at the absolute top!
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, searchTerm, categoryFilter, priorityFilter, statusFilter]);

  // Analytics Metrics computation
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Minutes statistics
    let totalEstimatedMinutes = 0;
    let completedEstimatedMinutes = 0;
    
    // Streak calculations
    let streakDays = 0;
    const completedDates = tasks
      .filter(t => t.completed && t.completedAt)
      .map(t => t.completedAt!.split('T')[0]);
    const uniqueDays = Array.from(new Set(completedDates)).sort();
    
    streakDays = uniqueDays.length; // Simply count of active days with completions as streak for prototype

    tasks.forEach(t => {
      const minutes = t.estimatedMinutes || 0;
      totalEstimatedMinutes += minutes;
      if (t.completed) {
        completedEstimatedMinutes += minutes;
      }
    });

    // Score production calculation
    // Completed tasks * difficulty multiplier
    let productionScore = 0;
    tasks.forEach(t => {
      if (t.completed) {
        let diffMultiplier = 1;
        if (t.difficulty === 'Média') diffMultiplier = 2;
        if (t.difficulty === 'Difícil') diffMultiplier = 3.5;
        
        let priorityMultiplier = 1;
        if (t.priority === 'Média') priorityMultiplier = 1.5;
        if (t.priority === 'Alta') priorityMultiplier = 2.5;

        productionScore += Math.round(10 * diffMultiplier * priorityMultiplier);
      }
    });

    // Categories completed/total aggregation for Recharts
    const categoryDataMap = {
      Trabalho: { name: 'Trabalho', completed: 0, pending: 0, total: 0, color: NEON_COLORS.blue },
      Pessoal: { name: 'Pessoal', completed: 0, pending: 0, total: 0, color: NEON_COLORS.purple },
      'Fazer Diariamente': { name: 'Rotina', completed: 0, pending: 0, total: 0, color: NEON_COLORS.green },
      Urgente: { name: 'Urgente', completed: 0, pending: 0, total: 0, color: NEON_COLORS.rose }
    };

    tasks.forEach(t => {
      const mapKey = t.category;
      if (categoryDataMap[mapKey]) {
        categoryDataMap[mapKey].total += 1;
        if (t.completed) {
          categoryDataMap[mapKey].completed += 1;
        } else {
          categoryDataMap[mapKey].pending += 1;
        }
      }
    });

    const categoryChartData = Object.values(categoryDataMap).filter(c => c.total > 0);

    // Difficulty breakdown distribution data
    const difficultyMap = {
      'Fácil': { name: 'Fácil', completados: 0, pendentes: 0, value: 0 },
      'Média': { name: 'Média', completados: 0, pendentes: 0, value: 0 },
      'Difícil': { name: 'Difícil', completados: 0, pendentes: 0, value: 0 }
    };

    tasks.forEach(t => {
      const diff = t.difficulty || 'Média';
      if (difficultyMap[diff]) {
        difficultyMap[diff].value += 1;
        if (t.completed) {
          difficultyMap[diff].completados += 1;
        } else {
          difficultyMap[diff].pendentes += 1;
        }
      }
    });

    const difficultyChartData = Object.values(difficultyMap);

    // Productivity Grading
    let grade = 'E';
    if (rate >= 90) grade = 'A+';
    else if (rate >= 80) grade = 'A';
    else if (rate >= 70) grade = 'B';
    else if (rate >= 50) grade = 'C';
    else if (rate >= 30) grade = 'D';

    return {
      total,
      completed,
      pending,
      rate,
      totalEstimatedMinutes,
      completedEstimatedMinutes,
      streakDays,
      productionScore,
      grade,
      categoryChartData,
      difficultyChartData
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white -m-6 md:-m-8 p-4 md:p-8 overflow-x-hidden relative">
      {/* Glow Effect header */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#39FF14]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigator */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <BackButton to="/" label="Painel" variant="glass" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#39FF14]/10 text-[#39FF14] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-[#39FF14]/20">
                PRODUTIVIDADE AVANÇADA
              </span>
              <span className="text-[10px] bg-white/5 text-zinc-400 font-extrabold uppercase tracking-wider px-2 py-1 rounded">
                METODOLOGIA DE ALTA PERFORMANCE
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mt-2 tracking-tight uppercase">
              Central de Produção & Métricas
            </h1>
            <p className="text-sm text-zinc-400 mt-1 font-medium">
              Classifique suas tarefas diárias, maximize a eficiência organizacional e analise estatísticas reais.
            </p>
          </div>
        </div>

        {/* Floating Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetFormState();
              setIsFormOpen(true);
            }}
            className="px-5 py-3 bg-[#39FF14] hover:bg-[#34e012] text-black font-black uppercase text-xs tracking-wider rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(57,255,20,0.25)]"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            Nova Tarefa Operacional
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Navigation Tabs bar */}
        <div className="flex border-b border-white/5 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'tasks' 
                ? 'border-[#39FF14] text-[#39FF14]' 
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Tarefas & Classificações ({filteredTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'metrics' 
                ? 'border-[#39FF14] text-[#39FF14]' 
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Métricas de Equipe & Produção
          </button>
        </div>

        {/* Tab content 1: Tasks Grid and Edit Form */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Filter and tasks layout column (Wide) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Search and filter toolbar inside a beautiful slate panel */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
                <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-4 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Filter className="w-3.5 h-3.5" />
                  Barra de Busca Inteligente & Filtros Avançados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Pesquisar</label>
                    <input 
                      type="text" 
                      placeholder="Título ou anotações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Categoria</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                    >
                      <option value="Todos">Todas</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c === 'Fazer Diariamente' ? 'Rotina Diária' : c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Prioridade</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                    >
                      <option value="Todos">Todas</option>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1.5">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                    >
                      <option value="Todos">Qualquer Status</option>
                      <option value="Completados">Resolvidos ✓</option>
                      <option value="Pendentes">Pendentes ⌛</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const catStyle = CATEGORY_STYLES[task.category];
                      const prioStyle = PRIORITY_STYLES[task.priority || 'Média'];
                      const diffStyle = DIFFICULTY_STYLES[task.difficulty || 'Média'];
                      
                      return (
                        <motion.div
                          key={task.id}
                          layoutId={`tasks-page-item-${task.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`border rounded-3xl p-5 transition-all relative overflow-hidden group ${
                            task.completed 
                              ? 'bg-zinc-950/40 border-white/5 opacity-60 hover:opacity-100' 
                              : task.starred
                                ? 'bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-zinc-950/90 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)] hover:border-amber-400'
                                : 'bg-zinc-900/40 hover:bg-zinc-900/70 border-white/10 hover:border-[#39FF14]/40 hover:shadow-[0_0_20px_rgba(57,255,20,0.05)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              {/* circular tick button & star toggle stacked */}
                              <div className="flex flex-col items-center gap-2.5 shrink-0 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                                    task.completed 
                                      ? 'bg-[#39FF14] text-black border-[#39FF14]' 
                                      : 'border-zinc-700 hover:border-[#39FF14] text-transparent hover:text-[#39FF14]/40 bg-black/30'
                                  }`}
                                  title={task.completed ? "Reabrir" : "Concluir"}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleToggleStar(task.id, e)}
                                  className="p-1 rounded-xl bg-black/40 hover:bg-zinc-800 border border-white/5 hover:border-amber-500/40 text-zinc-500 hover:text-amber-400 transition"
                                  title={task.starred ? "Remover Destaque" : "Destacar Tarefa"}
                                >
                                  <Star 
                                    className={`w-4 h-4 transition-all ${
                                      task.starred 
                                        ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                                        : 'text-zinc-500 hover:text-amber-400'
                                    }`} 
                                  />
                                </button>
                              </div>

                              <div className="min-w-0 flex-1">
                                <h3 className={`text-base md:text-lg font-extrabold uppercase tracking-tight leading-snug ${
                                  task.completed 
                                    ? 'line-through text-zinc-500 font-bold italic' 
                                    : task.starred
                                      ? 'text-amber-300 font-black'
                                      : 'text-white'
                                }`}>
                                  {task.title}
                                </h3>

                                {task.notes && (
                                  <p className="text-xs text-zinc-400 mt-1 ml-0.5 whitespace-pre-wrap leading-relaxed font-medium">
                                    {task.notes}
                                  </p>
                                )}

                                {/* Installation details, OS number, and file attachments */}
                                {(task.installationDetails || task.osNumber || task.attachmentName) && (
                                  <div className="mt-3 p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2.5 max-w-xl">
                                    {task.installationDetails && (
                                      <div className="flex items-start gap-1.5 text-xs text-zinc-300">
                                        <Activity className="w-3.5 h-3.5 mt-0.5 text-[#39FF14] shrink-0" />
                                        <div>
                                          <span className="font-extrabold uppercase text-[9px] text-[#39FF14] block tracking-wider">Dados da Instalação</span>
                                          <p className="font-medium text-zinc-300 mt-0.5">{task.installationDetails}</p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                                      {task.osNumber && (
                                        <div className="flex items-center gap-1.5 text-zinc-300">
                                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                          <span className="font-semibold text-zinc-400">OS / Ref:</span>
                                          <span className="font-bold text-white font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/5">{task.osNumber}</span>
                                        </div>
                                      )}
                                      {task.attachmentName && (
                                        <div className="flex items-center gap-1.5 text-zinc-300">
                                          <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                          <span className="font-semibold text-zinc-400">Anexo:</span>
                                          <a 
                                            href={task.attachmentUrl || "#"} 
                                            download={task.attachmentName}
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-bold text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-0.5"
                                            title="Baixar ou abrir anexo"
                                          >
                                            {task.attachmentName}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Attribute badge rows */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                  {/* Star / Destaque Badge */}
                                  {task.starred && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-wider">
                                      ★ Destaque
                                    </span>
                                  )}

                                  {/* Category Badge */}
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${catStyle.bg} ${catStyle.badge}`}>
                                    <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                                    {task.category === 'Fazer Diariamente' ? 'Rotina Diária' : task.category}
                                  </span>

                                  {/* Priority Badge */}
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${prioStyle.text}`}>
                                    <prioStyle.icon className="w-2.5 h-2.5 shrink-0" />
                                    Prioridade: {task.priority || 'Média'}
                                  </span>

                                  {/* Difficulty Badge */}
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${diffStyle.text}`}>
                                    Esforço: {task.difficulty || 'Média'}
                                  </span>

                                  {/* Estimated Duration Badge */}
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-white/5 bg-black/40 text-zinc-400 text-[8px] font-black uppercase tracking-wider">
                                    <Clock className="w-2.5 h-2.5 shrink-0 text-[#39FF14]" />
                                    Est. {task.estimatedMinutes !== undefined ? task.estimatedMinutes : 30} min
                                  </span>

                                  {/* Created At Date status */}
                                  {task.createdAt && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-white/5 bg-black/40 text-zinc-400 text-[8px] font-black uppercase tracking-wider">
                                      📅 Criada em {new Date(task.createdAt).toLocaleDateString('pt-BR')} às {new Date(task.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}

                                  {/* Completed Date status */}
                                  {task.completed && task.completedAt && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[8px] font-black uppercase tracking-wider">
                                      ✓ Concluída em {new Date(task.completedAt).toLocaleDateString('pt-BR')} às {new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions shortcut tools */}
                            <div className="flex items-center gap-1.5 z-20 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingTask(task);
                                }}
                                className="p-2 bg-black/40 hover:bg-[#39FF14]/25 text-[#39FF14] border border-[#39FF14]/30 hover:border-[#39FF14]/60 rounded-xl transition flex items-center gap-1 font-black text-[9px] uppercase tracking-wider px-2 h-8"
                                title="Visualizar Detalhes"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden sm:inline">Visualizar</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleStartEdit(task, e)}
                                className="p-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 rounded-xl transition h-8 w-8 flex items-center justify-center"
                                title="Editar Tarefa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTask(task.id, e)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/10 rounded-xl transition h-8 w-8 flex items-center justify-center"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-zinc-900/10 backdrop-blur-xl flex flex-col items-center justify-center">
                      <CheckSquare className="w-12 h-12 text-[#39FF14]/20 mb-3" />
                      <h4 className="text-lg font-black uppercase tracking-widest text-[#39FF14]">Lista Operacional Vazia</h4>
                      <p className="text-xs text-zinc-500 mt-1.5">Modifique os filtros do topo ou crie um novo planejamento operacional</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Sidebar component: Action Creator and Quick metrics */}
            <div className="space-y-6">
              
              {/* Creator Form drawer */}
              {isFormOpen ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
                >
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                  
                  <h3 className="text-sm font-black uppercase text-[#39FF14] tracking-widest mb-4 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Zap className="w-4 h-4 text-[#39FF14]" />
                    {editingTask ? 'Editar Detalhes' : 'Cadastrar Atividade'}
                  </h3>

                  <form onSubmit={handleSaveForm} className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Título da Atividade *</label>
                      <input 
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Ex: Checar sensores de gás nos subsolos"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Categoria</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase h-9"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'Fazer Diariamente' ? 'Rotina Diária' : c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Prioridade</label>
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value as any)}
                          className="w-full bg-black/40 border border-[#f43f5e]/30 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase h-9"
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Dificuldade / Esforço</label>
                        <select
                          value={formDifficulty}
                          onChange={(e) => setFormDifficulty(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase h-9"
                        >
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Tempo Estimado (min)</label>
                        <input 
                          type="number"
                          min="5"
                          max="480"
                          required
                          value={formEstimatedMinutes}
                          onChange={(e) => setFormEstimatedMinutes(parseInt(e.target.value) || 35)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-semibold h-9"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Notas / Instruções Adicionais</label>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Ex: Necessário portar o chaveiro mestre e relatar qualquer desvio no duto de exaustão principal."
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-medium resize-none"
                      />
                    </div>

                    {/* DADOS DA INSTALAÇÃO & ORÇAMENTO / OS */}
                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-[#39FF14] tracking-widest flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#39FF14]" />
                        Dados da Instalação & Orçamento / OS
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Número da OS / Ref</label>
                          <input 
                            type="text"
                            value={formOsNumber}
                            onChange={(e) => setFormOsNumber(e.target.value)}
                            placeholder="Ex: OS-2026-004"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase h-9"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Identificação da Instalação</label>
                          <input 
                            type="text"
                            value={formInstallationDetails}
                            onChange={(e) => setFormInstallationDetails(e.target.value)}
                            placeholder="Ex: Sala de Bombas / Bloco B"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]/50 font-semibold h-9"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1">Anexar Orçamento ou OS (PDF, Imagem)</label>
                        <div className="relative group">
                          {formAttachmentName ? (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="font-bold text-zinc-200 truncate">{formAttachmentName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormAttachmentName('');
                                  setFormAttachmentUrl('');
                                }}
                                className="p-1 hover:bg-white/10 text-zinc-400 hover:text-rose-400 rounded-lg transition"
                                title="Remover anexo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-white/10 hover:border-[#39FF14]/30 rounded-xl bg-black/20 cursor-pointer hover:bg-black/40 transition-all text-center relative">
                              <input 
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 3 * 1024 * 1024) {
                                      toast.error("O arquivo é muito grande! Escolha um arquivo de até 3MB.");
                                      return;
                                    }
                                    setFormAttachmentName(file.name);
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setFormAttachmentUrl(event.target?.result as string || '');
                                      toast.success(`Arquivo "${file.name}" anexado!`);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <Paperclip className="w-5 h-5 text-zinc-500 mb-1 group-hover:text-[#39FF14] transition-colors" />
                              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider group-hover:text-white">Clique para anexar orçamento/OS</span>
                              <span className="text-[8px] text-zinc-500 mt-0.5">PDF ou Imagem até 3MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={resetFormState}
                        className="flex-1 py-2.5 border border-white/5 bg-white/5 hover:bg-white/10 hover:text-white text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-grow py-2.5 bg-[#39FF14] text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition hover:brightness-110 active:scale-95 shadow-md shadow-[#39FF14]/15"
                      >
                        {editingTask ? 'Salvar Edições' : 'Criar Atividade'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* Clickable panel invitation to create */
                <div 
                  onClick={() => setIsFormOpen(true)}
                  className="bg-zinc-900/60 border border-dashed border-white/10 hover:border-[#39FF14]/30 p-8 rounded-3xl text-center cursor-pointer transition group"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 border border-white/5 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-[#39FF14] stroke-[3]" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#39FF14]">Cadastrar Nova Operação</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 font-medium">Configure prioridades, tempo estimado e tags personalizadas</p>
                </div>
              )}

              {/* Quick KPIs panel */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Activity className="w-4 h-4 text-[#39FF14]" />
                  Status da Produção de Hoje
                </h3>

                <div className="space-y-3">
                  {/* Progress Block */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400 mb-1">
                      <span>Metas Diárias Concluídas</span>
                      <span className="text-[#39FF14]">{stats.rate}%</span>
                    </div>
                    <div className="w-full bg-black/40 border border-white/10 rounded-full h-2.5 overflow-hidden p-0.5">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#39FF14]"
                        style={{ width: `${stats.rate}%` }}
                      />
                    </div>
                  </div>

                  {/* 2 Grid Mini Info */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-black/25 p-2.5 border border-white/5 rounded-2xl text-center">
                      <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">Índice Geral</span>
                      <span className="text-2xl font-black text-white mt-1 block">{stats.completed}/{stats.total}</span>
                    </div>
                    <div className="bg-black/25 p-2.5 border border-white/5 rounded-2xl text-center">
                      <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">Nota Consolidada</span>
                      <span className="text-2xl font-black text-[#39FF14] mt-1 block">{stats.grade}</span>
                    </div>
                  </div>

                  {/* Highlights notes */}
                  <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-2xl p-3 flex gap-2.5 items-start mt-2">
                    <Award className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Streak de Produtividade</h4>
                      <p className="text-[11px] text-zinc-300 font-bold mt-0.5 leading-tight">
                        Você possui <span className="text-[#39FF14] font-black">{stats.streakDays} dias</span> de esforço registrado consecutivamente. Mantenha as máquinas operando em plena capacidade!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab content 2: Advanced Metrics Dashboard */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            
            {/* KPI Top row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Produção Total</span>
                    <span className="text-3xl font-black text-white mt-1.5 block">{stats.total}</span>
                    <span className="text-[9px] text-zinc-400 mt-0.5 block font-medium">Atividades cadastradas</span>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/25">
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#39FF14]/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Taxa de Resolução</span>
                    <span className="text-3xl font-black text-[#39FF14] mt-1.5 block">{stats.rate}%</span>
                    <span className="text-[9px] text-zinc-400 mt-0.5 block font-medium">{stats.completed} concluídas, {stats.pending} ativas</span>
                  </div>
                  <div className="p-3 bg-[#39FF14]/10 rounded-2xl border border-[#39FF14]/25">
                    <TrendingUp className="w-5 h-5 text-[#39FF14]" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Tempo de Esforço</span>
                    <span className="text-3xl font-black text-purple-400 mt-1.5 block">
                      {Math.round(stats.completedEstimatedMinutes)} <span className="text-xs text-zinc-400 font-bold">MIN</span>
                    </span>
                    <span className="text-[9px] text-zinc-400 mt-0.5 block font-medium">De um total planejado de {stats.totalEstimatedMinutes} min</span>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/25">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Score de Produtividade</span>
                    <span className="text-3xl font-black text-amber-400 mt-1.5 block">{stats.productionScore} <span className="text-xs text-zinc-400 font-bold">PTS</span></span>
                    <span className="text-[9px] text-zinc-400 mt-0.5 block font-medium">Baseado no esforço e prioridades</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/25">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>

            </div>

            {/* Visual Charts Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Produtividade por Categoria (Trabalho vs Pessoal vs Rotina) */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[360px]">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-blue-400" />
                    Carga de Trabalho por Categoria
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Estatísticas de distribuição e andamento do checklist</p>
                </div>

                <div className="h-[230px] w-full mt-4 flex items-center justify-center">
                  {stats.categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.categoryChartData} barSize={28}>
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px' }}
                        />
                        <Bar dataKey="completed" name="Concluído" fill="#39FF14" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="pending" name="Pendente" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', color: '#a1a1aa' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-zinc-500 text-xs italic">Nenhum dado agregado disponível. Cadastre atividades operacionais.</div>
                  )}
                </div>
              </div>

              {/* Chart 2: Carga de dificuldade do esforço - Recharts */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[360px]">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Complexidade das Carga Operacionais
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Dificuldade estimada das atividades cadastradas por status</p>
                </div>

                <div className="h-[230px] w-full mt-4 flex items-center justify-center">
                  {tasks.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.difficultyChartData} barSize={34}>
                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        />
                        <Bar dataKey="completados" name="Resolvido ✓" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="pendentes" name="Em Aberto ⌛" fill="#a855f7" stackId="a" radius={[6, 6, 0, 0]} />
                        <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-zinc-500 text-xs italic">Nenhum dado agregado disponível. Cadastre atividades operacionais.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Row - Metric details checklist review */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl lg:col-span-2">
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Conselho Operacional Vivian AI
                </h3>
                
                <div className="mt-4 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center shrink-0 text-[#39FF14] font-black text-xs">
                    V
                  </div>
                  <div className="space-y-2 text-xs leading-relaxed text-zinc-300 font-medium">
                    <p>
                      Analisando os seus dados operacionais consolidados de hoje, seu esforço resultou em um índice de eficiência de <span className="text-[#39FF14] font-black">{stats.rate}%</span> com uma nota produtiva correspondente a <span className="text-amber-400 font-extrabold">"{stats.grade}"</span>!
                    </p>
                    <p>
                      Notei que as tarefas marcadas como <span className="text-[#f43f5e] font-bold">Urgentes</span> respondem por parte importante do gargalo restante. Recomendo planejar as manutenções preventivas (como limpeza de cisternas e testes de gerador) prioritariamente nas primeiras horas da manhã, utilizando blocos de foco Pomodoro de 25 minutos para as complexidades consideradas <span className="text-purple-400 font-bold">"Difíceis"</span>.
                    </p>
                    <p className="text-[11px] text-[#39FF14] font-black uppercase tracking-wider">
                      ★ INDICAÇÃO DE HOJE: Execute a tarefa "{tasks.find(t => !t.completed && t.priority === 'Alta')?.title || 'Troca de lâmpadas no estacionamento'}" de prioridade Alta imediatamente para mitigar riscos de segurança.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Checklist summary counts */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Painel Resumido
                  </h3>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold uppercase">
                      <span>Total em aberto:</span>
                      <span className="text-rose-400 font-black">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold uppercase">
                      <span>Metas concluídas hoje:</span>
                      <span className="text-[#39FF14] font-black">{stats.completed}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-semibold uppercase">
                      <span>Tempo médio por tarefa:</span>
                      <span className="text-zinc-200 font-black">
                        {stats.total > 0 ? Math.round(stats.totalEstimatedMinutes / stats.total) : 0} min
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition"
                  >
                    Visualizar Lista de Atividades
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Task detail document viewer modal */}
      <AnimatePresence>
        {viewingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            {/* Custom print styles to ensure only the report prints perfectly on A4 paper */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-task-doc, #printable-task-doc * {
                  visibility: visible !important;
                }
                #printable-task-doc {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  color: #000000 !important;
                  background-color: #ffffff !important;
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-3xl bg-zinc-950 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden relative my-8"
            >
              {/* Top controls toolbar */}
              <div className="no-print flex items-center justify-between px-6 py-4 bg-zinc-900/60 border-b border-white/5">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#39FF14]" />
                  Visualizador de Documentos Operacionais
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-zinc-500 rounded-xl text-xs font-bold text-zinc-100 transition"
                    title="Imprimir Relatório"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#39FF14]" />
                    <span>Imprimir OS</span>
                  </button>
                  <button
                    onClick={() => setViewingTask(null)}
                    className="p-1.5 bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-xl border border-white/5 transition"
                    title="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Document Container */}
              <div 
                id="printable-task-doc" 
                className="p-8 md:p-12 space-y-8 bg-zinc-950 text-white print:text-black print:bg-white"
              >
                {/* Document Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-dashed border-zinc-800 print:border-zinc-300">
                  <div className="flex items-center gap-3">
                    {companyLogo ? (
                      <img 
                        src={companyLogo} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain print:invert" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-2xl flex items-center justify-center text-[#39FF14] font-black text-lg print:border-zinc-400 print:text-black">
                        CF
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-white print:text-black leading-tight">
                        {companyData?.name || 'CONDFY.IA SISTEMAS'}
                      </h2>
                      <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest mt-0.5 print:text-zinc-600">
                        CNPJ: {companyData?.document || '---'} • {companyData?.phone || '---'}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase text-[#39FF14] tracking-widest bg-[#39FF14]/5 border border-[#39FF14]/20 px-3 py-1 rounded-full print:text-black print:border-zinc-400">
                      Ordem de Trabalho Interna
                    </span>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-2 font-mono print:text-zinc-600">
                      ID: #{viewingTask.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Main Task Title & Badges */}
                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block">Título da Atividade Operacional</span>
                  <h1 className="text-2xl md:text-3xl font-black text-white print:text-black tracking-tight leading-tight uppercase">
                    {viewingTask.title}
                  </h1>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[9px] font-black uppercase tracking-wider text-zinc-300 print:border-zinc-300 print:text-black">
                      CATEGORIA: {viewingTask.category === 'Fazer Diariamente' ? 'Rotina' : viewingTask.category.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[9px] font-black uppercase tracking-wider text-zinc-300 print:border-zinc-300 print:text-black">
                      PRIORIDADE: {viewingTask.priority?.toUpperCase() || 'MÉDIA'}
                    </span>
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[9px] font-black uppercase tracking-wider text-zinc-300 print:border-zinc-300 print:text-black">
                      ESFORÇO: {viewingTask.difficulty?.toUpperCase() || 'MÉDIA'}
                    </span>
                    <span className="px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-full text-[9px] font-black uppercase tracking-wider text-[#39FF14] print:text-black print:border-zinc-400">
                      {viewingTask.completed ? 'STATUS: CONCLUÍDO ✓' : 'STATUS: PENDENTE ⌛'}
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 print:bg-transparent print:border-zinc-300">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block mb-1">Localização / Instalação</span>
                      <p className="text-sm font-bold text-zinc-200 print:text-black">
                        {viewingTask.installationDetails || 'Não informada / Geral'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block mb-1">Número de OS / Código</span>
                      <p className="text-sm font-mono font-bold text-[#39FF14] print:text-black">
                        {viewingTask.osNumber || 'S/N (Sem Número)'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block mb-1">Anexo Técnico Registrado</span>
                      <p className="text-xs font-bold text-zinc-300 print:text-black">
                        {viewingTask.attachmentName ? (
                          <span className="flex items-center gap-1 text-amber-400 print:text-black">
                            <Paperclip className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {viewingTask.attachmentName}
                          </span>
                        ) : 'Nenhum documento ou orçamento em anexo.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block mb-1">Tempo Estimado de Execução</span>
                      <p className="text-sm font-bold text-zinc-200 print:text-black">
                        {viewingTask.estimatedMinutes !== undefined ? viewingTask.estimatedMinutes : 30} minutos planejados
                      </p>
                    </div>

                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block mb-1">Data de Criação</span>
                      <p className="text-sm font-bold text-zinc-200 print:text-black">
                        {viewingTask.createdAt 
                          ? `${new Date(viewingTask.createdAt).toLocaleDateString('pt-BR')} às ${new Date(viewingTask.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Não especificada'
                        }
                      </p>
                    </div>

                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block mb-1">Data de Encerramento</span>
                      <p className="text-sm font-bold text-[#39FF14] print:text-black">
                        {viewingTask.completed && viewingTask.completedAt ? (
                          <span>Concluído em {new Date(viewingTask.completedAt).toLocaleDateString('pt-BR')} às {new Date(viewingTask.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : (
                          <span className="text-rose-400 print:text-zinc-600">Atividade operacional em andamento</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes & Instructions */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block">Notas, Escopo & Instruções de Segurança</span>
                  <div className="p-6 rounded-2xl bg-black/40 border border-zinc-800/60 text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap print:bg-transparent print:border-zinc-300 print:text-black">
                    {viewingTask.notes || 'Nenhuma instrução ou detalhe adicional foi anexado a esta atividade operacional.'}
                  </div>
                </div>

                {/* Signature placeholders */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-center no-print print:flex print:flex-row print:justify-between print:gap-12">
                  <div className="border-t border-dashed border-zinc-800 pt-3 print:border-zinc-400 print:flex-1">
                    <p className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Responsável Técnico</p>
                    <p className="text-xs font-bold text-zinc-200 mt-1 print:text-black">Administrador</p>
                  </div>
                  <div className="border-t border-dashed border-zinc-800 pt-3 print:border-zinc-400 print:flex-1">
                    <p className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Aprovação / Visto do Gestor</p>
                    <p className="text-xs font-bold text-zinc-400 mt-1 print:text-black">__________________________</p>
                  </div>
                </div>

                {/* Footer system details */}
                <div className="pt-6 border-t border-dashed border-zinc-900 flex justify-between items-center text-[8px] text-zinc-600 font-black uppercase tracking-wider print:border-zinc-300 print:text-zinc-500">
                  <span>Gerado via Condfy.IA • Operações e Produtividade</span>
                  <span>UTC: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* No-print Close overlay footer button */}
              <div className="no-print p-6 bg-zinc-900/40 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewingTask(null)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl border border-white/5 transition"
                >
                  Fechar Documento
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-[#39FF14] hover:bg-[#32dd10] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition"
                >
                  Imprimir Documento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
