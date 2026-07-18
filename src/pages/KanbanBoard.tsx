import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { TicketStatus, Ticket } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Wrench, CheckCircle, AlertCircle, Calendar, User, Edit, Plus, MoreVertical, ExternalLink, X, Trash2, Settings, ZoomIn, ZoomOut, HelpCircle, Palette, Upload, Image as ImageIcon, Check, RotateCcw, FileImage, Paintbrush, DollarSign, Search } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFormatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface KanbanColumn {
  id: string;
  title: string;
  iconName: string;
  color: string;
  glowColor: string;
}

const ICON_MAP: { [key: string]: any } = {
  CheckCircle,
  AlertCircle,
  Wrench,
  Clock,
  Calendar,
  User,
  Settings
};

const COLOR_OPTIONS = [
  { name: 'Azul', text: 'text-blue-400', glow: 'shadow-blue-500/20', bg: 'bg-blue-400' },
  { name: 'Âmbar/Laranja', text: 'text-amber-400', glow: 'shadow-amber-500/20', bg: 'bg-amber-400' },
  { name: 'Roxo', text: 'text-purple-400', glow: 'shadow-purple-500/20', bg: 'bg-purple-400' },
  { name: 'Verde', text: 'text-[#39FF14]', glow: 'shadow-[rgba(57,255,20,0.2)]', bg: 'bg-[#39FF14]' },
  { name: 'Ciano', text: 'text-cyan-400', glow: 'shadow-cyan-500/20', bg: 'bg-cyan-400' },
  { name: 'Rosa', text: 'text-pink-400', glow: 'shadow-pink-500/20', bg: 'bg-pink-400' },
  { name: 'Vermelho', text: 'text-red-400', glow: 'shadow-red-500/20', bg: 'bg-red-400' },
  { name: 'Branco', text: 'text-white', glow: 'shadow-white/20', bg: 'bg-white' },
];

const ICON_OPTIONS = [
  { name: 'Sucesso', value: 'CheckCircle' },
  { name: 'Alerta', value: 'AlertCircle' },
  { name: 'Chave', value: 'Wrench' },
  { name: 'Relógio', value: 'Clock' },
  { name: 'Calendário', value: 'Calendar' },
  { name: 'Usuário', value: 'User' },
];

const BG_SOLID_COLORS = [
  { id: 'ocean_trello', name: 'Azul Trello', value: 'bg-[#0079bf]' },
  { id: 'ocean', name: 'Azul Oceano', value: 'bg-[#004a7c]' },
  { id: 'green', name: 'Verde Trello', value: 'bg-[#519839]' },
  { id: 'orange', name: 'Laranja Trello', value: 'bg-[#d29034]' },
  { id: 'red', name: 'Vermelho Trello', value: 'bg-[#b04632]' },
  { id: 'purple', name: 'Roxo Trello', value: 'bg-[#89609e]' },
  { id: 'pink', name: 'Rosa Trello', value: 'bg-[#cd5a91]' },
  { id: 'slate', name: 'Slate Profundo', value: 'bg-slate-900' },
  { id: 'zinc', name: 'Preto Carbono', value: 'bg-zinc-950' },
];

const BG_GRADIENTS = [
  { id: 'grad_aurora', name: 'Aurora Ciano', value: 'bg-gradient-to-tr from-teal-950 via-emerald-900 to-cyan-900' },
  { id: 'grad_sunset', name: 'Sunset Glow', value: 'bg-gradient-to-tr from-orange-600 to-rose-600' },
  { id: 'grad_cosmic', name: 'Espaço Cósmico', value: 'bg-gradient-to-tr from-slate-900 via-purple-950 to-zinc-950' },
  { id: 'grad_electric', name: 'Azul Elétrico', value: 'bg-gradient-to-tr from-blue-900 via-indigo-950 to-slate-950' },
  { id: 'grad_twilight', name: 'Vinho do Crepúsculo', value: 'bg-gradient-to-tr from-rose-950 via-pink-900 to-violet-950' },
];

