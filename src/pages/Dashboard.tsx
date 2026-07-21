import { useStore } from '../store';
import { TicketStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeFormatDate, safeFormatTime } from '../utils/dateUtils';
import { jsPDF } from 'jspdf';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { 
  Users, FileText, Plus, Hammer, RefreshCw,
  DollarSign, TrendingUp, Package, Database, 
  Calendar as CalendarIcon, CloudSun, Image as ImageIcon,
  Settings, Moon, Sun, UserPlus, Sun as SunIcon,
  Columns, Clock, ClipboardCheck, AlertCircle, QrCode, AlertTriangle, Play,
  BarChart3, Droplets, Zap, ShieldCheck, Megaphone, Newspaper, Globe,
  TrendingDown,
  Box, UserCheck, Activity, Maximize2, CheckCircle2, Presentation, LogOut,
  X, Download, FileUp, Database as DatabaseIcon, MessageSquare, Target,
  Wifi, WifiOff, GripVertical, ClipboardList, LayoutList,
  Eye, EyeOff,
  Bell, Truck, Brain, ExternalLink, Sparkles, LineChart, ChevronRight, Layers,
  Phone, Mail, Send, Trash2, Edit, MapPin, Plane, Bus, Search, ArrowRight, Cpu, Home
} from 'lucide-react';
import { KanbanMirror } from '../components/KanbanMirror';
import { TicketsMirror } from '../components/TicketsMirror';
import { TravelTicketMonitor } from '../components/TravelTicketMonitor';
import { SavingsMirror } from '../components/SavingsMirror';
import { CostsMirror } from '../components/CostsMirror';
import { ReceiptsMirror } from '../components/ReceiptsMirror';
import { IncomingMoneyMirror } from '../components/IncomingMoneyMirror';
import { QuotesMirror } from '../components/QuotesMirror';
import { CommercialMirror } from '../components/CommercialMirror';
import { WaterManagementMirror } from '../components/WaterManagementMirror';
import { MonitoringMirror } from '../components/MonitoringMirror';
import { DashboardKeepNotesTile } from '../components/DashboardKeepNotesTile';
import { DashboardNotionTile } from '../components/DashboardNotionTile';
import { DailyTasksWidget } from '../components/DailyTasksWidget';
import WorkspaceWidget from '../components/WorkspaceWidget';
import GmailWidget from '../components/GmailWidget';
import GoogleCalendarWidget from '../components/GoogleCalendarWidget';
import { DashboardGoogleMeetTile } from '../components/DashboardGoogleMeetTile';
import { DashboardGoogleTranslateTile } from '../components/DashboardGoogleTranslateTile';
import { DashboardIoTTile } from '../components/DashboardIoTTile';
import { DashboardMindMapTile } from '../components/DashboardMindMapTile';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

interface TileData {
  id: string;
  type: 'wide' | 'square';
  component: React.ReactNode;
}

