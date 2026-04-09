import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { Payment, LegalAgreement, Client, SavingsGoal } from '../types';
import { BackButton } from '../components/BackButton';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Gavel, 
  FileText, 
  Download, 
  Filter,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Loader2,
  FolderOpen,
  ShieldCheck,
  Eye,
  CheckCircle,
  Upload,
  UserCheck,
  Plus,
  Target,
  Trophy,
  Rocket,
  Gamepad2,
  Coins,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { safeFormatDate } from '../utils/dateUtils';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export default function AccountabilityDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    clients, 
    payments, 
    legalAgreements, 
    receipts, 
    costs, 
    companyData,
    digitalFolder,
    validateDigitalFolderItem,
    addDigitalFolderItem,
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal
  } = useStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [newCost, setNewCost] = useState({
    description: '',
    value: '',
    category: 'Colaboradores',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: format(new Date(), 'yyyy-MM-dd'),
    category: 'Obra',
    icon: 'Rocket'
  });
  const [activeTab, setActiveTab] = useState<'financial' | 'folder' | 'goals'>(
    (searchParams.get('tab') as 'financial' | 'folder' | 'goals') || 'financial'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'folder' || tab === 'financial' || tab === 'goals') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const totalSaved = savingsGoals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedGoals = savingsGoals.filter(g => g.status === 'COMPLETED').length;

  const handleTabChange = (tab: 'financial' | 'folder' | 'goals') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [timeRange, setTimeRange] = useState('6m');

  // Mock folder data if empty
  const displayFolder = useMemo(() => {
    return digitalFolder;
  }, [digitalFolder]);

  // Mock Operational Costs Data
  const operationalCosts = useMemo(() => {
    return {
      staff: [],
      manager: {
        name: '',
        fee: 0,
        representation: 0,
        bonus: 0
      },
      history: []
    };
  }, []);

  const totalStaffCost = useMemo(() => {
    return operationalCosts.staff.reduce((acc, curr) => acc + curr.salary + curr.benefits, 0);
  }, [operationalCosts]);

  const totalManagerCost = useMemo(() => {
    return operationalCosts.manager.fee + operationalCosts.manager.representation + operationalCosts.manager.bonus;
  }, [operationalCosts]);

  const totalOperationalCost = useMemo(() => {
    const storeTotal = costs.reduce((acc, curr) => acc + curr.value, 0);
    return totalStaffCost + totalManagerCost + storeTotal;
  }, [totalStaffCost, totalManagerCost, costs]);

  const costBreakdownData = useMemo(() => {
    const base = [
      { name: 'Folha Colaboradores', value: totalStaffCost },
      { name: 'Honorários Síndico', value: totalManagerCost },
    ];

    // Group store costs by category
    const storeCategories: { [key: string]: number } = {};
    costs.forEach(c => {
      storeCategories[c.category] = (storeCategories[c.category] || 0) + c.value;
    });

    const additional = Object.entries(storeCategories).map(([name, value]) => ({ name, value }));
    
    // Merge or append
    const result = [...base];
    additional.forEach(item => {
      const existing = result.find(r => r.name === item.name);
      if (existing) {
        existing.value += item.value;
      } else {
        result.push(item);
      }
    });

    return result;
  }, [totalStaffCost, totalManagerCost, costs]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      // Clone the element to strip problematic styles before generating the image
      const element = reportRef.current;
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Apply cleanup to the clone
      // Remove all --tw variables as they often contain modern color functions
      const elements = clone.getElementsByTagName('*');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        if (el.style) {
          const propsToRemove = [];
          for (let j = 0; j < el.style.length; j++) {
            const prop = el.style[j];
            if (prop.startsWith('--tw-')) {
              propsToRemove.push(prop);
            }
          }
          propsToRemove.forEach(prop => el.style.removeProperty(prop));
          
          if (el.style.color?.includes('okl') || el.style.color?.includes('color-mix')) el.style.color = '#000000';
          if (el.style.backgroundColor?.includes('okl') || el.style.backgroundColor?.includes('color-mix')) el.style.backgroundColor = '#ffffff';
          if (el.style.borderColor?.includes('okl') || el.style.borderColor?.includes('color-mix')) el.style.borderColor = '#000000';
        }
      }

      // Temporarily append the clone to the body to render it (hidden)
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = `${element.offsetWidth}px`;
      document.body.appendChild(clone);

      const dataUrl = await toPng(clone, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      // Remove the clone
      document.body.removeChild(clone);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate height to maintain aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Financeiro_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCost = () => {
    if (!newCost.description || !newCost.value) return;
    
    useStore.getState().addCost({
      description: newCost.description,
      value: parseFloat(newCost.value),
      date: newCost.date,
      category: newCost.category
    });

    setIsAddCostModalOpen(false);
    setNewCost({
      description: '',
      value: '',
      category: 'Colaboradores',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount) return;
    
    try {
      await addSavingsGoal({
        title: newGoal.title,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount),
        deadline: newGoal.deadline,
        category: newGoal.category,
        icon: newGoal.icon,
        status: 'IN_PROGRESS'
      });

      setIsAddGoalModalOpen(false);
      setNewGoal({
        title: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: format(new Date(), 'yyyy-MM-dd'),
        category: 'Obra',
        icon: 'Rocket'
      });
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
    }
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsEditGoalModalOpen(true);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    
    try {
      await updateSavingsGoal(editingGoal.id, {
        title: editingGoal.title,
        targetAmount: editingGoal.targetAmount,
        deadline: editingGoal.deadline,
        category: editingGoal.category,
        icon: editingGoal.icon,
        status: editingGoal.currentAmount >= editingGoal.targetAmount ? 'COMPLETED' : 'IN_PROGRESS'
      });
      setIsEditGoalModalOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  const handleUpdateGoalAmount = async (id: string, currentAmount: number, increment: number) => {
    const newAmount = Math.max(0, currentAmount + increment);
    const goal = savingsGoals.find(g => g.id === id);
    const status = goal && newAmount >= goal.targetAmount ? 'COMPLETED' : 'IN_PROGRESS';
    await updateSavingsGoal(id, { currentAmount: newAmount, status });
  };

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Rocket': return <Rocket className="w-6 h-6" />;
      case 'Target': return <Target className="w-6 h-6" />;
      case 'Trophy': return <Trophy className="w-6 h-6" />;
      case 'Coins': return <Coins className="w-6 h-6" />;
      case 'Zap': return <Zap className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      {/* High-Quality Background Image (4K Feel) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
          alt="Modern Building"
          className="w-full h-full object-cover opacity-10 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#004a7c]/80 via-[#004a7c]/90 to-[#004a7c]" />
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden z-0">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight">Central de Custos</h1>
            <p className="text-lg md:text-xl opacity-60 mt-2 font-light">Visão Ampla de Gastos Operacionais</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-black/20 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md flex shadow-inner">
            <button 
              onClick={() => handleTabChange('financial')}
              className={`px-6 md:px-8 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
                activeTab === 'financial' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Financeiro
            </button>
            <button 
              onClick={() => handleTabChange('folder')}
              className={`px-6 md:px-8 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
                activeTab === 'folder' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Pasta Digital
            </button>
            <button 
              onClick={() => handleTabChange('goals')}
              className={`px-6 md:px-8 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
                activeTab === 'goals' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Projetos & Metas
            </button>
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={isGenerating}
            className="bg-white/10 border border-white/10 text-white px-4 md:px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/20 transition-all backdrop-blur-md disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
          <button 
            onClick={() => setIsAddCostModalOpen(true)}
            className="bg-white text-[#004a7c] px-6 md:px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-all shadow-xl"
          >
            <Plus className="w-5 h-5" /> 
            <span className="hidden sm:inline">Adicionar Custo</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </header>

      {activeTab === 'financial' ? (
        <div className="space-y-8 relative z-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Mensal</span>
            </div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Custo Operacional Total</p>
            <h3 className="text-3xl font-black text-white">R$ {totalOperationalCost.toLocaleString('pt-BR')}</h3>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[65%]" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">{operationalCosts.staff.length} Colaboradores</span>
            </div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Folha de Pagamento</p>
            <h3 className="text-3xl font-black text-white">R$ {totalStaffCost.toLocaleString('pt-BR')}</h3>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[45%]" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-500/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">Síndico</span>
            </div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Honorários Gestão</p>
            <h3 className="text-3xl font-black text-white">R$ {totalManagerCost.toLocaleString('pt-BR')}</h3>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[80%]" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-500/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">+2.5% vs Mês Ant.</span>
            </div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Encargos & Outros</p>
            <h3 className="text-3xl font-black text-white">R$ 0</h3>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[15%]" />
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-indigo-400" /> Evolução de Gastos Operacionais
              </h3>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operationalCosts.history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0, 74, 124, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="staff" name="Colaboradores" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="manager" name="Síndico" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="others" name="Outros" stackId="a" fill="rgba(255,255,255,0.1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <PieChartIcon className="w-6 h-6 text-emerald-400" /> Distribuição de Custos
              </h3>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0, 74, 124, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Demonstrativo de Projetos & Metas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Target className="w-6 h-6 text-amber-400" /> Demonstrativo de Projetos & Metas
              </h3>
              <p className="text-white/40 text-sm mt-1">Resumo do planejamento e economia para investimentos futuros</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Economizado</p>
                <p className="text-2xl font-black text-emerald-400">R$ {totalSaved.toLocaleString('pt-BR')}</p>
              </div>
              <div className="h-12 w-px bg-white/10 mx-2" />
              <div className="text-right">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Progresso Geral</p>
                <p className="text-2xl font-black text-white">{overallProgress.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savingsGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                      {getGoalIcon(goal.icon)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{goal.title}</h4>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{goal.category}</p>
                    </div>
                  </div>
                  {goal.status === 'COMPLETED' && (
                    <div className="bg-emerald-500/20 p-1.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white/60">R$ {goal.currentAmount.toLocaleString('pt-BR')}</span>
                    <span className="text-white/40">R$ {goal.targetAmount.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                      className={`h-full ${goal.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {savingsGoals.length > 3 && (
              <button 
                onClick={() => setActiveTab('goals')}
                className="bg-white/5 p-6 rounded-3xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all text-white/40 hover:text-white"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-widest">Ver mais {savingsGoals.length - 3} metas</span>
              </button>
            )}

            {savingsGoals.length === 0 && (
              <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-3xl">
                <Target className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-bold">Nenhuma meta definida ainda.</p>
                <button 
                  onClick={() => setActiveTab('goals')}
                  className="mt-4 text-amber-400 text-sm font-black uppercase tracking-widest hover:underline"
                >
                  Começar Planejamento
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Staff Table */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-md overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-blue-400" /> Quadro de Colaboradores
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="text" placeholder="Buscar colaborador..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-white/30 transition-all text-white" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Colaborador</th>
                    <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Cargo</th>
                    <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Salário Base</th>
                    <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Encargos/Benefícios</th>
                    <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {operationalCosts.staff.map(member => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{member.name}</p>
                            <p className="text-xs text-white/40">ID: {member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-white/80">{member.role}</td>
                      <td className="px-8 py-6 font-bold text-white">R$ {member.salary.toLocaleString('pt-BR')}</td>
                      <td className="px-8 py-6 text-white/60">R$ {member.benefits.toLocaleString('pt-BR')}</td>
                      <td className="px-8 py-6 font-black text-emerald-400">R$ {(member.salary + member.benefits).toLocaleString('pt-BR')}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      ) : activeTab === 'folder' ? (
        <div className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-md overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-2xl font-black flex items-center gap-3">
                    <FolderOpen className="w-6 h-6 text-indigo-400" /> Pasta Digital
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="text" placeholder="Buscar..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-white/30 transition-all text-white" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Documento</th>
                        <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Data</th>
                        <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Valor</th>
                        <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Validação</th>
                        <th className="px-8 py-4 text-xs font-black text-white/40 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {displayFolder.map(item => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                item.category === 'BALANCE_SHEET' ? 'bg-blue-500/20 text-blue-400' : 
                                item.category === 'INVOICE' ? 'bg-emerald-500/20 text-emerald-400' : 
                                'bg-amber-500/20 text-amber-400'
                              }`}>
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-white">{item.title}</p>
                                <p className="text-xs text-white/40 uppercase font-black tracking-widest">
                                  {item.category === 'BALANCE_SHEET' ? 'Balancete' : item.category === 'INVOICE' ? 'Nota Fiscal' : 'Imposto'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-white/60">{safeFormatDate(item.date)}</td>
                          <td className="px-8 py-6 font-bold text-white">
                            {item.amount ? `R$ ${item.amount.toLocaleString('pt-BR')}` : '-'}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {item.signatures.map((s, idx) => (
                                  <div key={idx} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#004a7c] flex items-center justify-center text-[10px] text-white font-black" title={`${s.userName} (${s.role})`}>
                                    {s.userName.charAt(0)}
                                  </div>
                                ))}
                                {[...Array(Math.max(0, 3 - item.signatures.length))].map((_, idx) => (
                                  <div key={idx} className="w-8 h-8 rounded-full bg-white/5 border-2 border-[#004a7c] flex items-center justify-center text-[10px] text-white/20 font-black">
                                    ?
                                  </div>
                                ))}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                item.status === 'VALIDATED' ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                {item.signatures.length}/3
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-indigo-400">
                                <Eye className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => validateDigitalFolderItem(item.id, 'Carlos Silva', 'Presidente do Conselho')}
                                disabled={item.signatures.some(s => s.userName === 'Carlos Silva')}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-emerald-400 disabled:opacity-30"
                              >
                                <UserCheck className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Recent Costs Table */}
            {costs.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-[40px] p-8 relative overflow-hidden mb-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black">Lançamentos Recentes</h3>
                    <p className="text-white/40 text-xs uppercase tracking-widest font-bold mt-1">Custos adicionados manualmente</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Descrição</th>
                        <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Categoria</th>
                        <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Data</th>
                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-white/40">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {costs.map((cost) => (
                        <tr key={cost.id} className="group hover:bg-white/5 transition-all">
                          <td className="py-4 font-bold">{cost.description}</td>
                          <td className="py-4">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {cost.category}
                            </span>
                          </td>
                          <td className="py-4 text-white/60 text-sm">{safeFormatDate(cost.date)}</td>
                          <td className="py-4 text-right font-black text-emerald-400">
                            R$ {cost.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" /> Conselho Fiscal
                </h3>
                <p className="text-sm text-white/60 mb-8">Aprovação digital necessária. Mínimo de 3 assinaturas.</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">C</div>
                    <div>
                      <p className="font-bold text-white">Carlos Oliveira</p>
                      <p className="text-xs text-white/40">Síndico</p>
                    </div>
                    <div className="ml-auto text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">M</div>
                    <div>
                      <p className="font-bold text-white">Maria Oliveira</p>
                      <p className="text-xs text-white/40">Conselheira</p>
                    </div>
                    <div className="ml-auto text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 opacity-50">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 font-black">J</div>
                    <div>
                      <p className="font-bold text-white">João Pereira</p>
                      <p className="text-xs text-white/40">Conselheiro</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-8 py-4 bg-white text-[#004a7c] rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl">
                  Solicitar Assinaturas
                </button>
              </div>

              <div className="bg-white/10 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
                <h3 className="text-xl font-black mb-4">Assinatura Digital</h3>
                <p className="text-sm text-white/60 mb-6">Documentos criptografados com validade jurídica.</p>
                <div className="p-4 bg-black/20 rounded-2xl border border-white/10 mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Hash de Segurança</p>
                  <p className="text-xs font-mono break-all text-indigo-300">8f9e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a</p>
                </div>
                <button className="w-full py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all">
                  Configurar Certificado
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-indigo-400" /> Game de Economia
              </h2>
              <p className="text-white/60 mt-2">Junte dinheiro para projetos futuros e ganhe prêmios!</p>
            </div>
            <button 
              onClick={() => setIsAddGoalModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-6 h-6" /> Novo Projeto
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {savingsGoals.map((goal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              const isCompleted = goal.status === 'COMPLETED' || progress >= 100;

              return (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative group bg-white/5 border border-white/10 rounded-[40px] p-8 overflow-hidden transition-all hover:bg-white/10 ${isCompleted ? 'border-emerald-500/30' : ''}`}
                >
                  {/* Progress Glow */}
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]'}`}
                    style={{ width: `${progress}%` }}
                  />

                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-3xl ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {getGoalIcon(goal.icon)}
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'}`}>
                        {goal.category}
                      </span>
                      <p className="text-xs text-white/40 mt-2 font-bold">Expira em {safeFormatDate(goal.deadline)}</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black mb-2">{goal.title}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black">R$ {goal.currentAmount.toLocaleString('pt-BR')}</span>
                    <span className="text-white/40 text-sm">/ R$ {goal.targetAmount.toLocaleString('pt-BR')}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-white/40">Progresso</span>
                      <span className={isCompleted ? 'text-emerald-400' : 'text-indigo-400'}>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-blue-500'}`}
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="Valor para juntar..."
                        value={customAmounts[goal.id] || ''}
                        onChange={(e) => setCustomAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-white/30 transition-all text-white"
                      />
                      <button 
                        onClick={() => {
                          const val = parseFloat(customAmounts[goal.id] || '0');
                          if (!isNaN(val) && val > 0) {
                            handleUpdateGoalAmount(goal.id, goal.currentAmount, val);
                            setCustomAmounts(prev => ({ ...prev, [goal.id]: '' }));
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateGoalAmount(goal.id, goal.currentAmount, 100)}
                        className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-[10px] font-black transition-all"
                      >
                        +100
                      </button>
                      <button 
                        onClick={() => handleUpdateGoalAmount(goal.id, goal.currentAmount, 500)}
                        className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-[10px] font-black transition-all"
                      >
                        +500
                      </button>
                      <button 
                        onClick={() => handleEditGoal(goal)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-all"
                        title="Editar Meta"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteSavingsGoal(goal.id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                        title="Excluir Meta"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isCompleted && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3"
                    >
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <p className="text-xs font-bold text-emerald-400">Objetivo Alcançado! Recompensa liberada.</p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {savingsGoals.length === 0 && (
              <div className="lg:col-span-3 py-20 text-center">
                <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-2xl font-black text-white/40">Nenhum projeto ativo</h3>
                <p className="text-white/20 mt-2">Comece a economizar para o futuro do seu condomínio!</p>
              </div>
            )}
          </div>

          {/* Gamification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[40px] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Trophy className="w-24 h-24" />
              </div>
              <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2">Total Economizado</p>
              <h3 className="text-4xl font-black text-white">R$ {savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0).toLocaleString('pt-BR')}</h3>
              <div className="mt-6 flex items-center gap-2 text-white/80 text-sm font-bold">
                <Sparkles className="w-4 h-4" /> 12 Conquistas Desbloqueadas
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">Nível de Gestão</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-black text-2xl">
                  14
                </div>
                <div>
                  <h3 className="text-xl font-black">Mestre das Finanças</h3>
                  <div className="mt-2 h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[75%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">Próxima Recompensa</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Bônus de Eficiência</h3>
                  <p className="text-xs text-white/40 mt-1">Faltam R$ 1.200 para liberar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Cost Modal */}
      {isAddCostModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#004a7c] border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <h3 className="text-2xl font-black mb-6 relative z-10">Adicionar Novo Custo</h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Descrição</label>
                <input 
                  type="text" 
                  value={newCost.description}
                  onChange={(e) => setNewCost({...newCost, description: e.target.value})}
                  placeholder="Ex: Manutenção Elevador"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Valor (R$)</label>
                  <input 
                    type="number" 
                    value={newCost.value}
                    onChange={(e) => setNewCost({...newCost, value: e.target.value})}
                    placeholder="0,00"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Data</label>
                  <input 
                    type="date" 
                    value={newCost.date}
                    onChange={(e) => setNewCost({...newCost, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Categoria</label>
                <select 
                  value={newCost.category}
                  onChange={(e) => setNewCost({...newCost, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all appearance-none"
                >
                  <option value="Colaboradores" className="bg-[#004a7c]">Colaboradores</option>
                  <option value="Síndico" className="bg-[#004a7c]">Síndico</option>
                  <option value="Manutenção" className="bg-[#004a7c]">Manutenção</option>
                  <option value="Utilidades" className="bg-[#004a7c]">Utilidades</option>
                  <option value="Outros" className="bg-[#004a7c]">Outros</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 relative z-10">
              <button 
                onClick={() => setIsAddCostModalOpen(false)}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddCost}
                className="flex-1 py-4 bg-white text-[#004a7c] rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Add Goal Modal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#004a7c] border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <h3 className="text-2xl font-black mb-6 relative z-10">Novo Projeto de Economia</h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Título do Projeto</label>
                <input 
                  type="text" 
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="Ex: Reforma da Piscina"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Meta (R$)</label>
                  <input 
                    type="number" 
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                    placeholder="0,00"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Valor Inicial (R$)</label>
                  <input 
                    type="number" 
                    value={newGoal.currentAmount}
                    onChange={(e) => setNewGoal({...newGoal, currentAmount: e.target.value})}
                    placeholder="0,00"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Data Alvo</label>
                  <input 
                    type="date" 
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Categoria</label>
                  <select 
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all appearance-none"
                  >
                    <option value="Obra" className="bg-[#004a7c]">Obra</option>
                    <option value="Equipamento" className="bg-[#004a7c]">Equipamento</option>
                    <option value="Reserva" className="bg-[#004a7c]">Reserva</option>
                    <option value="Lazer" className="bg-[#004a7c]">Lazer</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Ícone</label>
                <select 
                  value={newGoal.icon}
                  onChange={(e) => setNewGoal({...newGoal, icon: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all appearance-none"
                >
                  <option value="Rocket" className="bg-[#004a7c]">Foguete</option>
                  <option value="Target" className="bg-[#004a7c]">Alvo</option>
                  <option value="Trophy" className="bg-[#004a7c]">Troféu</option>
                  <option value="Coins" className="bg-[#004a7c]">Moedas</option>
                  <option value="Zap" className="bg-[#004a7c]">Raio</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 relative z-10">
              <button 
                onClick={() => setIsAddGoalModalOpen(false)}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddGoal}
                className="flex-1 py-4 bg-white text-[#004a7c] rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl"
              >
                Criar Projeto
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Edit Goal Modal */}
      {isEditGoalModalOpen && editingGoal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#004a7c] border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <h3 className="text-2xl font-black mb-6 relative z-10">Editar Projeto</h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Título do Projeto</label>
                <input 
                  type="text" 
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({...editingGoal, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Meta (R$)</label>
                  <input 
                    type="number" 
                    value={editingGoal.targetAmount}
                    onChange={(e) => setEditingGoal({...editingGoal, targetAmount: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Data Alvo</label>
                  <input 
                    type="date" 
                    value={editingGoal.deadline}
                    onChange={(e) => setEditingGoal({...editingGoal, deadline: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Valor Atual (R$)</label>
                <input 
                  type="number" 
                  value={editingGoal.currentAmount}
                  onChange={(e) => setEditingGoal({...editingGoal, currentAmount: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Categoria</label>
                  <select 
                    value={editingGoal.category}
                    onChange={(e) => setEditingGoal({...editingGoal, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all appearance-none"
                  >
                    <option value="Obra" className="bg-[#004a7c]">Obra</option>
                    <option value="Equipamento" className="bg-[#004a7c]">Equipamento</option>
                    <option value="Reserva" className="bg-[#004a7c]">Reserva</option>
                    <option value="Lazer" className="bg-[#004a7c]">Lazer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Ícone</label>
                  <select 
                    value={editingGoal.icon}
                    onChange={(e) => setEditingGoal({...editingGoal, icon: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition-all appearance-none"
                  >
                    <option value="Rocket" className="bg-[#004a7c]">Foguete</option>
                    <option value="Target" className="bg-[#004a7c]">Alvo</option>
                    <option value="Trophy" className="bg-[#004a7c]">Troféu</option>
                    <option value="Coins" className="bg-[#004a7c]">Moedas</option>
                    <option value="Zap" className="bg-[#004a7c]">Raio</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8 relative z-10">
              <button 
                onClick={() => {
                  setIsEditGoalModalOpen(false);
                  setEditingGoal(null);
                }}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateGoal}
                className="flex-1 py-4 bg-white text-[#004a7c] rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl"
              >
                Salvar Alterações
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
