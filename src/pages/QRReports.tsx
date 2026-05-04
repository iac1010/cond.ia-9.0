import React, { useMemo } from 'react';
import { useStore } from '../store';
import { Ticket } from '../types';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  User, 
  Calendar,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { safeFormatDate } from '../utils/dateUtils';

export default function QRReports() {
  const navigate = useNavigate();
  const { tickets, updateTicket, clients } = useStore();

  const qrReports = useMemo(() => {
    return tickets
      .filter(t => t.status === 'PENDENTE_APROVACAO' && t.reportedBy)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tickets]);

  const handleApprove = (ticket: Ticket) => {
    updateTicket(ticket.id, { ...ticket, status: 'APROVADO' });
    toast.success('Relato aprovado!');
  };

  const handleReject = (ticket: Ticket) => {
    updateTicket(ticket.id, { ...ticket, status: 'REJEITADO' });
    toast.success('Relato rejeitado.');
  };

  const getClientName = (clientId?: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Desconhecido';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative selection:bg-cyan-500/30">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-8">
          <BackButton />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Reports Center</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
              Relatos <span className="text-amber-400">QR</span>
            </h1>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 backdrop-blur-xl">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">{qrReports.length} Pendentes</span>
        </div>
      </header>

      <main className="relative z-10 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 gap-8">
          {qrReports.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-20 text-center backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                <MessageSquare className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-4xl font-black tracking-tighter uppercase mb-4 italic">Tudo em Ordem</h3>
              <p className="text-white/40 max-w-md mx-auto text-lg font-medium leading-relaxed">
                Não há novos relatos pendentes de aprovação no momento. O sistema está operando normalmente.
              </p>
            </div>
          ) : (
            qrReports.map((report, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={report.id}
                className="bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Photo Preview */}
                  <div className="w-full lg:w-80 h-64 lg:h-auto bg-white/5 relative overflow-hidden group/img">
                    {report.photoBefore ? (
                      <img 
                        src={report.photoBefore} 
                        alt="Problema relatado" 
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
                        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Sem Registro Visual</span>
                      </div>
                    )}
                    <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                      Pendente
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-8 lg:p-12 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-6 mb-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          {safeFormatDate(report.date)} {new Date(report.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace('Invalid Date', 'Data inválida')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                          <MapPin className="w-3 h-3" />
                          {getClientName(report.clientId)} • {report.location}
                        </div>
                      </div>

                      <div className="mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block mb-2">Relatado por {report.reportedBy}</span>
                        <h3 className="text-3xl font-black text-white tracking-tight italic leading-tight">
                          "{report.reportedProblem}"
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleApprove(report)}
                          className="bg-blue-500 hover:bg-blue-400 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar OS
                        </button>
                        <button
                          onClick={() => handleReject(report)}
                          className="bg-white/5 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all border border-white/10 active:scale-95"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/tickets/${report.id}`)}
                        className="text-white/30 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        Detalhes
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
