import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Target, MapPin, Plus, Search, 
  Filter, Calendar, DollarSign, FileText, 
  CheckCircle2, Clock, XCircle, MoreVertical,
  Trash2, Edit2, ArrowLeft, ChevronRight,
  BarChart3, PieChart, Users, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CommercialCenter: React.FC = () => {
  const { sales, clients, addSale, updateSale, deleteSale } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PROPOSAL' | 'SALE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    value: 0,
    description: '',
    status: 'PROPOSAL' as 'PROPOSAL' | 'SALE',
    area: '',
    notes: ''
  });

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const client = clients.find(c => c.id === s.clientId);
      const matchesSearch = 
        client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.area.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, clients, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const totalSales = sales.filter(s => s.status === 'SALE').reduce((acc, s) => acc + s.value, 0);
    const totalProposals = sales.filter(s => s.status === 'PROPOSAL').reduce((acc, s) => acc + s.value, 0);
    const conversionRate = sales.length > 0 ? (sales.filter(s => s.status === 'SALE').length / sales.length) * 100 : 0;
    
    return {
      totalSales,
      totalProposals,
      conversionRate,
      count: sales.length,
      salesCount: sales.filter(s => s.status === 'SALE').length,
      proposalsCount: sales.filter(s => s.status === 'PROPOSAL').length
    };
  }, [sales]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.area) {
      toast.error('Cliente e Área são obrigatórios');
      return;
    }

    try {
      if (editingSale) {
        await updateSale(editingSale.id, formData);
        toast.success('Registro atualizado!');
      } else {
        await addSale(formData);
        toast.success('Registro criado!');
      }
      setIsModalOpen(false);
      setEditingSale(null);
      setFormData({
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        value: 0,
        description: '',
        status: 'PROPOSAL',
        area: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Erro ao salvar registro');
    }
  };

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    setFormData({
      clientId: sale.clientId,
      date: sale.date,
      value: sale.value,
      description: sale.description,
      status: sale.status,
      area: sale.area,
      notes: sale.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este registro?')) {
      await deleteSale(id);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Central Comercial</h1>
              <p className="text-white/60">Gestão de vendas, propostas e mapeamento de áreas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sales-planning')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Planejamento
            </button>
            <button
              onClick={() => {
                setEditingSale(null);
                setFormData({
                  clientId: '',
                  date: new Date().toISOString().split('T')[0],
                  value: 0,
                  description: '',
                  status: 'PROPOSAL',
                  area: '',
                  notes: ''
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Novo Registro
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-400 font-medium">+12%</span>
            </div>
            <p className="text-sm text-white/40">Vendas Totais</p>
            <p className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalSales)}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400 font-medium">{stats.proposalsCount} Ativas</span>
            </div>
            <p className="text-sm text-white/40">Valor em Propostas</p>
            <p className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalProposals)}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-purple-400 font-medium">{stats.conversionRate.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-white/40">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-white">{stats.salesCount} Vendas</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-xs text-orange-400 font-medium">Mapeamento</span>
            </div>
            <p className="text-sm text-white/40">Áreas Atuantes</p>
            <p className="text-2xl font-bold text-white">
              {Array.from(new Set(sales.map(s => s.area))).filter(Boolean).length} Áreas
            </p>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por cliente, área ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filterStatus === 'ALL' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('SALE')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filterStatus === 'SALE' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white'}`}
            >
              Vendas
            </button>
            <button
              onClick={() => setFilterStatus('PROPOSAL')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filterStatus === 'PROPOSAL' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:text-white'}`}
            >
              Propostas
            </button>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => {
                    const client = clients.find(c => c.id === sale.clientId);
                    return (
                      <motion.tr 
                        key={sale.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-white font-medium">
                              {format(new Date(sale.date), 'dd/MM/yyyy')}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {format(new Date(sale.date), 'EEEE', { locale: ptBR })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-xs">
                              {client?.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-white font-medium">{client?.name || 'Cliente não encontrado'}</span>
                              <span className="text-xs text-white/40 truncate max-w-[200px]">{sale.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/60">
                            {sale.area}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            sale.status === 'SALE' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {sale.status === 'SALE' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {sale.status === 'SALE' ? 'Venda' : 'Proposta'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(sale)}
                              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(sale.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-white/5 rounded-full">
                          <Search className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-white/40">Nenhum registro encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h2 className="text-xl font-bold text-white">
                  {editingSale ? 'Editar Registro' : 'Novo Registro Comercial'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Cliente</label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    >
                      <option value="" className="bg-zinc-900">Selecionar Cliente</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Data</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Valor</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Área de Atuação</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        placeholder="Ex: Centro, Zona Sul, Bairro X..."
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'PROPOSAL' })}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          formData.status === 'PROPOSAL' 
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                        }`}
                      >
                        Proposta
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'SALE' })}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          formData.status === 'SALE' 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                        }`}
                      >
                        Venda
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Descrição / Serviço</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[80px]"
                      placeholder="Descreva o que está sendo negociado..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/20"
                  >
                    {editingSale ? 'Salvar Alterações' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
