import { useState } from 'react';
import { useStore } from '../store';
import { SupplyItem, Supplier, SupplyQuotation } from '../types';
import { 
  Package, 
  Truck, 
  FileSearch, 
  Plus, 
  Minus, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Search,
  Filter,
  ChevronRight,
  DollarSign,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Download,
  Share2,
  Printer
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { ShoppingListTemplate } from '../components/ShoppingListTemplate';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { format } from 'date-fns';

export default function SuppliesManager() {
  const navigate = useNavigate();
  const { 
    supplyItems, 
    suppliers, 
    supplyQuotations, 
    addSupplyItem, 
    updateSupplyItem, 
    deleteSupplyItem,
    updateStock,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    createQuotation,
    clients,
    companyData
  } = useStore();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stock' | 'suppliers' | 'quotations'>('stock');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [activeQuotationForPdf, setActiveQuotationForPdf] = useState<SupplyQuotation | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({ name: '', category: 'LIMPEZA' as string, minStock: 0, unit: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', phone: '', email: '', category: 'GERAL' as 'LIMPEZA' | 'PISCINA' | 'GERAL' | 'MANUTENCAO' | 'SEGURANCA' });
  const [quotationItems, setQuotationItems] = useState<{ supplyItemId: string; quantity: number }[]>([]);

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateSupplyItem(editingItem.id, { ...itemForm, currentStock: editingItem.currentStock, clientId: selectedClientId || undefined });
    } else {
      addSupplyItem({ ...itemForm, currentStock: 0, clientId: selectedClientId || undefined });
    }
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm);
    } else {
      addSupplier(supplierForm);
    }
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  const handleCreateQuotation = () => {
    if (quotationItems.length === 0) return;
    createQuotation(quotationItems);
    setIsQuotationModalOpen(false);
    setQuotationItems([]);
    toast.success('Cotação disparada com sucesso!');
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('shopping-list-pdf');
    if (!element) return;
    
    try {
      toast.loading('Gerando PDF...', { id: 'pdf' });
      await generatePdf(element, `Lista_Compras_${selectedClient?.name || 'Geral'}_${format(new Date(), 'ddMMyyyy')}`);
      toast.success('PDF gerado com sucesso!', { id: 'pdf' });
    } catch (error) {
      toast.error('Erro ao gerar PDF', { id: 'pdf' });
    }
  };

  const handleShareList = async () => {
    const element = document.getElementById('shopping-list-pdf');
    if (!element) return;

    try {
      toast.loading('Preparando compartilhamento...', { id: 'share' });
      await sharePdf(element, `Lista_Compras_${selectedClient?.name || 'Geral'}_${format(new Date(), 'ddMMyyyy')}`);
      toast.success('Pronto para compartilhar!', { id: 'share' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('não suportado')) {
        toast.success('PDF baixado com sucesso!', { id: 'share' });
      } else {
        toast.error('Erro ao compartilhar', { id: 'share' });
      }
    }
  };

  const handleDownloadQuotationPdf = async (quotation: SupplyQuotation) => {
    setActiveQuotationForPdf(quotation);
    // Wait for state update and re-render
    setTimeout(async () => {
      const element = document.getElementById(`quotation-pdf-${quotation.id}`);
      if (!element) return;
      
      try {
        toast.loading('Gerando PDF...', { id: 'pdf' });
        const firstItem = supplyItems.find(si => si.id === quotation.items[0]?.supplyItemId);
        const client = clients.find(c => c.id === firstItem?.clientId);
        await generatePdf(element, `Lista_Compras_${client?.name || 'Geral'}_${format(new Date(quotation.date), 'ddMMyyyy')}`);
        toast.success('PDF gerado com sucesso!', { id: 'pdf' });
      } catch (error) {
        toast.error('Erro ao gerar PDF', { id: 'pdf' });
      } finally {
        setActiveQuotationForPdf(null);
      }
    }, 100);
  };

  const handleShareQuotationList = async (quotation: SupplyQuotation) => {
    setActiveQuotationForPdf(quotation);
    // Wait for state update and re-render
    setTimeout(async () => {
      const element = document.getElementById(`quotation-pdf-${quotation.id}`);
      if (!element) return;

      try {
        toast.loading('Preparando compartilhamento...', { id: 'share' });
        const firstItem = supplyItems.find(si => si.id === quotation.items[0]?.supplyItemId);
        const client = clients.find(c => c.id === firstItem?.clientId);
        await sharePdf(element, `Lista_Compras_${client?.name || 'Geral'}_${format(new Date(quotation.date), 'ddMMyyyy')}`);
        toast.success('Pronto para compartilhar!', { id: 'share' });
      } catch (error) {
        if (error instanceof Error && error.message.includes('não suportado')) {
          toast.success('PDF baixado com sucesso!', { id: 'share' });
        } else {
          toast.error('Erro ao compartilhar', { id: 'share' });
        }
      } finally {
        setActiveQuotationForPdf(null);
      }
    }, 100);
  };

  const handleSendEmail = () => {
    if (quotationItems.length === 0) return;
    
    const itemCategories = new Set(
      quotationItems.map(qi => supplyItems.find(si => si.id === qi.supplyItemId)?.category)
    );
    
    const relevantSuppliers = suppliers.filter(s => s.category === 'GERAL' || itemCategories.has(s.category as any));
    const emails = relevantSuppliers.map(s => s.email).filter(Boolean).join(',');
    
    if (!emails) {
      toast.error('Nenhum fornecedor com e-mail encontrado.');
      return;
    }

    const subject = encodeURIComponent(`Cotação de Insumos - ${selectedClient?.name || 'Geral'}`);
    const body = encodeURIComponent(`Olá,\n\nSolicitamos cotação para os seguintes itens:\n\n${
      quotationItems.map(qi => {
        const item = supplyItems.find(si => si.id === qi.supplyItemId);
        return `- ${item?.name}: ${qi.quantity} ${item?.unit}`;
      }).join('\n')
    }\n\nAtenciosamente,\n${companyData?.name || 'Gestão de Insumos'}`);

    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
  };

  const handleSendQuotationEmail = (quotation: SupplyQuotation) => {
    const emails = quotation.responses
      .map(r => suppliers.find(s => s.id === r.supplierId)?.email)
      .filter(Boolean)
      .join(',');

    if (!emails) {
      toast.error('Nenhum e-mail encontrado.');
      return;
    }

    const firstItem = supplyItems.find(si => si.id === quotation.items[0]?.supplyItemId);
    const client = clients.find(c => c.id === firstItem?.clientId);

    const subject = encodeURIComponent(`Cotação de Insumos #${quotation.id.slice(0, 8)} - ${client?.name || 'Geral'}`);
    const body = encodeURIComponent(`Olá,\n\nSolicitamos cotação para os seguintes itens:\n\n${
      quotation.items.map(qi => {
        const item = supplyItems.find(si => si.id === qi.supplyItemId);
        return `- ${item?.name}: ${qi.quantity} ${item?.unit}`;
      }).join('\n')
    }\n\nAtenciosamente,\n${companyData?.name || 'Gestão de Insumos'}`);

    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const filteredSupplyItems = supplyItems.filter(item => item.clientId === selectedClientId);
  const lowStockItems = filteredSupplyItems.filter(item => item.currentStock <= item.minStock);

  if (!selectedClientId && activeTab === 'stock') {
    return (
      <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <BackButton />
            <div>
              <h1 className="text-6xl font-light tracking-tight">Insumos</h1>
              <p className="text-xl opacity-60 mt-2 font-light">Selecione o prédio para gerenciar o estoque</p>
            </div>
          </div>

          <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
            <button 
              onClick={() => setActiveTab('stock')}
              className="px-8 py-3 rounded-xl transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105"
            >
              <Package className="w-4 h-4" /> Estoque
            </button>
            <button 
              onClick={() => setActiveTab('suppliers')}
              className="px-8 py-3 rounded-xl transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest text-white/50 hover:text-white hover:bg-white/5"
            >
              <Truck className="w-4 h-4" /> Fornecedores
            </button>
            <button 
              onClick={() => setActiveTab('quotations')}
              className="px-8 py-3 rounded-xl transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest text-white/50 hover:text-white hover:bg-white/5"
            >
              <FileSearch className="w-4 h-4" /> Cotações
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {clients.map((client, idx) => (
            <motion.button
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedClientId(client.id)}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:bg-white/10 transition-all text-left flex items-center justify-between group"
            >
              <div>
                <h3 className="text-2xl font-bold mb-1">{client.name}</h3>
                <p className="text-white/40 text-sm">{client.address}</p>
              </div>
              <ChevronRight className="w-8 h-8 text-white/20 group-hover:text-white transition-colors" />
            </motion.button>
          ))}
          {clients.length === 0 && (
            <div className="col-span-full py-20 text-center text-white/30">
              <p className="text-xl">Nenhum prédio cadastrado.</p>
              <button onClick={() => navigate('/clients')} className="mt-4 text-white hover:underline">Cadastrar Prédios</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-6xl font-light tracking-tight">
              {activeTab === 'stock' && selectedClient ? selectedClient.name : 'Insumos'}
            </h1>
            <p className="text-xl opacity-60 mt-2 font-light">
              {activeTab === 'stock' ? 'Controle de estoque por prédio' : 'Controle de fornecedores e cotações'}
            </p>
          </div>
        </div>

        <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
          <button 
            onClick={() => setActiveTab('stock')}
            className={`px-8 py-3 rounded-xl transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest ${
              activeTab === 'stock' 
                ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" /> Estoque
          </button>
          <button 
            onClick={() => setActiveTab('suppliers')}
            className={`px-8 py-3 rounded-xl transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest ${
              activeTab === 'suppliers' 
                ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Truck className="w-4 h-4" /> Fornecedores
          </button>
          <button 
            onClick={() => setActiveTab('quotations')}
            className={`px-8 py-3 rounded-xl transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest ${
              activeTab === 'quotations' 
                ? 'bg-white text-[#004a7c] shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSearch className="w-4 h-4" /> Cotações
          </button>
        </div>
      </header>

      <main className="relative z-10">
        {activeTab === 'stock' && (
          <div className="space-y-8">
            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/20 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-md flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-400">Estoque Crítico</h3>
                    <p className="text-white/70">{lowStockItems.length} itens estão abaixo do nível mínimo.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setQuotationItems(lowStockItems.map(i => ({ supplyItemId: i.id, quantity: i.minStock * 2 })));
                    setIsQuotationModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  Gerar Cotação Automática
                </button>
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Buscar no estoque..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-white/30 transition-all"
                />
              </div>
              <button 
                onClick={() => { setEditingItem(null); setItemForm({ name: '', category: 'LIMPEZA', minStock: 0, unit: '' }); setIsItemModalOpen(true); }}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> Novo Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSupplyItems.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl hover:bg-white/15 transition-all shadow-2xl relative overflow-hidden group"
                >
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      item.category === 'PISCINA' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 'bg-white/10 text-white border-white/20'
                    }`}>
                      {item.category}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(item); setItemForm({ name: item.name, category: item.category, minStock: item.minStock, unit: item.unit }); setIsItemModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteSupplyItem(item.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold mb-8 tracking-tight">{item.name}</h3>

                  <div className="flex items-end justify-between">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">Estoque Atual</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-5xl font-light tracking-tighter ${item.currentStock <= item.minStock ? 'text-amber-400' : 'text-white'}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-sm font-bold opacity-30 uppercase tracking-widest">{item.unit}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateStock(item.id, -1)}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-white/10"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => updateStock(item.id, 1)}
                        className="w-12 h-12 bg-white text-[#004a7c] rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-white/10"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-xs">
                      <span className="text-white/40">Mínimo: {item.minStock} {item.unit}</span>
                      {item.lastPrice && (
                        <span className="text-white/60">Último: R$ {item.lastPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredSupplyItems.length === 0 && (
                <div className="col-span-full py-20 text-center text-white/30">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-xl">Nenhum item cadastrado para este prédio.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Buscar fornecedores..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-white/30 transition-all"
                />
              </div>
              <button 
                onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', contact: '', phone: '', email: '', category: 'GERAL' }); setIsSupplierModalOpen(true); }}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> Novo Fornecedor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier, idx) => (
                <motion.div 
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:bg-white/10 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => { setEditingSupplier(supplier); setSupplierForm(supplier); setIsSupplierModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteSupplier(supplier.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Truck className="w-8 h-8 text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{supplier.name}</h3>
                      <span className="text-xs text-white/40 uppercase font-black tracking-widest">{supplier.category}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-white/60">
                      <Mail className="w-4 h-4" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/60">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-white/40">Contato: {supplier.contact}</span>
                      <button className="text-white hover:text-white/80 text-sm font-bold transition-colors">Ver Histórico</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quotations' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-light">Histórico de Cotações</h2>
              <button 
                onClick={() => setIsQuotationModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> Nova Cotação
              </button>
            </div>

            <div className="space-y-4">
              {supplyQuotations.map((quotation, idx) => (
                <motion.div 
                  key={quotation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/10 p-3 rounded-2xl">
                        <FileSearch className="w-6 h-6 text-white/60" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Cotação #{quotation.id.slice(0, 8)}</h3>
                        <p className="text-sm text-white/40">{format(new Date(quotation.date), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 mr-4">
                        <button 
                          onClick={() => handleDownloadQuotationPdf(quotation)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all border border-white/5"
                          title="Baixar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleShareQuotationList(quotation)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all border border-white/5"
                          title="Compartilhar"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSendQuotationEmail(quotation)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all border border-white/5"
                          title="Enviar E-mail"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        quotation.status === 'OPEN' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20 animate-pulse' : 'bg-white/10 text-white border-white/20'
                      }`}>
                        {quotation.status === 'OPEN' ? 'Em Aberto' : 'Finalizada'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-4">Itens Solicitados</p>
                      <div className="space-y-2">
                        {quotation.items.map(qi => {
                          const item = supplyItems.find(si => si.id === qi.supplyItemId);
                          return (
                            <div key={qi.supplyItemId} className="flex justify-between text-sm bg-white/5 p-3 rounded-xl">
                              <span>{item?.name}</span>
                              <span className="font-bold">{qi.quantity} {item?.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-4">Respostas dos Fornecedores</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quotation.responses.map(resp => {
                          const supplier = suppliers.find(s => s.id === resp.supplierId);
                          const total = Object.values(resp.prices).reduce((acc, curr) => acc + curr, 0);
                          return (
                            <div key={resp.supplierId} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                              <div className="flex justify-between items-start mb-3">
                                <span className="font-bold">{supplier?.name}</span>
                                {resp.status === 'RECEIVED' ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
                                )}
                              </div>
                              {resp.status === 'RECEIVED' ? (
                                <div className="flex justify-between items-end">
                                  <span className="text-2xl font-light text-white">R$ {total.toFixed(2)}</span>
                                  <button className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Ver Detalhes</button>
                                </div>
                              ) : (
                                <p className="text-xs text-white/30 italic">Aguardando resposta...</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        title={editingItem ? 'Editar Item' : 'Novo Item de Estoque'}
        glass
      >
        <form onSubmit={handleItemSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Nome do Produto</label>
              <input 
                required
                type="text" 
                value={itemForm.name}
                onChange={e => setItemForm({...itemForm, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
                placeholder="Ex: Cloro Granulado"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Categoria</label>
              <select 
                value={itemForm.category}
                onChange={e => setItemForm({...itemForm, category: e.target.value as any})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
              >
                <option value="LIMPEZA">Limpeza</option>
                <option value="PISCINA">Piscina</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Unidade</label>
              <input 
                required
                type="text" 
                value={itemForm.unit}
                onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
                placeholder="Ex: Balde, Litro, Galão"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Estoque Mínimo</label>
              <input 
                required
                type="number" 
                value={itemForm.minStock}
                onChange={e => setItemForm({...itemForm, minStock: parseInt(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold border border-white/20 transition-all active:scale-95">
            {editingItem ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR ITEM'}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isSupplierModalOpen} 
        onClose={() => setIsSupplierModalOpen(false)} 
        title={editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        glass
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Nome da Empresa</label>
              <input 
                required
                type="text" 
                value={supplierForm.name}
                onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Responsável</label>
              <input 
                required
                type="text" 
                value={supplierForm.contact}
                onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Telefone</label>
              <input 
                required
                type="text" 
                value={supplierForm.phone}
                onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">E-mail</label>
              <input 
                required
                type="email" 
                value={supplierForm.email}
                onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Especialidade</label>
              <select 
                value={supplierForm.category}
                onChange={e => setSupplierForm({...supplierForm, category: e.target.value as any})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all"
              >
                <option value="GERAL">Geral</option>
                <option value="LIMPEZA">Limpeza</option>
                <option value="PISCINA">Piscina</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold border border-white/20 transition-all active:scale-95">
            {editingSupplier ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR FORNECEDOR'}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isQuotationModalOpen} 
        onClose={() => setIsQuotationModalOpen(false)} 
        title="Nova Cotação de Insumos"
        glass
        maxWidth="lg"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Selecionar Itens</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {(selectedClientId ? filteredSupplyItems : supplyItems).map(item => {
                  const selected = quotationItems.find(qi => qi.supplyItemId === item.id);
                  return (
                    <div key={item.id} className={`p-4 rounded-2xl border transition-all ${selected ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-xs opacity-40">{item.currentStock} {item.unit} em estoque</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <input 
                          type="number" 
                          placeholder="Qtd"
                          value={selected?.quantity || ''}
                          onChange={e => {
                            const qty = parseInt(e.target.value);
                            if (qty > 0) {
                              setQuotationItems(prev => {
                                const exists = prev.find(qi => qi.supplyItemId === item.id);
                                if (exists) return prev.map(qi => qi.supplyItemId === item.id ? { ...qi, quantity: qty } : qi);
                                return [...prev, { supplyItemId: item.id, quantity: qty }];
                              });
                            } else {
                              setQuotationItems(prev => prev.filter(qi => qi.supplyItemId !== item.id));
                            }
                          }}
                          className="w-24 bg-white/10 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/30"
                        />
                        <span className="text-sm opacity-40">{item.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Resumo da Cotação</h3>
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 h-full flex flex-col">
                {quotationItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-center">
                    <Clock className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nenhum item selecionado para cotação.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-4">
                      {quotationItems.map(qi => {
                        const item = supplyItems.find(si => si.id === qi.supplyItemId);
                        return (
                          <div key={qi.supplyItemId} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span>{item?.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="font-bold">{qi.quantity} {item?.unit}</span>
                              <button 
                                onClick={() => setQuotationItems(prev => prev.filter(p => p.supplyItemId !== qi.supplyItemId))}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-6 mt-6 border-t border-white/10 space-y-3">
                      <p className="text-xs text-white/40 mb-4">A cotação será enviada automaticamente para todos os fornecedores das categorias selecionadas.</p>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <button 
                          onClick={handleDownloadPdf}
                          className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold border border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs"
                        >
                          <Download className="w-4 h-4" /> PDF
                        </button>
                        <button 
                          onClick={handleShareList}
                          className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold border border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs"
                        >
                          <Share2 className="w-4 h-4" /> Enviar
                        </button>
                        <button 
                          onClick={handleSendEmail}
                          className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold border border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs"
                        >
                          <Mail className="w-4 h-4" /> E-mail
                        </button>
                      </div>

                      <button 
                        onClick={handleCreateQuotation}
                        className="w-full bg-white/20 hover:bg-white/30 text-white py-4 rounded-2xl font-bold shadow-lg border border-white/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        <Printer className="w-5 h-5" /> DISPARAR COTAÇÃO AUTOMÁTICA
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Hidden PDF Template for active creation */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <ShoppingListTemplate 
          items={quotationItems}
          supplyItems={supplyItems}
          client={selectedClient}
          companyData={companyData}
        />
      </div>

      {/* Hidden PDF Templates for history items */}
      {activeQuotationForPdf && (
        <div className="fixed left-[-9999px] top-0 pointer-events-none">
          <div id={`quotation-pdf-${activeQuotationForPdf.id}`}>
            <ShoppingListTemplate 
              items={activeQuotationForPdf.items}
              supplyItems={supplyItems}
              client={clients.find(c => c.id === supplyItems.find(si => si.id === activeQuotationForPdf.items[0]?.supplyItemId)?.clientId)}
              companyData={companyData}
            />
          </div>
        </div>
      )}
    </div>
  );
}
