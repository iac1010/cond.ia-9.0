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
  User
} from 'lucide-react';
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
    companySignature
  } = useStore();

  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
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

  // Seed initial templates if none exist
  useEffect(() => {
    if (documentTemplates.length === 0) {
      INITIAL_TEMPLATES.forEach(t => addDocumentTemplate(t));
    }
  }, [documentTemplates.length, addDocumentTemplate]);

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
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'list' 
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Documentos
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'form' 
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              {editingId ? 'Editar Documento' : 'Novo Documento'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {activeTab === 'list' ? (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all shadow-sm"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-bold text-slate-700 dark:text-zinc-300"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTemplates.map(template => (
                <div 
                  key={template.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {template.category}
                      </span>
                      <button 
                        onClick={() => handleEdit(template)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black mb-3 leading-tight">{template.title}</h3>
                  <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 flex-grow">
                    {template.description}
                  </p>

                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Base Jurídica</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                      {template.legalBasis}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleFill(template)}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                      <FileEdit className="w-4 h-4" />
                      Preencher
                    </button>
                    <button 
                      onClick={() => handleCopy(template.content)}
                      className="p-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-2xl transition-all active:scale-95"
                      title="Copiar Texto"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDownload(template)}
                      className="p-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-2xl transition-all active:scale-95"
                      title="Baixar PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black mb-2">Nenhum documento encontrado</h3>
                <p className="text-slate-500">Tente buscar por outros termos ou categorias.</p>
              </div>
            )}
          </>
        ) : (
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
        title={`Gerar ${fillingTemplate?.title}`}
        maxWidth="6xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Dados */}
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/20">
              <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Preenchimento Automático
              </h4>
              <div className="mb-6">
                <select
                  value={selectedClient}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                >
                  <option value="">Selecione um cliente para preencher os dados...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                <FileEdit className="w-4 h-4" />
                Dados do Documento
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {extractFields(fillingTemplate?.content || '').map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                      {field}
                    </label>
                    <input 
                      type="text"
                      value={fieldValues[field] || ''}
                      onChange={(e) => setFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={`Digite o ${field.toLowerCase()}...`}
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Printer className="w-6 h-6 animate-pulse" />
                ) : (
                  <Download className="w-6 h-6" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar Documento'}
              </button>
              <button 
                onClick={() => setFillingTemplate(null)}
                className="px-8 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-2xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Preview do Documento */}
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Pré-visualização
            </h4>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-inner h-[600px] overflow-y-auto font-serif text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap text-sm">
              <div ref={printRef} className="bg-white text-black min-h-full">
                {/* Cabeçalho do PDF */}
                <div className="border-b border-zinc-200 pb-6 mb-8 flex justify-between items-start break-inside-avoid">
                  <div className="flex gap-4 items-center">
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
                      <h1 className="text-xl font-black uppercase tracking-tighter leading-tight">{fillingTemplate?.title}</h1>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">Instrumento Particular • {companyData?.name || 'IA COMPANY'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="text-justify text-zinc-800 leading-relaxed text-sm space-y-4">
                  {getFilledContent().split('\n').map((line, i) => (
                    <p key={i} className={line.trim().startsWith('CLÁUSULA') || line.trim().startsWith('CAPÍTULO') ? 'font-black text-black pt-4' : ''}>
                      {line}
                    </p>
                  ))}
                </div>

                {/* Rodapé / Assinaturas */}
                <div className="mt-20 grid grid-cols-2 gap-20 break-inside-avoid pt-12 border-t border-zinc-100">
                  <div className="text-center flex flex-col items-center">
                    <div className="h-20 flex items-end justify-center mb-2 w-full">
                      {companySignature && (
                        <img src={companySignature} alt="Assinatura" className="max-h-full max-w-[200px] object-contain opacity-90" />
                      )}
                    </div>
                    <div className="w-full border-t border-zinc-300 pt-4">
                      <p className="text-sm font-black text-black leading-none mb-1">{companyData?.name || 'IA COMPANY'}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Pelo Condomínio</p>
                    </div>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="h-20 mb-2 w-full"></div>
                    <div className="w-full border-t border-zinc-300 pt-4">
                      <p className="text-sm font-black text-black leading-none mb-1">Responsável / Outorgado</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Pela Contratada</p>
                    </div>
                  </div>
                </div>

                {/* Ultra Footer */}
                <div className="mt-20 pt-8 border-t border-zinc-100 flex justify-between items-center text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                  <span>Documento gerado eletronicamente • Autenticidade garantida por Condfy.IA</span>
                  <span>PG 01/01</span>
                </div>
                {/* Spacer to prevent cutting off at the bottom of the page */}
                <div style={{ height: '40px', color: 'transparent', overflow: 'hidden' }}>.</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
