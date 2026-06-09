import { useState, useEffect } from 'react';
import { 
  Mail, Loader2, RefreshCw, Search, LogOut, ExternalLink, Calendar,
  Inbox, EyeOff, Send, CheckCircle2, User as UserIcon
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../services/workspaceAuth';
import toast from 'react-hot-toast';
import { User } from 'firebase/auth';

interface EmailMessage {
  id: string;
  snippet: string;
  subject: string;
  sender: string;
  date: string;
  isUnread: boolean;
}

type EmailFilterId = 'inbox' | 'unread' | 'sent';

export default function GmailWidget({ isEditMode }: { isEditMode?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [filter, setFilter] = useState<EmailFilterId>('inbox');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Listener for dynamic connection
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

  // Fetch emails when token or filter changes
  useEffect(() => {
    if (token) {
      fetchEmails();
    } else {
      setMessages([]);
    }
  }, [token, filter]);

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
        toast.success(`Conta sincronizada! Inbox do Gmail conectado. 📬`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao conectar ao Gmail.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditMode) return;

    if (!window.confirm('Deseja desconectar sua conta do Gmail?')) return;

    try {
      await logout();
      setUser(null);
      setToken(null);
      setMessages([]);
      toast.success('Desconectado do Gmail.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desconectar.');
    }
  };

  const getGmailQuery = () => {
    let query = '';
    if (filter === 'inbox') query = 'is:inbox';
    else if (filter === 'unread') query = 'is:unread is:inbox';
    else if (filter === 'sent') query = 'is:sent';

    if (searchTerm.trim()) {
      query += ` ${searchTerm.trim()}`;
    }
    return encodeURIComponent(query);
  };

  // Fetch emails from the Gmail REST API
  const fetchEmails = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const queryParam = getGmailQuery();
      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6&q=${queryParam}`;
      
      const res = await fetch(listUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Falha ao listar e-mails');
      }

      const listData = await res.json();
      
      if (!listData.messages || listData.messages.length === 0) {
        setMessages([]);
        return;
      }

      // Fetch details in parallel for maximum speed
      const detailsPromises = listData.messages.map(async (msg: any) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!detailRes.ok) return null;
        return detailRes.json();
      });

      const rawDetailsList = await Promise.all(detailsPromises);
      const parsedEmails: EmailMessage[] = rawDetailsList
        .filter(Boolean)
        .map((email: any) => {
          const headers = email.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Sem Assunto)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Remetente Desconhecido';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          
          // Check label ids to verify if it's unread
          const isUnread = (email.labelIds || []).includes('UNREAD');

          // Clean sender name format e.g. "Sandro <sandro@domain.com>" -> "Sandro"
          const cleanSender = from.replace(/^"?(.*?)"?\s*<.*>$/, '$1').trim();

          return {
            id: email.id,
            snippet: email.snippet || '',
            subject,
            sender: cleanSender || from,
            date: formatDate(date),
            isUnread
          };
        });

      setMessages(parsedEmails);
    } catch (err) {
      console.error('Error fetching emails:', err);
      // Let's not spam toasts if authentication has expired
      if (token) {
        toast.error('Erro ao atualizar e-mails. Verifique as credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      // Formatting to relative dates if today, or DD/MM if older
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchEmails();
    }
  };

  return (
    <div 
      className="w-full h-full text-white bg-zinc-950/90 p-4 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl group/widget"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background visual gloss */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full mix-blend-screen pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-900 rounded-lg border border-white/10">
            <Mail className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wide">
              Mensagens Inbox
            </h3>
            <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Gmail Direct</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              disabled={loading}
              title="Sincronizar"
              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/5 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-rose-400' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              title={`Sincronizado como ${user.email}`}
              className="p-1 bg-white/5 hover:bg-rose-500/15 text-white/40 hover:text-rose-400 rounded-lg border border-white/5 transition-all text-[8px] flex items-center gap-1"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-3.5 h-3.5 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              )}
              <LogOut className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {!user ? (
          /* Authentication Lock Screen */
          <div className="flex-grow flex flex-col items-center justify-center text-center p-3">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-red-500/20 blur-md rounded-full animate-pulse" />
              <Mail className="w-9 h-9 text-rose-400 relative" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white/70 mb-1.5">Acesso ao Gmail</p>
            <p className="text-[8.5px] text-white/40 leading-relaxed max-w-[180px] mb-4">
              Acompanhe notificações, comunicados e solicitações diretamente no Condfy.
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
              {authLoading ? 'CONECTANDO...' : 'SINCROMIZAR EMAIL'}
            </button>
          </div>
        ) : (
          /* Active Gmail Interface */
          <div className="flex-grow flex flex-col justify-between h-full min-h-0">
            {/* Quick Filter tabs & Search Bar */}
            <div className="flex flex-col gap-2 mb-2 shrink-0">
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
                <button
                  onClick={() => setFilter('inbox')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 text-[8px] font-black uppercase rounded-md transition-all ${filter === 'inbox' ? 'bg-zinc-800 text-rose-400 border border-white/5 shadow' : 'text-white/40 hover:text-white/70'}`}
                >
                  <Inbox className="w-2.5 h-2.5" />
                  Recebidos
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 text-[8px] font-black uppercase rounded-md transition-all ${filter === 'unread' ? 'bg-zinc-800 text-rose-400 border border-white/5 shadow' : 'text-white/40 hover:text-white/70'}`}
                >
                  <EyeOff className="w-2.5 h-2.5" />
                  Não Lidas
                </button>
                <button
                  onClick={() => setFilter('sent')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 text-[8px] font-black uppercase rounded-md transition-all ${filter === 'sent' ? 'bg-zinc-800 text-rose-400 border border-white/5 shadow' : 'text-white/40 hover:text-white/70'}`}
                >
                  <Send className="w-2.5 h-2.5" />
                  Enviados
                </button>
              </div>

              {/* Search input bar */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Pesquisar e-mails... (pressione Enter)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 pl-7.5 py-1 text-[9px] text-white placeholder-white/30 focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>

            {/* Live Message List */}
            <div className="flex-grow min-h-0 overflow-y-auto space-y-1.5 scrollbar-thin flex flex-col py-1 justify-start">
              {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center py-6 text-white/30 gap-1.5">
                  <Loader2 className="w-5 h-5 animate-spin text-rose-400 animate-pulse" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">Buscando e-mails...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((email) => (
                  <a
                    key={email.id}
                    href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block p-2 rounded-xl border transition-all text-left relative group ${
                      email.isUnread 
                        ? 'bg-rose-500/[0.04] border-rose-500/25 hover:bg-rose-500/[0.08]' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {/* Blue dot for unread */}
                    {email.isUnread && (
                      <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    )}

                    <div className="flex items-center justify-between gap-1 mb-0.5 pr-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <UserIcon className="w-2.5 h-2.5 text-white/40 shrink-0" />
                        <span className="text-[8.5px] font-black uppercase text-white/80 truncate">
                          {email.sender}
                        </span>
                      </div>
                      <span className="text-[7.5px] font-bold text-white/30 group-hover:text-white/60 shrink-0">
                        {email.date}
                      </span>
                    </div>

                    <h4 className={`text-[8.5px] truncate max-w-full leading-tight mb-0.5 ${
                      email.isUnread ? 'font-black text-rose-300' : 'font-bold text-white/90'
                    }`}>
                      {email.subject}
                    </h4>

                    <p className="text-[7.5px] text-white/40 line-clamp-2 leading-relaxed">
                      {email.snippet}
                    </p>

                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-2.5 h-2.5 text-rose-400" />
                    </div>
                  </a>
                ))
              ) : (
                <div className="py-8 border border-dashed border-white/5 rounded-2xl bg-white/1 text-center flex-grow flex flex-col justify-center items-center">
                  <CheckCircle2 className="w-5 h-5 text-zinc-700 mb-1" />
                  <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block">Sua caixa está limpa</span>
                  <span className="text-[7.5px] text-white/20">Nenhum e-mail correspondente</span>
                </div>
              )}
            </div>

            {/* Bottom Actions info */}
            <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[7px] text-white/35 font-bold uppercase tracking-wider shrink-0 mt-1">
              <span>Sincronizado</span>
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-rose-400 transition-colors"
              >
                Abrir Inbox Completo <ExternalLink className="w-2 h-2" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
