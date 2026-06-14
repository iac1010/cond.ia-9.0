import { useState, useEffect } from 'react';
import { 
  Zap, Plus, Trash2, Edit2, Play, Check, AlertTriangle, 
  Settings, Loader2, ArrowLeft, RefreshCw, Power, Lightbulb, 
  Cpu, Shield, Bell, Tv, Flame, Activity, Cloud, Lock, Unlock,
  Layers, ExternalLink, Sliders, Info, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export interface IoTDevice {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  icon: string;
  color: string; // Tailwind accent class or hex (e.g., 'emerald', 'sky', 'amber', 'rose', 'indigo')
  headers?: string; // stringified JSON
  body?: string; // stringified JSON or plain text
  noCors: boolean; // whether to use 'no-cors' mode
  lastStatus?: 'idle' | 'success' | 'error' | 'firing';
  lastTriggeredAt?: string;
}

// Icon mapper for Lucide components
const ICON_MAP: Record<string, any> = {
  power: Power,
  lightbulb: Lightbulb,
  cpu: Cpu,
  shield: Shield,
  bell: Bell,
  tv: Tv,
  flame: Flame,
  activity: Activity,
  cloud: Cloud,
  lock: Lock,
  unlock: Unlock,
  zap: Zap,
  sliders: Sliders
};

const COLOR_MAP: Record<string, { bg: string, text: string, border: string, glow: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
  },
  sky: {
    bg: 'bg-sky-500/10 hover:bg-sky-500/20',
    text: 'text-sky-400',
    border: 'border-sky-500/30 hover:border-sky-500/50',
    glow: 'shadow-[0_0_15px_rgba(14,165,233,0.3)]'
  },
  amber: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]'
  },
  rose: {
    bg: 'bg-rose-500/10 hover:bg-rose-500/20',
    text: 'text-rose-400',
    border: 'border-rose-500/30 hover:border-rose-500/50',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]'
  },
  indigo: {
    bg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30 hover:border-indigo-500/50',
    glow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]'
  },
  neon: {
    bg: 'bg-zinc-800/80 hover:bg-[#39FF14]/10',
    text: 'text-[#39FF14]',
    border: 'border-[#39FF14]/30 hover:border-[#39FF14]/50',
    glow: 'shadow-[0_0_15px_rgba(57,255,20,0.3)]'
  }
};

// Helper to check if a URL belongs to a local LAN hostname or IP
const isLocalUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    );
  } catch (e) {
    return false;
  }
};

