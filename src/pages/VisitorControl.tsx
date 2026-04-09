import React, { useState } from 'react';
import { useStore } from '../store';
import { Visitor } from '../types';
import { 
  UserPlus, 
  Search, 
  QrCode, 
  Clock, 
  User, 
  Home,
  X,
  Calendar,
  ShieldCheck,
  MoreVertical,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFormatDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

export default function VisitorControl() {
  const navigate = useNavigate();
  const { visitors, addVisitor, revokeVisitor } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const [newVisitor, setNewVisitor] = useState<Omit<Visitor, 'id' | 'qrCode' | 'status'>>({
    name: '',
    document: '',
    type: 'VISITOR',
    apartment: '',
    tower: '',
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default 24h
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVisitor(newVisitor);
    setIsModalOpen(false);
    setNewVisitor({
      name: '',
      document: '',
      type: 'VISITOR',
      apartment: '',
      tower: '',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.apartment.includes(searchTerm)
  );

  const getStatus = (visitor: Visitor) => {
    if (visitor.status === 'EXPIRED' || visitor.status === 'USED') return visitor.status;
    return isAfter(new Date(), new Date(visitor.validUntil)) ? 'EXPIRED' : 'ACTIVE';
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="currentColor" className="text-white/5" fillOpacity="0.5" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="currentColor" className="text-white/10" fillOpacity="0.5" />
        </svg>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-5xl font-black tracking-tight text-white">Controle de Acesso</h1>
            <p className="text-xl text-white/60 mt-2 font-medium">Convites digitais e gestão de visitantes/prestadores.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-bold transition-all border border-white/10 backdrop-blur-md shadow-lg active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Novo Convite
        </button>
      </header>

      {/* Search */}
      <div className="bg-white/10 backdrop-blur-md p-4 rounded-[32px] border border-white/10 flex items-center gap-4 mb-8 relative z-10">
        <Search className="w-6 h-6 text-white/40 ml-2" />
        <input 
          type="text"
          placeholder="Buscar por nome ou apartamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-white font-medium placeholder-white/30"
        />
      </div>

      {/* Visitors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredVisitors.map((visitor) => {
            const status = getStatus(visitor);
            return (
              <motion.div
                key={visitor.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-8 shadow-xl hover:bg-white/10 transition-all group relative overflow-hidden ${
                  status !== 'ACTIVE' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl ${
                    visitor.type === 'VISITOR' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                    }`}>
                      {status === 'ACTIVE' ? 'Ativo' : status === 'EXPIRED' ? 'Expirado' : 'Usado'}
                    </span>
                    <button 
                      onClick={() => revokeVisitor(visitor.id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                  {visitor.name}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-white/60 font-medium">
                    <Home className="w-4 h-4" />
                    <span>Apto {visitor.apartment} - {visitor.tower}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 font-medium">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Válido até {safeFormatDate(visitor.validUntil, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{visitor.type === 'VISITOR' ? 'Visitante' : 'Prestador de Serviço'}</span>
                  </div>
                </div>

                {status === 'ACTIVE' && (
                  <button 
                    onClick={() => setSelectedVisitor(visitor)}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold transition-all border border-white/10 backdrop-blur-md active:scale-95"
                  >
                    <QrCode className="w-5 h-5" />
                    Ver Convite Digital
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#004a7c] rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">Gerar Convite Digital</h2>
                  <p className="text-white/60 font-medium">O QR Code será gerado com validade limitada.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Nome Completo</label>
                    <input 
                      required
                      type="text"
                      value={newVisitor.name}
                      onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:ring-2 focus:ring-white/20 transition-all outline-none"
                      placeholder="Ex: Maria Oliveira"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Tipo de Acesso</label>
                    <select 
                      value={newVisitor.type}
                      onChange={(e) => setNewVisitor({ ...newVisitor, type: e.target.value as Visitor['type'] })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-white/20 transition-all outline-none"
                    >
                      <option value="VISITOR" className="bg-[#004a7c]">Visitante</option>
                      <option value="SERVICE_PROVIDER" className="bg-[#004a7c]">Prestador de Serviço</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Apto</label>
                      <input 
                        required
                        type="text"
                        value={newVisitor.apartment}
                        onChange={(e) => setNewVisitor({ ...newVisitor, apartment: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:ring-2 focus:ring-white/20 transition-all outline-none"
                        placeholder="101"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Torre</label>
                      <input 
                        required
                        type="text"
                        value={newVisitor.tower}
                        onChange={(e) => setNewVisitor({ ...newVisitor, tower: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:ring-2 focus:ring-white/20 transition-all outline-none"
                        placeholder="A"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Válido até</label>
                    <input 
                      required
                      type="datetime-local"
                      value={newVisitor.validUntil.slice(0, 16)}
                      onChange={(e) => setNewVisitor({ ...newVisitor, validUntil: new Date(e.target.value).toISOString() })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-white/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-bold transition-all border border-white/10">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-[2] bg-white/20 hover:bg-white/30 text-white px-6 py-4 rounded-2xl font-bold transition-all border border-white/20 shadow-lg active:scale-95">
                    Gerar QR Code
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Display Modal */}
      <AnimatePresence>
        {selectedVisitor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#004a7c] rounded-[40px] p-12 w-full max-w-md text-center shadow-2xl border border-white/10"
            >
              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-2">Convite Digital</h3>
                <p className="text-white/60 font-medium">Compartilhe este código com o visitante.</p>
              </div>
              
              <div className="bg-white p-8 rounded-[32px] mb-8 flex items-center justify-center border-2 border-white/20 shadow-inner">
                <QrCode className="w-48 h-48 text-[#004a7c]" />
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Visitante</p>
                  <p className="text-xl font-bold text-white">{selectedVisitor.name}</p>
                </div>
                <div className="flex justify-center gap-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Apto</p>
                    <p className="text-lg font-bold text-white">{selectedVisitor.apartment}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Torre</p>
                    <p className="text-lg font-bold text-white">{selectedVisitor.tower}</p>
                  </div>
                </div>
                <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  Válido até {safeFormatDate(selectedVisitor.validUntil, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <button 
                onClick={() => setSelectedVisitor(null)}
                className="w-full bg-white text-[#004a7c] px-6 py-4 rounded-2xl font-bold transition-all active:scale-95"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
