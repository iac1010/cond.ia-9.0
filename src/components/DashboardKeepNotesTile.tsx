import { useState, useEffect, useMemo } from 'react';
import { 
  Pin, Trash2, Palette, Search, Plus, X, Edit2, 
  Sparkles, StickyNote, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface KeepNote {
  id: string;
  title: string;
  content: string;
  colorId: string;
  isPinned: boolean;
  createdAt: string;
}

export function DashboardKeepNotesTile({ 
  onNavigate, 
  isEditMode 
}: { 
  onNavigate: () => void;
  isEditMode: boolean;
}) {
  const keepColors = useMemo(() => [
    { id: 'default', name: 'Original', bg: 'bg-zinc-900 border-white/10 text-white', dot: 'bg-zinc-700 border-white/20', accentLine: 'bg-white/10' },
    { id: 'red', name: 'Vermelho', bg: 'bg-red-950/25 border-red-500/30 text-red-100', dot: 'bg-red-500', accentLine: 'bg-red-500' },
    { id: 'orange', name: 'Laranja', bg: 'bg-orange-950/25 border-orange-500/30 text-orange-100', dot: 'bg-orange-500', accentLine: 'bg-orange-500' },
    { id: 'yellow', name: 'Amarelo', bg: 'bg-amber-950/25 border-amber-500/30 text-amber-100', dot: 'bg-amber-500', accentLine: 'bg-amber-500' },
    { id: 'green', name: 'Verde', bg: 'bg-emerald-950/25 border-emerald-500/30 text-emerald-100', dot: 'bg-[#39FF14]', accentLine: 'bg-[#39FF14]' },
    { id: 'blue', name: 'Azul', bg: 'bg-blue-950/25 border-blue-500/30 text-blue-100', dot: 'bg-blue-500', accentLine: 'bg-blue-500' },
    { id: 'purple', name: 'Roxo', bg: 'bg-purple-950/25 border-purple-500/30 text-purple-100', dot: 'bg-purple-500', accentLine: 'bg-purple-500' },
    { id: 'pink', name: 'Rosa', bg: 'bg-pink-950/25 border-pink-500/30 text-pink-100', dot: 'bg-pink-500', accentLine: 'bg-pink-500' },
  ], []);

  // Shared localStorage state with ExecutionCenter
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>(() => {
    const saved = localStorage.getItem('execution_keep_notes');
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
        title: '⚠️ Manutenção Corretiva Agendada',
        content: 'Lembrar de falar com o zelador sobre as peças de reposição da bomba d\'água principal. O distribuidor prometeu entregar até as 14h.',
        colorId: 'orange',
        isPinned: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '📋 Check-out de Ferramentas',
        content: 'Passar na recepção para devolver a chave do quadro geral de disjuntores da torre bloco B antes de encerrar o turno de trabalho.',
        colorId: 'blue',
        isPinned: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: '💡 Ideia de Melhoria',
        content: 'Automatizar o controle de níveis dos reservatórios superiores com sensores IoT de ultrassom. Sugerir no relatório trimestral para o síndico.',
        colorId: 'green',
        isPinned: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  
  // Note formulation states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColorId, setNewColorId] = useState('default');
  const [newIsPinned, setNewIsPinned] = useState(false);

  // Edit states
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColorId, setEditColorId] = useState('default');
  const [editIsPinned, setEditIsPinned] = useState(false);

  // Listen to external edits or update localStorage
  useEffect(() => {
    localStorage.setItem('execution_keep_notes', JSON.stringify(keepNotes));
    
    // Dispatch local custom event in case multiple open components exist
    window.dispatchEvent(new Event('keep_notes_changed'));
  }, [keepNotes]);

  // Keep localStorage responsive to window focuses or other tab triggers
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('execution_keep_notes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed) !== JSON.stringify(keepNotes)) {
            setKeepNotes(parsed);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('keep_notes_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('keep_notes_changed', handleStorageChange);
    };
  }, [keepNotes]);

  const handleSaveNote = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsExpanding(false);
      return;
    }
    const newNote: KeepNote = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      colorId: newColorId,
      isPinned: newIsPinned,
      createdAt: new Date().toISOString()
    };
    setKeepNotes(prev => [newNote, ...prev]);
    setNewTitle('');
    setNewContent('');
    setNewColorId('default');
    setNewIsPinned(false);
    setIsExpanding(false);
    toast.success('Nota operacional adicionada com sucesso!');
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Nota removida');
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const handleChangeNoteColor = (id: string, colorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeepNotes(prev => prev.map(n => n.id === id ? { ...n, colorId } : n));
  };

  const handleOpenEdit = (note: KeepNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColorId(note.colorId);
    setEditIsPinned(note.isPinned);
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;
    setKeepNotes(prev => prev.map(n => n.id === editingNote.id ? {
      ...n,
      title: editTitle.trim(),
      content: editContent.trim(),
      colorId: editColorId,
      isPinned: editIsPinned
    } : n));
    setEditingNote(null);
    toast.success('Nota atualizada!');
  };

  const filteredNotes = useMemo(() => {
    return keepNotes.filter(n => {
      const term = searchTerm.toLowerCase();
      return n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term);
    });
  }, [keepNotes, searchTerm]);

  const pinnedNotes = useMemo(() => {
    return filteredNotes.filter(n => n.isPinned);
  }, [filteredNotes]);

  const otherNotes = useMemo(() => {
    return filteredNotes.filter(n => !n.isPinned);
  }, [filteredNotes]);

  return (
    <div className="w-full h-full text-white bg-zinc-950/80 p-5 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-white/2 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#39FF14]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-4 relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-[#39FF14]/10 rounded-xl border border-[#39FF14]/30">
            <StickyNote className="w-4 h-4 text-[#39FF14]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[11px] font-black uppercase text-white/95 tracking-wider truncate flex items-center gap-1.5">
              Notas Keep
              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping shrink-0" />
            </h3>
            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Turno & Operação</p>
          </div>
        </div>

        {/* Shortcuts or navigation */}
        {!isEditMode && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="p-1.5 hover:p-2 bg-white/5 hover:bg-[#39FF14]/10 border border-white/10 hover:border-[#39FF14]/30 rounded-xl text-white/50 hover:text-[#39FF14] transition-all flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider shrink-0 shadow-lg"
            title="Acessar Central de Execução"
          >
            <span>Central</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Note search row */}
      <div className="relative mb-3.5 relative z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar notas operacionais..."
          className="w-full bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 focus:border-[#39FF14]/30 rounded-xl pl-8.5 pr-8 py-1.5 text-[10.5px] text-white placeholder-white/30 outline-none transition-all font-semibold"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="w-4 h-4 text-white/40 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Embedded Creator Box */}
      <div className="mb-4 relative z-20 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#39FF14]/35 transition-all">
          {!isExpanding ? (
            <div 
              onClick={() => setIsExpanding(true)}
              className="px-4 py-2.5 flex items-center justify-between text-white/40 hover:text-white/60 cursor-pointer select-none text-xs font-semibold"
            >
              <span>Fazer anotação rápida...</span>
              <Plus className="w-3.5 h-3.5 text-[#39FF14]" />
            </div>
          ) : (
            <div className="p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <input 
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título"
                  className="w-full bg-transparent font-bold text-white text-[12.5px] outline-none placeholder-white/30 p-0 border-none focus:ring-0"
                />
                <button 
                  onClick={() => setNewIsPinned(!newIsPinned)}
                  className={`p-1 rounded transition-all ${newIsPinned ? 'text-[#39FF14]' : 'text-white/30 hover:text-white'}`}
                  title="Fixar nota"
                >
                  <Pin className="w-3.5 h-3.5" fill={newIsPinned ? "currentColor" : "none"} />
                </button>
              </div>

              <textarea 
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Anotar..."
                rows={2}
                className="w-full bg-transparent text-xs text-white/80 outline-none placeholder-white/30 resize-none p-0 border-none focus:ring-0"
              />

              {/* Color dots row and action buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1">
                  {keepColors.map((color) => (
                    <button 
                      key={color.id}
                      onClick={() => setNewColorId(color.id)}
                      className={`w-3.5 h-3.5 rounded-full border border-black/40 relative shrink-0 ${color.dot} ${
                        newColorId === color.id ? 'scale-110 ring-1 ring-white/50' : 'hover:scale-105'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setNewTitle('');
                      setNewContent('');
                      setNewColorId('default');
                      setNewIsPinned(false);
                      setIsExpanding(false);
                    }}
                    className="text-[9px] font-black uppercase text-white/30 hover:text-white px-2 py-1 rounded"
                  >
                    Sair
                  </button>
                  <button 
                    onClick={handleSaveNote}
                    className="text-[9px] font-black uppercase bg-[#39FF14] text-zinc-950 hover:brightness-110 px-2.5 py-1 rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inner notes list viewport with scrollability */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 relative z-10 custom-scrollbar max-h-[190px]">
        {/* Pinned section in widget */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[7.5px] font-extrabold text-[#39FF14] uppercase tracking-wider pl-1">Fixadas ({pinnedNotes.length})</span>
            <div className="grid grid-cols-1 gap-2">
              <AnimatePresence mode="popLayout">
                {pinnedNotes.map((note) => {
                  const color = keepColors.find(c => c.id === note.colorId) || keepColors[0];
                  return (
                    <motion.div 
                      key={note.id}
                      layoutId={`dash-note-${note.id}`}
                      onClick={() => handleOpenEdit(note)}
                      className={`relative rounded-xl p-3 border shadow transition-all duration-300 cursor-pointer flex flex-col justify-between group h-28 overflow-hidden ${color.bg}`}
                    >
                      <div className={`absolute top-0 left-3 right-3 h-0.5 rounded-b ${color.accentLine}`} />
                      
                      {/* Close button & Pin indicators */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button 
                          onClick={(e) => handleTogglePin(note.id, e)}
                          className="p-1 rounded bg-black/40 hover:bg-black/60 text-[#39FF14]"
                        >
                          <Pin className="w-3 h-3" fill="currentColor" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="p-1 rounded bg-black/40 hover:bg-rose-500/10 text-white/50 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1 mb-2 pr-10">
                        {note.title && <h4 className="font-bold text-xs text-white leading-tight truncate">{note.title}</h4>}
                        <p className="text-[10px] text-white/70 line-clamp-3 leading-relaxed whitespace-pre-wrap font-medium break-words">{note.content}</p>
                      </div>

                      {/* Footer Actions (mini dots) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center justify-between pt-1 border-t border-white/5 transition-opacity">
                        <span className="text-[7.5px] text-white/30 lowercase italic">clique p/ editar</span>
                        <div className="flex gap-0.5">
                          {keepColors.slice(0, 4).map((c) => (
                            <button 
                              key={c.id}
                              onClick={(e) => handleChangeNoteColor(note.id, c.id, e)}
                              className={`w-2 h-2 rounded-full border border-black/40 ${c.dot} ${note.colorId === c.id ? 'ring-1 ring-white/50 scale-110' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Other Notes in widget */}
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          {pinnedNotes.length > 0 && <span className="text-[7.5px] font-extrabold text-white/30 uppercase tracking-wider pl-1">Outras Notas</span>}
          {otherNotes.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              <AnimatePresence mode="popLayout">
                {otherNotes.map((note) => {
                  const color = keepColors.find(c => c.id === note.colorId) || keepColors[0];
                  return (
                    <motion.div 
                      key={note.id}
                      layoutId={`dash-note-${note.id}`}
                      onClick={() => handleOpenEdit(note)}
                      className={`relative rounded-xl p-3 border shadow transition-all duration-300 cursor-pointer flex flex-col justify-between group h-28 overflow-hidden ${color.bg}`}
                    >
                      <div className={`absolute top-0 left-3 right-3 h-0.5 rounded-b ${color.accentLine}`} />
                      
                      {/* Close button & Pin indicators */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button 
                          onClick={(e) => handleTogglePin(note.id, e)}
                          className="p-1 rounded bg-black/40 hover:bg-black/60 text-white/30 hover:text-[#39FF14]"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="p-1 rounded bg-black/40 hover:bg-rose-500/10 text-white/50 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1 mb-2 pr-10">
                        {note.title && <h4 className="font-bold text-xs text-white leading-tight truncate">{note.title}</h4>}
                        <p className="text-[10px] text-white/70 line-clamp-3 leading-relaxed whitespace-pre-wrap font-medium break-words">{note.content}</p>
                      </div>

                      {/* Footer Actions (mini dots) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center justify-between pt-1 border-t border-white/5 transition-opacity">
                        <span className="text-[7.5px] text-white/30 lowercase italic">clique p/ editar</span>
                        <div className="flex gap-0.5">
                          {keepColors.slice(0, 4).map((c) => (
                            <button 
                              key={c.id}
                              onClick={(e) => handleChangeNoteColor(note.id, c.id, e)}
                              className={`w-2 h-2 rounded-full border border-black/40 ${c.dot} ${note.colorId === c.id ? 'ring-1 ring-white/50 scale-110' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : pinnedNotes.length === 0 ? (
            <div className="text-center py-7 border border-dashed border-white/10 rounded-xl bg-white/2">
              <span className="text-[9px] text-white/30 uppercase block font-black tracking-widest">Nenhuma nota operacional</span>
              <span className="text-[8px] text-white/20 italic">Use o formulário acima para adicionar</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mini Edit Modal for the Dashboard View */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingNote(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-w-sm rounded-2xl p-5 border shadow-2xl flex flex-col gap-3.5 ${
                keepColors.find(c => c.id === editColorId)?.bg || keepColors[0].bg
              }`}
            >
              <button 
                onClick={() => setEditIsPinned(!editIsPinned)}
                className={`absolute top-4 right-4 p-1.5 rounded transition-all ${
                  editIsPinned ? 'text-[#39FF14] bg-[#39FF14]/10' : 'text-white/40'
                }`}
              >
                <Pin className="w-3.5 h-3.5" fill={editIsPinned ? "currentColor" : "none"} />
              </button>

              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[7.5px] font-black uppercase text-white/40 tracking-wider">Título</span>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black/25 focus:bg-black/40 border border-white/5 text-white font-bold text-xs rounded-lg px-2.5 py-1.5 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[7.5px] font-black uppercase text-white/40 tracking-wider">Conteúdo</span>
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/25 focus:bg-black/40 border border-white/5 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none resize-none transition-all"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                <div className="flex gap-1.5">
                  {keepColors.map((color) => (
                    <button 
                      key={color.id}
                      onClick={() => setEditColorId(color.id)}
                      className={`w-3.5 h-3.5 rounded-full border border-black/40 relative shrink-0 ${color.dot} ${
                        editColorId === color.id ? 'scale-110 ring-1 ring-white/50' : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2.5">
                  <button 
                    onClick={() => setEditingNote(null)}
                    className="text-[9px] font-extrabold uppercase text-white/40 hover:text-white"
                  >
                    Sair
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="text-[9px] font-black uppercase bg-[#39FF14] text-zinc-950 px-2.5 py-1 rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
