import { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Plus, Trash2, Search, ChevronRight, Sparkles, 
  BookOpen, Calendar, HelpCircle, FileText, CheckCircle2,
  FolderPlus, Edit, Eye, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Types matched to NotionWorkspace
interface NotionBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'todo' | 'bullet' | 'code' | 'callout' | 'table' | 'quote' | 'file' | 'textbox';
  content: string;
  properties?: {
    checked?: boolean;
    language?: string;
    icon?: string;
    headers?: string[];
    rows?: string[][];
    colorTheme?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'blueprint';
    width?: number;
    height?: number;
  };
}

interface NotionPage {
  id: string;
  title: string;
  emoji: string;
  coverUrl?: string;
  blocks: NotionBlock[];
  updatedAt: string;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1500',
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=1500',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1500',
];

const PRESET_EMOJIS = ['📝', '🏠', '🔧', '📊', '💡', '⚠️', '📋', '🏢', '🚀', '🧠', '⚡', '🛠️'];

const INITIAL_PAGES_SEED: NotionPage[] = [
  {
    id: '1',
    title: 'Planejamento de Manutenção',
    emoji: '🔧',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1500',
    updatedAt: new Date().toISOString(),
    blocks: [
      { id: 'b1', type: 'h1', content: 'Planejamento Semanal de Manutenção' },
      { id: 'b2', type: 'callout', content: 'Organizar as rotinas operacionais preventivas de manutenção hidráulica e elétrica.', properties: { icon: '💡', colorTheme: 'indigo' } }
    ]
  },
  {
    id: '2',
    title: 'Ata de Alinhamento com Conselheiros',
    emoji: '📊',
    coverUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=1500',
    updatedAt: new Date().toISOString(),
    blocks: [
      { id: 'b21', type: 'h1', content: 'Ata de Reunião Extraordinária - Impermeabilização' }
    ]
  }
];

