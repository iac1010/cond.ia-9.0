import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Zap, Activity, Waves } from 'lucide-react';
import { ConsumptionReading, CriticalEvent } from '../types';

interface WaterManagementMirrorProps {
  readings: ConsumptionReading[];
  events: CriticalEvent[];
  className?: string;
  hideFooter?: boolean;
  isEditMode?: boolean;
}

export function WaterManagementMirror({ readings, events, className = "", hideFooter = false, isEditMode = false }: WaterManagementMirrorProps) {
  // Calculate today's water consumption
  const today = new Date().toISOString().split('T')[0];
  const todayWater = readings
    .filter(r => r.type === 'WATER' && r.date.startsWith(today))
    .reduce((acc, curr) => acc + curr.consumption, 0);

  // Get pump status
  const pumps = events.filter(e => e.type === 'PUMP');
  const allPumpsNormal = pumps.every(p => p.status === 'NORMAL');
  const hasCriticalPump = pumps.some(p => p.status === 'CRITICAL');

  // Mock water level for visualization (since it's not explicitly in the store yet)
  // In a real scenario, this would come from an IoT sensor event
  const waterLevel = 78; // 78%

  return (
    <div className={`relative bg-slate-900/40 backdrop-blur-2xl border border-white/20 p-5 rounded-[2.2rem] shadow-2xl overflow-hidden ${className}`}>
      {/* Glass Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col gap-3 relative z-10">
        {/* Water Level Indicator */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center overflow-hidden shrink-0">
            <motion.div 
              initial={{ y: 40 }}
              animate={{ y: 40 - (waterLevel * 0.4) }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute bottom-0 left-0 w-full bg-blue-400/40"
              style={{ height: '100%' }}
            >
              <Waves className="w-full h-4 text-blue-300/50 absolute -top-2 animate-pulse" />
            </motion.div>
            <Droplets className="w-6 h-6 text-blue-400 relative z-10" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Nível Reservatório</span>
              <span className="text-sm font-black text-blue-400">{waterLevel}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${waterLevel}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-white/40">
              <Activity className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-wider">Consumo Hoje</span>
            </div>
            <span className="text-sm font-black text-white">{todayWater.toLocaleString('pt-BR')} <span className="text-[10px] font-normal opacity-50">m³</span></span>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-white/40">
              <Zap className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-wider">Status Bombas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasCriticalPump ? 'bg-red-500' : allPumpsNormal ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-[10px] font-bold uppercase ${hasCriticalPump ? 'text-red-400' : allPumpsNormal ? 'text-emerald-400' : 'text-amber-400'}`}>
                {hasCriticalPump ? 'Crítico' : allPumpsNormal ? 'Normal' : 'Alerta'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {!hideFooter && (
        <div className="mt-4 flex items-center gap-2.5 px-1 relative z-10">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping absolute inset-0" />
            <div className="w-2 h-2 rounded-full bg-blue-400 relative" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Gestão Hídrica Smart</span>
        </div>
      )}
    </div>
  );
}
