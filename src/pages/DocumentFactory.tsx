import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { 
  FileText, 
  Download, 
  Search, 
  ShieldCheck, 
  Gavel, 
  FileSignature, 
  Scale,
  BookOpen,
  Copy,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  LayoutGrid,
  FilePlus,
  Upload,
  CheckCircle2,
  FileEdit,
  Eye,
  Printer,
  User,
  Clock,
  PenTool,
  Check,
  Sparkles,
  Filter,
  ArrowRight,
  ChevronRight,
  Fingerprint,
  FileCheck2,
  AlertCircle,
  ShieldAlert,
  History,
  Share2,
  HelpCircle,
  CheckCircle,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/Modal';
import { generatePdf } from '../utils/pdfGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const INITIAL_TEMPLATES = [
  {
    title: 'Ata de Assembleia Geral Ordinária',
    category: 'Assembleia',
    description: 'Documento completo para registro de assembleias ordinárias, incluindo prestação de contas e eleição.',
    legalBasis: 'Código Civil Art. 1.350',
    content: 'Aos [DIA] dias do mês de [MÊS] de [ANO], às [HORA], em primeira convocação...'
  },
  {
    title: 'Edital de Convocação de Assembleia',
    category: 'Assembleia',
    description: 'Edital padrão para convocação de condôminos com todos os requisitos legais.',
    legalBasis: 'Código Civil Art. 1.354',
    content: 'Pelo presente edital, ficam convocados todos os senhores condôminos do Edifício [NOME]...'
  },
  {
    title: 'Regimento Interno',
    category: 'Governança',
    description: 'Estrutura base para regimento interno, adaptável para diferentes perfis de condomínio.',
    legalBasis: 'Código Civil Art. 1.334, V',
    content: 'CAPÍTULO I - DO EDIFÍCIO E SEUS FINS. Art. 1º - O Edifício [NOME] destina-se exclusivamente...'
  },
  {
    title: 'Contrato de Prestação de Serviços',
    category: 'Contratos',
    description: 'Contrato completo para contratação de serviços de manutenção, conservação ou reformas.',
    legalBasis: 'Código Civil Art. 593 a 609',
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: Condomínio [NOME DO CONDOMÍNIO], inscrito no CNPJ sob o nº [CNPJ DO CONDOMÍNIO], situado à [ENDEREÇO DO CONDOMÍNIO], neste ato representado por seu síndico(a) [NOME DO SÍNDICO].

CONTRATADA: [NOME DA EMPRESA/PRESTADOR], inscrito no CNPJ/CPF sob o nº [CNPJ/CPF DA CONTRATADA], situado à [ENDEREÇO DA CONTRATADA].

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes:

CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem como objeto a prestação de serviços de [DESCRIÇÃO DETALHADA DO SERVIÇO] nas dependências do CONTRATANTE.

CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO
Pela prestação dos serviços ora contratados, o CONTRATANTE pagará à CONTRATADA a quantia total de R$ [VALOR TOTAL], dividida em [NÚMERO DE PARCELAS] parcelas de R$ [VALOR DA PARCELA].

CLÁUSULA TERCEIRA - DO PRAZO
O prazo para a execução dos serviços será de [PRAZO DE EXECUÇÃO], com início em [DATA DE INÍCIO] e término previsto para [DATA DE TÉRMINO].

CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA obriga-se a executar os serviços com zelo, técnica e materiais de qualidade, responsabilizando-se por quaisquer danos causados ao patrimônio do CONTRATANTE ou a terceiros.

CLÁUSULA QUINTA - DO FORO
Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro da comarca de [CIDADE/ESTADO].

E, por estarem assim justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual teor.

[CIDADE], [DIA] de [MÊS] de [ANO].`
  },
  {
    title: 'Notificação de Infração e Multa',
    category: 'Convivência',
    description: 'Documento de notificação para unidades infratoras, respeitando o direito de defesa.',
    legalBasis: 'Código Civil Art. 1.336 e 1.337',
    content: 'Prezado(a) Senhor(a) Morador(a) da Unidade [NÚMERO]. Vimos por meio desta notificar que...'
  },
  {
    title: 'Procuração para Assembleia',
    category: 'Assembleia',
    description: 'Documento de procuração com poderes específicos para representação em assembleia.',
    legalBasis: 'Código Civil Art. 653',
    content: 'OUTORGANTE: [NOME]. OUTORGADO: [NOME]. PODERES: Representar o outorgante na assembleia...'
  }
];

export default function DocumentFactory() {
  const navigate = useNavigate();
  const { 
    documentTemplates, 
    addDocumentTemplate, 
    updateDocumentTemplate, 
    deleteDocumentTemplate,
    clients,
    companyLogo,
    companyData,
    companySignature,
    digitalFolder,
    addDigitalFolderItem,
    validateDigitalFolderItem,
    rejectDigitalFolderItem
  } = useStore();

  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'approvals'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fillingTemplate, setFillingTemplate] = useState<any | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = React.useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    legalBasis: '',
    content: '',
    fileUrl: ''
  });

  // Approvals view states
  const [selectedManager, setSelectedManager] = useState({ name: 'Carlos Silva', role: 'Síndico Geral' });
  const [signingItem, setSigningItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  
  // Signature pad states
  const [signatureType, setSignatureType] = useState<'type' | 'draw'>('type');
  const [typedName, setTypedName] = useState('Carlos Silva');
  const [inkColor, setInkColor] = useState('#1e3a8a'); // dark blue
  const [isAgreed, setIsAgreed] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Seed initial templates if none exist
  useEffect(() => {
    if (documentTemplates.length === 0) {
      INITIAL_TEMPLATES.forEach(t => addDocumentTemplate(t));
    }
  }, [documentTemplates.length, addDocumentTemplate]);

  // Seed digital folder items for signature/approval simulation if none exist
  useEffect(() => {
    if (digitalFolder.length === 0 && clients.length > 0) {
      const defaultClient = clients[0]?.id || 'system';
      
      const seedItems = [
        {
          clientId: defaultClient,
          title: 'Ata da Assembleia Geral Ordinária #124',
          description: 'Ata de eleição de corpo diretivo, homologação do regimento de piscina e aprovação das contas do exercício anterior.',
          category: 'Assembleia',
          fileUrl: '',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          clientId: defaultClient,
          title: 'Contrato de Reforma e Pintura da Fachada',
          description: 'Contrato comercial para reforma estrutural, impermeabilização de calhas e pintura das fachadas dos Blocos A e B.',
          category: 'Contratos',
          fileUrl: '',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          clientId: defaultClient,
          title: 'Notificação de Infração Unidade 102 - Barulho Recorrente',
          description: 'Notificação de aplicação de multa administrativa decorrente de perturbação do sossego após as 22h.',
          category: 'Convivência',
          fileUrl: '',
          date: new Date().toISOString(),
        }
      ];

      const runSeed = async () => {
        if (localStorage.getItem('did_seed_approvals_v2')) return;
        localStorage.setItem('did_seed_approvals_v2', 'true');

        // Insert seed items
        for (const item of seedItems) {
          await addDigitalFolderItem(item);
        }
        
        // Simular que Mariana Costa assinou o Contrato para dar realismo de progresso
        setTimeout(() => {
          const items = useStore.getState().digitalFolder;
          const target = items.find(i => i.title.includes('Contrato'));
          if (target) {
            validateDigitalFolderItem(target.id, 'Mariana Costa', 'Subsíndica');
          }
        }, 800);
      };

      runSeed();
    }
  }, [digitalFolder.length, clients, addDigitalFolderItem, validateDigitalFolderItem]);

  // Drawing event handlers for interactive signature pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getDocumentBodyPreview = (item: any) => {
    const template = documentTemplates.find(t => 
      item.title.toLowerCase().includes(t.title.toLowerCase()) || 
      t.title.toLowerCase().includes(item.title.toLowerCase())
    );
    if (template) {
      return template.content;
    }
    
    return `CONDOMÍNIO RESIDENCIAL CONDFY
  
INSTRUMENTO DE HOMOLOGAÇÃO E REGISTRO INTERNO

Título: ${item.title}
Categoria: ${item.category}
Data de Emissão: ${new Date(item.date).toLocaleDateString('pt-BR')}
Status: ${item.status === 'VALIDATED' ? 'CONCLUÍDO E HOMOLOGADO' : item.status === 'REJECTED' ? 'REJEITADO PELO CORPO DIRETIVO' : 'EM PROCESSO DE ASSINATURA'}

Descrição do Objeto:
${item.description}

Pelo presente instrumento, o corpo diretivo do condomínio, no uso de suas atribuições legais concedidas pela Convenção Geral do Condomínio e em consonância com o Código Civil Brasileiro, declara e valida a necessidade de execução, registro e arquivamento deste ato documental para todos os fins de direito.

O presente ato entra em vigor imediatamente após a coleta de todas as assinaturas necessárias de forma digital, registrando o carimbo de tempo (timestamp) e os dados de validação de cada signatário.

Cidade do Rio de Janeiro, ${new Date(item.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
  };

  const handleConfirmSignature = () => {
    if (!isAgreed) {
      toast.error('Você precisa aceitar os termos de compromisso de assinatura digital.');
      return;
    }
    
    validateDigitalFolderItem(signingItem.id, selectedManager.name, selectedManager.role);
    setSigningItem(null);
  };

  const categories = ['Todos', ...new Set(documentTemplates.map(t => t.category))];

  const filteredTemplates = documentTemplates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Conteúdo copiado!');
  };

  const handleDownload = (template: any) => {
    if (template.fileUrl) {
      const link = document.createElement('a');
      link.href = template.fileUrl;
      link.download = `${template.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      handleFill(template);
    }
  };

  const handleFill = (template: any) => {
    const fields = extractFields(template.content);
    const initialValues: Record<string, string> = {};
    fields.forEach(field => {
      initialValues[field] = '';
    });
    setFieldValues(initialValues);
    setSelectedClient('');
    setFillingTemplate(template);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    setFieldValues(prev => {
      const newValues = { ...prev };
      Object.keys(newValues).forEach(field => {
        const lowerField = field.toLowerCase();
        if (lowerField.includes('nome') && !lowerField.includes('síndico') && !lowerField.includes('empresa')) {
          newValues[field] = client.name;
        } else if (lowerField.includes('cnpj') || lowerField.includes('cpf') || lowerField.includes('documento')) {
          newValues[field] = client.document || '';
        } else if (lowerField.includes('endereço') || lowerField.includes('endereco')) {
          newValues[field] = client.address || '';
        } else if (lowerField.includes('telefone')) {
          newValues[field] = client.phone || '';
        } else if (lowerField.includes('email')) {
          newValues[field] = client.email || '';
        }
      });
      return newValues;
    });
    toast.success('Campos preenchidos com os dados do cliente!');
  };

  const extractFields = (content: string) => {
    const regex = /\[(.*?)\]/g;
    const fields = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      fields.add(match[1]);
    }
    return Array.from(fields);
  };

  const getFilledContent = () => {
    if (!fillingTemplate) return '';
    return fillingTemplate.content.replace(/\[(.*?)\]/g, (match: string, p1: string) => {
      return fieldValues[p1] || `[${p1}]`;
    });
  };

  const handleGeneratePDF = async () => {
    if (!printRef.current || !fillingTemplate) return;
    setIsGenerating(true);
    try {
      const pdfUrl = await generatePdf(printRef.current, `${fillingTemplate.title}_${format(new Date(), 'dd_MM_yyyy')}`);
      
      // Se um cliente foi selecionado, salva na pasta digital dele
      if (selectedClient) {
        useStore.getState().addDigitalFolderItem({
          clientId: selectedClient,
          title: fillingTemplate.title,
          description: `Documento gerado a partir do modelo: ${fillingTemplate.title}`,
          category: fillingTemplate.category,
          fileUrl: pdfUrl || '',
          date: new Date().toISOString()
        });
        toast.success('Documento gerado e salvo na pasta digital do cliente!');
      } else {
        toast.success('Documento gerado com sucesso!');
      }
      
      setFillingTemplate(null);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.content) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (editingId) {
      await updateDocumentTemplate(editingId, formData);
    } else {
      await addDocumentTemplate(formData);
    }

    resetForm();
    setActiveTab('list');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      description: '',
      legalBasis: '',
      content: '',
      fileUrl: ''
    });
    setEditingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64
        toast.error('Arquivo muito grande. Máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, fileUrl: reader.result as string }));
        toast.success('Arquivo carregado com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (template: any) => {
    setFormData({
      title: template.title,
      category: template.category,
      description: template.description,
      legalBasis: template.legalBasis,
      content: template.content,
      fileUrl: template.fileUrl || ''
    });
    setEditingId(template.id);
    setActiveTab('form');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      await deleteDocumentTemplate(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <BackButton variant="solid" iconSize={6} />
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                <FileSignature className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                Central de Documentos
              </h1>
              <p className="text-xs md:text-base text-slate-500 dark:text-zinc-400 font-medium">Documentos prontos para o dia a dia do síndico</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab('list'); resetForm(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-xs md:text-sm ${
                activeTab === 'list' 
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Modelos
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-xs md:text-sm ${
                activeTab === 'form' 
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              {editingId ? 'Editar Modelo' : 'Criar Modelo'}
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-xs md:text-sm relative ${
                activeTab === 'approvals' 
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Assinaturas</span>
              {digitalFolder.filter(i => i.status === 'PENDING').length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-md shadow-blue-500/30 animate-pulse">
                  {digitalFolder.filter(i => i.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Lado Esquerdo: Sidebar de Filtros, Categorias e Status de Governança */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">Categorias</h3>
                </div>

                <div className="space-y-1.5">
                  {categories.map(cat => {
                    // Contar quantos templates existem nesta categoria
                    const count = cat === 'Todos' 
                      ? documentTemplates.length 
                      : documentTemplates.filter(t => t.category === cat).length;
                    
                    const isSelected = selectedCategory === cat;
                    
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left font-bold text-xs md:text-sm transition-all group ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                            : 'bg-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`p-1.5 rounded-lg transition-colors ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 group-hover:text-blue-600'
                          }`}>
                            {cat === 'Todos' && <LayoutGrid className="w-4 h-4" />}
                            {cat === 'Assembleia' && <Gavel className="w-4 h-4" />}
                            {cat === 'Governança' && <ShieldCheck className="w-4 h-4" />}
                            {cat === 'Contratos' && <PenTool className="w-4 h-4" />}
                            {cat === 'Convivência' && <FileText className="w-4 h-4" />}
                            {cat !== 'Todos' && cat !== 'Assembleia' && cat !== 'Governança' && cat !== 'Contratos' && cat !== 'Convivência' && <BookOpen className="w-4 h-4" />}
                          </span>
                          <span className="truncate">{cat}</span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card de Apoio Jurídico / Auditoria */}
              <div className="bg-gradient-to-br from-slate-900 to-zinc-900 rounded-[2rem] p-6 border border-slate-800/80 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Scale className="w-5 h-5 text-blue-400" />
                    <h4 className="font-black text-xs uppercase tracking-wider text-blue-400">Suporte Jurídico</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium mb-4">
                    Modelos em total conformidade com o <strong>Código Civil Brasileiro (Lei 10.406/02)</strong> e leis condominiais atualizadas.
                  </p>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 font-bold max-w-max">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Atualizado Mensalmente
                  </div>
                </div>
              </div>

              {/* Card de Atividades de Assinaturas */}
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Fingerprint className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500">Pasta Digital</h4>
                </div>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                    <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 leading-tight">
                      <strong>Ata de AGO #124</strong> assinada eletronicamente.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                    <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 leading-tight">
                      <strong>Contrato Pintura</strong> aguarda assinatura diretiva (1/3).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado Direito: Busca Avançada e Lista de Templates */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Barra de Pesquisa de Alto Padrão */}
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-600" />
                <input 
                  type="text"
                  placeholder="Pesquise por títulos, leis ou descrições de modelos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 pr-5 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full transition-all shadow-sm font-medium text-sm text-slate-800 dark:text-zinc-200"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grid de Modelos Animados com Framer Motion */}
              <motion.div 
                layout 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map(template => {
                    const variables = extractFields(template.content);
                    const varCount = variables.length;

                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        key={template.id}
                        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/60 p-6 shadow-sm hover:shadow-xl hover:border-slate-200 dark:hover:border-zinc-700 transition-all group flex flex-col relative overflow-hidden"
                      >
                        {/* Indicador de efeito sutil na lateral */}
                        <div className="absolute top-0 left-0 h-1.5 w-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-5">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/50 text-[9px] font-black uppercase tracking-widest rounded-md text-slate-500">
                              {template.category}
                            </span>
                            <button 
                              onClick={() => handleEdit(template)}
                              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Editar Modelo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(template.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Excluir Modelo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex-grow">
                          <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 mb-2 leading-snug tracking-tight group-hover:text-blue-600 transition-colors">{template.title}</h3>
                          <p className="text-slate-500 dark:text-zinc-400 text-xs leading-relaxed mb-4 line-clamp-3">
                            {template.description}
                          </p>
                        </div>

                        {/* Variáveis e Legislação */}
                        <div className="bg-slate-50/80 dark:bg-zinc-800/40 rounded-2xl p-4.5 mb-5 border border-slate-100 dark:border-zinc-800/40 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Base Legal</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-tight">
                            {template.legalBasis}
                          </p>
                          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              {varCount > 0 ? `${varCount} variáveis auto-preenchíveis` : 'Documento Estático'}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ações Modernos */}
                        <div className="flex gap-2.5 mt-auto">
                          <button 
                            onClick={() => handleFill(template)}
                            className="flex-grow py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-600/10"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            Preencher
                          </button>
                          <button 
                            onClick={() => handleCopy(template.content)}
                            className="p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl transition-all active:scale-95"
                            title="Copiar Texto Base"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownload(template)}
                            className="p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl transition-all active:scale-95"
                            title="Baixar Modelo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-10 animate-in fade-in zoom-in duration-200">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-zinc-200">Nenhum documento encontrado</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">Não encontramos resultados para sua busca atual. Tente redefinir o filtro de categoria ou utilizar outras palavras-chave.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'form' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 p-12 shadow-xl">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2">
                    {editingId ? 'Editar Documento' : 'Novo Documento'}
                  </h2>
                  <p className="text-slate-500 dark:text-zinc-400">Crie documentos personalizados para agilizar sua gestão</p>
                </div>
                <button 
                  onClick={() => { setActiveTab('list'); resetForm(); }}
                  className="p-4 bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-red-600 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Título do Documento</label>
                    <input 
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Notificação de Barulho"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Categoria</label>
                    <input 
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Ex: Convivência"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Descrição Curta</label>
                  <input 
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Para que serve este documento?"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Base Jurídica (Opcional)</label>
                  <input 
                    type="text"
                    value={formData.legalBasis}
                    onChange={(e) => setFormData({...formData, legalBasis: e.target.value})}
                    placeholder="Ex: Código Civil Art. 1.336"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Conteúdo do Documento</label>
                  <textarea 
                    required
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Escreva o texto base do documento aqui..."
                    className="w-full px-6 py-6 bg-slate-50 dark:bg-zinc-800 border-none rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium resize-none"
                  />
                  <p className="text-xs text-slate-400 ml-2 italic">Dica: Use colchetes como [NOME] para indicar campos que devem ser preenchidos depois.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Upload de Documento (Opcional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all group">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="font-bold text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200">
                        {formData.fileUrl ? 'Alterar Arquivo' : 'Selecionar Arquivo'}
                      </span>
                      <input 
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                      />
                    </label>
                    {formData.fileUrl && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Arquivo Pronto
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Save className="w-6 h-6" />
                    {editingId ? 'Salvar Alterações' : 'Criar Documento'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('list'); resetForm(); }}
                    className="px-8 py-5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-black rounded-2xl transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-8">
            {/* Introductory Header Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-slate-700/50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    Fluxo de Homologação e Assinaturas Coletivas
                  </h2>
                  <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                    De acordo com a Convenção do Condomínio e os regulamentos internos, determinados atos, editais, atas e contratos exigem a assinatura digital ou validação eletrônica de pelo menos <strong>3 membros do corpo diretivo</strong> (gestores) para obterem validade jurídica e serem arquivados formalmente na pasta digital das unidades.
                  </p>
                </div>
                <div className="bg-emerald-500/15 border border-emerald-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-black uppercase tracking-wider shrink-0">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  Ambiente Seguro ICP-Brasil
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Total Gerados</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{digitalFolder.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Aguardando Assinatura</p>
                <p className="text-2xl font-black text-amber-500">
                  {digitalFolder.filter(i => i.status === 'PENDING').length}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Homologados (3/3)</p>
                <p className="text-2xl font-black text-emerald-500">
                  {digitalFolder.filter(i => i.status === 'VALIDATED').length}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Rejeitados</p>
                <p className="text-2xl font-black text-red-500">
                  {digitalFolder.filter(i => i.status === 'REJECTED').length}
                </p>
              </div>
            </div>

            {/* Layout Grid: Left List, Right Profile Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Documents for validation */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Documentos em Processo</h3>
                  <div className="flex gap-2">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      Assinando como: <strong className="text-slate-800 dark:text-zinc-200 font-black">{selectedManager.name} ({selectedManager.role})</strong>
                    </span>
                  </div>
                </div>

                {digitalFolder.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                    <p className="text-slate-500 font-medium mb-2">Nenhum documento gerado ou enviado para assinatura ainda.</p>
                    <p className="text-xs text-slate-400">Preencha um dos modelos de documentos acima ou crie um novo para iniciar o processo.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {digitalFolder.map((doc) => {
                      // Check if the currently selected manager has already signed this document
                      const hasSigned = doc.signatures.some(s => s.userName === selectedManager.name);
                      const signaturesLeft = Math.max(0, 3 - doc.signatures.length);

                      return (
                        <div 
                          key={doc.id}
                          className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                          <div className="space-y-4 flex-grow max-w-xl">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-[9px] font-black uppercase tracking-wider rounded-md text-slate-500">
                                  {doc.category}
                                </span>
                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${
                                  doc.status === 'VALIDATED' 
                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                    : doc.status === 'REJECTED'
                                      ? 'bg-red-500/10 text-red-500'
                                      : 'bg-amber-500/10 text-amber-500 animate-pulse'
                                }`}>
                                  {doc.status === 'VALIDATED' ? 'Homologado (3/3)' : doc.status === 'REJECTED' ? 'Rejeitado' : `Em Assinatura (${doc.signatures.length}/3)`}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  {new Date(doc.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <h4 className="text-lg font-black leading-tight text-slate-900 dark:text-white">{doc.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">{doc.description}</p>
                            </div>

                            {/* Signature progress tracker */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <span>Coleta de Signatários</span>
                                <span className="text-blue-600 font-black">{doc.signatures.length} de 3 assinaturas</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${doc.status === 'VALIDATED' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                  style={{ width: `${Math.min(100, (doc.signatures.length / 3) * 100)}%` }}
                                />
                              </div>
                              {/* List of current signees */}
                              <div className="flex flex-wrap gap-2.5 pt-1">
                                {doc.signatures.length === 0 ? (
                                  <span className="text-xs italic text-slate-400 font-medium">Aguardando primeira assinatura...</span>
                                ) : (
                                  doc.signatures.map((sig) => (
                                    <div 
                                      key={sig.id}
                                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-800 rounded-full text-xs font-medium text-slate-600 dark:text-zinc-300"
                                      title={`Assinado em ${new Date(sig.date).toLocaleString('pt-BR')}`}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      <span><strong>{sig.userName}</strong> ({sig.role})</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex md:flex-col gap-2.5 shrink-0 justify-end">
                            <button
                              onClick={() => setViewingItem(doc)}
                              className="px-4 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <Eye className="w-4 h-4" />
                              Visualizar
                            </button>

                            {doc.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSigningItem(doc);
                                    setTypedName(selectedManager.name);
                                    setIsAgreed(false);
                                  }}
                                  disabled={hasSigned}
                                  className={`px-5 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md ${
                                    hasSigned 
                                      ? 'bg-slate-100 dark:bg-zinc-800/40 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-zinc-800 shadow-none' 
                                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/10'
                                  }`}
                                >
                                  <FileSignature className="w-4 h-4" />
                                  {hasSigned ? 'Você já assinou' : 'Assinar'}
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Deseja rejeitar e invalidar formalmente o documento "${doc.title}"?`)) {
                                      rejectDigitalFolderItem(doc.id);
                                    }
                                  }}
                                  className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                  Rejeitar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Manager Simulator Profile Selector */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-black tracking-tight mb-1">Simulador de Corpo Diretivo</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Escolha um gestor para assinar os documentos no ambiente de testes:</p>
                </div>

                <div className="space-y-3.5">
                  {[
                    { name: 'Carlos Silva', role: 'Síndico Geral', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80' },
                    { name: 'Mariana Costa', role: 'Subsíndica', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80' },
                    { name: 'Roberto Mendes', role: 'Membro do Conselho', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80' },
                    { name: 'Sílvia Santos', role: 'Administradora', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&q=80' }
                  ].map((mgr) => {
                    const isSelected = selectedManager.name === mgr.name;
                    return (
                      <button
                        key={mgr.name}
                        onClick={() => {
                          setSelectedManager(mgr);
                          toast.success(`Perfil alterado! Agora assinando como: ${mgr.name}`);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                          isSelected 
                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500 shadow-md shadow-blue-500/5' 
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                          <img src={mgr.avatar} alt={mgr.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-black text-sm text-slate-800 dark:text-zinc-100 leading-none mb-1 group-hover:text-blue-600 transition-colors">{mgr.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{mgr.role}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-600/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    Regra de Homologação
                  </div>
                  <p>• <strong>3 assinaturas requeridas</strong>: Para simular a homologação completa, altere o perfil ativo ao lado direito e clique em "Assinar Digital" em cada um dos perfis para o mesmo documento.</p>
                  <p>• <strong>Pasta Digital do Cliente</strong>: Documentos totalmente homologados são automaticamente consolidados e ficam acessíveis na pasta digital associada para consultas futuras.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="w-10 h-10 text-blue-200" />
                <h2 className="text-4xl font-black tracking-tight">Segurança Jurídica</h2>
              </div>
              <p className="text-xl text-blue-100 font-light leading-relaxed">
                Todos os nossos documentos são revisados periodicamente para garantir conformidade com o Código Civil Brasileiro e as leis condominiais vigentes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <BookOpen className="w-6 h-6 mb-3 text-blue-200" />
                <p className="text-xs font-black uppercase tracking-widest opacity-60">Atualizado</p>
                <p className="text-lg font-bold">2024.1</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <Gavel className="w-6 h-6 mb-3 text-blue-200" />
                <p className="text-xs font-black uppercase tracking-widest opacity-60">Revisão</p>
                <p className="text-lg font-bold">Trimestral</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Preenchimento */}
      <Modal
        isOpen={!!fillingTemplate}
        onClose={() => setFillingTemplate(null)}
        title={`Gerador Inteligente de Documento`}
        maxWidth="7xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Formulário de Dados (5 Colunas) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-6">
              
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  Preenchimento Automático
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight">Escolha um cliente cadastrado para importar os dados corporativos e de contato de forma instantânea:</p>
                <select
                  value={selectedClient}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm text-slate-800 dark:text-zinc-100"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-200 dark:border-zinc-800 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                    <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                    Variáveis do Documento
                  </h4>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-md">
                    {extractFields(fillingTemplate?.content || '').length} campos identificados
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-1">
                  {extractFields(fillingTemplate?.content || '').map(field => {
                    const hasValue = !!fieldValues[field];
                    return (
                      <div key={field} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            {field}
                          </label>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            hasValue 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                          }`}>
                            {hasValue ? 'Preenchido' : 'Pendente'}
                          </span>
                        </div>
                        <input 
                          type="text"
                          value={fieldValues[field] || ''}
                          onChange={(e) => setFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
                          placeholder={`Digite ${field.toLowerCase()}...`}
                          className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm text-slate-800 dark:text-zinc-100 ${
                            hasValue ? 'border-slate-200 dark:border-zinc-700' : 'border-amber-300 dark:border-amber-900/60'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="flex-grow py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Printer className="w-5 h-5 animate-pulse" />
                    <span>Gerando PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Concluir & Exportar</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setFillingTemplate(null)}
                className="px-6 py-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold rounded-2xl transition-all text-sm cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Preview Dinâmico do Documento (7 Colunas) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Preview Interativo & Autocompletação
              </h4>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Destaque inteligente ativo
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-[2rem] p-1 shadow-inner h-[580px] overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-grow p-8 bg-white text-zinc-800 rounded-[1.8rem] shadow-sm select-text font-serif text-sm">
                
                {/* Visualizador de Folha A4 Corporativa */}
                <div ref={printRef} className="bg-white text-black min-h-full max-w-[21cm] mx-auto p-4 leading-relaxed text-justify">
                  
                  {/* Cabeçalho do Documento */}
                  <div className="border-b-2 border-zinc-200 pb-5 mb-6 flex justify-between items-start break-inside-avoid">
                    <div className="flex gap-4.5 items-center">
                      {companyLogo ? (
                        <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100 flex items-center justify-center">
                          <img src={companyLogo} alt="Logo" className="h-10 w-auto object-contain" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                          <FileSignature className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <h1 className="text-sm md:text-base font-black uppercase tracking-tighter leading-tight">{fillingTemplate?.title}</h1>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                          Instrumento Oficial • {companyData?.name || 'CONDFY SÍNDICO DIGITAL'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md">
                        {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Conteúdo com Substituição & Destaques de Variáveis */}
                  <div className="text-zinc-800 text-sm space-y-4">
                    {(() => {
                      const text = getFilledContent();
                      if (!text) return null;
                      
                      return text.split('\n').map((line, i) => {
                        const isTitle = line.trim().startsWith('CLÁUSULA') || line.trim().startsWith('CAPÍTULO') || line.trim() === 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS';
                        
                        // Renderizar visualmente na tela com badges para as variáveis
                        // Procuramos trechos que correspondem a valores preenchidos vs pendentes
                        const regex = /(\[.*?\])/g;
                        const parts = line.split(regex);
                        
                        return (
                          <p key={i} className={isTitle ? 'font-black text-black pt-4 text-center tracking-tight text-sm uppercase' : ''}>
                            {parts.map((part, pIdx) => {
                              if (part.startsWith('[') && part.endsWith(']')) {
                                const fieldName = part.slice(1, -1);
                                const value = fieldValues[fieldName];
                                if (value) {
                                  return (
                                    <span 
                                      key={pIdx} 
                                      className="inline bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-200/50 mx-0.5 shadow-sm"
                                    >
                                      {value}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span 
                                      key={pIdx} 
                                      className="inline bg-amber-50 text-amber-800 font-black px-1.5 py-0.5 rounded border-2 border-dashed border-amber-300 mx-0.5 animate-pulse"
                                    >
                                      [{fieldName}]
                                    </span>
                                  );
                                }
                              }
                              return <span key={pIdx}>{part}</span>;
                            })}
                          </p>
                        );
                      });
                    })()}
                  </div>

                  {/* Rodapé / Assinaturas */}
                  <div className="mt-14 grid grid-cols-2 gap-16 break-inside-avoid pt-10 border-t border-zinc-100">
                    <div className="text-center flex flex-col items-center">
                      <div className="h-16 flex items-end justify-center mb-1.5 w-full">
                        {companySignature ? (
                          <img src={companySignature} alt="Assinatura" className="max-h-full max-w-[180px] object-contain opacity-90" />
                        ) : (
                          <div className="text-[10px] text-zinc-300 italic">Espaço para assinatura digital</div>
                        )}
                      </div>
                      <div className="w-full border-t border-zinc-200 pt-3">
                        <p className="text-xs font-black text-black leading-none mb-1">
                          {companyData?.name || 'CONDFY SÍNDICO DIGITAL'}
                        </p>
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Pelo Condomínio</p>
                      </div>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="h-16 mb-1.5 w-full flex items-end justify-center">
                        <div className="text-[10px] text-zinc-300 italic">Espaço para assinatura digital</div>
                      </div>
                      <div className="w-full border-t border-zinc-200 pt-3">
                        <p className="text-xs font-black text-black leading-none mb-1">Responsável / Outorgado</p>
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Pela Contratada</p>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Final */}
                  <div className="mt-16 pt-6 border-t border-zinc-100 flex justify-between items-center text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                    <span>Documento gerado eletronicamente via Condfy.IA • Integridade garantida</span>
                    <span>Pág 1 de 1</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Pré-visualização do Documento no Fluxo */}
      <Modal
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        title={`Visualizar Documento: ${viewingItem?.title}`}
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div className="flex gap-4 items-center">
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                viewingItem?.status === 'VALIDATED' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : viewingItem?.status === 'REJECTED'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-amber-500/10 text-amber-500'
              }`}>
                {viewingItem?.status === 'VALIDATED' ? 'HOMOLOGADO' : viewingItem?.status === 'REJECTED' ? 'REJEITADO' : 'AGUARDANDO ASSINATURAS'}
              </span>
              <span className="text-xs text-slate-500 font-medium">Categoria: <strong className="text-slate-800 dark:text-zinc-200">{viewingItem?.category}</strong></span>
              <span className="text-xs text-slate-500 font-medium">Emitido em: <strong className="text-slate-800 dark:text-zinc-200">{viewingItem && new Date(viewingItem.date).toLocaleDateString('pt-BR')}</strong></span>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-10 font-serif text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap text-sm max-h-[500px] overflow-y-auto shadow-inner">
            <div className="text-center border-b border-slate-100 dark:border-zinc-800 pb-6 mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{viewingItem?.title}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Homologação Digital • Condfy.IA</p>
            </div>

            {viewingItem && getDocumentBodyPreview(viewingItem)}

            {/* Collected Signatures Visual Block */}
            <div className="mt-16 pt-10 border-t border-slate-100 dark:border-zinc-800 break-inside-avoid">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Assinaturas Coletadas Eletronicamente</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {viewingItem?.signatures.map((sig: any) => (
                  <div key={sig.id} className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 text-center flex flex-col items-center relative overflow-hidden">
                    {/* Tiny watermark stamp */}
                    <div className="absolute -right-2 -bottom-2 opacity-5">
                      <ShieldCheck className="w-16 h-16 text-emerald-500" />
                    </div>

                    <div className="h-10 flex items-center justify-center mb-1 font-serif text-slate-600 italic text-lg select-none">
                      {sig.userName}
                    </div>
                    <div className="w-full border-t border-slate-200 dark:border-zinc-700 pt-2.5 mt-2.5">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200 leading-tight">{sig.userName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sig.role}</p>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" />
                      Assinado
                    </div>
                    <p className="text-[8px] font-medium text-slate-400 mt-2">
                      {new Date(sig.date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}

                {/* Empty signature spots */}
                {viewingItem && Array.from({ length: Math.max(0, 3 - viewingItem.signatures.length) }).map((_, idx) => (
                  <div key={idx} className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-5 text-center flex flex-col items-center justify-center text-slate-400 h-full min-h-[140px]">
                    <Clock className="w-5 h-5 text-slate-300 dark:text-zinc-700 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assinatura Pendente</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Aguardando validação do corpo diretivo</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setViewingItem(null)}
              className="px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold rounded-xl transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Assinatura Pad */}
      <Modal
        isOpen={!!signingItem}
        onClose={() => setSigningItem(null)}
        title={`Assinatura Digital: ${signingItem?.title}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/20 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Você está assinando este documento como <strong>{selectedManager.name} ({selectedManager.role})</strong>.
            Esta operação é segura, auditada e possui validade jurídica equivalente à assinatura manuscrita.
          </div>

          {/* Signature Type Tabs */}
          <div className="flex border-b border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setSignatureType('type')}
              className={`px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                signatureType === 'type' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Digitar Assinatura
            </button>
            <button
              onClick={() => {
                setSignatureType('draw');
                setTimeout(() => clearCanvas(), 50);
              }}
              className={`px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                signatureType === 'draw' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Desenhar Assinatura
            </button>
          </div>

          {signatureType === 'type' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Seu Nome para Assinatura</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                  placeholder="Digite seu nome completo..."
                />
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 p-8 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center justify-center min-h-[160px] relative overflow-hidden select-none">
                <div className="absolute top-2 left-3 text-[9px] font-black uppercase tracking-widest text-slate-400/60">Visualização da Assinatura</div>
                <div 
                  className="text-3xl text-blue-800 dark:text-blue-400 tracking-wider text-center"
                  style={{ fontFamily: "'Great Vibes', 'Brush Script MT', cursive, serif" }}
                >
                  {typedName || selectedManager.name}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Assine no quadro abaixo</label>
                <div className="flex items-center gap-3">
                  {/* Ink Colors */}
                  <div className="flex gap-1.5">
                    {['#1e3a8a', '#000000', '#0284c7'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setInkColor(color)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          inkColor === color ? 'scale-125 border-slate-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={clearCanvas}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-lg"
                  >
                    Limpar Quadro
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-800 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={220}
                  className="w-full bg-slate-50 dark:bg-zinc-800 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>
          )}

          {/* Legal acceptance checkbox */}
          <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
            />
            <span className="text-[11px] text-slate-500 leading-normal">
              Declaro que revisei e aprovo formalmente os termos do documento digital em questão, concordando em registrar minha assinatura digital eletrônica vinculada ao meu CPF e dados funcionais no condomínio para fins legais de homologação e arquivamento em conformidade com as regras internas do residencial.
            </span>
          </label>

          <div className="flex gap-3.5 pt-2">
            <button
              onClick={handleConfirmSignature}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirmar Assinatura Digital
            </button>
            <button
              onClick={() => setSigningItem(null)}
              className="px-6 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
