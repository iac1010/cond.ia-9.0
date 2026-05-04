import React, { useState } from 'react';
import { useStore } from '../store';
import { Appointment } from '../types';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, Calendar as CalendarIcon, Clock, AlignLeft, X, Info, CalendarDays, MapPin, User, ChevronLeft, ChevronRight, Settings, Download, ExternalLink, RefreshCw, Wrench } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarEvent = ({ event }: any) => {
  const isTicket = event.resource.type === 'TICKET';
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1.5 truncate">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isTicket ? 'bg-white' : 'bg-white/60'}`} />
        <span className="truncate">{event.title}</span>
      </div>
      {!event.allDay && (
        <span className="text-[0.65rem] opacity-70 font-medium ml-3">
          {format(event.start, 'HH:mm')}
        </span>
      )}
    </div>
  );
};

const MonthDateHeader = ({ label, date, onDrillDown }: any) => {
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  return (
    <div className="flex justify-center p-1">
      <button 
        type="button"
        onClick={onDrillDown}
        className={`
          w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all
          ${isToday 
            ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110' 
            : 'hover:bg-white/10 text-white/60 hover:text-white'}
        `}
      >
        {label}
      </button>
    </div>
  );
};

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };
  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };
  const goToToday = () => {
    toolbar.onNavigate('TODAY');
  };

  const toggleView = (view: string) => {
    toolbar.onView(view);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
      <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
        <button
          type="button"
          onClick={goToBack}
          className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black text-white uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/10"
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="text-3xl font-light text-white lowercase tracking-tight">
        {toolbar.label}
      </div>

      <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
        {['month', 'week', 'day', 'agenda'].map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => toggleView(view)}
            className={`
              px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.15em] transition-all
              ${toolbar.view === view 
                ? 'bg-white/20 text-white shadow-xl border border-white/20' 
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'}
            `}
          >
            {view === 'month' ? 'Mês' : 
             view === 'week' ? 'Semana' : 
             view === 'day' ? 'Dia' : 'Agenda'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function Calendar() {
  const navigate = useNavigate();
  const { appointments, tickets, clients, addAppointment, deleteAppointment, addTicket } = useStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [view, setView] = useState<any>('month');
  const [date, setDate] = useState(new Date());
  
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] + 'T09:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0] + 'T10:00');
  const [type, setType] = useState<'MEETING' | 'OTHER'>('MEETING');
  const [notes, setNotes] = useState('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState({
    theme: 'dark',
    colors: {
      TICKET: 'rgba(59, 130, 246, 0.4)', // Blue
      MEETING: 'rgba(255, 255, 255, 0.4)', // White
      OTHER: 'rgba(168, 85, 247, 0.4)' // Purple
    }
  });

  // Maintenance State
  const [isMaintenanceAdding, setIsMaintenanceAdding] = useState(false);
  const [maintTask, setMaintTask] = useState('');
  const [maintFreq, setMaintFreq] = useState('MENSAL');
  const [maintClient, setMaintClient] = useState('');
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTask || !maintClient) return;

    addTicket({
      type: 'TAREFA',
      title: `Manutenção Preventiva (${maintFreq}): ${maintTask}`,
      clientId: maintClient,
      date: maintDate,
      technician: 'A Definir',
      observations: `Agendamento baseado na NBR 5674.\nFrequência: ${maintFreq}\nTarefa: ${maintTask}`,
      status: 'PENDENTE_APROVACAO',
      maintenanceCategory: 'Preventiva',
      maintenanceSubcategory: maintFreq
    });

    setIsMaintenanceAdding(false);
    setMaintTask('');
    setMaintClient('');
  };

  const generateGoogleCalendarLink = (event: any) => {
    const start = new Date(event.start).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(event.end).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const eventTitle = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.resource.notes || '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${start}/${end}&details=${details}`;
  };

  const downloadICS = (event: any) => {
    const start = new Date(event.start).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(event.end).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.resource.notes || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Map tickets to calendar events
  const ticketEvents = tickets.map(t => {
    const client = clients.find(c => c.id === t.clientId);
    const osPrefix = t.type === 'TAREFA' ? 'Tarefa: ' : (t.osNumber ? `${t.osNumber} - ` : 'OS: ');
    return {
      id: `ticket-${t.id}`,
      title: `${osPrefix}${client?.name || 'Desconhecido'}`,
      start: new Date(t.date + 'T08:00:00'),
      end: new Date(t.date + 'T18:00:00'),
      allDay: true,
      resource: { 
        type: 'TICKET', 
        originalId: t.id, 
        clientName: client?.name, 
        osNumber: t.osNumber, 
        maintenanceCategory: t.maintenanceCategory,
        ticketType: t.type
      }
    };
  });

  // Map appointments to calendar events
  const appointmentEvents = appointments.map(a => ({
    id: a.id,
    title: a.title,
    start: new Date(a.start),
    end: new Date(a.end),
    allDay: false,
    resource: { type: a.type, notes: a.notes }
  }));

  const allEvents = [...ticketEvents, ...appointmentEvents];
  
  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
    setEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
    setIsAdding(true);
    setSelectedEvent(null);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addAppointment({
      title,
      start: new Date(startDate).toISOString(),
      end: new Date(endDate).toISOString(),
      type,
      notes
    });

    setIsAdding(false);
    setTitle('');
    setNotes('');
  };

  const handleDelete = () => {
    if (selectedEvent && selectedEvent.resource.type !== 'TICKET') {
      deleteAppointment(selectedEvent.id);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = 'rgba(255, 255, 255, 0.1)';
    let border = '1px solid rgba(255, 255, 255, 0.2)';
    let glow = '0 0 15px rgba(255, 255, 255, 0.1)';
    
    if (event.resource.type === 'TICKET') {
      backgroundColor = calendarSettings.colors.TICKET;
      border = `1px solid ${calendarSettings.colors.TICKET.replace('0.4', '0.5')}`;
      glow = `0 4px 12px ${calendarSettings.colors.TICKET.replace('0.4', '0.3')}`;
    } else if (event.resource.type === 'MEETING') {
      backgroundColor = calendarSettings.colors.MEETING;
      border = `1px solid ${calendarSettings.colors.MEETING.replace('0.4', '0.5')}`;
      glow = `0 4px 12px ${calendarSettings.colors.MEETING.replace('0.4', '0.3')}`;
    } else if (event.resource.type === 'OTHER') {
      backgroundColor = calendarSettings.colors.OTHER;
      border = `1px solid ${calendarSettings.colors.OTHER.replace('0.4', '0.5')}`;
      glow = `0 4px 12px ${calendarSettings.colors.OTHER.replace('0.4', '0.3')}`;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '10px',
        opacity: 1,
        color: 'white',
        border,
        display: 'block',
        fontWeight: '600',
        padding: '4px 8px',
        fontSize: '0.75rem',
        backdropFilter: 'blur(12px)',
        boxShadow: glow,
        transition: 'all 0.2s ease',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }
    };
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center p-4 md:p-12 font-sans -m-8"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506784911079-5097f60bc8f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }}
    >
      {/* Heavy blur overlay for the background */}
      <div className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-xl" />

      {/* Main Container - Plastic Transparent Frosted Glass */}
      <div className="relative z-10 w-full max-w-[1400px] bg-gradient-to-br from-[#1a2b4c]/90 to-[#0f172a]/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 md:p-10 flex flex-col gap-8 overflow-hidden">
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] pointer-events-none" />

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10 border-b border-white/10 pb-8">
          <div className="flex items-center gap-8">
            <BackButton className="!bg-white/5 !border-white/5 !rounded-3xl hover:!bg-white/10" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/60">Intelligent Scheduling</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-none">Agenda</h1>
              <p className="text-lg text-white/40 mt-3 font-light max-w-md leading-relaxed">Compromissos e Ordens de Serviço sincronizados em tempo real.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSettingsOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white p-4 rounded-2xl border border-white/10 backdrop-blur-md transition-all shadow-xl"
              title="Configurações do Calendário"
            >
              <Settings className="w-6 h-6" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsMaintenanceAdding(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all rounded-2xl shadow-2xl font-black tracking-widest uppercase text-xs"
            >
              <Wrench className="w-5 h-5" /> 
              <span className="hidden sm:inline">Manutenção Preventiva</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setStartDate(new Date().toISOString().split('T')[0] + 'T09:00');
                setEndDate(new Date().toISOString().split('T')[0] + 'T10:00');
                setIsAdding(true);
                setSelectedEvent(null);
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all rounded-2xl shadow-2xl font-black tracking-widest uppercase text-xs"
            >
              <Plus className="w-5 h-5" /> 
              <span className="hidden sm:inline">Novo Compromisso</span>
            </motion.button>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-h-[700px] relative z-10 flex flex-col"
        >
        <style>{`
          .rbc-calendar { font-family: 'Inter', system-ui, sans-serif; border: none; color: white; }
          .rbc-month-view, .rbc-time-view, .rbc-header { border: none !important; }
          .rbc-month-view { 
            background: rgba(255, 255, 255, 0.03) !important; 
            border-radius: 30px !important; 
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            flex: 1 !important;
            width: 100% !important;
            backdrop-filter: blur(10px);
          }
          .rbc-month-row { 
            border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .rbc-month-row:first-of-type {
            border-top: none !important;
          }
          .rbc-day-bg { 
            border-left: 1px solid rgba(255, 255, 255, 0.05) !important; 
            background: transparent !important;
          }
          .rbc-day-bg:first-of-type {
            border-left: none !important;
          }
          .rbc-day-bg:hover { 
            background: rgba(255, 255, 255, 0.02) !important;
          }
          .rbc-today { background-color: rgba(59, 130, 246, 0.1) !important; }
          
          .rbc-header { 
            padding: 16px 0 !important; 
            font-size: 0.7rem !important; 
            font-weight: 800 !important; 
            color: rgba(255, 255, 255, 0.5) !important;
            background: rgba(255, 255, 255, 0.02) !important;
            border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            text-transform: uppercase;
            letter-spacing: 0.15em;
          }
          .rbc-header:first-of-type {
            border-left: none !important;
          }
          
          .rbc-month-header { border: none !important; }
          .rbc-date-cell { 
            padding: 12px !important; 
            font-size: 0.85rem !important; 
            font-weight: 700 !important;
            color: rgba(255, 255, 255, 0.8) !important;
          }
          .rbc-off-range { opacity: 0.2 !important; }
          .rbc-off-range-bg { background: rgba(0, 0, 0, 0.1) !important; }
          .rbc-today .rbc-date-cell { color: #3b82f6 !important; }

          .rbc-toolbar { display: none !important; }
          
          .rbc-event { 
            margin: 2px 6px !important;
            padding: 0 !important;
          }
          
          .rbc-event-content { padding: 0 !important; }
          
          .rbc-show-more { 
            font-weight: 900 !important; 
            font-size: 0.65rem !important; 
            color: #3b82f6 !important; 
            background: rgba(59, 130, 246, 0.1) !important;
            padding: 4px 10px !important;
            border-radius: 10px !important;
            margin-left: 8px !important;
            text-transform: uppercase;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }

          .rbc-time-view { 
            border-radius: 40px; 
            overflow: hidden; 
            border: none; 
            background: rgba(255, 255, 255, 0.03); 
            padding: 20px;
            backdrop-filter: blur(10px);
          }
          
          .rbc-time-header { border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; }
          .rbc-time-content { border: none !important; }
          .rbc-timeslot-group { border-bottom: 1px solid rgba(255, 255, 255, 0.02) !important; min-height: 100px; }
          .rbc-time-slot { border: none !important; }
          .rbc-day-slot { border-left: 1px solid rgba(255, 255, 255, 0.05) !important; }
          
          .rbc-label { color: rgba(255, 255, 255, 0.4) !important; font-size: 0.7rem !important; font-weight: 800 !important; text-transform: uppercase; letter-spacing: 0.1em; }
          
          .rbc-agenda-view {
            background: rgba(255, 255, 255, 0.03) !important;
            border-radius: 30px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .rbc-agenda-table { color: white !important; }
          .rbc-agenda-table thead > tr > th { border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; color: rgba(255, 255, 255, 0.5) !important; padding: 15px !important; }
          .rbc-agenda-table tbody > tr > td { border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; padding: 15px !important; }
          .rbc-overlay { background: rgba(15, 15, 15, 0.95) !important; backdrop-filter: blur(20px) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 20px !important; padding: 15px !important; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important; z-index: 1000 !important; }
          .rbc-overlay-header { border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; margin-bottom: 10px !important; padding-bottom: 5px !important; font-weight: bold !important; color: white !important; }
        `}</style>
        <BigCalendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture="pt-BR"
          view={view}
          onView={(v) => setView(v)}
          date={date}
          onNavigate={(d) => setDate(d)}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período."
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CalendarEvent,
            toolbar: CustomToolbar,
            month: {
              dateHeader: MonthDateHeader,
            },
          }}
        />
      </motion.div>

      {/* Add Appointment Modal */}
      <Modal 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)} 
        title="Novo Compromisso"
        maxWidth="sm"
        glass
      >
        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Título do Evento</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg placeholder:text-white/10"
              placeholder="Ex: Reunião de Planejamento"
              required
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Início</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={startDate.split('T')[0]}
                  onChange={(e) => setStartDate(`${e.target.value}T${startDate.split('T')[1] || '09:00'}`)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg"
                  required
                />
                <input 
                  type="time" 
                  value={startDate.split('T')[1]}
                  onChange={(e) => setStartDate(`${startDate.split('T')[0]}T${e.target.value}`)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Término</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={endDate.split('T')[0]}
                  onChange={(e) => setEndDate(`${e.target.value}T${endDate.split('T')[1] || '10:00'}`)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg"
                  required
                />
                <input 
                  type="time" 
                  value={endDate.split('T')[1]}
                  onChange={(e) => setEndDate(`${endDate.split('T')[0]}T${e.target.value}`)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Categoria</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg appearance-none cursor-pointer"
            >
              <option value="MEETING" className="bg-[#004a7c]">Reunião</option>
              <option value="OTHER" className="bg-[#004a7c]">Outro</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Observações</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg min-h-[120px] resize-none placeholder:text-white/10"
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4">
            <button 
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-8 py-4 text-white/40 hover:text-white font-black tracking-widest transition-all uppercase text-xs"
            >
              CANCELAR
            </button>
            <button 
              type="submit"
              className="bg-white/10 hover:bg-white/20 text-white px-12 py-4 rounded-2xl font-black tracking-widest border border-white/30 backdrop-blur-md transition-all active:scale-95 shadow-2xl"
            >
              SALVAR EVENTO
            </button>
          </div>
        </form>
      </Modal>

      {/* View Event Modal */}
      <Modal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        title="Detalhes do Evento"
        maxWidth="sm"
        glass
      >
        {selectedEvent && (
          <div className="space-y-10">
            <div className="flex items-start gap-6">
              <div className={`p-5 rounded-[2rem] shrink-0 shadow-2xl ${
                selectedEvent.resource.type === 'TICKET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                selectedEvent.resource.type === 'MEETING' ? 'bg-white/20 text-white border border-white/30' :
                'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                <CalendarIcon className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{selectedEvent.title}</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mt-3">
                  {selectedEvent.resource.type === 'TICKET' ? (selectedEvent.resource.ticketType === 'TAREFA' ? 'Tarefa' : 'Ordem de Serviço') : 
                   selectedEvent.resource.type === 'MEETING' ? 'Reunião' : 'Outro'}
                  {selectedEvent.resource.osNumber && ` • ${selectedEvent.resource.osNumber}`}
                  {selectedEvent.resource.maintenanceCategory && ` • ${selectedEvent.resource.maintenanceCategory}`}
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6 text-white/80 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
                <Clock className="w-8 h-8 text-white/20 shrink-0" />
                <div className="text-xl font-medium leading-tight">
                  {selectedEvent.allDay ? (
                    <span className="font-black tracking-widest uppercase text-sm text-white/40">Dia Inteiro</span>
                  ) : (
                    <div className="space-y-1">
                      <div>{format(selectedEvent.start, "dd/MM/yyyy 'às' HH:mm")}</div>
                      <div className="text-xs font-black uppercase tracking-widest text-white/20">até</div>
                      <div>{format(selectedEvent.end, "dd/MM/yyyy 'às' HH:mm")}</div>
                    </div>
                  )}
                </div>
              </div>

              {selectedEvent.resource.type === 'TICKET' && selectedEvent.resource.clientName && (
                <div className="flex items-center gap-6 text-white/80 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
                  <User className="w-8 h-8 text-white/20 shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/20 mb-1">Cliente</p>
                    <p className="text-xl font-bold">{selectedEvent.resource.clientName}</p>
                  </div>
                </div>
              )}

              {selectedEvent.resource.type === 'TICKET' && (
                <div className="flex items-center gap-6 text-white/80 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
                  <Wrench className="w-8 h-8 text-white/20 shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/20 mb-1">Ticket / OS</p>
                    <Link 
                      to={`/tickets/${selectedEvent.resource.originalId}`}
                      className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                    >
                      {selectedEvent.title} <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {selectedEvent.resource.notes && (
                <div className="flex items-start gap-6 text-white/80 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
                  <AlignLeft className="w-8 h-8 text-white/20 mt-1 shrink-0" />
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{selectedEvent.resource.notes}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href={generateGoogleCalendarLink(selectedEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 transition-all text-sm font-bold"
                >
                  <ExternalLink className="w-4 h-4" /> Google Calendar
                </a>
                <button 
                  onClick={() => downloadICS(selectedEvent)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 transition-all text-sm font-bold"
                >
                  <Download className="w-4 h-4" /> Outlook / Apple
                </button>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4">
              {selectedEvent.resource.type !== 'TICKET' && (
                <button 
                  onClick={handleDelete}
                  className="px-8 py-4 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl font-black tracking-widest uppercase text-xs border border-rose-500/20 transition-all"
                >
                  EXCLUIR
                </button>
              )}
              {selectedEvent.resource.type === 'TICKET' && (
                <button 
                  onClick={() => navigate(`/tickets/${selectedEvent.resource.originalId}`)}
                  className="px-8 py-4 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-2xl font-black tracking-widest uppercase text-xs border border-blue-500/20 transition-all"
                >
                  VER ORDEM
                </button>
              )}
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-12 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black tracking-widest uppercase text-xs border border-white/30 transition-all"
              >
                FECHAR
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title="Configurações do Calendário"
        maxWidth="sm"
        glass
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white/50">Cores dos Eventos</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-sm font-bold text-white">Ordens de Serviço</span>
                <input 
                  type="color" 
                  value={calendarSettings.colors.TICKET.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) ? 
                    '#' + calendarSettings.colors.TICKET.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)!.slice(1).map(x => parseInt(x).toString(16).padStart(2, '0')).join('') : '#3b82f6'}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    setCalendarSettings({
                      ...calendarSettings,
                      colors: { ...calendarSettings.colors, TICKET: `rgba(${r}, ${g}, ${b}, 0.4)` }
                    });
                  }}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
              
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-sm font-bold text-white">Reuniões</span>
                <input 
                  type="color" 
                  value={calendarSettings.colors.MEETING.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) ? 
                    '#' + calendarSettings.colors.MEETING.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)!.slice(1).map(x => parseInt(x).toString(16).padStart(2, '0')).join('') : '#10b981'}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    setCalendarSettings({
                      ...calendarSettings,
                      colors: { ...calendarSettings.colors, MEETING: `rgba(${r}, ${g}, ${b}, 0.4)` }
                    });
                  }}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>

              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-sm font-bold text-white">Outros Compromissos</span>
                <input 
                  type="color" 
                  value={calendarSettings.colors.OTHER.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) ? 
                    '#' + calendarSettings.colors.OTHER.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)!.slice(1).map(x => parseInt(x).toString(16).padStart(2, '0')).join('') : '#a855f7'}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    setCalendarSettings({
                      ...calendarSettings,
                      colors: { ...calendarSettings.colors, OTHER: `rgba(${r}, ${g}, ${b}, 0.4)` }
                    });
                  }}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="px-12 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black tracking-widest uppercase text-xs border border-white/30 transition-all"
            >
              FECHAR
            </button>
          </div>
        </div>
      </Modal>

      {/* Maintenance Scheduling Modal */}
      <Modal 
        isOpen={isMaintenanceAdding} 
        onClose={() => setIsMaintenanceAdding(false)} 
        title="Agendar Manutenção Preventiva"
        maxWidth="sm"
        glass
      >
        <form onSubmit={handleSaveMaintenance} className="space-y-8">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Agendamento baseado na <strong className="text-blue-300">NBR 5674</strong>. 
              Isso criará automaticamente uma Tarefa no sistema para a data selecionada.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Tarefa / Equipamento</label>
            <input 
              type="text" 
              value={maintTask}
              onChange={(e) => setMaintTask(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg placeholder:text-white/10"
              placeholder="Ex: Limpeza de Caixa d'Água"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Frequência (NBR 5674)</label>
            <select 
              value={maintFreq}
              onChange={(e) => setMaintFreq(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg appearance-none cursor-pointer"
            >
              <option value="MENSAL" className="bg-[#004a7c]">Mensal</option>
              <option value="BIMESTRAL" className="bg-[#004a7c]">Bimestral</option>
              <option value="TRIMESTRAL" className="bg-[#004a7c]">Trimestral</option>
              <option value="SEMESTRAL" className="bg-[#004a7c]">Semestral</option>
              <option value="ANUAL" className="bg-[#004a7c]">Anual</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Cliente / Local</label>
            <select 
              value={maintClient}
              onChange={(e) => setMaintClient(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-[#004a7c]">Selecione um cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id} className="bg-[#004a7c]">{client.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Data da Próxima Execução</label>
            <input 
              type="date" 
              value={maintDate}
              onChange={(e) => setMaintDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl px-6 py-4 outline-none transition-all text-white text-lg [color-scheme:dark]"
              required
            />
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4">
            <button 
              type="button"
              onClick={() => setIsMaintenanceAdding(false)}
              className="px-8 py-4 text-white/40 hover:text-white font-black tracking-widest transition-all uppercase text-xs"
            >
              CANCELAR
            </button>
            <button 
              type="submit"
              className="bg-white/20 hover:bg-white/30 text-white px-12 py-4 rounded-2xl font-black tracking-widest border border-white/30 backdrop-blur-md transition-all active:scale-95 shadow-2xl"
            >
              AGENDAR MANUTENÇÃO
            </button>
          </div>
        </form>
      </Modal>
      </div>
    </div>
  );
}