const BG_PHOTOS = [
  { id: 'photo_mountain', name: 'Montanhas', value: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
  { id: 'photo_forest', name: 'Floresta', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80' },
  { id: 'photo_ocean', name: 'Oceano', value: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=80' },
  { id: 'photo_desert', name: 'Saara', value: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80' },
  { id: 'photo_stars', name: 'Estrelas', value: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80' },
  { id: 'photo_aurora', name: 'Aurora', value: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80' },
  { id: 'photo_city', name: 'Metrópole', value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80' },
  { id: 'photo_lake', name: 'Lago Alpino', value: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80' },
];

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { tickets, clients, updateTicket, addTicket, deleteTicket, kanbanColumnNames, setKanbanColumnNames } = useStore();
  const [zoom, setZoom] = useState<'sm' | 'md' | 'lg'>('sm');
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [bgType, setBgType] = useState<'color' | 'image'>(() => {
    const savedType = localStorage.getItem('kanban_bg_type');
    if (savedType === 'color' || savedType === 'image') return savedType;
    const oldBg = localStorage.getItem('kanban_bg_color_class') || '';
    if (oldBg.startsWith('http') || oldBg.startsWith('data:image')) return 'image';
    return 'color';
  });

  const [bgValue, setBgValue] = useState<string>(() => {
    return localStorage.getItem('kanban_bg_value') || localStorage.getItem('kanban_bg_color_class') || 'bg-[#004a7c]';
  });

  const [isBgPanelOpen, setIsBgPanelOpen] = useState(false);
  
  // Colunas Dinâmicas
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    const saved = localStorage.getItem('kanban_columns_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'APROVADO', title: 'Aprovado', iconName: 'CheckCircle', color: 'text-blue-400', glowColor: 'shadow-blue-500/20' },
      { id: 'AGUARDANDO_MATERIAL', title: 'Aguardando Material', iconName: 'AlertCircle', color: 'text-amber-400', glowColor: 'shadow-amber-500/20' },
      { id: 'REALIZANDO', title: 'Realizando', iconName: 'Wrench', color: 'text-purple-400', glowColor: 'shadow-purple-500/20' },
      { id: 'CONCLUIDO', title: 'Concluído', iconName: 'CheckCircle', color: 'text-white', glowColor: 'shadow-white/20' },
    ];
  });

  // Salvar no localStorage sempre que as colunas mudarem
  useEffect(() => {
    localStorage.setItem('kanban_columns_list', JSON.stringify(columns));
  }, [columns]);

  // Escutar atualizações externas de backup
  useEffect(() => {
    const handleUpdated = () => {
      const saved = localStorage.getItem('kanban_columns_list');
      if (saved) {
        try {
          setColumns(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('kanban_columns_list_updated', handleUpdated);
    return () => {
      window.removeEventListener('kanban_columns_list_updated', handleUpdated);
    };
  }, []);

  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnIcon, setNewColumnIcon] = useState('CheckCircle');
  const [newColumnColor, setNewColumnColor] = useState('text-blue-400');
  const [newColumnGlow, setNewColumnGlow] = useState('shadow-blue-500/20');

  const [isEditColumnsModalOpen, setIsEditColumnsModalOpen] = useState(false);
  const [kanbanSearchTerm, setKanbanSearchTerm] = useState('');
  const [editingColumnNames, setEditingColumnNames] = useState<{ [key: string]: string }>({});
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDate, setQuickTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickTaskTechnician, setQuickTaskTechnician] = useState('Administrador');

  const openEditColumnsModal = () => {
    const initialNames: { [key: string]: string } = {};
    columns.forEach(col => {
      initialNames[col.id] = kanbanColumnNames?.[col.id as TicketStatus] || col.title;
    });
    setEditingColumnNames(initialNames);
    setIsEditColumnsModalOpen(true);
  };

  const handleSaveColumnNames = (e: React.FormEvent) => {
    e.preventDefault();
    setKanbanColumnNames(editingColumnNames);
    
    // Sincronizar também o estado local das colunas para os títulos modificados
    setColumns(prev => prev.map(col => ({
      ...col,
      title: editingColumnNames[col.id] || col.title
    })));

    setIsEditColumnsModalOpen(false);
    toast.success('Alterações de colunas salvas!');
  };

  const handleResetColumnNames = () => {
    const resetNames: { [key: string]: string } = {};
    const defaultCols = [
      { id: 'APROVADO', title: 'Aprovado' },
      { id: 'AGUARDANDO_MATERIAL', title: 'Aguardando Material' },
      { id: 'REALIZANDO', title: 'Realizando' },
      { id: 'CONCLUIDO', title: 'Concluído' }
    ];
    
    defaultCols.forEach(col => {
      resetNames[col.id] = col.title;
    });

    setEditingColumnNames(resetNames);
  };

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    const rawId = newColumnTitle.trim().toUpperCase().replace(/\s+/g, '_');
    let finalId = rawId;
    let count = 1;
    while (columns.some(col => col.id === finalId)) {
      finalId = `${rawId}_${count}`;
      count++;
    }

    const newCol: KanbanColumn = {
      id: finalId,
      title: newColumnTitle.trim(),
      iconName: newColumnIcon,
      color: newColumnColor,
      glowColor: newColumnGlow,
    };

    setColumns(prev => [...prev, newCol]);
    setNewColumnTitle('');
    setIsAddColumnModalOpen(false);
    toast.success('Coluna adicionada com sucesso!');
  };

  const handleDeleteColumn = (colId: string) => {
    // Altera o status dos tickets dessa coluna para 'APROVADO'
    let affectedCount = 0;
    tickets.forEach(ticket => {
      if (ticket.status === colId) {
        updateTicket(ticket.id, { ...ticket, status: 'APROVADO' });
        affectedCount++;
      }
    });

    setColumns(prev => prev.filter(col => col.id !== colId));
    if (affectedCount > 0) {
      toast.success(`${affectedCount} card(s) movido(s) para "Aprovado". Coluna removida!`);
    } else {
      toast.success('Coluna removida!');
    }
  };

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

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTicketId) return;

    const ticket = tickets.find(t => t.id === draggedTicketId);
    if (ticket && (ticket.status || 'APROVADO') !== status) {
      updateTicket(ticket.id, { ...ticket, status: status as TicketStatus });
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
    toast.success('Tarefa rápida criada!');
  };

  const handleDeleteTicket = async () => {
    if (ticketToDelete) {
      await deleteTicket(ticketToDelete);
      setTicketToDelete(null);
      setIsDeleteModalOpen(false);
      toast.success('Tarefa/OS excluída com sucesso!');
    }
  };

  const filteredTickets = useMemo(() => {
    if (!kanbanSearchTerm.trim()) return tickets;
    const term = kanbanSearchTerm.toLowerCase();
    return tickets.filter(t => {
      const client = clients.find(c => c.id === t.clientId);
      const clientName = client?.name || '';
      return (
        (t.title || '').toLowerCase().includes(term) ||
        (t.osNumber || '').toLowerCase().includes(term) ||
        (t.technician || '').toLowerCase().includes(term) ||
        (t.maintenanceCategory || '').toLowerCase().includes(term) ||
        (t.observations || '').toLowerCase().includes(term) ||
        clientName.toLowerCase().includes(term)
      );
    });
  }, [tickets, kanbanSearchTerm, clients]);

  const activeBtnTextClass = bgType === 'color' 
    ? (bgValue.includes('orange') ? 'text-amber-600' : bgValue.includes('green') ? 'text-emerald-700' : 'text-blue-900') 
    : 'text-zinc-900';

  const containerBgStyle = bgType === 'image'
    ? { 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.45)), url(${bgValue})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundAttachment: 'fixed' 
      }
    : {};

  return (
    <div 
      className={`min-h-screen ${bgType === 'color' ? bgValue : 'bg-slate-900'} text-white -m-8 p-8 md:p-12 overflow-x-hidden relative flex flex-col transition-all duration-500`}
      style={containerBgStyle}
    >
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
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Alterar Fundo (Estilo Trello) */}
          <button
            onClick={() => setIsBgPanelOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 flex items-center gap-2.5 border border-white/20 backdrop-blur-md transition-all rounded-2xl shadow-xl font-bold tracking-widest uppercase text-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Alterar tela de fundo estilo Trello"
          >
            <Palette className="w-4 h-4 text-indigo-300" />
            <span>Mudar Fundo</span>
          </button>

          {/* Controle de Zoom */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md flex items-center p-1 rounded-2xl shadow-xl">
            <button 
              onClick={() => setZoom('sm')}
              className={`px-4 py-3.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider cursor-pointer ${
                zoom === 'sm' 
                  ? `bg-white ${activeBtnTextClass} shadow-lg` 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title="Zoom de Visão Geral (Menor)"
            >
              <ZoomOut className="w-4 h-4" />
              <span className="hidden sm:inline">Geral</span>
            </button>
            <button 
              onClick={() => setZoom('md')}
              className={`px-4 py-3.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider cursor-pointer ${
                zoom === 'md' 
                  ? `bg-white ${activeBtnTextClass} shadow-lg` 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title="Zoom Padrão (Médio)"
            >
              <span className="hidden sm:inline">Médio</span>
              <span className="sm:hidden">100%</span>
            </button>
            <button 
              onClick={() => setZoom('lg')}
              className={`px-4 py-3.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider cursor-pointer ${
                zoom === 'lg' 
                  ? `bg-white ${activeBtnTextClass} shadow-lg` 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title="Zoom Focado (Maior)"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="hidden sm:inline">Focal</span>
            </button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={openEditColumnsModal}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-5 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all rounded-2xl shadow-2xl font-bold tracking-widest uppercase text-sm cursor-pointer"
            title="Personalizar nome das colunas"
          >
            <Settings className="w-6 h-6 animate-pulse text-indigo-300" />
            Configurar Colunas
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsQuickTaskModalOpen(true)}
            className={`bg-white ${activeBtnTextClass} px-8 py-5 flex items-center gap-3 transition-all rounded-2xl shadow-2xl font-bold tracking-widest uppercase text-sm cursor-pointer`}
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

      {/* Modern Kanban Search Bar */}
      <div className="mb-8 max-w-xl relative z-10">
        <div className="relative">
          <Search className="w-5 h-5 text-white/40 absolute left-4.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={kanbanSearchTerm}
            onChange={(e) => setKanbanSearchTerm(e.target.value)}
            placeholder="Pesquisar cards por título, nº O.S., técnico, cliente, categoria..."
            className="w-full bg-slate-800/65 hover:bg-slate-800/80 border border-white/10 hover:border-white/20 rounded-2xl pl-12 pr-11 py-4 text-sm text-white placeholder-white/40 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-semibold shadow-xl backdrop-blur-md"
          />
          {kanbanSearchTerm && (
            <button 
              onClick={() => setKanbanSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-x-auto pb-8 snap-x relative z-10 custom-scrollbar">
        {columns.map((column, colIndex) => {
          const columnTickets = filteredTickets.filter(t => (t.status || 'APROVADO') === column.id);
          const Icon = ICON_MAP[column.iconName] || CheckCircle;

          // Dynamic configurations based on ZOOM state
          const columnWidthClass = zoom === 'sm' 
            ? 'min-w-[260px] max-w-[320px] rounded-2xl' 
            : zoom === 'lg' 
              ? 'min-w-[420px] max-w-[550px] rounded-[36px]' 
              : 'min-w-[350px] max-w-[450px] rounded-3xl';

          const columnHeaderPaddingClass = zoom === 'sm' ? 'p-3' : zoom === 'lg' ? 'p-8' : 'p-6';
          const columnHeaderTitleClass = zoom === 'sm' ? 'text-sm' : zoom === 'lg' ? 'text-2xl' : 'text-lg';
          const columnHeaderIconClass = zoom === 'sm' ? 'p-1.5' : zoom === 'lg' ? 'p-3' : 'p-2';
          const columnHeaderIconSize = zoom === 'sm' ? 'w-4 h-4' : zoom === 'lg' ? 'w-7 h-7' : 'w-6 h-6';
          const columnHeaderCounterPadding = zoom === 'sm' ? 'px-2 py-0.5 text-xs' : zoom === 'lg' ? 'px-5 py-1.5 text-base' : 'px-4 py-1 text-sm';
          const columnListPaddingClass = zoom === 'sm' ? 'p-3 space-y-2' : zoom === 'lg' ? 'p-8 space-y-6' : 'p-6 space-y-4';

          return (
            <motion.div 
              key={column.id}
              id={`column-${column.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.1 }}
              className={`flex-1 flex flex-col bg-slate-900/40 border border-white/10 backdrop-blur-md snap-center shadow-2xl overflow-hidden group/column ${columnWidthClass}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`flex items-center justify-between border-b border-white/10 bg-white/5 ${columnHeaderPaddingClass}`}>
                <div className={`flex items-center gap-3 font-black tracking-tight ${columnHeaderTitleClass} ${column.color.replace('text-', 'text-')}`}>
                  <div className={`rounded-lg bg-white/10 border border-white/10 ${column.glowColor} shadow-sm ${columnHeaderIconClass}`}>
                    <Icon className={columnHeaderIconSize} />
                  </div>
                  <span className="brightness-125">{(kanbanColumnNames && kanbanColumnNames[column.id]) || column.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full font-black bg-white/10 border border-white/10 text-white ${columnHeaderCounterPadding}`}>
                    {columnTickets.length}
                  </span>
                  {!['APROVADO', 'AGUARDANDO_MATERIAL', 'REALIZANDO', 'CONCLUIDO'].includes(column.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Tem certeza que deseja excluir a coluna "${column.title}"? Todos os cards dela serão movidos de volta para "Aprovado".`)) {
                          handleDeleteColumn(column.id);
                        }
                      }}
                      className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all active:scale-90"
                      title="Excluir Coluna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto custom-scrollbar min-h-[200px] ${columnListPaddingClass}`}>
                <AnimatePresence mode="popLayout">
                  {columnTickets.map(ticket => {
                    const client = clients.find(c => c.id === ticket.clientId);
                    
                    // Dynamic card settings based on Zoom
                    const cardPaddingClass = zoom === 'sm' ? 'p-3 rounded-xl' : zoom === 'lg' ? 'p-8 rounded-[24px]' : 'p-6 rounded-2xl';
                    const cardHeaderMarginClass = zoom === 'sm' ? 'mb-2' : zoom === 'lg' ? 'mb-5' : 'mb-4';
                    const tagTextClass = zoom === 'sm' ? 'text-[8px] px-1.5 py-0.5 rounded-md' : zoom === 'lg' ? 'text-xs px-4 py-1.5 rounded-xl' : 'text-[10px] px-3 py-1 rounded-lg';
                    const actionIconSize = zoom === 'sm' ? 'w-4 h-4' : zoom === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
                    const actionButtonPadding = zoom === 'sm' ? 'p-1' : zoom === 'lg' ? 'p-3' : 'p-2';
                    const cardTitleClass = zoom === 'sm' 
                      ? 'text-xs font-bold mb-1 line-clamp-2 leading-snug text-white group-hover:text-blue-300 transition-colors' 
                      : zoom === 'lg' 
                        ? 'text-2xl font-black text-white mb-3 line-clamp-3 leading-tight group-hover:text-blue-300 transition-colors' 
                        : 'text-xl font-black text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors';
                        
                    const cardClientClass = zoom === 'sm' ? 'text-[10px] text-white/60 mb-1 font-semibold line-clamp-1' : zoom === 'lg' ? 'text-base text-white/75 font-extrabold mb-5' : 'text-sm text-white/70 font-bold mb-4';
                    const cardDividerClass = zoom === 'sm' ? 'mt-3 pt-3' : zoom === 'lg' ? 'mt-8 pt-8' : 'mt-6 pt-6';
                    const footerItemTextClass = zoom === 'sm' ? 'text-[10px] gap-1.5 font-semibold text-white/70' : zoom === 'lg' ? 'text-base gap-4 font-black text-white/90' : 'text-sm gap-3 font-bold text-white/80';
                    const footerIconSize = zoom === 'sm' ? 'w-3 h-3 shrink-0' : zoom === 'lg' ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0';
                    const footerSpacingClass = zoom === 'sm' ? 'space-y-1.5' : zoom === 'lg' ? 'space-y-4' : 'space-y-3';
                    const detailsLinkMargin = zoom === 'sm' ? 'mt-3' : zoom === 'lg' ? 'mt-8' : 'mt-6';

                    const totalChecklists = ticket.checklistResults?.length || 0;
                    const completedChecklists = ticket.checklistResults?.filter(r => r.status === 'OK' || r.status === 'NOK').length || 0;
                    const progressPct = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

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
                        className={`opacity-95 hover:opacity-100 bg-slate-800/75 hover:bg-slate-700/95 border border-white/10 hover:border-indigo-500/30 cursor-grab active:cursor-grabbing transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] group relative shadow-xl hover:shadow-[0_20px_50px_-5px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.12)] backdrop-blur-md ${cardPaddingClass}`}
                      >
                        <div className={`flex justify-between items-start ${cardHeaderMarginClass}`}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {ticket.osNumber && (
                              <span className={`bg-blue-500/30 text-blue-100 font-black uppercase tracking-widest border border-blue-500/30 ${tagTextClass}`}>
                                {ticket.osNumber}
                              </span>
                            )}
                            <span className={`font-black uppercase tracking-widest border ${
                              ticket.type === 'TAREFA' 
                                ? 'bg-amber-500/30 text-amber-100 border-amber-500/30' 
                                : 'bg-white/20 text-white border-white/20'
                            } ${tagTextClass}`}>
                              {ticket.type}
                            </span>
                            {ticket.maintenanceCategory && (
                              <span className={`bg-white/10 text-white font-black uppercase tracking-widest border border-white/20 truncate max-w-[150px] ${tagTextClass}`} title={ticket.maintenanceCategory}>
                                {ticket.maintenanceCategory}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link 
                              to={`/tickets/${ticket.id}/edit`}
                              className={`text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all ${actionButtonPadding}`}
                              title="Editar"
                            >
                              <Edit className={actionIconSize} />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTicketToDelete(ticket.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className={`text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all ${actionButtonPadding}`}
                              title="Excluir"
                            >
                              <Trash2 className={actionIconSize} />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className={cardTitleClass}>
                          {ticket.title || (ticket.type === 'TAREFA' ? 'Tarefa' : client?.name || 'Sem Título')}
                        </h3>
                        {ticket.title && client?.name && (
                          <p className={cardClientClass}>{client.name}</p>
                        )}

                        {totalChecklists > 0 && (
                          <div className={`mt-3 mb-4 space-y-1.5 ${zoom === 'sm' ? 'text-[10px]' : zoom === 'lg' ? 'text-sm' : 'text-xs'}`}>
                            <div className="flex justify-between items-center text-white/60 font-bold">
                              <span>Checklist de Manutenção</span>
                              <span className="text-blue-400 font-extrabold">{completedChecklists}/{totalChecklists} ({progressPct}%)</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5 relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  progressPct === 100 
                                    ? 'from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                                    : progressPct >= 50 
                                    ? 'from-indigo-500 to-blue-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                                    : 'from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className={`border-t border-white/10 ${footerSpacingClass} ${cardDividerClass}`}>
                          <div className={`flex items-center ${footerItemTextClass}`}>
                            <Calendar className={`${footerIconSize} text-blue-400`} />
                            {safeFormatDate(ticket.date, { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                          <div className={`flex items-center ${footerItemTextClass}`}>
                            <User className={`${footerIconSize} text-purple-400`} />
                            <span className="truncate">{ticket.technician}</span>
                          </div>
                          {ticket.budgetAmount !== undefined && ticket.budgetAmount !== null && Number(ticket.budgetAmount) > 0 && (
                            <div className={`flex items-center ${footerItemTextClass} text-emerald-400 font-black`}>
                              <DollarSign className={`${footerIconSize} text-emerald-500`} />
                              <span>Valor: R$ {Number(ticket.budgetAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>

                        <div className={`flex justify-end ${detailsLinkMargin}`}>
                          <Link 
                            to={`/tickets/${ticket.id}`}
                            className={`flex items-center gap-2 font-black text-white/80 hover:text-white transition-colors group/link ${zoom === 'sm' ? 'text-xs' : zoom === 'lg' ? 'text-base' : 'text-sm'}`}
                          >
                            <span>Ver Detalhes</span>
                            <ExternalLink className={`transition-transform group-hover/link:translate-x-1 ${zoom === 'sm' ? 'w-3 h-3' : zoom === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
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

        {/* Botão de Adicionar Nova Coluna */}
        <motion.button
          onClick={() => {
            setNewColumnTitle('');
            setNewColumnIcon('CheckCircle');
            setNewColumnColor('text-blue-400');
            setNewColumnGlow('shadow-blue-500/20');
            setIsAddColumnModalOpen(true);
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`group flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-indigo-400/50 bg-slate-900/20 hover:bg-slate-900/40 text-white/50 hover:text-indigo-300 transition-all text-center shrink-0 p-8 cursor-pointer ${
            zoom === 'sm' 
              ? 'min-w-[260px] max-w-[320px] rounded-2xl h-[250px]' 
              : zoom === 'lg' 
                ? 'min-w-[420px] max-w-[550px] rounded-[36px] h-[350px]' 
                : 'min-w-[350px] max-w-[450px] rounded-3xl h-[300px]'
          }`}
        >
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-4 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all">
            <Plus className="w-8 h-8 text-white/40 group-hover:text-indigo-300" />
          </div>
          <span className="text-sm font-black uppercase tracking-wider text-white">Adicionar Coluna</span>
          <span className="text-xs text-white/40 mt-1 font-medium max-w-[200px]">Crie colunas personalizadas no seu Kanban</span>
        </motion.button>
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

        {isEditColumnsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl text-slate-900"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#004a7c]">Personalizar Colunas</h3>
                <button 
                  onClick={() => setIsEditColumnsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveColumnNames} className="space-y-5">
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Altere os nomes de exibição das colunas do seu Kanban conforme preferir.
                </p>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {columns.map((col) => (
                    <div key={col.id} className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                        Coluna: "{col.title}"
                      </label>
                      <input 
                        type="text"
                        required
                        value={editingColumnNames[col.id] || ''}
                        onChange={(e) => setEditingColumnNames({
                          ...editingColumnNames,
                          [col.id]: e.target.value
                        })}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-slate-900 focus:ring-2 focus:ring-[#004a7c] transition-all font-semibold"
                        placeholder={`Nome para ${col.title}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button 
                    type="button"
                    onClick={handleResetColumnNames}
                    className="text-xs font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    Restaurar Padrões
                  </button>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditColumnsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-105 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#004a7c] text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                  >
                    Salvar Nomes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isAddColumnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl text-slate-900"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#004a7c]">Nova Coluna</h3>
                <button 
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddColumnSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Título da Coluna</label>
                  <input 
                    type="text"
                    required
                    autoFocus
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all font-bold text-lg"
                    placeholder="Ex: Em Inspeção, Aguardando Cliente"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Ícone</label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map((opt) => {
                      const OptIcon = ICON_MAP[opt.value];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewColumnIcon(opt.value)}
                          className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                            newColumnIcon === opt.value
                              ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-md animate-none'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <OptIcon className="w-5 h-5" />
                          <span className="text-[10px] font-bold">{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Cor</label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.text}
                        type="button"
                        onClick={() => {
                          setNewColumnColor(opt.text);
                          setNewColumnGlow(opt.glow);
                        }}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                          newColumnColor === opt.text
                            ? 'bg-blue-50 border-blue-500 shadow-md'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${opt.bg} border border-slate-300`} />
                        <span className="text-xs font-bold text-slate-700">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddColumnModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#004a7c] text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                  >
                    Criar Coluna
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Trello-Style Background Customization Drawer */}
        {isBgPanelOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsBgPanelOpen(false)}
            />
            
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-slate-900 border-l border-white/10 p-6 z-50 text-white flex flex-col overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2.5">
                  <Palette className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-100">Tela de Fundo</h3>
                </div>
                <button 
                  onClick={() => setIsBgPanelOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              <div className="space-y-6 flex-1 pr-1 overflow-x-hidden">
                {/* Custom Upload Section */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    Enviar sua Imagem
                  </label>
                  <div className="relative group border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/5 hover:bg-white/10 transition-all rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/')) {
                          toast.error('Por favor, envie um arquivo de imagem.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const maxDim = 1200;
                            let width = img.width;
                            let height = img.height;
                            if (width > maxDim || height > maxDim) {
                              if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                              } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                              }
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                              setBgType('image');
                              setBgValue(compressedBase64);
                              localStorage.setItem('kanban_bg_type', 'image');
                              localStorage.setItem('kanban_bg_value', compressedBase64);
                              localStorage.setItem('kanban_bg_color_class', compressedBase64);
                              toast.success('Fundo personalizado aplicado com sucesso!');
                            }
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileImage className="w-8 h-8 text-slate-400 group-hover:text-blue-400 group-hover:scale-110 transition-all mb-2" />
                    <span className="text-sm font-bold text-slate-200">Arraste ou clique para enviar</span>
                    <span className="text-[10px] text-slate-400 mt-1">Otimizado no mesmo estilo do Trello</span>
                  </div>
                </div>

                {/* Scenic Photos Section */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    Fotos de Paisagem (Unsplash)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {BG_PHOTOS.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => {
                          setBgType('image');
                          setBgValue(photo.value);
                          localStorage.setItem('kanban_bg_type', 'image');
                          localStorage.setItem('kanban_bg_value', photo.value);
                          localStorage.setItem('kanban_bg_color_class', photo.value);
                          toast.success(`Fundo alterado para ${photo.name}!`);
                        }}
                        className={`group relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          bgType === 'image' && bgValue === photo.value 
                            ? 'border-blue-500 scale-[1.03] shadow-lg shadow-black/50' 
                            : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        <img 
                          src={photo.value} 
                          alt={photo.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-end p-2">
                          <span className="text-[10px] font-black tracking-wide text-white drop-shadow-sm uppercase">{photo.name}</span>
                        </div>
                        {bgType === 'image' && bgValue === photo.value && (
                          <div className="absolute top-1.5 right-1.5 bg-blue-500 rounded-full p-0.5">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Solid Colors Section */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Paintbrush className="w-3.5 h-3.5 text-blue-400" />
                    Cores Sólidas
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BG_SOLID_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => {
                          setBgType('color');
                          setBgValue(color.value);
                          localStorage.setItem('kanban_bg_type', 'color');
                          localStorage.setItem('kanban_bg_value', color.value);
                          localStorage.setItem('kanban_bg_color_class', color.value);
                          toast.success(`Fundo alterado para ${color.name}!`);
                        }}
                        className={`h-11 rounded-xl transition-all relative cursor-pointer border-2 ${color.value} ${
                          bgType === 'color' && bgValue === color.value 
                            ? 'border-white scale-105 shadow-md ring-2 ring-blue-500/40' 
                            : 'border-white/10 hover:border-white/40'
                        }`}
                        title={color.name}
                      >
                        {bgType === 'color' && bgValue === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                            <Check className="w-4 h-4 text-white drop-shadow-sm" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradients Section */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-400" />
                    Degradês Modernos
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BG_GRADIENTS.map((gradient) => (
                      <button
                        key={gradient.id}
                        onClick={() => {
                          setBgType('color');
                          setBgValue(gradient.value);
                          localStorage.setItem('kanban_bg_type', 'color');
                          localStorage.setItem('kanban_bg_value', gradient.value);
                          localStorage.setItem('kanban_bg_color_class', gradient.value);
                          toast.success(`Fundo alterado para ${gradient.name}!`);
                        }}
                        className={`h-12 rounded-xl transition-all relative cursor-pointer border-2 ${gradient.value} ${
                          bgType === 'color' && bgValue === gradient.value 
                            ? 'border-white scale-[1.02] shadow-md' 
                            : 'border-white/10 hover:border-white/40'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-end p-2 bg-black/10 rounded-xl">
                          <span className="text-[9px] font-black tracking-wider text-white drop-shadow-sm uppercase">{gradient.name}</span>
                        </div>
                        {bgType === 'color' && bgValue === gradient.value && (
                          <div className="absolute top-1.5 right-1.5 bg-white text-slate-900 rounded-full p-0.5">
                            <Check className="w-3 h-3 font-bold" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between">
                <button
                  onClick={() => {
                    setBgType('color');
                    setBgValue('bg-[#004a7c]');
                    localStorage.setItem('kanban_bg_type', 'color');
                    localStorage.setItem('kanban_bg_value', 'bg-[#004a7c]');
                    localStorage.setItem('kanban_bg_color_class', 'bg-[#004a7c]');
                    toast.success('Fundo restaurado para o padrão Azul Oceano!');
                  }}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar Padrão
                </button>
                <span className="text-[10px] text-white/40 self-center font-bold">Estilo Trello ✨</span>
              </div>
            </motion.div>
          </>
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
