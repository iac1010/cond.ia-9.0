import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { TicketType, TicketStatus } from '../types';
import { 
  Save, X, ClipboardList, Info, Wrench, ShieldAlert, Clock, CheckCircle2, 
  AlertCircle, HelpCircle, Camera, Image as ImageIcon, Trash2, Plus,
  Palette, Upload, Check, RotateCcw, FileImage, FileText, Download, Eye, Paperclip, Paintbrush,
  Sparkles, Loader2
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { MAINTENANCE_CATEGORIES } from '../constants/maintenance';
import toast from 'react-hot-toast';

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

export default function TicketForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, checklistItems, addTicket, updateTicket, tickets, addChecklistItem, updateChecklistItem, deleteChecklistItem, supplyItems } = useStore();
  
  const [title, setTitle] = useState('');
  const [osNumber, setOsNumber] = useState('');
  const [type, setType] = useState<TicketType>('CORRETIVA');
  const [status, setStatus] = useState<TicketStatus>('APROVADO');
  const [clientId, setClientId] = useState('');
  const [maintenanceCategory, setMaintenanceCategory] = useState('');
  const [maintenanceSubcategory, setMaintenanceSubcategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [technician, setTechnician] = useState('');
  const [budgetAmount, setBudgetAmount] = useState<number | ''>('');
  const [observations, setObservations] = useState('');
  const [color, setColor] = useState<string>(() => {
    const palette = ['#3b82f6', '#2563eb', '#ca8a04', '#dc2626', '#9333ea', '#ea580c', '#db2777', '#0891b2'];
    return palette[Math.floor(Math.random() * palette.length)];
  });
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; size?: string; type?: string; date?: string; }[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'servico' | 'checklist' | 'materiais' | 'fotos' | 'documentos'>('geral');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Trello background state
  const [bgType, setBgType] = useState<'color' | 'image'>(() => {
    const savedType = localStorage.getItem('kanban_bg_type');
    return (savedType as 'color' | 'image') || 'color';
  });

  const [bgValue, setBgValue] = useState<string>(() => {
    return localStorage.getItem('kanban_bg_value') || 'bg-[#004a7c]';
  });

  const [isBgPanelOpen, setIsBgPanelOpen] = useState(false);
  
  // New task state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Geral');
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('');
  
  // Corretiva
  const [reportedProblem, setReportedProblem] = useState('');
  const [productsForQuote, setProductsForQuote] = useState('');
  const [serviceReport, setServiceReport] = useState('');
  const [isImprovingReport, setIsImprovingReport] = useState(false);
  
  // Materiais
  const [usedMaterials, setUsedMaterials] = useState<{ itemId?: string; name?: string; quantity: number; price?: number }[]>([]);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialName, setMaterialName] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState(1);
  
  // Preventiva
  const [checklistResults, setChecklistResults] = useState<Record<string, { status: 'OK' | 'NOK' | 'NA', notes: string }>>(
    checklistItems.reduce((acc, item) => ({
      ...acc,
      [item.id]: { status: 'OK', notes: '' }
    }), {})
  );

  useEffect(() => {
    if (id) {
      const ticket = tickets.find(t => t.id === id);
      if (ticket) {
        setTitle(ticket.title || '');
        setOsNumber(ticket.osNumber || '');
        setMaintenanceCategory(ticket.maintenanceCategory || '');
        setMaintenanceSubcategory(ticket.maintenanceSubcategory || '');
        setType(ticket.type);
        setStatus(ticket.status || 'APROVADO');
        setClientId(ticket.clientId || '');
        setDate(ticket.date || new Date().toISOString().split('T')[0]);
        setTechnician(ticket.technician || '');
        setBudgetAmount(ticket.budgetAmount !== undefined && ticket.budgetAmount !== null ? ticket.budgetAmount : '');
        setObservations(ticket.observations || '');
        setColor(ticket.color || '');
        setImages(ticket.images || []);
        
        if (ticket.attachments) {
          setAttachments(ticket.attachments);
        }
        
        setReportedProblem(ticket.reportedProblem || '');
        setProductsForQuote(ticket.productsForQuote || '');
        setServiceReport(ticket.serviceReport || '');
        
        if (ticket.checklistResults) {
          const results = ticket.checklistResults.reduce((acc, result) => ({
            ...acc,
            [result.taskId]: { status: result.status, notes: result.notes }
          }), {});
          setChecklistResults(prev => ({ ...prev, ...results }));
          setSelectedTasks(new Set(ticket.checklistResults.map(r => r.taskId)));
        }

        if (ticket.usedMaterials) {
          setUsedMaterials(ticket.usedMaterials);
        }
      }
    }
  }, [id, tickets]);

  // Filter checklist items based on selected client
  const filteredChecklistItems = checklistItems.filter(item => {
    const itemClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
    return itemClientIds.length === 0 || itemClientIds.includes(clientId);
  });

  // Auto-select checklist for new preventive tickets
  useEffect(() => {
    if (!id && type === 'PREVENTIVA' && clientId && selectedTasks.size === 0) {
      setSelectedTasks(new Set(filteredChecklistItems.map(i => i.id)));
    }
  }, [type, clientId, filteredChecklistItems, id]);

  const handleImproveReportWithAI = async () => {
    if (!serviceReport.trim()) return;

    setIsImprovingReport(true);
    const loadingToast = toast.loading('IA analisando e aprimorando seu relato técnico...');

    try {
      const response = await fetch('/api/gemini/improve-technical-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: serviceReport }),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar a melhoria do relato técnico');
      }

      const data = await response.json();
      if (data.improvedText) {
        setServiceReport(data.improvedText);
        toast.success('Relato técnico aprimorado com sucesso!', { id: loadingToast });
      } else {
        throw new Error('Nenhum texto retornado');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Não foi possível aprimorar o texto no momento. Tente novamente.', { id: loadingToast });
    } finally {
      setIsImprovingReport(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ticketData = {
      title,
      osNumber,
      type,
      status,
      maintenanceCategory,
      maintenanceSubcategory,
      clientId,
      date,
      technician,
      budgetAmount: budgetAmount === '' ? undefined : Number(budgetAmount),
      observations,
      color,
      images,
      attachments,
      reportedProblem,
      productsForQuote,
      serviceReport,
      usedMaterials,
      checklistResults: Array.from(selectedTasks)
        .filter(taskId => filteredChecklistItems.some(i => i.id === taskId))
        .map(taskId => ({
          taskId,
          status: checklistResults[taskId]?.status || 'OK',
          notes: checklistResults[taskId]?.notes || ''
        }))
    };

    if (id) {
      updateTicket(id, ticketData);
    } else {
      addTicket(ticketData);
    }
    navigate('/tickets');
  };

  const handleAddMaterial = () => {
    if (!materialName.trim()) return;
    
    const material = supplyItems.find(i => i.name === materialName);
    
    setUsedMaterials(prev => [
      ...prev,
      { 
        itemId: material?.id, 
        name: materialName, 
        quantity: materialQuantity, 
        price: material?.lastPrice 
      }
    ]);
    setMaterialName('');
    setMaterialQuantity(1);
    setIsAddingMaterial(false);
  };

  const handleRemoveMaterial = (index: number) => {
    setUsedMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const categories = Array.from(new Set(filteredChecklistItems.map(item => item.category)));

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        
        // Format the size nicely
        const sizeInBytes = file.size;
        let sizeStr = '';
        if (sizeInBytes >= 1024 * 1024) {
          sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
        } else {
          sizeStr = `${(sizeInBytes / 1024).toFixed(0)} KB`;
        }

        const newAttachment = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          url: base64Url,
          size: sizeStr,
          type: file.type || 'application/octet-stream',
          date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        };

        setAttachments(prev => [...prev, newAttachment]);
        toast.success(`Documento "${file.name}" anexado!`);
      };
      reader.readAsDataURL(file);
    });
  };

  const downloadAttachment = (att: { name: string; url: string }) => {
    const link = document.createElement('a');
    link.href = att.url;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeAttachment = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o documento "${name}"?`)) {
      setAttachments(prev => prev.filter(att => att.id !== id));
      toast.success('Documento removido.');
    }
  };

  const handleAddNewTask = async () => {
    if (!newTaskName.trim()) return;
    
    const newItem = {
      task: newTaskName,
      category: newTaskCategory,
      clientIds: clientId ? [clientId] : []
    };
    
    const newId = await addChecklistItem(newItem);
    
    // Automatically select the new task
    const newSelected = new Set(selectedTasks);
    newSelected.add(newId);
    setSelectedTasks(newSelected);

    // Add to checklist results state
    setChecklistResults(prev => ({
      ...prev,
      [newId]: { status: 'OK', notes: '' }
    }));
    
    setNewTaskName('');
    setIsAddingTask(false);
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId || !editTaskName.trim()) return;
    
    const item = checklistItems.find(i => i.id === editingTaskId);
    if (!item) return;

    await updateChecklistItem(editingTaskId, {
      ...item,
      task: editTaskName,
      category: editTaskCategory
    });
    
    setEditingTaskId(null);
    setEditTaskName('');
    setEditTaskCategory('');
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta tarefa do checklist?')) {
      await deleteChecklistItem(id);
      
      // Remove from selected tasks if it was selected
      const newSelected = new Set(selectedTasks);
      newSelected.delete(id);
      setSelectedTasks(newSelected);
    }
  };

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
      className={`min-h-screen ${bgType === 'color' ? bgValue : 'bg-slate-900'} text-white -m-8 p-4 sm:p-8 md:p-12 overflow-x-hidden relative flex flex-col transition-all duration-500`}
      style={containerBgStyle}
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <header className="mb-6 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 relative z-10 shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <BackButton iconSize={6} className="p-3 md:p-4" />
          <div>
            <h1 className="text-3xl md:text-6xl font-light tracking-tight">
              {id ? 'Editar OS' : 'Nova OS'}
            </h1>
            <p className="text-sm md:text-xl opacity-60 mt-1 md:mt-2 font-light">Preencha os dados da Ordem de Serviço</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-end">
          <button
            type="button"
            onClick={() => setIsBgPanelOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 flex items-center gap-2.5 border border-white/20 backdrop-blur-md transition-all rounded-2xl shadow-xl font-bold tracking-widest uppercase text-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Alterar tela de fundo estilo Trello"
          >
            <Palette className="w-4 h-4 text-indigo-300" />
            <span>Mudar Fundo</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full relative z-10 mb-6 md:mb-8">
        <div className="flex flex-wrap bg-white/5 backdrop-blur-md rounded-2xl p-2 border border-white/10 gap-1 sm:gap-0">
          <button 
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`flex-1 py-3 md:py-4 px-2 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'geral' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Geral
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('servico')}
            className={`flex-1 py-3 md:py-4 px-2 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'servico' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Serviço
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-3 md:py-4 px-2 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'checklist' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Checklist
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('materiais')}
            className={`flex-1 py-3 md:py-4 px-2 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'materiais' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Materiais
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`flex-1 py-3 md:py-4 px-2 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'fotos' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Fotos
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`flex-1 py-3 md:py-4 px-2 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'documentos' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Anexos
          </button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto w-full relative z-10 pb-20"
      >
        <form onSubmit={handleSubmit} className="space-y-10">
          <AnimatePresence mode="wait">
            {activeTab === 'geral' && (
              <motion.div 
                key="tab-geral"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Informações Básicas */}
                <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 p-6 md:p-10 shadow-2xl">
                  <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-10 flex items-center gap-3">
                    <Info className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    Informações Básicas
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Nº OS</label>
                      <input 
                        type="text"
                        value={osNumber}
                        onChange={(e) => setOsNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl placeholder:text-white/10"
                        placeholder="Gerado automaticamente se vazio"
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Título da Tarefa</label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl placeholder:text-white/10"
                        placeholder="Ex: Manutenção do Ar Condicionado"
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Tipo de Ordem</label>
                      <select 
                        value={type}
                        onChange={(e) => setType(e.target.value as TicketType)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl appearance-none cursor-pointer"
                      >
                        <option value="CORRETIVA" className="bg-[#004a7c]">Manutenção Corretiva</option>
                        <option value="PREVENTIVA" className="bg-[#004a7c]">Manutenção Preventiva</option>
                        <option value="TAREFA" className="bg-[#004a7c]">Tarefa / Outros</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Status</label>
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value as TicketStatus)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl appearance-none cursor-pointer"
                      >
                        <option value="APROVADO" className="bg-[#004a7c]">Aprovado</option>
                        <option value="AGUARDANDO_MATERIAL" className="bg-[#004a7c]">Aguardando Material</option>
                        <option value="REALIZANDO" className="bg-[#004a7c]">Realizando</option>
                        <option value="CONCLUIDO" className="bg-[#004a7c]">Concluído</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Categoria de Manutenção</label>
                      <select 
                        value={maintenanceCategory}
                        onChange={(e) => {
                          setMaintenanceCategory(e.target.value);
                          setMaintenanceSubcategory('');
                        }}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#004a7c]">Selecione uma categoria...</option>
                        {Object.keys(MAINTENANCE_CATEGORIES).map(cat => (
                          <option key={cat} value={cat} className="bg-[#004a7c]">{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Subcategoria</label>
                      <select 
                        value={maintenanceSubcategory}
                        onChange={(e) => setMaintenanceSubcategory(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl appearance-none cursor-pointer disabled:opacity-50"
                        disabled={!maintenanceCategory}
                      >
                        <option value="" className="bg-[#004a7c]">Selecione uma subcategoria...</option>
                        {maintenanceCategory && MAINTENANCE_CATEGORIES[maintenanceCategory]?.map(sub => (
                          <option key={sub} value={sub} className="bg-[#004a7c]">{sub}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Cliente / Condomínio</label>
                      <select 
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl appearance-none cursor-pointer"
                        required={type !== 'TAREFA'}
                      >
                        <option value="" className="bg-[#004a7c]">Selecione um cliente...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id} className="bg-[#004a7c]">{client.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Data</label>
                      <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Cor do Cartão (Opcional)</label>
                      <div className="flex flex-wrap gap-2 md:gap-4 p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
                        {[
                          { name: 'Padrão', value: '' },
                          { name: 'Zinc', value: '#52525b' },
                          { name: 'Azul', value: '#2563eb' },
                          { name: 'Amarelo', value: '#ca8a04' },
                          { name: 'Vermelho', value: '#dc2626' },
                          { name: 'Roxo', value: '#9333ea' },
                          { name: 'Laranja', value: '#ea580c' },
                          { name: 'Rosa', value: '#db2777' },
                          { name: 'Ciano', value: '#0891b2' },
                        ].map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setColor(c.value)}
                            className={`w-8 h-8 md:w-12 md:h-12 rounded-full border-2 transition-all ${
                              color === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.value || 'rgba(255,255,255,0.1)' }}
                            title={c.name}
                          >
                            {c.value === '' && <X className="w-4 h-4 md:w-6 md:h-6 mx-auto text-white/40" />}
                          </button>
                        ))}
                        <div className="flex items-center gap-2 md:gap-3 ml-auto">
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/40">Personalizada:</span>
                          <input 
                            type="color"
                            value={color.startsWith('#') ? color : '#ffffff'}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 md:w-10 md:h-10 bg-transparent border-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Técnico Responsável</label>
                      <input 
                        type="text"
                        value={technician}
                        onChange={(e) => setTechnician(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl placeholder:text-white/10"
                        placeholder="Nome do técnico"
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Valor Cobrado (R$)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl placeholder:text-white/10"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Atalho para Checklist no Geral */}
                    <div className="md:col-span-2 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Checklist Selecionado</label>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('checklist')}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" /> Gerenciar Checklist
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTasks.size > 0 ? (
                          Array.from(selectedTasks).slice(0, 8).map(taskId => {
                            const item = checklistItems.find(i => i.id === taskId);
                            return (
                              <span key={taskId} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold">
                                {item?.task || 'Tarefa'}
                              </span>
                            );
                          })
                        ) : (
                          <p className="text-xs text-white/20 italic">Nenhum item selecionado. Clique em "Gerenciar Checklist" para adicionar.</p>
                        )}
                        {selectedTasks.size > 8 && (
                          <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-[10px] font-bold">
                            + {selectedTasks.size - 8} itens
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 p-6 md:p-10 shadow-2xl">
                  <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1 mb-4">Observações Gerais</label>
                  <textarea 
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-lg min-h-[120px] resize-none"
                    placeholder="Alguma observação adicional importante?"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'servico' && (
              <motion.div 
                key="tab-servico"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl space-y-10">
                  <h2 className="text-2xl font-bold mb-10 flex items-center gap-3">
                    <Wrench className="w-6 h-6 text-blue-400" />
                    Detalhes do Atendimento
                  </h2>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Problema Relatado / Solicitação</label>
                      <textarea 
                        value={reportedProblem}
                        onChange={(e) => setReportedProblem(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-5 outline-none transition-all text-white text-lg min-h-[120px] resize-none"
                        placeholder="Descreva o problema relatado pelo cliente ou a solicitação..."
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Produtos / Materiais Necessários</label>
                      <textarea 
                        value={productsForQuote}
                        onChange={(e) => setProductsForQuote(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-5 outline-none transition-all text-white text-lg min-h-[120px] resize-none"
                        placeholder="Liste os produtos ou materiais que serão necessários..."
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between ml-1">
                        <label className="block text-sm font-bold uppercase tracking-widest text-white/40">Relato Técnico / Observações de Campo</label>
                        <button
                          type="button"
                          onClick={handleImproveReportWithAI}
                          disabled={isImprovingReport || !serviceReport.trim()}
                          className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full transition-all border ${
                            serviceReport.trim()
                              ? 'bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30 active:scale-95'
                              : 'text-white/20 border-white/5 cursor-not-allowed'
                          }`}
                        >
                          {isImprovingReport ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Melhorando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-[#39FF14] drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]" />
                              Melhorar com IA
                            </>
                          )}
                        </button>
                      </div>
                      <textarea 
                        value={serviceReport}
                        onChange={(e) => setServiceReport(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-5 outline-none transition-all text-white text-lg min-h-[120px] resize-none"
                        placeholder="Descreva o que foi identificado ou realizado..."
                      />
                    </div>

                    {/* Checklist Rápido no Detalhes do Serviço */}
                    <div className="pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-6">
                        <label className="block text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Checklist da OS</label>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('checklist')}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Ver Checklist Completo
                        </button>
                      </div>
                      
                      {selectedTasks.size > 0 ? (
                        <div className="space-y-3">
                          {Array.from(selectedTasks).slice(0, 5).map(taskId => {
                            const item = checklistItems.find(i => i.id === taskId);
                            if (!item) return null;
                            return (
                              <div key={taskId} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-sm font-medium">{item.task}</span>
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black px-2 py-1 rounded ${
                                    checklistResults[taskId]?.status === 'OK' ? 'bg-blue-500/20 text-blue-400' :
                                    checklistResults[taskId]?.status === 'NOK' ? 'bg-red-500/20 text-red-400' :
                                    'bg-white/10 text-white/40'
                                  }`}>
                                    {checklistResults[taskId]?.status || 'OK'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {selectedTasks.size > 5 && (
                            <p className="text-[10px] text-white/20 text-center uppercase tracking-widest font-black">
                              + {selectedTasks.size - 5} itens no checklist
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                          <p className="text-sm text-white/20 italic">Nenhum item selecionado no checklist.</p>
                          <button 
                            type="button"
                            onClick={() => setActiveTab('checklist')}
                            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Selecionar Itens
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'checklist' && (
              <motion.div 
                key="tab-checklist"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <ClipboardList className="w-6 h-6 text-blue-400" />
                      Checklist de Execução
                    </h2>
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsAddingTask(!isAddingTask)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" /> Adicionar Tarefa
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedTasks(new Set(filteredChecklistItems.map(i => i.id)))}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Selecionar Todos
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedTasks(new Set())}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isAddingTask && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-10 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nome da Tarefa</label>
                              <input 
                                type="text"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-all"
                                placeholder="Ex: Verificar vazamentos"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Categoria</label>
                              <input 
                                type="text"
                                value={newTaskCategory}
                                onChange={(e) => setNewTaskCategory(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-all"
                                placeholder="Ex: Hidráulica"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button 
                              type="button"
                              onClick={() => setIsAddingTask(false)}
                              className="px-6 py-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="button"
                              onClick={handleAddNewTask}
                              className="px-6 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                              Salvar Tarefa
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-12">
                    {categories.map(category => (
                      <div key={category} className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/20 border-b border-white/5 pb-4">{category}</h3>
                        <div className="space-y-4">
                          {filteredChecklistItems.filter(item => item.category === category).map(item => {
                            const isSelected = selectedTasks.has(item.id);
                            const isEditing = editingTaskId === item.id;

                            if (isEditing) {
                              return (
                                <div key={item.id} className="bg-white/10 border border-white/20 rounded-3xl p-6 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nome da Tarefa</label>
                                      <input 
                                        type="text"
                                        value={editTaskName}
                                        onChange={(e) => setEditTaskName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Categoria</label>
                                      <input 
                                        type="text"
                                        value={editTaskCategory}
                                        onChange={(e) => setEditTaskCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3">
                                    <button 
                                      type="button"
                                      onClick={() => setEditingTaskId(null)}
                                      className="px-6 py-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={handleUpdateTask}
                                      className="px-6 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                    >
                                      Atualizar
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div 
                                key={item.id} 
                                onClick={() => {
                                  const newSelected = new Set(selectedTasks);
                                  if (isSelected) newSelected.delete(item.id);
                                  else newSelected.add(item.id);
                                  setSelectedTasks(newSelected);
                                }}
                                className={`flex flex-col lg:flex-row lg:items-center gap-6 p-6 rounded-3xl border transition-all cursor-pointer group ${
                                  isSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                                  }`}>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-black" />}
                                  </div>
                                  <div className={`font-bold text-lg transition-colors flex-1 ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                    {item.task}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTaskId(item.id);
                                        setEditTaskName(item.task);
                                        setEditTaskCategory(item.category);
                                      }}
                                      className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                                      title="Editar tarefa"
                                    >
                                      <Wrench className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteTask(item.id, e)}
                                      className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-all"
                                      title="Excluir tarefa"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="flex flex-col sm:flex-row items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                    <select 
                                      value={checklistResults[item.id]?.status || 'OK'}
                                      onChange={(e) => setChecklistResults(prev => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], status: e.target.value as any }
                                      }))}
                                      className={`w-full sm:w-32 border rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest outline-none transition-all appearance-none text-center cursor-pointer ${
                                        checklistResults[item.id]?.status === 'OK' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        checklistResults[item.id]?.status === 'NOK' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        'bg-white/5 text-white/40 border-white/10'
                                      }`}
                                    >
                                      <option value="OK" className="bg-[#004a7c]">OK</option>
                                      <option value="NOK" className="bg-[#004a7c]">Não OK</option>
                                      <option value="NA" className="bg-[#004a7c]">N/A</option>
                                    </select>
                                    <div className="relative w-full sm:w-64">
                                      <input 
                                        type="text"
                                        placeholder="Observações..."
                                        value={checklistResults[item.id]?.notes || ''}
                                        onChange={(e) => setChecklistResults(prev => ({
                                          ...prev,
                                          [item.id]: { ...prev[item.id], notes: e.target.value }
                                        }))}
                                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-sm outline-none transition-all text-white placeholder:text-white/10"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {filteredChecklistItems.length === 0 && (
                      <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
                        <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40 font-medium">Nenhum item de checklist disponível para este cliente.</p>
                        <p className="text-white/20 text-sm mt-2">Cadastre itens no Gerenciador de Checklist.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'materiais' && (
              <motion.div 
                key="tab-materiais"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl space-y-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <Wrench className="w-6 h-6 text-orange-400" />
                      Materiais Usados
                    </h2>
                    <button 
                      type="button"
                      onClick={() => setIsAddingMaterial(!isAddingMaterial)}
                      className="p-3 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green rounded-xl transition-all shadow-lg"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isAddingMaterial && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Material</label>
                              <input 
                                list="materials-list"
                                value={materialName}
                                onChange={(e) => setMaterialName(e.target.value)}
                                placeholder="Digite ou selecione um material..."
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-neon-green/50 transition-all"
                              />
                              <datalist id="materials-list">
                                {supplyItems.map(item => (
                                  <option key={item.id} value={item.name} />
                                ))}
                              </datalist>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Quantidade</label>
                              <input 
                                type="number"
                                value={materialQuantity}
                                onChange={(e) => setMaterialQuantity(Number(e.target.value))}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-neon-green/50 transition-all"
                                min="1"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button 
                              type="button"
                              onClick={() => setIsAddingMaterial(false)}
                              className="px-6 py-3 text-white/40 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="button"
                              onClick={handleAddMaterial}
                              className="px-6 py-3 bg-neon-green text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
                            >
                              Adicionar Material
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    {usedMaterials.map((material, index) => {
                      const item = supplyItems.find(i => i.id === material.itemId);
                      return (
                        <div key={index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                              <Wrench className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">{material.name || item?.name || 'Material não encontrado'}</h4>
                              <p className="text-sm text-white/40">{material.quantity} {item?.unit || 'un'}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveMaterial(index)}
                            className="p-3 text-white/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      );
                    })}
                    {usedMaterials.length === 0 && (
                      <div className="p-10 text-center bg-white/5 rounded-2xl border border-white/10 italic text-white/20">
                        Nenhum material adicionado ainda.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'fotos' && (
              <motion.div 
                key="tab-fotos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-bold mb-10 flex items-center gap-3">
                  <Camera className="w-6 h-6 text-purple-400" />
                  Fotos do Serviço
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                      <img src={img} alt={`Serviço ${index}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 group">
                    <ImageIcon className="w-8 h-8 text-white/20 group-hover:text-white/40 mb-2" />
                    <span className="text-xs font-bold text-white/20 group-hover:text-white/40 uppercase tracking-widest text-center px-2">Adicionar Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </motion.div>
            )}

            {activeTab === 'documentos' && (
              <motion.div 
                key="tab-documentos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl"
              >
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                  <Paperclip className="w-6 h-6 text-indigo-400" />
                  Anexos de Documentos
                </h2>
                <p className="text-white/60 mb-8 text-sm">
                  Insira relatórios técnicos, manuais, certificados, contratos ou outros arquivos importantes para deixar as informações da OS bem completas.
                </p>

                <div className="relative border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-white/5 hover:bg-white/10 transition-all rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer mb-8 group">
                  <input 
                    type="file"
                    multiple
                    onChange={handleDocumentUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileText className="w-12 h-12 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all mb-3" />
                  <span className="text-lg font-bold text-slate-200">Arraste seus documentos aqui ou clique para procurar</span>
                  <span className="text-xs text-slate-400 mt-2">Suporta PDF, DOC, XLS, Imagens e outros formatos</span>
                </div>

                {attachments.length === 0 ? (
                  <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5">
                    <Paperclip className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-white/40 font-semibold text-sm">Nenhum documento anexado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
                      Documentos Anexados ({attachments.length})
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                          <div className="flex items-center gap-3.5 overflow-hidden">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-white truncate" title={att.name}>{att.name}</p>
                              <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                                {att.size && <span>{att.size}</span>}
                                {att.size && att.date && <span>•</span>}
                                {att.date && <span>{att.date}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity pl-2">
                            <button
                              type="button"
                              onClick={() => downloadAttachment(att)}
                              className="p-2 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all"
                              title="Baixar Documento"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAttachment(att.id, att.name)}
                              className="p-2 hover:bg-white/10 text-rose-400 hover:text-rose-300 rounded-xl transition-all"
                              title="Excluir Documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-end gap-6 pt-6">
            <button 
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-10 py-5 text-white/40 hover:text-white font-black tracking-widest transition-all uppercase text-sm"
            >
              CANCELAR
            </button>
            <button 
              type="submit"
              className="bg-white/10 hover:bg-white/20 text-white px-12 py-5 rounded-2xl font-black tracking-widest border border-white/30 backdrop-blur-md transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3"
            >
              <Save className="w-6 h-6" /> SALVAR ORDEM DE SERVIÇO
            </button>
          </motion.div>
        </form>
      </motion.div>

      {/* Trello-Style Background Customization Drawer */}
      <AnimatePresence>
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
                  type="button"
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
                        type="button"
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
                        type="button"
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
                        type="button"
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

              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between shrink-0">
                <button
                  type="button"
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
    </div>
  );
}
