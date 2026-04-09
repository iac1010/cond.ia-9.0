import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import { TicketType, TicketStatus } from '../types';
import { Save, X, ClipboardList, Info, Wrench, ShieldAlert, Clock, CheckCircle2, AlertCircle, HelpCircle, Camera, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { MAINTENANCE_CATEGORIES } from '../constants/maintenance';

export default function TicketForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, checklistItems, addTicket, updateTicket, tickets, addChecklistItem, supplyItems } = useStore();
  
  const [title, setTitle] = useState('');
  const [osNumber, setOsNumber] = useState('');
  const [type, setType] = useState<TicketType>('CORRETIVA');
  const [status, setStatus] = useState<TicketStatus>('APROVADO');
  const [clientId, setClientId] = useState('');
  const [maintenanceCategory, setMaintenanceCategory] = useState('');
  const [maintenanceSubcategory, setMaintenanceSubcategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [technician, setTechnician] = useState('');
  const [observations, setObservations] = useState('');
  const [color, setColor] = useState<string>(() => {
    const palette = ['#16a34a', '#2563eb', '#ca8a04', '#dc2626', '#9333ea', '#ea580c', '#db2777', '#0891b2'];
    return palette[Math.floor(Math.random() * palette.length)];
  });
  const [images, setImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'servico' | 'checklist' | 'materiais' | 'fotos'>('geral');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // New task state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Geral');
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Corretiva
  const [reportedProblem, setReportedProblem] = useState('');
  const [productsForQuote, setProductsForQuote] = useState('');
  const [serviceReport, setServiceReport] = useState('');
  
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
        setClientId(ticket.clientId);
        setDate(ticket.date);
        setTechnician(ticket.technician);
        setObservations(ticket.observations);
        setColor(ticket.color || '');
        setImages(ticket.images || []);
        
        if (ticket.type === 'CORRETIVA') {
          setReportedProblem(ticket.reportedProblem || '');
          setProductsForQuote(ticket.productsForQuote || '');
          setServiceReport(ticket.serviceReport || '');
        }
        
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
      observations,
      color,
      images,
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

  // Filter checklist items based on selected client
  const filteredChecklistItems = checklistItems.filter(item => {
    const itemClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
    return itemClientIds.length === 0 || itemClientIds.includes(clientId);
  });

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

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-4 sm:p-8 md:p-12 overflow-x-hidden relative flex flex-col">
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
      </header>

      <div className="max-w-5xl mx-auto w-full relative z-10 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row bg-white/5 backdrop-blur-md rounded-2xl p-2 border border-white/10 gap-1 sm:gap-0">
          <button 
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`flex-1 py-3 md:py-4 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'geral' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Informações Gerais
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('servico')}
            className={`flex-1 py-3 md:py-4 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'servico' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Detalhes do Serviço
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-3 md:py-4 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'checklist' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Checklist
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('materiais')}
            className={`flex-1 py-3 md:py-4 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'materiais' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Materiais
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`flex-1 py-3 md:py-4 rounded-xl font-bold tracking-widest uppercase text-[10px] md:text-xs transition-all ${activeTab === 'fotos' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            Fotos do Serviço
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
                          { name: 'Verde', value: '#16a34a' },
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

                    <div className="md:col-span-2 space-y-2 md:space-y-3">
                      <label className="block text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Técnico Responsável</label>
                      <input 
                        type="text"
                        value={technician}
                        onChange={(e) => setTechnician(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 outline-none transition-all text-white text-base md:text-xl placeholder:text-white/10"
                        placeholder="Nome do técnico"
                      />
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
                      <label className="block text-sm font-bold uppercase tracking-widest text-white/40 ml-1">Relato Técnico / Observações de Campo</label>
                      <textarea 
                        value={serviceReport}
                        onChange={(e) => setServiceReport(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-5 outline-none transition-all text-white text-lg min-h-[120px] resize-none"
                        placeholder="Descreva o que foi identificado ou realizado..."
                      />
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
                      <ClipboardList className="w-6 h-6 text-emerald-400" />
                      Checklist de Execução
                    </h2>
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsAddingTask(!isAddingTask)}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
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
                                  <div className={`font-bold text-lg transition-colors ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                    {item.task}
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
    </div>
  );
}
