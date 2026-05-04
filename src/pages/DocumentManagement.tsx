import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, Calendar, Bell, Play, Eye, 
  Power, ArrowLeft, MoreHorizontal, User,
  Home, Box, Lightbulb, Shield, Settings,
  ChevronRight, Search, Filter, Download,
  Share2, Trash2, Plus, FileSignature,
  Activity, Zap, Cpu, FilePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'react-hot-toast';
import { GlassCard, CircularProgress } from '../components/GlassUI';
import { useStore } from '../store';

const lineData = [
  { name: 'Seg', value: 100 },
  { name: 'Ter', value: 250 },
  { name: 'Qua', value: 180 },
  { name: 'Qui', value: 380 },
  { name: 'Sex', value: 300 },
  { name: 'Sab', value: 450 },
  { name: 'Dom', value: 320 },
];

const barData = [
  { name: 'CONTRATOS', value: 98, color: '#3b82f6' },
  { name: 'AVISOS', value: 92, color: '#f59e0b' },
  { name: 'ORDENS DE SERVIÇO', value: 94, color: '#ffffff' },
];

export default function DocumentManagement() {
  const navigate = useNavigate();
  const { digitalFolder, addNotification, addDigitalFolderItem, clients, documentTemplates } = useStore();
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isSinalActive, setIsSinalActive] = useState(true);
  const [isValidationActive, setIsValidationActive] = useState(false);
  const [isStatusActive, setIsStatusActive] = useState(true);

  const handleAction = (action: string) => {
    if (action === 'Iniciar Assinatura Principal') {
      if (documentTemplates.length === 0) {
        toast.error('Crie um modelo de documento primeiro no Document Factory');
        navigate('/document-factory');
        return;
      }
      
      const template = documentTemplates[0];
      const client = clients[0];
      
      addDigitalFolderItem({
        clientId: client?.id || 'system',
        title: `Assinatura: ${template.title}`,
        description: `Processo de assinatura iniciado para ${client?.name || 'Cliente Geral'}`,
        category: template.category,
        fileUrl: template.fileUrl || '',
        date: new Date().toISOString(),
      });
      
      toast.success(`Processo "${template.title}" iniciado!`);
      addNotification({
        title: 'Novo Processo de Assinatura',
        message: `O documento "${template.title}" foi enviado para assinatura.`,
        type: 'SUCCESS'
      });
    } else if (action === 'Visualizar Documentos Gerais') {
      toast('Abrindo central de documentos...');
    } else {
      toast.success(`Ação executada: ${action}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-20"
          alt="Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem]">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="p-4 hover:bg-white/5 rounded-2xl transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-white/70 group-hover:text-white" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSignature className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Home IOT - Automação Residencial</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter">Olá, Maria! Tudo sob controle.</h1>
              <p className="text-xs text-white/40 font-medium">Sábado, 26 de Março, 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                <img src="https://i.pravatar.cc/150?u=carlos" alt="Carlos" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-bold">Olá, Carlos!</span>
            </div>
            
            <nav className="flex items-center gap-4">
              {[
                { icon: Home, label: 'Visão Geral', active: true, path: '/' },
                { icon: Box, label: 'Cisternas', path: '/cisterns' },
                { icon: Lightbulb, label: 'Iluminação', path: '/lighting' },
                { icon: Shield, label: 'Segurança', path: '/security' },
                { icon: Settings, label: 'Configurações', path: '/settings' }
              ].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => item.path && navigate(item.path)}
                  className={`flex flex-col items-center gap-1 p-2 transition-all ${item.active ? 'text-white' : 'text-white/40 hover:text-white'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            <GlassCard title="SITUAÇÃO GERAL DE DOCUMENTOS" subtitle="TOTAL DE DOCUMENTOS: 75%">
              <div className="flex flex-col items-center py-4">
                <div className="relative">
                  <CircularProgress 
                    value={75} 
                    size={160} 
                    strokeWidth={12} 
                    color="text-white"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black">75%</span>
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Processados</span>
                  </div>
                </div>
                
                <div className="mt-8 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">Processados</span>
                    </div>
                    <span className="text-xs font-bold">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">Em Processamento</span>
                    </div>
                    <span className="text-xs font-bold">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">Pendentes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">10%</span>
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="DOCUMENTOS POR TIPO (% PROCESSADO)">
              <div className="space-y-6 py-2">
                {barData.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      <span>{item.name}</span>
                      <span className="text-white">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: idx * 0.2 }}
                        className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] pt-2">
                  <span>0</span>
                  <span>40</span>
                  <span>80</span>
                  <span>120</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Middle Column */}
          <div className="lg:col-span-6 space-y-6">
            <GlassCard 
              title="VISÃO DETALHADA E FLUXOS" 
              subtitle="TMD TOTAL (Tempo Médio de Assinatura)"
              action={<button onClick={() => toast('Opções de visualização')}><MoreHorizontal className="w-4 h-4 text-white/40" /></button>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#ffffff" 
                        strokeWidth={3}
                        dot={{ fill: '#ffffff', strokeWidth: 2, r: 4, stroke: '#000' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">Processados</span>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black">98%</span>
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest text-center max-w-[80px]">Assinaturas Rápidas & Validações</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-[10px] font-bold text-white uppercase">TMD Total: 98%</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[8px] font-bold text-amber-500 uppercase">Alertas Críticos: R$ 4.500 (1 OS em atraso)</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard title="PRÓXIMOS CICLOS DE ASSINATURA">
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-6xl font-black tracking-tighter text-white mb-4">16h00</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-[10px] font-bold text-white uppercase">TMD Total: 98%</span>
                    </div>
                </div>
              </GlassCard>

              <GlassCard title="CONTROLE DE FLUXO">
                <div className="space-y-6 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Assinatura Sinal</div>
                      <div className="text-[8px] text-white/30 uppercase mt-0.5">Fluxo Principal</div>
                    </div>
                    <button 
                      onClick={() => setIsSinalActive(!isSinalActive)}
                      className={`w-12 h-6 rounded-full relative transition-all ${isSinalActive ? 'bg-white' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: isSinalActive ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-black rounded-full shadow-lg"
                      />
                      <span className={`absolute ${isSinalActive ? 'left-2' : 'right-2'} top-1.5 text-[6px] font-black text-black`}>
                        {isSinalActive ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Validação Técnica</div>
                      <div className="text-[8px] text-white/30 uppercase mt-0.5">Fluxo de Engenharia</div>
                    </div>
                    <button 
                      onClick={() => setIsValidationActive(!isValidationActive)}
                      className={`w-12 h-6 rounded-full relative transition-all ${isValidationActive ? 'bg-white' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: isValidationActive ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-black rounded-full shadow-lg"
                      />
                      <span className={`absolute ${isValidationActive ? 'left-2' : 'right-2'} top-1.5 text-[6px] font-black text-black`}>
                        {isValidationActive ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-6">
            <GlassCard 
              title="AGENDA DE ASSINATURAS (SEMANAL)"
              action={<button onClick={() => toast('Filtros de agenda')}><Filter className="w-4 h-4 text-white/40" /></button>}
            >
              <div className="space-y-2">
                <div className="grid grid-cols-5 text-[8px] font-black text-white/20 uppercase tracking-widest pb-2">
                  <span className="col-span-1">Dia</span>
                  <span className="col-span-3">Descrição</span>
                  <span className="col-span-1 text-right">Status</span>
                </div>
                {digitalFolder.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Nenhuma assinatura agendada</p>
                  </div>
                ) : (
                  digitalFolder.slice(0, 6).map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-5 items-center p-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                      <span className="col-span-1 text-[10px] font-bold text-white/40">{new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className="col-span-3 text-[10px] font-bold text-white/80 truncate">{item.title}</span>
                      <div className="col-span-1 flex justify-end">
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${item.status === 'VALIDATED' ? 'bg-white/10 text-white' : 'bg-amber-500/10 text-amber-400'}`}>
                          {item.status === 'VALIDATED' ? 'Conc.' : 'Pend.'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard title="NOTIFICAÇÕES DE ASSINATURA & ALERTAS">
              <div className="space-y-4">
                {[
                  { icon: AlertTriangle, title: 'Alerta: Vencimento de Assinatura (Filtro A)', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { icon: AlertTriangle, title: 'Alerta: Temperatura Elevada Bomba 2', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { icon: FileText, title: 'Notificação: Entrega de Material de Limpeza (23/03)', color: 'text-white', bg: 'bg-white/10' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 group cursor-pointer">
                    <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-white/60 leading-tight group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2">Botoes de Ação</h3>
              
              <button 
                onClick={() => handleAction('Iniciar Assinatura Principal')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all group"
              >
                <div className="p-2 bg-white/10 text-white rounded-xl group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Iniciar Assinatura Principal</span>
              </button>

              <button 
                onClick={() => handleAction('Visualizar Documentos Gerais')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all group"
              >
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Visualizar Documentos Gerais</span>
              </button>

              <button 
                onClick={() => setIsStatusActive(!isStatusActive)}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${isStatusActive ? 'bg-white/10 text-white' : 'bg-rose-500/10 text-rose-400'}`}>
                  <Power className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Status Assinatura</span>
                  <span className={`text-[8px] font-bold uppercase ${isStatusActive ? 'text-white' : 'text-rose-400'}`}>
                    {isStatusActive ? 'Ativado' : 'Desativado'}
                  </span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/document-factory')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all group"
              >
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                  <FilePlus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">Document Factory</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
