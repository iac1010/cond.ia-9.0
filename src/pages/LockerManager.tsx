import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Package, Client } from '../types';
import { 
  Package as PackageIcon, 
  Plus, 
  Search, 
  CheckCircle2, 
  QrCode, 
  Clock, 
  Truck, 
  User, 
  Home,
  X,
  Fingerprint,
  Camera,
  Image as ImageIcon,
  ScanLine,
  MessageCircle
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFormatDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { sendWhatsAppMessage } from '../services/whatsappService';

export default function LockerManager() {
  const navigate = useNavigate();
  const { packages, addPackage, pickupPackage, clients } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [scanResult, setScanResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPkg, setNewPkg] = useState<Omit<Package, 'id' | 'receivedAt' | 'status' | 'qrCode'>>({
    residentName: '',
    apartment: '',
    tower: '',
    carrier: '',
    trackingCode: '',
    photoUrl: '',
    clientId: ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPkg(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = await addPackage(newPkg);
    
    if (sendWhatsApp) {
      const resident = clients.find(c => c.id === pkg.clientId);
      if (resident?.phone) {
        const message = `Olá ${pkg.residentName}, uma encomenda de ${pkg.carrier} chegou para você (Apto ${pkg.apartment} ${pkg.tower}). Seu código de retirada é: ${pkg.qrCode}.`;
        sendWhatsAppMessage(resident.phone, message);
      }
    }

    setIsModalOpen(false);
    setNewPkg({
      residentName: '',
      apartment: '',
      tower: '',
      carrier: '',
      trackingCode: '',
      photoUrl: '',
      clientId: ''
    });
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = packages.find(p => p.qrCode === scanResult && p.status === 'PENDING');
    if (pkg) {
      pickupPackage(pkg.id);
      setIsScannerOpen(false);
      setScanResult('');
      alert(`Pacote de ${pkg.carrier} para ${pkg.residentName} liberado!`);
    } else {
      alert('QR Code inválido ou pacote já retirado.');
    }
  };

  const handleResidentSelect = (client: Client) => {
    setNewPkg(prev => ({
      ...prev,
      residentName: client.name,
      clientId: client.id,
      // Assuming address contains apartment/tower info or we just use it as is
      apartment: client.address.split(',')[0].replace(/\D/g, '') || prev.apartment,
    }));
  };

  const filteredPackages = packages.filter(p => 
    p.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.apartment.includes(searchTerm) ||
    p.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-6xl font-light tracking-tight">Locker</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Gestão de encomendas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-bold transition-all border border-white/10 active:scale-95"
          >
            <ScanLine className="w-5 h-5" />
            Escanear QR
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-[#004a7c] px-6 py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Registrar
          </button>
        </div>
      </header>

      {/* Painel Central de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 relative z-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[40px] p-8 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
          <div className="p-4 bg-white/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
            <PackageIcon className="w-8 h-8 text-white/60" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Recebidas</span>
          <span className="text-5xl font-black text-white">{packages.length}</span>
        </div>

        <div className="bg-white rounded-[40px] p-8 flex flex-col items-center justify-center text-center shadow-2xl transform hover:scale-105 transition-all">
          <div className="p-4 bg-[#004a7c]/5 rounded-2xl mb-4">
            <Clock className="w-10 h-10 text-[#004a7c]" />
          </div>
          <span className="text-sm font-black uppercase tracking-[0.2em] text-[#004a7c]/60 mb-2">Para Retirada</span>
          <span className="text-7xl font-black text-[#004a7c]">{packages.filter(p => p.status === 'PENDING').length}</span>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[40px] p-8 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
          <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Já Retiradas</span>
          <span className="text-5xl font-black text-white">{packages.filter(p => p.status === 'PICKED_UP').length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 relative z-10">
        <div className="w-full bg-white/5 p-4 rounded-[32px] border border-white/10 backdrop-blur-md flex items-center gap-4">
          <Search className="w-6 h-6 text-white/40 ml-2" />
          <input 
            type="text"
            placeholder="Buscar morador, apto ou transportadora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/40 font-medium"
          />
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredPackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white/5 border border-white/10 backdrop-blur-md rounded-[32px] p-8 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden ${
                pkg.status === 'PICKED_UP' ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl ${
                  pkg.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <PackageIcon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                    pkg.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {pkg.status === 'PENDING' ? 'Aguardando' : 'Retirado'}
                  </span>
                </div>
              </div>

              {pkg.photoUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 aspect-video relative group/photo">
                  <img src={pkg.photoUrl} alt="Pacote" className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110" />
                  <div className="absolute inset-0 bg-black/20 group-hover/photo:bg-black/0 transition-colors" />
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                {pkg.residentName}
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-white/60 font-medium">
                  <Home className="w-4 h-4" />
                  <span>Apto {pkg.apartment} - {pkg.tower}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 font-medium">
                  <Truck className="w-4 h-4" />
                  <span>{pkg.carrier} {pkg.trackingCode && `(${pkg.trackingCode})`}</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-sm font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Recebido em {safeFormatDate(pkg.receivedAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {pkg.status === 'PENDING' ? (
                <div className="flex gap-3 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => setSelectedPackage(pkg)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    QR
                  </button>
                  <button 
                    onClick={() => pickupPackage(pkg.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-[#004a7c] py-3 rounded-xl font-bold transition-all shadow-xl"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Retirar
                  </button>
                </div>
              ) : (
                <div className="pt-6 border-t border-white/5 flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Retirado em {safeFormatDate(pkg.pickedUpAt!, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Register Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Registrar</h2>
                  <p className="text-slate-500 font-medium">O morador será notificado.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Morador</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="text"
                        list="residents-list"
                        value={newPkg.residentName}
                        onChange={(e) => {
                          const client = clients.find(c => c.name === e.target.value);
                          if (client) {
                            handleResidentSelect(client);
                          } else {
                            setNewPkg({ ...newPkg, residentName: e.target.value });
                          }
                        }}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all"
                        placeholder="Nome ou selecionar..."
                      />
                      <datalist id="residents-list">
                        {clients.map(c => (
                          <option key={c.id} value={c.name}>{c.address}</option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Apto</label>
                      <input 
                        required
                        type="text"
                        value={newPkg.apartment}
                        onChange={(e) => setNewPkg({ ...newPkg, apartment: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all"
                        placeholder="101"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Torre</label>
                      <input 
                        required
                        type="text"
                        value={newPkg.tower}
                        onChange={(e) => setNewPkg({ ...newPkg, tower: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all"
                        placeholder="A"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Transportadora</label>
                    <div className="relative">
                      <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        required
                        type="text"
                        value={newPkg.carrier}
                        onChange={(e) => setNewPkg({ ...newPkg, carrier: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all"
                        placeholder="Ex: Amazon"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Rastreio</label>
                    <input 
                      type="text"
                      value={newPkg.trackingCode}
                      onChange={(e) => setNewPkg({ ...newPkg, trackingCode: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#004a7c] transition-all"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Foto do Pacote</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative"
                  >
                    {newPkg.photoUrl ? (
                      <>
                        <img src={newPkg.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-slate-300 mb-2" />
                        <span className="text-sm text-slate-400 font-medium">Clique para tirar foto ou upload</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <input 
                      type="checkbox"
                      id="send-whatsapp"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-[#004a7c] focus:ring-[#004a7c]"
                    />
                    <label htmlFor="send-whatsapp" className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      Enviar notificação via WhatsApp
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-4 rounded-2xl font-bold transition-all">
                      Cancelar
                    </button>
                    <button type="submit" className="flex-[2] bg-[#004a7c] hover:bg-[#003d66] text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-95">
                      Confirmar
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Escanear QR</h3>
                <button onClick={() => setIsScannerOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="aspect-square bg-slate-900 rounded-[32px] mb-8 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-1 bg-emerald-500 absolute top-0 animate-scan" />
                </div>
                <ScanLine className="w-24 h-24 text-emerald-500 animate-pulse" />
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Posicione o QR Code</p>
                </div>
              </div>

              <form onSubmit={handleScan} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Código Manual</label>
                  <input 
                    type="text"
                    value={scanResult}
                    onChange={(e) => setScanResult(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 font-mono focus:ring-2 focus:ring-[#004a7c] transition-all"
                    placeholder="PKG-XXXXXX"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#004a7c] text-white px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-xl"
                >
                  Validar Retirada
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-12 w-full max-w-md text-center shadow-2xl"
            >
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-2">QR Code</h3>
                <p className="text-slate-500 font-medium">Apresente no locker digital.</p>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-[32px] mb-8 flex items-center justify-center border-2 border-dashed border-slate-200">
                <QrCode className="w-48 h-48 text-slate-900" />
              </div>

              <div className="space-y-2 mb-8">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">ID</p>
                <p className="text-xl font-mono font-bold text-[#004a7c]">{selectedPackage.qrCode}</p>
              </div>

              <button 
                onClick={() => setSelectedPackage(null)}
                className="w-full bg-[#004a7c] text-white px-6 py-4 rounded-2xl font-bold transition-all active:scale-95"
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
