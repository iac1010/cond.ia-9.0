import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Droplets, ShieldCheck, Power, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MonitoringMirrorProps {
  className?: string;
  showLabel?: boolean;
  isEditMode?: boolean;
}

export function MonitoringMirror({ className = '', showLabel = true, isEditMode = false }: MonitoringMirrorProps) {
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);

  const handlePumpToggle = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditMode) return;
    setIsPumpOn(!isPumpOn);
    toast.success(isPumpOn ? 'Bomba de Água Desligada' : 'Bomba de Água Ligada', {
      icon: <Droplets className={isPumpOn ? 'text-slate-400' : 'text-blue-500'} />,
      style: {
        borderRadius: '1rem',
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  };

  const handleGateToggle = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditMode) return;
    setIsGateOpen(!isGateOpen);
    toast.success(isGateOpen ? 'Portão Garagem Fechado' : 'Portão Garagem Aberto', {
      icon: isGateOpen ? <Lock className="text-slate-400" /> : <Unlock className="text-white" />,
      style: {
        borderRadius: '1rem',
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  };

  return (
    <div className={`relative bg-slate-900/40 backdrop-blur-2xl border border-white/20 p-4 rounded-[2.2rem] shadow-2xl overflow-hidden ${className}`}>
      {/* Glass Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="flex gap-3 h-24 relative z-10">
        {/* Pump Button */}
        <motion.button
          whileHover={isEditMode ? {} : { scale: 1.02 }}
          whileTap={isEditMode ? {} : { scale: 0.95 }}
          onClick={handlePumpToggle}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all duration-300 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'} ${
            isPumpOn 
              ? 'bg-blue-600/30 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <div className={`p-2 rounded-xl transition-colors ${isPumpOn ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50'}`}>
            <Droplets className={`w-5 h-5 ${isPumpOn ? 'animate-pulse' : ''}`} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider ${isPumpOn ? 'text-white' : 'text-white/40'}`}>
            Bomba d'Água
          </span>
          {isPumpOn && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          )}
        </motion.button>

        {/* Gate Button */}
        <motion.button
          whileHover={isEditMode ? {} : { scale: 1.02 }}
          whileTap={isEditMode ? {} : { scale: 0.95 }}
          onClick={handleGateToggle}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all duration-300 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'} ${
            isGateOpen 
              ? 'bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <div className={`p-2 rounded-xl transition-colors ${isGateOpen ? 'bg-black text-white' : 'bg-white/10 text-white/50'}`}>
            {isGateOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider ${isGateOpen ? 'text-white' : 'text-white/40'}`}>
            Portão Garagem
          </span>
          {isGateOpen && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          )}
        </motion.button>
      </div>
      
      {showLabel && (
        <div className="mt-4 flex justify-between items-center px-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping absolute inset-0" />
              <div className="w-1.5 h-1.5 rounded-full bg-white relative" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Acionamento Rápido</span>
          </div>
          <ShieldCheck className="w-3 h-3 text-white/30" />
        </div>
      )}
    </div>
  );
}
