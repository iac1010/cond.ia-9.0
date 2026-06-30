import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Search, RefreshCw, ExternalLink, 
  LogOut, CheckCircle2, MapPin, Loader2, Video, ChevronDown, ChevronUp, AlertCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initAuth, googleSignIn, logout } from '../services/workspaceAuth';
import toast from 'react-hot-toast';
import { User } from 'firebase/auth';

interface CalendarEventDetail {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  meetLink?: string;
}

const PORTUGUESE_MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function GoogleCalendarWidget({ isEditMode }: { isEditMode?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<CalendarEventDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'selected'>('all');
  
  // Date and view states for Month Mini-Calendar
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 9)); // 9 de Junho de 2026
  const [currentMonth, setCurrentMonth] = useState<number>(5); // Junho
  const [currentYear, setCurrentYear] = useState<number>(2026);
  
  // Create Event Form state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState<string>('14:00');
  const [newEndTime, setNewEndTime] = useState<string>('15:00');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const getDaysInMonthMatrix = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    
    const matrix: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      matrix.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month - 1, d)
      });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      matrix.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    const totalCellsNeeded = matrix.length <= 35 ? 35 : 42;
    const nextDays = totalCellsNeeded - matrix.length;
    for (let i = 1; i <= nextDays; i++) {
      matrix.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return matrix;
  };

  const isSameDay = (dateA: Date, dateB: Date) => {
    return dateA.getFullYear() === dateB.getFullYear() &&
           dateA.getMonth() === dateB.getMonth() &&
           dateA.getDate() === dateB.getDate();
  };

  // Listener for dynamic google auth sync
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch upcoming calendar events whenever token changes
  useEffect(() => {
    if (token) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [token]);

  const handleLogin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditMode) return;
    
    setAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        toast.success(`Google Agenda Sincronizada! Próximos eventos carregados. 📅`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao conectar ao Google Calendar.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditMode) return;

    if (!window.confirm('Deseja desconectar sua conta do Google Agenda?')) return;

    try {
      await logout();
      setUser(null);
      setToken(null);
      setEvents([]);
      toast.success('Google Agenda desconectada.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desconectar.');
    }
  };

  const fetchEvents = async () => {
    if (!token) return;
    setLoading(true);

    try {
      // Fetch upcoming events from primary calendar
      const now = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.status === 401 || res.status === 403) {
        console.warn('Google Calendar API returned 401/403. Token expired. Logging out.');
        await logout();
        setUser(null);
        setToken(null);
        setEvents([]);
        return;
      }

      if (!res.ok) {
        throw new Error('Falha ao obter eventos.');
      }

      const data = await res.json();
      const items = data.items || [];

      // Parse and check if events have virtual conferencing / meet links
      const parsed = items.map((item: any) => {
        let meetLink = '';
        
        // Try to locate Conference Data (Google Meet)
        if (item.conferenceData?.entryPoints) {
          const videoCall = item.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video');
          if (videoCall?.uri) meetLink = videoCall.uri;
        }
        
        // Fallback: check location or description for common meeting links
        if (!meetLink && item.location && (item.location.includes('meet.google') || item.location.includes('teams.live') || item.location.includes('zoom.us'))) {
          meetLink = item.location;
        }

        if (!meetLink && item.description && item.description.includes('https://meet.google.com/')) {
          const match = item.description.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
          if (match) meetLink = match[0];
        }

        return {
          id: item.id,
          summary: item.summary || 'Compromisso Sem Código',
          description: item.description,
          location: item.location,
          start: item.start || {},
          end: item.end || {},
          htmlLink: item.htmlLink,
          meetLink: meetLink || undefined
        };
      });

      setEvents(parsed);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      // Let's avoid displaying error toast if token is stale (handled on next login)
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (startObj: any) => {
    if (!startObj) return '';
    const dateStr = startObj.dateTime || startObj.date;
    if (!dateStr) return '';
    
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const isAllDay = !!startObj.date;
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      // Label shortcuts
      let label = '';
      if (d.toDateString() === today.toDateString()) {
        label = 'Hoje';
      } else if (d.toDateString() === tomorrow.toDateString()) {
        label = 'Amanhã';
      } else {
        label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
      }

      const timeStr = isAllDay ? 'Dia todo' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { label, timeStr, isAllDay, rawDate: d };
    } catch {
      return { label: dateStr, timeStr: '', isAllDay: false, rawDate: new Date() };
    }
  };

  const [isSavingEvent, setIsSavingEvent] = useState<boolean>(false);

  // Create the event directly on Google Calendar API
  const handleCreateEventDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newTitle.trim()) {
      toast.error('Por favor, informe o título do compromisso.');
      return;
    }

    if (!token) {
      toast.error('Para agendar, sincronize sua Conta Google primeiro.');
      return;
    }

    setIsSavingEvent(true);

    try {
      // Format start and end dates based on inputs
      const startDateObj = new Date(`${newDate}T${newStartTime}:00`);
      const endDateObj = new Date(`${newDate}T${newEndTime}:00`);
      
      if (endDateObj <= startDateObj) {
        toast.error('A data/hora de término deve ser após o início.');
        setIsSavingEvent(false);
        return;
      }

      // Build JSON body for Google Calendar Events Insert
      const eventBody = {
        summary: newTitle.trim(),
        location: newLocation.trim() || undefined,
        description: newDescription.trim() || 'Criado diretamente do Painel Condfy',
        start: {
          dateTime: startDateObj.toISOString(),
        },
        end: {
          dateTime: endDateObj.toISOString(),
        }
      };

      const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Google Calendar direct insert error:', errorData);
        if (res.status === 403 || errorData.error?.status === 'PERMISSION_DENIED') {
          throw new Error('Sua conta está conectada apenas em modo de leitura. Por favor, desconecte sua agenda (no botão à direita com ícone de saída) e conecte novamente para ativar a permissão de salvar compromissos.');
        }
        throw new Error(errorData.error?.message || 'Erro ao salvar o compromisso na sua Google Agenda.');
      }

      toast.success('Compromisso agendado com sucesso e sincronizado! 📅');
      
      // Reset form fields
      setNewTitle('');
      setNewDescription('');
      setNewLocation('');
      setShowCreateForm(false);
      
      // Automatically refresh upcoming events list
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao salvar compromisso.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const parsedDate = formatEventDate(event.start);
    const labelStr = typeof parsedDate === 'object' ? parsedDate.label : '';
    
    // Quick Time Mode Filters
    if (filterMode === 'today') {
      if (typeof parsedDate === 'object' && parsedDate.label !== 'Hoje') {
        return false;
      }
    }

    if (filterMode === 'selected') {
      if (typeof parsedDate === 'object') {
        const isSame = parsedDate.rawDate.getFullYear() === selectedDate.getFullYear() &&
                       parsedDate.rawDate.getMonth() === selectedDate.getMonth() &&
                       parsedDate.rawDate.getDate() === selectedDate.getDate();
        if (!isSame) return false;
      } else {
        return false;
      }
    }

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const matchesSummary = event.summary?.toLowerCase().includes(term);
    const matchesDesc = event.description?.toLowerCase().includes(term);
    const matchesLoc = event.location?.toLowerCase().includes(term);
    
    return matchesSummary || matchesDesc || matchesLoc;
  });

  return (
    <div 
      className="w-full h-full text-white bg-zinc-950/90 p-4 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl group/widget"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background radial soft aura */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full mix-blend-screen pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-900 rounded-lg border border-white/10">
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wide">
              Google Agenda
            </h3>
            <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Eventos & Compromissos</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); }}
              title="Novo Compromisso"
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[8.5px] font-extrabold uppercase ${
                showCreateForm 
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' 
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
              }`}
            >
              <Plus className="w-3 h-3 text-sky-400" />
              <span>Novo</span>
            </button>

            <button
              onClick={fetchEvents}
              disabled={loading}
              title="Sincronizar Agenda"
              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/5 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              title={`Sincronizado como ${user.email}`}
              className="p-1 bg-white/5 hover:bg-rose-500/15 text-white/40 hover:text-rose-400 rounded-lg border border-white/5 transition-all text-[8px] flex items-center gap-1"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-3.5 h-3.5 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
              )}
              <LogOut className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {!user ? (
          /* Authentication Lock Screen */
          <div className="flex-grow flex flex-col items-center justify-center text-center p-3">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-sky-500/20 blur-md rounded-full animate-pulse" />
              <Calendar className="w-9 h-9 text-sky-400 relative" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">Sincronizar Agenda</p>
            <p className="text-[8.5px] text-white/40 leading-relaxed max-w-[200px] mb-4">
              Acompanhe reuniões, agendamentos do condomínio e lembretes integrados em tempo real.
            </p>
            
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 font-extrabold text-[9px] rounded-xl tracking-wider transition-all active:scale-95 shadow-lg"
            >
              {authLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              )}
              {authLoading ? 'CONECTANDO...' : 'SINCROMIZAR INTEGRADO'}
            </button>
          </div>
        ) : (
          /* Active Calendar Two-Column Layout */
          <div className="flex-grow flex-1 flex flex-col md:flex-row gap-4 min-h-0 text-left">
            {/* Left Column: Mini-Calendar and "Criar" Button */}
            <div className="w-full md:w-[155px] lg:w-[170px] shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4">
              
              {/* Creator button exactly styled like the user picture */}
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(prev => !prev);
                  // Set newDate state to the selected calendar day
                  if (selectedDate) {
                    setNewDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
                className="flex items-center justify-between px-3 py-2 bg-white text-zinc-950 hover:bg-zinc-100 font-extrabold text-[10px] uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer mb-3 w-fit shrink-0 group border border-white/10"
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-blue-600 stroke-[3px]" />
                  <span>Criar</span>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-1.5 group-hover:text-zinc-600 transition-colors" />
              </button>

              {/* Monthly Mini-Calendar Grid wrapper */}
              <div className="bg-zinc-900/25 p-2 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between px-0.5 shrink-0">
                  <span className="text-[8.5px] font-black text-white/95 uppercase tracking-wider">
                    {PORTUGUESE_MONTHS[currentMonth]} {currentYear}
                  </span>
                  <div className="flex gap-0.5">
                    <button 
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-white/10 active:scale-95 rounded-lg text-white/60 hover:text-white transition"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-white/10 active:scale-95 rounded-lg text-white/60 hover:text-white transition"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Week Day Titles */}
                <div className="grid grid-cols-7 text-center gap-y-1 mt-2 shrink-0">
                  {WEEK_DAYS.map((day, idx) => (
                    <span key={idx} className="text-[7.5px] font-black text-white/35 uppercase">
                      {day}
                    </span>
                  ))}
                  
                  {/* Calendar Days Matrix */}
                  {getDaysInMonthMatrix(currentYear, currentMonth).map((cell, idx) => {
                    const isSelected = selectedDate && 
                      selectedDate.getDate() === cell.day && 
                      selectedDate.getMonth() === cell.date.getMonth() && 
                      selectedDate.getFullYear() === cell.date.getFullYear();
                      
                    // System Today is June 9, 2026 based on metadata
                    const systemToday = new Date('2026-06-09T16:38:35Z');
                    const isCurrentToday = systemToday.getDate() === cell.day &&
                      systemToday.getMonth() === cell.date.getMonth() &&
                      systemToday.getFullYear() === cell.date.getFullYear();
                      
                    // Check if day has events
                    const hasEvents = events.some(event => {
                      const parsed = formatEventDate(event.start);
                      return parsed && typeof parsed === 'object' && isSameDay(parsed.rawDate, cell.date);
                    });

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedDate(cell.date);
                          setFilterMode('selected');
                          // sync form date automatically
                          setNewDate(cell.date.toISOString().split('T')[0]);
                        }}
                        className="relative group p-0 flex flex-col items-center justify-center h-5 w-5 mx-auto rounded-full transition-all focus:outline-none shrink-0"
                      >
                        {/* Selected Highlighter background */}
                        {isSelected ? (
                          <div className="absolute inset-0 bg-blue-600 rounded-full scale-100 shadow shadow-blue-600/40" />
                        ) : isCurrentToday ? (
                          <div className="absolute inset-0 border border-blue-500 rounded-full scale-100" />
                        ) : null}
                        
                        <span className={`relative text-[7.5px] font-bold ${
                          isSelected 
                            ? 'text-white font-black' 
                            : isCurrentToday 
                              ? 'text-blue-400 font-extrabold'
                              : cell.isCurrentMonth 
                                ? 'text-white/80 group-hover:text-white' 
                                : 'text-white/20 group-hover:text-white/40'
                        }`}>
                          {cell.day}
                        </span>

                        {/* Tiny Indicator Dot */}
                        {hasEvents && !isSelected && (
                          <span className={`absolute bottom-0 w-[2.5px] h-[2.5px] rounded-full ${
                            isCurrentToday ? 'bg-blue-400' : 'bg-sky-400'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Active View (Event List OR Form) */}
            <div className="flex-grow flex flex-col min-h-0 pl-0 md:pl-1">
              {showCreateForm ? (
                /* Create Event Form View */
                <motion.form 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleCreateEventDirectly}
                  className="flex-grow flex flex-col justify-between h-full min-h-0 text-left"
                >
                  <div className="space-y-1.5 overflow-y-auto pr-1 flex-grow scrollbar-thin">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-sky-400">Marcar Evento</span>
                      <span className="text-[7.5px] text-sky-400 font-extrabold uppercase tracking-wider animate-pulse bg-sky-400/10 px-1 rounded">Mecanismo Direto</span>
                    </div>

                    {/* Title input */}
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-white/50 uppercase tracking-widest">Nome do Compromisso</label>
                      <input 
                        type="text" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ex: Assembléia Geral Síndicos"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1 text-[9.5px] outline-none text-white focus:border-sky-400/50"
                        required
                        disabled={isSavingEvent}
                      />
                    </div>

                    {/* Date & Time Grid */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-white/50 uppercase tracking-widest">Data</label>
                        <input 
                          type="date" 
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1 text-[9px] outline-none text-white focus:border-sky-400/50 uppercase font-bold"
                          disabled={isSavingEvent}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-white/50 uppercase tracking-widest">Início</label>
                        <input 
                          type="time" 
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1 text-[9px] outline-none text-white focus:border-sky-400/50"
                          disabled={isSavingEvent}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-white/50 uppercase tracking-widest">Término</label>
                        <input 
                          type="time" 
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1 text-[9px] outline-none text-white focus:border-sky-400/50"
                          disabled={isSavingEvent}
                        />
                      </div>
                    </div>

                    {/* Location input */}
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-white/50 uppercase tracking-widest">Localidade / Link Videoconferência</label>
                      <input 
                        type="text" 
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Ex: Salão de Festas ou Link Meet"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1 text-[9.5px] outline-none text-white focus:border-sky-400/50"
                        disabled={isSavingEvent}
                      />
                    </div>

                    {/* Description input */}
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-white/50 uppercase tracking-widest">Descrição</label>
                      <textarea 
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Ex: Pauta sobre despesas ordinárias."
                        rows={2}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1 text-[9.5px] outline-none text-white focus:border-sky-400/50 resize-none font-semibold leading-normal"
                        disabled={isSavingEvent}
                      />
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="flex gap-1.5 border-t border-white/5 pt-1.5 mt-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setShowCreateForm(false); }}
                      className="flex-1 py-1 text-[8.5px] font-black uppercase text-white/50 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition"
                      disabled={isSavingEvent}
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEvent}
                      className="flex-1 py-1 text-[8.5px] font-black uppercase bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-white/40 text-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/10 cursor-pointer"
                    >
                      {isSavingEvent ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-2.5 h-2.5 stroke-[3]" />
                          Criar Comp.
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              ) : (
                /* Active Calendar Interface */
                <div className="flex-grow flex flex-col justify-between h-full min-h-0">
                  {/* Filter Tabs & Search Bar */}
                  <div className="flex flex-col gap-1.5 mb-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 mx-auto w-full">
                      <button
                        type="button"
                        onClick={() => setFilterMode('all')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-[7.5px] tracking-wide font-black uppercase rounded-md transition-all ${filterMode === 'all' ? 'bg-zinc-800 text-sky-400 border border-white/5 shadow' : 'text-white/40 hover:text-white/70'}`}
                      >
                        Próximos
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode('today')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-[7.5px] tracking-wide font-black uppercase rounded-md transition-all ${filterMode === 'today' ? 'bg-zinc-800 text-sky-400 border border-white/5 shadow' : 'text-white/40 hover:text-white/70'}`}
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode('selected')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-[7.5px] tracking-wide font-black uppercase rounded-md transition-all ${filterMode === 'selected' ? 'bg-zinc-800 text-sky-400 border border-white/5 shadow' : 'text-white/40 hover:text-white/70'}`}
                      >
                        Dia {selectedDate.getDate()}
                      </button>
                    </div>

                    {/* Search filter input */}
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        placeholder="Pesquisar compromissos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 pl-7.5 py-1 text-[9px] text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                  </div>

                  {/* Live Calendar Event List */}
                  <div className="flex-grow min-h-0 overflow-y-auto space-y-1.5 scrollbar-thin flex flex-col py-0.5 justify-start">
                    {loading ? (
                      <div className="flex-grow flex flex-col items-center justify-center py-6 text-white/30 gap-1.5">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Lendo Google Agenda...</span>
                      </div>
                    ) : filteredEvents.length > 0 ? (
                      filteredEvents.map((event) => {
                        const dateInfo = formatEventDate(event.start);
                        const isExpanded = expandedEventId === event.id;
                        const labelStr = typeof dateInfo === 'object' ? dateInfo.label : 'Agenda';
                        const timeStr = typeof dateInfo === 'object' ? dateInfo.timeStr : '';
                        const isToday = labelStr === 'Hoje';

                        return (
                          <div
                            key={event.id}
                            className={`block rounded-xl border transition-all text-left relative overflow-hidden ${
                              isToday 
                                ? 'bg-sky-500/[0.04] border-sky-500/30 hover:border-sky-500/40' 
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                            }`}
                          >
                            {/* Event Main Header click area */}
                            <div 
                              className="p-2 cursor-pointer flex items-center justify-between gap-2"
                              onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                            >
                              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                {/* Calendar card time strip */}
                                <div className={`p-1 px-1.5 rounded-md text-center flex flex-col shrink-0 min-w-[34px] ${
                                  isToday ? 'bg-sky-500/20 text-sky-300' : 'bg-white/5 text-white/50'
                                }`}>
                                  <span className="text-[6.5px] font-black uppercase tracking-wider leading-none">{labelStr}</span>
                                  <span className="text-[7.5px] font-black mt-0.5 leading-none">{timeStr}</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[9px] font-black leading-tight text-white/90 truncate uppercase group-hover:text-white">
                                    {event.summary}
                                  </h4>
                                  {event.location && (
                                    <div className="flex items-center gap-0.5 mt-0.5 text-[7px] text-white/45 truncate">
                                      <MapPin className="w-2.5 h-2.5 shrink-0 text-white/30" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Expand & Actions shortcuts */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {event.meetLink && (
                                  <a
                                    href={event.meetLink}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    title="Entrar na Videoconferência"
                                    className="p-1 bg-sky-500/10 hover:bg-sky-500 hover:text-black text-sky-400 rounded-lg transition-transform hover:scale-105 active:scale-95"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Video className="w-3 h-3" />
                                  </a>
                                )}
                                <div className="text-white/40 hover:text-white transition">
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            </div>

                            {/* Event Expanded Body */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="px-2 pb-2.5 pt-0.5 border-t border-white/5 bg-black/20 text-[8px] text-white/60 leading-normal font-medium space-y-1.5 text-left"
                                >
                                  {event.description ? (
                                    <p className="whitespace-pre-line text-[8px] text-white/50 bg-black/20 p-1.5 rounded-lg border border-white/5">
                                      {event.description}
                                    </p>
                                  ) : (
                                    <p className="italic text-[7.5px] text-white/30">Sem descrição detalhada disponível.</p>
                                  )}

                                  <div className="flex items-center justify-between gap-4 pt-1">
                                    {event.location && (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="flex items-center gap-0.5 text-sky-400/80 hover:text-sky-300 font-bold uppercase text-[7.5px] transition"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MapPin className="w-2.5 h-2.5" />
                                        Ver no Google Maps
                                      </a>
                                    )}
                                    
                                    <a
                                      href={event.htmlLink || 'https://calendar.google.com'}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="flex items-center gap-0.5 ml-auto text-sky-400 hover:text-sky-300 font-bold uppercase text-[7.5px] transition"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Ver Completo
                                      <ExternalLink className="w-2 h-2" />
                                    </a>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 border border-dashed border-white/5 rounded-2xl bg-white/1 text-center flex-grow flex flex-col justify-center items-center">
                        <CheckCircle2 className="w-5 h-5 text-zinc-700 mb-1" />
                        <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">Sem compromissos</span>
                        <span className="text-[7.5px] text-white/20">Nenhum evento localizado</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions info */}
                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[7px] text-white/35 font-bold uppercase tracking-wider shrink-0 mt-1">
                    <span>Google Calendar</span>
                    <a 
                      href="https://calendar.google.com" 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-sky-400 transition-colors"
                    >
                      Abrir Agenda Completa <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