export function DashboardIoTTile({ 
  isEditMode 
}: { 
  isEditMode: boolean;
}) {
  const [devices, setDevices] = useState<IoTDevice[]>(() => {
    const saved = localStorage.getItem('condfy_iot_devices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Info: Error parsing IoT devices from storage, resetting:', e);
        return [];
      }
    }
    // Return sample device when empty
    return [
      {
        id: 'sample-1',
        name: 'Abrir Portão Social',
        url: 'http://homeassistant.local:8123/api/webhook/social_gate_sample',
        method: 'POST',
        icon: 'lock',
        color: 'neon',
        headers: '{\n  "Content-Type": "application/json"\n}',
        body: '{\n  "action": "open"\n}',
        noCors: true,
        lastStatus: 'idle'
      },
      {
        id: 'sample-2',
        name: 'Refletor da Quadra',
        url: 'https://api.tago.io/data/sample-reflector',
        method: 'GET',
        icon: 'lightbulb',
        color: 'amber',
        noCors: true,
        lastStatus: 'idle'
      }
    ];
  });

  const [activeView, setActiveView] = useState<'grid' | 'add' | 'edit'>('grid');
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  
  // Simulation Mode to allow testing beautiful UI without real LAN/HTTP network connection
  const [isSimulationMode, setIsSimulationMode] = useState(true);

  // Troubleshooting explanation state
  const [failedLocalDevice, setFailedLocalDevice] = useState<IoTDevice | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formMethod, setFormMethod] = useState<'GET' | 'POST' | 'PUT'>('POST');
  const [formIcon, setFormIcon] = useState('power');
  const [formColor, setFormColor] = useState('neon');
  const [formHeaders, setFormHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [formBody, setFormBody] = useState('{\n  "status": "toggle"\n}');
  const [formNoCors, setFormNoCors] = useState(true);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('condfy_iot_devices', JSON.stringify(devices.map(d => ({
      ...d,
      // Clear transient active firing states on save/mount
      lastStatus: d.lastStatus === 'firing' ? 'idle' : d.lastStatus
    }))));
  }, [devices]);

  // Escuta alteração externa (ex: backup restaurado)
  useEffect(() => {
    const handleUpdated = () => {
      const saved = localStorage.getItem('condfy_iot_devices');
      if (saved) {
        try {
          setDevices(JSON.parse(saved));
        } catch (e) {
          console.warn('Erro ao atualizar condfy_iot_devices pelo evento:', e);
        }
      }
    };
    window.addEventListener('condfy_iot_devices_updated', handleUpdated);
    return () => {
      window.removeEventListener('condfy_iot_devices_updated', handleUpdated);
    };
  }, []);

  // Handle open Form for Add
  const handleOpenAdd = () => {
    if (isEditMode) return;
    setFormName('');
    setFormUrl('');
    setFormMethod('POST');
    setFormIcon('zap');
    setFormColor('neon');
    setFormHeaders('{\n  "Content-Type": "application/json"\n}');
    setFormBody('{\n  "trigger": "true"\n}');
    setFormNoCors(true);
    setActiveView('add');
  };

  // Handle open Form for Edit
  const handleOpenEdit = (dev: IoTDevice) => {
    if (isEditMode) return;
    setSelectedDevice(dev);
    setFormName(dev.name);
    setFormUrl(dev.url);
    setFormMethod(dev.method);
    setFormIcon(dev.icon);
    setFormColor(dev.color);
    setFormHeaders(dev.headers || '{\n  "Content-Type": "application/json"\n}');
    setFormBody(dev.body || '{\n  "trigger": "true"\n}');
    setFormNoCors(dev.noCors);
    setActiveView('edit');
  };

  // Save new device
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) {
      toast.error('Preencha pelo menos Nome e URL do dispositivo.');
      return;
    }

    // Validate if JSON header/body are parses if they are customized
    try {
      if (formHeaders.trim()) JSON.parse(formHeaders);
    } catch(err) {
      toast.error('Headers inválidos! Certifique-se de preencher um JSON válido.');
      return;
    }

    const newDevice: IoTDevice = {
      id: 'iot-' + Date.now(),
      name: formName.trim(),
      url: formUrl.trim(),
      method: formMethod,
      icon: formIcon,
      color: formColor,
      headers: formHeaders,
      body: formMethod !== 'GET' ? formBody : undefined,
      noCors: formNoCors,
      lastStatus: 'idle'
    };

    setDevices(prev => [...prev, newDevice]);
    toast.success('Dispositivo IoT adicionado!');
    setActiveView('grid');
  };

  // Submit edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    if (!formName.trim() || !formUrl.trim()) {
      toast.error('Preencha Nome e URL.');
      return;
    }

    try {
      if (formHeaders.trim()) JSON.parse(formHeaders);
    } catch(err) {
      toast.error('Headers inválidos! Use JSON válido.');
      return;
    }

    setDevices(prev => prev.map(d => d.id === selectedDevice.id ? {
      ...d,
      name: formName.trim(),
      url: formUrl.trim(),
      method: formMethod,
      icon: formIcon,
      color: formColor,
      headers: formHeaders,
      body: formMethod !== 'GET' ? formBody : undefined,
      noCors: formNoCors
    } : d));

    toast.success('Dispositivo atualizado!');
    setActiveView('grid');
    setSelectedDevice(null);
  };

  // Delete device
  const handleDelete = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    toast.success('Dispositivo removido.');
    if (selectedDevice?.id === id) {
      setSelectedDevice(null);
    }
    setActiveView('grid');
  };

  // Trigger Action
  const triggerWebhook = async (device: IoTDevice) => {
    if (isEditMode) return;
    
    // Update status to firing UI
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, lastStatus: 'firing' } : d));
    
    const isLocal = isLocalUrl(device.url);
    const toastId = toast.loading(
      isLocal 
        ? `Disparando canal local: "${device.name}"...`
        : `Comutando dispositivo "${device.name}"...`
    );

    // If simulation mode is active, simulate a successful trigger to prevent network fetch failures in test environments
    if (isSimulationMode) {
      setTimeout(() => {
        setDevices(prev => prev.map(d => d.id === device.id ? { 
          ...d, 
          lastStatus: 'success', 
          lastTriggeredAt: new Date().toISOString() 
        } : d));
        toast.success(`[Simulação] "${device.name}" disparado com sucesso!`, { id: toastId });
      }, 1000);
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    if (device.headers) {
      try {
        parsedHeaders = JSON.parse(device.headers);
      } catch(e) {}
    }

    // 1. Direct local connection handler
    if (isLocal) {
      try {
        console.log(`[IoT Direct Router] Direct trigger bypassing cloud proxy for local URL: ${device.url}`);
        
        const options: RequestInit = {
          method: device.method,
          headers: parsedHeaders,
          mode: device.noCors ? 'no-cors' : 'cors'
        };

        if (device.method !== 'GET' && device.body) {
          options.body = device.body;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
        options.signal = controller.signal;

        const response = await fetch(device.url, options);
        clearTimeout(timeoutId);

        // Under no-cors, response.type is 'opaque' and status is 0, which constitutes success for local network triggers
        const isSuccess = device.noCors || (response.status >= 200 && response.status < 300) || response.status === 0;

        if (isSuccess) {
          setDevices(prev => prev.map(d => d.id === device.id ? { 
            ...d, 
            lastStatus: 'success', 
            lastTriggeredAt: new Date().toISOString() 
          } : d));
          toast.success(`"${device.name}" disparado localmente!`, { id: toastId });
        } else {
          throw new Error(`Erro de resposta HTTP ${response.status}`);
        }
      } catch (err: any) {
        console.warn('IoT Direct Fetch Local Info (Normal offline condition for private LAN addresses):', err);
        setDevices(prev => prev.map(d => d.id === device.id ? { ...d, lastStatus: 'error' } : d));
        toast.error(`Falha no envio local! Clique no dispositivo para obter dicas de solução de rede.`, { id: toastId });
        setFailedLocalDevice(device);
      }
      return;
    }

    // 2. Cloud proxy path for standard public Webhooks (to bypass CORS block on browser context)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout

      const proxyBody = {
        url: device.url,
        method: device.method,
        headers: parsedHeaders,
        body: device.method !== 'GET' ? device.body : undefined
      };

      const response = await fetch('/api/iot-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proxyBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Analyze proxied response status
      if (response.ok) {
        setDevices(prev => prev.map(d => d.id === device.id ? { 
          ...d, 
          lastStatus: 'success', 
          lastTriggeredAt: new Date().toISOString() 
        } : d));
        toast.success(`"${device.name}" disparado via Proxy!`, { id: toastId });
      } else {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.details || json.error || `Erro HTTP ${response.status}`);
      }
    } catch (err: any) {
      console.warn('IoT Webhook Proxy Info, trying client direct fallback:', err);
      
      // FALLBACK: If proxy fails, try client-side direct request (usually for public URLs that failed on proxy)
      try {
        const options: RequestInit = {
          method: device.method,
          headers: parsedHeaders,
          mode: device.noCors ? 'no-cors' : 'cors'
        };

        if (device.method !== 'GET' && device.body) {
          options.body = device.body;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        options.signal = controller.signal;

        const response = await fetch(device.url, options);
        clearTimeout(timeoutId);

        const isSuccess = device.noCors || (response.status >= 200 && response.status < 300);

        if (isSuccess) {
          setDevices(prev => prev.map(d => d.id === device.id ? { 
            ...d, 
            lastStatus: 'success', 
            lastTriggeredAt: new Date().toISOString() 
          } : d));
          toast.success(`"${device.name}" disparado (conexão direta)!`, { id: toastId });
        } else {
          throw new Error(`Servidor respondeu com código ${response.status}`);
        }
      } catch (fallbackErr: any) {
        console.warn('IoT Webhook Fallback Info:', fallbackErr);
        setDevices(prev => prev.map(d => d.id === device.id ? { ...d, lastStatus: 'error' } : d));
        const errMsg = fallbackErr?.name === 'AbortError' ? 'Estouro de Tempo limite (8s)' : fallbackErr?.message || 'Erro de CORS ou Rede';
        toast.error(`Falha no disparo: ${errMsg}`, { id: toastId });
      }
    }
  };

  return (
    <div className="w-full h-full bg-zinc-950/70 text-white rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-xl backdrop-blur-md">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#39FF14]/5 rounded-full blur-2xl pointer-events-none" />

      {/* HEADER */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 px-[7px] bg-[#39FF14]/10 rounded-lg border border-[#39FF14]/30">
            <Zap size={16} className="text-[#39FF14]" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Acionamento IoT</h3>
            <p className="text-[9px] text-[#39FF14] font-semibold uppercase tracking-wider">Webhooks e Disparos</p>
          </div>
        </div>

        {activeView === 'grid' ? (
          <button
            onClick={handleOpenAdd}
            disabled={isEditMode}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-[#39FF14]/10 hover:border-[#39FF14]/30 text-white transition-all active:scale-95 disabled:opacity-50"
            title="Adicionar Dispositivo"
          >
            <Plus size={15} />
          </button>
        ) : (
          <button
            onClick={() => setActiveView('grid')}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={10} /> Voltar
          </button>
        )}
      </div>

      {/* BODY CARDS OR WORKFLOW */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeView === 'grid' && (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {devices.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-2xl">
                  <Sliders size={20} className="text-white/20 mb-2 animate-pulse" />
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Nenhum dispositivo cadastrado</p>
                  <button
                    onClick={handleOpenAdd}
                    className="mt-2 text-[9px] font-black uppercase tracking-widest text-[#39FF14] hover:underline"
                  >
                    + ADICIONAR AGORA
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {devices.map((device) => {
                    const TargetIcon = ICON_MAP[device.icon] || Zap;
                    const colors = COLOR_MAP[device.color] || COLOR_MAP.neon;
                    const isFiring = device.lastStatus === 'firing';

                    return (
                      <div 
                        key={device.id}
                        className={`flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5 transition-all duration-300 relative group/row overflow-hidden hover:bg-white/[0.07]`}
                      >
                        {/* Device Info & Status Glow */}
                        <div 
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            if (device.lastStatus === 'error') {
                              setFailedLocalDevice(device);
                            } else {
                              handleOpenEdit(device);
                            }
                          }}
                          title={device.lastStatus === 'error' ? "Ver guia de correção" : "Clique para editar"}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(device);
                            }}
                            className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all shrink-0 md:opacity-0 group-hover/row:opacity-100"
                            title="Editar"
                          >
                            <Settings size={11} />
                          </button>

                          <div className={`p-2 rounded-xl border transition-all ${colors.bg} ${colors.border}`}>
                            <TargetIcon size={14} className={colors.text} />
                          </div>
                          <div className="min-w-0 pr-1">
                            <span className="text-[11px] font-bold text-white block truncate leading-tight uppercase tracking-wide flex items-center gap-1">
                              {device.name}
                              {device.lastStatus === 'error' && (
                                <span className="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded font-bold animate-pulse">CORS/FALHA</span>
                              )}
                            </span>
                            <span className="text-[8px] text-white/40 block truncate max-w-[130px] font-mono select-all">
                              {device.url}
                            </span>
                          </div>
                        </div>

                        {/* Action Command / Direct trigger button */}
                        <div className="flex items-center gap-1.5 shrink-0 z-10">
                          {device.lastTriggeredAt && (
                            <span className="text-[8px] font-semibold text-white/30 hidden sm:inline" title={new Date(device.lastTriggeredAt).toLocaleString()}>
                              {new Date(device.lastTriggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (device.lastStatus === 'error') {
                                setFailedLocalDevice(device);
                              } else {
                                triggerWebhook(device);
                              }
                            }}
                            disabled={isFiring || isEditMode}
                            className={`p-2 rounded-xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center transition-all active:scale-90 ${
                              isFiring 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : device.lastStatus === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : device.lastStatus === 'error'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 ring-1 ring-red-500/30'
                                : 'bg-white/5 hover:bg-[#39FF14]/10 border border-white/10 hover:border-[#39FF14]/40 text-[#39FF14]'
                            }`}
                            style={{ minWidth: '32px', minHeight: '32px' }}
                            title={device.lastStatus === 'error' ? "Ver guia de correção" : "Disparar Webhook"}
                          >
                            {isFiring ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : device.lastStatus === 'success' ? (
                              <Check size={12} />
                            ) : device.lastStatus === 'error' ? (
                              <AlertTriangle size={12} className="text-rose-400 animate-bounce" />
                            ) : (
                              <Play size={12} fill="currentColor" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Bottom Quick Info & Interactive Simulation Mode Toggle */}
              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[8px] text-white/30 font-medium">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isSimulationMode;
                    setIsSimulationMode(nextVal);
                    if (nextVal) {
                      toast.success('Modo de Simulação Ativado! Disparos IoT terão sucesso simulado.', { icon: '🤖' });
                    } else {
                      toast.success('Modo Real Ativado! Serão enviados Webhooks reais.', { icon: '🌐' });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                    isSimulationMode 
                      ? 'bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                  }`}
                  title="Alterne entre disparos reais e simulações para teste"
                >
                  <Activity size={10} className={isSimulationMode ? 'animate-pulse' : ''} />
                  <span className="font-bold uppercase tracking-widest text-[8px]">
                    {isSimulationMode ? 'Simulação: Ativa' : 'Simulador: Desligado'}
                  </span>
                </button>
                <span className="uppercase tracking-widest">{devices.length} dispositivos</span>
              </div>
            </motion.div>
          )}

          {(activeView === 'add' || activeView === 'edit') && (
            <motion.form
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={activeView === 'add' ? handleSaveAdd : handleSaveEdit}
              className="space-y-3"
            >
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#39FF14] border-b border-white/5 pb-1 flex justify-between items-center">
                <span>{activeView === 'add' ? 'Adicionar Dispositivo' : 'Editar Dispositivo'}</span>
                {activeView === 'edit' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedDevice!.id)}
                    className="text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 text-[8px] tracking-wider transition-colors"
                  >
                    <Trash2 size={9} /> DELETAR
                  </button>
                )}
              </h4>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Nome do Dispositivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ar Condicionado, Bomba Caixa..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                />
              </div>

              {/* URL */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block">URL do Webhook (Disparador)</label>
                <input
                  type="url"
                  required
                  placeholder="Ex: http://192.168.1.100/toggle ou https://hooks.zapier.com/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#39FF14]/50 font-mono"
                />
              </div>

              {/* HTTP Action configurations */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Método HTTP</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#39FF14]/50 font-black uppercase"
                  >
                    <option value="GET">HTTP GET</option>
                    <option value="POST">HTTP POST</option>
                    <option value="PUT">HTTP PUT</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">CORS Seguros</label>
                  <select
                    value={formNoCors ? 'nocors' : 'cors'}
                    onChange={(e) => setFormNoCors(e.target.value === 'nocors')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#39FF14]/50 font-black uppercase"
                  >
                    <option value="nocors">Opaque (Sem CORS/IoT)</option>
                    <option value="cors">Cors Padrão (Cloud)</option>
                  </select>
                </div>
              </div>

              {/* Custom Icons & Palette config select */}
              <div className="grid grid-cols-2 gap-2">
                {/* Icon selection */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Ícone</label>
                  <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 border border-white/10 rounded-xl">
                    {Object.keys(ICON_MAP).slice(0, 10).map((iconKey) => {
                      const IconComp = ICON_MAP[iconKey];
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setFormIcon(iconKey)}
                          className={`p-1 rounded-md transition-all flex items-center justify-center border ${
                            formIcon === iconKey 
                              ? 'bg-[#39FF14]/20 border-[#39FF14]/50 text-[#39FF14]'
                              : 'border-transparent text-white/40 hover:text-white'
                          }`}
                        >
                          <IconComp size={10} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Scheme selector */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1 font-bold">Esquema</label>
                  <div className="grid grid-cols-3 gap-1 bg-black/40 p-1.5 border border-white/10 rounded-xl h-[42px] items-center">
                    {Object.keys(COLOR_MAP).map((colorKey) => {
                      const colMap = COLOR_MAP[colorKey];
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setFormColor(colorKey)}
                          className={`w-full h-4 rounded-md transition-all border ${
                            formColor === colorKey 
                              ? 'border-white px-0.5' 
                              : 'border-white/10'
                          } flex items-center justify-center`}
                          style={{
                            background: colorKey === 'emerald' ? '#10b981' :
                                        colorKey === 'sky' ? '#0ea5e9' :
                                        colorKey === 'amber' ? '#f59e0b' :
                                        colorKey === 'rose' ? '#f43f5e' :
                                        colorKey === 'indigo' ? '#6366f1' : '#39FF14'
                          }}
                          title={colorKey.toUpperCase()}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Advanced Headers & Payload inputs (Only for POST/PUT) */}
              {formMethod !== 'GET' && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Avançado (Carregar JSON Payload)</span>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-[7px] font-bold uppercase text-white/40 block mb-0.5">Payload do Body (JSON)</label>
                      <textarea
                        rows={2}
                        placeholder='{"state": "ON"}'
                        value={formBody}
                        onChange={(e) => setFormBody(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-lg px-2 py-1 text-[9px] text-emerald-400 font-mono focus:outline-none focus:border-[#39FF14]/30"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action trigger footer */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('grid');
                    setSelectedDevice(null);
                  }}
                  className="w-1/3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-white transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 text-center shadow-lg hover:shadow-[#39FF14]/20"
                >
                  {activeView === 'add' ? 'Salvar Novo' : 'Confirmar'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Troubleshooting Diagnostic Sheet for LAN/Private Webhooks */}
      <AnimatePresence>
        {failedLocalDevice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md p-5 flex flex-col justify-between z-30 overflow-y-auto"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle size={16} className="shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-widest">Guia de Correção Local</h4>
              </div>
              
              <p className="text-[10px] text-white/80 leading-relaxed font-bold uppercase">
                O dispositivo <span className="text-[#39FF14]">{failedLocalDevice.name}</span> aponta para <span className="text-[#39FF14] font-mono break-all">{failedLocalDevice.url}</span>.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1.5 text-[9px] text-white/70">
                <p className="font-bold text-white uppercase text-[8px] tracking-widest text-[#39FF14]">Por que a requisição de rede falhou?</p>
                <p className="leading-relaxed">
                  1. <span className="font-bold text-sky-400">Restrição de Origem Segura (Mixed Content)</span>: Como o Condfy roda em <span className="font-bold text-sky-400">HTTPS</span>, seu navegador (Chrome/Safari) bloqueia requisições <span className="font-bold text-amber-500">HTTP locais</span> automaticamente para preservar a sua privacidade.
                </p>
                <p className="leading-relaxed">
                  2. <span className="font-bold text-emerald-400">Resolução do mDNS</span>: Dependendo do sistema operacional, o navegador pode demorar ou falhar para mapear o hostname <span className="font-mono text-white">.local</span> diretamente se o seu dispositivo local (Home Assistant) não estiver respondendo na porta padrão.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Soluções Rápidas:</span>
                <ul className="text-[8px] leading-relaxed list-disc pl-4 text-white/60 uppercase font-medium space-y-1">
                  <li>
                    <span className="text-emerald-400 font-bold">Conteúdo Inseguro</span>: Na barra do endereço do seu navegador, clique no <span className="text-white">Ícone de Configurações/Cadeado</span> ao lado da URL do app, clique em "Configurações do Site" e altere a opção <span className="text-white font-bold">"Conteúdo Inseguro"</span> (Insecure Content) para <span className="text-emerald-300">Permitir</span>.
                  </li>
                  <li>
                    <span className="text-[#39FF14] font-bold">Modo Opaque (Recomendado)</span>: Use a configuração <span className="text-white">Opaque (Sem CORS)</span>. Ela instrui o navegador a efetuar o disparo cegamente, permitindo disparar comandos IoT na rede local mesmo com CORS bloqueados.
                  </li>
                  <li>
                    <span className="text-sky-400 font-bold">Mude para Link Seguro</span>: Insira o endereço público com SSL de sua automação (ex: seu subdomínio do <span className="text-white font-mono">duckdns.org</span> ou link Cloudflare Tunnel seguro).
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDevices(prev => prev.map(d => d.id === failedLocalDevice.id ? { ...d, noCors: true } : d));
                  setFailedLocalDevice(null);
                  toast.success('Modo Opaque forçado! Retestando...');
                  setTimeout(() => triggerWebhook({ ...failedLocalDevice, noCors: true }), 300);
                }}
                className="w-1/2 py-1.5 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Forçar Opaque & Retestar
              </button>
              <button
                type="button"
                onClick={() => setFailedLocalDevice(null)}
                className="w-1/2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Ignorar e Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