export function DashboardNotionTile({ 
  onNavigate, 
  isEditMode 
}: { 
  onNavigate: (pageId?: string) => void;
  isEditMode: boolean;
}) {
  const [pages, setPages] = useState<NotionPage[]>(() => {
    const saved = localStorage.getItem('condfy_notion_pages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PAGES_SEED;
      }
    }
    return INITIAL_PAGES_SEED;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('condfy_notion_pages', JSON.stringify(pages));
    window.dispatchEvent(new Event('notion_pages_changed'));
  }, [pages]);

  // Listen to external updates (like if edited inside Workspace page)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('condfy_notion_pages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed) !== JSON.stringify(pages)) {
            setPages(parsed);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('notion_pages_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notion_pages_changed', handleStorageChange);
    };
  }, [pages]);

  const handleCreatePage = () => {
    if (!newTitle.trim()) {
      toast.error('Insira um título para o documento.');
      return;
    }
    const newPage: NotionPage = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      emoji: selectedEmoji,
      coverUrl: PRESET_COVERS[Math.floor(Math.random() * PRESET_COVERS.length)],
      updatedAt: new Date().toISOString(),
      blocks: [
        { id: Date.now().toString() + '-1', type: 'h1', content: newTitle.trim() },
        { id: Date.now().toString() + '-2', type: 'paragraph', content: 'Documento técnico criado a partir do Painel Condfy. Comece a digitar aqui...' }
      ]
    };

    setPages(prev => [...prev, newPage]);
    setNewTitle('');
    setSelectedEmoji('📝');
    setIsExpanding(false);
    toast.success('Página inteligente criada com sucesso! 🚀');
    
    // Auto-navigate to edit
    if (!isEditMode) {
      localStorage.setItem('condfy_notion_active_page_id', newPage.id);
      onNavigate(newPage.id);
    }
  };

  const handleDeletePage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) {
      toast.error('O sistema necessita de ao menos um documento de controle ativo.');
      return;
    }
    const confirmDelete = window.confirm('Deseja excluir esta página permanentemente?');
    if (!confirmDelete) return;

    setPages(prev => prev.filter(p => p.id !== id));
    if (previewPageId === id) setPreviewPageId(null);
    toast.success('Página excluída.');
  };

  const filteredPages = useMemo(() => {
    return pages.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [pages, searchTerm]);

  // Find preview page
  const activePreviewPage = useMemo(() => {
    return pages.find(p => p.id === previewPageId) || null;
  }, [pages, previewPageId]);

  return (
    <div 
      className="w-full h-full text-white bg-zinc-950/90 p-4 md:p-5 rounded-[2.5rem] border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl group/notion-tile"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-white/5 pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full mix-blend-screen pointer-events-none animate-pulse" />

      {/* Header Area */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/15 rounded-2xl border border-indigo-500/30 group-hover/notion-tile:scale-105 transition-transform duration-500">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Wiki & Notas Notion
              </h3>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping shrink-0" />
            </div>
            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Documentos & Rotinas</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full">
            {pages.length} docs
          </span>
          {!isEditMode && (
            <button
              onClick={() => onNavigate()}
              className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
              title="Ir para o Workspace completo"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Content Zone */}
      <div className="flex-1 flex flex-col justify-between min-h-0 relative z-10">
        {/* Quick Search */}
        <div className="relative mb-2.5 shrink-0">
          <Search className="w-3 h-3 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar páginas ou procedimentos..."
            className="w-full bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 focus:border-indigo-500/35 rounded-xl pl-8 pr-8 py-1.5 text-[10px] text-white placeholder-white/30 outline-none transition-all font-semibold"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="w-4 h-4 text-white/40 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              ×
            </button>
          )}
        </div>

        {/* Embedded Document Creator (Drop-down drawer or Accordion style) */}
        <div className="mb-2.5 shrink-0">
          <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/30 transition-all">
            {!isExpanding ? (
              <div 
                onClick={() => setIsExpanding(true)}
                className="px-3.5 py-2 flex items-center justify-between text-white/50 hover:text-white/80 cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider"
              >
                <span className="flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                  Criar Documento Rápido
                </span>
                <Plus className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              </div>
            ) : (
              <div className="p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  {/* Emoji selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl text-sm transition-all"
                      title="Selecionar Emoji"
                    >
                      {selectedEmoji}
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute left-0 top-10 z-50 bg-zinc-900 border border-white/10 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1 w-32">
                        {PRESET_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setSelectedEmoji(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-center p-1 hover:bg-white/10 rounded transition-all text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input 
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Título da ata, rotina ou wiki..."
                    className="flex-1 bg-zinc-800/60 focus:bg-zinc-800 border border-white/5 text-white font-bold text-xs rounded-xl px-2.5 py-1.5 outline-none transition-all placeholder-white/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setNewTitle('');
                      setSelectedEmoji('📝');
                      setIsExpanding(false);
                      setShowEmojiPicker(false);
                    }}
                    className="text-[8px] font-black uppercase text-white/40 hover:text-white px-2 py-1 rounded"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreatePage}
                    className="text-[8px] font-black uppercase bg-indigo-500 text-white hover:bg-indigo-600 px-3 py-1 rounded-xl shadow-lg transition-all"
                  >
                    Criar & Abrir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List of Pages and Dynamic Block Preview side-by-side or collapsible */}
        <div className="flex-1 flex flex-col min-h-0 justify-end">
          {/* Section Divider / Tab title */}
          <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mb-1.5 shrink-0">
            <span className="text-[7.5px] font-black uppercase tracking-wider text-white/35">
              {activePreviewPage ? `Visualizando: ${activePreviewPage.title}` : 'Suas Páginas Ativas'}
            </span>
            {activePreviewPage && (
              <button
                onClick={() => setPreviewPageId(null)}
                className="text-[7.5px] font-black uppercase text-indigo-400 hover:text-indigo-300"
              >
                Voltar à Lista
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[90px] scrollbar-thin">
            <AnimatePresence mode="wait">
              {activePreviewPage ? (
                /* Miniature Block Preview mode */
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-1.5 text-left p-2 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
                    <span className="text-[9px] font-bold text-white/80 flex items-center gap-1">
                      <span>{activePreviewPage.emoji}</span>
                      <span className="truncate max-w-[120px]">{activePreviewPage.title}</span>
                    </span>
                    <button
                      onClick={() => {
                        if (!isEditMode) {
                          localStorage.setItem('condfy_notion_active_page_id', activePreviewPage.id);
                          onNavigate(activePreviewPage.id);
                        }
                      }}
                      className="text-[7px] font-black text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-0.5"
                    >
                      <Edit className="w-2 h-2" /> Editar completo
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[45px] overflow-y-auto scrollbar-thin">
                    {activePreviewPage.blocks.slice(0, 3).map((block, idx) => (
                      <p key={block.id || idx} className="text-[8px] text-white/50 truncate font-medium pl-1 border-l border-white/10 leading-relaxed">
                        {block.content || <span className="italic text-white/20">Bloco sem conteúdo</span>}
                      </p>
                    ))}
                    {activePreviewPage.blocks.length > 3 && (
                      <span className="text-[7px] text-white/30 block italic pl-1">
                        + {activePreviewPage.blocks.length - 3} blocos estruturados
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Normal Pages List mode */
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  {filteredPages.length > 0 ? (
                    filteredPages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/5 transition-all group/item"
                      >
                        <div 
                          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            if (!isEditMode) {
                              localStorage.setItem('condfy_notion_active_page_id', page.id);
                              onNavigate(page.id);
                            }
                          }}
                        >
                          <span className="text-xs shrink-0 select-none">{page.emoji}</span>
                          <div className="text-left min-w-0">
                            <h4 className="text-[9px] font-black uppercase text-white/90 group-hover/item:text-indigo-300 transition-colors truncate">
                              {page.title}
                            </h4>
                            <p className="text-[7px] text-white/30 font-medium font-mono leading-none mt-0.5">
                              {page.blocks.length} blocos • {new Date(page.updatedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                            </p>
                          </div>
                        </div>

                        {/* Interactive mini controls */}
                        <div className="flex items-center gap-1.5 shrink-0 pl-1">
                          <button
                            onClick={() => setPreviewPageId(page.id)}
                            className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-indigo-300 transition-colors"
                            title="Visualizar estrutura do documento"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePage(page.id, e)}
                            className="p-1 hover:bg-rose-500/10 rounded-lg text-white/20 hover:text-rose-400 transition-colors"
                            title="Excluir documento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-3 border border-dashed border-white/5 rounded-2xl bg-white/2 text-center select-none flex flex-col items-center justify-center">
                      <FileText className="w-4 h-4 text-white/10 mb-1" />
                      <span className="text-[8px] text-white/30 uppercase font-black tracking-wider">Nenhuma página encontrada</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Area with Action Link */}
        <div className="flex items-center justify-between relative z-10 pt-2.5 mt-2 border-t border-white/5 shrink-0">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Documento Inteligente</span>
          <button 
            onClick={() => !isEditMode && onNavigate()}
            className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider group-hover/notion-tile:translate-x-0.5 transition-all"
          >
            <span>Acessar Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
