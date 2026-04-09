import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun, User, LogOut, Database, Bell } from 'lucide-react';
import { useStore } from './store';
import { supabase, isSupabaseConfigured, isLocalSupabase } from './lib/supabase';

import { Toaster } from 'react-hot-toast';

import Dashboard from './pages/Dashboard';
import CommunicationCenter from './pages/CommunicationCenter';
import Residents from './pages/Residents';
import Operational from './pages/Operational';
import Reservations from './pages/Reservations';
import ChecklistManager from './pages/ChecklistManager';
import Tickets from './pages/Tickets';
import TicketForm from './pages/TicketForm';
import TicketView from './pages/TicketView';
import Settings from './pages/Settings';
import KanbanBoard from './pages/KanbanBoard';
import Quotes from './pages/Quotes';
import Receipts from './pages/Receipts';
import Financial from './pages/Financial';
import Calendar from './pages/Calendar';
import Products from './pages/Products';
import Login from './pages/Login';
import Weather from './pages/Weather';
import IntelligentChecklist from './pages/IntelligentChecklist';
import QRManager from './pages/QRManager';
import QRReports from './pages/QRReports';
import PublicTicketForm from './pages/PublicTicketForm';
import PublicChat from './pages/PublicChat';
import PublicFeedback from './pages/PublicFeedback';
import SuppliesManager from './pages/SuppliesManager';
import AccountabilityDashboard from './pages/AccountabilityDashboard';
import ConsumptionDashboard from './pages/ConsumptionDashboard';
import VirtualAssembly from './pages/VirtualAssembly';
import Notices from './pages/Notices';
import LockerManager from './pages/LockerManager';
import VisitorControl from './pages/VisitorControl';
import IotAutomation from './pages/IotAutomation';
import EnergyMonitoring from './pages/EnergyMonitoring';
import DocumentFactory from './pages/DocumentFactory';
import DocumentManagement from './pages/DocumentManagement';
import SystemPresentation from './pages/SystemPresentation';
import ExecutionCenter from './pages/ExecutionCenter';
import { AssistantBia } from './components/AssistantBia';
import { BiaBrain } from './components/BiaBrain';


