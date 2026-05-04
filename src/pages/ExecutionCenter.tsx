import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Ticket, TicketStatus, SupplyItem } from '../types';
import { 
  Play, CheckCircle2, Clock, MapPin, 
  ChevronRight, Package, DollarSign, 
  Plus, Minus, X, AlertTriangle,
  ArrowRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Modal } from '../components/Modal';

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

  const handleStartExecution = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsExecutionModalOpen(true);
    
    // Initialize checklist progress from ticket if available
    const initialProgress: { [taskId: string]: boolean } = {};
    ticket.checklistResults?.forEach(result => {
      initialProgress[result.taskId] = result.status === 'OK';
    });
    setChecklistProgress(initialProgress);
    
    // Update status to REALIZANDO if it wasn't already
    if (ticket.status !== 'REALIZANDO') {
      updateTicket(ticket.id, { ...ticket, status: 'REALIZANDO' });
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {activeTickets.length > 0 ? (
            activeTickets.map((ticket) => {
              const client = clients.find(c => c.id === ticket.clientId);
              return (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-black/50 to-zinc-500/50 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">{ticket.osNumber}</span>
                        <h3 className="text-xl font-bold text-white leading-tight">{ticket.title || 'Sem Título'}</h3>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        ticket.status === 'REALIZANDO' ? 'bg-black text-white animate-pulse' : 'bg-white/10 text-white/60'
                      }`}>
                        {ticket.status}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-3 text-white/70">
                        <MapPin className="w-4 h-4 text-white/60" />
                        <span className="text-xs font-medium truncate">{client?.name || 'Cliente não encontrado'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/70">
                        <Clock className="w-4 h-4 text-white/60" />
                        <span className="text-xs font-medium">{new Date(ticket.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartExecution(ticket)}
                      className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-black/20"
                    >
                      <Play size={20} fill="currentColor" />
                      DAR O PLAY
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/40 border-2 border-dashed border-white/5 rounded-3xl">
              <Clock size={48} className="mb-4 opacity-20" />
              <p className="uppercase tracking-widest text-sm font-bold">Nenhuma O.S. ativa para execução</p>
            </div>
          )}
        </AnimatePresence>
      </div>

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
