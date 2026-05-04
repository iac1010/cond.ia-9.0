import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Receipt } from '../types';
import { Download, Printer, FileText, FileCheck, Calendar, DollarSign, User, Trash2, Search, Share2 } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { safeFormatDate } from '../utils/dateUtils';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Receipts() {
  const navigate = useNavigate();
  const { clients, receipts, companyLogo, companyData, companySignature, addReceipt, deleteReceipt } = useStore();
  const [clientId, setClientId] = useState('');
  const [value, setValue] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingReceipt, setDownloadingReceipt] = useState<Receipt | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find(c => c.id === clientId);

  const filteredReceipts = receipts
    .filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      const searchStr = `${client?.name} ${r.description} ${r.value}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });

  const handleSaveAndDownload = async () => {
    if (!clientId || value <= 0 || !description || !date) {
      toast.error('Preencha todos os campos obrigatórios (Cliente, Valor, Descrição e Data).');
      return;
    }

    if (!receiptRef.current) return;

    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    setIsGenerating(true);
    try {
      // Save to store
      addReceipt({
        clientId,
        value,
        description,
        date
      });

      // Generate PDF
      const safeName = selectedClient?.name ? selectedClient.name.replace(/\s+/g, '_') : 'Cliente';
      const fileName = `Recibo_${safeName}_${date}.pdf`;
      
      await generatePdf(receiptRef.current, fileName);
      
      // Reset form
      setClientId('');
      setValue(0);
      setDescription('');
      toast.success('Recibo gerado e salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      toast.error('Erro ao gerar PDF. Tente usar o botão "Imprimir" no topo da página como alternativa.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndShare = async () => {
    if (!clientId || value <= 0 || !description || !date) {
      toast.error('Preencha todos os campos obrigatórios (Cliente, Valor, Descrição e Data).');
      return;
    }

    if (!receiptRef.current) return;

    window.scrollTo(0, 0);
    setIsGenerating(true);

    try {
      // Save to store
      addReceipt({
        clientId,
        value,
        description,
        date
      });

      // Share PDF
      const safeName = selectedClient?.name ? selectedClient.name.replace(/\s+/g, '_') : 'Cliente';
      const fileName = `Recibo_${safeName}_${date}.pdf`;
      await sharePdf(receiptRef.current, fileName);
      
      // Reset form
      setClientId('');
      setValue(0);
      setDescription('');
      toast.success('Recibo compartilhado e salvo com sucesso!');
      
    } catch (error: any) {
      console.error('Erro ao compartilhar recibo:', error);
      const errorMsg = error?.message || 'Erro desconhecido';
      if (errorMsg.includes('Compartilhamento não suportado')) {
        toast.error(errorMsg);
      } else {
        toast.error(`Erro ao compartilhar: ${errorMsg}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExisting = async (receipt: Receipt) => {
    setDownloadingReceipt(receipt);
    
    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    setIsGenerating(true);
    
    // Wait for state to update and DOM to render
    setTimeout(async () => {
      if (downloadRef.current) {
        try {
          const client = clients.find(c => c.id === receipt.clientId);
          const safeName = client?.name ? client.name.replace(/\s+/g, '_') : 'Cliente';
          const fileName = `Recibo_${safeName}_${receipt.date}.pdf`;
          await generatePdf(downloadRef.current, fileName);
          toast.success('Download iniciado!');
        } catch (error) {
          console.error('Erro ao baixar recibo:', error);
          toast.error('Erro ao gerar PDF do recibo antigo.');
        }
      }
      setDownloadingReceipt(null);
      setIsGenerating(false);
    }, 800);
  };

  const handleShareReceipt = async (receipt: Receipt) => {
    setDownloadingReceipt(receipt);
    window.scrollTo(0, 0);
    setIsGenerating(true);
    
    setTimeout(async () => {
      if (downloadRef.current) {
        try {
          const client = clients.find(c => c.id === receipt.clientId);
          const safeName = client?.name ? client.name.replace(/\s+/g, '_') : 'Cliente';
          const fileName = `Recibo_${safeName}_${receipt.date}.pdf`;
          await sharePdf(downloadRef.current, fileName);
          toast.success('Compartilhamento iniciado!');
        } catch (error: any) {
          console.error('Erro ao compartilhar recibo:', error);
          const errorMsg = error?.message || 'Erro desconhecido';
          if (errorMsg.includes('Compartilhamento não suportado')) {
            toast.error(errorMsg);
          } else {
            toast.error(`Erro ao compartilhar: ${errorMsg}`);
          }
        }
      }
      setDownloadingReceipt(null);
      setIsGenerating(false);
    }, 800);
  };

  const handleDeleteReceipt = (id: string) => {
    setReceiptToDelete(id);
  };

  const confirmDelete = () => {
    if (receiptToDelete) {
      deleteReceipt(receiptToDelete);
      toast.success('Recibo excluído com sucesso!');
      setReceiptToDelete(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex flex-col items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full mb-6"
          />
          <p className="text-white font-black uppercase tracking-widest text-sm animate-pulse">Gerando Recibo...</p>
        </div>
      )}

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 print:hidden">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-6xl font-light tracking-tight">Recibos</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Gere e salve recibos profissionais em PDF</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all"
          >
            <Printer className="w-5 h-5" /> 
            <span className="font-medium">Imprimir</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveAndDownload}
            disabled={isGenerating || !clientId || value <= 0 || !description || !date}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" /> 
            <span className="text-lg font-medium">{isGenerating ? 'Gerando...' : 'Salvar e Baixar'}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveAndShare}
            disabled={isGenerating || !clientId || value <= 0 || !description || !date}
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg shadow-white/10"
          >
            <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
            <span className="text-lg font-medium">{isGenerating ? 'Gerando...' : 'Salvar e Compartilhar'}</span>
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 print:hidden"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 p-3 rounded-xl">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Dados do Recibo</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Cliente *
              </label>
              <select 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white rounded-xl px-4 py-3 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#004a7c]">Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#004a7c]">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">R$</span>
                <input 
                  type="number" 
                  value={value || ''}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white rounded-xl pl-12 pr-4 py-3 outline-none transition-all placeholder:text-white/20"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Data *
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white rounded-xl px-4 py-3 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Referente a *
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white rounded-xl px-4 py-3 outline-none transition-all min-h-[150px] resize-none placeholder:text-white/20"
                placeholder="Ex: Serviços de manutenção preventiva e corretiva nos portões eletrônicos..."
              />
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white/5 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white/10 overflow-x-auto print:p-0 print:bg-transparent print:border-none">
            
            {/* Actual Receipt to be printed/saved */}
            <div 
              ref={receiptRef}
              ref-name="receiptRef"
              className="bg-white w-full max-w-[800px] mx-auto shadow-2xl p-12 text-gray-900 print:shadow-none rounded-sm pdf-content"
              style={{ minHeight: '1056px' }} // A4 approximate ratio
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8 break-inside-avoid">
                <div className="flex items-center gap-4">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="h-16 w-auto max-w-[200px] object-contain" />
                  ) : (
                    <div className="p-3 bg-red-600 rounded-lg">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-wider">Recibo</h2>
                    <p className="text-gray-500 font-medium">Nº {Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {companyData ? (
                    <>
                      <p className="font-bold text-gray-900">{companyData.name}</p>
                      <p>CNPJ/CPF: {companyData.document}</p>
                      <p>{companyData.phone}</p>
                      <p>{companyData.email}</p>
                    </>
                  ) : (
                    <p className="italic">Configure os dados da empresa<br/>nas Configurações</p>
                  )}
                </div>
              </div>

              {/* Value Box */}
              <div className="flex justify-end mb-8 break-inside-avoid">
                <div className="text-3xl font-bold text-gray-900 border-2 border-gray-900 p-4 rounded-lg inline-block bg-gray-50">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-10 text-xl leading-relaxed break-inside-avoid">
                <p>
                  Recebi(emos) de <strong className="uppercase border-b border-gray-300 pb-1">{selectedClient?.name || '__________________________________________________'}</strong>, 
                  {selectedClient?.document ? ` inscrito(a) no CNPJ/CPF sob o nº ${selectedClient.document}, ` : ' '}
                  a importância de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}</strong>.
                </p>

                <p>
                  Referente a: <span className="italic border-b border-gray-200 pb-1 inline-block w-full">{description || '________________________________________________________________________________________________________________________________________________________________'}</span>
                </p>

                <p className="text-gray-700">
                  Para maior clareza, firmo(amos) o presente recibo para que produza os seus efeitos legais.
                </p>
              </div>

              {/* Footer */}
              <div className="mt-32 pt-8 text-center break-inside-avoid no-break">
                <p className="mb-20 text-lg">
                  _________________, {safeFormatDate(date, { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <div className="grid grid-cols-2 gap-16 max-w-3xl mx-auto">
                  <div className="flex flex-col items-center w-full">
                    <div className="h-20 flex items-end justify-center w-full">
                      {companySignature && (
                        <img src={companySignature} alt="Assinatura" className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                    <div className="border-t-2 border-gray-800 pt-3 w-full">
                      <p className="font-bold text-lg">Síndico</p>
                      <p className="text-sm text-gray-500 mt-1">Assinatura</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-full">
                    <div className="h-20 w-full"></div>
                    <div className="border-t-2 border-gray-800 pt-3 w-full">
                      <p className="font-bold text-lg">Cliente</p>
                      <p className="text-sm text-gray-500 mt-1">Assinatura</p>
                    </div>
                  </div>
                </div>
                {/* Spacer to prevent cutting off at the bottom of the page */}
                <div style={{ height: '40px', color: 'transparent', overflow: 'hidden' }}>.</div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>

      {/* Receipts List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 relative z-10 print:hidden"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Recibos Gerados</h2>
                <p className="text-white/50 text-sm">Histórico de todos os recibos emitidos</p>
              </div>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar por cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 text-white rounded-xl pl-12 pr-4 py-3 outline-none transition-all placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/30">Data</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/30">Cliente</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/30">Descrição</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/30">Valor</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-white/30 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredReceipts.length > 0 ? (
                    filteredReceipts.map((receipt) => {
                      const client = clients.find(c => c.id === receipt.clientId);
                      return (
                        <motion.tr 
                          key={receipt.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="group hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-white/70">
                            {safeFormatDate(receipt.date)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{client?.name || 'Cliente excluído'}</div>
                            <div className="text-xs text-white/30">{client?.document}</div>
                          </td>
                          <td className="px-6 py-4 text-white/60 max-w-md truncate">
                            {receipt.description}
                          </td>
                          <td className="px-6 py-4 font-black text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receipt.value)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleDownloadExisting(receipt)}
                                className="p-2 bg-white/5 hover:bg-white/20 text-white rounded-lg transition-all"
                                title="Baixar PDF"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleShareReceipt(receipt)}
                                className="p-2 bg-white/10 hover:bg-white/30 text-white rounded-lg transition-all"
                                title="Compartilhar"
                              >
                                <Share2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteReceipt(receipt.id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                        Nenhum recibo encontrado.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Hidden Receipt for Download */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        {downloadingReceipt && (
          <div 
            ref={downloadRef}
            className="bg-white w-[794px] p-12 text-gray-900 border-l-8 border-red-600"
            style={{ padding: '48px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
              <div className="flex items-center gap-4">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="h-16 w-auto max-w-[200px] object-contain" />
                ) : (
                  <div className="p-3 bg-red-600 rounded-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-wider">Recibo</h2>
                  <p className="text-gray-500 font-medium">Nº {downloadingReceipt.id.slice(0, 4).toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                {companyData ? (
                  <>
                    <p className="font-bold text-gray-900">{companyData.name}</p>
                    <p>CNPJ/CPF: {companyData.document}</p>
                    <p>{companyData.phone}</p>
                    <p>{companyData.email}</p>
                  </>
                ) : (
                  <p className="italic">Dados da empresa não configurados</p>
                )}
              </div>
            </div>

            {/* Value Box */}
            <div className="flex justify-end mb-8">
              <div className="text-3xl font-bold text-gray-900 border-2 border-gray-900 p-4 rounded-lg inline-block bg-gray-50">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(downloadingReceipt.value)}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-10 text-xl leading-relaxed">
              <p>
                Recebi(emos) de <strong className="uppercase border-b border-gray-300 pb-1">
                  {clients.find(c => c.id === downloadingReceipt.clientId)?.name || 'Cliente'}
                </strong>, 
                {clients.find(c => c.id === downloadingReceipt.clientId)?.document ? ` inscrito(a) no CNPJ/CPF sob o nº ${clients.find(c => c.id === downloadingReceipt.clientId)?.document}, ` : ' '}
                a importância de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(downloadingReceipt.value)}</strong>.
              </p>

              <p>
                Referente a: <span className="italic border-b border-gray-200 pb-1 inline-block w-full">{downloadingReceipt.description}</span>
              </p>

              <p className="text-gray-700">
                Para maior clareza, firmo(amos) o presente recibo para que produza os seus efeitos legais.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-32 pt-8 text-center break-inside-avoid no-break">
              <p className="mb-20 text-lg">
                _________________, {safeFormatDate(downloadingReceipt.date, { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <div className="grid grid-cols-2 gap-16 max-w-3xl mx-auto">
                <div className="flex flex-col items-center w-full">
                  <div className="h-20 flex items-end justify-center w-full">
                    {companySignature && (
                      <img src={companySignature} alt="Assinatura" className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                  <div className="border-t-2 border-gray-800 pt-3 w-full">
                    <p className="font-bold text-lg">Síndico</p>
                    <p className="text-sm text-gray-500 mt-1">Assinatura</p>
                  </div>
                </div>
                <div className="flex flex-col items-center w-full">
                  <div className="h-20 w-full"></div>
                  <div className="border-t-2 border-gray-800 pt-3 w-full">
                    <p className="font-bold text-lg">Cliente</p>
                    <p className="text-sm text-gray-500 mt-1">Assinatura</p>
                  </div>
                </div>
              </div>
              <div style={{ height: '40px', color: 'transparent', overflow: 'hidden' }}>.</div> {/* Bottom Padding for Page Breaks */}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {receiptToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#004a7c] border border-white/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-center mb-2">Excluir Recibo?</h3>
            <p className="text-white/60 text-center mb-8">Esta ação não pode ser desfeita. O recibo será removido permanentemente.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setReceiptToDelete(null)}
                className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