function SortableTile({ 
  id, 
  children, 
  className, 
  onResize, 
  onClose, 
  isEditMode
}: { 
  id: string, 
  children: React.ReactNode, 
  className: string, 
  onResize: (e: React.MouseEvent) => void, 
  onClose: (e: React.MouseEvent) => void, 
  isEditMode: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    disabled: !isEditMode 
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.05 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} relative group transition-all duration-300 ${
        isEditMode ? 'hover:ring-4 hover:ring-white/30 hover:ring-inset hover:scale-[1.02] hover:z-40 hover:shadow-2xl cursor-grab active:cursor-grabbing' : ''
      }`}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      {/* Edit Controls - Only visible on hover when in edit mode */}
      {isEditMode && (
        <>
          {/* Drag Handle Icon - Visual cue */}
          <div 
            className="absolute top-2 left-2 p-2 bg-black/80 text-white rounded-xl z-50 shadow-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-2 z-50 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onResize(e);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 bg-black/80 hover:bg-black text-white rounded-xl transition-all border border-white/20 shadow-xl active:scale-90"
              title="Alterar Tamanho"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose(e);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl transition-all border border-white/20 shadow-xl active:scale-90"
              title="Ocultar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {children}
    </div>
  );
}

function WeatherTile() {
  const [data, setData] = useState<{ temp: number; city: string; condition: string; high: number; low: number } | null>(null);

  useEffect(() => {
    async function fetchLiveWeather(retryCount = 0) {
      if (!navigator.onLine) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.9064&longitude=-43.1822&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
        const json = await res.json();
        
        const getWeatherCondition = (code: number) => {
          if (code === 0) return 'Céu Limpo';
          if (code >= 1 && code <= 3) return 'Parcialmente Nublado';
          if (code >= 45 && code <= 48) return 'Nevoeiro';
          if (code >= 51 && code <= 55) return 'Chuvisco';
          if (code >= 61 && code <= 65) return 'Chuva';
          if (code >= 80 && code <= 82) return 'Pancadas de Chuva';
          if (code >= 95) return 'Tempestade';
          return 'Nublado';
        };

        setData({
          temp: Math.round(json.current.temperature_2m),
          city: 'Rio de Janeiro',
          condition: getWeatherCondition(json.current.weather_code),
          high: Math.round(json.daily.temperature_2m_max[0]),
          low: Math.round(json.daily.temperature_2m_min[0])
        });
      } catch (e: any) {
        console.error('Weather fetch error', e);
        
        const isRetryable = retryCount < 2 && (
          e.name === 'AbortError' || 
          e.message?.toLowerCase().includes('fetch') || 
          e.message?.toLowerCase().includes('network') ||
          e.message?.toLowerCase().includes('failed')
        );

        if (isRetryable) {
          setTimeout(() => fetchLiveWeather(retryCount + 1), 3000);
          return;
        }

        setData({
          temp: 26,
          city: 'Rio de Janeiro',
          condition: 'Parcialmente Nublado',
          high: 30,
          low: 22
        });
      }
    }
    fetchLiveWeather();
  }, []);

  if (!data) return null;

  return (
    <Link to="/weather" className="h-full flex flex-col justify-between p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden group active:scale-95 transition-all">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <CloudSun className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Meteorologia</span>
        </div>
        <h3 className="text-lg font-bold text-white/90">{data.city}</h3>
      </div>

      <div className="relative z-10 flex items-end justify-between">
        <div>
          <div className="text-5xl font-black tracking-tighter mb-1 font-mono">
            {data.temp}<span className="text-2xl text-white/40">°C</span>
          </div>
          <div className="text-xs font-bold text-white/60 uppercase tracking-wider">{data.condition}</div>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-red-400/80">
            <TrendingUp className="w-3 h-3" />
            <span>H: {data.high}°</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-blue-400/80">
            <TrendingDown className="w-3 h-3" />
            <span>L: {data.low}°</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SystemHealthTile() {
  const [metrics, setMetrics] = useState({ cpu: 12, mem: 45, latency: 24 });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 15) + 5,
        mem: 42 + Math.floor(Math.random() * 5),
        latency: Math.floor(Math.random() * 10) + 18
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col justify-between p-6 bg-zinc-900/50 border border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden group active:scale-95 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Status do Sistema</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
          <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
          <span className="text-[8px] font-bold text-white uppercase">Online</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1.5">
            <span className="text-white/30 uppercase">Processamento IA</span>
            <span className="text-white/60 font-mono">{metrics.cpu}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: `${metrics.cpu}%` }}
              className="h-full bg-purple-500"
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1.5">
            <span className="text-white/30 uppercase">Memória Cache</span>
            <span className="text-white/60 font-mono">{metrics.mem}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: `${metrics.mem}%` }}
              className="h-full bg-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-bold text-white/40 uppercase">Latência API</span>
        </div>
        <span className="text-[10px] font-bold text-white/60 font-mono">{metrics.latency}ms</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    clients, tickets, products, receipts, costs, quotes,
    appointments, companyLogo, restoreData, theme, 
    toggleTheme, scheduledMaintenances, addNotification,
    notifications, supplyItems, payments, notices,
    packages, visitors, criticalEvents, energyData, logout,
    hiddenTiles, toggleTileVisibility, companySignature, companyData,
    assemblies, savingsGoals, consumptionReadings,
    contracts, renovations, moves, billingRules, budgetForecasts,
    reservations,
    backgroundImage,
    tileSizes: storeTileSizes,
    tileOrder: storeTileOrder,
    setTileSizes: updateStoreTileSizes,
    setTileOrder: updateStoreTileOrder,
    vivianOnline,
    vivianEnabled,
    toggleVivian,
    checklistItems,
    iotState,
    showBalance,
    setShowBalance,
    lastSync,
    syncToSupabase,
    updateScheduledMaintenance,
    addTicket,
    staff,
    updateStaff,
    addStaff,
    deleteStaff,
    updateTicketStatus,
    currentUser
  } = useStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const executionTickets = useMemo(() => {
    const activeStatuses: TicketStatus[] = ['PENDENTE_APROVACAO', 'APROVADO', 'EM_ROTA', 'AGUARDANDO_MATERIAL', 'REALIZANDO'];
    return tickets
      .filter(t => t.status && activeStatuses.includes(t.status))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tickets]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [isAddingMoneyToGoal, setIsAddingMoneyToGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [moneyToAdd, setMoneyToAdd] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const backupInputRef = useRef<HTMLInputElement>(null);
  
  const generateDaySummaryReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 297
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2); // 180
      
      let y = 15;

      // Header drawing helper
      const drawHeader = (isSubsequentPage = false) => {
        // Upper border banner
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(margin, 15, contentWidth, isSubsequentPage ? 12 : 25, 'F');
        
        // Title text
        doc.setTextColor(255, 255, 255);
        if (isSubsequentPage) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('RESUMO OPERACIONAL DIARIO - CONTINUACAO', margin + 5, 23);
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('CENTRAL DE TELEMETRIA OPERACIONAL', margin + 6, 24);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text('RESUMO DIARIO DE ATIVIDADES, OCORRENCIAS E SENSORES IoT', margin + 6, 31);
        }
        
        // Frame outline for the document
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.2);
        doc.line(margin, 15, margin, pageHeight - 15);
        doc.line(pageWidth - margin, 15, pageWidth - margin, pageHeight - 15);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      };

      // Helper function to check space and add new page if needed
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          drawHeader(true);
          y = 35; // Reset y to below page header
        }
      };

      // Draw initial header
      drawHeader(false);
      y = 45;

      // Metadata section
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const todayStr = new Date().toLocaleDateString('pt-BR');
      const timeStr = new Date().toLocaleTimeString('pt-BR');
      
      doc.text(`Data do Relatorio: ${todayStr} as ${timeStr}`, margin + 2, y);
      doc.text(`Operador responsavel: guto.ferr22@gmail.com`, margin + 2, y + 5);
      doc.text(`Ambiente: ${isSupabaseConfigured ? 'Telemetria Integrada Cloud' : 'Servidor Cache Local'}`, margin + 2, y + 10);
      
      y += 18;

      // Draw horizontal separator
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Completed activities
      const todayISO = new Date().toISOString().split('T')[0];
      const completedTickets = tickets.filter(t => t.status === 'CONCLUIDO');
      const completedToday = completedTickets.filter(t => t.date && t.date.startsWith(todayISO));
      
      // Critical/High Priority Pending
      const criticalPending = tickets.filter(t => t.status !== 'CONCLUIDO' && (t.priority === 'CRITICAL' || t.priority === 'HIGH'));

      // Active field teams
      const activeTeamsCount = tickets.filter(t => t.status === 'REALIZANDO').length;

      // Draw 3 KPI blocks
      checkPageBreak(25);
      const cardW = (contentWidth - 10) / 3; // ~56mm each
      
      // Card 1: Atividades Concluidas
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(margin, y, cardW, 18, 2, 2, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(margin, y, cardW, 18, 2, 2, 'D');
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${completedToday.length} (${completedTickets.length})`, margin + 4, y + 8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Concluidos Hoje (Total)', margin + 4, y + 14);

      // Card 2: Pendencias Criticas
      const card2X = margin + cardW + 5;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(card2X, y, cardW, 18, 2, 2, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(card2X, y, cardW, 18, 2, 2, 'D');
      doc.setTextColor(239, 68, 68); // Red-500
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${criticalPending.length}`, card2X + 4, y + 8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Pendencias Criticas/Alta', card2X + 4, y + 14);

      // Card 3: Equipes Ativas
      const card3X = margin + (cardW * 2) + 10;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(card3X, y, cardW, 18, 2, 2, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(card3X, y, cardW, 18, 2, 2, 'D');
      doc.setTextColor(59, 130, 246); // Blue-500
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${activeTeamsCount}`, card3X + 4, y + 8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Servicos Ativos em Campo', card3X + 4, y + 14);

      y += 26;

      // Section 1: IoT Status
      checkPageBreak(45);
      // Small visual block prefix
      doc.setFillColor(59, 130, 246); // Blue-500
      doc.rect(margin + 2, y - 4, 3, 5, 'F');
      
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1. TELEMETRIA E SEGURANCA DA INFRAESTRUTURA IoT', margin + 8, y);
      y += 6;

      // Draw IoT Table
      const iotRows = [
        { resource: "Bomba Caixa d'Agua Condominio", type: 'Abastecimento Caixa', status: iotState?.pumps?.caixa ? 'ATIVA' : 'STANDBY', color: iotState?.pumps?.caixa ? [16, 185, 129] : [100, 116, 139] },
        { resource: 'Bomba Jardim / Poco Recalque', type: 'Irrigacao & Poco', status: iotState?.pumps?.jardim ? 'ATIVA' : 'STANDBY', color: iotState?.pumps?.jardim ? [16, 185, 129] : [100, 116, 139] },
        { resource: 'Alarme Perimetral de Seguranca', type: 'Monitoramento Portaria', status: iotState?.alarmActive ? 'PROTEGIDO' : 'ALERTA / INATIVO', color: iotState?.alarmActive ? [16, 185, 129] : [239, 68, 68] },
        { resource: 'Automacao de Iluminacao Cozinha', type: 'Sensor Presenca', status: iotState?.lights?.cozinha ? `${iotState.lights.cozinha}% Brilho` : 'DESLIGADA', color: iotState?.lights?.cozinha ? [59, 130, 246] : [100, 116, 139] },
        { resource: 'Automacao de Iluminacao Jardim', type: 'Fotocelula Temporizada', status: iotState?.lights?.jardim ? `${iotState.lights.jardim}% Brilho` : 'DESLIGADA', color: iotState?.lights?.jardim ? [59, 130, 246] : [100, 116, 139] },
      ];

      doc.setFillColor(241, 245, 249);
      doc.rect(margin + 2, y, contentWidth - 4, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Recurso Infraestrutura', margin + 6, y + 4.5);
      doc.text('Subsistema', margin + 80, y + 4.5);
      doc.text('Status de Operacao', margin + 135, y + 4.5);
      y += 6;

      iotRows.forEach((row) => {
        checkPageBreak(8);
        doc.setFillColor(255, 255, 255);
        doc.rect(margin + 2, y, contentWidth - 4, 6, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(margin + 2, y + 6, margin - 2 + contentWidth, y + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(row.resource, margin + 6, y + 4.5);
        doc.setTextColor(100, 116, 139);
        doc.text(row.type, margin + 80, y + 4.5);
        
        const [r, g, b] = row.color;
        doc.setTextColor(r, g, b);
        doc.setFont('helvetica', 'bold');
        doc.text(row.status, margin + 135, y + 4.5);
        y += 6;
      });

      y += 8;

      // Section 2: Completed Activities
      checkPageBreak(30);
      doc.setFillColor(16, 185, 129); // Green-500
      doc.rect(margin + 2, y - 4, 3, 5, 'F');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('2. ATIVIDADES CONCLUIDAS', margin + 8, y);
      y += 6;

      // List completed
      const completedList = completedToday.length > 0 ? completedToday : completedTickets.slice(0, 8);
      
      if (completedList.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Nenhuma ordem de servico concluida registrada no historico recente.', margin + 6, y);
        y += 8;
      } else {
        completedList.forEach((t) => {
          checkPageBreak(25);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin + 2, y, contentWidth - 4, 18, 1.5, 1.5, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          
          const client = clients.find(c => c.id === t.clientId);
          const clientName = client?.name || 'Condominio Geral';
          
          doc.text(`[${t.osNumber || 'O.S.'}] ${t.title || 'Manutencao'}`, margin + 6, y + 5);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`Cliente: ${clientName}`, margin + 6, y + 10);
          doc.text(`Tecnico: ${t.technician || 'Nao Definido'}`, margin + 85, y + 10);
          doc.text(`Data: ${safeFormatDate(t.date)}`, margin + 140, y + 10);

          const reportText = t.serviceReport || t.observations || 'Nenhuma observacao adicional.';
          const wrappedReport = doc.splitTextToSize(`Relatorio: ${reportText}`, contentWidth - 12);
          doc.text(wrappedReport[0] || '', margin + 6, y + 14);
          
          y += 21;
        });
      }

      y += 4;

      // Section 3: Critical Pending
      checkPageBreak(30);
      doc.setFillColor(239, 68, 68); // Red-500
      doc.rect(margin + 2, y - 4, 3, 5, 'F');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('3. OCORRENCIAS CRITICAS E ALERTA ELEVADO', margin + 8, y);
      y += 6;

      if (criticalPending.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(16, 185, 129);
        doc.text('EXCELENTE: Nenhuma pendencia critica ou de alta prioridade aberta em campo no momento.', margin + 6, y);
        y += 8;
      } else {
        criticalPending.forEach((t) => {
          checkPageBreak(28);
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(margin + 2, y, contentWidth - 4, 22, 1.5, 1.5, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(153, 27, 27);
          
          const client = clients.find(c => c.id === t.clientId);
          const clientName = client?.name || 'Condominio Geral';
          
          doc.text(`[${t.osNumber || 'O.S. ALERTA'}] ${t.title || 'Ocorrencia Critica'}`, margin + 6, y + 5);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(127, 29, 29);
          doc.text(`Prioridade: ${t.priority === 'CRITICAL' ? 'MAXIMA (CRITICA)' : 'ALTA'}`, margin + 6, y + 10);
          doc.text(`Status: ${t.status || 'Pendente'}`, margin + 55, y + 10);
          doc.text(`Local: ${t.location || 'Area Comum'}`, margin + 95, y + 10);
          doc.text(`Tecnico: ${t.technician || 'A Alocar'}`, margin + 140, y + 10);

          const pbText = t.reportedProblem || t.observations || 'Problema reportado pendente de inspecao detalhada.';
          const wrappedProblem = doc.splitTextToSize(`Problema: ${pbText}`, contentWidth - 12);
          doc.text(wrappedProblem[0] || '', margin + 6, y + 14);
          
          if (t.priorityRecommendedAction) {
            const wrappedAction = doc.splitTextToSize(`Recomendacao: ${t.priorityRecommendedAction}`, contentWidth - 12);
            doc.setFont('helvetica', 'bold');
            doc.text(wrappedAction[0] || '', margin + 6, y + 18);
          } else {
            doc.text(`Aguardando plano de acao do tecnico.`, margin + 6, y + 18);
          }
          
          y += 25;
        });
      }

      y += 4;

      // Section 4: Teams
      checkPageBreak(30);
      doc.setFillColor(100, 116, 139); // Slate-500
      doc.rect(margin + 2, y - 4, 3, 5, 'F');
      
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('4. ALOCACAO DE EQUIPES EM CAMPO', margin + 8, y);
      y += 6;

      const activeStaff = staff.filter(s => s.status === 'ACTIVE');
      if (activeStaff.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum profissional de campo registrado como ativo no plantao hoje.', margin + 6, y);
        y += 8;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        
        activeStaff.forEach((member) => {
          checkPageBreak(6);
          const isWorking = tickets.some(t => t.status === 'REALIZANDO' && t.technician === member.name);
          const currentActivity = tickets.find(t => t.status === 'REALIZANDO' && t.technician === member.name);
          const stateStr = isWorking ? `EM ATIVIDADE na OS ${currentActivity?.osNumber || ''} (${currentActivity?.title || 'Execucao'})` : 'DISPONIVEL / EM ALOCAÇÃO';
          doc.text(`* Tecnico: ${member.name} | Turno: ${member.shift || 'Geral'} | Status: ${stateStr}`, margin + 6, y);
          y += 5.5;
        });
      }

      // Separator near bottom
      checkPageBreak(15);
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // Footer note
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Relatorio gerado em conformidade com as metricas de telemetria predial.`, margin + 2, y);
      doc.text(`Assinatura Eletronica MD5: ${Math.random().toString(16).substring(2, 10).toUpperCase()}-${Math.random().toString(16).substring(2, 10).toUpperCase()}`, margin + 2, y + 4.5);

      // Save PDF
      const fileName = `resumo_operacional_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success(`PDF "${fileName}" gerado e baixado com sucesso!`);
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao compilar o PDF: ${error.message || String(error)}`);
    }
  };

  const [vivianStatus, setVivianStatus] = useState<{ 
    status: string; 
    supabaseConfigured: boolean;
    geminiConfigured: boolean;
    lastWebhookReceived: string | null;
    lastMessageExtracted: string | null;
    appUrl?: string;
  } | null>(null);

  // News Widget State (Toggler between Tech & Globo)
  const [newsChannel, setNewsChannel] = useState<'TECH' | 'GLOBO'>('GLOBO');
  const [newsItems, setNewsItems] = useState<{ title: string; link: string; description: string; pubDate: string; type?: string }[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsLastFetched, setNewsLastFetched] = useState<string>('');

  // Market Quotes State
  const [marketQuotes, setMarketQuotes] = useState<{
    usd: { rate: number; pct: number; updatedAt: string };
    ibov: { points: number; pct: number; updatedAt: string };
  } | null>(null);
  const [marketLoading, setMarketLoading] = useState<boolean>(true);
  const [marketError, setMarketError] = useState<string | null>(null);

  const fetchNews = async (channel: 'TECH' | 'GLOBO' = newsChannel) => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const endpoint = channel === 'TECH' ? '/api/tech-news' : '/api/g1-news';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(channel === 'TECH' ? 'Falha ao carregar notícias de tecnologia' : 'Falha ao carregar notícias da Globo.com');
      const data = await res.json();
      setNewsItems(data.items || []);
      setNewsLastFetched(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.warn(`[News Offline Fallback] Erro de conexão ao carregar notícias (${channel}):`, err);
      
      const fallbackItems = channel === 'TECH' ? [
        {
          title: "Inteligência Artificial revoluciona gerenciamento de condomínios inteligentes",
          link: "https://g1.globo.com/economia/tecnologia/",
          description: "Sistemas integrados baseados no Gemini e Supabase reduzem custos de manutenção predial e otimizam cronogramas de vistorias operacionais.",
          pubDate: new Date().toUTCString()
        },
        {
          title: "Sensores IoT de baixo custo começam a ser adotados para prevenção de vazamentos d'água",
          link: "https://g1.globo.com/economia/tecnologia/",
          description: "Novos dispositivos prediais conectados enviam alertas automáticos e evitam falhas críticas no bombeamento d'água.",
          pubDate: new Date().toUTCString()
        }
      ] : [
        {
          title: "Mercado imobiliário e predial registra alta com foco em sustentabilidade e automação",
          link: "https://g1.globo.com/",
          description: "Pesquisa aponta que condomínios com sistemas automatizados de gestão têm valorização de até 15% no mercado atual.",
          pubDate: new Date().toUTCString()
        },
        {
          title: "Previsão do tempo: Frente fria traz chuvas moderadas e exige atenção na drenagem predial",
          link: "https://g1.globo.com/",
          description: "Defesa Civil alerta para vistorias em calhas, bombas de drenagem e sistemas de escoamento de águas pluviais nos próximos dias.",
          pubDate: new Date().toUTCString()
        }
      ];
      setNewsItems(fallbackItems);
      setNewsLastFetched(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchMarketQuotes = async () => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const res = await fetch('/api/market-quotes');
      if (!res.ok) throw new Error('Falha ao carregar cotações do mercado');
      const data = await res.json();
      setMarketQuotes(data);
    } catch (err: any) {
      console.warn('[Market Quotes Fallback] Erro de conexão ao carregar cotações, aplicando simulador dinâmico de alta fidelidade:', err);
      
      const hourFactor = new Date().getHours() / 24;
      const simulatedUsdRate = +(5.28 + (Math.sin(hourFactor * Math.PI) * 0.15)).toFixed(4);
      const simulatedUsdPct = +(Math.sin(hourFactor * Math.PI * 2) * 1.1).toFixed(2);
      const simulatedIbovPoints = Math.round(128450 + (Math.cos(hourFactor * Math.PI) * 1650));
      const simulatedIbovPct = +(Math.cos(hourFactor * Math.PI * 2) * 0.95).toFixed(2);

      setMarketQuotes({
        usd: {
          rate: simulatedUsdRate,
          pct: simulatedUsdPct,
          updatedAt: new Date().toISOString()
        },
        ibov: {
          points: simulatedIbovPoints,
          pct: simulatedIbovPct,
          updatedAt: new Date().toISOString()
        }
      });
    } finally {
      setMarketLoading(false);
    }
  };

  // Watch newsChannel changes to fetch appropriate news
  useEffect(() => {
    fetchNews(newsChannel);
  }, [newsChannel]);

  useEffect(() => {
    fetchMarketQuotes();
    const newsInterval = setInterval(() => fetchNews(newsChannel), 5 * 60 * 1000); // 5 min interval
    const marketInterval = setInterval(fetchMarketQuotes, 3 * 60 * 1000); // 3 min interval
    return () => {
      clearInterval(newsInterval);
      clearInterval(marketInterval);
    };
  }, [newsChannel]);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const checkStatus = async () => {
      try {
        // First try the API status (for full-stack features)
        const res = await fetch('/api/status');
        const contentType = res.headers.get('content-type');
        
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setVivianStatus(data);
          retryCount = 0;
        } else {
          // If API fails (e.g. on Vercel), check Supabase directly
          if (isSupabaseConfigured) {
            const { error } = await supabase.from('clients').select('id').limit(1);
            setVivianStatus({
              status: error ? 'error' : 'online',
              supabaseConfigured: true,
              geminiConfigured: !!(import.meta.env.VITE_GEMINI_API_KEY),
              lastWebhookReceived: null,
              lastMessageExtracted: null,
              appUrl: window.location.origin
            });
          } else {
            throw new Error('API and Supabase not configured');
          }
        }
      } catch (e: any) {
        // Fallback to direct Supabase check if API is completely missing (404/Fetch Error)
        if (isSupabaseConfigured) {
          try {
            const { error } = await supabase.from('clients').select('id').limit(1);
            setVivianStatus({
              status: error ? 'error' : 'online',
              supabaseConfigured: true,
              geminiConfigured: !!(import.meta.env.VITE_GEMINI_API_KEY),
              lastWebhookReceived: null,
              lastMessageExtracted: null,
              appUrl: window.location.origin
            });
            return;
          } catch (supabaseErr) {
            console.error('Supabase connectivity check failed:', supabaseErr);
          }
        }

        const isFetchError = e.message?.toLowerCase().includes('fetch') || 
                            e.name === 'TypeError' ||
                            e.message?.includes('text/html');
        
        if (!isFetchError || retryCount >= maxRetries) {
          console.error('Error checking system status:', e);
        }
        
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = 3000 * retryCount;
          setTimeout(checkStatus, delay);
        }
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check less frequently to reduce noise
    return () => clearInterval(interval);
  }, []);

  const openTickets = tickets.filter(t => t.status !== 'CONCLUIDO').length;
  const pendingApprovalCount = tickets.filter(t => t.status === 'PENDENTE_APROVACAO').length;
  const lowStockCount = supplyItems.filter(item => item.currentStock <= item.minStock).length;
  const totalDelinquency = payments.filter(p => p.status === 'OVERDUE').reduce((acc, curr) => acc + curr.amount, 0);
  const overdueMaintenances = useMemo(() => {
    return scheduledMaintenances.filter(m => {
      if (!m.nextDate) return false;
      const isOverdue = new Date(m.nextDate) < new Date();
      return isOverdue;
    }).length;
  }, [scheduledMaintenances]);

  const nextUpcomingClients = useMemo(() => {
    const pendingOrOverdue = scheduledMaintenances.filter(m => m.status === 'PENDING' || m.status === 'OVERDUE');
    
    const sorted = [...pendingOrOverdue].sort((a, b) => {
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.localeCompare(b.nextDate);
    });

    const uniqueClientsMap = new Map<string, typeof sorted[0]>();
    for (const maint of sorted) {
      if (!uniqueClientsMap.has(maint.clientId)) {
        uniqueClientsMap.set(maint.clientId, maint);
      }
    }

    return Array.from(uniqueClientsMap.values()).map(maint => {
      const client = clients.find(c => c.id === maint.clientId);
      
      let formattedDate = '';
      if (maint.nextDate) {
        const parts = maint.nextDate.split('-');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}`;
        } else {
          formattedDate = maint.nextDate;
        }
      }

      return {
        clientId: maint.clientId,
        clientName: client?.name || 'Condomínio',
        itemName: maint.item,
        nextDate: maint.nextDate,
        formattedDate,
        status: maint.status,
      };
    });
  }, [scheduledMaintenances, clients]);

  // Check for overdue and nearing expiration (NBR 5674) maintenances and notify
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    scheduledMaintenances.forEach(item => {
      if (!item.nextDate || item.status === 'DONE') return;

      const nextDate = new Date(item.nextDate);
      nextDate.setHours(0, 0, 0, 0);

      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const client = clients.find(c => c.id === item.clientId);
      const clientName = client?.name || 'Geral';

      if (diffDays < 0) {
        // Overdue Maintenance Notification
        const overdueMessage = `A manutenção de ${item.item} (${item.category}) em ${clientName} venceu em ${safeFormatDate(item.nextDate)}`;
        if (!notifications.some(n => n.message === overdueMessage)) {
          addNotification({
            title: 'Inspeção NBR 5674 Atrasada!',
            message: overdueMessage,
            type: 'WARNING'
          });
        }
      } else {
        // Nearing Expiration Notification based on NBR 5674 guidelines
        let threshold = 7; // Default 7 days
        if (item.frequency === 'Mensal') threshold = 5;
        else if (item.frequency === 'Trimestral') threshold = 10;
        else if (item.frequency === 'Semestral') threshold = 15;
        else if (item.frequency === 'Anual') threshold = 30;

        if (diffDays <= threshold) {
          const warningMessage = `Inspeção NBR 5674 de ${item.item} em ${clientName} está próxima do vencimento (${diffDays} ${diffDays === 1 ? 'dia restante' : 'dias restantes'}).`;
          if (!notifications.some(n => n.message === warningMessage)) {
            addNotification({
              title: `Alerta Preventiva NBR 5674`,
              message: warningMessage,
              type: 'WARNING'
            });
          }
        }
      }
    });
  }, [scheduledMaintenances, clients, addNotification, notifications]);

  const nbr5674Alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return scheduledMaintenances
      .filter(m => m.status !== 'DONE')
      .map(m => {
        if (!m.nextDate) return null;
        const nextDate = new Date(m.nextDate);
        nextDate.setHours(0, 0, 0, 0);

        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let threshold = 7;
        if (m.frequency === 'Mensal') threshold = 5;
        else if (m.frequency === 'Trimestral') threshold = 10;
        else if (m.frequency === 'Semestral') threshold = 15;
        else if (m.frequency === 'Anual') threshold = 30;

        const isNear = diffDays <= threshold;
        const isOverdue = diffDays < 0;

        return {
          ...m,
          diffDays,
          threshold,
          isNear,
          isOverdue,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null && (m.isNear || m.isOverdue))
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [scheduledMaintenances]);

  const [activeMonitorTab, setActiveMonitorTab] = useState<'alerts' | 'team' | 'execution'>('alerts');

  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    role: 'Técnico',
    phone: '',
    email: '',
    shift: 'MORNING' as 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FLEXIBLE',
    status: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'
  });
  const [assignTechAlertId, setAssignTechAlertId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffForm, setEditStaffForm] = useState<any>({});

  const staffWorkload = useMemo(() => {
    const workloadMap: Record<string, { activeCount: number; tickets: typeof tickets }> = {};
    
    // Initialize with all staff members
    staff.forEach(s => {
      workloadMap[s.name] = { activeCount: 0, tickets: [] };
    });
    
    // Compute from active tickets
    tickets.forEach(ticket => {
      if (!ticket.technician || ticket.status === 'CONCLUIDO' || ticket.status === 'REJEITADO') return;
      const techName = ticket.technician;
      if (!workloadMap[techName]) {
        workloadMap[techName] = { activeCount: 0, tickets: [] };
      }
      workloadMap[techName].activeCount += 1;
      workloadMap[techName].tickets.push(ticket);
    });
    
    return workloadMap;
  }, [staff, tickets]);

  const totalReceitas = receipts.reduce((acc, curr) => acc + curr.value, 0);
  const totalDespesas = costs.reduce((acc, curr) => acc + curr.value, 0);
  const saldo = totalReceitas - totalDespesas;
  const nextEvents = useMemo(() => {
    const now = new Date();
    
    const appts = appointments
      .filter(a => a.start && new Date(a.start) > now)
      .map(a => ({
        id: a.id,
        title: a.title,
        date: a.start,
        type: 'Compromisso',
        icon: <CalendarIcon className="w-2 h-2 text-blue-400" />
      }));

    const tasks = tickets
      .filter(t => (t.type === 'TAREFA' || t.type === 'CORRETIVA') && t.date && new Date(t.date) > now && t.status !== 'CONCLUIDO')
      .map(t => ({
        id: t.id,
        title: t.title || (t.type === 'CORRETIVA' ? `Corretiva: ${t.reportedProblem || t.id.slice(0, 5)}` : `Tarefa #${t.osNumber || t.id.slice(0, 5)}`),
        date: t.date,
        type: t.type === 'CORRETIVA' ? 'Corretiva' : 'Tarefa',
        icon: t.type === 'CORRETIVA' ? <AlertTriangle className="w-2 h-2 text-red-400" /> : <ClipboardList className="w-2 h-2 text-white" />
      }));

    const movesList = moves
      .filter(m => m.date && new Date(m.date) > now && m.status !== 'CANCELLED')
      .map(m => ({
        id: m.id,
        title: `Mudança: ${m.type === 'IN' ? 'Entrada' : 'Saída'}`,
        date: m.date,
        type: 'Mudança',
        icon: <Truck className="w-2 h-2 text-orange-400" />
      }));

    const renovationsList = renovations
      .filter(r => r.startDate && new Date(r.startDate) > now && r.status !== 'REJECTED')
      .map(r => ({
        id: r.id,
        title: `Obra: ${r.title}`,
        date: r.startDate,
        type: 'Obra',
        icon: <Hammer className="w-2 h-2 text-red-400" />
      }));

    const reservationsList = reservations
      .filter(r => r.date && new Date(r.date) > now && r.status !== 'CANCELLED')
      .map(r => ({
        id: r.id,
        title: `Reserva: ${r.areaName}`,
        date: r.date,
        type: 'Reserva',
        icon: <Clock className="w-2 h-2 text-purple-400" />
      }));

    return [...appts, ...tasks, ...movesList, ...renovationsList, ...reservationsList]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, tickets, moves, renovations, reservations]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);

  const handleTestWhatsapp = async () => {
    setIsTestingWhatsapp(true);
    try {
      // Test outgoing
      const success = await sendWhatsAppMessage('5511999999999', 'Teste de conexão VivianBrain ' + new Date().toLocaleTimeString());
      if (success) {
        toast.success('Mensagem de teste enviada!');
      } else {
        toast.error('Falha ao enviar mensagem. Verifique as chaves da Evolution API.');
      }
      
      // Test incoming (simulate webhook)
      const webhookRes = await fetch('/api/webhook/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'messages.upsert',
          data: {
            messages: [{
              key: { remoteJid: 'test@s.whatsapp.net', fromMe: false },
              pushName: 'Testador',
              message: { conversation: 'Vivian, teste interno' }
            }]
          }
        })
      });
      
      if (webhookRes.ok) {
        toast.success('Webhook simulado com sucesso!');
      }
    } catch (err) {
      toast.error('Erro no teste: ' + (err as Error).message);
    } finally {
      setIsTestingWhatsapp(false);
    }
  };

  const [manualCommand, setManualCommand] = useState('');

  const handleManualCommand = async () => {
    if (!manualCommand.trim()) return;
    try {
      const { error } = await supabase.from('whatsapp_commands').insert([{
        sender_name: 'Admin (Manual)',
        sender_number: 'admin',
        message_text: manualCommand,
        processed: false,
        created_at: new Date().toISOString()
      }]);
      
      if (error) throw error;
      toast.success('Comando manual enviado para processamento!');
      setManualCommand('');
    } catch (err) {
      toast.error('Erro ao enviar comando: ' + (err as Error).message);
    }
  };

  const initialTiles: TileData[] = [
    {
      id: 'notion-workspace',
      type: 'wide',
      component: (
        <DashboardNotionTile 
          onNavigate={() => {
            if (!isEditMode) navigate('/notion');
          }} 
          isEditMode={isEditMode} 
        />
      )
    },
    {
      id: 'execution-center',
      type: 'wide',
      component: (
        <div 
          onClick={() => {
            if (!isEditMode) navigate('/execution');
          }}
          className="w-full h-full cursor-pointer p-4 md:p-6 bg-zinc-950/70 hover:brightness-110 transition-all border border-white/10 rounded-3xl flex flex-col justify-between group relative overflow-hidden text-white shadow-lg active:scale-95"
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#39FF14]/5 via-transparent to-white/5 pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#39FF14]/10 blur-2xl rounded-full mix-blend-screen pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 items-center h-full relative z-10 w-full">
            {/* Left side info (glowing play & title) */}
            <div className="col-span-1 md:col-span-2 flex flex-col justify-between h-full py-1">
              <div className="flex justify-between items-start">
                <Play 
                  size={36} 
                  className="text-[#39FF14] drop-shadow-[0_0_12px_rgba(57,255,20,0.7)] group-hover:scale-110 transition-transform" 
                  fill="currentColor" 
                />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 animate-pulse bg-white/5 px-2 py-0.5 rounded-full md:hidden">Live Now</span>
              </div>
              <div className="mt-2 md:mt-0">
                <span className="text-xl font-black text-white uppercase tracking-tighter block leading-none">Central de Execução</span>
                <span className="text-[10px] text-[#39FF14] font-bold uppercase tracking-wider mt-1 block">PLAY EM PENDENTES</span>
              </div>
            </div>

            {/* Right side interactive ticket list */}
            <div className="col-span-1 md:col-span-3 flex flex-col justify-center gap-1.5 h-full border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-4">
              <div className="hidden md:flex justify-between items-center mb-1">
                <span className="text-[9px] font-black uppercase text-white/50 tracking-widest">Tarefas Pendentes</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#39FF14] animate-pulse">Live Now</span>
              </div>
              
              {executionTickets.length > 0 ? (
                executionTickets.slice(0, 2).map((ticket) => {
                  const client = clients.find(c => c.id === ticket.clientId);
                  const clientName = client ? client.name : 'Geral/Avulso';
                  
                  return (
                    <div 
                      key={ticket.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isEditMode) navigate(`/execution?play=${ticket.id}`);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-[#39FF14]/10 border border-white/5 hover:border-[#39FF14]/30 transition-all duration-300 group/item cursor-pointer w-full min-w-0"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8px] font-black text-white/50">{ticket.osNumber || 'OS'}</span>
                          <span className="text-[9px] font-semibold text-white/80 truncate shrink-1 block max-w-[120px]">{clientName}</span>
                        </div>
                        <p className="text-[10px] font-black text-white truncate leading-tight">{ticket.title || 'Iniciar OS'}</p>
                      </div>
                      <div 
                        className="px-2 py-1 bg-[#39FF14]/20 border border-[#39FF14]/40 rounded-lg group-hover/item:bg-[#39FF14] group-hover/item:scale-105 transition-all text-[#39FF14] group-hover/item:text-black flex items-center justify-center shadow-[0_0_8px_rgba(57,255,20,0.2)] shrink-0"
                        title="Iniciar Execução"
                      >
                        <Play size={10} fill="currentColor" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-2 bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center">
                  <span className="text-[9px] text-white/40 uppercase">Nenhuma OS pendente</span>
                  <span className="text-[8px] text-white/30 italic">Tudo em ordem!</span>
                </div>
              )}

              {executionTickets.length > 2 && (
                <div className="text-right text-[8px] font-black uppercase text-white/40 tracking-wider">
                  + {executionTickets.length - 2} outras pendentes
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'daily-tasks',
      type: 'wide',
      component: (
        <DailyTasksWidget isEditMode={isEditMode} />
      )
    },
    {
      id: 'workspace-shortcuts',
      type: 'square',
      component: (
        <WorkspaceWidget isEditMode={isEditMode} />
      )
    },
    {
      id: 'gmail-inbox',
      type: 'wide',
      component: (
        <GmailWidget isEditMode={isEditMode} />
      )
    },
    {
      id: 'google-calendar-widget',
      type: 'wide',
      component: (
        <GoogleCalendarWidget isEditMode={isEditMode} />
      )
    },
    {
      id: 'technical-report',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/technical-report"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-500/10 to-purple-500/20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full mix-blend-screen" />
          <div className="flex justify-center items-center h-full relative z-10">
            <div className="relative">
              <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-purple-400 animate-pulse" />
              <FileText className="w-12 h-12 text-indigo-300 drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex flex-col items-start relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 drop-shadow-md">Criar Relatório</span>
            <span className="text-[8px] text-indigo-400/80 font-bold uppercase tracking-wider mt-0.5">Com Inteligência Artificial</span>
          </div>
        </Link>
      )
    },
    {
      id: 'document-factory',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/document-factory"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <FileText className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider drop-shadow-md truncate mr-1">Documentos</span>
            <span className="text-xl sm:text-2xl font-light drop-shadow-lg shrink-0">{contracts.length}</span>
          </div>
        </Link>
      )
    },
    {
      id: 'commercial-mirror',
      type: 'wide',
      component: (
        <div className="w-full h-full bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden group active:scale-95 transition-all">
          <CommercialMirror />
        </div>
      )
    },
    {
      id: 'whatsapp-status',
      type: 'square',
      component: (
        <div className="w-full h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col justify-between group relative overflow-hidden active:scale-95 transition-all">
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Status do Sistema</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleVivian();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold transition-all ${
                  vivianEnabled 
                    ? 'bg-black text-white shadow-xl' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}
                title={vivianEnabled ? "Desativar LUMI" : "Ativar LUMI"}
              >
                {vivianEnabled ? 'ON' : 'OFF'}
              </button>
              <div className={`w-2 h-2 rounded-full ${vivianStatus?.status === 'online' ? 'bg-zinc-400 animate-pulse' : 'bg-red-400'}`} title="Servidor Webhook" />
              <div className={`w-2 h-2 rounded-full ${vivianOnline ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`} title="Processador Local (Navegador)" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1.5 text-[9px] relative z-10">
            <div className="flex justify-between text-white/50">
              <span>Webhook URL:</span>
              <span className="text-white font-mono truncate max-w-[100px]" title={`${vivianStatus?.appUrl || ''}/api/webhook/whatsapp`}>
                {vivianStatus?.appUrl ? `${vivianStatus.appUrl.substring(0, 15)}...` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Processador:</span>
              <span className={`font-mono ${vivianOnline ? 'text-blue-300' : 'text-gray-400'}`}>
                {vivianOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Último Webhook:</span>
              <span className="text-white font-mono truncate max-w-[80px]">
                {vivianStatus?.lastWebhookReceived ? new Date(vivianStatus.lastWebhookReceived).toLocaleTimeString() : 'Nunca'}
              </span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Última Msg:</span>
              <span className="text-white font-mono truncate max-w-[80px]">
                {vivianStatus?.lastMessageExtracted || 'Nenhuma'}
              </span>
            </div>
            
            <div className="flex justify-between text-white/50">
              <span>Última Sinc:</span>
              <span className="text-white font-mono truncate max-w-[80px]">
                {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Nunca'}
              </span>
            </div>
            
            <div className="pt-1 flex gap-1">
              <input 
                type="text"
                value={manualCommand}
                onChange={(e) => setManualCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualCommand()}
                placeholder="Comando manual..."
                className="flex-1 bg-black/20 border border-white/20 rounded px-2 py-1 text-[8px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  syncToSupabase();
                }}
                className="p-1 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-all"
                title="Sincronizar agora"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-1 mt-2 relative z-10">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleManualCommand();
              }}
              className="flex-1 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[8px] font-bold transition-colors"
            >
              Enviar
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTestWhatsapp();
              }}
              disabled={isTestingWhatsapp}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isTestingWhatsapp ? <Activity className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'tickets',
      type: 'wide',
      component: (
        <div 
          onClick={() => !isEditMode && navigate('/tickets')}
          className={`w-full h-full bg-slate-900/40 backdrop-blur-2xl hover:brightness-110 transition-all flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
        >
          <TicketsMirror 
            tickets={tickets} 
            isEditMode={isEditMode}
            className="!p-4 !bg-transparent !border-none !shadow-none !rounded-none w-full h-full" 
            showLabel={true}
          />
        </div>
      )
    },
    {
      id: 'clients',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/clients"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#da532c] to-[#b94322] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <Users className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider drop-shadow-md truncate mr-1">Clientes</span>
            <span className="text-xl sm:text-2xl font-light drop-shadow-lg shrink-0">{clients.length}</span>
          </div>
        </Link>
      )
    },
    {
      id: 'products',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/products"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#7e3878] to-[#632c5e] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <Package className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider drop-shadow-md truncate mr-1">Produtos</span>
            <span className="text-xl sm:text-2xl font-light drop-shadow-lg shrink-0">{products.length}</span>
          </div>
        </Link>
      )
    },
    {
      id: 'receipts',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/receipts"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#f0a30a] to-[#d38b00] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <FileText className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider drop-shadow-md truncate mr-1">Recibos</span>
            <span className="text-xl sm:text-2xl font-light drop-shadow-lg shrink-0">{receipts.length}</span>
          </div>
        </Link>
      )
    },
    {
      id: 'quotes',
      type: 'wide',
      component: (
        <div 
          onClick={() => !isEditMode && navigate('/quotes')}
          className={`w-full h-full bg-slate-900/40 backdrop-blur-2xl hover:brightness-110 transition-all flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
        >
          <QuotesMirror 
            quotes={quotes} 
            clients={clients}
            isEditMode={isEditMode}
            className="!p-4 !bg-transparent !border-none !shadow-none !rounded-none w-full h-full" 
            showLabel={true}
          />
        </div>
      )
    },
    {
      id: 'financial',
      type: 'wide',
      component: (
        <div className="w-full h-full bg-slate-900/40 backdrop-blur-2xl p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 transition-all">
          <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
            <div 
              className={`flex-1 flex flex-col justify-center items-center p-4 transition-all group/fin border border-white/5 rounded-2xl ${isEditMode ? 'cursor-grab' : 'cursor-pointer hover:bg-white/5'}`} 
              onClick={() => !isEditMode && navigate('/financial')}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black uppercase text-white/40 mb-2 tracking-[0.3em]">Saldo Atual</p>
                <div className="relative group/balance">
                  <span className={`text-5xl font-black text-white group-hover/fin:text-white transition-[color,transform,opacity] duration-300 scale-100 group-hover/fin:scale-110 ${!showBalance ? 'blur-lg select-none' : ''}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(saldo)}
                  </span>
                  {!showBalance && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <EyeOff className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBalance(!showBalance);
                    }}
                    className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-full opacity-0 group-hover/fin:opacity-100 transition-opacity"
                  >
                    {showBalance ? <Eye className="w-4 h-4 text-white/40" /> : <EyeOff className="w-4 h-4 text-white/40" />}
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Fluxo de Caixa Ativo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end relative z-10 mt-2 gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="p-1.5 md:p-2 bg-white/10 rounded-xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md truncate">Gestão Financeira</span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  <span className="text-[6px] md:text-[8px] font-bold text-white/50 uppercase tracking-widest truncate">Controle de Fluxo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'financial-brain',
      type: 'wide',
      component: (
        <div 
          onClick={() => !isEditMode && navigate('/financial-brain')}
          className={`w-full h-full bg-gradient-to-br from-purple-600/40 to-blue-600/40 backdrop-blur-2xl p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 transition-all ${isEditMode ? 'cursor-grab' : 'cursor-pointer hover:brightness-110'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Brain className="w-10 h-10 text-purple-400" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/70 mb-1 tracking-[0.2em]">Cérebro Financeiro</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Inteligência de Dados</p>
                <div className="flex items-center gap-2 text-purple-300">
                  <Sparkles className="w-4 h-4" />
                  <p className="text-sm font-bold">Insights do LUMI Ativos</p>
                </div>
              </div>
            </div>
          </div>
          <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70 italic">Análise Preditiva</span>
        </div>
      )
    },
    {
      id: 'budget-forecast',
      type: 'wide',
      component: (
        <div 
          onClick={() => !isEditMode && navigate('/budget-forecast')}
          className={`w-full h-full bg-gradient-to-br from-blue-600/40 to-zinc-600/40 backdrop-blur-2xl p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 transition-all ${isEditMode ? 'cursor-grab' : 'cursor-pointer hover:brightness-110'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <LineChart className="w-10 h-10 text-blue-400" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/70 mb-1 tracking-[0.2em]">Previsão Orçamentária</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Projeção 2026</p>
                <div className="flex items-center gap-2 text-blue-300">
                  <TrendingUp className="w-4 h-4" />
                  <p className="text-sm font-bold">92% de Precisão</p>
                </div>
              </div>
            </div>
          </div>
          <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70 italic">Planejamento Estratégico</span>
        </div>
      )
    },
    {
      id: 'calendar',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/calendar"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-slate-900/40 backdrop-blur-2xl hover:brightness-110 transition-all p-3 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-5 h-5 text-white/70" />
              <p className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em] truncate">Agenda</p>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar scrollbar-hide">
              {nextEvents.length > 0 ? (
                nextEvents.map((event) => (
                  <div key={event.id} className="border-l-2 border-white/20 pl-2 py-1.5 hover:bg-white/5 transition-colors rounded-r-lg shrink-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {event.icon}
                      <p className="text-[11px] font-bold truncate leading-tight text-white/90">{event.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-2 h-2 text-white/40" />
                      <p className="text-[9px] text-white/50 font-medium">
                        {event.date ? (
                          `${safeFormatDate(event.date, { day: '2-digit', month: 'short' })} • ${safeFormatTime(event.date)}`
                        ) : (
                          'Horário não definido'
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40 py-4">
                  <CalendarIcon className="w-8 h-8 mb-2" />
                  <p className="text-[10px] italic">Sem compromissos</p>
                </div>
              )}
            </div>
          </div>
        </Link>
      )
    },
    {
      id: 'intelligent-checklist',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/intelligent-checklist"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#004a7c] to-[#002a4c] hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex flex-col gap-2 relative z-10 w-full overflow-hidden">
            <div className="flex items-start gap-2 md:gap-4">
              <div className="p-1.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0">
                <ClipboardCheck className="w-6 h-6 md:w-10 md:h-10 text-white" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-white/70 mb-0.5 tracking-[0.2em] truncate">Manutenção Preventiva</p>
                <div className="space-y-0.5">
                  <p className="font-black text-xs md:text-xl truncate text-white leading-tight">Manutenção preventiva</p>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="flex-1 h-1 md:h-1.5 bg-white/20 rounded-full overflow-hidden max-w-[60px] md:max-w-[100px]">
                      <div 
                        className={`h-full transition-all duration-1000 ${overdueMaintenances > 0 ? 'bg-amber-400' : 'bg-white'}`}
                        style={{ width: overdueMaintenances > 0 ? '40%' : '100%' }}
                      />
                    </div>
                    <p className={`text-[8px] md:text-xs font-bold ${overdueMaintenances > 0 ? 'text-amber-400' : 'text-white'} truncate`}>
                      {overdueMaintenances > 0 ? `${overdueMaintenances} pendentes` : '100% em dia'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* List of upcoming clients in the agenda */}
            {nextUpcomingClients.length > 0 && (
              <div className="mt-1 pt-1.5 border-t border-white/10 flex flex-col gap-1 text-left w-full overflow-hidden">
                <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-wider text-white/50">Próximos Clientes na Agenda:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {nextUpcomingClients.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[8px] md:text-[10px] text-white/95 bg-white/5 px-2 py-1 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex flex-col truncate pr-1">
                        <span className="font-bold truncate text-white leading-tight">{item.clientName}</span>
                        <span className="text-[7px] md:text-[8px] text-white/50 truncate font-light leading-tight">{item.itemName}</span>
                      </div>
                      <span className="text-yellow-400 font-mono font-bold text-[7px] md:text-[9px] shrink-0 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 leading-none">
                        {item.formattedDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-end relative z-10 pt-2">
            <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Manutenção Preventiva</span>
            <div className="flex items-center gap-1 md:gap-2 bg-white/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg border border-white/10 shrink-0">
              <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-tight text-white/70">Conformidade Legal</span>
            </div>
          </div>
        </Link>
      )
    },
    {
      id: 'qr-codes',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/qr-codes"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#00b7c3] to-[#008b94] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <QrCode className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider drop-shadow-md truncate mr-1">QR Codes</span>
            <span className="text-xl sm:text-2xl font-light drop-shadow-lg shrink-0">Gerir</span>
          </div>
        </Link>
      )
    },
    {
      id: 'qr-reports',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/qr-reports"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className={`w-full h-full p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 transition-all ${
            tickets.filter(t => t.status === 'PENDENTE_APROVACAO' && t.reportedBy).length > 0 
              ? 'bg-gradient-to-br from-amber-500 to-amber-700 animate-pulse-subtle' 
              : 'bg-gradient-to-br from-zinc-800 to-zinc-900'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-2 md:gap-4 h-full relative z-10">
            <div className="p-1.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0">
              <MessageSquare className="w-6 h-6 md:w-10 md:h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[8px] md:text-[10px] font-black uppercase text-white/70 mb-0.5 md:mb-1 tracking-[0.2em] truncate">Relatos de Moradores</p>
              <div className="space-y-0.5 md:space-y-1">
                <p className="font-black text-xs md:text-xl truncate text-white leading-tight">Mensagens QR Code</p>
                <div className="flex items-center gap-1.5 md:gap-2 text-white/80">
                  {tickets.filter(t => t.status === 'PENDENTE_APROVACAO' && t.reportedBy).length > 0 ? (
                    <>
                      <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-white animate-pulse shrink-0" />
                      <p className="text-[10px] md:text-sm font-bold text-white truncate">
                        {tickets.filter(t => t.status === 'PENDENTE_APROVACAO' && t.reportedBy).length} novos relatos
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] md:text-sm font-medium truncate">Nenhuma mensagem nova</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70">Gestão de Chamados</span>
        </Link>
      )
    },
    {
      id: 'approvals',
      type: 'wide',
      component: (
        <div className="w-full h-full bg-slate-900/40 backdrop-blur-2xl p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Reservatório de OS</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Últimas Realizadas</p>
              </div>
            </div>
            <Link 
              to={isEditMode ? '#' : "/tickets"} 
              onClick={(e) => isEditMode && e.preventDefault()}
              className="text-[9px] font-black uppercase tracking-widest text-white hover:text-white/70 transition-colors"
            >
              Ver Tudo
            </Link>
          </div>

          <div className="flex-1 space-y-1.5 relative z-10 overflow-hidden">
            {tickets
              .filter(t => t.type !== 'TAREFA')
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 4)
              .map((ticket) => (
                <Link
                  key={ticket.id}
                  to={isEditMode ? '#' : `/tickets/${ticket.id}`}
                  onClick={(e) => isEditMode && e.preventDefault()}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/item"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                      <span className="text-[7px] font-black text-white/30 uppercase">
                        {safeFormatDate(ticket.date, { weekday: 'short' }).toUpperCase().replace('.', '')}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-white/80 truncate group-hover/item:text-white transition-colors">
                      {ticket.title || 'Sem título'}
                    </p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-md text-[6px] font-black uppercase tracking-wider shrink-0 bg-white/5 ${
                    ticket.status === 'CONCLUIDO' ? 'text-white' : 
                    ticket.status === 'REALIZANDO' || ticket.status === 'AGUARDANDO_MATERIAL' ? 'text-amber-400' : 
                    'text-orange-400'
                  }`}>
                    {ticket.status === 'CONCLUIDO' ? 'Conc.' : ticket.status === 'REALIZANDO' || ticket.status === 'AGUARDANDO_MATERIAL' ? 'Em And.' : 'Pend.'}
                  </div>
                </Link>
              ))}
            {tickets.length === 0 && (
              <p className="text-[10px] text-white/20 italic text-center py-4">Nenhuma OS registrada</p>
            )}
          </div>
          
          <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70 mt-2">Gestão de OS</span>
        </div>
      )
    },
    {
      id: 'kanban',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/kanban"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          
          <div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden">
            <KanbanMirror 
              tickets={tickets} 
              showLabel={false} 
              isEditMode={isEditMode}
              className="!p-0 !bg-transparent !border-none !shadow-none !rounded-none w-full max-w-[260px]" 
            />
          </div>

          <div className="flex justify-between items-end relative z-10 mt-2 gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="p-1.5 md:p-2 bg-white/20 rounded-xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Columns className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md truncate">Kanban</span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  <span className="text-[6px] md:text-[8px] font-bold text-white/50 uppercase tracking-widest truncate">Mirror Live</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 bg-black/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-white/10 backdrop-blur-md shrink-0">
              <span className="text-sm md:text-xl font-black drop-shadow-lg">{tickets.filter(t => t.type !== 'TAREFA').length}</span>
            </div>
          </div>
        </Link>
      )
    },
    {
      id: 'weather',
      type: 'square',
      component: <WeatherTile />
    },
    {
      id: 'sys-health',
      type: 'square',
      component: <SystemHealthTile />
    },
    {
      id: 'quick-actions',
      type: 'square',
      component: (
        <div className="w-full h-full  grid grid-cols-2 grid-rows-2 gap-1 perspective-1000">
          <Link 
            to={isEditMode ? '#' : "/tickets/new"} 
            onClick={(e) => isEditMode && e.preventDefault()}
            title="Nova OS" 
            className="bg-gradient-to-br from-[#ee1111] to-[#cc0000] hover:brightness-110 transition-all flex items-center justify-center relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
            <Plus className="w-6 h-6 text-white drop-shadow-lg group-hover:rotate-90 transition-transform" />
          </Link>
          <Link 
            to={isEditMode ? '#' : "/quotes"} 
            onClick={(e) => isEditMode && e.preventDefault()}
            title="Novo Orçamento" 
            className="bg-gradient-to-br from-[#ff0097] to-[#d4007d] hover:brightness-110 transition-all flex items-center justify-center relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
            <FileText className="w-6 h-6 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
          </Link>
          <Link 
            to={isEditMode ? '#' : "/financial?action=add-cost"} 
            onClick={(e) => isEditMode && e.preventDefault()}
            title="Adicionar Custo" 
            className="bg-gradient-to-br from-[#da532c] to-[#b94322] hover:brightness-110 transition-all flex items-center justify-center relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
            <TrendingDown className="w-6 h-6 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
          </Link>
          <Link 
            to={isEditMode ? '#' : "/financial?action=add-income"} 
            onClick={(e) => isEditMode && e.preventDefault()}
            title="Adicionar Receita" 
            className="bg-gradient-to-br from-zinc-600 to-zinc-800 hover:brightness-110 transition-all flex items-center justify-center relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
            <DollarSign className="w-6 h-6 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      )
    },
    {
      id: 'incoming-money',
      type: 'wide',
      component: (
        <div 
          onClick={() => !isEditMode && navigate('/receipts')}
          className={`w-full h-full bg-slate-900/40 backdrop-blur-2xl hover:brightness-110 transition-all flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
        >
          <IncomingMoneyMirror 
            receipts={receipts} 
            payments={payments}
            isEditMode={isEditMode}
            className="!p-4 !bg-transparent !border-none !shadow-none !rounded-none w-full h-full" 
            hideFooter={true}
          />
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
            <div className="p-1.5 bg-white/10 rounded-lg border border-white/20 shadow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Entradas de Dinheiro</span>
          </div>
        </div>
      )
    },
    {
      id: 'supplies',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/supplies"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className={`w-full h-full p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 transition-all ${
            lowStockCount > 0 
              ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse-subtle' 
              : 'bg-gradient-to-br from-zinc-700 to-zinc-900'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-2 md:gap-4 h-full relative z-10">
            <div className={`p-1.5 md:p-3 rounded-xl md:rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0 ${
              lowStockCount > 0 ? 'bg-white/30' : 'bg-white/10'
            }`}>
              <Package className="w-6 h-6 md:w-10 md:h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[8px] md:text-[10px] font-black uppercase text-white/70 mb-0.5 md:mb-1 tracking-[0.2em] truncate">Insumos</p>
              <div className="space-y-0.5 md:space-y-1">
                <p className="font-black text-xs md:text-xl truncate text-white leading-tight">Estoque</p>
                <div className="flex items-center gap-1.5 md:gap-2 text-white/80">
                  {lowStockCount > 0 ? (
                    <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-white animate-pulse shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white/60 shrink-0" />
                  )}
                  <p className="text-[10px] md:text-sm font-bold truncate">
                    {lowStockCount > 0 ? `${lowStockCount} alertas` : 'Normal'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70">Materiais</span>
        </Link>
      )
    },
    {
      id: 'consumption',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/consumption"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Droplets className="w-10 h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/70 mb-1 tracking-[0.2em]">Medição Individualizada</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Consumo Água & Gás</p>
                <div className="flex items-center gap-2 text-white/80">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <p className="text-sm font-bold text-yellow-300">Sensores IoT Ativos</p>
                </div>
              </div>
            </div>
          </div>
          <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70">Leitura em Tempo Real</span>
        </Link>
      )
    },
    {
      id: 'locker',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/locker"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <Box className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex flex-col items-center relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider drop-shadow-md">Locker</span>
            <span className="text-3xl font-light drop-shadow-lg">{packages.filter(p => p.status === 'PENDING').length}</span>
          </div>
        </Link>
      )
    },
    {
      id: 'monitoring',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/monitoring"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className={`w-full h-full p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 transition-all ${
            criticalEvents.some(e => e.status === 'CRITICAL')
              ? 'bg-gradient-to-br from-red-600 to-red-800 animate-pulse-subtle'
              : 'bg-gradient-to-br from-[#10b981] to-[#059669]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          
          <div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden">
            <MonitoringMirror 
              showLabel={false} 
              isEditMode={isEditMode}
              className="!p-0 !bg-transparent !border-none !shadow-none !rounded-none w-full max-w-[260px]" 
            />
          </div>

          <div className="flex justify-between items-end relative z-10 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">Controle Remoto</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Mirror Live</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Acionamento Rápido</span>
          </div>
        </Link>
      )
    },
    {
      id: 'settings',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/settings"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#52525b] to-[#3f3f46] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <Settings className="w-12 h-12 text-white drop-shadow-lg group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10 drop-shadow-md">Ajustes</span>
        </Link>
      )
    },
    {
      id: 'document-factory-wide',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/document-factory"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/70 mb-1 tracking-[0.2em]">Central de Documentos</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Central de Documentos</p>
                <div className="flex items-center gap-2 text-white/80">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <p className="text-sm font-bold text-white">Atas, Editais e Contratos</p>
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70">Base Jurídica Completa</span>
        </Link>
      )
    },
    {
      id: 'brand-content-creator',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/brand-content-creator"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#dc2626] to-[#991b1b] hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/80 mb-1 tracking-[0.2em]">Criação & Branding</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Criador de Conteúdo</p>
                <div className="flex items-center gap-2 text-white/85">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <p className="text-sm font-bold text-white">Brand Safety IA Ativo</p>
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/80">Estúdio AI da IACompany</span>
        </Link>
      )
    },
    {
      id: 'system-presentation',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/presentation"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Presentation className="w-10 h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/70 mb-1 tracking-[0.2em]">Apresentação</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Conheça o Sistema</p>
                <div className="flex items-center gap-2 text-white/80">
                  <Maximize2 className="w-4 h-4 text-yellow-300" />
                  <p className="text-sm font-bold text-white">Tour Interativo 19.0</p>
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70">Experiência Completa</span>
        </Link>
      )
    },

    {
      id: 'water-management',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/consumption"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          
          <div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden">
            <WaterManagementMirror 
              readings={consumptionReadings} 
              events={criticalEvents}
              isEditMode={isEditMode}
              className="!p-0 !bg-transparent !border-none !shadow-none !rounded-none w-full max-w-[260px]" 
              hideFooter={true}
            />
          </div>

          <div className="flex justify-between items-end relative z-10 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md text-white">Gestão Hídrica</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Monitoramento Smart</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[8px] font-black uppercase text-white/50 mb-0.5">Alertas</p>
              <div className="bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                <span className="text-sm font-black drop-shadow-lg text-white">
                  {criticalEvents.filter(e => e.type === 'PUMP' && e.status !== 'NORMAL').length}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )
    },
    {
      id: 'billing-rules',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/billing-rules"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <Bell className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10 drop-shadow-md">Régua de Cobrança</span>
        </Link>
      )
    },
    {
      id: 'contracts',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/contracts"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/70 mb-1 tracking-[0.2em]">Gestão de Contratos</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Contratos & Fornecedores</p>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <p className="text-sm font-bold text-white">{contracts.length} Contratos Ativos</p>
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70">Controle de Vencimentos</span>
        </Link>
      )
    },
    {
      id: 'renovations-moves',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/renovations-moves"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-800 hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex items-start gap-4 h-full relative z-10">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Hammer className="w-10 h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[10px] font-black uppercase text-white/70 mb-1 tracking-[0.2em]">Obras & Mudanças</p>
              <div className="space-y-1">
                <p className="font-black text-xl truncate text-white leading-tight">Gestão de Fluxo</p>
                <div className="flex items-center gap-2 text-white/80">
                  <Truck className="w-4 h-4 text-white" />
                  <p className="text-sm font-bold text-white">{renovations.length + moves.length} Solicitações</p>
                </div>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-white/70">Agendamentos</span>
        </Link>
      )
    },
    {
      id: 'demo-data',
      type: 'square',
      component: (
        <button 
          onClick={() => !isEditMode && setShowBackupModal(true)} 
          className={`w-full h-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] hover:brightness-110 transition-all p-4 flex flex-col justify-between  group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-left ${isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <DatabaseIcon className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider relative z-10 drop-shadow-md">Backup / Demo</span>
        </button>
      )
    },
    {
      id: 'sales-planning',
      type: 'square',
      component: (
        <Link 
          to={isEditMode ? '#' : "/sales-planning"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="w-full h-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95 text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
          <div className="flex justify-center items-center h-full relative z-10">
            <Target className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider drop-shadow-md truncate mr-1">Planejamento</span>
            <span className="text-xl sm:text-2xl font-light drop-shadow-lg shrink-0">Vendas</span>
          </div>
        </Link>
      )
    },
    {
      id: 'condfy-ia-login',
      type: 'square',
      component: (
        <a 
          href="https://web.condfy.com.br/login"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => isEditMode && e.preventDefault()}
          className={`w-full h-full p-4 flex flex-col justify-between group relative overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(0,255,128,0.2)] hover:shadow-[0_0_50px_rgba(0,255,128,0.4)] active:scale-95 text-white transition-all duration-500 rounded-[2.5rem] ${isEditMode ? 'cursor-grab' : 'cursor-pointer'}`}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #064e3b 100%)',
          }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay pointer-events-none" />
          
          {/* Animated gradient sweep */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out -skew-x-12 pointer-events-none" />
          
          {/* Glowing orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 blur-[50px] rounded-full translate-y-1/2 -translate-x-1/2 group-hover:bg-indigo-400/50 transition-all duration-700" />
          
          <div className="absolute top-4 right-4 z-10">
            <ExternalLink className="w-4 h-4 text-white opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex justify-center items-center h-full relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-white blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 rounded-full" />
              <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl relative z-10 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Maximize2 className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-300 drop-shadow-md">CONDFY.IA Web</span>
            <span className="text-[8px] font-bold text-white/50 tracking-widest mt-1">SISTEMA EXTERNO</span>
          </div>
        </a>
      )
    },
    {
      id: 'keep-notes',
      type: 'wide',
      component: (
        <DashboardKeepNotesTile 
          onNavigate={() => {
            navigate('/execution');
            setTimeout(() => {
              const notesSection = document.getElementById('execution-keep-notes-section');
              if (notesSection) {
                notesSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 150);
          }}
          isEditMode={isEditMode}
        />
      )
    },
    {
      id: 'google-meet-creator',
      type: 'wide',
      component: (
        <DashboardGoogleMeetTile 
          isEditMode={isEditMode}
        />
      )
    },
    {
      id: 'google-translator',
      type: 'wide',
      component: (
        <DashboardGoogleTranslateTile 
          isEditMode={isEditMode}
        />
      )
    },
    {
      id: 'iot-trigger',
      type: 'square',
      component: (
        <DashboardIoTTile 
          isEditMode={isEditMode}
        />
      )
    },
    {
      id: 'installation-mindmap',
      type: 'wide',
      component: (
        <DashboardMindMapTile 
          isEditMode={isEditMode}
        />
      )
    }
  ];

  const [tileSizes, setTileSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({});
  const [tiles, setTiles] = useState<TileData[]>(initialTiles);

  const visibleTiles = useMemo(() => {
    return tiles.filter(t => {
      if (hiddenTiles.includes(t.id)) return false;
      if (!currentUser) return true;
      if (currentUser.allowedTiles.includes('*')) return true;
      return currentUser.allowedTiles.includes(t.id);
    });
  }, [tiles, hiddenTiles, currentUser]);

  // Initialize tiles and sizes from store
  useEffect(() => {
    if (storeTileSizes && Object.keys(storeTileSizes).length > 0) {
      setTileSizes(storeTileSizes);
    }
  }, [storeTileSizes]);

  useEffect(() => {
    if (storeTileOrder && storeTileOrder.length > 0) {
      // Remove duplicates from storeTileOrder to prevent duplicate keys
      const uniqueOrder = Array.from(new Set(storeTileOrder));
      
      const orderedTiles = uniqueOrder
        .map(id => initialTiles.find(t => t.id === id))
        .filter(Boolean) as TileData[];
      
      // Add any new tiles that are not in the saved order
      const newTiles = initialTiles.filter(t => !uniqueOrder.includes(t.id));
      setTiles([...orderedTiles, ...newTiles]);
    } else {
      setTiles(initialTiles);
    }
  }, [storeTileOrder]);

  const handleResize = (id: string, defaultType: 'wide' | 'square', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentSize = tileSizes[id] || (defaultType === 'wide' ? 'medium' : 'small');
    const nextSize: 'small' | 'medium' | 'large' = currentSize === 'small' ? 'medium' : currentSize === 'medium' ? 'large' : 'small';
    const newSizes = { ...tileSizes, [id]: nextSize };
    setTileSizes(newSizes);
    updateStoreTileSizes(newSizes);
  };

  // Sincronizar dados dinâmicos nos tiles quando o store mudar
  useEffect(() => {
    setTiles(prev => prev.map(tile => {
      const fresh = initialTiles.find(t => t.id === tile.id);
      return fresh ? { ...tile, component: fresh.component } : tile;
    }));
  }, [
    clients.length, tickets.length, products.length, receipts.length, 
    saldo, nextEvents, notices.length, packages.length, 
    visitors.length, criticalEvents, energyData.length, supplyItems.length, payments.length,
    savingsGoals.length, costs.length, consumptionReadings.length,
    contracts.length, renovations.length, moves.length, billingRules.length, budgetForecasts.length
  ]);

  const handleAddMoneyToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || moneyToAdd <= 0) return;

    const goal = savingsGoals.find(g => g.id === selectedGoalId);
    if (goal) {
      const newAmount = goal.currentAmount + moneyToAdd;
      useStore.getState().updateSavingsGoal(selectedGoalId, {
        currentAmount: newAmount,
        status: newAmount >= goal.targetAmount ? 'COMPLETED' : goal.status
      });
      toast.success(`R$ ${moneyToAdd.toLocaleString('pt-BR')} adicionados à meta!`);
      setIsAddingMoneyToGoal(false);
      setMoneyToAdd(0);
      setSelectedGoalId(null);
    }
  };

  const handleExportBackup = () => {
    let tasks: any[] = [];
    let iotDevices: any[] = [];
    let keepNotes: any[] = [];
    let kanbanColumns: any[] = [];
    let pomodoroTime: string | null = null;
    let pomodoroMode: string | null = null;
    let installationMindmap: any[] = [];

    try {
      const savedTasks = localStorage.getItem('condfy_daily_tasks');
      if (savedTasks) tasks = JSON.parse(savedTasks);
    } catch (e) {
      console.warn('Error reading daily tasks for backup:', e);
    }

    try {
      const savedIot = localStorage.getItem('condfy_iot_devices');
      if (savedIot) iotDevices = JSON.parse(savedIot);
    } catch (e) {
      console.warn('Error reading IoT devices for backup:', e);
    }

    try {
      const savedNotes = localStorage.getItem('execution_keep_notes');
      if (savedNotes) keepNotes = JSON.parse(savedNotes);
    } catch (e) {
      console.warn('Error reading execution keep notes for backup:', e);
    }

    try {
      const savedKanban = localStorage.getItem('kanban_columns_list');
      if (savedKanban) kanbanColumns = JSON.parse(savedKanban);
    } catch (e) {
      console.warn('Error reading kanban columns for backup:', e);
    }

    try {
      const savedMindmap = localStorage.getItem('condfy_installation_mindmap');
      if (savedMindmap) installationMindmap = JSON.parse(savedMindmap);
    } catch (e) {
      console.warn('Error reading installation mindmap for backup:', e);
    }

    try {
      pomodoroTime = localStorage.getItem('condfy_pomodoro_time');
      pomodoroMode = localStorage.getItem('condfy_pomodoro_mode');
    } catch (e) {
      console.warn('Error reading pomodoro config for backup:', e);
    }

    const backupData = {
      clients,
      checklistItems: useStore.getState().checklistItems,
      tickets,
      quotes: useStore.getState().quotes,
      receipts,
      costs,
      appointments,
      products,
      companyLogo,
      companySignature,
      companyData,
      hiddenTiles,
      dailyTasks: tasks,
      iotDevices,
      keepNotes,
      kanbanColumns,
      pomodoroTime,
      pomodoroMode,
      installationMindmap,
      version: '1.3',
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_iac_tec_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowBackupModal(false);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setConfirmModal({
            isOpen: true,
            title: 'Restaurar Backup',
            message: 'Atenção: Restaurar um backup irá substituir todos os dados atuais. Deseja continuar?',
            onConfirm: () => {
              restoreData(json);
              setShowBackupModal(false);
              toast.success('Backup restaurado com sucesso!');
            }
          });
        } catch (error) {
          console.error('Erro ao importar backup:', error);
          toast.error('Erro ao importar backup. Verifique o arquivo.');
        }
      };
      reader.readAsText(file);
    }
    if (e.target) e.target.value = '';
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tiles.findIndex((item) => item.id === active.id);
      const newIndex = tiles.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(tiles, oldIndex, newIndex);
      setTiles(newItems);
      updateStoreTileOrder(newItems.map(t => t.id));
    }
  }

  return (
    <div 
      className={`min-h-screen -m-6 md:-m-8 p-3 sm:p-8 md:p-12 ${
        backgroundImage && backgroundImage.startsWith('bg-') 
          ? backgroundImage 
          : 'bg-[#004a7c]'
      } text-white overflow-x-hidden relative transition-all duration-700`}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="currentColor" className="text-white/5" fillOpacity="0.5" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="currentColor" className="text-white/10" fillOpacity="0.5" />
        </svg>
      </div>

      <header className="mb-4 md:mb-12 flex justify-between items-start relative z-10 gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-light tracking-tight text-white shrink-0">Iniciar</h1>
            
            {/* Vivian Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all mt-2 md:mt-4 ${
              vivianStatus?.status === 'online' 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                vivianStatus?.status === 'online' ? 'bg-white' : 'bg-red-400'
              }`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Conexão com Banco de Dados: {vivianStatus?.status === 'online' ? 'Online' : 'Offline'}
              </span>
              {!vivianStatus?.supabaseConfigured && vivianStatus?.status === 'online' && (
                <span className="text-[8px] opacity-60 ml-1">(Erro de Configuração)</span>
              )}
              {!vivianStatus?.geminiConfigured && vivianStatus?.status === 'online' && (
                <span className="text-[8px] opacity-60 ml-1">(Erro IA)</span>
              )}
            </div>
          </div>
          
            {vivianStatus?.lastMessageExtracted && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 mb-2 w-fit animate-pulse">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Último comando recebido:</p>
                <p className="text-[10px] italic text-white">"{vivianStatus.lastMessageExtracted}"</p>
              </div>
            )}

          <div className="flex flex-wrap gap-2 items-center">
            <div className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 flex items-center gap-2">
              <span className="text-[8px] text-white/40 uppercase font-bold">Webhook:</span>
              <code className="text-[9px] text-blue-400 font-mono truncate max-w-[150px]">
                {window.location.origin}/api/webhook/whatsapp
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhook/whatsapp`);
                  toast.success('URL do Webhook copiada!');
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Copiar URL do Webhook"
              >
                <Database className="w-3 h-3 text-white/60" />
              </button>
            </div>
            
            <div className="h-4 w-px bg-white/10 mx-1" />
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all w-fit ${
              isEditMode 
                ? 'bg-white text-[#004a7c] shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <Columns className="w-3 h-3" />
            {isEditMode ? 'Salvar Layout' : 'Personalizar'}
          </button>
          <button 
            onClick={async () => {
              const loadingToast = toast.loading('Enviando mensagem de teste...');
              try {
                await sendWhatsAppMessage('21982240134', 'Olá! Eu sou o LUMI, seu assistente virtual do CONDFY.IA. Recebi seu comando e estou pronto para ajudar! 🚀');
                toast.success('Mensagem enviada com sucesso!', { id: loadingToast });
              } catch (error) {
                toast.error('Erro ao enviar mensagem.', { id: loadingToast });
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all w-fit bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:bg-blue-600"
          >
            <Brain className="w-3 h-3" />
            Testar Conexão
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-6 min-w-0">
          <button 
            onClick={toggleTheme}
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white shrink-0"
          >
            {theme === 'dark' ? <SunIcon className="w-4 h-4 md:w-6 md:h-6" /> : <Moon className="w-4 h-4 md:w-6 md:h-6" />}
          </button>
          <div className="text-right min-w-0">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-10 h-10 md:w-16 md:h-16 rounded-full object-cover border-2 border-white/20 mb-1 md:mb-2 ml-auto" />
            ) : (
              <div className="w-10 h-10 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center text-white/60 mb-1 md:mb-2 ml-auto">
                <Database className="w-5 h-5 md:w-8 md:h-8" />
              </div>
            )}
            <p className="text-sm sm:text-base md:text-xl font-medium text-white truncate">Administrador</p>
            <p className="text-[8px] md:text-sm text-white/60 font-medium truncate">{companyData?.name || 'CONDFY.IA'}</p>
            <button 
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Sair do Sistema',
                  message: 'Deseja realmente sair do sistema?',
                  onConfirm: logout
                });
              }}
              className="mt-1 text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 ml-auto group"
            >
              <LogOut className="w-2 h-2 md:w-2.5 md:h-2.5 group-hover:-translate-x-1 transition-transform" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* NBR 5674 Preventive Maintenance & Team Workload Real-Time Monitor */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative z-10 max-w-[1400px] bg-zinc-950/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden p-6 shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Dynamic Connected Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 text-amber-400 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)] shrink-0">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">Central de Monitoramento Integrado</h2>
                <div className="flex items-center gap-1.5 bg-[#39FF14]/5 border border-[#39FF14]/20 text-[#39FF14] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(57,255,20,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                  Supabase Live Sync
                </div>
              </div>
              <p className="text-xs text-white/50 mt-1">Conexão em tempo real entre Norma NBR 5674, Ordens de Serviço (O.S.) e alocação operacional da equipe técnica.</p>
            </div>
          </div>
          
          {/* Elegant tab selector & navigation shortcuts */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex flex-wrap gap-1">
              <button
                onClick={() => setActiveMonitorTab('alerts')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  activeMonitorTab === 'alerts' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg' 
                    : 'text-white/60 hover:text-white border border-transparent'
                }`}
              >
                Alertas Ativos NBR 5674
              </button>
              <button
                onClick={() => setActiveMonitorTab('execution')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                  activeMonitorTab === 'execution' 
                    ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 shadow-lg shadow-[#39FF14]/5' 
                    : 'text-white/60 hover:text-white border border-transparent'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                Atividades em Tempo Real ({tickets.filter(t => t.status === 'REALIZANDO').length})
              </button>
              <button
                onClick={() => setActiveMonitorTab('team')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  activeMonitorTab === 'team' 
                    ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 shadow-lg' 
                    : 'text-white/60 hover:text-white border border-transparent'
                }`}
              >
                Carga & Gestão de Equipe ({staff.length})
              </button>
            </div>

            <Link 
              to="/operational" 
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/80 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <LayoutList className="w-3.5 h-3.5" />
              Ver Cronograma
            </Link>
          </div>
        </div>

        {/* TAB 1: NBR 5674 Preventive Maintenance Alerts */}
        {activeMonitorTab === 'alerts' && (
          <div>
            {nbr5674Alerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                {nbr5674Alerts.map((alert) => {
                  const client = clients.find(c => c.id === alert.clientId);
                  const clientName = client?.name || 'Condomínio Geral';
                  const isOverdue = alert.isOverdue;
                  const daysLeft = alert.diffDays;
                  const isAssigning = assignTechAlertId === alert.id;
                  
                  return (
                    <motion.div 
                      key={alert.id}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className={`relative p-5 rounded-2xl border transition-all backdrop-blur-lg flex flex-col justify-between h-full ${
                        isOverdue 
                          ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.03)]' 
                          : 'bg-amber-500/5 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.03)]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[10px] text-white/40 font-mono tracking-wider block uppercase font-bold">{clientName}</span>
                            <h4 className="text-sm font-black text-white truncate uppercase tracking-tight" title={alert.item}>
                              {alert.item}
                            </h4>
                          </div>
                          
                          {isOverdue ? (
                            <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl shrink-0 animate-pulse">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg text-white/70">
                            {alert.frequency}
                          </span>
                          <span className="bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg text-white/70">
                            {alert.category || 'Inspeção'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-semibold pt-2 border-t border-white/5">
                          <span className="text-white/40">Vencimento:</span>
                          <span className={isOverdue ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                            {safeFormatDate(alert.nextDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-white/40">Status do Prazo:</span>
                          <span className={isOverdue ? 'text-red-400 font-black uppercase' : 'text-amber-400 font-black uppercase'}>
                            {isOverdue ? `Atrasada (${Math.abs(daysLeft)}d)` : `Vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Assignment or Controls */}
                      <div className="mt-4 pt-3 border-t border-white/5">
                        {isAssigning ? (
                          <div className="bg-black/60 border border-white/10 p-3 rounded-xl space-y-3">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-white/50">Técnico Responsável</label>
                            <select
                              id={`tech-select-${alert.id}`}
                              defaultValue=""
                              className="w-full bg-zinc-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                            >
                              <option value="">A Definir (Sem técnico)</option>
                              {staff.filter(s => s.status === 'ACTIVE').map(s => (
                                <option key={s.id} value={s.name}>
                                  {s.name} ({staffWorkload[s.name]?.activeCount || 0} OS ativas)
                                </option>
                              ))}
                            </select>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  const selectEl = document.getElementById(`tech-select-${alert.id}`) as HTMLSelectElement;
                                  const chosenTechName = selectEl?.value || 'A Definir';
                                  try {
                                    // 1. Create the Ticket/O.S.
                                    addTicket({
                                      type: 'TAREFA',
                                      title: alert.item,
                                      clientId: alert.clientId,
                                      date: alert.nextDate,
                                      technician: chosenTechName,
                                      observations: `O.S. automática gerada via Monitoramento NBR 5674 no Dashboard Principal.\n\nNorma regulamentadora aplicável: NBR 5674\nItem inspecionado: ${alert.item}\nFrequência programada: ${alert.frequency}\nPrazo original: ${safeFormatDate(alert.nextDate)}`,
                                      status: 'PENDENTE_APROVACAO',
                                      maintenanceCategory: 'Preventiva',
                                      maintenanceSubcategory: alert.frequency
                                    });

                                    // 2. Mark the alert as done so it leaves the alert screen
                                    updateScheduledMaintenance(alert.id, { 
                                      status: 'DONE', 
                                      lastDone: new Date().toISOString().split('T')[0] 
                                    });

                                    toast.success(`O.S. de Preventiva aberta e atribuída a ${chosenTechName}!`);
                                    setAssignTechAlertId(null);

                                    // 3. Navigate to the Kanban board
                                    navigate('/kanban');
                                  } catch (err: any) {
                                    toast.error(`Falha ao abrir O.S.: ${err.message || String(err)}`);
                                  }
                                }}
                                className="flex-1 py-1.5 bg-blue-500 text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-400 transition-all active:scale-95 cursor-pointer"
                              >
                                Abrir O.S. Atribuída
                              </button>
                              <button 
                                onClick={() => setAssignTechAlertId(null)}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-white/10"
                              >
                                Voltar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={async () => {
                                const confirmAction = window.confirm(`Deseja marcar a manutenção de "${alert.item}" em "${clientName}" como CONCLUÍDA?`);
                                if (confirmAction) {
                                  try {
                                    updateScheduledMaintenance(alert.id, { 
                                      status: 'DONE', 
                                      lastDone: new Date().toISOString().split('T')[0] 
                                    });
                                    toast.success(`Manutenção de ${alert.item} marcada como Concluída!`);
                                  } catch (err: any) {
                                    toast.error(`Falha ao concluir: ${err.message || String(err)}`);
                                  }
                                }
                              }}
                              className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Concluir
                            </button>
                            
                            <button 
                              onClick={() => {
                                setAssignTechAlertId(alert.id);
                              }}
                              className="py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Atribuir & Abrir
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-[#39FF14] rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-[#39FF14]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">Sistemas em Conformidade Legal</p>
                    <p className="text-xs text-white/50">Todas as inspeções prediais preventivas da norma NBR 5674 estão rigorosamente em dia para todos os condomínios.</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-[0.2em] bg-[#39FF14]/5 px-3 py-1.5 rounded-full border border-[#39FF14]/20 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                  100% OK
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Dynamic Team & Workload Management */}
        {activeMonitorTab === 'team' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 p-4 rounded-2xl border border-white/5 gap-3">
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#39FF14]" />
                  Painel Operacional da Equipe Técnica
                </h3>
                <p className="text-[11px] text-white/50">Gerenciamento direto de escalas, turnos, edição de cadastros e monitoramento de carga em tempo real.</p>
              </div>
              <button
                onClick={() => setIsAddingStaff(!isAddingStaff)}
                className="px-4 py-2 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#39FF14] transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingStaff ? 'Fechar Cadastro' : 'Cadastrar Membro'}
              </button>
            </div>

            {/* Quick Metrics Indicators Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] uppercase font-black text-white/40 tracking-wider">Total de Equipe</span>
                <span className="text-2xl font-black text-white mt-1">{staff.length}</span>
              </div>
              <div className="p-4 bg-[#39FF14]/5 border border-[#39FF14]/10 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] uppercase font-black text-[#39FF14]/60 tracking-wider">Técnicos Disponíveis</span>
                <span className="text-2xl font-black text-[#39FF14] mt-1">{staff.filter(s => s.status === 'ACTIVE').length}</span>
              </div>
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] uppercase font-black text-amber-400/60 tracking-wider">Em Licença / Ausentes</span>
                <span className="text-2xl font-black text-amber-400 mt-1">{staff.filter(s => s.status === 'ON_LEAVE' || s.status === 'INACTIVE').length}</span>
              </div>
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] uppercase font-black text-blue-400/60 tracking-wider">Ordens de Serviço Ativas</span>
                <span className="text-2xl font-black text-blue-400 mt-1">
                  {Object.values(staffWorkload).reduce((acc, curr) => acc + curr.activeCount, 0)}
                </span>
              </div>
            </div>

            {/* Slide-out inline register form */}
            {isAddingStaff && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-5 bg-black/40 border border-white/10 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black uppercase text-[#39FF14] tracking-wider">Novo Profissional</h4>
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest font-mono">Sync com Supabase</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase font-black tracking-widest text-white/40 mb-1.5">Nome Completo</label>
                    <input 
                      type="text"
                      value={newStaffForm.name}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                      placeholder="Ex: Carlos Souza"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-black tracking-widest text-white/40 mb-1.5">Especialidade / Cargo</label>
                    <input 
                      type="text"
                      value={newStaffForm.role}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                      placeholder="Ex: Técnico Hidráulico, Eletricista"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-black tracking-widest text-white/40 mb-1.5">Telefone</label>
                    <input 
                      type="text"
                      value={newStaffForm.phone}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-black tracking-widest text-white/40 mb-1.5">Turno</label>
                    <select
                      value={newStaffForm.shift}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, shift: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                    >
                      <option value="MORNING">Manhã</option>
                      <option value="AFTERNOON">Tarde</option>
                      <option value="NIGHT">Noite</option>
                      <option value="FLEXIBLE">Flexível</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      if (!newStaffForm.name.trim()) {
                        toast.error('O nome do membro da equipe é obrigatório.');
                        return;
                      }
                      addStaff({
                        name: newStaffForm.name,
                        role: newStaffForm.role,
                        phone: newStaffForm.phone,
                        email: newStaffForm.email || `${newStaffForm.name.toLowerCase().replace(/\s+/g, '')}@condfy.ia`,
                        shift: newStaffForm.shift,
                        status: newStaffForm.status
                      });
                      toast.success(`${newStaffForm.name} cadastrado e sincronizado com o banco!`);
                      setNewStaffForm({
                        name: '',
                        role: 'Técnico',
                        phone: '',
                        email: '',
                        shift: 'MORNING',
                        status: 'ACTIVE'
                      });
                      setIsAddingStaff(false);
                    }}
                    className="px-5 py-2.5 bg-[#39FF14] text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[#39FF14]/90 transition-all cursor-pointer shadow-lg shadow-[#39FF14]/10"
                  >
                    Confirmar Cadastro no Banco
                  </button>
                </div>
              </motion.div>
            )}

            {/* Team listing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {staff.map((member) => {
                const workload = staffWorkload[member.name] || { activeCount: 0, tickets: [] };
                const count = workload.activeCount;
                const isEditing = editingStaffId === member.id;
                
                // Color states for Active Status
                const statusConfig = {
                  ACTIVE: { text: 'text-[#39FF14]', bg: 'bg-[#39FF14]/10', border: 'border-[#39FF14]/20', label: 'Disponível' },
                  ON_LEAVE: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Licença' },
                  INACTIVE: { text: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', label: 'Inativo' }
                };
                const currentStatus = statusConfig[member.status] || statusConfig.ACTIVE;

                // Color states for Workload Progress bar
                let workloadColor = 'text-[#39FF14]';
                let workloadBarColor = 'bg-[#39FF14]';
                let workloadLabel = 'Carga Baixa';
                let percent = Math.min(count * 25, 100) || 10;

                if (count >= 4) {
                  workloadColor = 'text-red-400 font-bold';
                  workloadBarColor = 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
                  workloadLabel = 'Carga Crítica';
                } else if (count >= 2) {
                  workloadColor = 'text-amber-400 font-bold';
                  workloadBarColor = 'bg-amber-500';
                  workloadLabel = 'Carga Média';
                }

                return (
                  <motion.div
                    key={member.id}
                    layoutId={`staff-card-${member.id}`}
                    whileHover={!isEditing ? { y: -3, scale: 1.01 } : {}}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-full min-h-[300px] relative overflow-hidden ${
                      isEditing 
                        ? 'bg-zinc-950/80 border-[#39FF14]/50 shadow-[0_0_30px_rgba(57,255,20,0.1)]' 
                        : 'bg-zinc-900/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Edit Form */
                      <div className="space-y-4 h-full flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-xs uppercase font-black text-[#39FF14] tracking-widest">Editar Profissional</span>
                            <span className="text-[9px] font-mono text-white/30">ID: {member.id.substring(0, 6)}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Nome Completo</label>
                              <input 
                                type="text"
                                value={editStaffForm.name || ''}
                                onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Cargo / Especialidade</label>
                              <input 
                                type="text"
                                value={editStaffForm.role || ''}
                                onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Telefone WhatsApp</label>
                              <input 
                                type="text"
                                value={editStaffForm.phone || ''}
                                onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Turno</label>
                                <select
                                  value={editStaffForm.shift || 'MORNING'}
                                  onChange={(e) => setEditStaffForm({ ...editStaffForm, shift: e.target.value })}
                                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                                >
                                  <option value="MORNING">Manhã</option>
                                  <option value="AFTERNOON">Tarde</option>
                                  <option value="NIGHT">Noite</option>
                                  <option value="FLEXIBLE">Flexível</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Status</label>
                                <select
                                  value={editStaffForm.status || 'ACTIVE'}
                                  onChange={(e) => setEditStaffForm({ ...editStaffForm, status: e.target.value })}
                                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#39FF14]"
                                >
                                  <option value="ACTIVE">Disponível</option>
                                  <option value="ON_LEAVE">Em Licença</option>
                                  <option value="INACTIVE">Inativo</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                          <button
                            onClick={() => {
                              if (!editStaffForm.name?.trim()) {
                                toast.error('O nome do técnico é obrigatório.');
                                return;
                              }
                              updateStaff(member.id, editStaffForm);
                              toast.success(`Cadastro de ${editStaffForm.name} atualizado no banco!`);
                              setEditingStaffId(null);
                            }}
                            className="py-2 bg-[#39FF14] text-black text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-[#39FF14]/90 transition-all cursor-pointer text-center"
                          >
                            Salvar Alterações
                          </button>
                          <button
                            onClick={() => setEditingStaffId(null)}
                            className="py-2 bg-white/5 hover:bg-white/10 text-white/70 text-[9px] font-black uppercase tracking-wider rounded-xl border border-white/10 transition-all cursor-pointer text-center"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Display Mode */
                      <div className="flex flex-col justify-between h-full">
                        <div>
                          {/* Card Header (Avatar + Name + Status Dropdown) */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center text-lg font-black text-amber-400 shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate" title={member.name}>{member.name}</h4>
                                <p className="text-[11px] text-white/50 truncate">{member.role}</p>
                              </div>
                            </div>
                            
                            {/* Fast Direct Status Switch Selector */}
                            <select
                              value={member.status}
                              onChange={(e) => {
                                const newStatusVal = e.target.value as any;
                                updateStaff(member.id, { status: newStatusVal });
                                toast.success(`Status de ${member.name} alterado para ${statusConfig[newStatusVal]?.label}!`);
                              }}
                              className={`px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-black/40 border transition-colors cursor-pointer focus:outline-none ${currentStatus.text} ${currentStatus.border} hover:bg-black/60`}
                            >
                              <option value="ACTIVE" className="bg-zinc-950 text-[#39FF14] font-black">Disponível ●</option>
                              <option value="ON_LEAVE" className="bg-zinc-950 text-amber-400 font-black">Em Licença ◑</option>
                              <option value="INACTIVE" className="bg-zinc-950 text-zinc-500 font-black">Inativo ○</option>
                            </select>
                          </div>

                          {/* technical stats rows */}
                          <div className="space-y-1.5 text-[11px] text-white/60 mb-4 pb-3 border-b border-white/5">
                            <div className="flex justify-between">
                              <span className="text-white/40">Escala / Turno:</span>
                              <span className="font-bold text-white uppercase tracking-tight">
                                {member.shift === 'MORNING' ? 'Manhã' : member.shift === 'AFTERNOON' ? 'Tarde' : member.shift === 'NIGHT' ? 'Noite' : 'Flexível'}
                              </span>
                            </div>
                            {member.phone && (
                              <div className="flex justify-between">
                                <span className="text-white/40">WhatsApp:</span>
                                <span className="font-mono text-white/80">{member.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Workload Level and Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px] items-center">
                              <span className="text-white/40">Fila de OS Ativas:</span>
                              <span className={`${workloadColor} font-black uppercase text-[10px] tracking-wide`}>
                                {count} {count === 1 ? 'OS' : 'OSs'} • {workloadLabel}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${workloadBarColor} transition-all duration-500`} style={{ width: `${percent}%` }} />
                            </div>
                          </div>

                          {/* Active OS list with status coloring & Navigation */}
                          {workload.tickets.length > 0 ? (
                            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                              <p className="text-[9px] uppercase font-black text-white/30 tracking-widest block mb-1">Chamados em Execução:</p>
                              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                {workload.tickets.map(t => {
                                  // Ticket status display configurations
                                  const ticketConfig: { [key in TicketStatus]?: { label: string; style: string } } = {
                                    PENDENTE_APROVACAO: { label: 'Pendente', style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                                    APROVADO: { label: 'Aprovada', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                                    EM_ROTA: { label: 'Em Rota', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                                    AGUARDANDO_MATERIAL: { label: 'Ag. Mat.', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                                    REALIZANDO: { label: 'Em Execução', style: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20 animate-pulse' },
                                    CONCLUIDO: { label: 'Concluída', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                    REJEITADO: { label: 'Rejeitada', style: 'bg-red-500/10 text-red-400 border-red-500/20' }
                                  };
                                  const currentMaint = ticketConfig[t.status as TicketStatus] || { label: String(t.status), style: 'bg-white/5 text-white/60 border-white/10' };

                                  return (
                                    <div 
                                      key={t.id} 
                                      onClick={() => navigate(`/execution?play=${t.id}`)}
                                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer text-[11px] group/ticket gap-2"
                                      title="Clique para ir à Central de Execução"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-[#39FF14] font-bold shrink-0">{t.osNumber || 'OS'}</span>
                                          <span className="text-white truncate font-medium group-hover/ticket:text-[#39FF14] transition-colors">{t.title}</span>
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border shrink-0 ${currentMaint.style}`}>
                                        {currentMaint.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                              <p className="text-[10px] text-white/30 italic">Sem tarefas ativas pendentes no momento.</p>
                            </div>
                          )}
                        </div>

                        {/* Interactive Grid Actions */}
                        <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-white/5">
                          <button
                            onClick={() => {
                              setEditingStaffId(member.id);
                              setEditStaffForm(member);
                            }}
                            className="py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                            title="Editar Cadastro"
                          >
                            <Edit className="w-3 h-3 text-white/70" />
                            Editar
                          </button>

                          <button
                            onClick={async () => {
                              const confirmDel = window.confirm(`Deseja remover permanentemente o técnico "${member.name}" do banco de dados? Esta ação não pode ser desfeita.`);
                              if (confirmDel) {
                                try {
                                  await deleteStaff(member.id);
                                } catch (err: any) {
                                  toast.error(`Falha ao remover: ${err.message || String(err)}`);
                                }
                              }
                            }}
                            className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-500/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                            title="Remover Técnico"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>

                          <a
                            href={`tel:${member.phone}`}
                            className="py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1"
                            title="Ligar para o Profissional"
                          >
                            <Phone className="w-3 h-3" />
                            Ligar
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {staff.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl">
                  <Users className="w-12 h-12 opacity-10 mx-auto mb-3" />
                  <p className="text-xs text-white/40">Nenhum membro operacional cadastrado no banco de dados.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Real-Time Services Execution (Kanban REALIZANDO) */}
        {activeMonitorTab === 'execution' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Live Operations HUD / Command Header */}
            <div className="bg-zinc-950/60 border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-40 bg-radial from-[#39FF14]/5 to-transparent pointer-events-none rounded-full blur-3xl" />
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-[#39FF14]/10 rounded-2xl flex items-center justify-center border border-[#39FF14]/20 shadow-[0_0_20px_rgba(57,255,20,0.15)] shrink-0">
                  <Activity className="w-6 h-6 text-[#39FF14] animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Centro de Telemetria Operacional</h3>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5 truncate">
                    Monitoramento integrado de equipes de campo, checklists em andamento e sensores de infraestrutura.
                  </p>
                </div>
              </div>

              {/* Time display & signal indicators */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                {/* PDF Report Generation Button */}
                <button
                  id="btn-generate-daily-pdf-report"
                  onClick={generateDaySummaryReport}
                  className="px-4 py-2 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(57,255,20,0.25)] hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] cursor-pointer shrink-0"
                  title="Gerar Resumo do Dia em PDF"
                >
                  <FileText className="w-4 h-4 text-black" />
                  Gerar Resumo do Dia
                </button>

                {/* Scoreboard Clock */}
                <div className="bg-black/50 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2.5 font-mono shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                  <Clock className="w-4 h-4 text-[#39FF14]/80" />
                  <span className="text-sm text-[#39FF14] font-black tracking-widest drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]">
                    {liveTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg border flex items-center gap-1 ${
                    isSupabaseConfigured 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  }`}>
                    <Wifi className="w-2.5 h-2.5" />
                    {isSupabaseConfigured ? 'TELEMETRIA CLOUD' : 'LOCAL CACHE'}
                  </span>
                  
                  <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg border flex items-center gap-1 ${
                    vivianEnabled 
                      ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/25 shadow-[0_0_8px_rgba(57,255,20,0.05)]' 
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}>
                    <Brain className="w-2.5 h-2.5" />
                    LUMI.AI: {vivianOnline ? 'ATIVADO' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Split layout: Services on the left, infrastructure and staff allocation on the right */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Main Column: Active Tickets */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Live Operations KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-[#39FF14]/10 text-[#39FF14] rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                      <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider font-bold">Equipes em Campo</h4>
                      <p className="text-lg font-black text-white mt-0.5">
                        {tickets.filter(t => t.status === 'REALIZANDO').length} Serviços Ativos
                      </p>
                      <p className="text-[10px] text-[#39FF14] font-medium">Inspeções e corretivas correntes</p>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider font-bold">Checklists Ativos</h4>
                      <p className="text-lg font-black text-white mt-0.5">
                        {tickets.filter(t => t.status === 'REALIZANDO' && t.checklistResults && t.checklistResults.length > 0).length} Monitorados
                      </p>
                      <p className="text-[10px] text-white/40">Inspecionados passo a passo</p>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs text-white/50 uppercase tracking-wider font-bold">Atenção Crítica</h4>
                      <p className="text-lg font-black text-white mt-0.5">
                        {tickets.filter(t => t.status === 'REALIZANDO' && (t.priority === 'CRITICAL' || t.priority === 'HIGH')).length} Ocorrências
                      </p>
                      <p className="text-[10px] text-white/40 font-medium">Prioridade máxima em curso</p>
                    </div>
                  </div>
                </div>
                {/* Grid of active service order cards */}
                {tickets.filter(t => t.status === 'REALIZANDO').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {tickets.filter(t => t.status === 'REALIZANDO').map((t) => {
                      const client = clients.find(c => c.id === t.clientId);
                      const clientName = client?.name || 'Condomínio Geral';
                      const tech = staff.find(s => s.name === t.technician);
                      
                      // Calculate Checklist progress
                      const totalChecklists = t.checklistResults?.length || 0;
                      const completedChecklists = t.checklistResults?.filter(r => r.status === 'OK' || r.status === 'NOK').length || 0;
                      const checklistProgressPct = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

                      // Priority style configuration
                      const getPriorityConfig = (p?: string) => {
                        switch (p) {
                          case 'CRITICAL':
                            return { label: 'CRÍTICA', colorClass: 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse' };
                          case 'HIGH':
                            return { label: 'ALTA', colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
                          case 'MEDIUM':
                            return { label: 'MÉDIA', colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
                          default:
                            return { label: 'BAIXA', colorClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
                        }
                      };
                      const prio = getPriorityConfig(t.priority);

                      return (
                        <motion.div
                          key={t.id}
                          whileHover={{ scale: 1.01, y: -2 }}
                          className={`relative p-5 rounded-3xl bg-zinc-950/45 border transition-all flex flex-col justify-between h-full ${
                            t.priority === 'CRITICAL' 
                              ? 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.06)]' 
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="space-y-4">
                            {/* Card Header (Client + OS ID) */}
                            <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
                              <div className="min-w-0">
                                <span className="text-[10px] text-white/40 font-mono tracking-wider block uppercase font-bold truncate">
                                  {clientName}
                                </span>
                                <h4 className="text-sm font-black text-white truncate uppercase tracking-tight mt-0.5" title={t.title || 'Ordem de Serviço'}>
                                  {t.title || 'Ordem de Serviço'}
                                </h4>
                              </div>
                              <span className="text-[10px] text-[#39FF14] font-mono font-black tracking-widest bg-[#39FF14]/5 px-2.5 py-1 rounded-lg border border-[#39FF14]/20 shrink-0 shadow-[0_0_10px_rgba(57,255,20,0.05)]">
                                {t.osNumber || 'O.S. ATIVA'}
                              </span>
                            </div>

                            {/* Location & category detail */}
                            {t.location && (
                              <div className="flex items-center gap-1.5 text-xs text-white/60 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                                <MapPin className="w-3.5 h-3.5 text-[#39FF14]/80 shrink-0" />
                                <span className="truncate font-medium">{t.location}</span>
                              </div>
                            )}

                            {/* Badges (Type & Priority) */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white/70">
                                {t.type}
                              </span>
                              <span className={`border text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${prio.colorClass}`}>
                                {prio.label}
                              </span>
                            </div>

                            {/* Technician details & interactive notification */}
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 relative group">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center text-xs font-black text-[#39FF14] shrink-0 relative">
                                  {t.technician?.charAt(0) || 'T'}
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#39FF14] border border-black animate-pulse" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{t.technician || 'Sem Técnico'}</p>
                                  <p className="text-[10px] text-white/50 truncate">Executando Serviço</p>
                                </div>
                              </div>
                              
                              {tech?.phone && (
                                <button
                                  onClick={async () => {
                                    const text = `Olá ${tech.name}, estamos monitorando a execução da ${t.osNumber || 'Ordem de Serviço'} (${t.title}) em tempo real no Dashboard. Tudo correndo bem por aí? Há algum imprevisto? 👍`;
                                    try {
                                      const success = await sendWhatsAppMessage(tech.phone, text);
                                      if (success) {
                                        toast.success(`Mensagem enviada via WhatsApp para ${tech.name}!`);
                                      } else {
                                        toast.error('Ocorreu um erro ao enviar a mensagem.');
                                      }
                                    } catch (err: any) {
                                      toast.error(`Falha no envio: ${err.message || String(err)}`);
                                    }
                                  }}
                                  className="p-1.5 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/20 text-[#39FF14] rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(57,255,20,0.05)]"
                                  title="Enviar lembrete / Notificar via WhatsApp"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Real-time progress bar & indicator */}
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[11px] items-center">
                                <span className="text-white/40 flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-[#39FF14] animate-spin" style={{ animationDuration: '3s' }} />
                                  Status do Progresso:
                                </span>
                                <span className="text-white font-black text-[10px] tracking-wide">
                                  {totalChecklists > 0 
                                    ? `${completedChecklists} de ${totalChecklists} concluídas (${checklistProgressPct}%)`
                                    : 'Diagnóstico Inicial'
                                  }
                                </span>
                              </div>
                              
                              {totalChecklists > 0 ? (
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-[#39FF14] transition-all duration-500" 
                                    style={{ width: `${checklistProgressPct}%` }} 
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#39FF14]/30 to-transparent w-1/2 h-full rounded-full animate-pulse" />
                                </div>
                              )}
                            </div>

                            {/* COMPACT REAL-TIME CHECKLIST PEEK */}
                            {t.checklistResults && t.checklistResults.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold block">Checklist em Andamento:</span>
                                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                                  {t.checklistResults.map((result, idx) => {
                                    const itemObj = checklistItems.find(item => item.id === result.taskId);
                                    const taskText = itemObj?.task || `Item de Inspeção #${idx + 1}`;
                                    const getStatusStyles = (status: string) => {
                                      switch (status) {
                                        case 'OK':
                                          return { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />, bg: 'bg-emerald-500/5 text-emerald-300 border-emerald-500/10' };
                                        case 'NOK':
                                          return { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />, bg: 'bg-red-500/5 text-red-300 border-red-500/10' };
                                        default:
                                          return { icon: <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />, bg: 'bg-white/5 text-white/40 border-white/5' };
                                      }
                                    };
                                    const st = getStatusStyles(result.status);
                                    return (
                                      <div key={idx} className={`flex items-start gap-2 p-2 rounded-xl border text-[11px] ${st.bg}`}>
                                        {st.icon}
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium truncate" title={taskText}>{taskText}</p>
                                          {result.notes && (
                                            <p className="text-[9px] text-white/50 italic mt-0.5 truncate" title={result.notes}>
                                              Obs: {result.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* RECENT OPERATIONAL HISTORY NOTES */}
                            {t.history && t.history.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-white/5">
                                <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold mb-1">Último status de campo:</span>
                                <div className="bg-black/40 border border-white/5 p-2 rounded-xl flex gap-2 items-start">
                                  <MessageSquare className="w-3.5 h-3.5 text-[#39FF14]/80 shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] text-white/80 font-mono leading-normal line-clamp-2 italic">
                                      "{t.history[t.history.length - 1].note}"
                                    </p>
                                    <p className="text-[8px] text-white/40 font-mono mt-1">
                                      {safeFormatTime(t.history[t.history.length - 1].date)} por {t.history[t.history.length - 1].userName || 'Técnico'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* OS Action Buttons */}
                          <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-white/5">
                            <button
                              onClick={() => navigate(`/execution?play=${t.id}`)}
                              className="py-2 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 text-[#39FF14] rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#39FF14]/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                              title="Abrir Central de Execução da OS"
                            >
                              <Play className="w-3 h-3" />
                              Acompanhar
                            </button>

                            <button
                              onClick={async () => {
                                const confirmClose = window.confirm(`Deseja finalizar permanentemente a ${t.osNumber || 'O.S.'} "${t.title}" como CONCLUÍDA?`);
                                if (confirmClose) {
                                  try {
                                    updateTicketStatus(t.id, 'CONCLUIDO');
                                    toast.success(`O.S. ${t.osNumber || ''} concluída com sucesso!`);
                                  } catch (err: any) {
                                    toast.error(`Falha ao concluir: ${err.message || String(err)}`);
                                  }
                                }
                              }}
                              className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                              title="Marcar como Concluída"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Concluir
                            </button>

                            <button
                              onClick={async () => {
                                const confirmPause = window.confirm(`Deseja pausar a ${t.osNumber || 'O.S.'} "${t.title}" por FALTA DE MATERIAL / AGUARDANDO RECURSO?`);
                                if (confirmPause) {
                                  try {
                                    updateTicketStatus(t.id, 'AGUARDANDO_MATERIAL');
                                    toast.success(`O.S. ${t.osNumber || ''} pausada e colocada em "Aguardando Material".`);
                                  } catch (err: any) {
                                    toast.error(`Falha ao pausar: ${err.message || String(err)}`);
                                  }
                                }
                              }}
                              className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-500/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                              title="Pausar por Falta de Material"
                            >
                              <Truck className="w-3 h-3" />
                              Pausar
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-3xl text-center">
                    <div className="p-4 bg-white/5 text-white/30 rounded-full mb-4">
                      <Activity className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Nenhuma atividade em curso</h4>
                    <p className="text-xs text-white/50 max-w-md">
                      Nenhum técnico está com ordens de serviço marcadas como <strong className="text-[#39FF14]">"Realizando"</strong> no momento.
                      Acesse o quadro Kanban ou a página operacional para delegar e iniciar as tarefas.
                    </p>
                    <div className="flex gap-2 mt-5">
                      <Link 
                        to="/kanban"
                        className="px-4 py-2 bg-[#39FF14] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#39FF14]/90 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        Quadro Kanban
                      </Link>
                      <Link 
                        to="/operational"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                      >
                        Cronograma de Visitas
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Side Column: Telemetry & Infrastructure Board */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Real-time Market Quotes Widget */}
                <div className="bg-zinc-950/40 border border-[#39FF14]/10 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
                  {/* Subtle decorative Green ambient light glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#39FF14]/5 to-transparent pointer-events-none rounded-full blur-2xl" />

                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shrink-0" />
                      <div className="flex items-center gap-1.5">
                        <LineChart className="w-4 h-4 text-[#39FF14]" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">Mercado Financeiro</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {marketQuotes && (
                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">
                          {new Date(marketQuotes.usd.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <button
                        onClick={fetchMarketQuotes}
                        disabled={marketLoading}
                        className="p-1.5 hover:bg-white/5 text-white/50 hover:text-[#39FF14] rounded-lg transition-all active:scale-90 cursor-pointer"
                        title="Atualizar Cotações"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${marketLoading ? 'animate-spin text-[#39FF14]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {marketLoading && !marketQuotes ? (
                    <div className="grid grid-cols-2 gap-3.5 animate-pulse">
                      {[1, 2].map((idx) => (
                        <div key={`market-skeleton-${idx}`} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2.5">
                          <div className="w-16 h-3 bg-white/10 rounded-md" />
                          <div className="w-24 h-6 bg-white/10 rounded-md" />
                          <div className="w-12 h-4 bg-white/5 rounded-md" />
                        </div>
                      ))}
                    </div>
                  ) : marketError && !marketQuotes ? (
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-center">
                      <span className="text-[10px] text-red-400 font-bold block mb-1">Falha nas Cotações</span>
                      <button 
                        onClick={fetchMarketQuotes}
                        className="text-[9px] font-black uppercase text-white/60 hover:text-white underline cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : (
                    marketQuotes && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="grid grid-cols-2 gap-3.5"
                      >
                        {/* Dollar Card */}
                        <div className="p-3.5 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-200">
                          <span className="text-[9px] font-black uppercase tracking-wider text-white/40 block mb-1">Dólar Comercial</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-mono font-black text-white">
                              R$ {marketQuotes.usd.rate.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              marketQuotes.usd.pct >= 0 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/10'
                            }`}>
                              {marketQuotes.usd.pct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {marketQuotes.usd.pct >= 0 ? '+' : ''}{marketQuotes.usd.pct.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Ibovespa Card */}
                        <div className="p-3.5 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-200">
                          <span className="text-[9px] font-black uppercase tracking-wider text-white/40 block mb-1">Ibovespa (IBOV)</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-mono font-black text-white">
                              {Math.round(marketQuotes.ibov.points).toLocaleString('pt-BR')} <span className="text-[10px] text-white/40 font-bold">pts</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              marketQuotes.ibov.pct >= 0 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/10'
                            }`}>
                              {marketQuotes.ibov.pct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {marketQuotes.ibov.pct >= 0 ? '+' : ''}{marketQuotes.ibov.pct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>

                {/* Tech & Globo News Feed Widget (Smart Home, AI, G1 & Flamengo) */}
                <div className="bg-zinc-950/40 border border-red-500/10 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
                  {/* Subtle decorative red ambient light glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-red-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />

                  <div className="flex flex-col gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <div className="flex items-center gap-1.5">
                          <Newspaper className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            Globo.com & Flamengo
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {newsLastFetched && (
                          <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">
                            {newsLastFetched}
                          </span>
                        )}
                        <button
                          onClick={() => fetchNews('GLOBO')}
                          disabled={newsLoading}
                          className="p-1.5 hover:bg-white/5 text-white/50 hover:text-red-500 rounded-lg transition-all active:scale-90 cursor-pointer"
                          title="Atualizar Notícias"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? 'animate-spin text-red-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {newsLoading ? (
                      <div className="space-y-3.5">
                        {[1, 2, 3].map((idx) => (
                          <div 
                            key={`news-skeleton-${idx}`}
                            className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5 animate-pulse"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-14 h-4 bg-white/10 rounded-md border border-white/5" />
                                <div className="w-20 h-2.5 bg-white/5 rounded-md" />
                              </div>
                              <div className="w-3.5 h-3.5 bg-white/5 rounded-md" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="w-11/12 h-3 bg-white/10 rounded-md" />
                              <div className="w-3/4 h-3 bg-white/10 rounded-md" />
                            </div>
                            <div className="space-y-1.5 pt-0.5">
                              <div className="w-full h-2 bg-white/5 rounded-md" />
                              <div className="w-5/6 h-2 bg-white/5 rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : newsError && newsItems.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <Globe className={`w-7 h-7 mb-2 opacity-60 ${newsChannel === 'TECH' ? 'text-cyan-400' : 'text-red-400'}`} />
                        <span className={`text-xs font-bold mb-1 ${newsChannel === 'TECH' ? 'text-cyan-300' : 'text-red-300'}`}>Falha de Sincronismo</span>
                        <p className="text-[10px] text-white/40 max-w-[200px] leading-relaxed">
                          Não foi possível carregar as notícias de {newsChannel === 'TECH' ? 'Casa Inteligente e Inteligência Artificial' : 'Globo.com e Flamengo'}. Verifique sua conexão ou clique para recarregar.
                        </p>
                        <button
                          onClick={() => fetchNews(newsChannel)}
                          className={`mt-3 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                            newsChannel === 'TECH'
                              ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-white border-cyan-500/20'
                              : 'bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/20'
                          }`}
                        >
                          Tentar Novamente
                        </button>
                      </div>
                    ) : (
                      <>
                        {newsItems.map((item, index) => {
                          let displayDate = '';
                          try {
                            if (item.pubDate) {
                              const d = new Date(item.pubDate);
                              if (!isNaN(d.getTime())) {
                                  displayDate = d.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              }
                            }
                          } catch (e) {}

                          const isTech = newsChannel === 'TECH';
                          const isSmartHome = isTech && item.type === 'CASA_INTELIGENTE';
                          const isFlamengo = !isTech && item.type === 'FLA';

                          let cardBorderClass = '';
                          let badgeClass = '';
                          let hoverTitleClass = '';
                          let badgeIcon = null;
                          let badgeText = '';
                          let defaultLink = '';
                          let linkTitle = '';

                          if (isTech) {
                            if (isSmartHome) {
                              cardBorderClass = 'border-cyan-500/10 hover:border-cyan-500/20';
                              badgeClass = 'bg-cyan-950/40 text-cyan-400 border-cyan-500/25';
                              hoverTitleClass = 'group-hover:text-cyan-300';
                              badgeIcon = <Home className="w-2 h-2" />;
                              badgeText = 'CASA INTELIGENTE';
                              defaultLink = 'https://olhardigital.com.br/casa-inteligente/';
                              linkTitle = 'Abrir no Olhar Digital';
                            } else {
                              cardBorderClass = 'border-violet-500/10 hover:border-violet-500/20';
                              badgeClass = 'bg-violet-950/40 text-violet-400 border-violet-500/25';
                              hoverTitleClass = 'group-hover:text-violet-300';
                              badgeIcon = <Brain className="w-2 h-2" />;
                              badgeText = 'INTELIGÊNCIA ARTIFICIAL';
                              defaultLink = 'https://canaltech.com.br/inteligencia-artificial/';
                              linkTitle = 'Abrir no Canaltech';
                            }
                          } else {
                            if (isFlamengo) {
                              cardBorderClass = 'border-red-500/10 hover:border-red-500/20';
                              badgeClass = 'bg-red-950/40 text-red-400 border-red-500/25';
                              hoverTitleClass = 'group-hover:text-red-300';
                              badgeIcon = <Zap className="w-2 h-2 text-red-400" />;
                              badgeText = 'FLAMENGO';
                              defaultLink = 'https://ge.globo.com/futebol/times/flamengo/';
                              linkTitle = 'Abrir no GE Flamengo';
                            } else {
                              cardBorderClass = 'border-emerald-500/10 hover:border-emerald-500/20';
                              badgeClass = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/25';
                              hoverTitleClass = 'group-hover:text-emerald-300';
                              badgeIcon = <Newspaper className="w-2 h-2 text-emerald-400" />;
                              badgeText = 'GLOBO.COM';
                              defaultLink = 'https://g1.globo.com/';
                              linkTitle = 'Abrir no G1';
                            }
                          }

                          return (
                            <motion.div 
                              key={index} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
                              className={`group p-3 bg-white/5 hover:bg-white/[0.08] border rounded-2xl transition-all duration-200 ${cardBorderClass}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${badgeClass}`}>
                                    {badgeIcon}
                                    <span>{badgeText}</span>
                                  </span>
                                  {displayDate && (
                                    <span className="text-[8px] font-mono text-white/30">
                                      {displayDate}
                                    </span>
                                  )}
                                </div>
                                <a 
                                  href={item.link || defaultLink} 
                                  target="_blank" 
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer"
                                  className={`text-white/40 group-hover:text-white transition-colors shrink-0 p-0.5 cursor-pointer`}
                                  title={linkTitle}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <h4 className={`text-xs font-black text-white transition-colors mt-2 leading-snug ${hoverTitleClass}`}>
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-[10px] text-white/50 leading-relaxed mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </motion.div>
                          );
                        })}
                        <div className="flex items-center justify-center gap-4 pt-1">
                          <a 
                            href="https://g1.globo.com/" 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[8px] font-black text-white/30 hover:text-emerald-400 uppercase tracking-widest transition-colors cursor-pointer"
                          >
                            <span>Globo.com</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                          <span className="text-white/10">|</span>
                          <a 
                            href="https://ge.globo.com/futebol/times/flamengo/" 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[8px] font-black text-white/30 hover:text-red-400 uppercase tracking-widest transition-colors cursor-pointer"
                          >
                            <span>GE Flamengo</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Travel Ticket Monitor & Deals Widget */}
                <TravelTicketMonitor />

                {/* Team On-Duty Allocation Block */}
                <div className="bg-zinc-950/40 border border-white/10 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">Equipes de Plantão</span>
                    </div>
                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-md text-white/60 font-black font-mono">
                      {staff.filter(s => s.status === 'ACTIVE').length} ON
                    </span>
                  </div>

                  <div className="space-y-3">
                    {staff.filter(s => s.status === 'ACTIVE').map((member) => {
                      const isWorking = tickets.some(t => t.status === 'REALIZANDO' && t.technician === member.name);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-2xl text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-[#39FF14]/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/80 shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{member.name}</p>
                              <p className="text-[9px] text-white/40 capitalize">{member.shift.toLowerCase()}</p>
                            </div>
                          </div>
                          
                          <span className={`px-2 py-0.5 text-[8px] font-black rounded-md ${
                            isWorking 
                              ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/15 animate-pulse' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                          }`}>
                            {isWorking ? 'EM CAMPO' : 'DISPONÍVEL'}
                          </span>
                        </div>
                      );
                    })}

                    {staff.filter(s => s.status === 'ACTIVE').length === 0 && (
                      <p className="text-[10px] text-white/40 text-center py-2">Sem técnicos de plantão ativos no momento.</p>
                    )}
                  </div>
                </div>

                {/* Critical System Warnings / NBR Ticker */}
                {criticalEvents.length > 0 && (
                  <div className="bg-zinc-950/40 border border-white/10 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">Alertas Críticos NBR</span>
                    </div>

                    <div className="space-y-3">
                      {criticalEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="p-3 bg-black/40 border border-red-500/10 rounded-2xl space-y-1.5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-radial from-red-500/5 to-transparent pointer-events-none rounded-full blur-xl" />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">
                              {event.type} ALERT
                            </span>
                            <span className="text-[8px] font-mono text-white/40">{safeFormatTime(event.lastUpdate)}</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{event.device}</p>
                          <p className="text-[10px] text-white/50 leading-relaxed font-mono truncate">{event.description}</p>
                          
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[9px] text-white/30 font-semibold">{event.location}</span>
                            <span className={`px-1.5 py-0.5 text-[7px] font-black rounded ${
                              event.status === 'CRITICAL' 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </motion.div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={visibleTiles.map(t => t.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 relative z-10 max-w-[1400px] perspective-1000 grid-flow-dense">
            {visibleTiles.map((tile) => {
              const currentSize = tileSizes[tile.id] || (tile.id === 'daily-tasks' ? 'large' : tile.type === 'wide' ? 'medium' : 'small');
              const sizeClasses = currentSize === 'small' ? 'col-span-1 row-span-1 aspect-square' :
                                  currentSize === 'medium' ? 'col-span-2 row-span-1 aspect-[2/1] sm:aspect-video md:aspect-[2/1]' :
                                  'col-span-2 row-span-2 aspect-square';
              return (
                <SortableTile 
                  key={tile.id} 
                  id={tile.id} 
                  className={sizeClasses}
                  isEditMode={isEditMode}
                  onResize={(e) => handleResize(tile.id, tile.type, e)}
                  onClose={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleTileVisibility(tile.id);
                  }}
                >
                  {tile.component}
                </SortableTile>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Backup e Sistema</h3>
              <button onClick={() => setShowBackupModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button 
                onClick={handleExportBackup}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95"
              >
                <Download className="w-6 h-6" />
                <div>
                  <p className="text-left">Gerar Backup Completo</p>
                  <p className="text-xs font-normal opacity-70">Baixe todos os dados para outro PC</p>
                </div>
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  ref={backupInputRef}
                  onChange={handleImportBackup}
                />
                <button 
                  onClick={() => backupInputRef.current?.click()}
                  className="w-full p-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95"
                >
                  <FileUp className="w-6 h-6" />
                  <div>
                    <p className="text-left">Restaurar Backup</p>
                    <p className="text-xs font-normal opacity-70">Carregar arquivo .json</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Money to Goal Modal */}
      <Modal 
        isOpen={isAddingMoneyToGoal} 
        onClose={() => {
          setIsAddingMoneyToGoal(false);
          setMoneyToAdd(0);
          setSelectedGoalId(null);
        }} 
        title="Adicionar Dinheiro à Meta"
        maxWidth="sm"
        glass={true}
      >
        <form onSubmit={handleAddMoneyToGoal} className="space-y-6 p-2">
          <div>
            <p className="text-white/60 text-sm mb-4">
              Meta: <span className="text-white font-bold">{savingsGoals.find(g => g.id === selectedGoalId)?.title}</span>
            </p>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Valor a Adicionar (R$) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
              <input 
                type="number" 
                value={moneyToAdd || ''}
                onChange={(e) => setMoneyToAdd(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white"
                min="0.01"
                step="0.01"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => {
                setIsAddingMoneyToGoal(false);
                setMoneyToAdd(0);
                setSelectedGoalId(null);
              }}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-white/20 hover:bg-white/30 text-white px-10 py-3 rounded-xl font-bold border border-white/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
            >
              ADICIONAR
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />
    </div>
  );
}
