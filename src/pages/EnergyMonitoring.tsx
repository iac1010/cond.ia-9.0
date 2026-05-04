import React from 'react';
import { useStore } from '../store';
import { 
  Zap, 
  Sun, 
  Eye, 
  TrendingDown, 
  DollarSign, 
  ArrowDownRight, 
  Leaf,
  Info,
  Lightbulb,
  Battery
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { toast } from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function EnergyMonitoring() {
  const navigate = useNavigate();
  const { energyData } = useStore();

  const totalSolar = energyData.reduce((acc, curr) => acc + curr.solarGeneration, 0);
  const totalSensorSavings = energyData.reduce((acc, curr) => acc + curr.sensorSavings, 0);
  const totalMoneySaved = energyData.reduce((acc, curr) => acc + (curr.costWithoutTech - curr.actualCost), 0);
  
  const latestMonth = energyData[energyData.length - 1];
  const monthlySavingsPercent = Math.round(((latestMonth.costWithoutTech - latestMonth.actualCost) / latestMonth.costWithoutTech) * 100);

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
            <h1 className="text-6xl font-light tracking-tight">Eco-Monitor</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Eficiência energética e sustentabilidade</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/10 text-white px-6 py-3 rounded-2xl font-bold border border-white/10 backdrop-blur-md shadow-xl">
          <Leaf className="w-5 h-5" />
          Selo Verde Ativo
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md"
        >
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl w-fit mb-6">
            <Sun className="w-6 h-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Geração Solar (Total)</p>
          <h3 className="text-3xl font-black text-white">{totalSolar.toLocaleString()} <span className="text-sm font-bold text-white/40">kWh</span></h3>
          <div className="mt-4 flex items-center gap-1 text-white font-bold text-sm">
            <TrendingDown className="w-4 h-4 rotate-180" />
            <span>+12% vs mês ant.</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md"
        >
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl w-fit mb-6">
            <Eye className="w-6 h-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Economia Sensores</p>
          <h3 className="text-3xl font-black text-white">{totalSensorSavings.toLocaleString()} <span className="text-sm font-bold text-white/40">kWh</span></h3>
          <div className="mt-4 flex items-center gap-1 text-white font-bold text-sm">
            <TrendingDown className="w-4 h-4" />
            <span>-8% desperdício</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white text-[#004a7c] p-8 rounded-[40px] shadow-2xl"
        >
          <div className="p-3 bg-[#004a7c]/10 text-[#004a7c] rounded-2xl w-fit mb-6">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Economia Financeira</p>
          <h3 className="text-3xl font-black">R$ {totalMoneySaved.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-1 font-bold text-sm opacity-80">
            <ArrowDownRight className="w-4 h-4" />
            <span>{monthlySavingsPercent}% de redução na conta</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md"
        >
          <div className="p-3 bg-white/10 text-white rounded-2xl w-fit mb-6">
            <Leaf className="w-6 h-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">CO2 Evitado</p>
          <h3 className="text-3xl font-black text-white">{(totalSolar * 0.5).toFixed(1)} <span className="text-sm font-bold text-white/40">kg</span></h3>
          <div className="mt-4 flex items-center gap-1 text-white font-bold text-sm">
            <span>Equiv. 42 árvores</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 relative z-10">
        {/* Cost Comparison Chart */}
        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white">Comparativo de Custos</h3>
              <p className="text-sm text-white/40 font-medium">Custo Estimado vs Custo Real (R$)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sem Tecnologia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Com Tecnologia</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0, 74, 124, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                />
                <Bar dataKey="costWithoutTech" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} name="Sem Tecnologia" />
                <Bar dataKey="actualCost" fill="#ffffff" radius={[4, 4, 0, 0]} name="Com Tecnologia" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generation vs Savings Chart */}
        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white">Geração vs Economia</h3>
              <p className="text-sm text-white/40 font-medium">Impacto em kWh por categoria</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyData}>
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSensor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0, 74, 124, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                />
                <Area type="monotone" dataKey="solarGeneration" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSolar)" name="Geração Solar" strokeWidth={3} />
                <Area type="monotone" dataKey="sensorSavings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSensor)" name="Economia Sensores" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white uppercase tracking-wider text-sm">Dica de Eficiência</h4>
          </div>
          <p className="text-white/60 font-medium leading-relaxed">
            A limpeza dos painéis solares está agendada para o próximo mês. Isso pode aumentar a eficiência em até 15%.
          </p>
          <button 
            onClick={() => {
              toast.success('Cronograma de manutenção visualizado');
              navigate('/intelligent-checklist');
            }}
            className="mt-auto text-white font-bold text-sm hover:underline flex items-center gap-2"
          >
            Ver Cronograma <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Battery className="w-5 h-5" />
            </div>
            <h4 className="font-black text-white uppercase tracking-wider text-sm">Status do Sistema</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white/40">Sensores de Presença</span>
              <span className="text-xs font-black text-white bg-white/10 px-2 py-1 rounded-md uppercase">100% OK</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white/40">Inversores Solares</span>
              <span className="text-xs font-black text-white bg-white/10 px-2 py-1 rounded-md uppercase">Operacional</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white/40">Baterias de Backup</span>
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-1 rounded-md uppercase">85% Carga</span>
            </div>
          </div>
        </div>

        <div className="bg-white text-[#004a7c] p-8 rounded-[40px] flex flex-col gap-6 shadow-2xl">
          <h4 className="font-black uppercase tracking-wider text-sm opacity-60">Próximo Passo</h4>
          <p className="font-medium leading-relaxed">
            A implementação de sensores de presença no Subsolo 2 está prevista para reduzir o consumo em mais 300kWh/mês.
          </p>
          <button 
            onClick={() => {
              toast.success('Expansão aprovada e agendada');
              navigate('/intelligent-checklist');
            }}
            className="mt-auto bg-[#004a7c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#003d66] transition-all active:scale-95"
          >
            Aprovar Expansão
          </button>
        </div>
      </div>
    </div>
  );
}
