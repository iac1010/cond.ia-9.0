import { useState, useEffect, useMemo } from 'react';
import { 
  Video, Copy, ExternalLink, Trash2, Check, Sparkles, 
  Users, Clock, Plus, Share2, CornerDownRight, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface MeetRecord {
  id: string;
  title: string;
  code: string;
  url: string;
  tags: string[];
  createdAt: string;
}

export function DashboardGoogleMeetTile({ 
  isEditMode 
}: { 
  isEditMode: boolean;
}) {
  const [meetRecords, setMeetRecords] = useState<MeetRecord[]>(() => {
    const saved = localStorage.getItem('dashboard_google_meet_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        title: '🔒 Alinhamento Diário - Portaria & Zeladoria',
        code: 'cfg-port-zld',
        url: 'https://meet.google.com/cfg-port-zld',
        tags: ['Portaria', 'Zelador'],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: '2',
        title: '⚡ Reunião de Urgência - Manutenção Bombas',
        code: 'vbt-hydr-maint',
        url: 'https://meet.google.com/vbt-hydr-maint',
        tags: ['Manutenção', 'Síndico'],
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Custom creator fields
  const [meetingTitle, setMeetingTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Recently generated link display
  const [generatedMeet, setGeneratedMeet] = useState<MeetRecord | null>(null);
  const [showQrModal, setShowQrModal] = useState<MeetRecord | null>(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_google_meet_history', JSON.stringify(meetRecords));
  }, [meetRecords]);

  // Pre-configured tag choices
  const tagOptions = ['Síndico', 'Zelador', 'Portaria', 'Conselho', 'Fornecedor', 'Moradores', 'Urgência'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  // Helper to generate a realistic Google Meet alphabetical code (abc-defg-hij)
  const generateRandomMeetCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len: number) => {
      let str = '';
      for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return str;
    };
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
  };

  const handleInstantMeetingNow = () => {
    // Open Google Meet instant room path in new tab (triggered securely by human click)
    const url = 'https://meet.google.com/new';
    window.open(url, '_blank', 'noreferrer,noopener');
    toast.success('Direcionando para o Google Meet Instantâneo!');
  };

  const handleGenerateCustomLink = () => {
    const finalTitle = meetingTitle.trim() || 'Sala Rápida Condfy';
    
    // Clean code formatting - remove non-alphanumeric, replace spaces with hyphens
    let codeSegment = customCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!codeSegment) {
      codeSegment = generateRandomMeetCode();
    }
    
    const finalUrl = `https://meet.google.com/${codeSegment}`;
    
    const newMeet: MeetRecord = {
      id: Date.now().toString(),
      title: finalTitle,
      code: codeSegment,
      url: finalUrl,
      tags: selectedTags,
      createdAt: new Date().toISOString()
    };

    setMeetRecords(prev => [newMeet, ...prev]);
    setGeneratedMeet(newMeet);
    
    // Reset inputs
    setMeetingTitle('');
    setCustomCode('');
    setSelectedTags([]);
    toast.success('Link do Google Meet gerado com sucesso!');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMeetRecords(prev => prev.filter(item => item.id !== id));
    toast.success('Registro removido do histórico local');
  };

  return (
    <div className="w-full h-full text-white bg-zinc-950/80 p-5 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-white/2 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#39FF14]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-3.5 relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Custom colorful video SVG icon */}
          <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-400/30">
            <Video className="w-4.5 h-4.5 text-blue-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase text-white/95 tracking-wider truncate flex items-center gap-1.5">
              Google Meet Express
              <span className="text-[7.5px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded-full tracking-wider">SALAS</span>
            </h3>
            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Criador Expresso de Reuniões</p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={() => { setActiveTab('create'); setGeneratedMeet(null); }}
            className={`px-3 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'create' 
                ? 'bg-white text-black font-black' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Gerador
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all relative ${
              activeTab === 'history' 
                ? 'bg-white text-black font-black' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Histórico
            {meetRecords.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#39FF14] rounded-full border border-zinc-950 flex items-center justify-center text-[6px] font-bold text-black font-black leading-none shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Main Container Workspace */}
      <div className="flex-1 min-h-0 flex flex-col justify-between select-none relative z-10 py-1.5">
        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.div 
              key="tab-create"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col h-full justify-between gap-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Creator Card Form or Show Generated Results */}
              {!generatedMeet ? (
                <div className="space-y-3.5">
                  {/* Immediate Launcher Header */}
                  <div className="bg-gradient-to-r from-blue-950/20 to-zinc-950 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-extrabold text-[#39FF14] uppercase tracking-wider block">Fluxo Instantâneo</span>
                      <h4 className="text-[10px] font-bold text-white/90 leading-tight">Criar sala aleatória imediatamente no navegador.</h4>
                    </div>
                    
                    <button 
                      onClick={handleInstantMeetingNow}
                      className="px-3 py-2 bg-[#39FF14] text-zinc-950 hover:bg-white hover:text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_12px_rgba(57,255,20,0.25)] flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      Lançar
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-2.5">
                    {/* Meeting Title Input */}
                    <div className="space-y-1">
                      <label className="text-[7.5px] font-black uppercase text-white/40 tracking-wider">Assunto / Tópico</label>
                      <input 
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="Ex: Reunião Condomínio Bloco B"
                        className="w-full bg-zinc-900/60 border border-white/5 focus:border-sky-400/30 rounded-xl px-3 py-2 text-[10.5px] text-white placeholder-white/20 outline-none transition-all font-semibold"
                      />
                    </div>

                    {/* Custom Code Input */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[7.5px] font-black uppercase text-white/40 tracking-wider">Apenas Código (opcional)</label>
                        <span className="text-[7.5px] text-zinc-400 italic font-medium">Ex: abc-defg-hij</span>
                      </div>
                      <input 
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        placeholder="Deixe em branco p/ gerar código"
                        className="w-full bg-zinc-900/60 border border-white/5 focus:border-sky-400/30 rounded-xl px-3 py-2 text-[10.5px] text-white placeholder-white/20 outline-none transition-all font-mono font-medium"
                      />
                    </div>

                    {/* Quick Tags select */}
                    <div className="space-y-1">
                      <label className="text-[7.5px] font-black uppercase text-white/40 tracking-wider block">Marcadores de Relevância</label>
                      <div className="flex flex-wrap gap-1">
                        {tagOptions.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase transition-all tracking-wide border ${
                                isSelected 
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-[0_0_8px_rgba(56,189,248,0.15)]' 
                                  : 'bg-zinc-900/40 text-white/40 border-white/5 hover:border-white/10 hover:text-white/60'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Show Generated Results directly on the tile! */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900/80 border border-emerald-500/30 p-4 rounded-2xl flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2.5 bg-emerald-500/10 rounded-bl-xl border-l border-b border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-[#39FF14] animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-extrabold text-[#39FF14] uppercase tracking-widest flex items-center gap-1">
                       Sala Gerada com Sucesso
                    </span>
                    <h4 className="text-[12px] font-black text-white leading-tight uppercase truncate">{generatedMeet.title}</h4>
                  </div>

                  {/* Room Link Display box */}
                  <div className="bg-black/40 border border-white/5 px-3 py-2 rounded-xl flex items-center justify-between gap-2.5">
                    <span className="text-[10px] font-mono text-emerald-400 tracking-wider font-semibold truncate flex-1">{generatedMeet.url}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => copyToClipboard(generatedMeet.url, generatedMeet.id)}
                        className="p-1.5 hover:p-2 bg-white/5 hover:bg-white/10 text-white hover:text-[#39FF14] rounded-lg transition-all"
                        title="Copiar link"
                      >
                        {copiedId === generatedMeet.id ? <Check className="w-3.5 h-3.5 text-[#39FF14]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => setShowQrModal(generatedMeet)}
                        className="p-1.5 hover:p-2 bg-white/5 hover:bg-white/10 text-white hover:text-[#39FF14] rounded-lg transition-all"
                        title="Ver QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setGeneratedMeet(null)}
                      className="px-3 py-1.5 text-[8px] font-black uppercase text-white/40 hover:text-white tracking-widest hover:bg-white/5 rounded-lg transition-all"
                    >
                      Criar Outro
                    </button>
                    
                    <a 
                      href={generatedMeet.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="px-3 py-1.5 bg-[#39FF14] text-zinc-950 font-black text-[8px] uppercase tracking-widest rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_12px_rgba(57,255,20,0.3)] flex items-center gap-1"
                    >
                      <span>Entrar na Sala</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Launcher Footer CTA when creating */}
              {!generatedMeet && (
                <button 
                  onClick={handleGenerateCustomLink}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:brightness-110 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Video className="w-3.5 h-3.5" />
                  Gerar Link Personalizado
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="tab-history"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col h-full justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* History viewport scroll */}
              <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[196px] flex-1">
                {meetRecords.length > 0 ? (
                  meetRecords.map((meet) => (
                    <div 
                      key={meet.id}
                      className="bg-zinc-900/50 hover:bg-zinc-900/90 border border-white/5 hover:border-white/10 rounded-xl p-3 flex flex-col gap-2.5 transition-all group"
                    >
                      {/* Top title bar */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[10px] font-black text-white/90 leading-tight uppercase truncate">{meet.title}</h4>
                          <span className="text-[7.5px] font-mono text-white/40 flex items-center gap-1 mt-1 font-medium">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            {new Date(meet.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            <span>•</span>
                            meet.google.com/{meet.code}
                          </span>
                        </div>

                        {/* Tag badges */}
                        <div className="flex flex-wrap gap-0.5 justify-end max-w-[100px] shrink-0 pointer-events-none select-none">
                          {meet.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[6.5px] font-extrabold bg-sky-500/10 text-sky-400 px-1 py-0.2 rounded uppercase">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tool Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        {/* Custom visual link locator */}
                        <span className="text-[7.5px] font-bold text-white/30 uppercase tracking-widest">Ações Rápidas</span>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => copyToClipboard(meet.url, meet.id)}
                            className="p-1 px-1.5 text-[8px] font-bold bg-white/5 hover:bg-white/10 rounded-md text-white hover:text-[#39FF14] transition-all flex items-center gap-1"
                            title="Copiar Link"
                          >
                            {copiedId === meet.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>{copiedId === meet.id ? 'Copiado!' : 'Copiar'}</span>
                          </button>

                          <button 
                            onClick={() => setShowQrModal(meet)}
                            className="p-1 btn bg-white/5 hover:bg-white/10 text-white/50 hover:text-[#39FF14] rounded-md transition-all shrink-0"
                            title="QR Code"
                          >
                            <QrCode className="w-3 h-3" />
                          </button>

                          <a 
                            href={meet.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="p-1 px-1.5 text-[8px] font-bold bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-black rounded-md transition-all flex items-center gap-1 shrink-0"
                          >
                            <span>Entrar</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          <button 
                            onClick={(e) => handleDeleteRecord(meet.id, e)}
                            className="p-1 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all shrink-0"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/2 flex flex-col items-center justify-center">
                    <Video className="w-6 h-6 text-white/20 mb-2" />
                    <span className="text-[9px] text-white/30 uppercase block font-black tracking-widest">Histórico de salas vazio</span>
                    <span className="text-[8px] text-white/20 italic">Os links gerados serão guardados localmente</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini QR Code Overlay Dialog */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-xs bg-zinc-950 border border-white/10 rounded-3xl p-5 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-full flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-sky-400">QR CODE DA SALA</span>
                <button 
                  onClick={() => setShowQrModal(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-black tracking-wide text-white">{showQrModal.title}</h4>
                <p className="text-[8px] font-mono text-white/50 tracking-tight mt-0.5">{showQrModal.url}</p>
              </div>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(showQrModal.url)}`}
                  alt="Google Meet QR Code" 
                  className="w-36 h-36 border-none select-none"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-2 w-full mt-1">
                <p className="text-[8.5px] text-white/40 leading-relaxed font-semibold">Aponte a câmera do celular para entrar imediatamente no Google Meet.</p>
                
                <button 
                  onClick={() => copyToClipboard(showQrModal.url, showQrModal.id)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mini close button helper
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
