import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { Cost } from '../types';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, 
  FileSpreadsheet, BarChart3, Lightbulb, ArrowUpRight, ArrowDownRight, 
  X, Calendar, Tag, User, ShieldCheck, FolderOpen, 
  FileText, UserCheck, Target, Brain, Loader2, Sparkles
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from '../components/Modal';
import { SavingsMirror } from '../components/SavingsMirror';
import { safeFormatDate } from '../utils/dateUtils';
import Papa from 'papaparse';
import { GlassCard, CircularProgress } from '../components/GlassUI';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ReferenceLine
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Financial() {
  const navigate = useNavigate();
  const { 
    receipts, costs, addCost, deleteCost, addReceipt, deleteReceipt, 
    updateCost, updateReceipt, clients, payments, savingsGoals, 
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal 
  } = useStore();
  
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingMoneyToGoal, setIsAddingMoneyToGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [moneyToAdd, setMoneyToAdd] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<{ type: 'cost' | 'income' | 'goal', id: string } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REPORTS'>('DASHBOARD');
  
  // Form states
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Material');
  const [clientId, setClientId] = useState('');
  
  // Goal specific states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(0);
  const [goalCurrent, setGoalCurrent] = useState(0);
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('Reserva');
  const [goalIcon, setGoalIcon] = useState('Target');
  const [goalStatus, setGoalStatus] = useState<'IN_PROGRESS' | 'COMPLETED' | 'PAUSED'>('IN_PROGRESS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (type: 'cost' | 'income' | 'goal', id: string) => {
    if (type === 'goal') {
      const goal = savingsGoals.find(g => g.id === id);
      if (goal) {
        setGoalTitle(goal.title);
        setGoalTarget(goal.targetAmount);
        setGoalCurrent(goal.currentAmount);
        setGoalDeadline(goal.deadline);
        setGoalCategory(goal.category);
        setGoalIcon(goal.icon);
        setGoalStatus(goal.status);
        setEditingTransaction({ type, id });
      }
      return;
    }

    const transaction = type === 'cost' 
      ? costs.find(c => c.id === id) 
      : receipts.find(r => r.id === id);
    
    if (transaction) {
      setDescription(transaction.description);
      setValue(transaction.value);
      setDate(transaction.date);
      if (type === 'cost') {
        setCategory((transaction as any).category || 'Material');
      } else {
        setClientId((transaction as any).clientId || '');
      }
      setEditingTransaction({ type, id });
    }
  };

  const handleUpdate = () => {
    if (!editingTransaction) return;

    if (editingTransaction.type === 'cost') {
      updateCost(editingTransaction.id, {
        description,
        value,
        date,
        category
      });
    } else if (editingTransaction.type === 'income') {
      updateReceipt(editingTransaction.id, {
        clientId,
        description,
        value,
        date
      });
    } else if (editingTransaction.type === 'goal') {
      updateSavingsGoal(editingTransaction.id, {
        title: goalTitle,
        targetAmount: goalTarget,
        currentAmount: goalCurrent,
        deadline: goalDeadline,
        category: goalCategory,
        icon: goalIcon,
        status: goalStatus
      });
    }

    setEditingTransaction(null);
    resetForm();
  };

  const handleDelete = (type: 'income' | 'cost' | 'goal', id: string) => {
    if (type === 'income') {
      deleteReceipt(id);
    } else if (type === 'cost') {
      deleteCost(id);
    } else if (type === 'goal') {
      deleteSavingsGoal(id);
    }
  };

  const resetForm = () => {
    setDescription('');
    setValue(0);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Material');
    setClientId('');
    setGoalTitle('');
    setGoalTarget(0);
    setGoalCurrent(0);
    setGoalDeadline('');
    setGoalCategory('Reserva');
    setGoalIcon('Target');
    setGoalStatus('IN_PROGRESS');
  };

  const handleAddGoal = async () => {
    if (!goalTitle || goalTarget <= 0) {
      toast.error('Preencha o título e o valor da meta.');
      return;
    }

    await addSavingsGoal({
      title: goalTitle,
      targetAmount: goalTarget,
      currentAmount: goalCurrent,
      deadline: goalDeadline,
      category: goalCategory,
      icon: goalIcon,
      status: goalStatus
    });

    setIsAddingGoal(false);
    resetForm();
  };

  const handleAddMoneyToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || moneyToAdd <= 0) return;

    const goal = savingsGoals.find(g => g.id === selectedGoalId);
    if (goal) {
      const newAmount = goal.currentAmount + moneyToAdd;
      updateSavingsGoal(selectedGoalId, {
        currentAmount: newAmount,
        status: newAmount >= goal.targetAmount ? 'COMPLETED' : goal.status
      });
      setIsAddingMoneyToGoal(false);
      setMoneyToAdd(0);
      setSelectedGoalId(null);
    }
  };

  const totalIncome = receipts.reduce((sum, r) => sum + r.value, 0);
  const totalCosts = costs.reduce((sum, c) => sum + c.value, 0);
  const balance = totalIncome - totalCosts;
  const profitMargin = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  const accountsReceivable = payments
    .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    costs.forEach(c => {
      categories[c.category] = (categories[c.category] || 0) + c.value;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [costs]);

  const latestReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      })
      .slice(0, 8);
  }, [receipts]);

  const COLORS = ['#00f2ff', '#00ff88', '#7000ff', '#ff00d4', '#ff8800', '#ffff00'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-bold text-white">
                {entry.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let importedCosts = 0;
        let importedIncomes = 0;

        results.data.forEach((row: any) => {
          const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('date'));
          const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('histórico') || k.toLowerCase().includes('historico'));
          const valKey = Object.keys(row).find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('value') || k.toLowerCase().includes('quantia'));
          
          if (!valKey) return;

          const description = descKey ? row[descKey] : 'Importado via CSV';
          let date = new Date().toISOString().split('T')[0];
          
          if (dateKey && row[dateKey]) {
            const dStr = row[dateKey];
            if (dStr.includes('/')) {
              const parts = dStr.split('/');
              if (parts.length === 3) {
                date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            } else {
              date = dStr;
            }
          }

          const valStr = String(row[valKey]).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
          const value = parseFloat(valStr);

          if (isNaN(value) || value === 0) return;

          if (value < 0) {
            addCost({
              description,
              value: Math.abs(value),
              date,
              category: 'Importado'
            });
            importedCosts++;
          } else {
            const genericClientId = clients.length > 0 ? clients[0].id : '';
            if (genericClientId) {
              addReceipt({
                clientId: genericClientId,
                description,
                value,
                date
              });
              importedIncomes++;
            }
          }
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.success(`Importação concluída: ${importedIncomes} receitas e ${importedCosts} custos importados.`);
      }
    });
  };

  const handleGenerateAIReport = async () => {
    setIsAIProcessing(true);
    setShowAIModal(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && (import.meta.env as any).VITE_GEMINI_API_KEY);
      if (!apiKey) {
        toast.error('Chave API não configurada.');
        setShowAIModal(false);
        return;
      }

      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey });
      
      let retries = 3;
      let delay = 2000;
      let responseText = "";

      const financialData = {
        totalIncome,
        totalCosts,
        balance,
        profitMargin,
        accountsReceivable,
        expensesByCategory,
        topClients
      };

      while (retries > 0) {
        try {
          const result = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `
              Você é o Analista Financeiro IA do CONDFY.IA. Analise os seguintes dados financeiros de um condomínio e forneça um relatório interativo com insights, alertas e recomendações:
              
              ${JSON.stringify(financialData)}
              
              Por favor, formate a resposta em Markdown, com seções claras para:
              1. Resumo Executivo
              2. Alertas de Risco (Inadimplência, Gastos Excessivos)
              3. Oportunidades de Economia
              4. Projeção para o Próximo Mês
              
              Use emojis para tornar o relatório mais visual e profissional.
            `,
            config: {
              responseMimeType: "text/plain"
            }
          });
          responseText = result.text || "Não foi possível gerar o relatório.";
          break;
        } catch (err: any) {
          const isRateLimit = err.message?.includes('429') || 
                             err.status === 429 || 
                             err.message?.includes('RESOURCE_EXHAUSTED');
          
          if (isRateLimit && retries > 1) {
            console.warn(`Financial AI Report: Gemini Rate Limit (429). Retrying in ${delay}ms... (${retries - 1} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            delay *= 2;
          } else {
            throw err;
          }
        }
      }

      setAiReport(responseText);
    } catch (error) {
      console.error("AI Report Error:", error);
      toast.error("Erro ao gerar relatório com IA.");
      setShowAIModal(false);
    } finally {
      setIsAIProcessing(false);
    }
  };
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0 || !date) {
      toast.error('Preencha descrição, valor válido e data.');
      return;
    }

    addCost({
      description,
      value,
      date,
      category
    });

    resetForm();
    setIsAddingCost(false);
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0 || !clientId || !date) {
      toast.error('Preencha cliente, descrição, valor válido e data.');
      return;
    }

    addReceipt({
      clientId,
      description,
      value,
      date
    });

    resetForm();
    setIsAddingIncome(false);
  };

  const transactions = [
    ...receipts.map(r => ({ ...r, type: 'income' as const })),
    ...costs.map(c => ({ ...c, type: 'expense' as const }))
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
  });

  const monthlyData = useMemo(() => {
    const dataByMonth: Record<string, { name: string, receitas: number, despesas: number, saldo: number }> = {};
    
    transactions.forEach(t => {
      if (!t.date) return;
      const date = new Date(t.date);
      if (isNaN(date.getTime())) return;
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = safeFormatDate(t.date, { month: 'short', year: 'numeric' });
      
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = { name: monthName, receitas: 0, despesas: 0, saldo: 0 };
      }
      
      if (t.type === 'income') {
        dataByMonth[monthYear].receitas += t.value;
      } else {
        dataByMonth[monthYear].despesas += t.value;
      }
      dataByMonth[monthYear].saldo = dataByMonth[monthYear].receitas - dataByMonth[monthYear].despesas;
    });

    return Object.keys(dataByMonth)
      .sort()
      .map(key => dataByMonth[key]);
  }, [transactions]);

  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    costs.forEach(c => {
      data[c.category] = (data[c.category] || 0) + c.value;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [costs]);

  const topClients = useMemo(() => {
    const clientRevenue: Record<string, number> = {};
    receipts.forEach(r => {
      const client = clients.find(c => c.id === r.clientId);
      const name = client ? client.name : 'Desconhecido';
      clientRevenue[name] = (clientRevenue[name] || 0) + r.value;
    });
    return Object.entries(clientRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [receipts, clients]);

  const insights = useMemo(() => {
    if (monthlyData.length === 0) return null;

    const bestMonth = [...monthlyData].sort((a, b) => b.saldo - a.saldo)[0];
    const worstMonth = [...monthlyData].sort((a, b) => b.despesas - a.despesas)[0];
    const topCategory = expensesByCategory.length > 0 ? expensesByCategory[0] : null;

    let growth = 0;
    if (monthlyData.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      if (previousMonth.receitas > 0) {
        growth = ((currentMonth.receitas - previousMonth.receitas) / previousMonth.receitas) * 100;
      }
    }

    return {
      bestMonth,
      worstMonth,
      topCategory,
      growth
    };
  }, [monthlyData, expensesByCategory]);

  const renderReports = () => (
    <div className="space-y-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard title="Exportar Dados">
          <div className="space-y-4">
            <button 
              onClick={() => {
                const csv = Papa.unparse(transactions);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `financeiro_${new Date().toISOString()}.csv`;
                link.click();
                toast.success('Relatório CSV exportado!');
              }}
              className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">Exportar CSV</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/20" />
            </button>
            <button 
              onClick={() => {
                const json = JSON.stringify(transactions, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `financeiro_${new Date().toISOString()}.json`;
                link.click();
                toast.success('Relatório JSON exportado!');
              }}
              className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-4">
                <FolderOpen className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold text-white">Exportar JSON</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/20" />
            </button>
          </div>
        </GlassCard>

        <GlassCard title="Resumo por Categoria" className="md:col-span-2">
          <div className="space-y-4">
            {expensesByCategory.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm font-bold text-white">{cat.name}</span>
                </div>
                <span className="text-sm font-black text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Fluxo de Caixa Detalhado">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Data</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Descrição</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Categoria/Cliente</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.slice(0, 50).map(t => (
                <tr key={t.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 text-sm text-white/60">{safeFormatDate(t.date)}</td>
                  <td className="py-4 text-sm font-bold text-white">{t.description}</td>
                  <td className="py-4 text-sm text-white/40">
                    {t.type === 'income' ? (clients.find(c => c.id === (t as any).clientId)?.name || 'Cliente') : (t as any).category}
                  </td>
                  <td className={`py-4 text-sm font-black text-right ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4 md:p-8 font-sans -m-8"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
    >
      {/* AI Report Modal */}
      <Modal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        title="Inteligência Financeira Condominial"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-zinc-950">
          {isAIProcessing ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
                <Brain className="w-16 h-16 text-purple-400 relative z-10" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white mb-2 animate-pulse">Analisando Dados...</p>
                <p className="text-sm text-white/40">O Cérebro Financeiro está processando os indicadores.</p>
              </div>
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-full h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white m-0">Relatório Estratégico</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Gerado por IA em tempo real</p>
                  </div>
                </div>
                <div className="text-white/80 whitespace-pre-wrap leading-relaxed font-sans text-sm">
                  {aiReport}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all font-black uppercase tracking-widest text-[10px] border border-white/10"
                >
                  Fechar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-8 py-3 bg-white text-black rounded-xl transition-all font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Heavy blur overlay for the background */}
      <div className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-xl" />
      
      {/* Main Dashboard Container - Plastic Transparent Frosted Glass */}
      <div className="relative z-10 w-full max-w-[1400px] bg-gradient-to-br from-[#1a2b4c]/90 to-[#0f172a]/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 md:p-8 flex flex-col gap-6 overflow-hidden">
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] pointer-events-none" />

        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-8">
            <BackButton className="!bg-white/5 !border-white/5 !rounded-3xl hover:!bg-white/10" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/60">Live Financial Intelligence</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">Financeiro</h1>
              <p className="text-sm text-white/40 mt-2 font-light max-w-md leading-relaxed">Análise preditiva e controle de fluxo de caixa em tempo real.</p>
            </div>
          </div>

          <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner ml-8">
            <button 
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-8 py-3 rounded-xl transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'DASHBOARD' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('REPORTS')}
              className={`px-8 py-3 rounded-xl transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'REPORTS' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Relatórios
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              id="csv-upload-financial"
            />
            <motion.label 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              htmlFor="csv-upload-financial"
              className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-6 py-3 flex items-center gap-2 border border-white/10 backdrop-blur-2xl transition-all cursor-pointer rounded-2xl font-bold uppercase tracking-widest text-[10px]"
            >
              <FileSpreadsheet className="w-4 h-4" /> 
              <span>Importar</span>
            </motion.label>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateAIReport}
              className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-6 py-3 flex items-center gap-2 border border-purple-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(168,85,247,0.1)]"
            >
              <Brain className="w-4 h-4" /> 
              <span>Análise IA</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                resetForm();
                setIsAddingGoal(true);
              }}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-3 flex items-center gap-2 border border-emerald-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <Target className="w-4 h-4" /> 
              <span>Meta</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                resetForm();
                setIsAddingIncome(true);
              }}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-6 py-3 flex items-center gap-2 border border-cyan-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(6,182,212,0.1)]"
            >
              <Plus className="w-4 h-4" /> 
              <span>Receita</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setDescription('');
                setValue(0);
                setIsAddingCost(true);
              }}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-6 py-3 flex items-center gap-2 border border-rose-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(244,63,94,0.1)]"
            >
              <Plus className="w-4 h-4" /> 
              <span>Custo</span>
            </motion.button>
          </div>
        </header>

        {activeTab === 'DASHBOARD' ? (
          <>
            {/* High-Fidelity Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Receitas Totais</h3>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter mb-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
          </p>
          <div className="flex items-center gap-2 text-cyan-400/60 text-[8px] font-bold uppercase tracking-widest">
            <ArrowUpRight className="w-2 h-2" />
            <span>+12.5% vs last month</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Despesas Totais</h3>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter mb-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCosts)}
          </p>
          <div className="flex items-center gap-2 text-rose-400/60 text-[8px] font-bold uppercase tracking-widest">
            <ArrowDownRight className="w-2 h-2" />
            <span>-4.2% optimized</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Saldo Líquido</h3>
            <div className={`p-2 rounded-xl border ${balance >= 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tighter mb-2 ${balance >= 0 ? 'text-white' : 'text-orange-400'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
          </p>
          <div className="flex items-center gap-2 text-white/20 text-[8px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-2 h-2" />
            <span>Healthy Cashflow</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Margem Operacional</h3>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#emeraldGradient)"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * profitMargin) / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-white">{profitMargin.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Status</p>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">Excelente</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Contas a Receber</h3>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black tracking-tighter mb-2 text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(accountsReceivable)}
          </p>
          <div className="flex items-center gap-2 text-cyan-400/60 text-[8px] font-bold uppercase tracking-widest">
            <ArrowUpRight className="w-2 h-2" />
            <span>Previsão de entrada</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group cursor-pointer"
          onClick={() => {
            const element = document.getElementById('metas-section');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Metas Ativas</h3>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black tracking-tighter mb-2 text-white">
            {savingsGoals.length}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase tracking-wider">
              <span>Progresso</span>
              <span>{Math.round((savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0) / (savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0) || 1)) * 100)}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${Math.round((savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0) / (savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0) || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Metas e Projetos Section */}
      <div id="metas-section" className="relative z-10 scroll-mt-8 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
              <Target className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Metas e Projetos</h2>
              <p className="text-sm text-white/40 font-medium">Acompanhe seus objetivos financeiros de longo prazo.</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingGoal(true)}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-8 py-4 rounded-2xl flex items-center gap-3 border border-amber-500/30 transition-all font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-5 h-5" />
            Nova Meta
          </motion.button>
        </div>
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
          <SavingsMirror 
            goals={savingsGoals} 
            showAll={true} 
            onAddMoney={(id) => {
              setSelectedGoalId(id);
              setIsAddingMoneyToGoal(true);
            }}
            onDelete={(id) => handleDelete('goal', id)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Key Performance</h3>
            <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/10">Monitoring</div>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Meta de Receita</span>
                <span className="text-xs font-black text-white">85%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Limite de Despesas</span>
                <span className="text-xs font-black text-white">42%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Real Time Activity</h3>
            <div className="px-3 py-1 bg-cyan-500/10 rounded-full text-[8px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/20">Tracking</div>
          </div>
          
          <div className="flex items-center gap-12">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke="#22d3ee"
                  strokeWidth="10"
                  strokeDasharray="282.7"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - (282.7 * 72) / 100 }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">72%</span>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Efficiency</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 flex-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                const receipt = latestReceipts[i];
                return (
                  <div key={i} className="aspect-square bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center group/item hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all p-2 text-center overflow-hidden">
                    {receipt ? (
                      <>
                        <span className="text-[8px] font-black text-white/40 truncate w-full mb-1">{receipt.description}</span>
                        <span className="text-[10px] font-black text-cyan-400">R$ {receipt.value.toLocaleString('pt-BR')}</span>
                        <span className="text-[6px] font-medium text-white/20 mt-1">{safeFormatDate(receipt.date)}</span>
                      </>
                    ) : (
                      <span className="text-[10px] font-black text-white/10 group-hover/item:text-cyan-400">0{i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Advanced Charts Section */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 bg-white/5 rounded-[3rem] p-10 border border-white/10 shadow-2xl backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Fluxo de Caixa</h2>
                <p className="text-white/40 text-sm font-medium mt-1">Análise comparativa de entradas e saídas.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Receitas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Despesas</span>
                </div>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} 
                    dy={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} 
                    tickFormatter={(value) => `R$ ${value/1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="receitas" 
                    name="Receitas" 
                    stroke="#22d3ee" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorReceitas)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="despesas" 
                    name="Despesas" 
                    stroke="#f43f5e" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorDespesas)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <GlassCard 
            title="Distribuição" 
            subtitle="Alocação de recursos por categoria."
            className="lg:col-span-4 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Total</span>
                  <span className="text-2xl font-black text-white tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(totalCosts)}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-4 mt-12">
                {expensesByCategory.slice(0, 4).map((cat, index) => (
                  <div key={cat.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: COLORS[index % COLORS.length], backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs text-white/40 font-black uppercase tracking-widest group-hover:text-white transition-colors">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-1000" style={{ width: `${(cat.value / totalCosts) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                      </div>
                      <span className="text-xs font-black text-white w-10 text-right">
                        {((cat.value / totalCosts) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard 
            title="Top Clientes" 
            subtitle="Maiores fontes de receita por parceiro."
            icon={User}
            className="lg:col-span-6"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} 
                    width={100} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    name="Receita" 
                    fill="#22d3ee" 
                    radius={[0, 10, 10, 0]} 
                    barSize={24}
                  >
                    {topClients.map((entry, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.15)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard 
            title="Performance de Saldo" 
            subtitle="Tendência de acumulação de capital."
            icon={TrendingUp}
            className="lg:col-span-6"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="stepAfter" 
                    dataKey="saldo" 
                    name="Saldo" 
                    stroke="#a855f7" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
          <GlassCard 
            title="Despesas" 
            subtitle="Distribuição por categoria."
            className="lg:col-span-4 flex flex-col"
          >
            <div className="flex-1 min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Total</span>
                <span className="text-2xl font-black text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalCosts)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{entry.name}</span>
                    <span className="text-xs font-bold text-white">
                      {((entry.value / totalCosts) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
      
      {/* Goals Section - Integrated into Financial View */}
      <div className="relative z-10 mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Metas e Projetos</h2>
            <p className="text-white/40 text-sm font-medium mt-1">Acompanhamento de objetivos financeiros.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingGoal(true)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savingsGoals.map((goal, index) => {
            const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            return (
              <GlassCard
                key={goal.id}
                className="relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Target className="w-24 h-24" />
                </div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setIsAddingMoneyToGoal(true);
                      }}
                      className="p-3 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-500/20"
                      title="Adicionar Dinheiro"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEdit('goal', goal.id)}
                      className="p-3 text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all border border-cyan-500/20"
                      title="Editar Meta"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                    <button 
                      onClick={() => handleDelete('goal', goal.id)}
                      className="p-3 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/20"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-2 relative z-10">{goal.title}</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6 relative z-10">{goal.category}</p>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Progresso</span>
                      <span className="text-2xl font-black text-white">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Alvo</span>
                      <span className="text-sm font-bold text-white/60">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30 pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{safeFormatDate(goal.deadline) || 'Sem prazo'}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full border ${goal.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {goal.status === 'COMPLETED' ? 'Concluído' : 'Em Andamento'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {savingsGoals.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 backdrop-blur-3xl">
              <Target className="w-12 h-12 text-white/10 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-white/20 tracking-tighter">Nenhuma meta definida</h3>
              <p className="text-white/10 mt-2 font-bold uppercase tracking-widest text-[10px]">Defina seus objetivos financeiros para começar a poupar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions List - High Fidelity */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Transações Recentes</h2>
            <p className="text-white/40 text-sm font-medium mt-1">Detalhamento granular de cada movimentação.</p>
          </div>
          <div className="flex gap-4">
             <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40">
               Total: {transactions.length}
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {transactions.map((t, index) => (
            <motion.div 
              key={t.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => setSelectedTransaction(t)}
              className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 flex flex-col relative group hover:bg-white/10 transition-all duration-500 shadow-xl backdrop-blur-3xl overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                {t.type === 'income' ? <ArrowUpRight className="w-24 h-24" /> : <ArrowDownRight className="w-24 h-24" />}
              </div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`p-4 rounded-2xl border ${t.type === 'income' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(t.type === 'income' ? 'income' : 'cost', t.id); }}
                    className="p-3 text-white/20 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Editar"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(t.type === 'income' ? 'income' : 'cost', t.id); }}
                    className="p-3 text-white/20 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-white mb-2 line-clamp-2 relative z-10 group-hover:text-cyan-400 transition-colors">{t.description}</h3>
              
              <p className={`text-3xl font-black mb-8 relative z-10 ${t.type === 'income' ? 'text-white' : 'text-rose-400'}`}>
                {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
              </p>
              
              <div className="mt-auto flex justify-between items-center text-[10px] font-black uppercase tracking-widest relative z-10">
                <div className="flex items-center gap-2 text-white/30">
                  <Calendar className="w-3 h-3" />
                  <span>{safeFormatDate(t.date)}</span>
                </div>
                <span className={`px-4 py-1.5 rounded-full border ${t.type === 'income' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {t.type === 'income' ? 'Receita' : (t as Cost).category}
                </span>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${t.type === 'income' ? 'via-cyan-500/30' : 'via-rose-500/30'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            </motion.div>
          ))}
          
          {transactions.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 backdrop-blur-3xl">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5 rounded-full mb-8">
                <DollarSign className="w-12 h-12 text-white/10" />
              </div>
              <h3 className="text-3xl font-black text-white/20 tracking-tighter">Nenhuma transação registrada</h3>
              <p className="text-white/10 mt-4 font-bold uppercase tracking-widest text-xs">Aguardando dados para processamento...</p>
            </div>
          )}
        </div>
      </div>
      </>
      ) : renderReports()}

      </div>

      {/* Edit Transaction/Goal Modal */}
      <Modal 
        isOpen={!!editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
        title={`Editar ${editingTransaction?.type === 'cost' ? 'Custo' : editingTransaction?.type === 'income' ? 'Receita' : 'Meta'}`}
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6 p-2">
          {editingTransaction?.type === 'goal' ? (
            <>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Título da Meta *</label>
                <input 
                  type="text" 
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor Alvo *</label>
                  <input 
                    type="number" 
                    value={goalTarget || ''}
                    onChange={(e) => setGoalTarget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor Atual</label>
                  <input 
                    type="number" 
                    value={goalCurrent || ''}
                    onChange={(e) => setGoalCurrent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Prazo</label>
                <input 
                  type="date" 
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Categoria</label>
                <select 
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                >
                  <option value="Reserva" className="bg-[#004a7c]">Reserva</option>
                  <option value="Investimento" className="bg-[#004a7c]">Investimento</option>
                  <option value="Projeto" className="bg-[#004a7c]">Projeto</option>
                  <option value="Viagem" className="bg-[#004a7c]">Viagem</option>
                  <option value="Outros" className="bg-[#004a7c]">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Status</label>
                <select 
                  value={goalStatus}
                  onChange={(e) => setGoalStatus(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                >
                  <option value="IN_PROGRESS" className="bg-[#004a7c]">Em Andamento</option>
                  <option value="COMPLETED" className="bg-[#004a7c]">Concluído</option>
                  <option value="CANCELLED" className="bg-[#004a7c]">Cancelado</option>
                </select>
              </div>
            </>
          ) : (
            <>
              {editingTransaction?.type === 'income' && (
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Cliente *</label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-[#004a7c]">Selecione um cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#004a7c]">{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Descrição *</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor (R$) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                  <input 
                    type="number" 
                    value={value || ''}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Data *</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white [color-scheme:dark]"
                  required
                />
              </div>

              {editingTransaction?.type === 'cost' && (
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                  >
                    <option value="Material" className="bg-[#004a7c]">Material</option>
                    <option value="Combustível" className="bg-[#004a7c]">Combustível</option>
                    <option value="Alimentação" className="bg-[#004a7c]">Alimentação</option>
                    <option value="Ferramentas" className="bg-[#004a7c]">Ferramentas</option>
                    <option value="Outros" className="bg-[#004a7c]">Outros</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setEditingTransaction(null)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-10 py-3 rounded-xl font-bold border border-cyan-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Goal Modal */}
      <Modal 
        isOpen={isAddingGoal} 
        onClose={() => setIsAddingGoal(false)} 
        title="Adicionar Nova Meta"
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={handleAddGoal} className="space-y-6 p-2">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Título da Meta *</label>
            <input 
              type="text" 
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
              placeholder="Ex: Reserva de Emergência"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor Alvo *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                <input 
                  type="number" 
                  value={goalTarget || ''}
                  onChange={(e) => setGoalTarget(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                <input 
                  type="number" 
                  value={goalCurrent || ''}
                  onChange={(e) => setGoalCurrent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Prazo (Opcional)</label>
            <input 
              type="date" 
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Categoria</label>
            <select 
              value={goalCategory}
              onChange={(e) => setGoalCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
            >
              <option value="Reserva" className="bg-[#004a7c]">Reserva</option>
              <option value="Investimento" className="bg-[#004a7c]">Investimento</option>
              <option value="Projeto" className="bg-[#004a7c]">Projeto</option>
              <option value="Viagem" className="bg-[#004a7c]">Viagem</option>
              <option value="Outros" className="bg-[#004a7c]">Outros</option>
            </select>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsAddingGoal(false)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-10 py-3 rounded-xl font-bold border border-emerald-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              CRIAR META
            </button>
          </div>
        </form>
      </Modal>
      <Modal 
        isOpen={isAddingCost} 
        onClose={() => setIsAddingCost(false)} 
        title="Adicionar Custo"
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={handleAddCost} className="space-y-6 p-2">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Descrição *</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
              placeholder="Ex: Compra de materiais..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor (R$) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
              <input 
                type="number" 
                value={value || ''}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Data *</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white [color-scheme:dark]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
            >
              <option value="Material" className="bg-[#004a7c]">Material</option>
              <option value="Combustível" className="bg-[#004a7c]">Combustível</option>
              <option value="Alimentação" className="bg-[#004a7c]">Alimentação</option>
              <option value="Ferramentas" className="bg-[#004a7c]">Ferramentas</option>
              <option value="Outros" className="bg-[#004a7c]">Outros</option>
            </select>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsAddingCost(false)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-10 py-3 rounded-xl font-bold border border-red-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              SALVAR CUSTO
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Income Modal */}
      <Modal 
        isOpen={isAddingIncome} 
        onClose={() => setIsAddingIncome(false)} 
        title="Adicionar Receita"
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={handleAddIncome} className="space-y-6 p-2">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Cliente *</label>
            <select 
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-[#004a7c]">Selecione um cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-[#004a7c]">{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Descrição *</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
              placeholder="Ex: Pagamento de serviço avulso..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor (R$) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
              <input 
                type="number" 
                value={value || ''}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Data *</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white [color-scheme:dark]"
              required
            />
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsAddingIncome(false)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-10 py-3 rounded-xl font-bold border border-emerald-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              SALVAR RECEITA
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Money to Goal Modal */}
      <Modal 
        isOpen={isAddingMoneyToGoal} 
        onClose={() => {
          setIsAddingMoneyToGoal(false);
          setMoneyToAdd(0);
          setSelectedGoalId(null);
        }} 
        title="Adicionar Dinheiro à Meta"
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={handleAddMoneyToGoal} className="space-y-6 p-2">
          <div>
            <p className="text-white/60 text-sm mb-4">
              Meta: <span className="text-white font-bold">{savingsGoals.find(g => g.id === selectedGoalId)?.title}</span>
            </p>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor a Adicionar (R$) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
              <input 
                type="number" 
                value={moneyToAdd || ''}
                onChange={(e) => setMoneyToAdd(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white"
                min="0.01"
                step="0.01"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => {
                setIsAddingMoneyToGoal(false);
                setMoneyToAdd(0);
                setSelectedGoalId(null);
              }}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-10 py-3 rounded-xl font-bold border border-emerald-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              ADICIONAR
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={selectedTransaction?.type === 'income' ? 'Detalhes da Receita' : 'Detalhes do Custo'}
        maxWidth="md"
        glass
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl border ${selectedTransaction.type === 'income' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {selectedTransaction.type === 'income' ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{selectedTransaction.description}</h3>
                <p className={`text-xl font-bold ${selectedTransaction.type === 'income' ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTransaction.value)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Data</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/40" />
                  {safeFormatDate(selectedTransaction.date)}
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Categoria / Tipo</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-white/40" />
                  {selectedTransaction.type === 'income' ? 'Receita' : selectedTransaction.category}
                </p>
              </div>
            </div>

            {selectedTransaction.type === 'income' && selectedTransaction.clientId && (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Cliente Associado</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-white/40" />
                  {clients.find(c => c.id === selectedTransaction.clientId)?.name || 'Cliente não encontrado'}
                </p>
              </div>
            )}

            <div className="pt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  handleEdit(selectedTransaction.type, selectedTransaction.id);
                  setSelectedTransaction(null);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
              >
                Editar
              </button>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/20"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
