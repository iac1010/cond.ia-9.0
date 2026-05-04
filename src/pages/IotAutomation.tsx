import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Home, Droplets, Lightbulb, ShieldCheck, Settings, 
  Power, Menu, ChevronRight, Bell, Search,
  Thermometer, Wind, Zap, Activity, Battery,
  Lock, Unlock, AlertTriangle, CheckCircle2,
  Grid, DoorOpen, Building
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

import { useNavigate, useLocation } from 'react-router-dom';

const dataDemanda = [
  { name: 'Seg', uv: 100 },
  { name: 'Ter', uv: 180 },
  { name: 'Qui', uv: 120 },
  { name: 'Sáb', uv: 250 },
  { name: 'Dom', uv: 150 },
];

const CircularProgress = ({ value }: { value: number }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center my-6">
      <svg className="transform -rotate-90 w-40 h-40">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="16"
          fill="transparent"
          className="text-white/10"
        />
        {/* Progress circle */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="16"
          fill="transparent"
          strokeDasharray={circumference}
          className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white drop-shadow-md">{value}%</span>
      </div>
    </div>
  );
};

const VerticalTube = ({ value, height = "h-48" }: { value: number, height?: string }) => (
  <div className="flex flex-col items-center gap-2 relative">
    <div className={`w-10 ${height} bg-white/10 rounded-full relative overflow-hidden border border-white/20 shadow-inner`}>
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: `${value}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full"
      >
        {/* Bubbles */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle,white_10%,transparent_20%)] bg-[length:10px_10px] animate-[slide_3s_linear_infinite]" />
      </motion.div>
    </div>
    {/* Indicator arrow */}
    <div 
      className="absolute right-[-12px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white transition-all duration-1000"
      style={{ bottom: `calc(${value}% - 6px)` }}
    />
  </div>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean, onChange: (e: React.MouseEvent) => void, label?: string }) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      onChange(e);
    }}
    className={`w-14 h-7 rounded-full relative transition-colors duration-300 flex items-center px-1 shadow-inner flex-shrink-0 ${checked ? 'bg-zinc-100' : 'bg-white/20'}`}
  >
    <motion.div 
      layout
      className="w-5 h-5 bg-white rounded-full shadow-md"
      animate={{ x: checked ? 28 : 0 }}
    />
    {label && (
      <span className={`absolute text-[9px] font-bold ${checked ? 'left-2 text-white' : 'right-2 text-white/60'}`}>
        {checked ? 'ON' : 'OFF'}
      </span>
    )}
  </button>
);

const Slider = ({ value, onChange, color = "from-blue-500 to-cyan-400" }: { value: number, onChange: (v: number) => void, color?: string }) => (
  <div className="h-2.5 bg-white/10 rounded-full relative w-full overflow-hidden shadow-inner group cursor-pointer">
    <motion.div 
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.1 }}
      className={`absolute top-0 left-0 bottom-0 bg-gradient-to-r ${color} rounded-full pointer-events-none`}
    />
    <input 
      type="range" 
      min="0" 
      max="100" 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    />
  </div>
);

export default function IotAutomation() {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const { addNotification, iotState, updateIotState } = store;
  
  const buildings = useMemo(() => {
    return store.clients.map(c => ({
      id: c.id,
      name: c.name,
      units: c.unit ? parseInt(c.unit) || 0 : 0
    }));
  }, [store.clients]);

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('visao-geral');
  
  const pumps = iotState.pumps;
  const lights = iotState.lights;
  const alarmActive = iotState.alarmActive;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLightChange = (room: keyof typeof lights, value: number) => {
    updateIotState({ lights: { [room]: value } as any });
  };

  const handleToggleAllLights = () => {
    const newState = !lights.todas;
    updateIotState({
      lights: {
        cozinha: newState ? 100 : 0,
        sala: newState ? 100 : 0,
        jardim: newState ? 100 : 0,
        todas: newState
      }
    });
    
    toast.success(newState ? 'Todas as luzes foram ligadas' : 'Todas as luzes foram desligadas');
    addNotification({
      title: 'Automação de Iluminação',
      message: newState ? 'Todas as luzes foram ligadas remotamente.' : 'Todas as luzes foram desligadas remotamente.',
      type: 'INFO'
    });
  };

  const handlePumpToggle = (pump: 'caixa' | 'jardim') => {
    const newState = !pumps[pump];
    updateIotState({ pumps: { [pump]: newState } as any });
    
    const pumpName = pump === 'caixa' ? "Bomba da Caixa D'água" : "Bomba do Jardim";
    toast.success(`${pumpName} ${newState ? 'ligada' : 'desligada'}`);
    addNotification({
      title: 'Controle de Bombas',
      message: `${pumpName} foi ${newState ? 'ligada' : 'desligada'} manualmente.`,
      type: 'INFO'
    });
  };

  const handleAutoToggle = () => {
    const newState = !pumps.auto;
    updateIotState({ pumps: { auto: newState } as any });
    toast.success(`Modo automatizado das bombas ${newState ? 'ativado' : 'desativado'}`);
  };

  const handleGateOpen = () => {
    toast.success('Comando enviado: Abrindo Portão Principal...');
    addNotification({
      title: 'Controle de Acesso',
      message: 'Abertura remota do Portão Principal acionada.',
      type: 'WARNING'
    });
  };

  const handleAlarmToggle = () => {
    const newState = !alarmActive;
    updateIotState({ alarmActive: newState });
    
    if (newState) {
      toast.success('Alarme Geral ATIVADO com sucesso');
      addNotification({
        title: 'Segurança',
        message: 'Sistema de alarme geral foi ativado.',
        type: 'SUCCESS'
      });
    } else {
      toast.error('Alarme Geral DESATIVADO');
      addNotification({
        title: 'Segurança',
        message: 'Atenção: Sistema de alarme geral foi desativado.',
        type: 'ERROR'
      });
    }
  };

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'visao-geral') {
      const element = document.getElementById(`section-${tabId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!selectedBuilding) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4 md:p-8 font-sans -m-8"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
      >
        <div className="absolute inset-0 bg-[#0a192f]/80 backdrop-blur-xl" />
        <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-12 justify-center">
            <BackButton />
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              <Home className="w-7 h-7 text-yellow-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-light tracking-wide text-center text-white">
              <span className="font-bold text-yellow-500">HOME IOT</span> Seleção
            </h1>
          </div>
          
          <h2 className="text-xl font-light text-center mb-8 text-white/80">Selecione o Prédio para Gerenciar Automações</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buildings.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBuilding(b.id)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 group shadow-lg"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:bg-yellow-500/20 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  <Building className="w-8 h-8 text-white/50 group-hover:text-yellow-400 transition-colors" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">{b.name}</h3>
                  <p className="text-sm text-white/50">{b.units} unidades conectadas</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const buildingName = buildings.find(b => b.id === selectedBuilding)?.name;

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4 md:p-8 font-sans -m-8"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
    >
      {/* Heavy blur overlay for the background */}
      <div className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-xl" />
      
      {/* Main Dashboard Container - Plastic Transparent Frosted Glass */}
      <div className="relative z-10 w-full max-w-[1400px] bg-gradient-to-br from-[#1a2b4c]/90 to-[#0f172a]/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 md:p-8 flex flex-col gap-6 overflow-hidden">
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] pointer-events-none" />

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div title="Voltar para seleção de prédio">
              <BackButton onClick={() => setSelectedBuilding(null)} />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Home className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                <Droplets className="w-5 h-5 text-blue-400 absolute bottom-0 left-0 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                <Lightbulb className="w-5 h-5 text-yellow-300 absolute bottom-0 right-0 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 tracking-wide drop-shadow-md">
                  HOME IOT - {buildingName?.toUpperCase()}
                </h1>
                <p className="text-white/80 text-sm md:text-base">Olá, Maria! Tudo sob controle.</p>
                <p className="text-white/50 text-xs font-mono mt-1">
                  {format(time, "dd/MMM/yyyy - hh:mm a", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center gap-6 text-white/60 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar">
            {[
              { icon: Home, label: 'Visão Geral', path: '/' },
              { icon: Droplets, label: 'Cisternas', path: '/consumption' },
              { icon: Lightbulb, label: 'Iluminação', path: '/energy' },
              { icon: ShieldCheck, label: 'Segurança', path: '/visitors' },
              { icon: Settings, label: 'Configurações', path: '/settings' },
            ].map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 transition-colors hover:text-white min-w-[70px] ${location.pathname === item.path ? 'text-white' : ''}`}
              >
                <item.icon className={`w-6 h-6 ${location.pathname === item.path ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
                <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* 3 Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          
          {/* Column 1: Energia */}
          <div id="section-energia" className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col shadow-lg backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Gerenciamento de Energia</h2>
            <p className="text-sm font-bold text-white/80 mb-4">CONSUMO TOTAL IOT: 75%</p>
            
            <CircularProgress value={75} />

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
                CONSUMO TOTAL IOT: 75%
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                CISTERNAS: 40%
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.8)]" />
                ILUMINAÇÃO: 20%
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                SEGURANÇA: 15%
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/50">300</span>
                <span className="text-xs font-bold text-white/80">DEMANDA (W)</span>
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataDemanda} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Column 2: Cisternas */}
          <div id="section-cisternas" className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col shadow-lg backdrop-blur-md relative">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Cisternas e Bombas</h2>
              <button className="text-white/40 hover:text-white">•••</button>
            </div>

            <div className="flex-1 flex items-center justify-center gap-8 relative">
              {/* Left Tube */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-white/80 uppercase mb-2 text-center w-20 leading-tight">Nível Caixa D'água: 85%</span>
                <VerticalTube value={85} height="h-56" />
              </div>

              {/* Center House SVG */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                  {/* House Base */}
                  <path d="M20,100 L100,30 L180,100 L180,180 L20,180 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="4" />
                  {/* Roof */}
                  <path d="M10,100 L100,20 L190,100" fill="none" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Window */}
                  <circle cx="100" cy="80" r="20" fill="#f8fafc" stroke="#94a3b8" strokeWidth="4" />
                  <line x1="100" y1="60" x2="100" y2="100" stroke="#94a3b8" strokeWidth="4" />
                  <line x1="80" y1="80" x2="120" y2="80" stroke="#94a3b8" strokeWidth="4" />
                  {/* Tanks */}
                  <rect x="40" y="120" width="40" height="50" rx="4" fill="#3b82f6" opacity="0.8" />
                  <rect x="120" y="140" width="30" height="30" rx="4" fill="#ffffff" opacity="0.8" />
                  {/* Pipes */}
                  <path d="M80,145 L100,145 L100,155 L120,155" fill="none" stroke="#94a3b8" strokeWidth="4" />
                </svg>
              </div>

              {/* Right Tube */}
              <div className="flex flex-col items-center mt-20">
                <span className="text-[10px] font-bold text-white/80 uppercase mb-2 text-center w-20 leading-tight">Nível Cisterna Jardim: 90%</span>
                <VerticalTube value={90} height="h-40" />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-6 flex flex-col xl:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`w-3 h-6 rounded-sm ${i <= 4 ? 'bg-zinc-200' : 'bg-white/20'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-white/80 uppercase">Capacidade: 72% | 12.000 L</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 w-full">
                <h3 className="text-[10px] font-bold text-white uppercase mb-3">Controle de Bombas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/80">Bomba Caixa D'água</span>
                    <Toggle checked={pumps.caixa} onChange={() => handlePumpToggle('caixa')} label="ON" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/80">Bomba Jardim</span>
                    <Toggle checked={pumps.jardim} onChange={() => handlePumpToggle('jardim')} label="ON" />
                  </div>
                  <div className="flex items-center gap-2 pt-2 cursor-pointer" onClick={handleAutoToggle}>
                    <input 
                      type="checkbox" 
                      checked={pumps.auto}
                      onChange={() => {}} // Handled by parent div
                      className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 pointer-events-none"
                    />
                    <span className="text-xs text-white/80">AUTOMATIZADO</span>
                  </div>
                  <div className="pt-2 text-center">
                    <p className="text-[10px] text-white/50 uppercase">Próximo ciclo de reuso</p>
                    <p className="text-sm font-bold text-white">16h00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Iluminação & Segurança */}
          <div className="flex flex-col gap-6">
            {/* Iluminação */}
            <div id="section-iluminacao" className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Iluminação</h2>
                <div className="flex gap-2 text-white/40">
                  <Lightbulb className="w-4 h-4" />
                  <Grid className="w-4 h-4" />
                  <Menu className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Lightbulb className={`w-5 h-5 ${lights.cozinha > 0 ? 'text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]' : 'text-white/60'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-white uppercase">Cozinha</span>
                      <span className="text-[10px] text-white/60">{lights.cozinha}%</span>
                    </div>
                    <Slider value={lights.cozinha} onChange={(v) => handleLightChange('cozinha', v)} />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Home className={`w-5 h-5 ${lights.sala > 0 ? 'text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.8)]' : 'text-white/60'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-white uppercase">Sala</span>
                      <span className="text-[10px] text-white/60">{lights.sala}%</span>
                    </div>
                    <Slider value={lights.sala} onChange={(v) => handleLightChange('sala', v)} color="from-cyan-400 to-teal-400" />
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-5 h-5" /> {/* Spacer */}
                  <div className="flex-1 flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={handleToggleAllLights}>
                    <Toggle checked={lights.todas} onChange={handleToggleAllLights} />
                    <span className="text-xs font-bold text-white uppercase">Ligar Todas</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Droplets className={`w-5 h-5 ${lights.jardim > 0 ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'text-white/60'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-white uppercase">Jardim</span>
                      <span className="text-[10px] text-white/60">{lights.jardim}%</span>
                    </div>
                    <Slider value={lights.jardim} onChange={(v) => handleLightChange('jardim', v)} color="from-zinc-400 to-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Acesso e Segurança */}
            <div id="section-seguranca" className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg backdrop-blur-md flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Acesso e Segurança</h2>
                <div className="flex gap-2 text-white/40">
                  <Grid className="w-4 h-4" />
                  <Menu className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-xs font-bold text-white/80 uppercase mb-4">Botões de Ação</h3>
              
              <div className="space-y-3 flex-1">
                <button 
                  onClick={handleGateOpen}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] shadow-inner group"
                >
                  <DoorOpen className="w-6 h-6 text-white/80 group-hover:text-white" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-white">Abrir Portão Principal</span>
                </button>
                
                <button 
                  onClick={handleAlarmToggle}
                  className={`w-full border rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] shadow-inner group ${
                    alarmActive 
                      ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30' 
                      : 'bg-white/5 hover:bg-white/10 border-white/20'
                  }`}
                >
                  <ShieldCheck className={`w-6 h-6 ${alarmActive ? 'text-red-400' : 'text-white/80 group-hover:text-white'}`} />
                  <span className={`text-sm font-bold uppercase tracking-wider ${alarmActive ? 'text-red-400' : 'text-white group-hover:text-white'}`}>
                    {alarmActive ? 'Desativar Alarme Geral' : 'Acionar Alarme Geral'}
                  </span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
                <span className="text-xs font-bold text-white/60 uppercase">Status Alarme:</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${alarmActive ? 'text-white' : 'text-red-400'}`}>
                  {alarmActive ? 'Ativado' : 'Desativado'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
