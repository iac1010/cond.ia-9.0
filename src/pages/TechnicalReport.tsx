import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Sparkles, ArrowLeft, Copy, Download, CheckCircle2, 
  AlertCircle, PenTool, Cpu, RefreshCw, Building2, User,
  Eye, Edit3, History, Save, Trash2, Search, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { GlassCard } from '../components/GlassUI';
import { generatePdf } from '../utils/pdfGenerator';
import { useStore } from '../store';

export default function TechnicalReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, companyLogo, companyData, technicalReports, addTechnicalReport, deleteTechnicalReport } = useStore();
  
  const initialState = location.state as { description?: string; clientId?: string } | null;
  
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [reportType, setReportType] = useState<'standard' | 'client'>(initialState?.clientId ? 'client' : 'standard');
  const [selectedClientId, setSelectedClientId] = useState(initialState?.clientId || '');
  const [input, setInput] = useState(initialState?.description || '');
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const filteredReports = technicalReports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Por favor, descreva o que houve na ocorrência.');
      return;
    }

    if (reportType === 'client' && !selectedClientId) {
      toast.error('Por favor, selecione um cliente.');
      return;
    }

    setIsGenerating(true);
    setReport('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let clientContext = '';
      if (reportType === 'client' && selectedClient) {
        clientContext = `
Informações do Cliente (apenas para contexto, NÃO INCLUA ESTES DADOS NO TEXTO GERADO):
- Nome/Razão Social: ${selectedClient.name}
- Documento (CNPJ/CPF): ${selectedClient.document || 'Não informado'}
- Endereço: ${selectedClient.address || 'Não informado'}
- Contato: ${selectedClient.contactPerson || 'Não informado'}
`;
      }

      const prompt = `Você é um engenheiro/técnico especialista sênior com vasta experiência em manutenção predial e industrial.
Sua tarefa é transformar uma descrição informal de uma ocorrência em um RELATÓRIO TÉCNICO DETALHADO, profissional e extremamente bem estruturado.

${clientContext}

O relatório deve seguir rigorosamente esta estrutura em Markdown:

## 1. Resumo da Ocorrência
(Descreva o chamado inicial, a data/hora se informada e o estado em que o equipamento/local foi encontrado)

## 2. Análise Técnica e Diagnóstico
(Utilize termos técnicos precisos. Explique a causa raiz do problema, os sintomas observados e o impacto na operação)

## 3. Ações Realizadas
(Liste passo a passo as intervenções técnicas, substituição de peças, ajustes e calibrações efetuadas)

## 4. Testes de Validação e Resultados
(Descreva os testes feitos após o reparo para garantir que o problema foi resolvido e quais foram os parâmetros medidos, ex: pressão, corrente, temperatura)

## 5. Conclusão e Recomendações Preventivas
(Dê um parecer final sobre a condição do sistema e sugira melhorias ou cronogramas de manutenção para evitar reincidência)

IMPORTANTE: 
- NÃO inclua título principal (ex: "# RELATÓRIO TÉCNICO") nem os dados do cliente no início.
- Use uma linguagem formal, técnica e objetiva.
- Se a descrição original for curta, use seu conhecimento técnico para expandir os detalhes de forma plausível (ex: se trocou um selo mecânico, mencione a limpeza da sede e o teste de estanqueidade).

Descrição original do técnico:
"${input}"

Gere apenas o conteúdo do relatório em Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      if (response.text) {
        setReport(response.text);
        toast.success('Relatório gerado com sucesso!');
      } else {
        throw new Error('Resposta vazia do modelo.');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Ocorreu um erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    
    try {
      const titleMatch = report.match(/^##\s*1\.\s*(.*)/m);
      const title = titleMatch ? titleMatch[1].trim() : `Relatório Técnico - ${new Date().toLocaleDateString()}`;
      
      await addTechnicalReport({
        title,
        content: report,
        date: new Date().toISOString(),
        type: reportType,
        clientId: selectedClientId || undefined,
        clientName: selectedClient?.name,
      });
      
      toast.success('Relatório salvo no histórico!');
    } catch (error) {
      toast.error('Erro ao salvar relatório.');
    }
  };

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    if (reportRef.current && report) {
      try {
        toast.loading('Gerando PDF...', { id: 'pdf-gen' });
        await generatePdf(reportRef.current, 'Relatorio_Tecnico.pdf');
        toast.success('PDF gerado com sucesso!', { id: 'pdf-gen' });
      } catch (error) {
        console.error(error);
        toast.error('Erro ao gerar PDF', { id: 'pdf-gen' });
      }
    }
  };

  return (
    <div className="min-h-screen -m-6 md:-m-8 p-6 md:p-10 relative overflow-hidden bg-zinc-950">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Cpu className="w-8 h-8 text-indigo-400" />
                Gerador de Relatório Técnico
              </h1>
              <p className="text-white/40 text-sm mt-1">Transforme anotações simples em documentos profissionais</p>
            </div>
          </div>

          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'generator' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Gerador
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico
              {technicalReports.length > 0 && (
                <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
                  {technicalReports.length}
                </span>
              )}
            </button>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {activeTab === 'generator' ? (
            <motion.div 
              key="generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Input Section */}
              <div className="space-y-6">
            <GlassCard title="Configuração do Relatório" icon={PenTool}>
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                  <button
                    onClick={() => setReportType('standard')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      reportType === 'standard' 
                        ? 'bg-indigo-500 text-white shadow-lg' 
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Relatório Padrão
                  </button>
                  <button
                    onClick={() => setReportType('client')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      reportType === 'client' 
                        ? 'bg-indigo-500 text-white shadow-lg' 
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Para Cliente
                  </button>
                </div>

                {/* Client Selector */}
                {reportType === 'client' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Selecione o Cliente
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    >
                      <option value="" className="bg-zinc-900">Selecione um cliente...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id} className="bg-zinc-900">
                          {client.name} {client.document ? `- ${client.document}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest">
                    Descreva o que houve (OS)
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ex: Cheguei no local, a bomba d'água 2 estava vazando pelo selo mecânico. Desliguei o disjuntor, fechei o registro, troquei o selo e o rolamento que tava roncando. Religuei e testei, pressão normalizou em 4 bar. Tudo ok agora."
                    className="w-full h-48 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none custom-scrollbar"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !input.trim() || (reportType === 'client' && !selectedClientId)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Gerar Relatório Técnico
                    </>
                  )}
                </button>
                
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-200/70 leading-relaxed">
                    A Inteligência Artificial irá estruturar seu texto, corrigir a gramática e utilizar termos técnicos adequados para criar um documento pronto para ser entregue ao cliente.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <GlassCard 
              title={isEditingReport ? "Editando Relatório" : "Relatório Gerado"} 
              icon={isEditingReport ? Edit3 : FileText}
              action={
                report ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/20"
                      title="Salvar no Histórico"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingReport(!isEditingReport)}
                      className={`p-2 rounded-xl border transition-all ${
                        isEditingReport 
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' 
                          : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                      title={isEditingReport ? "Ver Prévia" : "Editar Texto"}
                    >
                      {isEditingReport ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                    {!isEditingReport && (
                      <>
                        <button
                          onClick={handleCopy}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/5"
                          title="Copiar texto"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/20"
                          title="Baixar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ) : null
              }
            >
              <div className="h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {report ? (
                  isEditingReport ? (
                    <div className="h-full flex flex-col space-y-4">
                      <textarea
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                        className="flex-1 w-full p-6 bg-zinc-900 border border-white/10 rounded-2xl text-white font-mono text-sm resize-none custom-scrollbar focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        placeholder="Edite o conteúdo em markdown aqui..."
                      />
                      <div className="flex items-center gap-2 text-[10px] text-white/30 px-2">
                        <AlertCircle className="w-3 h-3" />
                        <span>O texto usa formatação Markdown (## para títulos, * para listas). Suas alterações aparecem na prévia ao alternar o modo.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white text-zinc-900 rounded-2xl shadow-inner min-h-full p-4 sm:p-10">
                      <div ref={reportRef} className="bg-white text-black" style={{ width: '100%', fontFamily: 'Arial, sans-serif', padding: '15mm 20mm' }}>
                      {/* Standard Report Header */}
                      <table style={{ width: '100%', borderBottom: '2px solid #e4e4e7', marginBottom: '2rem', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ verticalAlign: 'middle', paddingBottom: '1.5rem', width: '50%' }}>
                              {companyLogo ? (
                                <div style={{ height: '64px', marginBottom: '8px' }}>
                                  <img src={companyLogo} alt="Logo" width="200" height="64" style={{ height: '64px', width: 'auto', maxWidth: '200px', objectFit: 'contain', objectPosition: 'left center' }} referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#27272a', margin: '0 0 8px 0' }}>{companyData?.name || 'Sua Empresa'}</h2>
                              )}
                              <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.5rem', lineHeight: '1.4' }}>
                                <p style={{ margin: 0, fontWeight: 500 }}>{companyData?.document ? `CNPJ: ${companyData.document}` : ''}</p>
                                <p style={{ margin: 0 }}>{companyData?.address || ''}</p>
                                <p style={{ margin: 0 }}>{companyData?.phone || ''} {companyData?.phone && companyData?.email ? '|' : ''} {companyData?.email || ''}</p>
                              </div>
                            </td>
                            <td style={{ verticalAlign: 'middle', textAlign: 'right', paddingBottom: '1.5rem', width: '50%' }}>
                              <h1 style={{ fontSize: '2rem', fontStretch: 'condensed', fontWeight: 900, color: '#111827', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0, lineHeight: 1 }}>Relatório Técnico</h1>
                              <div style={{ marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.875rem', color: '#71717a', margin: 0 }}>
                                  Data: <span style={{ fontWeight: 600, color: '#374151' }}>{new Date().toLocaleDateString('pt-BR')}</span>
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#71717a', margin: 0 }}>
                                  OS: <span style={{ fontWeight: 600, color: '#374151' }}>#{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
                                </p>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Client Info (if selected) */}
                      {reportType === 'client' && selectedClient && (
                        <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', marginTop: 0 }}>Dados do Cliente</h3>
                          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr>
                                <td style={{ paddingBottom: '0.75rem', width: '60%', verticalAlign: 'top' }}>
                                  <p style={{ color: '#6b7280', margin: 0, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Cliente / Razão Social</p>
                                  <p style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '1rem' }}>{selectedClient.name}</p>
                                </td>
                                <td style={{ paddingBottom: '0.75rem', width: '40%', verticalAlign: 'top' }}>
                                  <p style={{ color: '#6b7280', margin: 0, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Documento</p>
                                  <p style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '1rem' }}>{selectedClient.document || 'N/A'}</p>
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={2} style={{ verticalAlign: 'top' }}>
                                  <p style={{ color: '#6b7280', margin: 0, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Endereço</p>
                                  <p style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '0.95rem' }}>{selectedClient.address || 'N/A'}</p>
                                </td>
                                {selectedClient.contactPerson && (
                                  <td style={{ verticalAlign: 'top' }}>
                                    <p style={{ color: '#6b7280', margin: 0, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Contato</p>
                                    <p style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '0.95rem' }}>{selectedClient.contactPerson}</p>
                                  </td>
                                )}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Markdown Content */}
                      <div className="markdown-body" style={{ color: '#000', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'justify', hyphens: 'auto', wordBreak: 'break-word' }}>
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p style={{ pageBreakInside: 'avoid', breakInside: 'avoid', display: 'block', marginBottom: '16px', textAlign: 'justify' }} {...props} />,
                            li: ({node, ...props}) => <li style={{ pageBreakInside: 'avoid', breakInside: 'avoid', display: 'block', marginBottom: '8px', textAlign: 'justify' }} {...props} />,
                            h1: ({node, ...props}) => <h1 style={{ pageBreakInside: 'avoid', breakInside: 'avoid', display: 'block', marginTop: '24px', marginBottom: '16px', fontWeight: 'bold', fontSize: '1.5rem', color: '#111827' }} {...props} />,
                            h2: ({node, ...props}) => <h2 style={{ pageBreakInside: 'avoid', breakInside: 'avoid', display: 'block', marginTop: '28px', marginBottom: '14px', fontWeight: 'bold', fontSize: '1.35rem', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px', color: '#111827' }} {...props} />,
                            h3: ({node, ...props}) => <h3 style={{ pageBreakInside: 'avoid', breakInside: 'avoid', display: 'block', marginTop: '20px', marginBottom: '10px', fontWeight: 'bold', fontSize: '1.15rem', color: '#111827' }} {...props} />,
                            strong: ({node, ...props}) => <strong style={{ fontWeight: 700, color: '#000' }} {...props} />,
                          }}
                        >
                          {report}
                        </ReactMarkdown>
                      </div>

                      {/* Standard Footer */}
                      <div className="break-inside-avoid" style={{ marginTop: '4rem', paddingTop: '2rem', paddingBottom: '2rem', borderTop: '1px solid #e4e4e7', textAlign: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <div style={{ width: '16rem', borderBottom: '1px solid #a1a1aa', margin: '0 auto 0.5rem auto' }}></div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#27272a', margin: 0 }}>Responsável Técnico</p>
                        <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>{companyData?.name || 'Sua Empresa'}</p>
                        {/* Spacer to prevent cutting off at the bottom of the page */}
                        <div style={{ height: '40px', color: 'transparent', overflow: 'hidden' }}>.</div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <FileText className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">O relatório gerado aparecerá aqui</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="history"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Pesquisar relatórios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-6">
                <History className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhum relatório encontrado</h3>
              <p className="text-white/40 max-w-md">
                {searchTerm 
                  ? `Não encontramos resultados para "${searchTerm}"` 
                  : 'Você ainda não salvou nenhum relatório técnico no histórico.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((reportItem) => (
                <GlassCard 
                  key={reportItem.id}
                  className="p-6 group hover:border-indigo-500/30 transition-all cursor-pointer"
                  onClick={() => {
                    setReport(reportItem.content);
                    setReportType(reportItem.type);
                    setSelectedClientId(reportItem.clientId || '');
                    setActiveTab('generator');
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Tem certeza que deseja excluir este relatório?')) {
                            deleteTechnicalReport(reportItem.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/0 hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                        {reportItem.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          {reportItem.type === 'client' ? 'Cliente' : 'Padrão'}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {new Date(reportItem.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {reportItem.clientName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                        <Building2 className="w-3 h-3 text-white/40" />
                        <span className="text-xs text-white/60 truncate">{reportItem.clientName}</span>
                      </div>
                    )}

                    <p className="text-sm text-white/40 line-clamp-2 italic">
                      {reportItem.content.replace(/[#*]/g, '').substring(0, 100)}...
                    </p>

                    <div className="pt-4 flex items-center justify-between border-t border-white/5 text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover:text-white/60 transition-colors">
                      Ver Detalhes
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>
);
}
