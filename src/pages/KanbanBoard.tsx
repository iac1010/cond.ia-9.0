import React, { useState } from 'react';
import { useStore } from '../store';
import { TicketStatus, Ticket } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Wrench, CheckCircle, AlertCircle, Calendar, User, Edit, Plus, MoreVertical, ExternalLink, X, Trash2 } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFormatDate } from '../utils/dateUtils';

const COLUMNS: { id: TicketStatus; title: string; icon: any; color: string; glowColor: string }[] = [
  { id: 'APROVADO', title: 'Aprovado', icon: CheckCircle, color: 'text-blue-400', glowColor: 'shadow-blue-500/20' },
  { id: 'AGUARDANDO_MATERIAL', title: 'Aguardando Material', icon: AlertCircle, color: 'text-amber-400', glowColor: 'shadow-amber-500/20' },
  { id: 'REALIZANDO', title: 'Realizando', icon: Wrench, color: 'text-purple-400', glowColor: 'shadow-purple-500/20' },
  { id: 'CONCLUIDO', title: 'Concluído', icon: CheckCircle, color: 'text-emerald-400', glowColor: 'shadow-emerald-500/20' },
];

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { tickets, clients, updateTicket, addTicket, deleteTicket } = useStore();
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDate, setQuickTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickTaskTechnician, setQuickTaskTechnician] = useState('Administrador');

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticketId);
    
    // Create a ghost image or handle opacity
    setTimeout(() => {
      const el = document.getElementById(`ticket-${ticketId}`);
      if (el) el.classList.add('opacity-40', 'scale-95');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicketId(null);
    const el = document.getElementById(`ticket-${ticketId}`);
    if (el) el.classList.remove('opacity-40', 'scale-95');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    if (!draggedTicketId) return;

    const ticket = tickets.find(t => t.id === draggedTicketId);
    if (ticket && (ticket.status || 'APROVADO') !== status) {
      updateTicket(ticket.id, { ...ticket, status });
    }
    setDraggedTicketId(null);
  };

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    addTicket({
      title: quickTaskTitle,
      type: 'TAREFA',
      status: 'APROVADO',
      date: quickTaskDate,
      technician: quickTaskTechnician,
      observations: 'Tarefa rápida criada via Kanban',
    });

    setQuickTaskTitle('');
    setQuickTaskDate(new Date().toISOString().split('T')[0]);
    setQuickTaskTechnician('Administrador');
    setIsQuickTaskModalOpen(false);
  };

  const handleDeleteTicket = async () => {
    if (ticketToDelete) {
      await deleteTicket(ticketToDelete);
      setTicketToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative flex flex-col">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="currentColor" className="text-white/5" fillOpacity="0.5" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="currentColor" className="text-white/10" fillOpacity="0.5" />
        </svg>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 shrink-0">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">Kanban</h1>
            <p className="text-xl text-white/80 mt-2 font-medium tracking-wide">Arraste os cards para atualizar o status</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsQuickTaskModalOpen(true)}
            className="bg-white text-[#004a7c] px-8 py-5 flex items-center gap-3 transition-all rounded-2xl shadow-2xl font-bold tracking-widest uppercase text-sm"
          >
            <Plus className="w-6 h-6" />
            Nova Tarefa
          </motion.button>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link 
              to="/tickets/new"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-5 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all rounded-2xl shadow-2xl font-bold tracking-widest uppercase text-sm"
            >
              <ExternalLink className="w-6 h-6" />
              Nova OS
            </Link>
          </motion.div>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-x-auto pb-8 snap-x relative z-10 custom-scrollbar">
        {COLUMNS.map((column, colIndex) => {
          const columnTickets = tickets.filter(t => (t.status || 'APROVADO') === column.id);
          const Icon = column.icon;

          return (
            <motion.div 
              key={column.id}
              id={`column-${column.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.1 }}
              className="flex-1 min-w-[350px] max-w-[450px] flex flex-col rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-md snap-center shadow-2xl overflow-hidden group/column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10 bg-white/5">
                <div className={`flex items-center gap-3 font-black text-lg tracking-tight ${column.color.replace('text-', 'text-')}`}>
                  <div className={`p-2 rounded-lg bg-white/10 border border-white/10 ${column.glowColor} shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="brightness-125">{column.title}</span>
                </div>
                <span className="px-4 py-1 rounded-full text-sm font-black bg-white/10 border border-white/10 text-white">
                  {columnTickets.length}
                </span>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar min-h-[200px]">
                <AnimatePresence mode="popLayout">
                  {columnTickets.map(ticket => {
                    const client = clients.find(c => c.id === ticket.clientId);
                    return (
                      <motion.div
                        layout
                        key={ticket.id}
                        id={`ticket-${ticket.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, ticket.id)}
                        onDragEnd={(e: any) => handleDragEnd(e, ticket.id)}
                        className="bg-slate-800/80 hover:bg-slate-700/80 p-6 rounded-2xl border border-white/10 cursor-grab active:cursor-grabbing transition-all group relative shadow-xl backdrop-blur-md hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:border-white/20"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {ticket.osNumber && (
                              <span className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                                {ticket.osNumber}
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                              ticket.type === 'TAREFA' 
                                ? 'bg-amber-500/30 text-amber-100 border-amber-500/30' 
                                : 'bg-white/20 text-white border-white/20'
                            }`}>
                              {ticket.type}
                            </span>
                            {ticket.maintenanceCategory && (
                              <span className="bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 truncate max-w-[150px]" title={ticket.maintenanceCategory}>
                                {ticket.maintenanceCategory}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link 
                              to={`/tickets/${ticket.id}/edit`}
                              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTicketToDelete(ticket.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-black text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">
                          {ticket.title || (ticket.type === 'TAREFA' ? 'Tarefa' : client?.name || 'Sem Título')}
                        </h3>
                        {ticket.title && client?.name && (
                          <p className="text-sm text-white/70 font-bold mb-4">{client.name}</p>
                        )}
                        
                        <div className="space-y-3 mt-6 pt-6 border-t border-white/10">
                          <div className="flex items-center gap-3 text-sm text-white/80 font-bold">
                            <Calendar className="w-4 h-4 shrink-0 text-blue-400" />
                            {safeFormatDate(ticket.date, { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-white/80 font-bold">
                            <User className="w-4 h-4 shrink-0 text-purple-400" />
                            <span className="truncate">{ticket.technician}</span>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                          <Link 
                            to={`/tickets/${ticket.id}`}
                            className="flex items-center gap-2 text-sm font-black text-white/80 hover:text-white transition-colors group/link"
                          >
                            <span>Ver Detalhes</span>
                            <ExternalLink className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {columnTickets.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-40 flex flex-col items-center justify-center text-white/60 border-2 border-dashed border-white/20 rounded-3xl p-8 text-center"
                  >
                    <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm font-black uppercase tracking-widest">Vazio</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Task Modal */}
      <AnimatePresence>
        {isQuickTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Nova Tarefa Rápida</h3>
                <button 
                  onClick={() => setIsQuickTaskModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateQuickTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">O que precisa ser feito?</label>
                  <textarea 
                    autoFocus
                    required
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all min-h-[100px] resize-none"
                    placeholder="Ex: Comprar conectores, Reunião com Paulo..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Data</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="date"
                        required
                        value={quickTaskDate}
                        onChange={(e) => setQuickTaskDate(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#004a7c] transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Responsável</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        value={quickTaskTechnician}
                        onChange={(e) => setQuickTaskTechnician(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all"
                        placeholder="Nome"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsQuickTaskModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#004a7c] text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Criar Tarefa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTicket}
        title="Excluir Tarefa/OS"
        message="Tem certeza que deseja excluir esta tarefa ou ordem de serviço? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
