import { useState } from 'react';
import { 
  MessageSquare, Bell, Vote, MessageCircle, 
  Users, Send, Search, Filter, Plus,
  ChevronRight, Calendar, Clock, MapPin,
  Shield, Info, AlertTriangle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useStore } from '../store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Tab = 'NOTICES' | 'ASSEMBLIES' | 'CHAT' | 'FEEDBACK';

export default function CommunicationCenter() {
  const navigate = useNavigate();
  const { notices, assemblies, feedbacks } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('NOTICES');

  const tabs = [
    { id: 'NOTICES', label: 'Avisos', icon: Bell, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'ASSEMBLIES', label: 'Assembleias', icon: Vote, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'CHAT', label: 'Chat Comunitário', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'FEEDBACK', label: 'Ouvidoria', icon: MessageCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  const renderNotices = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {notices.slice(0, 6).map((notice, idx) => (
        <motion.div
          key={notice.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group cursor-pointer"
          onClick={() => navigate('/notices')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              notice.category === 'MAINTENANCE' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
              notice.category === 'SECURITY' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
              'text-blue-400 bg-blue-400/10 border-blue-400/20'
            }`}>
              {notice.category}
            </div>
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              {format(new Date(notice.date), "dd MMM", { locale: ptBR })}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{notice.title}</h3>
          <p className="text-sm text-white/40 line-clamp-2 mb-4">{notice.content}</p>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {notice.tower || 'Geral'}
            </div>
          </div>
        </motion.div>
      ))}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/notices')}
        className="col-span-full bg-white/5 border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all"
      >
        <Plus className="w-8 h-8 text-white/20" />
        <span className="text-sm font-bold text-white/40">Ver todos os avisos ou criar novo</span>
      </motion.button>
    </div>
  );

  const renderAssemblies = () => (
    <div className="grid grid-cols-1 gap-6">
      {assemblies.map((assembly, idx) => (
        <motion.div
          key={assembly.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer hover:border-white/20 transition-all"
          onClick={() => navigate('/assembly')}
        >
          <div className="flex items-center gap-8 flex-1">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              assembly.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 
              assembly.status === 'UPCOMING' ? 'bg-blue-500/20 text-blue-400' : 
              'bg-white/10 text-white/40'
            }`}>
              <Vote className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">{assembly.title}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  assembly.status === 'ACTIVE' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                  assembly.status === 'UPCOMING' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                  'text-white/20 border-white/10 bg-white/5'
                }`}>
                  {assembly.status === 'ACTIVE' ? 'Em Votação' : assembly.status === 'UPCOMING' ? 'Agendada' : 'Encerrada'}
                </span>
              </div>
              <p className="text-white/40 max-w-xl line-clamp-1">{assembly.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="text-right">
              <p className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-1">Data da Assembleia</p>
              <p className="text-lg font-bold">{format(new Date(assembly.date), "dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </motion.div>
      ))}
      {assemblies.length === 0 && (
        <div className="py-24 text-center">
          <Vote className="w-16 h-16 opacity-10 mx-auto mb-4" />
          <p className="text-white/40">Nenhuma assembleia ativa ou agendada.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white -m-8 p-4 sm:p-8 md:p-12 overflow-x-hidden">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <BackButton iconSize={6} className="p-4" />
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight">Central de Comunicação</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Conectando a comunidade com transparência</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/chat')}
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-8 py-4 flex items-center justify-center gap-3 rounded-xl font-bold transition-all"
          >
            <MessageSquare className="w-5 h-5" /> 
            Abrir Chat
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/feedback')}
            className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-8 py-4 flex items-center justify-center gap-3 rounded-xl font-bold transition-all"
          >
            <MessageCircle className="w-5 h-5" /> 
            Ouvidoria
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] font-bold transition-all border ${
              activeTab === tab.id 
                ? `bg-white text-black border-white` 
                : `bg-white/5 text-white/40 border-white/10 hover:bg-white/10`
            }`}
          >
            <tab.icon className={`w-8 h-8 ${activeTab === tab.id ? 'text-black' : tab.color}`} />
            <span className="text-sm uppercase tracking-widest font-black">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'NOTICES' && renderNotices()}
          {activeTab === 'ASSEMBLIES' && renderAssemblies()}
          {activeTab === 'CHAT' && (
            <div className="bg-zinc-900/50 border border-white/10 rounded-[3rem] p-12 text-center">
              <MessageSquare className="w-24 h-24 text-emerald-400/20 mx-auto mb-8" />
              <h2 className="text-4xl font-light mb-4">Chat Comunitário</h2>
              <p className="text-xl text-white/40 max-w-2xl mx-auto mb-12">
                Participe das conversas em tempo real com seus vizinhos e a administração.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/chat')}
                className="bg-emerald-500 text-black px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20"
              >
                Entrar no Chat Agora
              </motion.button>
            </div>
          )}
          {activeTab === 'FEEDBACK' && (
            <div className="bg-zinc-900/50 border border-white/10 rounded-[3rem] p-12 text-center">
              <MessageCircle className="w-24 h-24 text-amber-400/20 mx-auto mb-8" />
              <h2 className="text-4xl font-light mb-4">Ouvidoria Digital</h2>
              <p className="text-xl text-white/40 max-w-2xl mx-auto mb-12">
                Sua voz é fundamental. Envie sugestões, críticas ou elogios de forma anônima ou identificada.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/feedback')}
                className="bg-amber-500 text-black px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-500/20"
              >
                Registrar Manifestação
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
