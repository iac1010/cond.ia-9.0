import React from 'react';
import { Quote, Client } from '../types';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface QuotesMirrorProps {
  quotes: Quote[];
  clients: Client[];
  className?: string;
  showLabel?: boolean;
  isEditMode?: boolean;
}

export function QuotesMirror({ quotes, clients, className = '', showLabel = true }: QuotesMirrorProps) {
  const pendingQuotes = quotes.filter(q => q.status === 'DRAFT' || q.status === 'SENT');
  const approvedQuotes = quotes.filter(q => q.status === 'APPROVED');

  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente não identificado';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/70" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Orçamentos</span>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[8px] font-bold text-white/50">{pendingQuotes.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-[8px] font-bold text-white/50">{approvedQuotes.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-hidden">
        {recentQuotes.map((quote) => (
          <div 
            key={quote.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                {quote.status === 'APPROVED' ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : quote.status === 'REJECTED' ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white/80 truncate group-hover:text-white transition-colors">
                  {getClientName(quote.clientId)}
                </p>
                <p className="text-[8px] font-medium text-white/40">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {quotes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-4 opacity-20">
            <FileText className="w-8 h-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum orçamento</p>
          </div>
        )}
      </div>
    </div>
  );
}
