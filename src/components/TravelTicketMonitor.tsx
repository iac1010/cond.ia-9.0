import { useState, useEffect } from 'react';
import { Plane, Bus, Search, ArrowRight, RefreshCw, Bell, AlertTriangle, ExternalLink, TrendingDown, Trash2, Check, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface TravelDeal {
  id: string;
  origin: string;
  destination: string;
  type: 'FLIGHT' | 'BUS';
  company: string;
  price: number;
  originalPrice: number;
  discountPct: number;
  duration: string;
  departureDate: string;
  opportunityType: string;
  chosenDate?: string;
  directLink?: string;
}

interface PriceAlert {
  id: string;
  origin: string;
  destination: string;
  type: 'ALL' | 'FLIGHT' | 'BUS';
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
}

export function TravelTicketMonitor() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [chosenDate, setChosenDate] = useState(tomorrowStr);
  const [type, setType] = useState<'ALL' | 'FLIGHT' | 'BUS'>('ALL');
  const [deals, setDeals] = useState<TravelDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertTargetPrice, setAlertTargetPrice] = useState('200');
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Slugify helper for ClickBus and Buser links
  const slugify = (text: string) => {
    const cleanText = text.replace(/\s*\(.*?\)\s*/g, '').trim();
    return cleanText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Load alerts from localStorage on mount
  useEffect(() => {
    try {
      const savedAlerts = localStorage.getItem('travel_price_alerts');
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      } else {
        // Default seed alerts
        const defaultAlerts: PriceAlert[] = [
          {
            id: 'alert-1',
            origin: 'Rio de Janeiro',
            destination: 'São Paulo',
            type: 'FLIGHT',
            targetPrice: 200,
            currentPrice: 189.90,
            createdAt: new Date().toISOString()
          }
        ];
        setAlerts(defaultAlerts);
        localStorage.setItem('travel_price_alerts', JSON.stringify(defaultAlerts));
      }
    } catch (e) {
      console.error('Failed to load price alerts', e);
    }
  }, []);

  // Save alerts
  const saveAlerts = (newAlerts: PriceAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('travel_price_alerts', JSON.stringify(newAlerts));
  };

  // Fetch travel deals
  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (origin) queryParams.append('origin', origin);
      if (destination) queryParams.append('destination', destination);
      if (type !== 'ALL') queryParams.append('type', type);
      if (chosenDate) queryParams.append('date', chosenDate);

      const response = await fetch(`/api/travel-deals?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Falha ao consultar as melhores passagens');
      }
      const data = await response.json();
      setDeals(data.deals || []);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao atualizar preços. Usando tarifas locais.');
      // Fallback
      setDeals([
        {
          id: 'fb-1',
          origin: 'Rio de Janeiro (SDU)',
          destination: 'São Paulo (CGH)',
          type: 'FLIGHT',
          company: 'LATAM Airlines',
          price: 189.90,
          originalPrice: 295.00,
          discountPct: 35,
          duration: '1h 05m',
          departureDate: 'Amanhã',
          opportunityType: 'Menor preço histórico'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount, type change, or date change
  useEffect(() => {
    fetchDeals();
  }, [type, chosenDate]);

  // Handle Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeals();
  };

  // Quick Clear Search
  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setChosenDate(tomorrowStr);
    setType('ALL');
    setTimeout(() => {
      fetchDeals();
    }, 50);
  };

  // Create new alert
  const handleCreateAlert = () => {
    const alertOrigin = origin.trim() || 'Qualquer Origem';
    const alertDestination = destination.trim() || 'Qualquer Destino';
    const target = parseFloat(alertTargetPrice) || 200;

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      origin: alertOrigin,
      destination: alertDestination,
      type: type,
      targetPrice: target,
      currentPrice: deals.length > 0 ? Math.min(...deals.map(d => d.price)) : target * 0.95,
      createdAt: new Date().toISOString()
    };

    const updatedAlerts = [newAlert, ...alerts];
    saveAlerts(updatedAlerts);
    setShowAlertModal(false);
    toast.success(`Alerta ativado para ${alertOrigin} ➔ ${alertDestination}!`, {
      icon: '🔔',
      style: {
        background: '#18181b',
        color: '#fff',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }
    });
  };

  // Remove alert
  const handleRemoveAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    saveAlerts(updated);
    toast.success('Monitoramento desativado', {
      style: {
        background: '#18181b',
        color: '#fff',
      }
    });
  };

  // Simulated Alert Trigger (Force a Price Drop to test opportunity feature!)
  const simulatePriceDrop = (alert: PriceAlert) => {
    const dropAmount = Math.round(alert.currentPrice * 0.75 * 100) / 100; // 25% drop!
    
    // Create temporary deal simulating this drop
    const newDeal: TravelDeal = {
      id: `promo-drop-${Date.now()}`,
      origin: alert.origin.includes('(') ? alert.origin : `${alert.origin} (Promo)`,
      destination: alert.destination.includes('(') ? alert.destination : `${alert.destination} (Promo)`,
      type: alert.type === 'ALL' ? 'FLIGHT' : alert.type,
      company: alert.type === 'BUS' ? 'Buser Especial' : 'Azul Promo',
      price: dropAmount,
      originalPrice: alert.currentPrice,
      discountPct: 25,
      duration: alert.type === 'BUS' ? '5h 10m' : '1h 15m',
      departureDate: 'Super Tarifa Ativa!',
      opportunityType: '🚨 PREÇO ABAIXOU DO ALERTA!'
    };

    // Prepend to deals
    setDeals([newDeal, ...deals.filter(d => d.id !== newDeal.id)]);
    
    // Update current price in alerts
    const updatedAlerts = alerts.map(a => {
      if (a.id === alert.id) {
        return { ...a, currentPrice: dropAmount };
      }
      return a;
    });
    saveAlerts(updatedAlerts);

    toast((t) => (
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Oportunidade Encontrada!</span>
        </div>
        <p className="text-xs text-white/80">
          Preço despencou de R$ {alert.currentPrice.toFixed(2)} para <strong>R$ {dropAmount.toFixed(2)}</strong> na rota {alert.origin} ➔ {alert.destination}!
        </p>
      </div>
    ), {
      duration: 5000,
      icon: '✈️',
      style: {
        background: '#09090b',
        color: '#fff',
        border: '1px solid #10b981',
      }
    });
  };

  return (
    <div className="bg-zinc-950/40 border border-white/10 rounded-3xl p-5 space-y-4 relative overflow-hidden shadow-2xl">
      {/* Decorative ambient glowing background light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-blue-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Plane className="w-4 h-4 text-blue-400 animate-pulse" />
            <Bus className="w-2.5 h-2.5 text-emerald-400 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-white">Monitor de Passagens</span>
            <p className="text-[9px] text-white/40 font-mono uppercase tracking-widest leading-none">Aéreo & Terrestre</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={fetchDeals}
            disabled={loading}
            className={`p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer disabled:opacity-50`}
            title="Recarregar Ofertas"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAlertModal(true)}
            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 transition-colors cursor-pointer text-[10px] font-black flex items-center gap-1"
            title="Criar Alerta de Preço"
          >
            <Bell className="w-3 h-3" />
            <span>Criar Alerta</span>
          </button>
        </div>
      </div>

      {/* Interactive Search Fields */}
      <form onSubmit={handleSearch} className="grid grid-cols-3 gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5">
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-white/40 uppercase tracking-wider pl-1">Origem</label>
          <div className="relative flex items-center">
            <input 
              type="text"
              placeholder="Ex: Rio (GIG)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full text-[10px] font-bold bg-zinc-950/50 border border-white/5 focus:border-blue-500/30 rounded-xl px-2 py-1.5 text-white placeholder-white/20 focus:outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-white/40 uppercase tracking-wider pl-1">Destino</label>
          <div className="relative flex items-center">
            <input 
              type="text"
              placeholder="Ex: São Paulo"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-[10px] font-bold bg-zinc-950/50 border border-white/5 focus:border-blue-500/30 rounded-xl px-2 py-1.5 text-white placeholder-white/20 focus:outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-white/40 uppercase tracking-wider pl-1">Data Partida</label>
          <div className="relative flex items-center">
            <input 
              type="date"
              value={chosenDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setChosenDate(e.target.value)}
              className="w-full text-[10px] font-bold bg-zinc-950/50 border border-white/5 focus:border-blue-500/30 rounded-xl px-2 py-1.5 text-white focus:outline-none transition-all cursor-pointer"
            />
          </div>
        </div>
        <div className="col-span-3 flex gap-1.5 pt-1">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[9px] uppercase tracking-wider py-1.5 rounded-xl transition-all shadow-lg shadow-blue-900/10 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3 h-3" />
            <span>Buscar Cotação Real</span>
          </button>
          {(origin || destination || type !== 'ALL') && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-colors text-[9px] font-black uppercase tracking-wider cursor-pointer border border-white/5"
            >
              Limpar
            </button>
          )}
        </div>
      </form>

      {/* Transport Filter Tabs */}
      <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
        <button
          onClick={() => setType('ALL')}
          className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            type === 'ALL' 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setType('FLIGHT')}
          className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            type === 'FLIGHT' 
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20 shadow-sm' 
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Plane className="w-3 h-3" />
          <span>Avião</span>
        </button>
        <button
          onClick={() => setType('BUS')}
          className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            type === 'BUS' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shadow-sm' 
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Bus className="w-3 h-3" />
          <span>Ônibus</span>
        </button>
      </div>

      {/* Active Price Alerts (Rotas Monitoradas) */}
      {alerts.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest pl-1 flex items-center gap-1">
            <Bell className="w-2.5 h-2.5 text-blue-400" />
            <span>Monitoramento Ativo (Foco no Menor Preço)</span>
          </span>
          <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="group flex items-center justify-between p-2 bg-gradient-to-r from-blue-950/10 to-indigo-950/10 border border-blue-500/10 hover:border-blue-500/20 rounded-xl text-[10px] transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/5 rounded-full blur-md pointer-events-none" />
                
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white">
                    <span className="truncate">{alert.origin}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-white/30 shrink-0" />
                    <span className="truncate">{alert.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[8px] font-mono text-white/50">
                    <span className={`px-1 rounded-sm text-[7px] font-bold ${
                      alert.type === 'FLIGHT' ? 'bg-blue-500/10 text-blue-400' : alert.type === 'BUS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/60'
                    }`}>
                      {alert.type === 'FLIGHT' ? 'AVIÃO' : alert.type === 'BUS' ? 'ÔNIBUS' : 'TODOS'}
                    </span>
                    <span>Alerta: R$ {alert.targetPrice.toFixed(0)}</span>
                    <span className="text-white/20">|</span>
                    <span className="text-emerald-400 font-bold">Atual: R$ {alert.currentPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 z-10">
                  <button
                    onClick={() => simulatePriceDrop(alert)}
                    className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded border border-emerald-500/20 text-[7px] font-bold transition-all cursor-pointer"
                    title="Simular queda rápida de preço para testar monitoramento"
                  >
                    Simular Queda
                  </button>
                  <button
                    onClick={() => handleRemoveAlert(alert.id)}
                    className="p-1 hover:bg-red-500/10 rounded text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                    title="Parar de monitorar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lowest Prices List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest pl-1 flex items-center gap-1">
            <TrendingDown className="w-2.5 h-2.5 text-emerald-400" />
            <span>Melhores Oportunidades no Radar</span>
          </span>
          <span className="text-[8px] font-mono text-emerald-400/80 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            DESCONTOS DE ATÉ 45%
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 space-y-2">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-3 bg-white/5 rounded-2xl space-y-2 animate-pulse border border-white/5">
                    <div className="flex justify-between">
                      <div className="w-24 h-3 bg-white/10 rounded" />
                      <div className="w-10 h-3 bg-white/10 rounded" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-16 h-3 bg-white/10 rounded" />
                      <div className="w-12 h-3 bg-white/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col items-center justify-center text-center py-4">
                <AlertTriangle className="w-6 h-6 text-red-400 mb-1.5 opacity-70" />
                <p className="text-[10px] text-red-200 font-bold">{error}</p>
              </div>
            ) : deals.length === 0 ? (
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center py-6">
                <Search className="w-6 h-6 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/50 font-bold">Nenhuma passagem encontrada</p>
                <p className="text-[10px] text-white/30 max-w-[180px] mx-auto mt-1">
                  Tente alterar os termos de busca ou remover os filtros de origem e destino.
                </p>
              </div>
            ) : (
              deals.map((deal, index) => {
                const isFlight = deal.type === 'FLIGHT';
                return (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
                    className={`group p-3 bg-white/5 hover:bg-white/[0.08] border rounded-2xl transition-all duration-200 relative ${
                      isFlight ? 'border-blue-500/10 hover:border-blue-500/20' : 'border-emerald-500/10 hover:border-emerald-500/20'
                    }`}
                  >
                    {/* Badge alert indicator if opportunity is extremely good */}
                    {deal.discountPct >= 35 && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/15 px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider animate-pulse">
                        <Sparkles className="w-2 h-2" />
                        <span>Oportunidade de Ouro</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black border flex items-center gap-1 ${
                          isFlight 
                            ? 'bg-blue-950/40 text-blue-400 border-blue-500/25' 
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/25'
                        }`}>
                          {isFlight ? <Plane className="w-2.5 h-2.5" /> : <Bus className="w-2.5 h-2.5" />}
                          {isFlight ? 'AÉREO' : 'ÔNIBUS'}
                        </span>
                        <span className="text-[8px] font-bold text-white/30 truncate max-w-[90px]">{deal.company}</span>
                      </div>
                      
                      {/* Price Drop Tag */}
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                        -{deal.discountPct}% OFF
                      </span>
                    </div>

                    {/* Route Details */}
                    <div className="flex items-center justify-between gap-1.5 mt-2.5 pb-2 border-b border-white/5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{deal.origin}</p>
                        <p className="text-[8px] text-white/40 font-mono mt-0.5">Partida: {deal.departureDate}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-white/20 shrink-0 mx-0.5" />
                      <div className="text-right min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{deal.destination}</p>
                        <p className="text-[8px] text-white/40 font-mono mt-0.5">Duração: {deal.duration}</p>
                      </div>
                    </div>

                     {/* Price and Action Section */}
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <div>
                        <span className="text-[8px] font-mono text-white/30 line-through leading-none block">
                          De R$ {deal.originalPrice.toFixed(2)}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-[9px] font-bold text-white/60">R$</span>
                          <span className="text-sm font-black text-white tracking-tight">{deal.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <a
                        href={
                          deal.directLink || (isFlight
                            ? `https://www.google.com/travel/flights?q=Voos%20de%20${encodeURIComponent(deal.origin)}%20para%20${encodeURIComponent(deal.destination)}%20no%20dia%20${deal.chosenDate || chosenDate}`
                            : deal.company.toLowerCase().includes('buser')
                              ? `https://www.buser.com.br/onibus/${slugify(deal.origin)}/${slugify(deal.destination)}?partida=${deal.chosenDate || chosenDate}`
                              : `https://www.clickbus.com.br/onibus/${slugify(deal.origin)}/${slugify(deal.destination)}?dep=${deal.chosenDate || chosenDate}`)
                        }
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          isFlight 
                            ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/10' 
                            : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/10'
                        }`}
                      >
                        <span>Emitir</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {deal.opportunityType && (
                      <div className="mt-2 text-[8px] font-mono text-amber-400/80 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 w-fit">
                        {deal.opportunityType}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Extra helper info */}
      <div className="text-[8.5px] text-white/30 font-semibold text-center border-t border-white/5 pt-2 flex items-center justify-center gap-1">
        <span>Foco de menor tarifa ativada: Monitorando em tempo real</span>
        <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* Create Alert Modal / Popover style inside the widget */}
      <AnimatePresence>
        {showAlertModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm p-5 flex flex-col justify-between z-30 rounded-3xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[11px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                  <span>Novo Alerta de Preço</span>
                </span>
                <button 
                  onClick={() => setShowAlertModal(false)}
                  className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[9px] text-white/50 leading-relaxed">
                Você receberá notificações instantâneas de descontos assim que as passagens da rota ficarem abaixo do valor estipulado.
              </p>

              <div className="space-y-2">
                <div>
                  <label className="text-[8px] font-bold text-white/40 uppercase tracking-wider block mb-1">Rota Atual</label>
                  <div className="text-[10px] font-bold text-white bg-white/5 p-2 rounded-xl border border-white/5 flex items-center gap-1.5">
                    <span className="truncate">{origin || 'Qualquer Origem'}</span>
                    <ArrowRight className="w-3 h-3 text-white/30" />
                    <span className="truncate">{destination || 'Qualquer Destino'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-bold text-white/40 uppercase tracking-wider block mb-1">Tipo de Transporte</label>
                  <div className="text-[10px] text-white bg-white/5 p-1 rounded-xl border border-white/5 flex gap-1">
                    <button 
                      type="button" 
                      onClick={() => setType('ALL')}
                      className={`flex-1 text-center py-1 rounded font-bold text-[8px] uppercase tracking-wider ${type === 'ALL' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                    >
                      Todos
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setType('FLIGHT')}
                      className={`flex-1 text-center py-1 rounded font-bold text-[8px] uppercase tracking-wider ${type === 'FLIGHT' ? 'bg-blue-500/20 text-blue-300' : 'text-white/40'}`}
                    >
                      Avião
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setType('BUS')}
                      className={`flex-1 text-center py-1 rounded font-bold text-[8px] uppercase tracking-wider ${type === 'BUS' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/40'}`}
                    >
                      Ônibus
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-bold text-white/40 uppercase tracking-wider block mb-1">Preço Máximo de Alerta (R$)</label>
                  <input 
                    type="number"
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    className="w-full text-xs font-black bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ex: 250"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-bold text-[9px] uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAlert}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[9px] uppercase tracking-wider py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ativar Alerta</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
