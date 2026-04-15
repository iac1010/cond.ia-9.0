import { useStore } from '../store';
import { TicketStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeFormatDate } from '../utils/dateUtils';
import { 
  Users, FileText, Plus, Hammer, RefreshCw,
  DollarSign, TrendingUp, Package, Database, 
  Calendar as CalendarIcon, CloudSun, Image as ImageIcon,
  Settings, Moon, Sun, UserPlus, Sun as SunIcon,
  Columns, Clock, ClipboardCheck, AlertCircle, QrCode, AlertTriangle, Play,
  BarChart3, Droplets, Zap, ShieldCheck, Megaphone,
  TrendingDown,
  Box, UserCheck, Activity, Maximize2, CheckCircle2, Presentation, LogOut,
  X, Download, FileUp, Database as DatabaseIcon, MessageSquare, Target,
  Wifi, WifiOff, GripVertical, ClipboardList, LayoutList,
  Bell, Truck, Brain, ExternalLink, Sparkles, LineChart
} from 'lucide-react';
import { KanbanMirror } from '../components/KanbanMirror';
import { TicketsMirror } from '../components/TicketsMirror';
import { SavingsMirror } from '../components/SavingsMirror';
import { CostsMirror } from '../components/CostsMirror';
import { ReceiptsMirror } from '../components/ReceiptsMirror';
import { IncomingMoneyMirror } from '../components/IncomingMoneyMirror';
import { QuotesMirror } from '../components/QuotesMirror';
import { CommercialMirror } from '../components/CommercialMirror';
import { WaterManagementMirror } from '../components/WaterManagementMirror';
import { MonitoringMirror } from '../components/MonitoringMirror';
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
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-bold text-emerald-400 uppercase">Online</span>
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
    backgroundImage,
    tileSizes: storeTileSizes,
    tileOrder: storeTileOrder,
    setTileSizes: updateStoreTileSizes,
    setTileOrder: updateStoreTileOrder,
    biaOnline,
    biaEnabled,
    toggleBia,
    lastSync,
    syncToSupabase
  } = useStore();

  const [isEditMode, setIsEditMode] = useState(false);
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
  
  const [biaStatus, setBiaStatus] = useState<{ 
    status: string; 
    supabaseConfigured: boolean;
    geminiConfigured: boolean;
    lastWebhookReceived: string | null;
    lastMessageExtracted: string | null;
    appUrl?: string;
  } | null>(null);

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
          setBiaStatus(data);
          retryCount = 0;
        } else {
          // If API fails (e.g. on Vercel), check Supabase directly
          if (isSupabaseConfigured) {
            const { error } = await supabase.from('clients').select('id').limit(1);
            setBiaStatus({
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
            setBiaStatus({
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

  // Check for overdue maintenances and notify
  useEffect(() => {
    const overdueItems = scheduledMaintenances.filter(m => {
      if (!m.nextDate) return false;
      const isOverdue = new Date(m.nextDate) < new Date();
      return isOverdue;
    });

    overdueItems.forEach(item => {
      const client = clients.find(c => c.id === item.clientId);
      const notificationId = `overdue-${item.id}-${item.nextDate}`;
      
      // Only add if not already notified for this specific item/date
      if (!notifications.some(n => n.message.includes(item.item) && n.message.includes(client?.name || ''))) {
        addNotification({
          title: 'Manutenção Atrasada!',
          message: `${item.item} em ${client?.name} venceu em ${safeFormatDate(item.nextDate)}`,
          type: 'WARNING'
        });
      }
    });
  }, [scheduledMaintenances, clients, addNotification]);

  const totalReceitas = receipts.reduce((acc, curr) => acc + curr.value, 0);
  const totalDespesas = costs.reduce((acc, curr) => acc + curr.value, 0);
  const saldo = totalReceitas - totalDespesas;
  const nextAppointments = useMemo(() => {
    return appointments
      .filter(a => a.start && new Date(a.start) > new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, [appointments]);

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
      const success = await sendWhatsAppMessage('5511999999999', 'Teste de conexão BiaBrain ' + new Date().toLocaleTimeString());
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
              message: { conversation: 'Bia, teste interno' }
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
      id: 'execution-center',
      type: 'wide',
      component: (
        <Link 
          to={isEditMode ? '#' : "/execution"} 
          onClick={(e) => isEditMode && e.preventDefault()}
          className="metro-tile-wide plastic-effect p-6 flex flex-col justify-between group border-neon-green/50 bg-neon-green/5"
        >
          <div className="flex justify-between items-start">
            <Play size={48} className="text-neon-green group-hover:scale-110 transition-transform neon-glow" fill="currentColor" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon-green opacity-60 animate-pulse">Live Now</span>
          </div>
          <div>
            <span className="text-2xl font-black text-white uppercase tracking-tighter">Central de Execução</span>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Acompanhamento em Tempo Real</p>
          </div>
        </Link>
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
        <div className="w-full h-full bg-emerald-600/20 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-4 flex flex-col justify-between group relative overflow-hidden active:scale-95 transition-all">
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Status do Sistema</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleBia();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold transition-all ${
                  biaEnabled 
                    ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}
                title={biaEnabled ? "Desativar Bia" : "Ativar Bia"}
              >
                {biaEnabled ? 'ON' : 'OFF'}
              </button>
              <div className={`w-2 h-2 rounded-full ${biaStatus?.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} title="Servidor Webhook" />
              <div className={`w-2 h-2 rounded-full ${biaOnline ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`} title="Processador Local (Navegador)" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1.5 text-[9px] relative z-10">
            <div className="flex justify-between text-emerald-100/70">
              <span>Webhook URL:</span>
              <span className="text-white font-mono truncate max-w-[100px]" title={`${biaStatus?.appUrl || ''}/api/webhook/whatsapp`}>
                {biaStatus?.appUrl ? `${biaStatus.appUrl.substring(0, 15)}...` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-emerald-100/70">
              <span>Processador:</span>
              <span className={`font-mono ${biaOnline ? 'text-blue-300' : 'text-gray-400'}`}>
                {biaOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between text-emerald-100/70">
              <span>Último Webhook:</span>
              <span className="text-white font-mono truncate max-w-[80px]">
                {biaStatus?.lastWebhookReceived ? new Date(biaStatus.lastWebhookReceived).toLocaleTimeString() : 'Nunca'}
              </span>
            </div>
            <div className="flex justify-between text-emerald-100/70">
              <span>Última Msg:</span>
              <span className="text-white font-mono truncate max-w-[80px]">
                {biaStatus?.lastMessageExtracted || 'Nenhuma'}
              </span>
            </div>
            
            <div className="flex justify-between text-emerald-100/70">
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
                className="flex-1 bg-black/20 border border-emerald-500/30 rounded px-2 py-1 text-[8px] text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  syncToSupabase();
                }}
                className="p-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded border border-emerald-500/30 transition-all"
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
              className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[8px] font-bold transition-colors"
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
              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
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
                <span className="text-5xl font-black text-white group-hover/fin:text-emerald-400 transition-all duration-500 scale-100 group-hover/fin:scale-110">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(saldo)}
                </span>
                <div className="mt-6 flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">Fluxo de Caixa Ativo</span>
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
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
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
                  <p className="text-sm font-bold">Insights da Bia Ativos</p>
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
          className={`w-full h-full bg-gradient-to-br from-blue-600/40 to-emerald-600/40 backdrop-blur-2xl p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-2xl active:scale-95 transition-all ${isEditMode ? 'cursor-grab' : 'cursor-pointer hover:brightness-110'}`}
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
            
            <div className="flex-1 space-y-2 overflow-hidden">
              {nextAppointments.length > 0 ? (
                nextAppointments.map((apt) => (
                  <div key={apt.id} className="border-l-2 border-white/20 pl-2 py-1 hover:bg-white/5 transition-colors rounded-r-lg">
                    <p className="text-[11px] font-bold truncate leading-tight text-white/90">{apt.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2 h-2 text-white/40" />
                      <p className="text-[9px] text-white/50 font-medium">
                        {apt.start ? (
                          `${safeFormatDate(apt.start, { day: '2-digit', month: 'short' })} • ${new Date(apt.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace('Invalid Date', 'Data inválida')}`
                        ) : (
                          'Horário não definido'
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] italic text-white/40">Sem compromissos</p>
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
          <div className="flex items-start gap-2 md:gap-4 h-full relative z-10">
            <div className="p-1.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0">
              <ClipboardCheck className="w-6 h-6 md:w-10 md:h-10 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[8px] md:text-[10px] font-black uppercase text-white/70 mb-0.5 md:mb-1 tracking-[0.2em] truncate">Manutenção Preventiva</p>
              <div className="space-y-0.5 md:space-y-1">
                <p className="font-black text-xs md:text-xl truncate text-white leading-tight">Manutenção preventiva</p>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="flex-1 h-1 md:h-1.5 bg-white/20 rounded-full overflow-hidden max-w-[60px] md:max-w-[100px]">
                    <div 
                      className={`h-full transition-all duration-1000 ${overdueMaintenances > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: overdueMaintenances > 0 ? '40%' : '100%' }}
                    />
                  </div>
                  <p className={`text-[8px] md:text-xs font-bold ${overdueMaintenances > 0 ? 'text-amber-400' : 'text-emerald-400'} truncate`}>
                    {overdueMaintenances > 0 ? `${overdueMaintenances} pendentes` : '100% em dia'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end relative z-10">
            <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Manutenção Preventiva</span>
            <div className="flex items-center gap-1 md:gap-2 bg-white/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg border border-white/10 shrink-0">
              <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-400" />
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
              className="text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
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
                    ticket.status === 'CONCLUIDO' ? 'text-emerald-400' : 
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
          className="w-full h-full bg-gradient-to-br from-[#60a917] to-[#4d8712] hover:brightness-110 transition-all p-4 flex flex-col justify-between group relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
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
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
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
            to={isEditMode ? '#' : "/clients"} 
            onClick={(e) => isEditMode && e.preventDefault()}
            title="Novo Cliente" 
            className="bg-gradient-to-br from-[#da532c] to-[#b94322] hover:brightness-110 transition-all flex items-center justify-center relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
            <UserPlus className="w-6 h-6 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
          </Link>
          <Link 
            to={isEditMode ? '#' : "/financial"} 
            onClick={(e) => isEditMode && e.preventDefault()}
            title="Novo Gasto" 
            className="bg-gradient-to-br from-[#00a300] to-[#008000] hover:brightness-110 transition-all flex items-center justify-center relative overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
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
            <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/20 shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
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
              : 'bg-gradient-to-br from-emerald-600 to-emerald-800'
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
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/30 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-400/50 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 blur-[50px] rounded-full translate-y-1/2 -translate-x-1/2 group-hover:bg-indigo-400/50 transition-all duration-700" />
          
          <div className="absolute top-4 right-4 z-10">
            <ExternalLink className="w-4 h-4 text-emerald-300 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex justify-center items-center h-full relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 rounded-full" />
              <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl relative z-10 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Maximize2 className="w-10 h-10 text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-indigo-300 drop-shadow-md">CONDFY.IA Web</span>
            <span className="text-[8px] font-bold text-white/50 tracking-widest mt-1">SISTEMA EXTERNO</span>
          </div>
        </a>
      )
    }
  ];

  const [tileSizes, setTileSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({});
  const [tiles, setTiles] = useState<TileData[]>(initialTiles);

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
    saldo, nextAppointments, notices.length, packages.length, 
    visitors.length, criticalEvents, energyData.length, supplyItems.length, payments.length, scheduledMaintenances.length,
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
      version: '1.0',
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
      className="min-h-screen -m-6 md:-m-8 p-3 sm:p-8 md:p-12 bg-[#004a7c] text-white overflow-x-hidden relative transition-all duration-700"
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(0, 74, 124, 0.7), rgba(0, 74, 124, 0.7)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
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
            
            {/* Bia Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all mt-2 md:mt-4 ${
              biaStatus?.status === 'online' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                biaStatus?.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'
              }`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Conexão com Banco de Dados: {biaStatus?.status === 'online' ? 'Online' : 'Offline'}
              </span>
              {!biaStatus?.supabaseConfigured && biaStatus?.status === 'online' && (
                <span className="text-[8px] opacity-60 ml-1">(Erro de Configuração)</span>
              )}
              {!biaStatus?.geminiConfigured && biaStatus?.status === 'online' && (
                <span className="text-[8px] opacity-60 ml-1">(Erro IA)</span>
              )}
            </div>
          </div>
          
          {biaStatus?.lastMessageExtracted && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 mb-2 w-fit animate-pulse">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Último comando recebido:</p>
              <p className="text-[10px] italic text-emerald-400">"{biaStatus.lastMessageExtracted}"</p>
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
                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
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
                await sendWhatsAppMessage('21982240134', 'Olá! Eu sou a Bia, sua assistente virtual do CONDFY.IA. Recebi seu comando e estou pronta para ajudar! 🚀');
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

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={tiles.map(t => t.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 relative z-10 max-w-[1400px] perspective-1000 grid-flow-dense">
            {tiles.filter(t => !hiddenTiles.includes(t.id)).map((tile) => {
              const currentSize = tileSizes[tile.id] || (tile.type === 'wide' ? 'medium' : 'small');
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
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-10 py-3 rounded-xl font-bold border border-emerald-500/30 transition-all active:scale-95 shadow-lg backdrop-blur-md"
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
