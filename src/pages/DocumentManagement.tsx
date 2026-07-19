import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, Calendar, Bell, Play, Eye, 
  Power, ArrowLeft, MoreHorizontal, User,
  Home, Box, Lightbulb, Shield, Settings,
  ChevronRight, Search, Filter, Download,
  Share2, Trash2, Plus, FileSignature,
  Activity, Zap, Cpu, FilePlus,
  Grid, List, UploadCloud, X, Check, FolderOpen, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'react-hot-toast';
import { GlassCard, CircularProgress } from '../components/GlassUI';
import { useStore } from '../store';
import { DocumentThumbnail } from '../components/DocumentThumbnail';

const lineData = [
  { name: 'Seg', value: 100 },
  { name: 'Ter', value: 250 },
  { name: 'Qua', value: 180 },
  { name: 'Qui', value: 380 },
  { name: 'Sex', value: 300 },
  { name: 'Sab', value: 450 },
  { name: 'Dom', value: 320 },
];

const barData = [
  { name: 'CONTRATOS', value: 98, color: '#3b82f6' },
  { name: 'AVISOS', value: 92, color: '#f59e0b' },
  { name: 'ORDENS DE SERVIÇO', value: 94, color: '#ffffff' },
];

export default function DocumentManagement() {
  const navigate = useNavigate();
  const { digitalFolder, addNotification, addDigitalFolderItem, clients, documentTemplates, validateDigitalFolderItem, rejectDigitalFolderItem } = useStore();
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isSinalActive, setIsSinalActive] = useState(true);
  const [isValidationActive, setIsValidationActive] = useState(false);
  const [isStatusActive, setIsStatusActive] = useState(true);

  // Estados para a Pasta Digital & Explorador com miniaturas
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'explorer'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Manipular upload de arquivos simulado/real via drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUploadedFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    const toastId = toast.loading(`Processando e gerando miniatura para "${file.name}"...`);

    // Simular o delay de leitura do PDF e hashing de segurança para assinatura
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Determinar categoria aproximada pelo nome do arquivo
    let category = 'Outros';
    const nameLower = file.name.toLowerCase();
    if (nameLower.includes('ata') || nameLower.includes('assembleia') || nameLower.includes('ago') || nameLower.includes('age')) {
      category = 'Assembleia';
    } else if (nameLower.includes('contrato') || nameLower.includes('servico') || nameLower.includes('acordo')) {
      category = 'Contratos';
    } else if (nameLower.includes('multa') || nameLower.includes('conviv') || nameLower.includes('notifica')) {
      category = 'Convivência';
    } else if (nameLower.includes('finan') || nameLower.includes('balanc') || nameLower.includes('receit')) {
      category = 'Governança';
    }

    addDigitalFolderItem({
      clientId: clients[0]?.id || 'system',
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
      description: `Documento PDF importado de "${file.name}". Tamanho: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Integridade verificada via SHA-256.`,
      category: category,
      fileUrl: '',
      date: new Date().toISOString(),
    });

    setIsUploading(false);
    toast.success('Documento carregado e miniatura gerada com sucesso!', { id: toastId });
    addNotification({
      title: 'Documento Importado',
      message: `O documento "${file.name}" foi processado. Miniatura visual e metadados gerados com sucesso.`,
      type: 'SUCCESS'
    });
  };

  const handleAction = (action: string) => {
    if (action === 'Iniciar Assinatura Principal') {
      if (documentTemplates.length === 0) {
        toast.error('Crie um modelo de documento primeiro no Document Factory');
        navigate('/document-factory');
        return;
      }
      
      const template = documentTemplates[0];
      const client = clients[0];
      
      addDigitalFolderItem({
        clientId: client?.id || 'system',
        title: `Assinatura: ${template.title}`,
        description: `Processo de assinatura iniciado para ${client?.name || 'Cliente Geral'}`,
        category: template.category,
        fileUrl: template.fileUrl || '',
        date: new Date().toISOString(),
      });
      
      toast.success(`Processo "${template.title}" iniciado!`);
      addNotification({
        title: 'Novo Processo de Assinatura',
        message: `O documento "${template.title}" foi enviado para assinatura.`,
        type: 'SUCCESS'
      });
    } else if (action === 'Visualizar Documentos Gerais') {
      toast('Abrindo central de documentos...');
    } else {
      toast.success(`Ação executada: ${action}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-20"
          alt="Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem]">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="p-4 hover:bg-white/5 rounded-2xl transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-white/70 group-hover:text-white" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSignature className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Home IOT - Automação Residencial</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter">Olá, Maria! Tudo sob controle.</h1>
              <p className="text-xs text-white/40 font-medium">Sábado, 26 de Março, 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                <img src="https://i.pravatar.cc/150?u=carlos" alt="Carlos" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-bold">Olá, Carlos!</span>
            </div>
            
            <nav className="flex items-center gap-4">
              {[
                { icon: Home, label: 'Visão Geral', active: true, path: '/' },
                { icon: Box, label: 'Cisternas', path: '/cisterns' },
                { icon: Lightbulb, label: 'Iluminação', path: '/lighting' },
                { icon: Shield, label: 'Segurança', path: '/security' },
                { icon: Settings, label: 'Configurações', path: '/settings' }
              ].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => item.path && navigate(item.path)}
                  className={`flex flex-col items-center gap-1 p-2 transition-all ${item.active ? 'text-white' : 'text-white/40 hover:text-white'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Sub Tab Navigation for Document Dashboard vs Document Explorer */}
        <div className="flex gap-4 mb-8 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 max-w-md relative z-10">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'dashboard'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Painel Geral
          </button>
          <button
            onClick={() => setActiveSubTab('explorer')}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'explorer'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Pasta Digital ({digitalFolder.length})
          </button>
        </div>

        {/* Filtrar documentos da Pasta Digital */}
        {(() => {
          const filteredDocs = digitalFolder.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  doc.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'Todos' || 
              doc.category.toLowerCase() === selectedCategory.toLowerCase();
            const matchesStatus = selectedStatus === 'Todos' || doc.status === selectedStatus;
            return matchesSearch && matchesCategory && matchesStatus;
          });

          return (
            <>
              {activeSubTab === 'explorer' ? (
                /* EXPOSITOR PASTA DIGITAL */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
                  {/* Filtros, Pesquisa e Controles de Layout */}
                  <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
                    <div className="relative flex-grow w-full xl:max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input 
                        type="text"
                        placeholder="Pesquisar documentos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white outline-none w-full transition-all text-sm text-white"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                      <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        {['Todos', 'Assembleia', 'Contratos', 'Convivência', 'Governança', 'Outros'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                              selectedCategory === cat
                                ? 'bg-white text-black'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        {['Todos', 'PENDING', 'VALIDATED', 'REJECTED'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                              selectedStatus === status
                                ? 'bg-white text-black'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {status === 'Todos' ? 'Todos' : status === 'PENDING' ? 'Pendentes' : status === 'VALIDATED' ? 'Assinados' : 'Recusados'}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                          title="Exibição em Grade"
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                          title="Exibição em Lista"
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Upload Zone (Drag and Drop) */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[2.5rem] p-10 text-center transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[220px] ${
                      dragActive 
                        ? 'border-white bg-white/10 scale-[0.99]' 
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="file-upload-input"
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept=".pdf,.doc,.docx"
                    />
                    
                    <div className="p-4 bg-white/10 text-white rounded-2xl mb-4 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-8 h-8 text-white/80" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-1.5">Arraste e solte seus documentos PDF aqui</h3>
                    <p className="text-xs text-white/40 mb-4 max-w-md font-semibold leading-relaxed">Ou clique no botão abaixo para carregar do seu computador. Geramos miniaturas interativas e hash ICP-Brasil em tempo real.</p>
                    
                    <label 
                      htmlFor="file-upload-input"
                      className="px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-white/5"
                    >
                      Selecionar Arquivo
                    </label>

                    {isUploading && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                        <p className="text-xs font-black uppercase tracking-wider animate-pulse">Hashing SHA-256 & Renderizando Miniatura...</p>
                      </div>
                    )}
                  </div>

                  {/* Document Library Grid / List */}
                  {filteredDocs.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-white/20" />
                      </div>
                      <h3 className="text-lg font-black mb-2 uppercase tracking-wide">Nenhum documento encontrado</h3>
                      <p className="text-white/40 text-xs max-w-sm mx-auto">Tente redefinir seus filtros de categoria ou alterar sua busca por termos chave.</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {filteredDocs.map((doc) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedDoc(doc)}
                          key={doc.id}
                          className="bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 p-5 rounded-[2rem] transition-all cursor-pointer group relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
                        >
                          {/* Thumbnail */}
                          <div className="mb-4 transform group-hover:scale-105 transition-transform">
                            <DocumentThumbnail item={doc} size="md" />
                          </div>

                          <div className="w-full">
                            <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block mb-1">
                              {doc.category}
                            </span>
                            <h4 className="text-xs font-bold text-white/90 truncate group-hover:text-white transition-colors">
                              {doc.title.replace('Assinatura: ', '')}
                            </h4>
                            <p className="text-[10px] text-white/40 font-semibold mt-1">
                              {new Date(doc.date).toLocaleDateString('pt-BR')}
                            </p>

                            <div className="mt-3 flex items-center justify-center gap-1.5">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                doc.status === 'VALIDATED' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : doc.status === 'REJECTED'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                              }`}>
                                {doc.status === 'VALIDATED' ? 'Concluído' : doc.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    /* List View with compact thumbnails */
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                              <th className="py-4 px-6 w-24">Miniatura</th>
                              <th className="py-4 px-6">Título do Documento</th>
                              <th className="py-4 px-6">Categoria</th>
                              <th className="py-4 px-6">Data de Criação</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredDocs.map((doc) => (
                              <tr 
                                key={doc.id}
                                className="hover:bg-white/10 transition-colors cursor-pointer group"
                                onClick={() => setSelectedDoc(doc)}
                              >
                                <td className="py-4 px-6">
                                  <div className="scale-75 -ml-4 -my-2.5">
                                    <DocumentThumbnail item={doc} size="sm" />
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="font-bold text-sm text-white/90 group-hover:text-white truncate max-w-xs md:max-w-md">
                                    {doc.title}
                                  </div>
                                  <div className="text-[10px] text-white/30 truncate max-w-xs mt-0.5 font-medium">
                                    {doc.description}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-xs font-semibold text-white/60">
                                  {doc.category}
                                </td>
                                <td className="py-4 px-6 text-xs text-white/40 font-mono">
                                  {new Date(doc.date).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                                    doc.status === 'VALIDATED' 
                                      ? 'bg-emerald-500/10 text-emerald-400' 
                                      : doc.status === 'REJECTED'
                                        ? 'bg-rose-500/10 text-rose-400'
                                        : 'bg-amber-500/10 text-amber-400 animate-pulse'
                                  }`}>
                                    {doc.status === 'VALIDATED' ? 'Homologado' : doc.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => setSelectedDoc(doc)}
                                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                                      title="Visualizar Detalhes"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        toast.success('Iniciando download do arquivo homologado...');
                                      }}
                                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                                      title="Baixar PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PAINEL GERAL (DASHBOARD) ANTERIOR */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300 relative z-10">
                  
                  {/* Left Column */}
                  <div className="lg:col-span-3 space-y-6">
                    <GlassCard title="SITUAÇÃO GERAL DE DOCUMENTOS" subtitle="TOTAL DE DOCUMENTOS: 75%">
                      <div className="flex flex-col items-center py-4">
                        <div className="relative">
                          <CircularProgress 
                            value={75} 
                            size={160} 
                            strokeWidth={12} 
                            color="text-white"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black">75%</span>
                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Processados</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard title="DOCUMENTOS POR TIPO (% PROCESSADO)">
                      <div className="space-y-6 py-2">
                        {barData.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                              <span>{item.name}</span>
                              <span className="text-white">{item.value}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 1, delay: idx * 0.2 }}
                                className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                style={{ backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] pt-2">
                          <span>0</span>
                          <span>40</span>
                          <span>80</span>
                          <span>120</span>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Middle Column */}
                  <div className="lg:col-span-6 space-y-6">
                    <GlassCard 
                      title="VISÃO DETALHADA E FLUXOS" 
                      subtitle="TMD TOTAL (Tempo Médio de Assinatura)"
                      action={<button onClick={() => toast('Opções de visualização')}><MoreHorizontal className="w-4 h-4 text-white/40" /></button>}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#ffffff" 
                                strokeWidth={3}
                                dot={{ fill: '#ffffff', strokeWidth: 2, r: 4, stroke: '#000' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-white" />
                              <span className="text-[10px] font-bold text-white/60 uppercase">Processados</span>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-4xl font-black animate-pulse">98%</span>
                              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest text-center max-w-[80px]">Assinaturas Rápidas & Validações</span>
                            </div>
                          </div>
                          <div className="mt-6 flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                              <span className="text-[10px] font-bold text-white uppercase">TMD Total: 98%</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span className="text-[8px] font-bold text-amber-500 uppercase">Alertas Críticos: R$ 4.500</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <GlassCard title="PRÓXIMOS CICLOS DE ASSINATURA">
                        <div className="flex flex-col items-center justify-center py-4">
                          <span className="text-6xl font-black tracking-tighter text-white mb-4">16h00</span>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-white" />
                              <span className="text-[10px] font-bold text-white uppercase">TMD Total: 98%</span>
                            </div>
                        </div>
                      </GlassCard>

                      <GlassCard title="CONTROLE DE FLUXO">
                        <div className="space-y-6 py-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Assinatura Sinal</div>
                              <div className="text-[8px] text-white/30 uppercase mt-0.5">Fluxo Principal</div>
                            </div>
                            <button 
                              onClick={() => setIsSinalActive(!isSinalActive)}
                              className={`w-12 h-6 rounded-full relative transition-all ${isSinalActive ? 'bg-white' : 'bg-white/10'}`}
                            >
                              <motion.div 
                                animate={{ x: isSinalActive ? 24 : 4 }}
                                className="absolute top-1 w-4 h-4 bg-black rounded-full shadow-lg"
                              />
                              <span className={`absolute ${isSinalActive ? 'left-2' : 'right-2'} top-1.5 text-[6px] font-black text-black`}>
                                {isSinalActive ? 'ON' : 'OFF'}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Validação Técnica</div>
                              <div className="text-[8px] text-white/30 uppercase mt-0.5">Fluxo de Engenharia</div>
                            </div>
                            <button 
                              onClick={() => setIsValidationActive(!isValidationActive)}
                              className={`w-12 h-6 rounded-full relative transition-all ${isValidationActive ? 'bg-white' : 'bg-white/10'}`}
                            >
                              <motion.div 
                                animate={{ x: isValidationActive ? 24 : 4 }}
                                className="absolute top-1 w-4 h-4 bg-black rounded-full shadow-lg"
                              />
                              <span className={`absolute ${isValidationActive ? 'left-2' : 'right-2'} top-1.5 text-[6px] font-black text-black`}>
                                {isValidationActive ? 'ON' : 'OFF'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-3 space-y-6">
                    <GlassCard 
                      title="AGENDA DE ASSINATURAS (SEMANAL)"
                      action={<button onClick={() => { setActiveSubTab('explorer'); toast('Abrindo Explorador de Documentos...'); }} className="text-[9px] font-black uppercase text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">Ver Todos</button>}
                    >
                      <div className="space-y-3.5">
                        {digitalFolder.length === 0 ? (
                          <div className="py-12 text-center">
                            <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Nenhuma assinatura agendada</p>
                          </div>
                        ) : (
                          digitalFolder.slice(0, 4).map((item) => (
                            <div 
                              key={item.id} 
                              onClick={() => { setSelectedDoc(item); }}
                              className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                            >
                              {/* Mini Thumbnail */}
                              <div className="shrink-0 scale-90 -ml-1 transition-transform group-hover:scale-95">
                                <DocumentThumbnail item={item} size="sm" />
                              </div>
                              
                              {/* Metadados */}
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">
                                    {item.category}
                                  </span>
                                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                                  <span className="text-[8px] font-bold text-white/40">
                                    {new Date(item.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <h4 className="text-[11px] font-bold text-white/85 group-hover:text-white transition-colors leading-tight truncate">
                                  {item.title}
                                </h4>
                                
                                {/* Status badge */}
                                <div className="mt-1 flex items-center gap-1">
                                  <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    item.status === 'VALIDATED' 
                                      ? 'bg-emerald-500/10 text-emerald-400' 
                                      : item.status === 'REJECTED'
                                        ? 'bg-rose-500/10 text-rose-400'
                                        : 'bg-amber-500/10 text-amber-400 animate-pulse'
                                  }`}>
                                    {item.status === 'VALIDATED' ? 'Concluído' : item.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </GlassCard>

                    <GlassCard title="NOTIFICAÇÕES DE ASSINATURA & ALERTAS">
                      <div className="space-y-4">
                        {[
                          { icon: AlertTriangle, title: 'Alerta: Vencimento de Assinatura (Filtro A)', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                          { icon: AlertTriangle, title: 'Alerta: Temperatura Elevada Bomba 2', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                          { icon: FileText, title: 'Notificação: Entrega de Material de Limpeza (23/03)', color: 'text-white', bg: 'bg-white/10' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 group cursor-pointer">
                            <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-bold text-white/60 leading-tight group-hover:text-white transition-colors">
                              {item.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2">Botoes de Ação</h3>
                      
                      <button 
                        onClick={() => handleAction('Iniciar Assinatura Principal')}
                        className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all group"
                      >
                        <div className="p-2 bg-white/10 text-white rounded-xl group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Iniciar Assinatura Principal</span>
                      </button>

                      <button 
                        onClick={() => handleAction('Visualizar Documentos Gerais')}
                        className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all group"
                      >
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                          <Eye className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Visualizar Documentos Gerais</span>
                      </button>

                      <button 
                        onClick={() => setIsStatusActive(!isStatusActive)}
                        className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group"
                      >
                        <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${isStatusActive ? 'bg-white/10 text-white' : 'bg-rose-500/10 text-rose-400'}`}>
                          <Power className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Status Assinatura</span>
                          <span className={`text-[8px] font-bold uppercase ${isStatusActive ? 'text-white' : 'text-rose-400'}`}>
                            {isStatusActive ? 'Ativado' : 'Desativado'}
                          </span>
                        </div>
                      </button>
                      <button 
                        onClick={() => navigate('/document-factory')}
                        className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all group"
                      >
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                          <FilePlus className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Document Factory</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Details Modal */}
              <AnimatePresence>
                {selectedDoc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-zinc-900 border border-white/15 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative z-50 text-white"
                    >
                      {/* Header */}
                      <div className="p-6 border-b border-white/10 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 bg-white/5 text-[9px] font-black uppercase tracking-wider rounded-md text-white/60">
                              {selectedDoc.category}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                              selectedDoc.status === 'VALIDATED' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : selectedDoc.status === 'REJECTED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            }`}>
                              {selectedDoc.status === 'VALIDATED' ? 'Assinado (3/3)' : selectedDoc.status === 'REJECTED' ? 'Recusado' : `Em Coleta (${selectedDoc.signatures?.length || 0}/3)`}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-white">{selectedDoc.title}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedDoc(null)}
                          className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Thumbnail Preview inside modal */}
                        <div className="flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-3xl p-6 relative">
                          <DocumentThumbnail item={selectedDoc} size="lg" />
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-6">Clique nas ações para interagir</p>
                        </div>

                        {/* Right: Info and Signatures */}
                        <div className="space-y-6 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Descrição do Processo</h4>
                              <p className="text-xs text-white/70 leading-relaxed font-medium">{selectedDoc.description}</p>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Metadados de Segurança</h4>
                              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold font-mono text-white/50 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div>
                                  <span className="text-white/30 block text-[8px] uppercase font-sans mb-0.5">Criado em</span>
                                  {new Date(selectedDoc.date).toLocaleDateString('pt-BR')} {new Date(selectedDoc.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div>
                                  <span className="text-white/30 block text-[8px] uppercase font-sans mb-0.5">SHA-256 Hash</span>
                                  {(selectedDoc.id || 'f13a').slice(0, 8).toUpperCase()}...
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-2">Assinaturas Coletadas</h4>
                              <div className="space-y-2">
                                {(!selectedDoc.signatures || selectedDoc.signatures.length === 0) ? (
                                  <p className="text-xs text-white/30 font-bold uppercase tracking-wide py-2">Nenhuma assinatura registrada</p>
                                ) : (
                                  selectedDoc.signatures.map((sig: any) => (
                                    <div key={sig.id} className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                                      <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-xs font-bold text-white/80">{sig.userName}</span>
                                      </div>
                                      <span className="text-[9px] font-black text-white/40 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md">{sig.role}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2 pt-4 border-t border-white/10">
                            {selectedDoc.status === 'PENDING' && (
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => {
                                    validateDigitalFolderItem(selectedDoc.id, 'Carlos Roberto', 'Síndico');
                                    toast.success('Documento assinado pelo Síndico!');
                                    // Refresh local view
                                    setSelectedDoc(prev => {
                                      if (!prev) return null;
                                      const updatedSigs = [...(prev.signatures || []), { id: 'sys-' + Date.now(), userName: 'Carlos Roberto', role: 'Síndico', date: new Date().toISOString() }];
                                      const updatedStatus = updatedSigs.length >= 3 ? 'VALIDATED' : prev.status;
                                      return { ...prev, signatures: updatedSigs, status: updatedStatus };
                                    });
                                  }}
                                  className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" />
                                  Assinar
                                </button>
                                <button
                                  onClick={() => {
                                    rejectDigitalFolderItem(selectedDoc.id);
                                    toast.error('Documento rejeitado pelo gestor.');
                                    setSelectedDoc(prev => prev ? { ...prev, status: 'REJECTED' } : null);
                                  }}
                                  className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/30 text-rose-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                  <X className="w-4 h-4" />
                                  Rejeitar
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                toast.success('Gerando cópia impressa homologada e autenticada...');
                              }}
                              className="w-full py-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Baixar Cópia Autenticada
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </>
          );
        })()}

      </div>
    </div>
  );
}
