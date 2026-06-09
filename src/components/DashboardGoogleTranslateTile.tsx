import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Languages, Copy, Check, Trash2, Volume2, ArrowLeftRight, 
  Sparkles, CornerDownRight, RefreshCw, Clock, Keyboard, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface TranslateHistory {
  id: string;
  sourceText: string;
  translatedText: string;
  sl: string;
  tl: string;
  createdAt: string;
}

const LANGUAGES_LIST = [
  { code: 'auto', name: 'Detectar idioma', flag: '🔍' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'Inglês', flag: '🇺🇸' },
  { code: 'es', name: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr', name: 'Francês', flag: '🇫🇷' },
  { code: 'de', name: 'Alemão', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japonês', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinês', flag: '🇨🇳' },
];

export function DashboardGoogleTranslateTile({ 
  isEditMode 
}: { 
  isEditMode: boolean;
}) {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
  const [activeTab, setActiveTab] = useState<'translate' | 'history'>('translate');

  // Load / Save translate history
  const [history, setHistory] = useState<TranslateHistory[]>(() => {
    const saved = localStorage.getItem('condfy_translate_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'h1',
        sourceText: 'Bem-vindo ao centro administrativo.',
        translatedText: 'Welcome to the administrative center.',
        sl: 'pt',
        tl: 'en',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'h2',
        sourceText: 'O reparo nas bombas de recalque foi agendado para amanhã às dez horas da manhã.',
        translatedText: 'The repair on the booster pumps has been scheduled for tomorrow at ten in the morning.',
        sl: 'pt',
        tl: 'en',
        createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('condfy_translate_history', JSON.stringify(history));
  }, [history]);

  // Handle Speech API
  const speak = (text: string, langCode: string, isSource: boolean) => {
    if (!text || !('speechSynthesis' in window)) {
      toast.error('O seu navegador não suporta síntese de voz');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Attempt to map auto to pt
      const targetCode = langCode === 'auto' ? 'pt-BR' : langCode;
      utterance.lang = targetCode;

      utterance.onstart = () => {
        if (isSource) setIsSpeakingSource(true);
        else setIsSpeakingTarget(true);
      };

      utterance.onend = () => {
        if (isSource) setIsSpeakingSource(false);
        else setIsSpeakingTarget(false);
      };

      utterance.onerror = () => {
        if (isSource) setIsSpeakingSource(false);
        else setIsSpeakingTarget(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeakingSource(false);
      setIsSpeakingTarget(false);
    }
  };

  // Perform Translation with Google API Proxy
  const performTranslation = async (textToTranslate: string) => {
    if (!textToTranslate.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    try {
      // Free non-key Google Translate API endpoint gtx
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Falha na resposta do tradutor');
      }

      const json = await res.json();
      if (json && json[0]) {
        const fullTranslation = json[0].map((item: any) => item[0] || '').join('');
        setTranslatedText(fullTranslation);

        // Add to history automatically if it's somewhat significant and doesn't exist
        const hasTextInHistory = history.some(h => h.sourceText.trim() === textToTranslate.trim() && h.tl === targetLang);
        if (!hasTextInHistory && textToTranslate.trim().length > 4) {
          const newHistoryItem: TranslateHistory = {
            id: Date.now().toString(),
            sourceText: textToTranslate.trim(),
            translatedText: fullTranslation,
            sl: sourceLang === 'auto' ? (json[2] || 'auto') : sourceLang,
            tl: targetLang,
            createdAt: new Date().toISOString()
          };
          setHistory(prev => [newHistoryItem, ...prev].slice(0, 30)); // limit to 30 items
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao conectar com o serviço do Tradutor');
    } finally {
      setIsTranslating(false);
    }
  };

  // Debounced translate trigger
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!sourceText.trim()) {
      setTranslatedText('');
      return;
    }

    debounceRef.current = setTimeout(() => {
      performTranslation(sourceText);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sourceText, sourceLang, targetLang]);

  // Language Swap
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      // Switch auto with the current target lang, set default target as pt
      setSourceLang(targetLang);
      setTargetLang('pt');
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }
    // Also swap texts if they exist
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  const copyTranslation = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success('Tradução copiada!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const clearTranslation = () => {
    setSourceText('');
    setTranslatedText('');
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
    toast.success('Histórico removido');
  };

  const loadHistoryItem = (item: TranslateHistory) => {
    setSourceLang(item.sl);
    setTargetLang(item.tl);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setActiveTab('translate');
    toast.success('Tradução restaurada!');
  };

  const getLanguageName = (code: string) => {
    const lang = LANGUAGES_LIST.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  return (
    <div className="w-full h-full text-white bg-zinc-950/80 p-5 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/2 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#39FF14]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-20px] right-[-20px] w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Area */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3.5 relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
            <Languages className="w-4.5 h-4.5 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase text-white/95 tracking-wider truncate flex items-center gap-1.5">
              Google Tradutor IA
              <span className="text-[7.5px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded-full tracking-wider">MÓDULO</span>
            </h3>
            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">Tradução de textos instantânea</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={() => setActiveTab('translate')}
            className={`px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'translate' 
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Traduzir
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all relative ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Histórico
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-zinc-950 flex items-center justify-center text-[6px] font-bold text-white shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 min-h-0 flex flex-col justify-between relative z-10 py-1" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          {activeTab === 'translate' ? (
            <motion.div 
              key="tab-translate"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-full justify-between gap-3"
            >
              {/* Languages selectors selection bar */}
              <div className="flex items-center justify-between gap-1.5 bg-zinc-900/40 p-1.5 rounded-xl border border-white/5">
                {/* Source Selection dropdown list */}
                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="bg-transparent text-white/80 selection:bg-indigo-500 selection:text-white border-none py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer flex-1 custom-select w-full"
                >
                  {LANGUAGES_LIST.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-zinc-950 text-white text-[11px] font-semibold py-1">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>

                {/* Handswap button */}
                <button 
                  onClick={handleSwapLanguages}
                  className="p-1.5 hover:p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg hover:text-white border border-indigo-500/20 active:scale-95 transition-all shrink-0"
                  title="Inverter Idiomas"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>

                {/* Target Selection dropdown list */}
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-transparent text-white/80 selection:bg-indigo-500 selection:text-white border-none py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer flex-1 custom-select w-full"
                >
                  {LANGUAGES_LIST.filter(l => l.code !== 'auto').map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-zinc-950 text-white text-[11px] font-semibold py-1">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Translation Layout Dual Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[140px]">
                {/* Input Text Box */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-2.5 flex flex-col justify-between focus-within:border-indigo-500/30 transition-all group relative">
                  <span className="text-[7.5px] font-black uppercase text-white/30 tracking-widest absolute top-1.5 left-2.5 z-10 pointer-events-none">DIGITAR TEXTO</span>
                  
                  <textarea 
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Escreva ou cole o texto aqui..."
                    maxLength={1000}
                    className="w-full bg-transparent border-none text-[11px] text-white/95 placeholder-white/20 font-medium resize-none flex-1 mt-3 focus:outline-none focus:ring-0 custom-scrollbar pr-1"
                  />

                  {/* Input bottom action toolbar */}
                  <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1 shrink-0">
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => speak(sourceText, sourceLang, true)}
                        className={`p-1.5 bg-white/3 hover:bg-white/10 rounded-lg text-white/50 hover:text-indigo-400 transition-all ${isSpeakingSource ? 'text-indigo-400 animate-pulse' : ''}`}
                        title="Ouvir texto original"
                        disabled={!sourceText}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[7.5px] font-mono text-white/20 font-bold">{sourceText.length}/1000 C.</span>
                      {sourceText && (
                        <button 
                          onClick={clearTranslation}
                          className="p-1 px-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[8px] font-extrabold uppercase tracking-widest rounded-md transition-all flex items-center gap-1 shrink-0"
                          title="Limpar texto"
                        >
                          <X className="w-2.5 h-2.5" />
                          <span>Apagar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulated Translation Output box */}
                <div className="bg-zinc-900/80 border border-white/5 rounded-2xl p-2.5 flex flex-col justify-between transition-all relative">
                  <div className="absolute top-1.5 left-2.5 z-10 pointer-events-none flex items-center gap-1.5">
                    <span className="text-[7.5px] font-black uppercase text-white/40 tracking-widest">TRADUÇÃO ({targetLang.toUpperCase()})</span>
                    {isTranslating && (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-2.5 h-2.5 text-indigo-400 animate-spin" />
                        <span className="text-[6.5px] font-extrabold text-indigo-400 uppercase tracking-widest">Traduzindo...</span>
                      </span>
                    )}
                  </div>

                  <div className="w-full text-[11px] text-white/80 font-medium whitespace-pre-wrap select-text break-words flex-1 mt-4 overflow-y-auto max-h-[140px] custom-scrollbar mb-1.5 pr-1 font-mono">
                    {translatedText ? (
                      translatedText
                    ) : (
                      <span className="text-white/15 italic">A tradução inteligente aparecerá aqui instantaneamente...</span>
                    )}
                  </div>

                  {/* Output bottom action toolbar */}
                  <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1 shrink-0">
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => speak(translatedText, targetLang, false)}
                        className={`p-1.5 bg-white/3 hover:bg-white/10 rounded-lg text-white/50 hover:text-indigo-400 transition-all ${isSpeakingTarget ? 'text-[#39FF14] animate-pulse' : ''}`}
                        title="Ouvir tradução"
                        disabled={!translatedText}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => copyTranslation(translatedText)}
                      className={`p-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-black border border-indigo-500/20 text-indigo-400 rounded-lg transition-all ${!translatedText ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
                      disabled={!translatedText}
                      title="Copiar Tradução"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="tab-history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col h-full justify-between"
            >
              {/* History list viewport container */}
              <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[220px] flex-1">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="bg-zinc-900/50 hover:bg-zinc-900/90 border border-white/5 hover:border-indigo-500/30 rounded-xl p-3 flex flex-col gap-2.5 transition-all group cursor-pointer"
                    >
                      {/* Language pair indicators */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7.5px] font-black text-white/40 uppercase bg-white/5 px-1.5 py-0.5 rounded-full tracking-wider">
                            {item.sl.toUpperCase()}
                          </span>
                          <CornerDownRight className="w-3 h-3 text-white/30" />
                          <span className="text-[7.5px] font-black text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full tracking-wider">
                            {item.tl.toUpperCase()}
                          </span>
                        </div>

                        <span className="text-[7.5px] font-mono text-white/20 font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Translations text preview */}
                      <div className="space-y-1 ml-0.5 text-left">
                        <p className="text-[10px] text-white/50 leading-snug line-clamp-2 pr-2">{item.sourceText}</p>
                        <p className="text-[10.5px] text-white/95 font-bold leading-snug line-clamp-2 font-mono pr-2">{item.translatedText}</p>
                      </div>

                      {/* Tool Actions panel */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[7px] text-[#39FF14] uppercase tracking-wider font-extrabold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#39FF14]" /> Clique para restaurar
                        </span>

                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyTranslation(item.translatedText);
                            }}
                            className="p-1 text-white/40 hover:text-white hover:bg-white/5 rounded transition-all"
                            title="Copiar tradução"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                            className="p-1 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                            title="Remover do histórico"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/2 flex flex-col items-center justify-center">
                    <Languages className="w-6 h-6 text-white/20 mb-2" />
                    <span className="text-[9px] text-white/30 uppercase block font-black tracking-widest">Nenhuma tradução no histórico</span>
                    <span className="text-[8px] text-white/10 italic">O que traduzir ficará salvo aqui localmente</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
