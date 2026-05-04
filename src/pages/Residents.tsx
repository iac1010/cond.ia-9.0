import { useState } from 'react';
import { useStore } from '../store';
import { Plus, Edit2, Trash2, Users, Phone, Mail, MapPin, FileText, User } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const VIBRANT_GRADIENTS = [
  'from-[#0078d7] to-[#005a9e]', // Blue
  'from-[#00aba9] to-[#008a88]', // Teal
  'from-[#da532c] to-[#b94322]', // Orange
  'from-[#7e3878] to-[#632c5e]', // Purple
  'from-[#1a1a1a] to-[#000000]', // Black
  'from-[#ee1111] to-[#cc0000]', // Red
  'from-[#f0a30a] to-[#d38b00]', // Yellow/Gold
  'from-[#2d89ef] to-[#1e71cd]', // Sky Blue
];

export default function Residents() {
  const navigate = useNavigate();
  const { clients, addClient, updateClient, deleteClient, theme } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    tower: '',
    unit: '',
    vehicles: '',
    pets: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [towerFilter, setTowerFilter] = useState('');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         client.unit?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTower = towerFilter === '' || client.tower === towerFilter;
    return matchesSearch && matchesTower;
  });

  const towers = Array.from(new Set(clients.map(c => c.tower).filter(Boolean))).sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateClient(editingId, formData);
    } else {
      addClient(formData);
    }
    closeModal();
  };

  const openModal = (client?: typeof clients[0]) => {
    if (client) {
      setFormData({ 
        name: client.name, 
        document: client.document || '',
        contactPerson: client.contactPerson || '',
        phone: client.phone, 
        email: client.email || '',
        address: client.address,
        notes: client.notes || '',
        tower: client.tower || '',
        unit: client.unit || '',
        vehicles: client.vehicles || '',
        pets: client.pets || ''
      });
      setEditingId(client.id);
    } else {
      setFormData({ 
        name: '', 
        document: '', 
        contactPerson: '', 
        phone: '', 
        email: '', 
        address: '', 
        notes: '',
        tower: '',
        unit: '',
        vehicles: '',
        pets: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      document: '', 
      contactPerson: '', 
      phone: '', 
      email: '', 
      address: '', 
      notes: '',
      tower: '',
      unit: '',
      vehicles: '',
      pets: ''
    });
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-4 sm:p-8 md:p-12 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <header className="mb-6 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 relative z-10">
        <div className="flex items-center gap-4 md:gap-6">
          <BackButton iconSize={6} className="p-3 md:p-4" />
          <div>
            <h1 className="text-2xl md:text-6xl font-light tracking-tight">Moradores</h1>
            <p className="text-xs md:text-xl opacity-60 mt-1 md:mt-2 font-light">Gerencie os residentes e unidades</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Buscar morador ou apto..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40"
              />
            </div>
            <select
              value={towerFilter}
              onChange={e => setTowerFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all text-white"
            >
              <option value="" className="bg-zinc-900">Todas Torres</option>
              {towers.map(t => (
                <option key={t} value={t} className="bg-zinc-900">Torre {t}</option>
              ))}
            </select>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="bg-white text-black px-6 md:px-8 py-3 md:py-4 flex items-center justify-center gap-3 border border-white/20 transition-all group w-full md:w-auto rounded-xl font-bold"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" /> 
            <span>Novo Morador</span>
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 relative z-10">
        {filteredClients.map((client, index) => {
          const gradientClass = VIBRANT_GRADIENTS[index % VIBRANT_GRADIENTS.length];
          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-gradient-to-br ${gradientClass} hover:brightness-110 transition-all p-4 md:p-6 aspect-square flex flex-col justify-between relative group overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95`}
            >
              {/* Glassmorphism Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm overflow-hidden w-10 h-10 flex items-center justify-center">
                  <img 
                    src="https://img.freepik.com/premium-photo/3d-rendering-isometric-building-icon_640106-465.jpg" 
                    alt="Building" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.preventDefault(); openModal(client); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); setClientToDelete(client.id); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="mt-4 relative z-10">
                <h3 className="text-xl md:text-2xl font-bold leading-tight mb-1 line-clamp-2 drop-shadow-lg">{client.name}</h3>
                <div className="flex gap-2 mb-2">
                  {client.tower && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Torre {client.tower}</span>
                  )}
                  {client.unit && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Apto {client.unit}</span>
                  )}
                </div>
                {client.contactPerson && (
                  <p className="text-[10px] md:text-sm opacity-80 flex items-center gap-1 drop-shadow-md">
                    <User className="w-3 h-3" /> {client.contactPerson}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-4 space-y-2 border-t border-white/10 relative z-10">
                <div className="flex items-center text-[11px] md:text-sm gap-2 drop-shadow-md">
                  <Phone className="w-3.5 md:w-4 h-3.5 md:h-4 opacity-70" />
                  <span className="font-medium">{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center text-[11px] md:text-sm gap-2 truncate drop-shadow-md">
                    <Mail className="w-3.5 md:w-4 h-3.5 md:h-4 opacity-70" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                <div className="flex items-start text-[11px] md:text-sm gap-2 mt-2 drop-shadow-md">
                  <MapPin className="w-3.5 md:w-4 h-3.5 md:h-4 opacity-70 mt-0.5 shrink-0" />
                  <span className="line-clamp-2 opacity-80">{client.address}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-24 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-2xl mb-6 backdrop-blur-md border border-white/10 overflow-hidden">
              <img 
                src="https://img.freepik.com/premium-photo/3d-rendering-isometric-building-icon_640106-465.jpg" 
                alt="Building" 
                className="w-full h-full object-cover opacity-50 grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-2xl font-light opacity-60">Nenhum morador encontrado</h3>
            <p className="opacity-40 mt-2">Tente ajustar seus filtros ou cadastrar um novo morador.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
        maxWidth="md"
        glass
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Nome Completo *</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Ex: João da Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Torre</label>
              <input 
                type="text" 
                value={formData.tower}
                onChange={e => setFormData({...formData, tower: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Ex: A"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Apartamento / Unidade</label>
              <input 
                type="text" 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Ex: 101"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">CPF</label>
              <input 
                type="text" 
                value={formData.document}
                onChange={e => setFormData({...formData, document: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="00.000.000/0000-00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Responsável</label>
              <input 
                type="text" 
                value={formData.contactPerson}
                onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Nome do síndico"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Telefone *</label>
              <input 
                required
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">E-mail</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Veículos</label>
              <input 
                type="text" 
                value={formData.vehicles}
                onChange={e => setFormData({...formData, vehicles: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Placa, Modelo, Cor"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Pets</label>
              <input 
                type="text" 
                value={formData.pets}
                onChange={e => setFormData({...formData, pets: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Nome, Raça, Porte"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Endereço *</label>
              <textarea 
                required
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none min-h-[80px] resize-none transition-all text-white placeholder:text-white/30"
                placeholder="Rua, Número, Bairro, Cidade"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Observações</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none min-h-[80px] resize-none transition-all text-white placeholder:text-white/30"
                placeholder="Informações adicionais..."
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={closeModal}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-white/20 hover:bg-white/30 text-white px-10 py-3 rounded-xl font-bold backdrop-blur-md border border-white/20 transition-all active:scale-95"
            >
              SALVAR
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!clientToDelete} 
        onClose={() => setClientToDelete(null)} 
        title="Confirmar Exclusão"
        maxWidth="sm"
        glass
      >
        <div className="space-y-6 p-2">
          <p className="text-xl font-light text-white/70">
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-6">
            <button 
              onClick={() => setClientToDelete(null)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                if (clientToDelete) deleteClient(clientToDelete);
                setClientToDelete(null);
              }}
              className="bg-red-500/80 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold backdrop-blur-md border border-red-500/20 transition-all active:scale-95"
            >
              EXCLUIR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