function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, isAuthenticated, logout, notifications, markNotificationAsRead, clearNotifications, companyLogo, backgroundImage, fetchInitialData, biaEnabled } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, fetchInitialData]);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const favicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    const defaultIcon = 'https://api.iconify.design/lucide:database.svg?color=%23004a7c&v=1';
    const iconUrl = companyLogo ? `${companyLogo}${companyLogo.includes('?') ? '&' : '?'}v=${Date.now()}` : defaultIcon;
    favicons.forEach(favicon => {
      favicon.setAttribute('href', iconUrl);
    });
  }, [companyLogo]);

  if (!isAuthenticated && location.pathname !== '/report') {
    return <Login />;
  }

  const isDashboard = location.pathname === '/';
  const isImmersive = isDashboard || [
    '/tickets', 
    '/service-orders', 
    '/tickets/new', 
    '/calendar', 
    '/kanban', 
    '/products', 
    '/financial', 
    '/receipts', 
    '/settings',
    '/clients',
    '/checklist',
    '/intelligent-checklist',
    '/qr-codes',
    '/supplies',
    '/accountability',
    '/consumption',
    '/assembly',
    '/notices',
    '/locker',
    '/visitors',
    '/monitoring',
    '/energy',
    '/document-factory',
    '/document-management',
    '/presentation',
    '/budget-forecast',
    '/financial-brain'
  ].some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white transition-colors duration-200 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Image */}
      {backgroundImage && (
        <div 
          className="fixed inset-0 z-0 opacity-20 pointer-events-none"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      {/* Modern Top Bar */}
      {!isImmersive && (
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-20 relative">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              title="Voltar para a página principal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-3 group">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-zinc-700" />
              ) : (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Database className="w-4 h-4" />
                </div>
              )}
              <span className="text-xl font-bold group-hover:text-primary transition-colors">
                Dashboard
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block mr-4">
              <div className="text-sm font-medium">{time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors relative" 
                  title="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                      <h3 className="font-bold">Notificações</h3>
                      <button onClick={clearNotifications} className="text-xs text-primary hover:underline">Limpar tudo</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">
                          Nenhuma notificação
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`p-4 border-b border-gray-50 dark:border-zinc-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${
                                n.type === 'WARNING' ? 'text-amber-500' : 
                                n.type === 'ERROR' ? 'text-red-500' : 
                                n.type === 'SUCCESS' ? 'text-green-500' : 'text-blue-500'
                              }`}>
                                {n.type}
                              </span>
                              <span className="text-[10px] text-gray-400">{new Date(n.date).toLocaleTimeString()}</span>
                            </div>
                            <h4 className="text-sm font-bold mb-1">{n.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" title="Alternar Tema">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" title="Sair">
                <LogOut className="w-5 h-5" />
              </button>
              <Link to="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" title="Configurações">
                <SettingsIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 relative z-10 ${isDashboard ? '' : 'p-6 md:p-8'}`}>
        {children}
      </main>
      {biaEnabled && <AssistantBia />}
    </div>
  );
}

import BillingRules from './pages/BillingRules';
import Contracts from './pages/Contracts';
import RenovationsMoves from './pages/RenovationsMoves';
import BudgetForecast from './pages/BudgetForecast';
import FinancialBrain from './pages/FinancialBrain';
import TechnicalReport from './pages/TechnicalReport';
import SalesPlanning from './pages/SalesPlanning';
import { CommercialCenter } from './pages/CommercialCenter';

export default function App() {
  const { biaEnabled } = useStore();
  
  return (
    <HashRouter>
      {biaEnabled && <BiaBrain />}
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/communication" element={<CommunicationCenter />} />
          <Route path="/clients" element={<Residents />} />
          <Route path="/products" element={<Products />} />
          <Route path="/checklist" element={<ChecklistManager />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/service-orders" element={<Tickets />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/intelligent-checklist" element={<IntelligentChecklist />} />
          <Route path="/qr-codes" element={<QRManager />} />
          <Route path="/qr-reports" element={<QRReports />} />
          <Route path="/report" element={<PublicTicketForm />} />
          <Route path="/chat" element={<PublicChat />} />
          <Route path="/feedback" element={<PublicFeedback />} />
          <Route path="/supplies" element={<SuppliesManager />} />
          <Route path="/accountability" element={<AccountabilityDashboard />} />
          <Route path="/consumption" element={<ConsumptionDashboard />} />
          <Route path="/billing-rules" element={<BillingRules />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/renovations-moves" element={<RenovationsMoves />} />
          <Route path="/budget-forecast" element={<BudgetForecast />} />
          <Route path="/financial-brain" element={<FinancialBrain />} />
          <Route path="/assembly" element={<VirtualAssembly />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/locker" element={<LockerManager />} />
          <Route path="/visitors" element={<VisitorControl />} />
          <Route path="/monitoring" element={<IotAutomation />} />
          <Route path="/operational" element={<Operational />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/energy" element={<EnergyMonitoring />} />
          <Route path="/tickets/new" element={<TicketForm />} />
          <Route path="/tickets/:id/edit" element={<TicketForm />} />
          <Route path="/tickets/:id" element={<TicketView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/document-factory" element={<DocumentFactory />} />
          <Route path="/document-management" element={<DocumentManagement />} />
          <Route path="/execution" element={<ExecutionCenter />} />
          <Route path="/technical-report" element={<TechnicalReport />} />
          <Route path="/presentation" element={<SystemPresentation />} />
          <Route path="/sales-planning" element={<SalesPlanning />} />
          <Route path="/commercial" element={<CommercialCenter />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
