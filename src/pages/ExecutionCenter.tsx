import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { Ticket, TicketStatus, SupplyItem } from '../types';
import { 
  Play, CheckCircle2, Clock, MapPin, 
  ChevronRight, Package, DollarSign, 
  Plus, Minus, X, AlertTriangle,
  ArrowRight, Info, Pin, Trash2, Search, Palette, Check, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Modal } from '../components/Modal';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

function ExecutionTimer({ startedAt }: { startedAt?: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) {
      setElapsed('00:00:00');
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);
      
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    setElapsed(calculateElapsed());

    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] text-[10.5px] font-mono font-bold animate-pulse shadow-[0_0_8px_rgba(57,255,20,0.15)] shrink-0">
      <Clock className="w-3.5 h-3.5 text-[#39FF14]" />
      <span>{elapsed}</span>
    </div>
  );
}

export default function ExecutionCenter() {
  const { 
    tickets, clients, supplyItems, checklistItems, updateTicket, 
    addReceipt, addCost, updateStock, addChecklistItem, costCategories
  } = useStore();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [usedMaterials, setUsedMaterials] = useState<{ itemId?: string; name?: string; quantity: number }[]>([]);
  const [materialName, setMaterialName] = useState('');
  const [extraCosts, setExtraCosts] = useState<{ description: string; value: number; category: string }[]>([]);
  const [checklistProgress, setChecklistProgress] = useState<{ [taskId: string]: boolean }>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const playId = searchParams.get('play');

  // Google Keep Notes Interface and State
  const keepColors = useMemo(() => [
    { id: 'default', name: 'Original', bg: 'bg-zinc-900 border-white/10 text-white', dot: 'bg-zinc-700 border-white/20', accentLine: 'bg-white/10' },
    { id: 'red', name: 'Vermelho', bg: 'bg-red-950/20 border-red-500/30 text-red-100', dot: 'bg-red-500', accentLine: 'bg-red-500' },
    { id: 'orange', name: 'Laranja', bg: 'bg-orange-950/20 border-orange-500/30 text-orange-100', dot: 'bg-orange-500', accentLine: 'bg-orange-500' },
    { id: 'yellow', name: 'Amarelo', bg: 'bg-amber-950/20 border-amber-500/30 text-amber-100', dot: 'bg-amber-500', accentLine: 'bg-amber-500' },
    { id: 'green', name: 'Verde', bg: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100', dot: 'bg-emerald-500', accentLine: 'bg-[#39FF14]' },
    { id: 'blue', name: 'Azul', bg: 'bg-blue-950/20 border-blue-500/30 text-blue-100', dot: 'bg-blue-500', accentLine: 'bg-blue-500' },
    { id: 'purple', name: 'Roxo', bg: 'bg-purple-950/20 border-purple-500/30 text-purple-100', dot: 'bg-purple-500', accentLine: 'bg-purple-500' },
    { id: 'pink', name: 'Rosa', bg: 'bg-pink-950/20 border-pink-500/30 text-pink-100', dot: 'bg-pink-500', accentLine: 'bg-pink-500' },
  ], []);

  interface KeepNote {
    id: string;
    title: string;
    content: string;
    colorId: string;
    isPinned: boolean;
    createdAt: string;
  }

  const [keepNotes, setKeepNotes] = useState<KeepNote[]>(() => {
    const saved = localStorage.getItem('execution_keep_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        title: '⚠️ Manutenção Corretiva Agendada',
        content: 'Lembrar de falar com o zelador sobre as peças de reposição da bomba d\'água principal. O distribuidor prometeu entregar até as 14h.',
        colorId: 'orange',
        isPinned: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '📋 Check-out de Ferramentas',
        content: 'Passar na recepção para devolver a chave do quadro geral de disjuntores da torre bloco B antes de encerrar o turno de trabalho.',
        colorId: 'blue',
        isPinned: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: '💡 Ideia de Melhoria',
        content: 'Automatizar o controle de níveis dos reservatórios superiores com sensores IoT de ultrassom. Sugerir no relatório trimestral para o síndico.',
        colorId: 'green',
        isPinned: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColorId, setNewColorId] = useState('default');
  const [newIsPinned, setNewIsPinned] = useState(false);

  // Editing state for notes
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColorId, setEditColorId] = useState('default');
  const [editIsPinned, setEditIsPinned] = useState(false);

  // Sync to localStorage and dispatch events
  useEffect(() => {
    localStorage.setItem('execution_keep_notes', JSON.stringify(keepNotes));
    window.dispatchEvent(new Event('keep_notes_changed'));
  }, [keepNotes]);

  // Handle cross-tab or cross-component sync
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('execution_keep_notes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only update if parsed is structurally different to prevent loop
          if (JSON.stringify(parsed) !== JSON.stringify(keepNotes)) {
            setKeepNotes(parsed);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('keep_notes_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('keep_notes_changed', handleStorageChange);
    };
  }, [keepNotes]);

  // Handle Note creations
  const handleSaveNote = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsExpanding(false);
      return;
    }
    const newNote: KeepNote = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      colorId: newColorId,
      isPinned: newIsPinned,
      createdAt: new Date().toISOString()
    };
    setKeepNotes(prev => [newNote, ...prev]);
    setNewTitle('');
    setNewContent('');
    setNewColorId('default');
    setNewIsPinned(false);
    setIsExpanding(false);
    toast.success('Nota de turno criada com sucesso!');
  };

  const handleDeleteKeepNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Nota de turno deletada!');
  };

  const handleToggleKeepPin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const handleChangeKeepColor = (id: string, colorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepNotes(prev => prev.map(n => n.id === id ? { ...n, colorId } : n));
  };

  const handleOpenKeepEdit = (note: KeepNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColorId(note.colorId);
    setEditIsPinned(note.isPinned);
  };

  const handleSaveKeepEdit = () => {
    if (!editingNote) return;
    setKeepNotes(prev => prev.map(n => n.id === editingNote.id ? {
      ...n,
      title: editTitle.trim(),
      content: editContent.trim(),
      colorId: editColorId,
      isPinned: editIsPinned
    } : n));
    setEditingNote(null);
    toast.success('Nota atualizada!');
  };

  // Derive filtered notes lists
  const filteredNotes = useMemo(() => {
    return keepNotes.filter(n => {
      const term = searchTerm.toLowerCase();
      return n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term);
    });
  }, [keepNotes, searchTerm]);

  const pinnedNotes = useMemo(() => {
    return filteredNotes.filter(n => n.isPinned);
  }, [filteredNotes]);

  const otherNotes = useMemo(() => {
    return filteredNotes.filter(n => !n.isPinned);
  }, [filteredNotes]);
  
  // New task state for modal
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Geral');

  // Filter active tickets for execution
  const activeTickets = useMemo(() => {
    const activeStatuses: TicketStatus[] = ['PENDENTE_APROVACAO', 'APROVADO', 'EM_ROTA', 'AGUARDANDO_MATERIAL', 'REALIZANDO'];
    return tickets.filter(t => t.status && activeStatuses.includes(t.status))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tickets]);

  // Statistics calculations for today's tickets
  const todayTickets = useMemo(() => {
    const todayStr = new Date().toDateString();
    return tickets.filter(t => {
      if (!t.date) return false;
      return new Date(t.date).toDateString() === todayStr;
    });
  }, [tickets]);

  const todayCompleted = useMemo(() => {
    return todayTickets.filter(t => t.status === 'CONCLUIDO').length;
  }, [todayTickets]);

  const todayPending = useMemo(() => {
    return todayTickets.filter(t => t.status !== 'CONCLUIDO').length;
  }, [todayTickets]);

  const todayTotal = todayTickets.length;
  const completedPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  const hasTodayTickets = todayTotal > 0;
  
  const pieData = useMemo(() => {
    if (hasTodayTickets) {
      return [
        { name: 'Concluídas', value: todayCompleted, color: '#39FF14' },
        { name: 'Pendentes', value: todayPending, color: '#ef4444' }
      ];
    } else {
      const allCompleted = tickets.filter(t => t.status === 'CONCLUIDO').length;
      const allPending = tickets.filter(t => t.status !== 'CONCLUIDO').length;
      return [
        { name: 'Concluídas (Total)', value: allCompleted, color: '#39FF14' },
        { name: 'Pendentes (Total)', value: allPending, color: '#ef4444' }
      ];
    }
  }, [hasTodayTickets, todayCompleted, todayPending, tickets]);

  const displayedPercentage = useMemo(() => {
    if (hasTodayTickets) {
      return completedPercentage;
    }
    const allCompleted = tickets.filter(t => t.status === 'CONCLUIDO').length;
    const allTotal = tickets.length;
    return allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;
  }, [hasTodayTickets, completedPercentage, tickets]);

  const safePieData = useMemo(() => {
    const hasData = pieData.some(d => d.value > 0);
    if (!hasData) {
      return [
        { name: 'Sem Dados', value: 1, color: '#27272a' }
      ];
    }
    return pieData.filter(d => d.value > 0);
  }, [pieData]);

  const handleStartExecution = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsExecutionModalOpen(true);
    
    // Initialize checklist progress from ticket if available
    const initialProgress: { [taskId: string]: boolean } = {};
    ticket.checklistResults?.forEach(result => {
      initialProgress[result.taskId] = result.status === 'OK';
    });
    setChecklistProgress(initialProgress);
    
    // Update status to REALIZANDO if it wasn't already, setting start time
    if (ticket.status !== 'REALIZANDO') {
      updateTicket(ticket.id, { ...ticket, status: 'REALIZANDO', startedAt: new Date().toISOString() });
    } else if (!ticket.startedAt) {
      updateTicket(ticket.id, { ...ticket, startedAt: new Date().toISOString() });
    }
  };

  useEffect(() => {
    if (playId && tickets.length > 0) {
      const ticketToPlay = tickets.find(t => t.id === playId);
      if (ticketToPlay) {
        handleStartExecution(ticketToPlay);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('play');
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [playId, tickets]);

  const handleAddMaterial = (nameOrId: string) => {
    const material = supplyItems.find(i => i.id === nameOrId || i.name === nameOrId);
    
    setUsedMaterials(prev => {
      const existing = prev.find(m => (m.itemId && m.itemId === material?.id) || (m.name && m.name === nameOrId));
      if (existing) {
        return prev.map(m => ((m.itemId && m.itemId === material?.id) || (m.name && m.name === nameOrId)) ? { ...m, quantity: m.quantity + 1 } : m);
      }
      return [...prev, { itemId: material?.id, name: material?.name || nameOrId, quantity: 1 }];
    });
    setMaterialName('');
  };

  const handleRemoveMaterial = (nameOrId: string) => {
    setUsedMaterials(prev => {
      const existing = prev.find(m => (m.itemId && m.itemId === nameOrId) || (m.name && m.name === nameOrId));
      if (existing && existing.quantity > 1) {
        return prev.map(m => ((m.itemId && m.itemId === nameOrId) || (m.name && m.name === nameOrId)) ? { ...m, quantity: m.quantity - 1 } : m);
      }
      return prev.filter(m => !((m.itemId && m.itemId === nameOrId) || (m.name && m.name === nameOrId)));
    });
  };

  const handleAddExtraCost = () => {
    setExtraCosts(prev => [...prev, { description: '', value: 0, category: 'Operacional' }]);
  };

  const handleUpdateExtraCost = (index: number, field: 'description' | 'value' | 'category', value: string | number) => {
    setExtraCosts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const handleSaveExtraCostsToStore = () => {
    if (!selectedTicket) return;
    
    const validCosts = extraCosts.filter(c => c.value > 0 && c.description.trim());
    if (validCosts.length === 0) {
      toast.error('Preencha a descrição e valor para salvar.');
      return;
    }
    
    validCosts.forEach(c => {
      addCost({
        description: `Gasto Extra OS ${selectedTicket.osNumber}: ${c.description}`,
        value: c.value,
        date: new Date().toISOString(),
        category: c.category
      });
    });

    toast.success(`${validCosts.length} gastos registrados no financeiro.`);
    setExtraCosts([]); // Limpa a lista local após salvar para evitar duplicidade ao finalizar
  };

  const handleRemoveExtraCost = (index: number) => {
    setExtraCosts(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewTask = async () => {
    if (!selectedTicket || !newTaskName.trim()) return;

    const newItem = {
      task: newTaskName,
      category: newTaskCategory,
      clientIds: selectedTicket.clientId ? [selectedTicket.clientId] : []
    };

    const newId = await addChecklistItem(newItem);
    
    // Add to current execution progress
    setChecklistProgress(prev => ({ ...prev, [newId]: true }));
    
    // Update the selected ticket locally and in the store
    const updatedTicket = {
      ...selectedTicket,
      checklistResults: [
        ...(selectedTicket.checklistResults || []),
        { taskId: newId, status: 'OK' as const, notes: '' }
      ]
    };
    
    setSelectedTicket(updatedTicket);
    updateTicket(selectedTicket.id, updatedTicket);

    setNewTaskName('');
    setIsAddingTask(false);
    toast.success('Tarefa adicionada ao checklist!');
  };

  const handleImportClientChecklist = () => {
    if (!selectedTicket) return;
    
    const clientTasks = checklistItems.filter(item => {
      const itemClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
      return itemClientIds.includes(selectedTicket.clientId || '');
    });

    if (clientTasks.length === 0) {
      toast.error('Nenhuma tarefa cadastrada para este cliente.');
      return;
    }

    const newResults = clientTasks.map(task => ({
      taskId: task.id,
      status: 'OK' as const,
      notes: ''
    }));

    const newProgress: { [taskId: string]: boolean } = {};
    newResults.forEach(r => {
      newProgress[r.taskId] = false;
    });

    setChecklistProgress(prev => ({ ...prev, ...newProgress }));
    
    const updatedTicket = {
      ...selectedTicket,
      checklistResults: [...(selectedTicket.checklistResults || []), ...newResults]
    };
    
    setSelectedTicket(updatedTicket);
    updateTicket(selectedTicket.id, updatedTicket);

    toast.success(`${clientTasks.length} tarefas importadas do cliente.`);
  };

  const handleFinishProject = async () => {
    if (!selectedTicket) return;

    try {
      // 1. Calculate total value for receipt (income)
      const ticketValue = selectedTicket.budgetAmount || 0;
      
      // 2. Register Income
      addReceipt({
        clientId: selectedTicket.clientId || '',
        date: new Date().toISOString(),
        value: ticketValue,
        description: `Finalização OS ${selectedTicket.osNumber}: ${selectedTicket.title}`
      });

      // 3. Register Expenses (Materials + Extra Costs)
      let totalExpenses = 0;
      
      // Materials expenses
      usedMaterials.forEach(m => {
        const item = supplyItems.find(i => i.id === m.itemId || i.name === m.name);
        if (item) {
          const costValue = (item.lastPrice || 0) * m.quantity;
          totalExpenses += costValue;
          
          addCost({
            description: `Material OS ${selectedTicket.osNumber}: ${item.name} (x${m.quantity})`,
            value: costValue,
            date: new Date().toISOString(),
            category: 'Material'
          });

          // Update stock (subtract)
          updateStock(item.id, -m.quantity);
        } else if (m.name) {
          // Manual entry without linked item
          addCost({
            description: `Material Manual OS ${selectedTicket.osNumber}: ${m.name} (x${m.quantity})`,
            value: 0, // We don't have a price for manual entries yet
            date: new Date().toISOString(),
            category: 'Material'
          });
        }
      });

      // Extra costs expenses
      extraCosts.forEach(c => {
        if (c.value > 0) {
          totalExpenses += c.value;
          addCost({
            description: `Gasto Extra OS ${selectedTicket.osNumber}: ${c.description}`,
            value: c.value,
            date: new Date().toISOString(),
            category: c.category || 'Operacional'
          });
        }
      });

      // 4. Update Ticket Status
      updateTicket(selectedTicket.id, { 
        ...selectedTicket, 
        status: 'CONCLUIDO',
        serviceReport: `Projeto finalizado via Central de Execução.\nChecklist concluído.\nMateriais utilizados: ${usedMaterials.length}\nGastos extras: ${extraCosts.length}`,
        checklistResults: Object.entries(checklistProgress).map(([taskId, ok]) => ({
          taskId,
          status: ok ? 'OK' : 'NOK',
          notes: ''
        }))
      });

      toast.success('Projeto finalizado com sucesso! Financeiro atualizado.');
      setIsExecutionModalOpen(false);
      setSelectedTicket(null);
      setUsedMaterials([]);
      setExtraCosts([]);
      setChecklistProgress({});
    } catch (error) {
      console.error('Erro ao finalizar projeto:', error);
      toast.error('Erro ao processar finalização do projeto.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Central de Execução</h1>
          <p className="text-black/60 uppercase tracking-widest text-xs mt-2">Monitoramento e Execução em Tempo Real</p>
        </div>
        <div className="flex items-center gap-3 bg-black/10 px-4 py-2 rounded-2xl border border-black/20">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <span className="text-xs font-black text-black uppercase tracking-[0.2em]">Live Monitoring</span>
        </div>
      </div>

      {/* Top statistics panel with Circular Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics and Pie Chart Card */}
        <div className="lg:col-span-1 bg-zinc-950/90 border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Status de Hoje</span>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Desempenho Diário</h3>
            </div>
            
            <div className="flex items-center gap-4 py-3 mt-2">
              {/* Pie Chart Container */}
              <div className="w-20 h-20 relative shrink-0 flex items-center justify-center">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie
                      data={safePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={34}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {safePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px', color: '#fff', padding: '4px 8px' }}
                      itemStyle={{ color: '#fff', padding: 0 }}
                      labelStyle={{ display: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centered Percentage TEXT */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-white leading-none">{displayedPercentage}%</span>
                  <span className="text-[7.5px] font-bold text-white/40 uppercase tracking-tighter mt-0.5">OK</span>
                </div>
              </div>

              {/* Explanatory Counters */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#39FF14] shrink-0 shadow-[0_0_6px_rgba(57,255,20,0.4)]" />
                    <span className="text-[11px] font-semibold text-white/70 truncate">Concluídas</span>
                  </div>
                  <span className="text-[11px] font-black text-white shrink-0">{todayCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
                    <span className="text-[11px] font-semibold text-white/70 truncate">Pendentes</span>
                  </div>
                  <span className="text-[11px] font-black text-white shrink-0">{todayPending}</span>
                </div>
                <div className="pt-1.5 border-t border-white/15 flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-wider">
                  <span>Hoje Total</span>
                  <span>{todayTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Guidance & Quick Highlights */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/10 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          {/* Ambient shadow glow */}
          <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#39FF14]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between h-full gap-6 relative z-10 w-full mb-1">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="px-2 py-0.5 text-[8.5px] font-black uppercase text-black bg-[#39FF14] rounded-full shadow-[0_0_10px_rgba(57,255,20,0.2)]">PROD</span>
                  <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Rastreamento Automatizado</span>
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-white">Rastreamento de Tempo Ativo</h4>
                <p className="text-xs text-white/70 leading-relaxed max-w-xl">
                  Clique em <strong>DAR O PLAY</strong> para iniciar uma ordem de serviço. O sistema iniciará imediatamente o timer em tempo real para fins de monitoramento e auditoria operacional, atualizando suas métricas financeiras ao concluir o projeto.
                </p>
              </div>
            </div>
            
            {/* Live Metrics */}
            <div className="flex flex-col justify-center gap-3 shrink-0 md:border-l border-white/10 md:pl-6 min-w-[140px] h-full justify-self-center py-2">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#39FF14]">Total Ativas</span>
                <div className="text-xl font-black text-white mt-0.5">{activeTickets.length} O.S.</div>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Em Execução</span>
                <div className="text-xl font-black text-rose-400 flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span>{activeTickets.filter(t => t.status === 'REALIZANDO').length} O.S.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Active execution cards section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeTickets.length > 0 ? (
            activeTickets.map((ticket) => {
              const client = clients.find(c => c.id === ticket.clientId);
              const isRealizando = ticket.status === 'REALIZANDO';
              return (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={!isRealizando ? {
                    scale: 1.025,
                    transition: { duration: 0.25, ease: "easeOut" }
                  } : {}}
                  className={`group relative rounded-3xl transition-all duration-300 ${
                    !isRealizando 
                      ? 'hover:shadow-[0_0_20px_rgba(57,255,20,0.18)]' 
                      : 'shadow-[0_0_30px_rgba(57,255,20,0.08)]'
                  }`}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-black/50 to-zinc-500/50 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  
                  <div className={`relative bg-zinc-900/85 backdrop-blur-xl border rounded-3xl p-6 flex flex-col h-full transition-all duration-300 overflow-hidden ${
                    isRealizando 
                      ? 'border-[#39FF14]/50' 
                      : 'border-white/10 group-hover:border-[#39FF14]/40'
                  }`}>
                    {/* Pulsating play indicators on hover for pending tickets */}
                    {!isRealizando && (
                      <div className="absolute inset-0 rounded-3xl border border-[#39FF14]/0 group-hover:border-[#39FF14]/30 group-hover:animate-pulse pointer-events-none transition-all duration-300" />
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{ticket.osNumber}</span>
                        <h3 className="text-lg font-bold text-white leading-tight truncate">{ticket.title || 'Sem Título'}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                        <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          isRealizando ? 'bg-[#39FF14] text-zinc-950 ring-4 ring-[#39FF14]/20 animate-pulse' : 'bg-white/10 text-white/60'
                        }`}>
                          {ticket.status}
                        </div>
                        {isRealizando && <ExecutionTimer startedAt={ticket.startedAt} />}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-3 text-white/70">
                        <MapPin className="w-4 h-4 text-white/50 shrink-0" />
                        <span className="text-xs font-semibold truncate">{client?.name || 'Cliente não encontrado'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/70">
                        <Clock className="w-4 h-4 text-white/50 shrink-0" />
                        <span className="text-xs font-semibold">{new Date(ticket.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartExecution(ticket)}
                      className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2.5 shadow-lg ${
                        isRealizando 
                          ? 'bg-[#39FF14]/15 hover:bg-[#39FF14]/25 text-[#39FF14] border border-[#39FF14]/30' 
                          : 'bg-zinc-950 hover:bg-zinc-850 hover:border-[#39FF14]/30 text-white border border-white/5 shadow-black/40'
                      }`}
                    >
                      <Play size={15} fill="currentColor" className={isRealizando ? "text-[#39FF14]" : "text-white"} />
                      {isRealizando ? 'RETOMAR PLAY' : 'DAR O PLAY'}
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/40 border-2 border-dashed border-white/5 rounded-3xl">
              <Clock size={48} className="mb-4 opacity-20" />
              <p className="uppercase tracking-widest text-sm font-bold text-center">Nenhuma O.S. ativa para execução</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Google Keep Notes Section */}
      <div id="execution-keep-notes-section" className="bg-zinc-950/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 mt-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#39FF14]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#39FF14]/10 rounded-2xl border border-[#39FF14]/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39FF14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sticky-note"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v5h5"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                Bloco de Notas Operacionais
                <span className="text-[9px] font-black text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-0.5 rounded-full tracking-widest animate-pulse">KEEP STANDARD</span>
              </h2>
              <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Notas rápidas, lembretes e planos de turno</p>
            </div>
          </div>

          {/* Search container */}
          <div className="relative max-w-sm w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar notas..."
              className="w-full bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#39FF14]/40 focus:ring-1 focus:ring-[#39FF14]/20 transition-all font-semibold"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="w-4 h-4 text-white/40 hover:text-white absolute right-3.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Create Note Box like Google Keep */}
        <div className="max-w-xl mx-auto relative z-20">
          <div className={`bg-zinc-900/90 border border-white/10 rounded-2xl transition-all duration-300 shadow-xl overflow-hidden focus-within:border-[#39FF14]/40 focus-within:shadow-[0_0_15px_rgba(57,255,20,0.1)]`}>
            {!isExpanding ? (
              <div 
                onClick={() => setIsExpanding(true)}
                className="px-5 py-3.5 flex items-center justify-between cursor-text text-white/40 hover:text-white/60 select-none transition-all"
              >
                <span className="text-sm font-semibold tracking-wide">Criar uma nota...</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanding(true); setNewIsPinned(true); }}
                    className="p-1 px-2 text-white/40 hover:text-[#39FF14] hover:bg-white/5 rounded-lg transition-all"
                    title="Fixar imediatamente"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanding(true); }}
                    className="p-1 px-2 text-white/40 hover:text-[#39FF14] hover:bg-white/5 rounded-lg transition-all"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3 relative">
                {/* Expand header buttons (Pin) */}
                <div className="flex items-center justify-between gap-2">
                  <input 
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Título"
                    className="w-full bg-transparent font-bold text-white text-base outline-none placeholder-white/30 border-none p-0 focus:ring-0"
                    autoFocus
                  />
                  <button 
                    onClick={() => setNewIsPinned(!newIsPinned)}
                    className={`p-1.5 rounded-lg transition-all outline-none ${
                      newIsPinned 
                        ? 'text-[#39FF14] bg-[#39FF14]/15 border border-[#39FF14]/30' 
                        : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                    title={newIsPinned ? "Desafixar nota" : "Fixar nota"}
                  >
                    <Pin className="w-4 h-4" fill={newIsPinned ? "currentColor" : "none"} />
                  </button>
                </div>

                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Nota..."
                  rows={3}
                  className="w-full bg-transparent text-sm text-white/80 outline-none placeholder-white/30 resize-none border-none p-0 focus:ring-0"
                />

                {/* Footer Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                  {/* Color chooser circles */}
                  <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                    {keepColors.map((color) => (
                      <button 
                        key={color.id}
                        onClick={() => setNewColorId(color.id)}
                        className={`w-4 h-4 rounded-full transition-all border shrink-0 relative ${color.dot} ${
                          newColorId === color.id 
                            ? 'scale-125 border-white ring-1 ring-white/40' 
                            : 'border-black/40 hover:scale-110'
                        }`}
                        title={color.name}
                      >
                        {newColorId === color.id && (
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-black">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setNewTitle('');
                        setNewContent('');
                        setNewColorId('default');
                        setNewIsPinned(false);
                        setIsExpanding(false);
                      }}
                      className="px-3 py-1.5 text-xs font-black uppercase text-white/40 hover:text-white tracking-widest rounded-lg transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveNote}
                      className="px-4 py-1.5 bg-white text-black hover:bg-[#39FF14] hover:text-black hover:shadow-[0_0_12px_rgba(57,255,20,0.3)] transition-all font-black text-xs uppercase tracking-widest rounded-xl"
                    >
                      Criar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes Grid divided by Pinned / Others */}
        <div className="space-y-8">
          {/* Pinned section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.2em] block pl-1">Fixadas ({pinnedNotes.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {pinnedNotes.map((note) => {
                    const colorData = keepColors.find(c => c.id === note.colorId) || keepColors[0];
                    return (
                      <motion.div
                        key={note.id}
                        layoutId={`note-${note.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        onClick={() => handleOpenKeepEdit(note)}
                        className={`group relative rounded-2xl p-5 border shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer min-h-[160px] ${colorData.bg}`}
                      >
                        {/* Top-border Accent line depending on Keep Color */}
                        <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-b-full ${colorData.accentLine}`} />

                        {/* Top controls (Pin) */}
                        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                          <button 
                            onClick={(e) => handleToggleKeepPin(note.id, e)}
                            className="p-1 bg-black/40 hover:bg-black/60 rounded-lg text-[#39FF14] transition-all border border-white/5"
                            title="Desafixar nota"
                          >
                            <Pin className="w-3.5 h-3.5" fill="currentColor" />
                          </button>
                        </div>

                        {/* Note Body */}
                        <div className="space-y-2 mb-4">
                          {note.title && <h4 className="font-bold text-white text-sm tracking-tight leading-tight pr-6">{note.title}</h4>}
                          <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed font-medium break-words overflow-hidden text-ellipsis line-clamp-6">{note.content}</p>
                        </div>

                        {/* Note Actions/Footer on hover */}
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center justify-between pt-3 border-t border-white/5 transition-all w-full mt-auto">
                          {/* Inner color spot options */}
                          <div className="flex gap-1 overflow-x-hidden max-w-[100px] hover:max-w-none transition-all">
                            {keepColors.slice(0, 5).map((color) => (
                              <button 
                                key={color.id}
                                onClick={(e) => handleChangeKeepColor(note.id, color.id, e)}
                                className={`w-2.5 h-2.5 rounded-full border border-black/30 hover:scale-125 transition-all ${color.dot} ${
                                  note.colorId === color.id ? 'scale-125 ring-1 ring-white/40 border-white' : ''
                                }`}
                                title={color.name}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenKeepEdit(note); }}
                              className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-all"
                              title="Editar nota"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteKeepNote(note.id, e)}
                              className="p-1 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all"
                              title="Excluir nota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Others section */}
          <div className="space-y-3">
            {pinnedNotes.length > 0 && <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block pl-1">Outras Notas</span>}
            {otherNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {otherNotes.map((note) => {
                    const colorData = keepColors.find(c => c.id === note.colorId) || keepColors[0];
                    return (
                      <motion.div
                        key={note.id}
                        layoutId={`note-${note.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        onClick={() => handleOpenKeepEdit(note)}
                        className={`group relative rounded-2xl p-5 border shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer min-h-[160px] ${colorData.bg}`}
                      >
                        {/* Top-border Accent line depending on Keep Color */}
                        <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-b-full ${colorData.accentLine}`} />

                        {/* Top controls (Pin) */}
                        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                          <button 
                            onClick={(e) => handleToggleKeepPin(note.id, e)}
                            className="p-1 bg-black/40 hover:bg-black/60 rounded-lg text-white/40 hover:text-[#39FF14] transition-all border border-white/5"
                            title="Fixar nota"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Note Body */}
                        <div className="space-y-2 mb-4">
                          {note.title && <h4 className="font-bold text-white text-sm tracking-tight leading-tight pr-6">{note.title}</h4>}
                          <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed font-medium break-words overflow-hidden text-ellipsis line-clamp-6">{note.content}</p>
                        </div>

                        {/* Note Actions/Footer on hover */}
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center justify-between pt-3 border-t border-white/5 transition-all w-full mt-auto">
                          {/* Inner color spot options */}
                          <div className="flex gap-1 overflow-x-hidden max-w-[100px] hover:max-w-none transition-all">
                            {keepColors.slice(0, 5).map((color) => (
                              <button 
                                key={color.id}
                                onClick={(e) => handleChangeKeepColor(note.id, color.id, e)}
                                className={`w-2.5 h-2.5 rounded-full border border-black/30 hover:scale-125 transition-all ${color.dot} ${
                                  note.colorId === color.id ? 'scale-125 ring-1 ring-white/40 border-white' : ''
                                }`}
                                title={color.name}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenKeepEdit(note); }}
                              className="p-1 text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-all"
                              title="Editar nota"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteKeepNote(note.id, e)}
                              className="p-1 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all"
                              title="Excluir nota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/2 flex flex-col items-center justify-center">
                <span className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Nenhuma nota encontrada</span>
                <span className="text-[10px] text-white/30 italic">Seja o primeiro a adcionar!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Keep Editor Modal */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Overlay background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSaveKeepEdit}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Main edit card dialog */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-w-lg rounded-2xl p-6 border shadow-2xl flex flex-col ${
                keepColors.find(c => c.id === editColorId)?.bg || keepColors[0].bg
              }`}
            >
              {/* Pin button */}
              <button 
                onClick={() => setEditIsPinned(!editIsPinned)}
                className={`absolute top-6 right-6 p-1.5 rounded-lg transition-all ${
                  editIsPinned 
                    ? 'text-[#39FF14] bg-[#39FF14]/15 border border-[#39FF14]/30' 
                    : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title={editIsPinned ? "Desafixar nota" : "Fixar nota"}
              >
                <Pin className="w-4 h-4" fill={editIsPinned ? "currentColor" : "none"} />
              </button>

              <div className="space-y-4">
                <div className="space-y-1 pr-10">
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-wider">Título da Nota</span>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black/20 focus:bg-black/40 border border-white/5 focus:border-[#39FF14]/30 text-white font-bold text-lg rounded-xl px-3 py-2 outline-none transition-all"
                    placeholder="Título"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-wider">Conteúdo da Nota</span>
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/20 focus:bg-black/40 border border-white/5 focus:border-[#39FF14]/30 text-white text-sm rounded-xl px-3 py-2 outline-none resize-none transition-all"
                    placeholder="Nota..."
                    rows={6}
                  />
                </div>
              </div>

              {/* Toolbar in editor modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/5 mt-5">
                {/* Color choice bar */}
                <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1.5 rounded-full border border-white/10">
                  {keepColors.map((color) => (
                    <button 
                      key={color.id}
                      onClick={() => setEditColorId(color.id)}
                      className={`w-4 h-4 rounded-full transition-all border shrink-0 relative ${color.dot} ${
                        editColorId === color.id 
                          ? 'scale-125 border-white ring-1 ring-white/40' 
                          : 'border-black/40 hover:scale-110'
                      }`}
                      title={color.name}
                    >
                      {editColorId === color.id && (
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-black">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Footer Edit Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingNote(null);
                    }}
                    className="px-4 py-2 text-xs font-black uppercase text-white/40 hover:text-white rounded-xl transition-all"
                  >
                    Excluir Alterações
                  </button>
                  <button 
                    onClick={handleSaveKeepEdit}
                    className="px-5 py-2 bg-white text-black hover:bg-[#39FF14] hover:shadow-[0_0_12px_rgba(57,255,20,0.3)] transition-all font-black text-xs uppercase tracking-widest rounded-xl"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Execution Modal */}
      <Modal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        title={`Execução: ${selectedTicket?.osNumber}`}
        maxWidth="4xl"
        glass={true}
      >
        <div className="space-y-8 p-2">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 p-5 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl hover:bg-white/15 transition-all">
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1 opacity-70">Cliente</p>
              <p className="text-base font-bold text-white tracking-tight leading-tight">{clients.find(c => c.id === selectedTicket?.clientId)?.name}</p>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl hover:bg-white/15 transition-all">
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1 opacity-70">Localização</p>
              <p className="text-base font-bold text-white truncate tracking-tight leading-tight">{clients.find(c => c.id === selectedTicket?.clientId)?.address}</p>
            </div>
            <div className="bg-white/10 p-5 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl hover:bg-white/15 transition-all">
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1 opacity-70">Tipo</p>
              <p className="text-base font-bold text-white tracking-tight leading-tight">{selectedTicket?.type}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Checklist */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/20 rounded-xl border border-black/10">
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Checklist de Passos</h3>
                </div>
                <button 
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="p-2 bg-black/20 hover:bg-black/30 text-black rounded-xl transition-all shadow-lg border border-black/10"
                >
                  <Plus size={20} />
                </button>
              </div>

              <AnimatePresence>
                {isAddingTask && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 mb-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nome da Tarefa</label>
                          <input 
                            type="text"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-white/50 transition-all"
                            placeholder="Ex: Verificar pressão"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Categoria</label>
                          <input 
                            type="text"
                            value={newTaskCategory}
                            onChange={(e) => setNewTaskCategory(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-white/50 transition-all"
                            placeholder="Ex: Hidráulica"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setIsAddingTask(false)}
                          className="px-4 py-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleAddNewTask}
                          className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 border border-white/10"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-3">
                {selectedTicket?.checklistResults?.map((item, idx) => (
                  <label 
                    key={item.taskId}
                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer shadow-lg ${
                      checklistProgress[item.taskId] 
                        ? 'bg-black/40 border-black text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]' 
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      className="hidden"
                      checked={checklistProgress[item.taskId] || false}
                      onChange={(e) => setChecklistProgress(prev => ({ ...prev, [item.taskId]: e.target.checked }))}
                    />
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                      checklistProgress[item.taskId] ? 'bg-black border-black shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'border-white/30'
                    }`}>
                      {checklistProgress[item.taskId] && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-base font-bold tracking-tight">
                      {idx + 1}. {checklistItems.find(ci => ci.id === item.taskId)?.task || item.taskId}
                    </span>
                  </label>
                ))}
                {(!selectedTicket?.checklistResults || selectedTicket.checklistResults.length === 0) && (
                  <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center gap-4">
                    <p className="italic text-white/40 text-sm">Nenhum checklist definido para esta O.S.</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsAddingTask(true)}
                        className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
                      >
                        Nova Tarefa
                      </button>
                      <button 
                        onClick={handleImportClientChecklist}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Importar do Cliente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Materials & Extra Costs */}
            <div className="space-y-8">
              {/* Materials */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Materiais Usados</h3>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl border border-white/20 overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-white/10 bg-black/20 flex gap-2">
                    <input 
                      list="execution-materials-list"
                      className="flex-1 bg-zinc-900 border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Adicionar Material..."
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && materialName && handleAddMaterial(materialName)}
                    />
                    <datalist id="execution-materials-list">
                      {supplyItems.map(i => (
                        <option key={i.id} value={i.name} />
                      ))}
                    </datalist>
                    <button 
                      onClick={() => materialName && handleAddMaterial(materialName)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                    {usedMaterials.map((m, idx) => {
                      const item = supplyItems.find(i => i.id === m.itemId || i.name === m.name);
                      const displayName = m.name || item?.name || 'Material';
                      const identifier = m.itemId || m.name || '';
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{displayName}</span>
                            <span className="text-[10px] text-white/40">{item ? `${item.currentStock} em estoque` : 'Entrada manual'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleRemoveMaterial(identifier)} className="p-1 hover:bg-white/10 rounded-lg text-white/40"><Minus size={14} /></button>
                            <span className="text-sm font-black text-white w-6 text-center">{m.quantity}</span>
                            <button onClick={() => handleAddMaterial(identifier)} className="p-1 hover:bg-white/10 rounded-lg text-blue-400"><Plus size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {usedMaterials.length === 0 && (
                      <p className="text-center py-4 text-xs text-white/40 italic">Nenhum material adicionado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra Costs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Gastos Extras</h3>
                  </div>
                  <button 
                    onClick={handleAddExtraCost}
                    className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl transition-all shadow-lg"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {extraCosts.map((cost, idx) => (
                    <div key={idx} className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/10 group animate-in slide-in-from-top-1">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Descrição do gasto (ex: Almoço, Combustível)"
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-all font-bold"
                          value={cost.description}
                          onChange={(e) => handleUpdateExtraCost(idx, 'description', e.target.value)}
                        />
                        <button 
                          onClick={() => handleRemoveExtraCost(idx)}
                          className="p-2 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                          value={cost.category}
                          onChange={(e) => handleUpdateExtraCost(idx, 'category', e.target.value)}
                        >
                          {costCategories.map(cat => (
                            <option key={cat} value={cat} className="bg-[#1a1a1a]">{cat}</option>
                          ))}
                        </select>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">R$</span>
                          <input 
                            type="number"
                            placeholder="0,00"
                            className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 font-black text-amber-400"
                            value={cost.value || ''}
                            onChange={(e) => handleUpdateExtraCost(idx, 'value', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {extraCosts.length > 0 && (
                    <button 
                      onClick={handleSaveExtraCostsToStore}
                      className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] border border-amber-500/20 transition-all active:scale-95 shadow-lg shadow-amber-500/5 mb-4"
                    >
                      Salvar Gastos no Financeiro
                    </button>
                  )}

                  {extraCosts.length === 0 && (
                    <p className="text-center py-4 text-xs text-white/40 italic bg-white/5 rounded-2xl border border-white/10">Nenhum gasto extra registrado</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 text-white/40">
              <Info size={16} className="text-white" />
              <p className="text-xs">Ao finalizar, os valores serão registrados automaticamente no financeiro.</p>
            </div>
            <button
              onClick={handleFinishProject}
              className="w-full md:w-auto px-12 py-4 bg-black text-white font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-black/30"
            >
              FINALIZAR PROJETO
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
