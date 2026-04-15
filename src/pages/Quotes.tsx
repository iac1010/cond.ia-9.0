import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { QuoteItem, Quote, QuoteInstallment } from '../types';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Save, FileSpreadsheet, CheckCircle, Clock, XCircle, FileText, Download, Eye, Send, Printer, Wrench, Share2, Mail } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { safeFormatDate } from '../utils/dateUtils';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

function GlassPanel({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl ${className}`}>
      {children}
    </div>
  );
}

export default function Quotes() {
  const navigate = useNavigate();
  const { clients, quotes, products, addQuote, updateQuote, deleteQuote, addReceipt, companyLogo, companyData, companySignature } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [installments, setInstallments] = useState<QuoteInstallment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteToPrint, setQuoteToPrint] = useState<Quote | null>(null);

  const approvedQuotes = quotes.filter(q => q.status === 'APPROVED');
  const pendingQuotes = quotes.filter(q => q.status === 'DRAFT' || q.status === 'SENT');
  const rejectedQuotes = quotes.filter(q => q.status === 'REJECTED');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems: QuoteItem[] = results.data.map((row: any) => {
          // Try to guess columns
          const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('prod') || k.toLowerCase().includes('nome'));
          const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes('qtd') || k.toLowerCase().includes('quant'));
          const priceKey = Object.keys(row).find(k => k.toLowerCase().includes('preco') || k.toLowerCase().includes('preço') || k.toLowerCase().includes('valor') || k.toLowerCase().includes('unit'));

          const description = descKey ? row[descKey] : Object.values(row)[0] as string;
          const quantity = qtyKey ? parseFloat(row[qtyKey]) : 1;
          
          let unitPrice = 0;
          if (priceKey) {
            const priceStr = String(row[priceKey]).replace(/[R$\s]/g, '').replace(',', '.');
            unitPrice = parseFloat(priceStr);
          }

          return {
            id: uuidv4(),
            description: description || 'Produto sem nome',
            quantity: isNaN(quantity) ? 1 : quantity,
            unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
            total: (isNaN(quantity) ? 1 : quantity) * (isNaN(unitPrice) ? 0 : unitPrice)
          };
        });

        setItems(prev => [...prev, ...parsedItems]);
        setUploadSuccess(true);
        toast.success('Planilha processada com sucesso!');
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadSuccess(false);
        }, 2000);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: () => {
        setIsUploading(false);
        toast.error('Erro ao processar a planilha.');
      }
    });
  };

  const downloadTemplate = () => {
    const headers = "Descrição,Quantidade,Valor Unitário\n";
    const sampleData = "Serviço de Manutenção,1,150.00\nPeça de Reposição,2,45.50\n";
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_orcamento.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    setItems([...items, { id: uuidv4(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const addInstallment = () => {
    setInstallments([...installments, { id: uuidv4(), description: `${installments.length + 1}ª Parcela`, value: 0 }]);
  };

  const updateInstallment = (id: string, field: keyof QuoteInstallment, value: any) => {
    setInstallments(installments.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  const removeInstallment = (id: string) => {
    setInstallments(installments.filter(inst => inst.id !== id));
  };

  const totalValue = items.reduce((sum, item) => sum + item.total, 0);
  const totalInstallmentsValue = installments.reduce((sum, inst) => sum + inst.value, 0);

  const handleSave = () => {
    if (!clientId) {
      toast.error('Selecione um cliente');
      return;
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    if (editingQuote) {
      updateQuote(editingQuote.id, {
        ...editingQuote,
        clientId,
        items,
        installments,
        totalValue,
      });
      toast.success('Orçamento atualizado com sucesso!');
    } else {
      addQuote({
        clientId,
        date: new Date().toISOString(),
        items,
        installments,
        totalValue,
        status: 'DRAFT'
      });
      toast.success('Orçamento salvo com sucesso!');
    }

    setClientId('');
    setItems([]);
    setInstallments([]);
    setIsCreating(false);
    setEditingQuote(null);
  };

  const handleStatusChange = (quote: Quote, newStatus: Quote['status']) => {
    updateQuote(quote.id, { ...quote, status: newStatus });
    
    // If approved, automatically create a receipt
    if (newStatus === 'APPROVED' && quote.status !== 'APPROVED') {
      addReceipt({
        clientId: quote.clientId,
        date: new Date().toISOString().split('T')[0],
        value: quote.totalValue,
        description: `Referente ao orçamento aprovado #${quote.id.substring(0, 8)}`
      });
      toast.success('Orçamento aprovado! Receita gerada no Financeiro.');
    }
  };

  const handleDownloadPdf = async (quote: Quote) => {
    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    setQuoteToPrint(quote);
    setIsGenerating(true);
    
    // Wait for state to update and DOM to render
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) {
        setIsGenerating(false);
        setQuoteToPrint(null);
        toast.error('Erro: Template do PDF não encontrado.');
        return;
      }

      try {
        const client = clients.find(c => c.id === quote.clientId);
        const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Cliente';
        const dateStr = safeFormatDate(quote.date).replace(/\//g, '-');
        const fileName = `Orcamento_${safeName}_${dateStr}.pdf`;

        await generatePdf(element, fileName);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        toast.error(`Erro ao gerar PDF. Tente usar o botão "Imprimir" como alternativa.`);
      } finally {
        setIsGenerating(false);
        setQuoteToPrint(null);
      }
    }, 1500); // Increased timeout for safety
  };

  const handleSharePdf = async (quote: Quote) => {
    window.scrollTo(0, 0);
    setQuoteToPrint(quote);
    setIsGenerating(true);
    
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) {
        setIsGenerating(false);
        setQuoteToPrint(null);
        toast.error('Erro: Template do PDF não encontrado.');
        return;
      }

      try {
        const client = clients.find(c => c.id === quote.clientId);
        const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Cliente';
        const dateStr = safeFormatDate(quote.date).replace(/\//g, '-');
        const fileName = `Orcamento_${safeName}_${dateStr}.pdf`;

        await sharePdf(element, fileName);
        toast.success('Compartilhamento iniciado!');
      } catch (error: any) {
        console.error('Erro ao compartilhar PDF:', error);
        const errorMsg = error?.message || 'Erro desconhecido';
        if (errorMsg.includes('Compartilhamento não suportado')) {
          toast.error(errorMsg);
        } else {
          toast.error(`Erro ao compartilhar: ${errorMsg}`);
        }
      } finally {
        setIsGenerating(false);
        setQuoteToPrint(null);
      }
    }, 1500);
  };

  const handlePrintQuote = (quote: Quote) => {
    setQuoteToPrint(quote);
    setTimeout(() => {
      window.print();
      setQuoteToPrint(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white relative overflow-hidden font-sans -m-8 flex flex-col">
      {/* Matte Black Background */}
      <div className="absolute inset-0 z-0 bg-[#0f0f11]">
        {/* Subtle noise texture for the matte/frosted effect */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-black/80"></div>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white font-black uppercase tracking-widest text-sm">Gerando Documento de Alta Qualidade...</p>
          <p className="text-white/60 text-xs mt-2">Isso pode levar alguns segundos</p>
        </div>
      )}

      <div className="relative z-10 p-8 md:p-12 h-full flex flex-col flex-1">
        <AnimatePresence mode="wait">
          {!isCreating ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-7xl mx-auto w-full"
            >
              {/* Header */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 px-8 shadow-2xl gap-4">
                <div className="flex items-center gap-4">
                  <BackButton />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-light tracking-wide">
                        <span className="font-bold">Gestão de</span> Orçamentos
                      </h1>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600/80 hover:bg-blue-500 border border-blue-400/30 text-white px-6 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  <Plus className="w-5 h-5" /> 
                  Novo Orçamento
                </button>
              </header>

              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <GlassPanel className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-white/50 font-bold uppercase tracking-widest text-xs mb-2">Total de Orçamentos</h3>
                    <span className="text-4xl font-black text-white drop-shadow-lg">{quotes.length}</span>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <FileText className="w-8 h-8 text-white/70" />
                  </div>
                </GlassPanel>
                
                <GlassPanel className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-white/50 font-bold uppercase tracking-widest text-xs mb-2">Aprovados</h3>
                    <span className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">{approvedQuotes.length}</span>
                  </div>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                </GlassPanel>
                
                <GlassPanel className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-white/50 font-bold uppercase tracking-widest text-xs mb-2">Aguardando</h3>
                    <span className="text-4xl font-black text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]">{pendingQuotes.length}</span>
                  </div>
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                    <Clock className="w-8 h-8 text-orange-400" />
                  </div>
                </GlassPanel>
              </div>

              {/* Quotes List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(quote => {
                  const client = clients.find(c => c.id === quote.clientId);
                  
                  const statusColors = {
                    DRAFT: 'bg-white/10 text-white/60 border-white/20',
                    SENT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30'
                  };

                  return (
                    <GlassPanel
                      key={quote.id}
                      className="p-6 flex flex-col justify-between min-h-[240px] group transition-all hover:bg-white/15"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[quote.status]}`}>
                            {quote.status === 'DRAFT' ? 'Rascunho' :
                             quote.status === 'SENT' ? 'Enviado' :
                             quote.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                          <span className="text-xs text-white/40 font-mono">
                            {safeFormatDate(quote.date)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1" title={client?.name || 'Cliente Desconhecido'}>
                          {client?.name || 'Cliente Desconhecido'}
                        </h3>
                        <p className="text-xs text-white/40 mb-4 font-mono">#{quote.id.substring(0, 8)}</p>
                        <p className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                        <select 
                          value={quote.status}
                          onChange={(e) => handleStatusChange(quote, e.target.value as Quote['status'])}
                          className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition-colors font-bold uppercase tracking-wider"
                        >
                          <option value="DRAFT" className="bg-[#0f0f11]">Rascunho</option>
                          <option value="SENT" className="bg-[#0f0f11]">Enviado</option>
                          <option value="APPROVED" className="bg-[#0f0f11]">Aprovado</option>
                          <option value="REJECTED" className="bg-[#0f0f11]">Rejeitado</option>
                        </select>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingQuote(quote);
                              setClientId(quote.clientId);
                              setItems(quote.items);
                              setInstallments(quote.installments || []);
                              setIsCreating(true);
                            }}
                            className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setViewingQuote(quote)}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePrintQuote(quote)}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Imprimir"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownloadPdf(quote)}
                            disabled={isGenerating}
                            className="p-2 text-white/40 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                            title="Baixar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSharePdf(quote)}
                            disabled={isGenerating}
                            className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Compartilhar"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Excluir Orçamento',
                                message: 'Tem certeza que deseja excluir este orçamento?',
                                onConfirm: () => {
                                  deleteQuote(quote.id);
                                  toast.success('Orçamento excluído com sucesso!');
                                }
                              });
                            }}
                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </GlassPanel>
                  );
                })}
                {quotes.length === 0 && (
                  <div className="col-span-full py-24 text-center">
                    <GlassPanel className="inline-flex flex-col items-center justify-center p-12 border-dashed border-white/20">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-6 border border-white/10">
                        <FileText className="w-10 h-10 text-white/30" />
                      </div>
                      <h3 className="text-2xl font-light text-white/70">Nenhum orçamento encontrado</h3>
                      <p className="text-white/40 mt-2">Crie um novo orçamento para começar.</p>
                    </GlassPanel>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 px-8 shadow-2xl gap-4">
                <div className="flex items-center gap-4">
                  <BackButton onClick={() => {
                    setIsCreating(false);
                    setEditingQuote(null);
                    setClientId('');
                    setItems([]);
                    setInstallments([]);
                  }} />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-light tracking-wide text-white">
                      <span className="font-bold">{editingQuote ? 'Editar' : 'Nova'}</span> Proposta
                    </h1>
                  </div>
                </div>
                <button 
                  onClick={handleSave}
                  className="bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/30 text-white px-8 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                >
                  <Save className="w-5 h-5" /> 
                  FINALIZAR ORÇAMENTO
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Config */}
                <div className="lg:col-span-1 space-y-8">
                  <GlassPanel className="p-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6">Informações Base</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Cliente Destinatário</label>
                        <select 
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 outline-none transition-colors text-white font-bold"
                        >
                          <option value="" className="bg-[#0f0f11]">Selecione um cliente...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0f0f11]">{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Importação Rápida</label>
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={downloadTemplate}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Baixar Modelo CSV
                          </button>
                          
                          <input 
                            type="file" 
                            accept=".csv" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden" 
                            id="csv-upload"
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-blue-600/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-400 px-4 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center justify-center gap-2"
                          >
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                            ) : uploadSuccess ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4" />
                            )}
                            {isUploading ? 'Processando...' : uploadSuccess ? 'Sucesso' : 'Carregar Planilha'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-blue-500/20 transition-colors duration-700"></div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6 relative z-10">Resumo Financeiro</h3>
                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 uppercase tracking-widest text-[10px] font-bold">Subtotal Bruto</span>
                        <span className="font-mono font-bold text-white/80">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 uppercase tracking-widest text-[10px] font-bold">Descontos</span>
                        <span className="font-mono font-bold text-emerald-400">R$ 0,00</span>
                      </div>
                      <div className="pt-6 border-t border-white/10 flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/50">Total Geral</span>
                        <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </span>
                      </div>
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Condições de Pagamento</h3>
                      <button 
                        onClick={addInstallment}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all active:scale-95 border border-white/10 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Plus className="w-3 h-3" /> Parcela
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {installments.map((inst, index) => (
                        <div key={inst.id} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/10">
                          <input 
                            type="text" 
                            value={inst.description}
                            onChange={(e) => updateInstallment(inst.id, 'description', e.target.value)}
                            className="flex-1 bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs font-bold text-white focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                            placeholder="Ex: Entrada"
                          />
                          <input 
                            type="number" 
                            value={inst.value}
                            onChange={(e) => updateInstallment(inst.id, 'value', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs font-mono font-bold text-right text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                            placeholder="Valor"
                            min="0"
                            step="0.01"
                          />
                          <input 
                            type="date" 
                            value={inst.dueDate || ''}
                            onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                            className="w-32 bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs font-mono text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all [color-scheme:dark]"
                          />
                          <button 
                            onClick={() => removeInstallment(inst.id)}
                            className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {installments.length === 0 && (
                        <p className="text-xs text-white/30 text-center py-4 italic">Nenhuma parcela adicionada. O pagamento será considerado à vista.</p>
                      )}
                      {installments.length > 0 && (
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total Parcelado</span>
                          <span className={`font-mono font-bold text-sm ${Math.abs(totalInstallmentsValue - totalValue) > 0.01 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInstallmentsValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </GlassPanel>
                </div>

                {/* Right Column: Items */}
                <div className="lg:col-span-2">
                  <GlassPanel className="overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <h2 className="text-xl font-bold tracking-widest uppercase text-white">Itens da Proposta</h2>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <select 
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const product = products.find(p => p.id === e.target.value);
                            if (product) {
                              setItems([...items, { id: uuidv4(), description: product.name, quantity: 1, unitPrice: product.price, total: product.price }]);
                            }
                            e.target.value = '';
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:border-blue-500/50 outline-none transition-colors text-white"
                        >
                          <option value="" className="bg-[#0f0f11]">Catálogo...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} className="bg-[#0f0f11]">{p.name} - R$ {p.price}</option>
                          ))}
                        </select>
                        <button 
                          onClick={addItem}
                          className="bg-white/10 text-white p-2 px-4 rounded-xl hover:bg-white/20 transition-all active:scale-95 border border-white/10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto flex-1 p-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                            <th className="p-4">Descrição</th>
                            <th className="p-4 w-24 text-center">Qtd</th>
                            <th className="p-4 w-32 text-right">Unitário</th>
                            <th className="p-4 w-32 text-right">Total</th>
                            <th className="p-4 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {items.map((item) => (
                            <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-sm font-bold text-white focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                                  placeholder="Nome do serviço ou produto"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-sm font-mono font-bold text-center text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                                  min="1"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number" 
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-sm font-mono font-bold text-right text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <span className="text-sm font-bold text-white font-mono px-3">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="p-2 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-16 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-30">
                                  <Wrench className="w-10 h-10" />
                                  <p className="text-[10px] font-bold uppercase tracking-widest">Adicione itens para compor o orçamento.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </GlassPanel>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quote View Modal */}
      <Modal 
        isOpen={!!viewingQuote} 
        onClose={() => setViewingQuote(null)} 
        title="Detalhes da Proposta"
        maxWidth="4xl"
        glass
      >
        {viewingQuote && (
          <div className="space-y-8 p-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Cliente</p>
                <h3 className="text-3xl font-light text-white">
                  {clients.find(c => c.id === viewingQuote.clientId)?.name}
                </h3>
                <p className="text-sm text-white/40 font-mono mt-1">
                  Emitido em {safeFormatDate(viewingQuote.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Valor Total</p>
                <p className="text-4xl font-light text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingQuote.totalValue)}
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/10">
                    <th className="p-4">Item / Descrição</th>
                    <th className="p-4 text-center">Qtd</th>
                    <th className="p-4 text-right">Unitário</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {viewingQuote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-4 text-sm font-bold text-white">{item.description}</td>
                      <td className="p-4 text-sm text-center text-white/60 font-mono">{item.quantity}</td>
                      <td className="p-4 text-sm text-right text-white/60 font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                      </td>
                      <td className="p-4 text-sm text-right font-bold text-white font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewingQuote.installments && viewingQuote.installments.length > 0 && (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Condições de Pagamento</h4>
                <div className="space-y-3">
                  {viewingQuote.installments.map((inst, idx) => (
                    <div key={inst.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-white/80">{inst.description}</span>
                      <div className="flex items-center gap-4">
                        {inst.dueDate && (
                          <span className="text-white/40 font-mono">{safeFormatDate(inst.dueDate)}</span>
                        )}
                        <span className="font-bold text-white font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 flex-wrap">
              <button 
                onClick={() => handleDownloadPdf(viewingQuote)}
                className="flex-1 bg-blue-600/80 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-blue-400/30 transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              >
                <Download className="w-5 h-5" /> Baixar PDF do Orçamento
              </button>
              <button 
                onClick={() => {
                  const client = clients.find(c => c.id === viewingQuote.clientId);
                  const email = client?.email || '';
                  const subject = `Orçamento - ${viewingQuote.id.substring(0, 8).toUpperCase()}`;
                  const body = `Olá ${client?.name || ''},\n\nSegue o orçamento solicitado.\n\nValor Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingQuote.totalValue)}\n\nAtenciosamente,\n${companyData?.name || 'CONDFY.IA'}`;
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  toast.success('Abrindo cliente de e-mail...');
                }}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-blue-500/30 transition-all active:scale-95"
              >
                <Mail className="w-5 h-5" /> Enviar por E-mail
              </button>
              <button 
                onClick={() => setViewingQuote(null)}
                className="px-8 py-4 text-white/60 hover:text-white transition-colors font-bold w-full sm:w-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Ultra-Quality PDF Template */}
      {quoteToPrint && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div 
            ref={printRef}
            ref-name="printRef"
            className="bg-white w-[800px] text-zinc-900 font-sans pdf-content relative overflow-hidden"
            style={{ padding: '0', margin: '0', minHeight: '1122px' }}
          >
            {/* Top Accent Bar */}
            <div className="h-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>

            <div className="p-12">
              {/* Header */}
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-start gap-6">
                  {companyLogo ? (
                    <img 
                      src={companyLogo} 
                      alt="Logo" 
                      className="h-20 w-auto object-contain rounded-xl shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center rounded-2xl shadow-lg">
                      <Wrench className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col mt-1">
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900">{companyData?.name || 'CONDFY.IA'}</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-1">CNPJ: {companyData?.document || '---'}</p>
                    <p className="text-sm font-medium text-zinc-500">{companyData?.email || 'contato@empresa.com'}</p>
                    <p className="text-sm font-medium text-zinc-500">{companyData?.phone || '(00) 0000-0000'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-4xl font-black tracking-tighter text-blue-700 uppercase mb-4">Orçamento</h2>
                  <div className="flex flex-col gap-1 text-right">
                    <p className="text-sm font-bold text-zinc-800">
                      <span className="text-zinc-400 uppercase tracking-widest text-xs mr-2">Nº</span>
                      {quoteToPrint.id.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm font-bold text-zinc-800">
                      <span className="text-zinc-400 uppercase tracking-widest text-xs mr-2">Data</span>
                      {safeFormatDate(quoteToPrint.date)}
                    </p>
                    <p className="text-sm font-bold text-zinc-800">
                      <span className="text-zinc-400 uppercase tracking-widest text-xs mr-2">Validade</span>
                      15 Dias
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Info Section */}
              <div className="mb-12 flex gap-8">
                <div className="flex-1 bg-zinc-50 p-6 rounded-3xl border border-zinc-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">Preparado Para</h3>
                  <p className="text-2xl font-bold text-zinc-900 mb-2">
                    {clients.find(c => c.id === quoteToPrint.clientId)?.name}
                  </p>
                  <div className="space-y-1 text-sm text-zinc-600">
                    <p><span className="font-semibold text-zinc-400 w-12 inline-block">DOC:</span> {clients.find(c => c.id === quoteToPrint.clientId)?.document || '---'}</p>
                    <p><span className="font-semibold text-zinc-400 w-12 inline-block">TEL:</span> {clients.find(c => c.id === quoteToPrint.clientId)?.phone || '---'}</p>
                    <p><span className="font-semibold text-zinc-400 w-12 inline-block">END:</span> {clients.find(c => c.id === quoteToPrint.clientId)?.address || '---'}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-12 rounded-3xl overflow-hidden border border-zinc-200">
                <table className="w-full">
                  <thead className="bg-zinc-100">
                    <tr className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      <th className="py-4 px-6 text-left">Descrição do Serviço/Produto</th>
                      <th className="py-4 px-6 text-center w-24">Qtd</th>
                      <th className="py-4 px-6 text-right w-36">V. Unitário</th>
                      <th className="py-4 px-6 text-right w-40">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {quoteToPrint.items.map((item, idx) => (
                      <tr key={item.id} className="break-inside-avoid">
                        <td className="py-5 px-6">
                          <p className="text-base font-bold text-zinc-800">{item.description}</p>
                        </td>
                        <td className="py-5 px-6 text-center text-base font-medium text-zinc-600">{item.quantity}</td>
                        <td className="py-5 px-6 text-right text-base font-medium text-zinc-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                        </td>
                        <td className="py-5 px-6 text-right text-base font-bold text-zinc-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals and Notes */}
              <div className="flex justify-between items-start mb-16 break-inside-avoid">
                <div className="w-1/2 pr-8">
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 mb-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Termos e Condições</h4>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      Este orçamento é válido por 15 dias a partir da data de emissão. 
                      Os valores apresentados contemplam apenas os serviços descritos. 
                      Serviços adicionais serão cobrados separadamente mediante aprovação.
                    </p>
                  </div>

                  {quoteToPrint.installments && quoteToPrint.installments.length > 0 && (
                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Condições de Pagamento</h4>
                      <div className="space-y-2">
                        {quoteToPrint.installments.map((inst, idx) => (
                          <div key={inst.id} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-zinc-700">{inst.description}</span>
                            <div className="flex items-center gap-4">
                              {inst.dueDate && (
                                <span className="text-zinc-400 font-mono">{safeFormatDate(inst.dueDate)}</span>
                              )}
                              <span className="font-bold text-zinc-900 font-mono">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="w-1/2 bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-zinc-500">
                      <span className="text-sm font-bold uppercase tracking-wider">Subtotal</span>
                      <span className="text-lg font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quoteToPrint.totalValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500">
                      <span className="text-sm font-bold uppercase tracking-wider">Descontos</span>
                      <span className="text-lg font-medium">R$ 0,00</span>
                    </div>
                    <div className="pt-4 border-t border-zinc-200 flex justify-between items-center">
                      <span className="text-base font-black uppercase tracking-widest text-blue-600">Total Geral</span>
                      <span className="text-3xl font-black text-zinc-900 tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quoteToPrint.totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-16 mt-auto pt-12 break-inside-avoid">
                <div className="text-center">
                  <div className="h-24 flex items-end justify-center mb-2">
                    {companySignature && (
                      <img 
                        src={companySignature} 
                        alt="Assinatura" 
                        className="max-h-full max-w-full object-contain" 
                      />
                    )}
                  </div>
                  <div className="border-t-2 border-zinc-300 pt-2">
                    <p className="text-sm font-bold text-zinc-900">{companyData?.name || 'CONDFY.IA'}</p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Responsável Técnico</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-24 mb-2"></div>
                  <div className="border-t-2 border-zinc-300 pt-2">
                    <p className="text-sm font-bold text-zinc-900">{clients.find(c => c.id === quoteToPrint.clientId)?.name || 'Cliente'}</p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Assinatura de Aprovação</p>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-zinc-100 text-center">
                <p className="text-xs font-medium text-zinc-400">
                  Gerado por {companyData?.name || 'IA COMPANY'} • {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />
    </div>
  );
}

