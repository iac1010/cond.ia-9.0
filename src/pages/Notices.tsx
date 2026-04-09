import React, { useState } from 'react';
import { useStore } from '../store';
import { Notice } from '../types';
import { 
  Megaphone, 
  Plus, 
  Filter, 
  Trash2, 
  Edit2, 
  TowerControl as Tower, 
  Home, 
  Calendar,
  AlertTriangle,
  Info,
  ShieldAlert,
  X
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function Notices() {
  const navigate = useNavigate();
  const { notices, addNotice, deleteNotice, clients } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTower, setFilterTower] = useState('');
  const [filterLine, setFilterLine] = useState('');
  
  const [newNotice, setNewNotice] = useState<Omit<Notice, 'id' | 'date'>>({
    title: '',
    content: '',
    category: 'GENERAL',
    clientId: clients[0]?.id || '',
    tower: '',
    apartmentLine: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNotice(newNotice);
    setIsModalOpen(false);
    setNewNotice({
      title: '',
      content: '',
      category: 'GENERAL',
      clientId: clients[0]?.id || '',
      tower: '',
      apartmentLine: ''
    });
  };

  const filteredNotices = notices.filter(notice => {
    const matchTower = !filterTower || notice.tower === filterTower;
    const matchLine = !filterLine || notice.apartmentLine === filterLine;
    return matchTower && matchLine;
  });

  const getCategoryIcon = (category: Notice['category']) => {
    switch (category) {
      case 'MAINTENANCE': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'SECURITY': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'EVENT': return <Calendar className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const getCategoryLabel = (category: Notice['category']) => {
    switch (category) {
      case 'MAINTENANCE': return 'Manutenção';
      case 'SECURITY': return 'Segurança';
      case 'EVENT': return 'Evento';
      default: return 'Geral';
    }
  };

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
            <h1 className="text-6xl font-light tracking-tight">Mural de Avisos</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Comunicação segmentada e eficiente para o condomínio.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all group rounded-2xl"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> 
          <span className="text-lg font-medium">Novo Aviso</span>
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[32px] mb-8 flex flex-wrap gap-4 items-center relative z-10">
        <div className="flex items-center gap-2 text-white/40 mr-4">
          <Filter className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Filtrar</span>
        </div>
        
        <select 
          value={filterTower}
          onChange={(e) => setFilterTower(e.target.value)}
          className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-white/20 text-white"
        >
          <option value="">Todas as Torres</option>
          <option value="Torre A">Torre A</option>
          <option value="Torre B">Torre B</option>
          <option value="Torre C">Torre C</option>
        </select>

        <select 
          value={filterLine}
          onChange={(e) => setFilterLine(e.target.value)}
          className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-white/20 text-white"
        >
          <option value="">Todos os Finais</option>
          <option value="Final 1">Final 1</option>
          <option value="Final 2">Final 2</option>
          <option value="Final 3">Final 3</option>
          <option value="Final 4">Final 4</option>
        </select>

        {(filterTower || filterLine) && (
          <button 
            onClick={() => { setFilterTower(''); setFilterLine(''); }}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredNotices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <Megaphone className="w-16 h-16 text-slate-200 dark:text-zinc-800 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-zinc-500 font-medium">Nenhum aviso encontrado para os filtros selecionados.</p>
            </motion.div>
          ) : (
            filteredNotices.map((notice) => (
              <motion.div
                key={notice.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-8 hover:bg-white/10 transition-all group relative overflow-hidden"
              >
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                    {getCategoryIcon(notice.category)}
                    <span className="text-xs font-black uppercase tracking-wider text-white/70">
                      {getCategoryLabel(notice.category)}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteNotice(notice.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                  {notice.title}
                </h3>
                
                <p className="text-white/60 mb-6 line-clamp-3 font-medium">
                  {notice.content}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto pt-6 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white/40">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(notice.date), "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                  
                  {notice.tower && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-md">
                      <Tower className="w-3.5 h-3.5" />
                      {notice.tower}
                    </div>
                  )}
                  
                  {notice.apartmentLine && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-md">
                      <Home className="w-3.5 h-3.5" />
                      {notice.apartmentLine}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-zinc-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">Novo Aviso</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Preencha os dados e selecione a segmentação.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Título</label>
                    <input 
                      required
                      type="text"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Ex: Manutenção de Elevadores"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</label>
                    <select 
                      value={newNotice.category}
                      onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value as Notice['category'] })}
                      className="w-full bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="GENERAL">Geral</option>
                      <option value="MAINTENANCE">Manutenção</option>
                      <option value="SECURITY">Segurança</option>
                      <option value="EVENT">Evento</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Conteúdo</label>
                  <textarea 
                    required
                    rows={4}
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Descreva o aviso detalhadamente..."
                  />
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Segmentação (Opcional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Torre</label>
                      <select 
                        value={newNotice.tower}
                        onChange={(e) => setNewNotice({ ...newNotice, tower: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="">Todas as Torres</option>
                        <option value="Torre A">Torre A</option>
                        <option value="Torre B">Torre B</option>
                        <option value="Torre C">Torre C</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Final (Linha)</label>
                      <select 
                        value={newNotice.apartmentLine}
                        onChange={(e) => setNewNotice({ ...newNotice, apartmentLine: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="">Todos os Finais</option>
                        <option value="Final 1">Final 1</option>
                        <option value="Final 2">Final 2</option>
                        <option value="Final 3">Final 3</option>
                        <option value="Final 4">Final 4</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white px-6 py-4 rounded-2xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95"
                  >
                    Publicar Aviso
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
