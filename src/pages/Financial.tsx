import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Cost } from '../types';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, 
  FileSpreadsheet, BarChart3, Lightbulb, ArrowUpRight, ArrowDownRight, 
  X, Calendar, Tag, User, ShieldCheck, FolderOpen, 
  FileText, UserCheck, Target, Brain, Loader2, Sparkles, ShieldAlert, AlertCircle,
  Pencil, Eye, EyeOff, Check, Download, Upload
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SavingsMirror } from '../components/SavingsMirror';
import { safeFormatDate } from '../utils/dateUtils';
import Papa from 'papaparse';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { GlassCard, CircularProgress } from '../components/GlassUI';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ReferenceLine
} from 'recharts';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Financial() {
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    receipts, costs, addCost, deleteCost, addReceipt, deleteReceipt, 
    updateCost, updateReceipt, clients, payments, savingsGoals, 
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    showBalance, setShowBalance, costCategories, addCostCategory, addClient,
    clearFinancialData,
    accountsPayable, accountsReceivable,
    addAccountPayable, updateAccountPayable, deleteAccountPayable,
    addAccountReceivable, updateAccountReceivable, deleteAccountReceivable
  } = useStore();
  
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [isAddingPayable, setIsAddingPayable] = useState(false);
  const [isAddingReceivable, setIsAddingReceivable] = useState(false);
  const [payableNotes, setPayableNotes] = useState('');
  const [receivableNotes, setReceivableNotes] = useState('');
  const [payableStatus, setPayableStatus] = useState<'PENDING' | 'PAID' | 'OVERDUE'>('PENDING');
  const [receivableStatus, setReceivableStatus] = useState<'PENDING' | 'PAID' | 'OVERDUE'>('PENDING');

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingMoneyToGoal, setIsAddingMoneyToGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [moneyToAdd, setMoneyToAdd] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<{ type: 'cost' | 'income' | 'goal' | 'payable' | 'receivable', id: string } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'income' | 'cost' | 'goal' | 'payable' | 'receivable', id: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const id = params.get('id');
    
    if (action === 'add-cost') {
      setIsAddingCost(true);
    } else if (action === 'add-income') {
      setIsAddingIncome(true);
    } else if (action === 'edit' && id) {
      const isCost = costs.some(c => c.id === id);
      const isIncome = receipts.some(r => r.id === id);
      const isGoal = savingsGoals.some(g => g.id === id);
      
      if (isCost) handleEdit('cost', id);
      else if (isIncome) handleEdit('income', id);
      else if (isGoal) handleEdit('goal', id);
    }

    // Limpar o parâmetro da URL para não reabrir ao atualizar
    if (action) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    }
  }, [location, costs, receipts, savingsGoals]);
  
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PAYABLE' | 'RECEIVABLE' | 'REPORTS'>('DASHBOARD');
  
  // Form states
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Material');
  const [clientId, setClientId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  
  // Goal specific states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(0);
  const [goalCurrent, setGoalCurrent] = useState(0);
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('Reserva');
  const [goalIcon, setGoalIcon] = useState('Target');
  const [goalStatus, setGoalStatus] = useState<'IN_PROGRESS' | 'COMPLETED' | 'PAUSED'>('IN_PROGRESS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Financial Report Ultra Analysis and Importing
  const [isUltraImportOpen, setIsUltraImportOpen] = useState(false);
  const [ultraImportTab, setUltraImportTab] = useState<'CSV' | 'ULTRA_AI'>('CSV');
  const [selectedReportFile, setSelectedReportFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const [extractedReportResult, setExtractedReportResult] = useState<any | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Record<number, boolean>>({});
  const [editableTransactions, setEditableTransactions] = useState<any[]>([]);

  const handleEdit = (type: 'cost' | 'income' | 'goal' | 'payable' | 'receivable', id: string) => {
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

    if (type === 'payable') {
      const payable = (accountsPayable || []).find(p => p.id === id);
      if (payable) {
        setDescription(payable.description);
        setValue(payable.value);
        setDate(payable.dueDate);
        setCategory(payable.category);
        setPayableStatus(payable.status);
        setPayableNotes(payable.notes || '');
        setEditingTransaction({ type, id });
      }
      return;
    }

    if (type === 'receivable') {
      const receivable = (accountsReceivable || []).find(r => r.id === id);
      if (receivable) {
        setDescription(receivable.description);
        setValue(receivable.value);
        setDate(receivable.dueDate);
        setCategory(receivable.category);
        setReceivableStatus(receivable.status);
        setClientId(receivable.clientId || '');
        setReceivableNotes(receivable.notes || '');
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
    } else if (editingTransaction.type === 'payable') {
      updateAccountPayable(editingTransaction.id, {
        description,
        value,
        dueDate: date,
        category,
        status: payableStatus,
        notes: payableNotes
      });
    } else if (editingTransaction.type === 'receivable') {
      updateAccountReceivable(editingTransaction.id, {
        description,
        value,
        dueDate: date,
        category,
        status: receivableStatus,
        clientId,
        notes: receivableNotes
      });
    }

    setEditingTransaction(null);
    resetForm();
  };

  const handleDelete = (type: 'income' | 'cost' | 'goal' | 'payable' | 'receivable', id: string) => {
    if (type === 'income') {
      deleteReceipt(id);
    } else if (type === 'cost') {
      deleteCost(id);
    } else if (type === 'goal') {
      deleteSavingsGoal(id);
    } else if (type === 'payable') {
      deleteAccountPayable(id);
    } else if (type === 'receivable') {
      deleteAccountReceivable(id);
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
    setPayableNotes('');
    setReceivableNotes('');
    setPayableStatus('PENDING');
    setReceivableStatus('PENDING');
  };

  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0 || !date) {
      toast.error('Preencha descrição, valor e data de vencimento.');
      return;
    }

    addAccountPayable({
      description,
      value,
      dueDate: date,
      category,
      status: payableStatus,
      notes: payableNotes
    });

    resetForm();
    setIsAddingPayable(false);
  };

  const handleAddReceivable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0 || !date) {
      toast.error('Preencha descrição, valor e data de vencimento.');
      return;
    }

    addAccountReceivable({
      description,
      value,
      dueDate: date,
      category,
      status: receivableStatus,
      clientId: clientId || undefined,
      notes: receivableNotes
    });

    resetForm();
    setIsAddingReceivable(false);
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

  const totalIncome = receipts.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  const totalCosts = costs.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
  const estimatedTax = totalIncome * 0.08;
  const balance = totalIncome - totalCosts;
  const profitMargin = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  const accountsPayableList = useMemo(() => accountsPayable || [], [accountsPayable]);
  const accountsReceivableList = useMemo(() => accountsReceivable || [], [accountsReceivable]);

  const arPendingSum = useMemo(() => {
    const arListPending = accountsReceivableList
      .filter(r => r.status === 'PENDING' || r.status === 'OVERDUE')
      .reduce((sum, r) => sum + (Number(r.value) || 0), 0);
    const paymentsPending = payments
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return arListPending + paymentsPending;
  }, [accountsReceivableList, payments]);

  const apPendingSum = useMemo(() => {
    return accountsPayableList
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  }, [accountsPayableList]);

  const projectedBalance = balance + arPendingSum - apPendingSum;

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    costs.forEach(c => {
      const val = Number(c.value) || 0;
      categories[c.category] = (categories[c.category] || 0) + val;
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

  const COLORS = ['#00f2ff', '#ffffff', '#7000ff', '#ff00d4', '#ff8800', '#ffff00'];

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

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedReportFile(file);
    setFileMimeType(file.type || 'application/pdf');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part
      const base64 = result.split(',')[1];
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeReport = async () => {
    if (!fileBase64) {
      toast.error('Por favor, selecione um arquivo primeiro.');
      return;
    }

    setIsAnalyzingReport(true);
    try {
      const response = await fetch('/api/gemini/analyze-financial-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: fileBase64,
          mimeType: fileMimeType,
          fileName: selectedReportFile?.name || 'relatorio.pdf'
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro na requisição');
      }

      const data = await response.json();
      setExtractedReportResult(data);
      
      // Initialize editable copy and select all by default
      if (data.transactions && Array.isArray(data.transactions)) {
        setEditableTransactions(data.transactions);
        const initialSelected: Record<number, boolean> = {};
        data.transactions.forEach((_: any, idx: number) => {
          initialSelected[idx] = true;
        });
        setSelectedTransactions(initialSelected);
      }

      toast.success('Análise do relatório concluída com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error(`Falha ao analisar o relatório: ${error.message || String(error)}`);
    } finally {
      setIsAnalyzingReport(false);
    }
  };

  const handleUpdateTransactionField = (idx: number, field: string, val: any) => {
    setEditableTransactions(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };

  const handleRemoveTransactionFromList = (idx: number) => {
    setEditableTransactions(prev => prev.filter((_, i) => i !== idx));
    setSelectedTransactions(prev => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
  };

  const handleImportSelectedTransactions = async () => {
    const transactionsToImport = editableTransactions.filter((_, idx) => selectedTransactions[idx]);
    if (transactionsToImport.length === 0) {
      toast.error('Nenhuma transação selecionada para importação.');
      return;
    }

    const toastId = toast.loading('Processando importação...');
    let importedCosts = 0;
    let importedIncomes = 0;

    try {
      // Get or create generic client
      let genericClientId = clients.length > 0 ? clients[0].id : '';
      if (!genericClientId) {
        await addClient({
          name: 'Caixa Geral / Consumidor',
          phone: '(00) 00000-0000',
          address: 'Condomínio'
        });
        const updatedClients = useStore.getState().clients;
        genericClientId = updatedClients.length > 0 ? updatedClients[updatedClients.length - 1].id : '';
      }

      for (const t of transactionsToImport) {
        if (t.type === 'income') {
          await addReceipt({
            clientId: genericClientId,
            description: t.description,
            value: Number(t.value) || 0,
            date: t.date || new Date().toISOString().split('T')[0]
          });
          importedIncomes++;
        } else {
          await addCost({
            description: t.description,
            value: Number(t.value) || 0,
            date: t.date || new Date().toISOString().split('T')[0],
            category: t.category || 'Outros'
          });
          importedCosts++;
        }
      }

      toast.success(`Importação concluída: ${importedIncomes} receitas e ${importedCosts} despesas adicionadas no caixa.`, { id: toastId });
      setIsUltraImportOpen(false);
      
      // Clear states
      setSelectedReportFile(null);
      setFileBase64('');
      setFileMimeType('');
      setExtractedReportResult(null);
      setEditableTransactions([]);
      setSelectedTransactions({});
    } catch (err: any) {
      console.error(err);
      toast.error(`Falha ao realizar importação: ${err.message || String(err)}`, { id: toastId });
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-pdf-content');
    if (!element) {
      toast.error('Elemento do relatório não encontrado.');
      return;
    }

    const toastId = toast.loading('Gerando PDF do Relatório...');

    try {
      const opt = {
        margin: 10,
        filename: `Ultra_Analise_Financeira_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#09090b' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['.break-inside-avoid', 'tr', '.no-break', 'img', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'li', 'p']
        }
      };

      await html2pdf().set(opt as any).from(element).save();
      toast.success('PDF baixado com sucesso!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF.', { id: toastId });
    }
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
        estimatedTax,
        balance,
        profitMargin,
        accountsReceivable: arPendingSum,
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

  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Insira um nome para a categoria');
      return;
    }
    addCostCategory(newCategoryName.trim());
    setCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddingNewCat(false);
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

  const monthlyAccountsData = useMemo(() => {
    const dataByMonth: Record<string, { name: string, pagar: number, receber: number }> = {};
    const listPayables = accountsPayable || [];
    const listReceivables = accountsReceivable || [];

    listPayables.forEach(item => {
      if (!item.dueDate) return;
      const date = new Date(item.dueDate + 'T12:00:00');
      if (isNaN(date.getTime())) return;
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = safeFormatDate(item.dueDate, { month: 'short', year: 'numeric' });
      
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = { name: monthName, pagar: 0, receber: 0 };
      }
      
      dataByMonth[monthYear].pagar += Number(item.value || 0);
    });

    listReceivables.forEach(item => {
      if (!item.dueDate) return;
      const date = new Date(item.dueDate + 'T12:00:00');
      if (isNaN(date.getTime())) return;
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = safeFormatDate(item.dueDate, { month: 'short', year: 'numeric' });
      
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = { name: monthName, pagar: 0, receber: 0 };
      }
      
      dataByMonth[monthYear].receber += Number(item.value || 0);
    });

    return Object.keys(dataByMonth)
      .sort()
      .map(key => dataByMonth[key]);
  }, [accountsPayable, accountsReceivable]);

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

  const renderPayableTab = () => {
    const list = accountsPayable || [];
    const totalCount = list.length;
    const totalVal = list.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const pendingVal = list.filter(item => item.status === 'PENDING' || item.status === 'OVERDUE').reduce((sum, item) => sum + Number(item.value || 0), 0);
    const paidVal = list.filter(item => item.status === 'PAID').reduce((sum, item) => sum + Number(item.value || 0), 0);

    return (
      <div className="space-y-8 relative z-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard title="Total Cadastrado">
            <p className="text-2xl font-black text-white">{totalCount} contas</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Volume de lançamentos</p>
          </GlassCard>
          <GlassCard title="Valor Total">
            <p className="text-2xl font-black text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}
            </p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Soma de todas as contas</p>
          </GlassCard>
          <GlassCard title="Total Pendente">
            <p className="text-2xl font-black text-orange-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingVal)}
            </p>
            <p className="text-orange-400/60 text-[10px] font-bold uppercase tracking-widest mt-1">A vencer ou atrasado</p>
          </GlassCard>
          <GlassCard title="Total Pago">
            <p className="text-2xl font-black text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidVal)}
            </p>
            <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-widest mt-1">Lançamentos baixados</p>
          </GlassCard>
        </div>

        {/* List of Accounts Payable */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white">Lista de Contas a Pagar</h3>
              <p className="text-white/40 text-xs font-medium mt-1">Gerencie suas obrigações financeiras futuras.</p>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setIsAddingPayable(true);
              }}
              className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-6 py-3 flex items-center gap-2 border border-orange-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px]"
            >
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
          </div>

          <div className="space-y-4">
            {list.map((item, index) => {
              const isOverdue = item.status === 'OVERDUE' || (item.status === 'PENDING' && new Date(item.dueDate) < new Date());
              return (
                <div 
                  key={item.id}
                  className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status === 'PAID' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : isOverdue 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.status === 'PAID' ? (
                          <>
                            <Check className="w-3 h-3" />
                            Pago
                          </>
                        ) : isOverdue ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Atrasado
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3 h-3" />
                            Pendente
                          </>
                        )}
                      </span>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{item.category}</span>
                    </div>
                    <h4 className="text-lg font-black text-white">{item.description}</h4>
                    {item.notes && <p className="text-xs text-white/40 italic">{item.notes}</p>}
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Vencimento</p>
                      <p className="text-sm font-black text-white">{safeFormatDate(item.dueDate)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Valor</p>
                      <p className="text-xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status !== 'PAID' && (
                        <button 
                          onClick={() => updateAccountPayable(item.id, { status: 'PAID' })}
                          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Marcar como Pago
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit('payable', item.id)}
                        className="p-3 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all border border-white/5"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'payable', id: item.id })}
                        className="p-3 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all border border-white/5"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {list.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <TrendingDown className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-bold text-sm uppercase tracking-widest">Nenhuma conta a pagar cadastrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReceivableTab = () => {
    const list = accountsReceivable || [];
    const totalCount = list.length;
    const totalVal = list.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const pendingVal = list.filter(item => item.status === 'PENDING' || item.status === 'OVERDUE').reduce((sum, item) => sum + Number(item.value || 0), 0);
    const paidVal = list.filter(item => item.status === 'PAID').reduce((sum, item) => sum + Number(item.value || 0), 0);

    return (
      <div className="space-y-8 relative z-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard title="Total Cadastrado">
            <p className="text-2xl font-black text-white">{totalCount} recebíveis</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Volume de lançamentos</p>
          </GlassCard>
          <GlassCard title="Valor Total">
            <p className="text-2xl font-black text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}
            </p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Soma de todas as contas</p>
          </GlassCard>
          <GlassCard title="Total Pendente">
            <p className="text-2xl font-black text-cyan-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingVal)}
            </p>
            <p className="text-cyan-400/60 text-[10px] font-bold uppercase tracking-widest mt-1">A receber ou em atraso</p>
          </GlassCard>
          <GlassCard title="Total Recebido">
            <p className="text-2xl font-black text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidVal)}
            </p>
            <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-widest mt-1">Lançamentos baixados</p>
          </GlassCard>
        </div>

        {/* List of Accounts Receivable */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white">Lista de Contas a Receber</h3>
              <p className="text-white/40 text-xs font-medium mt-1">Acompanhe suas receitas agendadas e recebíveis.</p>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setIsAddingReceivable(true);
              }}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-3 flex items-center gap-2 border border-emerald-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px]"
            >
              <Plus className="w-4 h-4" /> Novo Recebível
            </button>
          </div>

          <div className="space-y-4">
            {list.map((item, index) => {
              const clientObj = clients.find(c => c.id === item.clientId);
              const isOverdue = item.status === 'OVERDUE' || (item.status === 'PENDING' && new Date(item.dueDate) < new Date());
              return (
                <div 
                  key={item.id}
                  className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status === 'PAID' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : isOverdue 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse' 
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {item.status === 'PAID' ? (
                          <>
                            <Check className="w-3 h-3" />
                            Pago
                          </>
                        ) : isOverdue ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Atrasado
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3 h-3" />
                            Pendente
                          </>
                        )}
                      </span>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{item.category}</span>
                    </div>
                    <h4 className="text-lg font-black text-white">{item.description}</h4>
                    {clientObj && (
                      <p className="text-xs text-cyan-400/80 font-semibold uppercase tracking-wider">
                        Cliente: {clientObj.name}
                      </p>
                    )}
                    {item.notes && <p className="text-xs text-white/40 italic">{item.notes}</p>}
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Expectativa</p>
                      <p className="text-sm font-black text-white">{safeFormatDate(item.dueDate)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Valor</p>
                      <p className="text-xl font-black text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status !== 'PAID' && (
                        <button 
                          onClick={() => updateAccountReceivable(item.id, { status: 'PAID' })}
                          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Marcar como Recebido
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit('receivable', item.id)}
                        className="p-3 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all border border-white/5"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: 'receivable', id: item.id })}
                        className="p-3 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all border border-white/5"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {list.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-bold text-sm uppercase tracking-widest">Nenhum recebível cadastrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                <FileSpreadsheet className="w-5 h-5 text-white" />
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

        <GlassCard title="Resumo de Impostos">
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total de Receitas</p>
              <p className="text-xl font-black text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}</p>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400/60 mb-1">Imposto Estimado (8%)</p>
              <p className="text-xl font-black text-orange-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedTax)}</p>
            </div>
            <p className="text-[10px] text-white/20 italic px-2">
              * Cálculo baseado na alíquota média de 8% sobre o faturamento bruto.
            </p>
          </div>
        </GlassCard>

        <GlassCard title="Resumo por Categoria">
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
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Imposto (8%)</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Valor</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Ações</th>
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
                  <td className="py-4 text-sm font-bold text-right text-orange-400/60">
                    {t.type === 'income' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value * 0.08) : '-'}
                  </td>
                  <td className={`py-4 text-sm font-black text-right ${t.type === 'income' ? 'text-white' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(t.type === 'income' ? 'income' : 'cost', t.id)}
                        className="p-2 text-white/20 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ type: t.type === 'income' ? 'income' : 'cost', id: t.id })}
                        className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
              <div className="flex items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">Financeiro</h1>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all backdrop-blur-md"
                  title={showBalance ? "Ocultar Valores" : "Mostrar Valores"}
                >
                  {showBalance ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-sm text-white/40 mt-2 font-light max-w-md leading-relaxed">Análise preditiva e controle de fluxo de caixa em tempo real.</p>
            </div>
          </div>

          <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner ml-8">
            <button 
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'DASHBOARD' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('PAYABLE')}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'PAYABLE' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Contas a Pagar
            </button>
            <button 
              onClick={() => setActiveTab('RECEIVABLE')}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'RECEIVABLE' 
                  ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Contas a Receber
            </button>
            <button 
              onClick={() => setActiveTab('REPORTS')}
              className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
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
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setUltraImportTab('ULTRA_AI');
                setIsUltraImportOpen(true);
              }}
              className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-6 py-3 flex items-center gap-2 border border-purple-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(168,85,247,0.1)]"
            >
              <Upload className="w-4 h-4 text-purple-400" /> 
              <span>Importar Extrato / Planilha</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsConfirmClearOpen(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-6 py-3 flex items-center gap-2 border border-rose-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(244,63,94,0.1)]"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> 
              <span>Zerar Dados</span>
            </motion.button>

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
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 flex items-center gap-2 border border-white/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
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

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                resetForm();
                setIsAddingPayable(true);
              }}
              className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-6 py-3 flex items-center gap-2 border border-orange-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(245,158,11,0.1)]"
            >
              <Plus className="w-4 h-4" /> 
              <span>Conta a Pagar</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                resetForm();
                setIsAddingReceivable(true);
              }}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-3 flex items-center gap-2 border border-emerald-500/30 transition-all rounded-2xl backdrop-blur-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <Plus className="w-4 h-4" /> 
              <span>Conta a Receber</span>
            </motion.button>
          </div>
        </header>

        {activeTab === 'DASHBOARD' ? (
          <>
            {/* High-Fidelity Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Receitas Realizadas</h3>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black text-white tracking-tighter mb-2 transition-[opacity,color,transform] duration-300 ${!showBalance && 'blur-xl select-none'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
          </p>
          <div className="flex items-center gap-2 text-cyan-400/60 text-[8px] font-bold uppercase tracking-widest">
            <ArrowUpRight className="w-2 h-2" />
            <span>Entradas efetivas</span>
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
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Despesas Realizadas</h3>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black text-white tracking-tighter mb-2 transition-[opacity,color,transform] duration-300 ${!showBalance && 'blur-xl select-none'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCosts)}
          </p>
          <div className="flex items-center gap-2 text-rose-400/60 text-[8px] font-bold uppercase tracking-widest">
            <ArrowDownRight className="w-2 h-2" />
            <span>Custos efetivos</span>
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
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Saldo de Caixa (Real)</h3>
            <div className={`p-2 rounded-xl border ${balance >= 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tighter mb-2 transition-[opacity,color,transform] duration-300 ${!showBalance && 'blur-xl select-none'} ${balance >= 0 ? 'text-white' : 'text-orange-400'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
          </p>
          <div className="flex items-center gap-2 text-white/20 text-[8px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-2 h-2" />
            <span>Disponibilidade imediata</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Fluxo de Caixa Projetado</h3>
            <div className={`p-2 rounded-xl border ${projectedBalance >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tighter mb-2 transition-[opacity,color,transform] duration-300 ${!showBalance && 'blur-xl select-none'} ${projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projectedBalance)}
          </p>
          <div className="flex items-center gap-2 text-emerald-400/60 text-[8px] font-bold uppercase tracking-widest">
            <TrendingUp className="w-2 h-2" />
            <span>Previsão de caixa futuro</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Contas a Receber</h3>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tighter mb-2 text-white transition-[opacity,color,transform] duration-300 ${!showBalance && 'blur-xl select-none'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(arPendingSum)}
          </p>
          <div className="flex items-center gap-2 text-cyan-400/60 text-[8px] font-bold uppercase tracking-widest">
            <ArrowUpRight className="w-2 h-2" />
            <span>Previsão de entradas pendentes</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Contas a Pagar</h3>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tighter mb-2 text-white transition-[opacity,color,transform] duration-300 ${!showBalance && 'blur-xl select-none'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apPendingSum)}
          </p>
          <div className="flex items-center gap-2 text-rose-400/60 text-[8px] font-bold uppercase tracking-widest">
            <ArrowDownRight className="w-2 h-2" />
            <span>Saídas e vencimentos agendados</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Margem Operacional</h3>
            <div className="p-2 bg-white/10 text-white rounded-xl border border-white/20">
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
                  stroke="#ffffff"
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
              <p className="text-xs font-bold text-white uppercase tracking-tighter">Excelente</p>
            </div>
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
            <h3 className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Gastos por Categoria</h3>
            <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/10">Analysis</div>
          </div>
          
          <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {categoryData
              .sort((a, b) => b.value - a.value)
              .slice(0, 8)
              .map((item, index) => {
                const percentage = totalCosts > 0 ? (item.value / totalCosts) * 100 : 0;
                return (
                  <div key={item.name}>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-0.5">Categoria</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 truncate max-w-[140px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-xs font-black text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                        </span>
                        <span className="text-[8px] font-bold text-white/30">
                          {percentage.toFixed(1)}% do total
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full shadow-lg"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            {categoryData.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                  <TrendingDown className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-xs text-white/20 italic font-medium uppercase tracking-widest">Nenhum custo registrado</p>
              </div>
            )}
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

      {/* Contas a Pagar vs Contas a Receber Bar Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white/5 rounded-[3rem] p-10 border border-white/10 shadow-2xl backdrop-blur-3xl mb-16 relative z-10"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              Previsão Mensal de Fluxo: Contas a Pagar vs. Contas a Receber
            </h2>
            <p className="text-white/40 text-sm font-medium mt-1">Análise preditiva mensal comparando obrigações futuras e receitas programadas.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">A Receber</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">A Pagar</span>
            </div>
          </div>
        </div>

        {monthlyAccountsData.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <BarChart3 className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-sm text-white/40 italic font-medium uppercase tracking-widest">Nenhuma conta cadastrada para comparação futura</p>
          </div>
        ) : (
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAccountsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} 
                  tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                />
                <Bar 
                  dataKey="receber" 
                  name="A Receber" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
                <Bar 
                  dataKey="pagar" 
                  name="A Pagar" 
                  fill="#f97316" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
      
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
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
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
                  <div className="p-4 rounded-2xl bg-white/10 text-white border border-white/20">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setIsAddingMoneyToGoal(true);
                      }}
                      className="p-3 text-white hover:bg-white/20 rounded-xl transition-all border border-white/20"
                      title="Adicionar Dinheiro"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEdit('goal', goal.id)}
                      className="p-3 text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all border border-cyan-500/20"
                      title="Editar Meta"
                    >
                      <Pencil className="w-5 h-5" />
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
                      className="h-full bg-gradient-to-r from-white to-zinc-400 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30 pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{safeFormatDate(goal.deadline) || 'Sem prazo'}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full border ${goal.status === 'COMPLETED' ? 'bg-white/10 text-white border-white/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
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
                    className="p-3 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: t.type === 'income' ? 'income' : 'cost', id: t.id }); }}
                    className="p-3 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
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
      ) : activeTab === 'PAYABLE' ? (
        renderPayableTab()
      ) : activeTab === 'RECEIVABLE' ? (
        renderReceivableTab()
      ) : (
        renderReports()
      )}

      </div>

      {/* Edit Transaction/Goal Modal */}
      <Modal 
        isOpen={!!editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
        title={`Editar ${
          editingTransaction?.type === 'cost' 
            ? 'Custo' 
            : editingTransaction?.type === 'income' 
              ? 'Receita' 
              : editingTransaction?.type === 'payable' 
                ? 'Conta a Pagar' 
                : editingTransaction?.type === 'receivable' 
                  ? 'Conta a Receber' 
                  : 'Meta'
        }`}
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
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold uppercase tracking-wider text-white/60">Categoria</label>
                      <button 
                        type="button"
                        onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                        className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-lg border border-cyan-400/20 hover:bg-cyan-400/20 transition-all"
                      >
                        {isAddingNewCat ? 'Cancelar' : '+ Nova'}
                      </button>
                    </div>
                    
                    {!isAddingNewCat ? (
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                      >
                        {costCategories.map(cat => (
                          <option key={cat} value={cat} className="bg-[#004a7c]">{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                          placeholder="Nome da categoria..."
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={handleCreateNewCategory}
                          className="bg-white/20 text-white p-3 rounded-xl border border-white/30 hover:bg-white/30 transition-all"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(editingTransaction?.type === 'payable' || editingTransaction?.type === 'receivable') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Categoria</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                    >
                      <option value="Serviços" className="bg-[#004a7c]">Serviços</option>
                      <option value="Impostos" className="bg-[#004a7c]">Impostos</option>
                      <option value="Fornecedores" className="bg-[#004a7c]">Fornecedores</option>
                      <option value="Infraestrutura" className="bg-[#004a7c]">Infraestrutura</option>
                      <option value="Equipamentos" className="bg-[#004a7c]">Equipamentos</option>
                      <option value="Marketing" className="bg-[#004a7c]">Marketing</option>
                      <option value="Outros" className="bg-[#004a7c]">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Status</label>
                    <select 
                      value={editingTransaction?.type === 'payable' ? payableStatus : receivableStatus}
                      onChange={(e) => {
                        if (editingTransaction?.type === 'payable') {
                          setPayableStatus(e.target.value as any);
                        } else {
                          setReceivableStatus(e.target.value as any);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                    >
                      <option value="PENDING" className="bg-[#004a7c]">Pendente</option>
                      <option value="PAID" className="bg-[#004a7c]">{editingTransaction?.type === 'payable' ? 'Pago' : 'Recebido'}</option>
                      <option value="OVERDUE" className="bg-[#004a7c]">Atrasado</option>
                    </select>
                  </div>

                  {editingTransaction?.type === 'receivable' && (
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Cliente</label>
                      <select 
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#004a7c]">Nenhum cliente associado</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#004a7c]">{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Observações / Notas</label>
                    <textarea 
                      value={editingTransaction?.type === 'payable' ? payableNotes : receivableNotes}
                      onChange={(e) => {
                        if (editingTransaction?.type === 'payable') {
                          setPayableNotes(e.target.value);
                        } else {
                          setReceivableNotes(e.target.value);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30 h-20 resize-none"
                      placeholder="Alguma anotação importante..."
                    />
                  </div>
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
              className="bg-white/20 hover:bg-white/30 text-white px-10 py-3 rounded-xl font-bold border border-white/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/60">Categoria</label>
              <button 
                type="button"
                onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-lg border border-cyan-400/20 hover:bg-cyan-400/20 transition-all"
              >
                {isAddingNewCat ? 'Cancelar' : '+ Nova'}
              </button>
            </div>
            
            {!isAddingNewCat ? (
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
              >
                {costCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#004a7c]">{cat}</option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                  placeholder="Nome da categoria..."
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="bg-white/20 text-white p-3 rounded-xl border border-white/30 hover:bg-white/30 transition-all"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            )}
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
              className="bg-white/20 hover:bg-white/30 text-white px-10 py-3 rounded-xl font-bold border border-white/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              SALVAR RECEITA
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Account Payable Modal */}
      <Modal 
        isOpen={isAddingPayable} 
        onClose={() => setIsAddingPayable(false)} 
        title="Adicionar Conta a Pagar"
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={handleAddPayable} className="space-y-6 p-2">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Descrição *</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
              placeholder="Ex: Aluguel da sede, fatura de servidor..."
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
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Vencimento *</label>
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
              <option value="Serviços" className="bg-[#004a7c]">Serviços</option>
              <option value="Impostos" className="bg-[#004a7c]">Impostos</option>
              <option value="Fornecedores" className="bg-[#004a7c]">Fornecedores</option>
              <option value="Infraestrutura" className="bg-[#004a7c]">Infraestrutura</option>
              <option value="Equipamentos" className="bg-[#004a7c]">Equipamentos</option>
              <option value="Marketing" className="bg-[#004a7c]">Marketing</option>
              <option value="Outros" className="bg-[#004a7c]">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Status Inicial</label>
            <select 
              value={payableStatus}
              onChange={(e) => setPayableStatus(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
            >
              <option value="PENDING" className="bg-[#004a7c]">Pendente</option>
              <option value="PAID" className="bg-[#004a7c]">Pago</option>
              <option value="OVERDUE" className="bg-[#004a7c]">Atrasado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Observações / Notas</label>
            <textarea 
              value={payableNotes}
              onChange={(e) => setPayableNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30 h-20 resize-none"
              placeholder="Ex: Fatura referente ao provedor AWS..."
            />
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsAddingPayable(false)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-10 py-3 rounded-xl font-bold border border-orange-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              SALVAR OBRIGAÇÃO
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Account Receivable Modal */}
      <Modal 
        isOpen={isAddingReceivable} 
        onClose={() => setIsAddingReceivable(false)} 
        title="Adicionar Conta a Receber"
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={handleAddReceivable} className="space-y-6 p-2">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Cliente</label>
            <select 
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#004a7c]">Nenhum cliente associado</option>
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
              placeholder="Ex: Recebimento de mensalidade, projeto..."
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
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Expectativa de Recebimento *</label>
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
              <option value="Serviços" className="bg-[#004a7c]">Serviços</option>
              <option value="Impostos" className="bg-[#004a7c]">Impostos</option>
              <option value="Fornecedores" className="bg-[#004a7c]">Fornecedores</option>
              <option value="Infraestrutura" className="bg-[#004a7c]">Infraestrutura</option>
              <option value="Equipamentos" className="bg-[#004a7c]">Equipamentos</option>
              <option value="Marketing" className="bg-[#004a7c]">Marketing</option>
              <option value="Outros" className="bg-[#004a7c]">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Status Inicial</label>
            <select 
              value={receivableStatus}
              onChange={(e) => setReceivableStatus(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white appearance-none cursor-pointer"
            >
              <option value="PENDING" className="bg-[#004a7c]">Pendente</option>
              <option value="PAID" className="bg-[#004a7c]">Recebido</option>
              <option value="OVERDUE" className="bg-[#004a7c]">Atrasado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Observações / Notas</label>
            <textarea 
              value={receivableNotes}
              onChange={(e) => setReceivableNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30 h-20 resize-none"
              placeholder="Ex: Referente à consultoria de software de Junho..."
            />
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsAddingReceivable(false)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-10 py-3 rounded-xl font-bold border border-emerald-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              SALVAR RECEBÍVEL
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
              className="bg-white/20 hover:bg-white/30 text-white px-10 py-3 rounded-xl font-bold border border-white/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
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
                  setConfirmDelete({ type: selectedTransaction.type, id: selectedTransaction.id });
                  setSelectedTransaction(null);
                }}
                className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl font-bold transition-all border border-rose-500/20"
              >
                Excluir
              </button>
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

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            handleDelete(confirmDelete.type, confirmDelete.id);
            setConfirmDelete(null);
            toast.success('Lançamento excluído com sucesso');
          }
        }}
        title="Excluir Lançamento"
        message="Tem certeza que deseja excluir permanentemente este lançamento financeiro? Esta ação não pode ser desfeita."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={async () => {
          setIsConfirmClearOpen(false);
          const toastId = toast.loading('Limpando dados financeiros...');
          try {
            await clearFinancialData();
            toast.dismiss(toastId);
          } catch (err: any) {
            toast.error(`Falha ao zerar dados: ${err.message || String(err)}`, { id: toastId });
          }
        }}
        title="Zerar Dados Financeiros"
        message="ATENÇÃO CRÍTICA: Você tem certeza absoluta de que deseja zerar permanentemente todas as movimentações financeiras, receitas e despesas lançadas? Esta ação é irreversível e apagará todos os registros de caixa."
        confirmText="Sim, Zerar Tudo"
        cancelText="Cancelar"
      />

      <Modal
        isOpen={isUltraImportOpen}
        onClose={() => {
          setIsUltraImportOpen(false);
          setExtractedReportResult(null);
          setSelectedReportFile(null);
          setFileBase64('');
          setEditableTransactions([]);
          setSelectedTransactions({});
        }}
        title="Importador & Auditor de Extrato Bancário (Ultra Análise)"
        maxWidth="7xl"
        glass={true}
      >
        <div className="space-y-6 text-white max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* Tabs */}
          <div className="flex border-b border-white/10 pb-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setUltraImportTab('ULTRA_AI')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  ultraImportTab === 'ULTRA_AI' 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Análise com IA & Importador de Extratos
              </button>
              <button
                onClick={() => setUltraImportTab('CSV')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  ultraImportTab === 'CSV' 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Importação Direta de Planilhas (CSV)
              </button>
            </div>
          </div>

          {ultraImportTab === 'CSV' ? (
            <div className="space-y-6 py-4 text-center">
              <div className="max-w-md mx-auto p-8 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400">
                  <FileSpreadsheet size={40} />
                </div>
                <h3 className="text-lg font-bold">Importação Padrão via CSV</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Faça o upload de planilhas de movimentações financeiras em formato CSV para importação direta de receitas e despesas.
                </p>
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="csv-file-selector"
                />
                <label 
                  htmlFor="csv-file-selector"
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs"
                >
                  Selecionar Planilha CSV
                </label>
              </div>
            </div>
          ) : (
            // Tab ULTRA_AI
            <div className="space-y-6">
              {!extractedReportResult ? (
                // 1. Upload state
                <div className="max-w-2xl mx-auto p-8 border-2 border-dashed border-purple-500/20 rounded-3xl bg-purple-500/5 flex flex-col items-center justify-center space-y-6 shadow-[0_0_40px_rgba(168,85,247,0.05)]">
                  <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 animate-pulse">
                    <Upload size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black tracking-tight text-white uppercase">Upload do Extrato / Relatório Bancário</h3>
                    <p className="text-xs text-white/60 leading-relaxed max-w-md">
                      Arraste ou selecione qualquer extrato em formato <span className="text-purple-400 font-bold">PDF, Excel (.xlsx/.xls), CSV ou TXT</span> emitido pelo seu banco (Itaú, Nubank, Bradesco, etc) com as movimentações reais.
                    </p>
                  </div>

                  <div className="w-full max-w-md flex flex-col items-center gap-4">
                    <input 
                      type="file" 
                      accept=".pdf,.csv,.xlsx,.xls,.txt" 
                      onChange={handleReportFileChange}
                      className="hidden" 
                      id="report-file-selector"
                    />
                    <label 
                      htmlFor="report-file-selector"
                      className="w-full text-center px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/15 transition-all cursor-pointer text-sm flex items-center justify-center gap-3"
                    >
                      <FolderOpen className="w-5 h-5 text-purple-400" />
                      {selectedReportFile ? selectedReportFile.name : 'Escolher Arquivo do Extrato'}
                    </label>

                    {selectedReportFile && (
                      <div className="text-xs text-white/40 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>{(selectedReportFile.size / 1024).toFixed(1)} KB • {selectedReportFile.type || 'Tipo desconhecido'}</span>
                      </div>
                    )}

                    <button
                      onClick={handleAnalyzeReport}
                      disabled={isAnalyzingReport || !selectedReportFile}
                      className="w-full mt-2 py-4 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/20 disabled:text-white/40 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {isAnalyzingReport ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Auditando & Extraindo...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5" />
                          <span>Iniciar Ultra Análise Inteligente</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // 2. Results State
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column: Sample report / PDF preview */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-[#09090b]/40 p-4 rounded-2xl border border-white/5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                        <Brain className="w-4 h-4" /> Laudo de Auditoria Gerado
                      </h4>
                      <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-[#39FF14]/15 hover:bg-[#39FF14]/35 text-[#39FF14] rounded-xl text-[10px] font-black uppercase tracking-wider border border-[#39FF14]/30 flex items-center gap-2 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar PDF Completo
                      </button>
                    </div>

                    {/* Report PDF layout wrapper */}
                    <div 
                      id="report-pdf-content" 
                      className="bg-[#09090b] p-8 rounded-3xl border border-white/10 space-y-6 text-white text-sm leading-relaxed"
                      style={{ contentVisibility: 'auto' }}
                    >
                      <div className="border-b border-white/10 pb-6 text-center space-y-2">
                        <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-400">
                          Auditoria de Extrato Real de Caixa
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Laudo de Ultra Análise Financeira</h2>
                        <p className="text-xs text-white/40 font-mono">
                          Documento: {selectedReportFile?.name} • Gerado em: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
                        </p>
                      </div>

                      {/* Financial Metrics Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Soma Receitas</span>
                          <span className="text-base font-black text-[#39FF14] mt-1">
                            R$ {extractedReportResult.financialMetrics?.extractedIncomes?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                          </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Soma Despesas</span>
                          <span className="text-base font-black text-rose-400 mt-1">
                            R$ {extractedReportResult.financialMetrics?.extractedExpenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                          </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Saldo Líquido</span>
                          <span className={`text-base font-black mt-1 ${extractedReportResult.financialMetrics?.netBalance >= 0 ? 'text-[#39FF14]' : 'text-rose-400'}`}>
                            R$ {extractedReportResult.financialMetrics?.netBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                          </span>
                        </div>
                      </div>

                      {/* Score card */}
                      <div className="bg-purple-500/5 p-6 rounded-3xl border border-purple-500/10 flex items-center gap-6">
                        <div className="relative flex items-center justify-center w-20 h-20 bg-purple-500/10 rounded-full border border-purple-500/20">
                          <div className="text-center">
                            <span className="text-3xl font-black text-purple-400">{extractedReportResult.healthScore}</span>
                            <span className="text-[8px] block font-bold text-purple-400/60 uppercase">Score</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">Nota de Saúde Financeira</h4>
                          <p className="text-xs text-white/60 leading-relaxed">
                            {extractedReportResult.healthScore >= 75 
                              ? 'Excelente saúde financeira. O volume de caixa gerado cobre amplamente os custos operacionais com anomalias mínimas identificadas.' 
                              : extractedReportResult.healthScore >= 50 
                              ? 'Saúde financeira em estado de atenção. Foram encontrados custos extras ou taxas elevadas que podem ser otimizados.' 
                              : 'Alerta financeiro grave. Alto volume de despesas em relação a receitas ou presença expressiva de furos financeiros.'}
                          </p>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-2 border-b border-white/5 pb-2">
                          <FileText className="w-4 h-4" /> Resumo Executivo e Diagnóstico de Contas
                        </h3>
                        <div className="text-xs text-white/70 leading-relaxed markdown-body">
                          <ReactMarkdown>{extractedReportResult.summary}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Anomalies and alerts */}
                      {extractedReportResult.anomalies && extractedReportResult.anomalies.length > 0 && (
                        <div className="space-y-3 bg-rose-500/5 p-5 rounded-3xl border border-rose-500/10">
                          <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Pontos de Atenção & Suspeitas Detectadas
                          </h3>
                          <ul className="list-disc pl-5 space-y-1.5">
                            {extractedReportResult.anomalies.map((item: string, idx: number) => (
                              <li key={idx} className="text-xs text-rose-300 leading-relaxed">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Savings Recommendations */}
                      {extractedReportResult.savingsRecommendations && extractedReportResult.savingsRecommendations.length > 0 && (
                        <div className="space-y-3 bg-[#39FF14]/5 p-5 rounded-3xl border border-[#39FF14]/10">
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#39FF14] flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Plano de Ação & Redução de Gastos
                          </h3>
                          <div className="space-y-3">
                            {extractedReportResult.savingsRecommendations.map((rec: any, idx: number) => (
                              <div key={idx} className="space-y-1">
                                <h4 className="text-xs font-black text-white flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full"></span>
                                  {rec.title}
                                </h4>
                                <p className="text-[11px] text-white/60 leading-relaxed pl-3.5">{rec.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Short list of transaction audit for PDF */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
                          Demonstrativo Completo de Transações Extraídas
                        </h3>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-[9px] uppercase tracking-wider text-white/40">
                              <th className="py-2">Data</th>
                              <th className="py-2">Descrição</th>
                              <th className="py-2">Categoria</th>
                              <th className="py-2 text-right">Valor (R$)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-[10px]">
                            {editableTransactions.map((t: any, idx: number) => (
                              <tr key={idx} className={t.type === 'income' ? 'text-[#39FF14]/90' : 'text-rose-300/90'}>
                                <td className="py-2 font-mono">{t.date}</td>
                                <td className="py-2 font-bold max-w-[150px] truncate">{t.description}</td>
                                <td className="py-2">{t.type === 'income' ? 'Receita' : t.category || 'Outros'}</td>
                                <td className="py-2 text-right font-black">
                                  {t.type === 'income' ? '+' : '-'} R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Import Checklist & Inputs */}
                  <div className="space-y-6">
                    <div className="bg-[#09090b]/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">Selecione as Transações para o Caixa</h4>
                        <p className="text-[10px] text-white/60">Edite descrições, categorias e valores antes de importar para o livro de caixa oficial.</p>
                      </div>
                    </div>

                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => {
                          const allSelected = editableTransactions.every((_, idx) => selectedTransactions[idx]);
                          const nextSelected: Record<number, boolean> = {};
                          editableTransactions.forEach((_, idx) => {
                            nextSelected[idx] = !allSelected;
                          });
                          setSelectedTransactions(nextSelected);
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        {editableTransactions.every((_, idx) => selectedTransactions[idx]) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {editableTransactions.map((t: any, idx: number) => {
                        const isSelected = !!selectedTransactions[idx];
                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-2xl border transition-all ${
                              isSelected 
                                ? t.type === 'income' 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                                  : 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex gap-3 items-start">
                              <button
                                onClick={() => setSelectedTransactions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className={`mt-1 p-1 rounded-md border transition-all ${
                                  isSelected 
                                    ? t.type === 'income' 
                                      ? 'bg-[#39FF14] text-black border-[#39FF14]' 
                                      : 'bg-rose-500 text-black border-rose-400'
                                    : 'border-white/30 text-transparent hover:border-white/60'
                                }`}
                              >
                                <Check size={12} strokeWidth={4} />
                              </button>

                              <div className="flex-1 space-y-3">
                                {/* First line: description and remove btn */}
                                <div className="flex justify-between items-start gap-2">
                                  <input 
                                    type="text"
                                    value={t.description}
                                    onChange={(e) => handleUpdateTransactionField(idx, 'description', e.target.value)}
                                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-purple-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none transition-all"
                                    placeholder="Descrição da movimentação"
                                  />
                                  <button
                                    onClick={() => handleRemoveTransactionFromList(idx)}
                                    className="p-1.5 text-white/40 hover:text-rose-400 transition-colors"
                                    title="Remover da lista"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Second line: metadata edits */}
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-white/40 block mb-1">Tipo</label>
                                    <select
                                      value={t.type}
                                      onChange={(e) => handleUpdateTransactionField(idx, 'type', e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black text-white outline-none cursor-pointer"
                                    >
                                      <option value="income" className="bg-[#1a1a1a] text-[#39FF14]">Receita</option>
                                      <option value="cost" className="bg-[#1a1a1a] text-rose-400">Despesa</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[8px] font-black uppercase text-white/40 block mb-1">Categoria / Destino</label>
                                    {t.type === 'income' ? (
                                      <div className="w-full bg-white/5 border border-white/5 text-white/40 text-[10px] font-bold rounded-lg px-2 py-1.5">
                                        Receita Geral
                                      </div>
                                    ) : (
                                      <select
                                        value={t.category || 'Outros'}
                                        onChange={(e) => handleUpdateTransactionField(idx, 'category', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black text-white outline-none cursor-pointer"
                                      >
                                        {costCategories.map(cat => (
                                          <option key={cat} value={cat} className="bg-[#1a1a1a]">{cat}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>

                                  <div>
                                    <label className="text-[8px] font-black uppercase text-white/40 block mb-1">Valor (R$)</label>
                                    <input 
                                      type="number"
                                      step="0.01"
                                      value={t.value}
                                      onChange={(e) => handleUpdateTransactionField(idx, 'value', parseFloat(e.target.value) || 0)}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black text-white outline-none focus:border-purple-500/40"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2">
                                    <label className="text-[8px] font-black uppercase text-white/40 block mb-1">Data</label>
                                    <input 
                                      type="date"
                                      value={t.date}
                                      onChange={(e) => handleUpdateTransactionField(idx, 'date', e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none"
                                    />
                                  </div>
                                  <div className="flex items-end justify-end">
                                    <span className={`text-[10px] font-black tracking-tight ${t.type === 'income' ? 'text-[#39FF14]' : 'text-rose-400'}`}>
                                      {t.type === 'income' ? '+' : '-'} R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex gap-4">
                      <button
                        onClick={() => {
                          setExtractedReportResult(null);
                          setSelectedReportFile(null);
                          setFileBase64('');
                          setEditableTransactions([]);
                          setSelectedTransactions({});
                        }}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95"
                      >
                        Analisar Novo Extrato
                      </button>
                      <button
                        onClick={handleImportSelectedTransactions}
                        className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Importar Selecionadas ({editableTransactions.filter((_, idx) => selectedTransactions[idx]).length})
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
