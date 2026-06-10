import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Tag, 
  Calendar, CheckSquare, Sparkles, TrendingUp, Filter, AlertTriangle,
  Play, Pause, RotateCcw, Coffee, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  category: 'Trabalho' | 'Pessoal' | 'Fazer Diariamente' | 'Urgente';
  createdAt: string;
  completedAt?: string;
}

const CATEGORY_STYLES = {
  Trabalho: {
    bg: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
    dot: 'bg-blue-500',
    hoverBg: 'hover:bg-blue-500/20'
  },
  Pessoal: {
    bg: 'bg-purple-500/10 border-purple-500/25 text-purple-400',
    dot: 'bg-purple-500',
    hoverBg: 'hover:bg-purple-500/20'
  },
  'Fazer Diariamente': {
    bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    dot: 'bg-emerald-500',
    hoverBg: 'hover:bg-emerald-500/20'
  },
  Urgente: {
    bg: 'bg-rose-500/10 border-rose-500/25 text-rose-400 animate-pulse',
    dot: 'bg-rose-500',
    hoverBg: 'hover:bg-rose-500/20'
  }
};

export function DailyTasksWidget({ isEditMode }: { isEditMode?: boolean }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    const saved = localStorage.getItem('condfy_daily_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: '1', title: 'Revisar nível do reservatório de água', completed: false, category: 'Fazer Diariamente', createdAt: new Date().toISOString() },
      { id: '2', title: 'Enviar relatório financeiro para Síndico', completed: true, category: 'Trabalho', createdAt: new Date().toISOString() },
      { id: '3', title: 'Ligar para fornecedor de cloro', completed: false, category: 'Urgente', createdAt: new Date().toISOString() },
      { id: '4', title: 'Alinhamento com a equipe de portaria', completed: false, category: 'Trabalho', createdAt: new Date().toISOString() }
    ];
  });

  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState<DailyTask['category']>('Trabalho');
  const [activeFilter, setActiveFilter] = useState<DailyTask['category'] | 'Todos'>('Todos');

  // Pomodoro States
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('condfy_pomodoro_time');
    return saved ? parseInt(saved, 10) : 25 * 60;
  });
  const [timerActive, setTimerActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'trabalho' | 'pausa'>(() => {
    const saved = localStorage.getItem('condfy_pomodoro_mode');
    return (saved as 'trabalho' | 'pausa') || 'trabalho';
  });

  useEffect(() => {
    localStorage.setItem('condfy_daily_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleTasksBackupUpdated = () => {
      const saved = localStorage.getItem('condfy_daily_tasks');
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('condfy_daily_tasks_updated', handleTasksBackupUpdated);
    return () => {
      window.removeEventListener('condfy_daily_tasks_updated', handleTasksBackupUpdated);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('condfy_pomodoro_time', timeLeft.toString());
    localStorage.setItem('condfy_pomodoro_mode', pomodoroMode);
  }, [timeLeft, pomodoroMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Handle pomodoro timer completion
  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      if (pomodoroMode === 'trabalho') {
        toast.success('Sessão Pomodoro Concluída! Hora de uma pausa curta. ☕', {
          duration: 5000,
          icon: '⏰',
        });
        setPomodoroMode('pausa');
        setTimeLeft(5 * 60); // 5 mins break
      } else {
        toast.success('Pausa concluída! Pronto para focar novamente? 💪', {
          duration: 5000,
          icon: '🎯',
        });
        setPomodoroMode('trabalho');
        setTimeLeft(25 * 60); // 25 mins work
      }
    }
  }, [timeLeft, timerActive, pomodoroMode]);

  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimerActive(!timerActive);
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimerActive(false);
    setTimeLeft(pomodoroMode === 'trabalho' ? 25 * 60 : 5 * 60);
  };

  const cycleMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimerActive(false);
    const nextMode = pomodoroMode === 'trabalho' ? 'pausa' : 'trabalho';
    setPomodoroMode(nextMode);
    setTimeLeft(nextMode === 'trabalho' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: DailyTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      completed: false,
      category,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    toast.success('Tarefa diária criada com sucesso! 🚀');
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const isNowCompleted = !t.completed;
        if (isNowCompleted) {
          toast.success('Tarefa concluída! ✨', { icon: '👏' });
        }
        return { 
          ...t, 
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined
        };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Tarefa excluída');
  };

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'Todos') return tasks;
    return tasks.filter(t => t.category === activeFilter);
  }, [tasks, activeFilter]);

  // Panorama calculations
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const categoryBreakdown = {
      Trabalho: { total: 0, completed: 0 },
      Pessoal: { total: 0, completed: 0 },
      'Fazer Diariamente': { total: 0, completed: 0 },
      Urgente: { total: 0, completed: 0 }
    };

    tasks.forEach(t => {
      if (categoryBreakdown[t.category]) {
        categoryBreakdown[t.category].total += 1;
        if (t.completed) {
          categoryBreakdown[t.category].completed += 1;
        }
      }
    });

    return {
      total,
      completed,
      percentage,
      categoryBreakdown
    };
  }, [tasks]);

  // Dynamic motivational quote from Vivian AI
  const vivianInsight = useMemo(() => {
    if (stats.total === 0) return 'Comece adicionando uma tarefa acima para organizar seu dia!';
    if (stats.percentage === 100) return 'Incrível! Tudo pronto por hoje. Vivian orgulhosa!';
    if (stats.percentage >= 70) return `Falta pouco! Só mais ${stats.total - stats.completed} para fechar 100%.`;
    if (stats.percentage > 0) return `Bom ritmo! ${stats.completed} de ${stats.total} tarefas concluídas.`;
    return 'Vamos iniciar as execuções e conquistar o dia de hoje!';
  }, [stats]);

  return (
    <div 
      id="daily-tasks-widget"
      className="w-full h-full text-white bg-zinc-950/90 p-4 md:p-5 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl pointer-events-auto cursor-pointer hover:border-[#39FF14]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(57,255,20,0.03)] group"
      onClick={(e) => {
        e.stopPropagation();
        const isInteractive = (e.target as HTMLElement).closest('button, input, select, textarea, form, a');
        if (!isInteractive) {
          navigate('/tasks');
        }
      }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#39FF14]/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Header Container */}
      <div className="flex flex-col gap-2 border-b border-white/10 pb-2.5 mb-2.5 shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-[#39FF14]/10 rounded-lg border border-[#39FF14]/25">
              <CheckSquare className="w-4 h-4 text-[#39FF14]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-1.5">
                Checklist Diário
                <span className="text-[7.5px] text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/25 px-1 py-0.2 rounded font-black uppercase tracking-wider animate-pulse">
                  Abrir Métricas ➔
                </span>
              </h3>
              <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Produtividade</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Pomodoro Timer */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-bold transition-all shrink-0 ${
              pomodoroMode === 'trabalho' 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <button 
                type="button" 
                onClick={cycleMode} 
                title="Alternar Modo (Foco / Pausa)"
                className="flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all outline-none"
              >
                {pomodoroMode === 'trabalho' ? (
                  <Brain className="w-3 h-3 text-rose-400 animate-pulse" />
                ) : (
                  <Coffee className="w-3 h-3 text-emerald-400" />
                )}
                <span className="text-[7.5px] uppercase tracking-wider font-extrabold hidden min-[370px]:inline">
                  {pomodoroMode === 'trabalho' ? 'Foco' : 'Pausa'}
                </span>
              </button>
              
              <span className="font-mono font-black border-l border-white/10 pl-1.5 text-xs tracking-wider">
                {formatTime(timeLeft)}
              </span>

              <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                  title={timerActive ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'}
                >
                  {timerActive ? (
                    <Pause className="w-2.5 h-2.5" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                  title="Reiniciar Tempo"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#39FF14]/15 border border-[#39FF14]/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-[#39FF14]">
              {stats.completed}/{stats.total} OK
            </div>
          </div>
        </div>

        {/* Shorter Filters Row - Scrollbar Hidden */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 border-t border-white/5 pt-2">
          {(['Todos', 'Trabalho', 'Pessoal', 'Fazer Diariamente', 'Urgente'] as const).map((filt) => (
            <button
              key={filt}
              type="button"
              onClick={() => setActiveFilter(filt)}
              className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-lg border transition-all duration-200 shrink-0 ${
                activeFilter === filt
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/1 border-transparent text-white/40 hover:text-white/80'
              }`}
            >
              {filt === 'Fazer Diariamente' ? 'Diário' : filt}
            </button>
          ))}
        </div>
      </div>

      {/* Elegant Compact Form Creator */}
      <form onSubmit={handleAddTask} className="mb-2.5 shrink-0 relative z-10">
        <div className="flex flex-col gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10 focus-within:border-white/20 transition-all focus-within:ring-1 focus-within:ring-[#39FF14]/30">
          <input 
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nova tarefa ou rotina de hoje..."
            className="w-full bg-transparent border-none placeholder-white/25 text-xs text-white uppercase font-bold tracking-tight outline-none focus:ring-0 px-1 py-1"
          />

          <div className="flex items-center justify-between border-t border-white/5 pt-1.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">Etiqueta:</span>
              <div className="flex items-center gap-1">
                {(['Trabalho', 'Pessoal', 'Fazer Diariamente', 'Urgente'] as const).map((catName) => {
                  const isSelected = category === catName;
                  const style = CATEGORY_STYLES[catName];
                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setCategory(catName)}
                      title={catName === 'Fazer Diariamente' ? 'Rotina Diária' : catName}
                      className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                        isSelected 
                          ? 'ring-1 ring-[#39FF14] border-white scale-110' 
                          : 'border-white/10 opacity-50 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: catName === 'Trabalho' ? '#3b82f6' : catName === 'Pessoal' ? '#a855f7' : catName === 'Fazer Diariamente' ? '#10b981' : '#f43f5e' }}
                    >
                      {isSelected && <div className="w-1 h-1 bg-white rounded-full" />}
                    </button>
                  );
                })}
              </div>
              <span className="text-[8px] font-bold text-white/50 lowercase italic max-w-[50px] truncate">
                {category === 'Fazer Diariamente' ? 'diária' : category.toLowerCase()}
              </span>
            </div>

            <button 
              type="submit"
              className="px-2.5 py-1 bg-[#39FF14] hover:bg-[#34e012] text-black font-black uppercase text-[9px] rounded-lg tracking-wider transition-all active:scale-95 shadow-[0_0_8px_rgba(57,255,20,0.35)] flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
              Criar
            </button>
          </div>
        </div>
      </form>

      {/* Task List - Compact, Flex-grown height */}
      <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 relative z-10 scrollbar-thin max-h-[140px] mb-2.5 min-h-[90px]">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const style = CATEGORY_STYLES[task.category];
              return (
                <motion.div
                  key={task.id}
                  layoutId={`daily-task-${task.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleToggleTask(task.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-200 cursor-pointer group ${
                    task.completed 
                      ? 'bg-zinc-900/40 border-white/5 opacity-50 hover:opacity-80' 
                      : 'bg-white/5 hover:bg-white/8 border-white/10 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <button
                      type="button"
                      className="shrink-0 text-white/30 group-hover:text-[#39FF14] transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />
                      ) : (
                        <Circle className="w-4 h-4 text-white/10 group-hover:text-white/30" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className={`text-xs font-black uppercase tracking-tight truncate leading-tight ${
                        task.completed ? 'line-through text-white/40 italic font-bold' : 'text-white/90'
                      }`}>
                        {task.title}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-px rounded border text-[7px] font-black uppercase tracking-wider ${style.bg}`}>
                          <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                          {task.category === 'Fazer Diariamente' ? 'Rotina' : task.category}
                        </span>
                        {task.createdAt && (
                          <span className="text-[6.5px] font-extrabold text-white/30 uppercase">
                            Criada: {new Date(task.createdAt).toLocaleDateString('pt-BR')} às {new Date(task.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {task.completed && task.completedAt && (
                          <span className="text-[6.5px] font-extrabold text-[#39FF14] uppercase">
                            ✓ {new Date(task.completedAt).toLocaleDateString('pt-BR')} às {new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="p-1 opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-lg transition-all h-6 w-6 flex items-center justify-center shrink-0"
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/1 flex flex-col items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white/5 mb-1" />
              <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Nenhuma tarefa operacional</p>
              <p className="text-[8px] text-white/15 italic">Mude o filtro ou crie uma tarefa</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* PANORAMA DE EXECUÇÕES */}
      <div className="shrink-0 bg-white/2 border border-white/10 rounded-xl p-2.5 transition-all relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#39FF14]" />
            <span className="text-[8px] font-black uppercase text-white/80 tracking-wider">Panorama Geral</span>
          </div>
          <span className="text-[9px] font-black text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-1.5 py-0.5 rounded-md">
            {stats.percentage}% OK
          </span>
        </div>

        {/* Compact Glow Bar */}
        <div className="w-full bg-white/10 rounded-full h-2 border border-white/5 overflow-hidden p-0.5 relative">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#39FF14]"
            initial={{ width: 0 }}
            animate={{ width: `${stats.percentage}%` }}
            transition={{ type: 'spring', damping: 15, stiffness: 80 }}
          />
        </div>

        {/* Compact Breakdown list */}
        <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-white/5">
          {(['Trabalho', 'Pessoal', 'Fazer Diariamente', 'Urgente'] as const).map((cat) => {
            const data = stats.categoryBreakdown[cat] || { total: 0, completed: 0 };
            const style = CATEGORY_STYLES[cat];
            return (
              <div 
                key={cat} 
                className={`p-1 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center hover:border-white/15 cursor-pointer ${
                  activeFilter === cat ? 'border-[#39FF14]/40 bg-zinc-900' : ''
                }`}
                onClick={() => setActiveFilter(cat === activeFilter ? 'Todos' : cat)}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                  <span className="text-[7.5px] font-black uppercase text-white/40 tracking-wider truncate max-w-[45px]">
                    {cat === 'Fazer Diariamente' ? 'Rotina' : cat}
                  </span>
                </div>
                <p className="text-[9px] font-black text-white/90 mt-0.5">
                  {data.completed}/{data.total}
                </p>
              </div>
            );
          })}
        </div>

        {/* Vivian virtual AI guidance - Compact banner */}
        <div className="mt-2 bg-[#39FF14]/5 rounded-lg border border-[#39FF14]/15 p-1 px-1.5 flex gap-1.5 items-center">
          <Sparkles className="w-3 h-3 text-[#39FF14] shrink-0" />
          <p className="text-[8.5px] font-bold text-emerald-400 capitalize-first truncate leading-none">
            <span className="font-extrabold text-[#39FF14]">Vivian:</span> {vivianInsight}
          </p>
        </div>
      </div>
    </div>
  );
}
