import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';
import { 
  Users, Key, Settings, Plus, Edit2, Trash2, 
  Search, Shield, Clock, Phone, Mail, MapPin,
  CheckCircle, AlertTriangle, XCircle, Activity,
  Zap, Droplets, Lock, User
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';
import { safeFormatDate } from '../utils/dateUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Tab = 'STAFF' | 'KEYS' | 'MAINTENANCE' | 'IOT';

export default function Operational() {
  const location = useLocation();
  // Maintenance Form State
  const [maintenanceForm, setMaintenanceForm] = useState({
    clientId: '',
    standardId: '',
    item: '',
    frequency: 'Mensal' as const,
    lastDone: '',
    nextDate: '',
    status: 'PENDING' as const,
    category: ''
  });

  const { 
    staff, addStaff, updateStaff, deleteStaff,
    keys, addKey, updateKey, deleteKey,
    scheduledMaintenances, addScheduledMaintenance, updateScheduledMaintenance, deleteScheduledMaintenance,
    generateSchedulesForClient, criticalEvents, clients
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'MAINTENANCE' || tabParam === 'STAFF' || tabParam === 'KEYS' || tabParam === 'IOT') {
      return tabParam as Tab;
    }
    return 'STAFF';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'MAINTENANCE' || tabParam === 'STAFF' || tabParam === 'KEYS' || tabParam === 'IOT') {
      setActiveTab(tabParam as Tab);
    }
  }, [location.search]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // NBR 5674 custom alert thresholds (lead time in days)
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('nbr5674_thresholds');
    return saved ? JSON.parse(saved) : {
      'Mensal': 5,
      'Trimestral': 10,
      'Semestral': 15,
      'Anual': 30
    };
  });

  const handleThresholdChange = (freq: string, val: number) => {
    const updated = { ...thresholds, [freq]: val };
    setThresholds(updated);
    localStorage.setItem('nbr5674_thresholds', JSON.stringify(updated));
    toast.success(`Alerta de inspeção ${freq} configurado para ${val} dias de antecedência!`);
  };

  const getAlertDetails = (m: any) => {
    if (!m.nextDate || m.status === 'DONE') return { isNearing: false, daysRemaining: 0, label: 'Regular' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(m.nextDate);
    nextDate.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { isNearing: false, daysRemaining: diffDays, label: 'Atrasado' };
    }
    
    const limit = thresholds[m.frequency] || 7;
    const isNearing = diffDays <= limit;
    
    return {
      isNearing,
      daysRemaining: diffDays,
      label: isNearing ? `A vencer em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}` : 'Regular'
    };
  };

  const simulateExpiration = () => {
    if (scheduledMaintenances.length === 0) {
      // Create a dummy maintenance if none exist
      addScheduledMaintenance({
        clientId: clients[0]?.id || '',
        standardId: 'spda',
        item: 'Para-raios (SPDA) de Teste',
        frequency: 'Anual',
        category: 'Manutenção Elétrica',
        nextDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        status: 'PENDING'
      });
    } else {
      // Update the first pending maintenance to expire in 3 days
      const firstPending = scheduledMaintenances.find(m => m.status === 'PENDING');
      if (firstPending) {
        updateScheduledMaintenance(firstPending.id, {
          nextDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'PENDING'
        });
      } else {
        // Fallback to update first one
        updateScheduledMaintenance(scheduledMaintenances[0].id, {
          nextDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'PENDING'
        });
      }
    }
    toast.success('Simulação de vencimento NBR 5674 ativada! Inspeção programada para vencer em 3 dias.');
  };

  // Staff Form State
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    shift: 'MORNING' as const,
    status: 'ACTIVE' as const
  });

  // Key Form State
  const [keyForm, setKeyForm] = useState({
    keyName: '',
    location: '',
    status: 'AVAILABLE' as 'AVAILABLE' | 'BORROWED' | 'LOST',
    borrowedBy: '',
    borrowedAt: '',
    returnedAt: ''
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const openModal = (item?: any) => {
    if (activeTab === 'STAFF') {
      if (item) {
        setStaffForm({ ...item });
        setEditingId(item.id);
      } else {
        setStaffForm({ name: '', role: '', phone: '', email: '', shift: 'MORNING', status: 'ACTIVE' });
        setEditingId(null);
      }
    } else if (activeTab === 'KEYS') {
      if (item) {
        setKeyForm({ ...item });
        setEditingId(item.id);
      } else {
        setKeyForm({ keyName: '', location: '', status: 'AVAILABLE', borrowedBy: '', borrowedAt: '', returnedAt: '' });
        setEditingId(null);
      }
    } else if (activeTab === 'MAINTENANCE') {
      if (item) {
        setMaintenanceForm({ ...item });
        setEditingId(item.id);
      } else {
        setMaintenanceForm({ clientId: '', standardId: '', item: '', frequency: 'Mensal', lastDone: '', nextDate: '', status: 'PENDING', category: '' });
        setEditingId(null);
      }
    }
    setIsModalOpen(true);
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateScheduledMaintenance(editingId, maintenanceForm);
    } else {
      addScheduledMaintenance(maintenanceForm);
    }
    closeModal();
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateStaff(editingId, staffForm);
    } else {
      addStaff(staffForm);
    }
    closeModal();
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateKey(editingId, keyForm);
    } else {
      addKey(keyForm);
    }
    closeModal();
  };

  const filteredStaff = staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredKeys = keys.filter(k => k.keyName.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderStaff = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredStaff.map((member, index) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group"
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              member.status === 'ACTIVE' ? 'text-white bg-white/10 border-white/20' : 
              member.status === 'ON_LEAVE' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 
              'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {member.status === 'ACTIVE' ? 'Ativo' : member.status === 'ON_LEAVE' ? 'Licença' : 'Inativo'}
            </div>
            <div className="flex flex-wrap gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity justify-end">
              <button onClick={() => openModal(member)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteStaff(member.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black text-white/40">
              {member.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold">{member.name}</h3>
              <p className="text-sm text-white/40">{member.role}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-white/60">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{member.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Turno: {member.shift}</span>
            </div>
          </div>
        </motion.div>
      ))}
      {filteredStaff.length === 0 && (
        <div className="col-span-full py-24 text-center">
          <Users className="w-16 h-16 opacity-10 mx-auto mb-4" />
          <p className="text-white/40">Nenhum funcionário cadastrado.</p>
        </div>
      )}
    </div>
  );

  const renderKeys = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredKeys.map((key, index) => (
        <motion.div
          key={key.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group"
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              key.status === 'AVAILABLE' ? 'text-white bg-white/10 border-white/20' : 
              key.status === 'BORROWED' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 
              'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {key.status === 'AVAILABLE' ? 'Disponível' : key.status === 'BORROWED' ? 'Emprestada' : 'Perdida'}
            </div>
            <div className="flex flex-wrap gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity justify-end">
              <button onClick={() => openModal(key)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteKey(key.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-white/60" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{key.keyName}</h3>
              <p className="text-sm text-white/40">{key.location}</p>
            </div>
          </div>

          {key.status === 'BORROWED' && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-2">Responsável</p>
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-white/60" />
                <span className="text-sm font-medium">{key.borrowedBy}</span>
              </div>
              <p className="text-[10px] text-white/30 mt-1">Desde: {key.borrowedAt ? safeFormatDate(key.borrowedAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
            </div>
          )}
        </motion.div>
      ))}
      {filteredKeys.length === 0 && (
        <div className="col-span-full py-24 text-center">
          <Key className="w-16 h-16 opacity-10 mx-auto mb-4" />
          <p className="text-white/40">Nenhuma chave cadastrada.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white -m-8 p-4 sm:p-8 md:p-12 overflow-x-hidden">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <BackButton iconSize={6} className="p-4" />
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight">Operacional</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Gestão de infraestrutura e equipe</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-white/30 transition-all"
            />
          </div>
      {(activeTab === 'STAFF' || activeTab === 'KEYS' || activeTab === 'MAINTENANCE') && (
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal()}
          className="bg-white text-black px-8 py-4 flex items-center justify-center gap-3 rounded-xl font-bold transition-all group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> 
          Novo {activeTab === 'STAFF' ? 'Funcionário' : activeTab === 'KEYS' ? 'Chave' : 'Manutenção'}
        </motion.button>
      )}
        </div>
      </header>

      <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'STAFF', label: 'Equipe', icon: Users },
          { id: 'KEYS', label: 'Chaves', icon: Key },
          { id: 'MAINTENANCE', label: 'Manutenção', icon: Settings },
          { id: 'IOT', label: 'IoT & Automação', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap border ${
              activeTab === tab.id 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Real-time System Stats - Technical Dashboard Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-12 rounded-3xl overflow-hidden">
        <div className="bg-black p-6">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Uptime Sistema</div>
          <div className="text-2xl font-mono font-bold text-zinc-400">99.98%</div>
        </div>
        <div className="bg-black p-6">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Sensores Ativos</div>
          <div className="text-2xl font-mono font-bold text-blue-400">42/42</div>
        </div>
        <div className="bg-black p-6">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Latência Rede</div>
          <div className="text-2xl font-mono font-bold text-amber-400">14ms</div>
        </div>
        <div className="bg-black p-6">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Última Varredura</div>
          <div className="text-2xl font-mono font-bold text-white/60">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {activeTab === 'STAFF' && renderStaff()}
      {activeTab === 'KEYS' && renderKeys()}
      
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-8">
          {/* NBR 5674 Alert & Compliance Center */}
          <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield className="w-48 h-48 text-white" />
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8 justify-between items-stretch">
              {/* Compliance Score */}
              <div className="flex flex-col justify-between space-y-4 lg:w-4/12 border-b lg:border-b-0 lg:border-r border-white/5 pb-6 lg:pb-0 lg:pr-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black tracking-widest text-blue-400 uppercase mb-3">
                    <Shield className="w-3.5 h-3.5" /> NBR 5674 Compliance
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">Painel de Alertas de Manutenção</h3>
                  <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                    Monitoramento contínuo dos sistemas prediais e conformidade legal com a NBR 5674.
                  </p>
                </div>
                
                {(() => {
                  const totalCount = scheduledMaintenances.length;
                  const overdueCount = scheduledMaintenances.filter(m => {
                    if (!m.nextDate || m.status === 'DONE') return false;
                    return new Date(m.nextDate) < new Date();
                  }).length;
                  const complianceScore = totalCount > 0 
                    ? Math.round(((totalCount - overdueCount) / totalCount) * 100) 
                    : 100;

                  return (
                    <div className="flex items-center gap-4 pt-4">
                      <div className="relative flex items-center justify-center shrink-0 w-20 h-20 rounded-full border-4" style={{
                        borderColor: complianceScore < 75 ? '#ef4444' : complianceScore < 90 ? '#f59e0b' : '#10b981'
                      }}>
                        <span className="text-lg font-mono font-black text-white">{complianceScore}%</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 font-sans">Índice de Conformidade</p>
                        <p className="text-xs font-bold text-white/80 mt-1">
                          {complianceScore === 100 ? '✅ 100% Regularizado' : complianceScore >= 80 ? '⚠️ Atenção aos prazos' : '🚨 Risco Crítico de Falhas'}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5">Sistemas prediais inspecionados</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Threshold Lead Times Controls */}
              <div className="flex flex-col justify-between space-y-4 lg:w-4/12 border-b lg:border-b-0 lg:border-r border-white/5 pb-6 lg:pb-0 lg:pr-8">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5 mb-3">
                    <Clock className="w-4 h-4 text-white/50" /> Lead Times de Alerta (Dias de antecedência)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'Mensal' as const },
                      { key: 'Trimestral' as const },
                      { key: 'Semestral' as const },
                      { key: 'Anual' as const }
                    ].map(f => (
                      <div key={f.key} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase text-white/40">{f.key}</span>
                          <span className="text-xs font-bold font-mono text-blue-400">{thresholds[f.key]}d</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => handleThresholdChange(f.key, Math.max(1, thresholds[f.key] - 1))}
                            className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs rounded-md flex items-center justify-center transition-colors select-none"
                          >
                            -
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleThresholdChange(f.key, Math.min(60, thresholds[f.key] + 1))}
                            className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs rounded-md flex items-center justify-center transition-colors select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Dynamic Action Center */}
              {(() => {
                const totalMaintenances = scheduledMaintenances.length;
                const overdueMaintenances = scheduledMaintenances.filter(m => {
                  if (!m.nextDate || m.status === 'DONE') return false;
                  return new Date(m.nextDate) < new Date();
                }).length;
                const nearingMaintenances = scheduledMaintenances.filter(m => {
                  const alert = getAlertDetails(m);
                  return alert.isNearing;
                }).length;

                return (
                  <div className="flex flex-col justify-between space-y-4 lg:w-4/12">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5 mb-3">
                        <Activity className="w-4 h-4 text-white/50" /> Diagnóstico do Sistema
                      </h4>
                      <div className="space-y-2 text-xs font-medium">
                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                          <span className="text-white/40">Total de Inspeções</span>
                          <span className="text-white font-mono">{totalMaintenances}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                          <span className="text-white/40">Em Atraso (🚨)</span>
                          <span className="text-red-400 font-mono font-bold">{overdueMaintenances}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                          <span className="text-white/40">Próximos Vencimentos (⚠️)</span>
                          <span className="text-yellow-400 font-mono font-bold">{nearingMaintenances}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={simulateExpiration}
                        className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-white/20 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all"
                      >
                        ⚡ Simular Vencimento
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (clients.length > 0) {
                            generateSchedulesForClient(clients[0].id);
                            toast.success(`Plano NBR 5674 gerado para ${clients[0].name}!`);
                          } else {
                            toast.error('Nenhum cliente cadastrado para associar o plano.');
                          }
                        }}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-lg"
                      >
                        📂 Gerar Plano NBR
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Preventivas Pendentes</h4>
              <p className="text-5xl font-light">{scheduledMaintenances.filter(m => m.status === 'PENDING').length}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Atrasadas</h4>
              <p className="text-5xl font-light text-red-400">
                {scheduledMaintenances.filter(m => {
                  if (!m.nextDate || m.status === 'DONE') return false;
                  return new Date(m.nextDate) < new Date();
                }).length}
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Eventos Críticos</h4>
              <p className="text-5xl font-light text-amber-400">{criticalEvents.filter(e => e.status !== 'NORMAL').length}</p>
            </div>
          </div>

          {/* Active Alerts Nearing Expiration Panel */}
          {(() => {
            const activeAlerts = scheduledMaintenances.filter(m => {
              const alert = getAlertDetails(m);
              return alert.isNearing;
            });

            if (activeAlerts.length === 0) return null;

            return (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" /> Alertas Ativos (NBR 5674 — Prazos Próximos do Vencimento)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAlerts.map(m => {
                    const alert = getAlertDetails(m);
                    const client = clients.find(c => c.id === m.clientId);
                    return (
                      <div key={m.id} className="bg-black/40 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            Vence em {alert.daysRemaining} {alert.daysRemaining === 1 ? 'dia' : 'dias'}
                          </span>
                          <h5 className="text-sm font-bold text-white mt-1.5">{m.item}</h5>
                          <p className="text-xs text-white/40 mt-0.5">{client?.name || 'Geral'} • {m.category} ({m.frequency})</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            updateScheduledMaintenance(m.id, { status: 'DONE', lastDone: new Date().toISOString().split('T')[0] });
                            toast.success(`Inspeção de ${m.item} concluída!`);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors shrink-0"
                        >
                          Concluir
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          
          <div className="grid grid-cols-1 gap-4">
            {scheduledMaintenances.map((m, idx) => {
              const alert = getAlertDetails(m);
              const isOverdue = m.status === 'OVERDUE' || (m.nextDate && new Date(m.nextDate) < new Date() && m.status !== 'DONE');
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isOverdue ? 'bg-red-500/20 text-red-400' : 
                      m.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' : 
                      alert.isNearing ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                      'bg-white/10 text-white/60'
                    }`}>
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold">{m.item}</h4>
                        {isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase text-red-400">Em Atraso</span>
                        ) : m.status === 'DONE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400">Regularizado</span>
                        ) : alert.isNearing ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase text-amber-400">Próximo do Vencimento</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase text-blue-400">No Prazo</span>
                        )}
                      </div>
                      <p className="text-sm text-white/40">{m.category} • {m.frequency}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">Próxima Data</p>
                      <p className={`text-sm font-medium ${isOverdue ? 'text-red-400 font-bold' : alert.isNearing ? 'text-amber-400 font-bold' : 'text-white/80'}`}>
                        {safeFormatDate(m.nextDate, { day: '2-digit', month: 'long' })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity justify-end">
                      {m.status !== 'DONE' && (
                        <button 
                          type="button"
                          onClick={() => {
                            updateScheduledMaintenance(m.id, { status: 'DONE', lastDone: new Date().toISOString().split('T')[0] });
                            toast.success(`Inspeção de ${m.item} registrada como concluída!`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
                        >
                          Concluir
                        </button>
                      )}
                      <button type="button" onClick={() => openModal(m)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => deleteScheduledMaintenance(m.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'IOT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-24 h-24" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-6 border border-yellow-400/20">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Consumo Elétrico</h4>
            <p className="text-3xl font-mono font-bold">1.240 <span className="text-sm text-white/30">kWh</span></p>
            <div className="mt-4 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white">
              -12% VS MÊS ANTERIOR
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Droplets className="w-24 h-24" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-blue-400/10 flex items-center justify-center mb-6 border border-blue-400/20">
              <Droplets className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Nível Reservatório</h4>
            <p className="text-3xl font-mono font-bold">84<span className="text-sm text-white/30">%</span></p>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-6 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '84%' }}
                className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
              />
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Lock className="w-24 h-24" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-red-400/10 flex items-center justify-center mb-6 border border-red-400/20">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Portões & Acessos</h4>
            <p className="text-3xl font-mono font-bold text-white">SECURE</p>
            <p className="text-[10px] font-bold text-white/30 mt-4 uppercase tracking-widest">Todos os portões fechados</p>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Sistema de Incêndio</h4>
            <p className="text-3xl font-mono font-bold text-white">READY</p>
            <p className="text-[10px] font-bold text-white/30 mt-4 uppercase tracking-widest">Último teste: Hoje, 08:00</p>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingId ? `Editar ${activeTab === 'STAFF' ? 'Funcionário' : activeTab === 'KEYS' ? 'Chave' : 'Manutenção'}` : `Novo ${activeTab === 'STAFF' ? 'Funcionário' : activeTab === 'KEYS' ? 'Chave' : 'Manutenção'}`}
        maxWidth="md"
      >
        {activeTab === 'STAFF' ? (
          <form onSubmit={handleStaffSubmit} className="space-y-6">
            {/* ... staff form fields ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Nome Completo *</label>
                <input 
                  required
                  type="text"
                  value={staffForm.name}
                  onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Cargo / Função *</label>
                <input 
                  required
                  type="text"
                  value={staffForm.role}
                  onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Telefone *</label>
                <input 
                  required
                  type="text"
                  value={staffForm.phone}
                  onChange={e => setStaffForm({...staffForm, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Turno *</label>
                <select 
                  value={staffForm.shift}
                  onChange={e => setStaffForm({...staffForm, shift: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="MORNING" className="bg-[#18181b] text-white">Manhã</option>
                  <option value="AFTERNOON" className="bg-[#18181b] text-white">Tarde</option>
                  <option value="NIGHT" className="bg-[#18181b] text-white">Noite</option>
                  <option value="FLEXIBLE" className="bg-[#18181b] text-white">Flexível</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Status *</label>
                <select 
                  value={staffForm.status}
                  onChange={e => setStaffForm({...staffForm, status: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="ACTIVE" className="bg-[#18181b] text-white">Ativo</option>
                  <option value="ON_LEAVE" className="bg-[#18181b] text-white">Licença</option>
                  <option value="INACTIVE" className="bg-[#18181b] text-white">Inativo</option>
                </select>
              </div>
            </div>
            <div className="pt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-6 py-3 text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs">Cancelar</button>
              <button type="submit" className="bg-white text-black px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">Salvar Funcionário</button>
            </div>
          </form>
        ) : activeTab === 'KEYS' ? (
          <form onSubmit={handleKeySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Nome da Chave *</label>
                <input 
                  required
                  type="text"
                  value={keyForm.keyName}
                  onChange={e => setKeyForm({...keyForm, keyName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                  placeholder="Ex: Chave Salão de Festas"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Localização *</label>
                <input 
                  required
                  type="text"
                  value={keyForm.location}
                  onChange={e => setKeyForm({...keyForm, location: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                  placeholder="Ex: Armário Portaria"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Status *</label>
                <select 
                  value={keyForm.status}
                  onChange={e => setKeyForm({...keyForm, status: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="AVAILABLE" className="bg-[#18181b] text-white">Disponível</option>
                  <option value="BORROWED" className="bg-[#18181b] text-white">Emprestada</option>
                  <option value="LOST" className="bg-[#18181b] text-white">Perdida</option>
                </select>
              </div>
              {keyForm.status === 'BORROWED' && (
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Emprestada para *</label>
                    <input 
                      required
                      type="text"
                      value={keyForm.borrowedBy}
                      onChange={e => setKeyForm({...keyForm, borrowedBy: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Data/Hora Empréstimo *</label>
                    <input 
                      required
                      type="datetime-local"
                      value={keyForm.borrowedAt}
                      onChange={e => setKeyForm({...keyForm, borrowedAt: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="pt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-6 py-3 text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs">Cancelar</button>
              <button type="submit" className="bg-white text-black px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">Salvar Chave</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMaintenanceSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Cliente / Condomínio (Opcional)</label>
                <select 
                  value={maintenanceForm.clientId}
                  onChange={e => setMaintenanceForm({...maintenanceForm, clientId: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="" className="bg-[#18181b] text-white">Geral / Não Especificado</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id} className="bg-[#18181b] text-white">{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Item / Equipamento *</label>
                <input 
                  required
                  type="text"
                  value={maintenanceForm.item}
                  onChange={e => setMaintenanceForm({...maintenanceForm, item: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                  placeholder="Ex: Elevador Social 1"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Categoria *</label>
                <input 
                  required
                  type="text"
                  value={maintenanceForm.category}
                  onChange={e => setMaintenanceForm({...maintenanceForm, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                  placeholder="Ex: Elevadores"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Frequência *</label>
                <select 
                  value={maintenanceForm.frequency}
                  onChange={e => setMaintenanceForm({...maintenanceForm, frequency: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="Mensal" className="bg-[#18181b] text-white">Mensal</option>
                  <option value="Trimestral" className="bg-[#18181b] text-white">Trimestral</option>
                  <option value="Semestral" className="bg-[#18181b] text-white">Semestral</option>
                  <option value="Anual" className="bg-[#18181b] text-white">Anual</option>
                  <option value="Atividade Única" className="bg-[#18181b] text-white">Atividade Única</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Próxima Data *</label>
                <input 
                  required
                  type="date"
                  value={maintenanceForm.nextDate}
                  onChange={e => setMaintenanceForm({...maintenanceForm, nextDate: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Status *</label>
                <select 
                  value={maintenanceForm.status}
                  onChange={e => setMaintenanceForm({...maintenanceForm, status: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="PENDING" className="bg-[#18181b] text-white">Pendente</option>
                  <option value="DONE" className="bg-[#18181b] text-white">Concluído</option>
                  <option value="OVERDUE" className="bg-[#18181b] text-white">Atrasado</option>
                </select>
              </div>
            </div>
            <div className="pt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-6 py-3 text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs">Cancelar</button>
              <button type="submit" className="bg-white text-black px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">Salvar Manutenção</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
