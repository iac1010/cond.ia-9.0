import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Plus, Search, FileText, Calendar, DollarSign, Trash2, Edit2, 
  AlertCircle, UserPlus, TrendingUp, Clock, CheckCircle2, 
  AlertTriangle, Filter, LayoutGrid, List, Share2, Settings as SettingsIcon,
  Home, FolderOpen, PieChart, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, isAfter, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Modal } from '../components/Modal';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell, Pie, Pie as RePie
} from 'recharts';

import { GlassCard, CircularProgress } from '../components/GlassUI';

export default function Contracts() {
  const navigate = useNavigate();
  const { contracts, suppliers, addContract, updateContract, deleteContract, addSupplier, companyData } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  
  // Chart Data Generation
  const chartData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(date => ({
      name: format(date, 'EEE', { locale: ptBR }),
      vencimentos: contracts.filter(c => isSameDay(new Date(c.endDate), date)).length,
      novos: contracts.filter(c => isSameDay(new Date(c.startDate), date)).length,
    }));
  }, [contracts]);

  const [newContract, setNewContract] = useState({
    title: '',
    supplierId: '',
    category: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    value: 0,
    paymentFrequency: 'MENSAL' as 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
    status: 'ACTIVE' as 'ACTIVE' | 'CANCELLED' | 'EXPIRED',
    notes: ''
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    category: 'GERAL' as 'LIMPEZA' | 'PISCINA' | 'GERAL' | 'MANUTENCAO' | 'SEGURANCA'
  });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) {
      toast.error('O nome do fornecedor é obrigatório');
      return;
    }
    addSupplier(supplierForm);
    setIsAddingSupplier(false);
    setSupplierForm({ name: '', contact: '', phone: '', email: '', category: 'GERAL' });
    toast.success('Fornecedor cadastrado!');
  };

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddContract = () => {
    if (!newContract.title || !newContract.supplierId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    if (editingContract) {
      updateContract(editingContract, newContract);
    } else {
      addContract(newContract);
    }
    
    setIsAdding(false);
    setEditingContract(null);
    setNewContract({
      title: '', supplierId: '', category: '', startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addMonths(new Date(), 12), 'yyyy-MM-dd'), value: 0,
      paymentFrequency: 'MENSAL', status: 'ACTIVE', notes: ''
    });
  };

  const activeContracts = contracts.filter(c => c.status === 'ACTIVE' && !isAfter(new Date(), new Date(c.endDate)));
  const expiringSoon = contracts.filter(c => {
    const end = new Date(c.endDate);
    const thirtyDaysFromNow = addMonths(new Date(), 1);
    return isAfter(end, new Date()) && !isAfter(end, thirtyDaysFromNow);
  });

  return (
    <div className="min-h-screen -m-6 md:-m-8 p-6 md:p-10 relative overflow-hidden bg-zinc-950">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-emerald-950/20" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">
        {/* Modern Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <FolderOpen className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Heash Gestão de Contratos</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-emerald-400/80 text-sm font-medium">Gestão de contratos centralizada</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-white/40 text-sm">{format(new Date(), "EEEE, dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
            {[
              { icon: Home, label: 'Início', path: '/' },
              { icon: FileText, label: 'Todos os Contratos', onClick: () => document.getElementById('contracts-table')?.scrollIntoView({ behavior: 'smooth' }) },
              { icon: FolderOpen, label: 'Moradores', path: '/clients' },
              { icon: PieChart, label: 'Análise', onClick: () => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' }) },
              { icon: SettingsIcon, label: 'Configurações', path: '/settings' },
            ].map((item: any, i) => (
              <button 
                key={i}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  if (item.onClick) item.onClick();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  item.label === 'Todos os Contratos'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="text-right">
              <div className="text-sm font-bold text-white">Olá, Carlos!</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-black">Administrador</div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/50 p-0.5">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="User" 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </motion.header>

        {/* Bento Grid Content */}
        <div id="stats-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Stats & Recent */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard title="Situação Geral dos Contratos" icon={TrendingUp}>
              <div className="flex justify-around items-center py-4">
                <CircularProgress 
                  value={contracts.length > 0 ? Math.round((activeContracts.length / contracts.length) * 100) : 0} 
                  label="Total de Contratos" 
                  sublabel="Conformidade de Assinatura"
                  color="emerald"
                />
                <CircularProgress 
                  value={98} 
                  label="Armazenamento" 
                  sublabel="Espaço de Documentação"
                  color="emerald"
                />
              </div>
            </GlassCard>

            <GlassCard 
              title="Contratos Recentes" 
              icon={Clock}
              action={<button className="text-white/30 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4" /></button>}
            >
              <div className="space-y-3">
                {contracts.slice(0, 3).map((c, i) => (
                  <div key={i} className="group flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{c.title}</div>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-wider">
                          {c.status === 'ACTIVE' ? (
                            <span className="text-emerald-400/60">Em Andamento</span>
                          ) : (
                            <span className="text-amber-400/60">Pendente</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                  </div>
                ))}
                {contracts.length === 0 && (
                  <div className="py-8 text-center text-white/20 text-xs italic">Nenhum contrato recente</div>
                )}
              </div>
            </GlassCard>

            <GlassCard title="Buscar Contrato" icon={Search}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="text" 
                  placeholder="Busca contrato"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => setIsAdding(true)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Contrato
                </button>
                <button 
                  onClick={() => setIsAddingSupplier(true)}
                  className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-2xl border border-white/10 transition-all"
                  title="Novo Fornecedor"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Charts & Alerts */}
          <div className="lg:col-span-8 space-y-6">
            <GlassCard title="Estatísticas & Fluxos Contratuais" icon={TrendingUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Cronograma de Vencimentos (Dias)</div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorVenc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#ffffff40', fontSize: 10 }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="vencimentos" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorVenc)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">98%</div>
                    <div className="text-[10px] font-bold text-white/70 uppercase">TMD TOTAL (Tempo Médio de Renovação): 98%</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Resumo de Vencimentos Semanal</div>
                  <div className="space-y-2">
                    {chartData.map((day, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-white/40 uppercase w-8">{day.name}</span>
                          <span className="text-xs font-bold text-white/80">Fornecedor {String.fromCharCode(65 + i)}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                          i % 3 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 
                          i % 3 === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/40'
                        }`}>
                          {i % 3 === 0 ? 'Concl.' : i % 3 === 1 ? 'Em And.' : 'Pend.'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Tarefas Críticas: R$ 4.500 (Vencimento Próximo)</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard title="Notificações & Alertas Contratuais" icon={AlertCircle}>
                <div className="space-y-4">
                  {expiringSoon.length > 0 ? expiringSoon.map((c, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Alerta: Contrato de {c.title}</div>
                        <div className="text-xs text-white/40 mt-0.5">Vence em {format(new Date(c.endDate), 'dd/MM/yy')}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex gap-4 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Tudo em ordem!</div>
                        <div className="text-xs text-white/40 mt-0.5">Não há contratos vencendo nos próximos 30 dias.</div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Notificação: Assinatura Eletrônica</div>
                      <div className="text-xs text-white/40 mt-0.5">Aguardando assinatura do fornecedor de limpeza.</div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard title="Filtros & Modelos Populares" icon={Filter}>
                <div className="space-y-3">
                  {[
                    { icon: Filter, label: 'Filtro:', sub: 'Vencidos / Ativos', onClick: () => document.getElementById('contracts-table')?.scrollIntoView({ behavior: 'smooth' }) },
                    { icon: FolderOpen, label: 'Modelo:', sub: 'Aditivo Contratual', onClick: () => navigate('/document-factory') },
                    { icon: FileText, label: 'Modelo:', sub: 'Contrato de Prestação de Serviço', onClick: () => navigate('/document-factory') },
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      onClick={item.onClick}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <item.icon className="w-5 h-5 text-white/40 group-hover:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.label}</div>
                        <div className="text-sm font-bold text-white group-hover:text-emerald-400">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Full Table Section */}
        <div id="contracts-table">
          <GlassCard title="Lista Detalhada de Contratos" icon={List}>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Contrato</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Fornecedor</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Vigência</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContracts.map((contract) => {
                  const supplier = suppliers.find(s => s.id === contract.supplierId);
                  const isExpired = isAfter(new Date(), new Date(contract.endDate));
                  
                  return (
                    <tr key={contract.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <FileText className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{contract.title}</div>
                            <div className="text-[10px] text-white/40 uppercase font-black tracking-wider">{contract.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">{supplier?.name || 'N/A'}</div>
                        <div className="text-xs text-white/40">{supplier?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          {format(new Date(contract.startDate), 'dd/MM/yy')} - {format(new Date(contract.endDate), 'dd/MM/yy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-white">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          <span className="text-[10px] text-white/30 ml-1">/{contract.paymentFrequency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                          isExpired ? 'bg-red-500/20 text-red-400' : 
                          contract.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                        }`}>
                          {isExpired ? 'Expirado' : contract.status === 'ACTIVE' ? 'Ativo' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setNewContract({
                                title: contract.title,
                                supplierId: contract.supplierId,
                                category: contract.category,
                                startDate: contract.startDate,
                                endDate: contract.endDate,
                                value: contract.value,
                                paymentFrequency: contract.paymentFrequency,
                                status: contract.status,
                                notes: contract.notes || ''
                              });
                              setEditingContract(contract.id);
                              setIsAdding(true);
                            }}
                            className="p-2 text-white/20 hover:text-emerald-400 transition-colors" 
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteContract(contract.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredContracts.length === 0 && (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 text-sm italic">Nenhum contrato encontrado.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      </div>

      {/* Modals */}
      <Modal
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
          setEditingContract(null);
        }}
        title={editingContract ? "Editar Contrato" : "Cadastrar Novo Contrato"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Título</label>
              <input
                type="text"
                value={newContract.title}
                onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Ex: Manutenção de Elevadores"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Fornecedor</label>
                <button 
                  type="button"
                  onClick={() => setIsAddingSupplier(true)}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold uppercase tracking-wider"
                >
                  <UserPlus className="w-3 h-3" />
                  Novo
                </button>
              </div>
              <select
                value={newContract.supplierId}
                onChange={(e) => setNewContract({ ...newContract, supplierId: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Selecione um fornecedor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categoria</label>
              <input
                type="text"
                value={newContract.category}
                onChange={(e) => setNewContract({ ...newContract, category: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Ex: Manutenção"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor (R$)</label>
              <input
                type="number"
                value={newContract.value}
                onChange={(e) => setNewContract({ ...newContract, value: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data Início</label>
              <input
                type="date"
                value={newContract.startDate}
                onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data Fim</label>
              <input
                type="date"
                value={newContract.endDate}
                onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-zinc-500 hover:text-zinc-900 transition-colors font-bold uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={handleAddContract} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20">Salvar Contrato</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddingSupplier}
        onClose={() => setIsAddingSupplier(false)}
        title="Cadastrar Novo Fornecedor"
      >
        <form onSubmit={handleAddSupplier} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome da Empresa</label>
            <input
              required
              type="text"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ex: Elevadores S.A."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Responsável</label>
              <input
                type="text"
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Nome do contato"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Telefone</label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">E-mail</label>
            <input
              type="email"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="contato@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categoria</label>
            <select
              value={supplierForm.category}
              onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value as any })}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="GERAL">Geral</option>
              <option value="LIMPEZA">Limpeza</option>
              <option value="PISCINA">Piscina</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="SEGURANCA">Segurança</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setIsAddingSupplier(false)} 
              className="px-6 py-2 text-zinc-500 hover:text-zinc-900 transition-colors font-bold uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20"
            >
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
