import { useState } from 'react';
import { useStore } from '../store';
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
    criticalEvents, clients
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('STAFF');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
              member.status === 'ACTIVE' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 
              member.status === 'ON_LEAVE' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 
              'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {member.status === 'ACTIVE' ? 'Ativo' : member.status === 'ON_LEAVE' ? 'Licença' : 'Inativo'}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              key.status === 'AVAILABLE' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 
              key.status === 'BORROWED' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 
              'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {key.status === 'AVAILABLE' ? 'Disponível' : key.status === 'BORROWED' ? 'Emprestada' : 'Perdida'}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="text-2xl font-mono font-bold text-emerald-400">99.98%</div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Preventivas Pendentes</h4>
              <p className="text-5xl font-light">{scheduledMaintenances.filter(m => m.status === 'PENDING').length}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Atrasadas</h4>
              <p className="text-5xl font-light text-red-400">{scheduledMaintenances.filter(m => m.status === 'OVERDUE').length}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Eventos Críticos</h4>
              <p className="text-5xl font-light text-amber-400">{criticalEvents.filter(e => e.status !== 'NORMAL').length}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {scheduledMaintenances.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    m.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 
                    m.status === 'DONE' ? 'bg-green-500/20 text-green-400' : 
                    'bg-white/10 text-white/60'
                  }`}>
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">{m.item}</h4>
                    <p className="text-sm text-white/40">{m.category} • {m.frequency}</p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">Próxima Data</p>
                    <p className="text-sm font-medium">{safeFormatDate(m.nextDate, { day: '2-digit', month: 'long' })}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(m)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteScheduledMaintenance(m.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
            <div className="mt-4 px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-[10px] font-bold text-green-400">
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
            <p className="text-3xl font-mono font-bold text-emerald-400">SECURE</p>
            <p className="text-[10px] font-bold text-white/30 mt-4 uppercase tracking-widest">Todos os portões fechados</p>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-green-400/10 flex items-center justify-center mb-6 border border-green-400/20">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Sistema de Incêndio</h4>
            <p className="text-3xl font-mono font-bold text-emerald-400">READY</p>
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
                  <option value="MORNING">Manhã</option>
                  <option value="AFTERNOON">Tarde</option>
                  <option value="NIGHT">Noite</option>
                  <option value="FLEXIBLE">Flexível</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Status *</label>
                <select 
                  value={staffForm.status}
                  onChange={e => setStaffForm({...staffForm, status: e.target.value as any})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="ON_LEAVE">Licença</option>
                  <option value="INACTIVE">Inativo</option>
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
                  <option value="AVAILABLE">Disponível</option>
                  <option value="BORROWED">Emprestada</option>
                  <option value="LOST">Perdida</option>
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
                  <option value="">Geral / Não Especificado</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
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
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
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
                  <option value="PENDING">Pendente</option>
                  <option value="DONE">Concluído</option>
                  <option value="OVERDUE">Atrasado</option>
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
