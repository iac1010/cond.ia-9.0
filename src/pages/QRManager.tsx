import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Download, 
  Building2, 
  MapPin,
  ExternalLink,
  Printer,
  Smartphone,
  MessageSquare,
  Share2
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { Modal } from '../components/Modal';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { safeFormatDate } from '../utils/dateUtils';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { toast } from 'react-hot-toast';

export default function QRManager() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const bulkPrintRef = useRef<HTMLDivElement>(null);
  const { clients, updateClient, companyLogo, companyData, tickets } = useStore();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrType, setQrType] = useState<'chat' | 'feedback'>('chat');
  const [newLocationName, setNewLocationName] = useState('');
  const [qrSize, setQrSize] = useState(200);
  const [printingLocation, setPrintingLocation] = useState<{ id: string, name: string } | null>(null);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const clientReports = useMemo(() => {
    if (!selectedClientId) return [];
    return tickets
      .filter(t => t.clientId === selectedClientId && t.reportedBy)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tickets, selectedClientId]);

  const stats = useMemo(() => {
    if (!selectedClient) return { total: 0, active: 0, pending: 0 };
    return {
      total: (selectedClient.locations || []).length,
      active: (selectedClient.locations || []).length,
      pending: clientReports.filter(r => r.status === 'PENDENTE_APROVACAO').length
    };
  }, [selectedClient, clientReports]);

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newLocationName.trim()) return;

    const newLocation = {
      id: uuidv4(),
      name: newLocationName.trim()
    };

    const updatedLocations = [...(selectedClient.locations || []), newLocation];
    updateClient(selectedClientId, { ...selectedClient, locations: updatedLocations });
    setNewLocationName('');
    setIsModalOpen(false);
    toast.success('Local adicionado com sucesso!');
  };

  const handleDeleteLocation = (locationId: string) => {
    if (!selectedClient) return;
    const updatedLocations = (selectedClient.locations || []).filter(l => l.id !== locationId);
    updateClient(selectedClientId, { ...selectedClient, locations: updatedLocations });
    toast.success('Local removido.');
  };

  const downloadQRCode = (locationId: string, locationName: string) => {
    const svg = document.getElementById(`qr-${locationId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${selectedClient?.name}-${locationName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintTemplate = async (locationId: string, locationName: string) => {
    setPrintingLocation({ id: locationId, name: locationName });
    
    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    setTimeout(async () => {
      if (!printRef.current) return;
      
      try {
        toast.loading('Gerando placa de impressão...', { id: 'printing' });
        await generatePdf(printRef.current, `PLACA-QR-${selectedClient?.name}-${locationName}.pdf`, 'a5');
        toast.success('Placa gerada com sucesso!', { id: 'printing' });
      } catch (error) {
        console.error(error);
        toast.error('Erro ao gerar placa.', { id: 'printing' });
      } finally {
        setPrintingLocation(null);
      }
    }, 100);
  };

  const handlePrintAll = async () => {
    if (!selectedClient || !selectedClient.locations || selectedClient.locations.length === 0) return;

    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    try {
      toast.loading('Gerando folhas de impressão...', { id: 'printing-all' });
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!bulkPrintRef.current) throw new Error('Template de impressão não encontrado');
      await generatePdf(bulkPrintRef.current, `QR-CODES-LOTE-${selectedClient.name}.pdf`);
      toast.success('PDF gerado com sucesso!', { id: 'printing-all' });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF em lote.', { id: 'printing-all' });
    }
  };

  const handleShareAll = async () => {
    if (!selectedClient || !selectedClient.locations || selectedClient.locations.length === 0) return;

    window.scrollTo(0, 0);

    try {
      toast.loading('Preparando compartilhamento...', { id: 'sharing-all' });
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!bulkPrintRef.current) throw new Error('Template de impressão não encontrado');
      await sharePdf(bulkPrintRef.current, `QR-CODES-LOTE-${selectedClient.name}.pdf`);
      toast.success('Compartilhamento iniciado!', { id: 'sharing-all' });
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || 'Erro desconhecido';
      if (errorMsg.includes('Compartilhamento não suportado')) {
        toast.error(errorMsg, { id: 'sharing-all' });
      } else {
        toast.error('Erro ao compartilhar PDF em lote.', { id: 'sharing-all' });
      }
    }
  };

  const getPublicUrl = (clientId: string, locationId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const path = qrType === 'chat' ? 'chat' : 'feedback';
    return `${baseUrl}#/${path}?client=${clientId}&location=${locationId}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative selection:bg-cyan-500/30">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-8">
          <BackButton />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Management Center</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
              QR <span className="text-cyan-400">Studio</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* QR Type Toggle */}
          <div className="bg-white/5 backdrop-blur-xl p-1 rounded-2xl border border-white/10 flex items-center">
            <button
              onClick={() => setQrType('chat')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                qrType === 'chat' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Chat Suporte
            </button>
            <button
              onClick={() => setQrType('feedback')}
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                qrType === 'feedback' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Caixa Opinião
            </button>
          </div>

          <button
            onClick={() => navigate('/qr-reports')}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 border border-white/10 backdrop-blur-xl group active:scale-95"
          >
            <MessageSquare className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm uppercase tracking-widest font-black">Relatos</span>
          </button>
          
          <div className="relative group">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 outline-none focus:border-cyan-500/50 transition-all min-w-[280px] text-white backdrop-blur-xl appearance-none cursor-pointer font-bold text-sm uppercase tracking-widest"
            >
              <option value="" className="bg-[#0a0a0a]">Selecionar Condomínio</option>
              {clients.map(client => (
                <option key={client.id} value={client.id} className="bg-[#0a0a0a]">{client.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto">
        {!selectedClientId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <QrCode className="w-12 h-12 text-cyan-400" />
                )}
              </div>
              <h3 className="text-4xl font-black tracking-tighter uppercase mb-4 italic">Pronto para Gerar?</h3>
              <p className="text-white/40 max-w-md mx-auto text-lg font-medium leading-relaxed">
                Selecione um condomínio no menu superior para começar a gerenciar e criar novos pontos de acesso via QR Code.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-6">Quick Stats</span>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/60">Total Condomínios</span>
                    <span className="text-2xl font-black italic">{clients.length}</span>
                  </div>
                  <div className="h-px bg-white/5 w-full" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/60">Total QR Codes</span>
                    <span className="text-2xl font-black italic text-cyan-400">
                      {clients.reduce((acc, c) => acc + (c.locations?.length || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <h4 className="text-xl font-black uppercase italic mb-2">Suporte 24/7</h4>
                <p className="text-sm text-cyan-400/70 font-bold leading-relaxed">
                  Precisa de ajuda com a configuração dos seus QR Codes? Nossa equipe está pronta para ajudar.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Localização Atual</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                  {selectedClient?.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-6 backdrop-blur-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Zoom</span>
                  <input 
                    type="range" 
                    min="100" 
                    max="400" 
                    step="10"
                    value={qrSize} 
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-32 accent-cyan-400 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-black text-cyan-400 w-10">{qrSize}px</span>
                </div>

                <button
                  onClick={handlePrintAll}
                  className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 border border-white/10 backdrop-blur-xl active:scale-95"
                >
                  <Printer className="w-5 h-5 text-cyan-400" />
                  Imprimir Lote
                </button>

                <button
                  onClick={handleShareAll}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 border border-blue-500/20 backdrop-blur-xl active:scale-95"
                >
                  <Share2 className="w-5 h-5 text-blue-400" />
                  Compartilhar Lote
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Novo Local
                </button>
              </div>
            </div>

            {/* Stats Mirror */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Pontos', value: stats.total, icon: MapPin, color: 'text-white' },
                { label: 'Ativos', value: stats.active, icon: Smartphone, color: 'text-cyan-400' },
                { label: 'Impressos', value: stats.total, icon: Printer, color: 'text-blue-400' },
                { label: 'Relatos Pendentes', value: stats.pending, icon: MessageSquare, color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-white/10 transition-colors" />
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-4`} />
                  <div className="flex items-end justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</span>
                    <span className="text-3xl font-black italic leading-none">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            {clientReports.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Atividade Recente</span>
                  </div>
                  <button 
                    onClick={() => navigate('/qr-reports')}
                    className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Ver Todos
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clientReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                          {safeFormatDate(report.date)}
                        </span>
                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          report.status === 'PENDENTE_APROVACAO' ? 'bg-amber-500/20 text-amber-400' :
                          report.status === 'APROVADO' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {report.status === 'PENDENTE_APROVACAO' ? 'Pendente' : 
                           report.status === 'APROVADO' ? 'Aprovado' : 'Rejeitado'}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2 line-clamp-1">{report.location}</h4>
                      <p className="text-xs text-white/40 italic line-clamp-2">"{report.reportedProblem}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {(selectedClient?.locations || []).map(loc => (
                <div key={loc.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl hover:bg-white/10 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl mb-8 relative group/qr">
                      <div className="absolute inset-0 bg-cyan-500/20 blur-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <QRCodeSVG 
                          id={`qr-${loc.id}`}
                          value={getPublicUrl(selectedClientId, loc.id)}
                          size={qrSize}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-8 w-full">
                      <h3 className="text-2xl font-black uppercase tracking-tight italic mb-2 truncate">{loc.name}</h3>
                      <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                        <Smartphone className="w-3 h-3" />
                        ID: {loc.id.slice(0,8)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        onClick={() => handlePrintTemplate(loc.id, loc.name)}
                        className="py-4 rounded-2xl bg-white text-black hover:bg-cyan-400 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Placa
                      </button>
                      <button
                        onClick={() => downloadQRCode(loc.id, loc.name)}
                        className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-white/10"
                      >
                        <Download className="w-4 h-4" />
                        PNG
                      </button>
                    </div>
                    
                    <a
                      href={getPublicUrl(selectedClientId, loc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 border border-cyan-500/20"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {qrType === 'chat' ? 'Testar Chat de Suporte' : 'Testar Caixa de Opinião'}
                    </a>
                  </div>
                </div>
              ))}

              {(selectedClient?.locations || []).length === 0 && (
                <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/2 backdrop-blur-sm">
                  <QrCode className="w-16 h-16 text-white/10 mx-auto mb-6" />
                  <p className="text-white/20 text-2xl font-black uppercase tracking-widest italic">Nenhum local configurado</p>
                  <p className="text-white/10 text-sm font-bold mt-2">Adicione o primeiro local para gerar o sistema de QR Codes.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Ponto de Acesso"
        maxWidth="sm"
      >
        <form onSubmit={handleAddLocation} className="space-y-6 p-4">
          <div>
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Identificação do Local</label>
            <input
              required
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Ex: Elevador Social, Garagem G1..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500/50 transition-all text-white font-bold placeholder:text-white/10"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              Criar Ponto
            </button>
          </div>
        </form>
      </Modal>

      {/* Modern QR Code Print Template (Off-screen for rendering) - Acrylic Style */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={printRef} 
          ref-name="printRef"
          style={{ backgroundColor: '#ffffff', color: '#18181b' }} 
          className="w-[148mm] h-[210mm] relative flex flex-col items-center p-10 font-sans overflow-hidden pdf-content"
        >
          {/* Header Text */}
              <div className="w-full text-center mb-6 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div style={{ backgroundColor: qrType === 'chat' ? '#18181b' : '#ec4899' }} className="w-2 h-2 rounded-full" />
                  <span style={{ color: '#a1a1aa' }} className="text-[10px] font-black uppercase tracking-[0.4em]">
                    {qrType === 'chat' ? 'Suporte Técnico' : 'Sua Opinião'}
                  </span>
                </div>
                <h1 className="text-4xl font-black tracking-tighter leading-none uppercase italic">
                  {qrType === 'chat' ? (
                    <>Relate um <span style={{ color: '#a1a1aa' }}>Problema</span></>
                  ) : (
                    <>Dê sua <span style={{ color: '#ec4899' }}>Opinião</span></>
                  )}
                </h1>
              </div>

          {/* The "Acrylic" Plate Container */}
          <div style={{ backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' }} className="w-full flex-1 rounded-[4rem] border p-6 flex flex-col items-center relative shadow-inner">
            
            {/* QR Code Section (Middle) */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div style={{ backgroundColor: '#ffffff' }} className="p-10 rounded-[3rem] shadow-2xl border border-zinc-100">
                {printingLocation && (
                  <QRCodeSVG 
                    value={getPublicUrl(selectedClientId, printingLocation.id)}
                    size={260}
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>
              <div className="mt-6 text-center">
                <span style={{ color: '#71717a' }} className="text-[10px] font-black uppercase tracking-[0.4em]">Escaneie o Código</span>
              </div>
            </div>

            {/* Black Info Box (Bottom) */}
            <div style={{ backgroundColor: '#18181b' }} className="w-full h-[65mm] rounded-[3.5rem] p-10 flex flex-col justify-center shadow-2xl relative overflow-hidden">
              {/* Subtle texture for the black box */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
              
              <div className="relative z-10">
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }} className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Localização</span>
                <h2 style={{ color: '#ffffff' }} className="text-4xl font-black uppercase tracking-tight italic leading-tight mb-4">
                  {printingLocation?.name || 'Local'}
                </h2>
                
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} className="h-px w-full mb-4" />
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span style={{ color: 'rgba(255, 255, 255, 0.3)' }} className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">Condomínio</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="text-sm font-bold uppercase tracking-wide">
                      {selectedClient?.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[8px] font-mono uppercase">ID: {printingLocation?.id.slice(0,8)}</span>
                    <div className="flex gap-1.5 mt-2">
                      {[1,2,3,4].map(i => <div key={i} style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} className="w-1.5 h-1.5 rounded-full" />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full mt-8 flex items-center justify-between px-6 relative z-10">
            <div className="flex items-center gap-4">
              {companyLogo && <img src={companyLogo} alt="Logo" className="h-10 object-contain opacity-40 grayscale" referrerPolicy="no-referrer" />}
              <div className="flex flex-col">
                <span style={{ color: '#a1a1aa' }} className="text-[11px] font-black uppercase tracking-[0.2em]">
                  {companyData?.name || 'FLORES'}
                </span>
                <span style={{ color: '#d4d4d8' }} className="text-[8px] font-bold uppercase tracking-widest">Gestão de Manutenção</span>
              </div>
            </div>
            <div className="text-right">
              <span style={{ color: '#d4d4d8' }} className="text-[9px] font-black uppercase tracking-[0.3em]">Powered by QR Studio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Print Template - Modern Style (Off-screen) */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={bulkPrintRef} 
          ref-name="bulkPrintRef"
          style={{ backgroundColor: '#ffffff', color: '#18181b' }} 
          className="w-[210mm] font-sans pdf-content"
        >
          {selectedClient?.locations && Array.from({ length: Math.ceil(selectedClient.locations.length / 4) }).map((_, pageIndex) => (
            <div key={pageIndex} className="w-[210mm] h-[297mm] grid grid-cols-2 grid-rows-2 p-[10mm] gap-[10mm] page-break-after-always">
              {selectedClient.locations?.slice(pageIndex * 4, (pageIndex * 4) + 4).map((loc) => (
                <div key={loc.id} style={{ backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' }} className="border rounded-[3.5rem] p-4 flex flex-col items-center relative shadow-inner overflow-hidden">
                  
                  {/* QR Section */}
                  <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <div style={{ backgroundColor: '#ffffff' }} className="p-6 rounded-[2rem] shadow-xl border border-zinc-100">
                      <QRCodeSVG 
                        value={getPublicUrl(selectedClientId, loc.id)}
                        size={140}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Black Box */}
                  <div style={{ backgroundColor: '#18181b' }} className="w-full h-[45mm] rounded-[2.5rem] p-6 flex flex-col justify-center shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
                    
                    <div className="relative z-10">
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[6px] font-black uppercase tracking-widest block mb-1">
                        {qrType === 'chat' ? 'Localização' : 'Sua Opinião'}
                      </span>
                      <h3 style={{ color: '#ffffff' }} className="text-lg font-black uppercase tracking-tight leading-none truncate italic mb-3">
                        {loc.name}
                      </h3>
                      
                      <div style={{ borderTopColor: 'rgba(255, 255, 255, 0.05)' }} className="pt-3 border-t flex justify-between items-center">
                        <span style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-[5px] font-mono uppercase">ID: {loc.id.slice(0,8)}</span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[6px] font-black uppercase tracking-widest">
                          {companyData?.name || 'FLORES'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
