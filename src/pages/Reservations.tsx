import { useState } from 'react';
import { useStore } from '../store';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle, Trash2, Search } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AREAS = [
  'Salão de Festas',
  'Churrasqueira A',
  'Churrasqueira B',
  'Espaço Gourmet',
  'Academia (Privativo)',
  'Cinema',
  'Quadra Poliesportiva'
];

export default function Reservations() {
  const { reservations, clients, addReservation, updateReservation, deleteReservation } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    clientId: '',
    areaName: AREAS[0],
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '22:00',
    status: 'PENDING' as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateReservation(editingId, formData);
    } else {
      addReservation(formData);
    }
    closeModal();
  };

  const openModal = (reservation?: typeof reservations[0]) => {
    if (reservation) {
      setFormData({ 
        clientId: reservation.clientId,
        areaName: reservation.areaName,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        notes: reservation.notes || ''
      });
      setEditingId(reservation.id);
    } else {
      setFormData({ 
        clientId: '',
        areaName: AREAS[0],
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '22:00',
        status: 'PENDING',
        notes: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const filteredReservations = reservations.filter(r => {
    const client = clients.find(c => c.id === r.clientId);
    const searchString = `${client?.name} ${r.areaName} ${r.date}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white -m-8 p-4 sm:p-8 md:p-12 overflow-x-hidden">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <BackButton iconSize={6} className="p-4" />
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight">Reservas</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Gestão de áreas comuns</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
            <input 
              type="text"
              placeholder="Buscar reservas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-white/30 transition-all"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="bg-white text-black px-8 py-4 flex items-center justify-center gap-3 rounded-xl font-bold transition-all group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> 
            Nova Reserva
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReservations.map((res, index) => {
          const client = clients.find(c => c.id === res.clientId);
          return (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(res.status)}`}>
                  {res.status === 'PENDING' ? 'Pendente' : res.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(res)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Clock className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteReservation(res.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4">{res.areaName}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white/60">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{client?.name || 'Morador não encontrado'}</span>
                  {client?.unit && (
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white">Apto {client.unit}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm">{format(new Date(res.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{res.startTime} às {res.endTime}</span>
                </div>
              </div>

              {res.status === 'PENDING' && (
                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => updateReservation(res.id, { status: 'CONFIRMED' })}
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => updateReservation(res.id, { status: 'CANCELLED' })}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Recusar
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredReservations.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-6">
              <CalendarIcon className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-2xl font-light opacity-40">Nenhuma reserva encontrada</h3>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingId ? 'Editar Reserva' : 'Nova Reserva'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Morador *</label>
              <select 
                required
                value={formData.clientId}
                onChange={e => setFormData({...formData, clientId: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
              >
                <option value="" className="bg-zinc-900">Selecione um morador</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-zinc-900">
                    {c.name} {c.unit ? `(Apto ${c.unit})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Área Comum *</label>
              <select 
                required
                value={formData.areaName}
                onChange={e => setFormData({...formData, areaName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
              >
                {AREAS.map(area => (
                  <option key={area} value={area} className="bg-zinc-900">{area}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Data *</label>
              <input 
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Início *</label>
                <input 
                  required
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Fim *</label>
                <input 
                  required
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-all text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Observações</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none min-h-[100px] resize-none focus:border-white/30 transition-all text-white"
                placeholder="Lista de convidados, necessidades especiais, etc."
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={closeModal}
              className="px-6 py-3 text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-white text-black px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              Confirmar Reserva
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
