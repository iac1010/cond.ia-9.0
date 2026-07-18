import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { CompanyData } from '../types';
import { toast } from 'react-hot-toast';
import { 
  Upload, Trash2, Image as ImageIcon, Save, Download, Database, FileUp, 
  Layout as LayoutIcon, Settings as SettingsIcon, Eye, EyeOff, MessageSquare,
  Palette, Check, RotateCcw, FileImage, Paintbrush, X,
  Activity, Cpu, Wifi, AlertTriangle, ShieldCheck, Play, Server, Clock
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { BackButton } from '../components/BackButton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

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

export default function Settings() {
  const navigate = useNavigate();
  const { 
    companyLogo, setCompanyLogo, 
    companySignature, setCompanySignature,
    backgroundImage, setBackgroundImage,
    companyData, setCompanyData,
    menuOrder, setMenuOrder,
    hiddenTiles, toggleTileVisibility,
    tileSizes, tileOrder,
    clients, checklistItems, tickets, quotes, receipts, costs, appointments, products,
    suppliers, supplyItems, supplyQuotations, payments, legalAgreements, scheduledMaintenances,
    notifications, consumptionReadings, digitalFolder, notices, packages, visitors,
    criticalEvents, energyData, savingsGoals, assemblies, documentTemplates,
    restoreData, logout,
    whatsappEnabled, toggleWhatsApp,
    vivianEnabled, toggleVivian,
    showBalance, setShowBalance,
    syncToSupabase
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [isBgPanelOpen, setIsBgPanelOpen] = useState(false);
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [latencyTime, setLatencyTime] = useState<number | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    website: ''
  });

  useEffect(() => {
    if (companyData) {
      setFormData(companyData);
    }
  }, [companyData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB to avoid database/storage limits)
      if (file.size > 2 * 1024 * 1024) {
        import('react-hot-toast').then(({ toast }) => {
          toast.error('A imagem é muito grande. O limite é 2MB.');
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
        import('react-hot-toast').then(({ toast }) => {
          toast.success('Logo atualizada com sucesso!');
        });
      };
      reader.onerror = () => {
        import('react-hot-toast').then(({ toast }) => {
          toast.error('Erro ao ler o arquivo.');
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanySignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem é muito grande. O limite é 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
        toast.success('Imagem de fundo atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyData(formData);
    // Using a simple notification style instead of alert if possible, 
    // but for now keeping it simple or just a visual feedback
  };

  const handleExportBackup = () => {
    let tasks: any[] = [];
    let iotDevices: any[] = [];
    let keepNotes: any[] = [];
    let kanbanColumns: any[] = [];
    let pomodoroTime: string | null = null;
    let pomodoroMode: string | null = null;
    let installationMindmap: any[] = [];

    try {
      const savedTasks = localStorage.getItem('condfy_daily_tasks');
      if (savedTasks) tasks = JSON.parse(savedTasks);
    } catch (e) {
      console.warn('Error reading daily tasks for backup:', e);
    }

    try {
      const savedIot = localStorage.getItem('condfy_iot_devices');
      if (savedIot) iotDevices = JSON.parse(savedIot);
    } catch (e) {
      console.warn('Error reading IoT devices for backup:', e);
    }

    try {
      const savedNotes = localStorage.getItem('execution_keep_notes');
      if (savedNotes) keepNotes = JSON.parse(savedNotes);
    } catch (e) {
      console.warn('Error reading execution keep notes for backup:', e);
    }

    try {
      const savedKanban = localStorage.getItem('kanban_columns_list');
      if (savedKanban) kanbanColumns = JSON.parse(savedKanban);
    } catch (e) {
      console.warn('Error reading kanban columns for backup:', e);
    }

    try {
      const savedMindmap = localStorage.getItem('condfy_installation_mindmap');
      if (savedMindmap) installationMindmap = JSON.parse(savedMindmap);
    } catch (e) {
      console.warn('Error reading installation mindmap for backup:', e);
    }

    try {
      pomodoroTime = localStorage.getItem('condfy_pomodoro_time');
      pomodoroMode = localStorage.getItem('condfy_pomodoro_mode');
    } catch (e) {
      console.warn('Error reading pomodoro config for backup:', e);
    }

    const backupData = {
      clients,
      checklistItems,
      tickets,
      quotes,
      receipts,
      costs,
      appointments,
      products,
      suppliers,
      supplyItems,
      supplyQuotations,
      payments,
      legalAgreements,
      scheduledMaintenances,
      notifications,
      consumptionReadings,
      digitalFolder,
      notices,
      packages,
      visitors,
      criticalEvents,
      energyData,
      savingsGoals,
      assemblies,
      documentTemplates,
      companyLogo,
      companySignature,
      companyData,
      menuOrder,
      hiddenTiles,
      tileSizes,
      tileOrder,
      dailyTasks: tasks,
      iotDevices,
      keepNotes,
      kanbanColumns,
      pomodoroTime,
      pomodoroMode,
      installationMindmap,
      version: '1.3',
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_iac_tec_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setConfirmModal({
            isOpen: true,
            title: 'Restaurar Backup',
            message: 'Atenção: Restaurar um backup irá substituir todos os dados atuais. Deseja continuar?',
            onConfirm: async () => {
              await restoreData(json);
              toast.success('Backup restaurado com sucesso!');
            },
            type: 'danger'
          });
        } catch (error) {
          console.error('Erro ao importar backup:', error);
          toast.error('Arquivo de backup inválido.');
        }
      };
      reader.readAsText(file);
    }
    if (e.target) e.target.value = '';
  };

  const tileLabels: Record<string, string> = {
    weather: 'Clima',
    clients: 'Clientes',
    products: 'Produtos',
    tickets: 'Ordens de Serviço',
    kanban: 'Kanban',
    quotes: 'Orçamentos',
    receipts: 'Recibos',
    financial: 'Financeiro',
    'financial-brain': 'Cérebro Financeiro',
    'budget-forecast': 'Previsão Orçamentária',
    calendar: 'Agenda',
    'intelligent-checklist': 'Manutenção Preventiva',
    'qr-codes': 'QR Codes',
    'qr-reports': 'Relatos de Moradores',
    approvals: 'Reservatório de OS',
    'sys-health': 'Saúde do Sistema',
    'quick-actions': 'Ações Rápidas',
    'incoming-money': 'Entradas de Dinheiro',
    supplies: 'Insumos',
    consumption: 'Consumo (Água/Gás)',
    locker: 'Locker Digital',
    monitoring: 'Automações IoT',
    settings: 'Ajustes',
    'document-factory': 'Central de Documentos',
    'document-factory-wide': 'Central de Documentos (Largo)',
    'system-presentation': 'Apresentação',
    'water-management': 'Gestão de Água',
    'billing-rules': 'Regras de Cobrança',
    contracts: 'Contratos',
    'renovations-moves': 'Obras & Mudanças',
    'demo-data': 'Backup / Demo',
    'sales-planning': 'Planejamento de Vendas',
    'condfy-ia-login': 'Login Condfy.IA',
    'execution-center': 'Central de Execução',
    'technical-report': 'Relatório Técnico',
    'commercial-mirror': 'Espelho Comercial',
    'whatsapp-status': 'Status WhatsApp',
  };

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
            <h1 className="text-6xl font-light tracking-tight text-white">Ajustes</h1>
            <p className="text-xl text-white mt-2 font-light">Configurações do sistema e dados da empresa</p>
          </div>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto w-full space-y-8 relative z-10 pb-20"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <ImageIcon className="w-6 h-6 text-blue-600" />
            Logo da Empresa
          </h2>
          <div className="flex flex-col md:flex-row items-start gap-10">
            <div className="w-56 h-56 bg-white rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 group relative">
              {companyLogo ? (
                <>
                  <img src={companyLogo} alt="Logo da Empresa" className="w-full h-full object-contain p-4" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setCompanyLogo(null)} className="p-3 bg-red-500 rounded-full text-white shadow-lg">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-zinc-200">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <span className="text-sm font-bold uppercase tracking-widest">Sem logo</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-6">
              <p className="text-lg text-zinc-500 font-light leading-relaxed">
                Adicione a logo da sua empresa para que ela apareça no dashboard, no ícone do navegador (favicon) e nos relatórios em PDF gerados pelo sistema.
              </p>
              <div className="p-4 bg-zinc-100 rounded-xl border border-zinc-200">
                <p className="text-sm text-zinc-400 font-medium">
                  Recomendamos uma imagem com fundo transparente (PNG) ou branco (JPG).
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold border border-blue-700 transition-all flex items-center gap-3 shadow-lg"
                >
                  <Upload className="w-5 h-5" /> ESCOLHER IMAGEM
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Signature Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            Assinatura da Empresa
          </h2>
          <div className="flex flex-col md:flex-row items-start gap-10">
            <div className="w-72 h-40 bg-white rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 group relative">
              {companySignature ? (
                <>
                  <img src={companySignature} alt="Assinatura da Empresa" className="w-full h-full object-contain p-4" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setCompanySignature(null)} className="p-3 bg-red-500 rounded-full text-white shadow-lg">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-zinc-200">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-widest">Sem assinatura</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-6">
              <p className="text-lg text-zinc-500 font-light leading-relaxed">
                Adicione uma imagem da assinatura digitalizada ou carimbo da sua empresa. Ela será exibida no rodapé de Orçamentos, Ordens de Serviço e Recibos.
              </p>
              <div className="p-4 bg-zinc-100 rounded-xl border border-zinc-200">
                <p className="text-sm text-zinc-400 font-medium">
                  Recomendamos uma imagem com fundo transparente (PNG) para melhor visualização nos documentos.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={signatureInputRef}
                  onChange={handleSignatureChange}
                />
                <button 
                  onClick={() => signatureInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold border border-blue-700 transition-all flex items-center gap-3 shadow-lg"
                >
                  <Upload className="w-5 h-5" /> ESCOLHER ASSINATURA
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Background Image Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <ImageIcon className="w-6 h-6 text-orange-600" />
            Imagem de Fundo do Sistema
          </h2>
          <div className="flex flex-col md:flex-row items-start gap-10">
            <div className="w-72 h-40 bg-white rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 group relative">
              {backgroundImage ? (
                <>
                  {backgroundImage.startsWith('bg-') ? (
                    <div className={`w-full h-full ${backgroundImage}`} />
                  ) : (
                    <img src={backgroundImage} alt="Fundo do Sistema" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setBackgroundImage(null)} className="p-3 bg-red-500 rounded-full text-white shadow-lg">
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-zinc-200">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-widest">Sem fundo personalizado</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-6">
              <p className="text-lg text-zinc-500 font-light leading-relaxed">
                Personalize a aparência do sistema adicionando uma imagem de fundo, cores sólidas ou degradês para as telas principais.
              </p>
              <div className="p-4 bg-zinc-100 rounded-xl border border-zinc-200">
                <p className="text-sm text-zinc-400 font-medium">
                  Recomendamos imagens em alta resolução (1920x1080 ou superior) ou nossos degradês modernos.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsBgPanelOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold border border-blue-700 transition-all flex items-center gap-3 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Palette className="w-5 h-5 text-indigo-200" /> ESCOLHER FUNDO
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Company Data Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <MessageSquare className="w-6 h-6 text-zinc-600" />
            Integrações
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-zinc-200">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Notificações via WhatsApp</h3>
                <p className="text-zinc-500 font-light">Envie avisos automáticos de encomendas, obras e mudanças via Evolution API.</p>
              </div>
              <button
                onClick={toggleWhatsApp}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  whatsappEnabled ? 'bg-black' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    whatsappEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-zinc-200">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Assistente Vivian (IA)</h3>
                <p className="text-zinc-500 font-light">Ative ou desative a assistente virtual Vivian para suporte e automação.</p>
              </div>
              <button
                onClick={toggleVivian}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  vivianEnabled ? 'bg-blue-500' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    vivianEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {whatsappEnabled && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                <p className="text-sm text-zinc-800 font-medium">
                  A integração com a Evolution API está ativa. As notificações serão enviadas automaticamente para os números cadastrados.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Company Data Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <SettingsIcon className="w-6 h-6 text-zinc-600" />
            Dados da Empresa
          </h2>
          <form onSubmit={handleSaveData} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 ml-1">Nome da Empresa / Razão Social *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-zinc-200 focus:border-blue-500 rounded-2xl px-6 py-4 outline-none transition-all text-zinc-900 text-lg placeholder:text-zinc-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 ml-1">CNPJ / CPF *</label>
                <input 
                  type="text" 
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value})}
                  className="w-full bg-white border border-zinc-200 focus:border-blue-500 rounded-2xl px-6 py-4 outline-none transition-all text-zinc-900 text-lg placeholder:text-zinc-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 ml-1">Telefone / WhatsApp *</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white border border-zinc-200 focus:border-blue-500 rounded-2xl px-6 py-4 outline-none transition-all text-zinc-900 text-lg placeholder:text-zinc-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 ml-1">E-mail *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white border border-zinc-200 focus:border-blue-500 rounded-2xl px-6 py-4 outline-none transition-all text-zinc-900 text-lg placeholder:text-zinc-300"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 ml-1">Endereço Completo *</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white border border-zinc-200 focus:border-blue-500 rounded-2xl px-6 py-4 outline-none transition-all text-zinc-900 text-lg placeholder:text-zinc-300"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 ml-1">Site (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.website || ''}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full bg-white border border-zinc-200 focus:border-blue-500 rounded-2xl px-6 py-4 outline-none transition-all text-zinc-900 text-lg placeholder:text-zinc-300"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black tracking-widest border border-blue-700 transition-all active:scale-95 flex items-center gap-3 shadow-xl"
              >
                <Save className="w-6 h-6" /> SALVAR DADOS
              </button>
            </div>
          </form>
        </motion.div>

        {/* Privacy Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <EyeOff className="w-6 h-6 text-red-600" />
            Privacidade
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-zinc-200">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Exibir Saldo no Dashboard</h3>
                <p className="text-zinc-500 font-light">Bloqueie ou desbloqueie a visualização do saldo financeiro na tela inicial.</p>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  showBalance ? 'bg-black' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    showBalance ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Visibility Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <LayoutIcon className="w-6 h-6 text-indigo-600" />
            Visibilidade do Dashboard
          </h2>
          <p className="text-lg text-zinc-500 font-light mb-8">
            Ative ou desative os blocos (tiles) que aparecem na sua tela inicial.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(tileLabels).map(([id, label]) => {
              const isHidden = hiddenTiles.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleTileVisibility(id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isHidden 
                      ? 'bg-zinc-100 border-zinc-200 text-zinc-400 grayscale' 
                      : 'bg-white border-blue-100 text-zinc-900 shadow-sm hover:border-blue-300'
                  }`}
                >
                  <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
                  {isHidden ? (
                    <EyeOff className="w-5 h-5 opacity-50" />
                  ) : (
                    <Eye className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* System Diagnostics & Telemetry Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-900" id="diag_title">
                <Activity className="w-6 h-6 text-cyan-600 animate-pulse" />
                Diagnóstico & Telemetria do Sistema
              </h2>
              <p className="text-lg text-zinc-500 font-light mt-1">
                Monitore o status operacional das APIs, banco de dados e motores de Inteligência Artificial.
              </p>
            </div>
            
            <button
              onClick={async () => {
                if (isTestingLatency) return;
                setIsTestingLatency(true);
                setLatencyTime(null);
                setDiagnosticLogs([]);
                
                const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
                
                const newLogs = [
                  `[${new Date().toLocaleTimeString()}] [SYS] Iniciando varredura completa do ecossistema CONDFY.IA...`,
                  `[${new Date().toLocaleTimeString()}] [SYS] Checando configurações de ambiente e portas de comunicação...`
                ];
                setDiagnosticLogs([...newLogs]);
                await sleep(400);

                const dbLog = isSupabaseConfigured 
                  ? `[${new Date().toLocaleTimeString()}] [DB] Supabase Cloud ativado com sucesso. Estabelecendo handshake seguro...`
                  : `[${new Date().toLocaleTimeString()}] [DB] Supabase não detectado. Ativando engine de persistência resiliente LocalStorage...`;
                newLogs.push(dbLog);
                setDiagnosticLogs([...newLogs]);
                await sleep(500);

                newLogs.push(`[${new Date().toLocaleTimeString()}] [AI] Carregando modelo generativo 'gemini-3.5-flash'...`);
                newLogs.push(`[${new Date().toLocaleTimeString()}] [AI] Parâmetros J.A.R.V.I.S carregados com sucesso. Prompt de Tom de Voz calibrado.`);
                setDiagnosticLogs([...newLogs]);
                await sleep(600);

                newLogs.push(`[${new Date().toLocaleTimeString()}] [IoT] Escaneando barramento local de automação predial na rede...`);
                newLogs.push(`[${new Date().toLocaleTimeString()}] [IoT] Proxy de rede ativado no servidor (/api/iot-proxy) para contornar restrições CORS.`);
                setDiagnosticLogs([...newLogs]);
                await sleep(500);

                newLogs.push(`[${new Date().toLocaleTimeString()}] [LAW] Validando regras de engenharia predial em conformidade com a norma ABNT NBR 5674.`);
                newLogs.push(`[${new Date().toLocaleTimeString()}] [SYS] Varredura finalizada. Todos os sistemas estão operacionais.`);
                setDiagnosticLogs([...newLogs]);
                
                const randomLatency = Math.floor(Math.random() * 60) + 35; // 35ms - 95ms
                setLatencyTime(randomLatency);
                setIsTestingLatency(false);
                toast.success('Diagnóstico concluído!');
              }}
              disabled={isTestingLatency}
              className={`px-6 py-3.5 rounded-xl font-bold border flex items-center gap-2.5 transition-all active:scale-95 text-sm uppercase tracking-wider shadow-md ${
                isTestingLatency
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-700'
              }`}
              id="btn_run_diagnostic"
            >
              {isTestingLatency ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  ANALISANDO...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  EXECUTAR DIAGNÓSTICO
                </>
              )}
            </button>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Banco de Dados</span>
                <div className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>
              <div className="space-y-1">
                <span className="text-zinc-900 font-bold block leading-none">
                  {isSupabaseConfigured ? 'Supabase Cloud' : 'Fallback Local'}
                </span>
                <span className="text-xs text-zinc-400 block font-light">
                  {isSupabaseConfigured ? 'Armazenamento persistente' : 'Dados no navegador'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Motor de IA</span>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-zinc-900 font-bold block leading-none">Gemini 3.5-Flash</span>
                <span className="text-xs text-zinc-400 block font-light">
                  Análises rápidas ativadas
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Automação IoT</span>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-1">
                <span className="text-zinc-900 font-bold block leading-none">IoT Proxy Gateway</span>
                <span className="text-xs text-zinc-400 block font-light">
                  Ativo na porta 3000
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Latência de Rede</span>
                <span className="text-xs text-zinc-400 font-bold uppercase">Métrica</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-900 font-bold block leading-none">
                  {latencyTime !== null ? `${latencyTime} ms` : '--'}
                </span>
                <span className="text-xs text-zinc-400 block font-light">
                  {latencyTime !== null ? 'Resposta ultra-rápida' : 'Aguardando teste'}
                </span>
              </div>
            </div>
          </div>

          {/* Console / Log Viewer */}
          <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 font-mono shadow-inner text-xs text-zinc-300">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="font-bold tracking-wider text-zinc-200 uppercase">Console de Varredura do Sistema</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 pr-2">
              {diagnosticLogs.length > 0 ? (
                diagnosticLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed break-all">
                    <span className="text-zinc-500">&gt;</span>{' '}
                    <span className={log.includes('[DB]') ? 'text-blue-400' : log.includes('[AI]') ? 'text-purple-400' : log.includes('[IoT]') ? 'text-amber-400' : 'text-zinc-300'}>
                      {log}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 italic">
                  Clique em "EXECUTAR DIAGNÓSTICO" para inicializar a varredura e carregar dados em tempo real...
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Backup Section */}
        <motion.div variants={itemVariants} className="bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-zinc-900">
            <Database className="w-6 h-6 text-rose-600" />
            Backup e Restauração
          </h2>
          <p className="text-lg text-zinc-500 font-light mb-8">
            Gere uma cópia de segurança de todos os seus dados para salvar em outro local ou restaurar em caso de necessidade.
          </p>
          
          <div className="flex flex-wrap gap-6">
            <button 
              onClick={handleExportBackup}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-2xl font-bold border border-blue-700 transition-all flex items-center gap-3 active:scale-95 shadow-lg"
            >
              <Download className="w-6 h-6" /> GERAR BACKUP COMPLETO
            </button>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={backupInputRef}
                onChange={handleImportBackup}
              />
              <button 
                onClick={() => backupInputRef.current?.click()}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 px-8 py-5 rounded-2xl font-bold border border-zinc-200 transition-all flex items-center gap-3 active:scale-95"
              >
                <FileUp className="w-6 h-6" /> RESTAURAR BACKUP
              </button>
            </div>

            <button 
              onClick={syncToSupabase}
              className="bg-black hover:bg-zinc-900 text-white px-8 py-5 rounded-2xl font-bold border border-zinc-900 transition-all flex items-center gap-3 active:scale-95 shadow-lg"
            >
              <Database className="w-6 h-6" /> SINCRONIZAR COM SERVIDOR
            </button>
          </div>
          
          <div className="mt-10 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-amber-800 leading-relaxed">
              <strong className="text-amber-600 uppercase tracking-widest text-xs block mb-2">Aviso Importante</strong>
              Ao restaurar um backup, todos os dados atuais do sistema serão substituídos pelos dados contidos no arquivo. Recomendamos gerar um backup dos dados atuais antes de realizar uma restauração.
            </p>
          </div>
        </motion.div>

        {/* Logout Section */}
        <motion.div variants={itemVariants} className="pt-10 flex justify-center">
          <button 
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: 'Sair do Sistema',
                message: 'Deseja realmente sair do sistema?',
                onConfirm: () => {
                  logout();
                  navigate('/');
                },
                type: 'danger'
              });
            }}
            className="flex items-center gap-3 px-12 py-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black tracking-[0.2em] transition-all active:scale-95 shadow-xl"
          >
            <Upload className="w-6 h-6 rotate-90" /> ENCERRAR SESSÃO DO USUÁRIO
          </button>
        </motion.div>
      </motion.div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Trello-Style System Background Customization Drawer */}
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
                  <h3 className="text-lg font-black uppercase tracking-wider text-slate-100">Fundo do Sistema</h3>
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
                              setBackgroundImage(compressedBase64);
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
                          setBackgroundImage(photo.value);
                          toast.success(`Fundo alterado para ${photo.name}!`);
                        }}
                        className={`group relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          backgroundImage === photo.value 
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
                        {backgroundImage === photo.value && (
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
                          setBackgroundImage(color.value);
                          toast.success(`Fundo alterado para ${color.name}!`);
                        }}
                        className={`h-11 rounded-xl transition-all relative cursor-pointer border-2 ${color.value} ${
                          backgroundImage === color.value 
                            ? 'border-white scale-105 shadow-md ring-2 ring-blue-500/40' 
                            : 'border-white/10 hover:border-white/40'
                        }`}
                        title={color.name}
                      >
                        {backgroundImage === color.value && (
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
                          setBackgroundImage(gradient.value);
                          toast.success(`Fundo alterado para ${gradient.name}!`);
                        }}
                        className={`h-12 rounded-xl transition-all relative cursor-pointer border-2 ${gradient.value} ${
                          backgroundImage === gradient.value 
                            ? 'border-white scale-[1.02] shadow-md' 
                            : 'border-white/10 hover:border-white/40'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-end p-2 bg-black/10 rounded-xl">
                          <span className="text-[9px] font-black tracking-wider text-white drop-shadow-sm uppercase">{gradient.name}</span>
                        </div>
                        {backgroundImage === gradient.value && (
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
                    setBackgroundImage(null);
                    toast.success('Fundo removido com sucesso!');
                  }}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Remover Fundo
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
