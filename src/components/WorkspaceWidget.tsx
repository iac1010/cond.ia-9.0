import { useState, useEffect, useRef } from 'react';
import { 
  FileText, Table, Upload, Loader2, Cloud, LogOut, CheckCircle2, ExternalLink, Video, Calendar, RefreshCw
} from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../services/workspaceAuth';
import toast from 'react-hot-toast';
import { User } from 'firebase/auth';

interface CreatedFile {
  id: string;
  name: string;
  type: 'doc' | 'sheet' | 'drive' | 'meet';
  url: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  url: string;
}

export default function WorkspaceWidget({ isEditMode }: { isEditMode?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null); // 'doc', 'sheet', 'upload', 'auth'
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [recentFiles, setRecentFiles] = useState<CreatedFile[]>(() => {
    const saved = localStorage.getItem('condfy_recent_workspace_files');
    return saved ? JSON.parse(saved) : [];
  });
  const [subTab, setSubTab] = useState<'calendar' | 'recent'>('calendar');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('condfy_recent_workspace_files', JSON.stringify(recentFiles));
  }, [recentFiles]);

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

  const fetchCalendarEvents = async (currentToken: string | null = token) => {
    const activeToken = currentToken || token;
    if (!activeToken) return;
    setEventsLoading(true);
    try {
      const now = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Accept': 'application/json'
        }
      });
      if (res.status === 401 || res.status === 403) {
        console.warn('Google Calendar API returned 401/403 in WorkspaceWidget. Token expired. Logging out.');
        await logout();
        setUser(null);
        setToken(null);
        setEvents([]);
        return;
      }
      if (!res.ok) {
        throw new Error('Falha ao buscar calendário');
      }
      const data = await res.json();
      if (data.items) {
        const parsed = data.items.map((item: any) => {
          let startStr = '';
          if (item.start?.dateTime) {
            const d = new Date(item.start.dateTime);
            startStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ')';
          } else if (item.start?.date) {
            const d = new Date(item.start.date + 'T00:00:00');
            startStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' (Dia todo)';
          }
          return {
            id: item.id,
            summary: item.summary || 'Sem título',
            start: startStr,
            url: item.htmlLink || 'https://calendar.google.com'
          };
        });
        setEvents(parsed);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Erro ao buscar do Google Calendar:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCalendarEvents(token);
    } else {
      setEvents([]);
    }
  }, [token]);

  const handleLogin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditMode) return;

    setLoading('auth');
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        toast.success(`Google Workspace conectado! Bem-vindo, ${result.user.displayName || 'Usuário'}. 🚀`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao conectar à Conta Google.');
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditMode) return;

    const confirm = window.confirm('Deseja desconectar sua conta Google do Condfy?');
    if (!confirm) return;

    try {
      await logout();
      setUser(null);
      setToken(null);
      toast.success('Desconectado do Google Workspace.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desconectar.');
    }
  };

  const createGoogleDoc = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;
    if (!token) {
      toast.error('Por favor, conecte sua conta Google primeiro.');
      return;
    }

    setLoading('doc');
    try {
      const title = `Documento Condfy - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        throw new Error('Falha na resposta da API do Google');
      }

      const data = await res.json();
      const docId = data.documentId;
      const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

      const newFile: CreatedFile = {
        id: docId,
        name: title,
        type: 'doc',
        url: docUrl,
        createdAt: new Date().toISOString()
      };

      setRecentFiles(prev => [newFile, ...prev.slice(0, 4)]);
      toast.success('Google Doc criado com sucesso! Abrindo...');
      
      // Attempt to open in a new tab smoothly
      window.open(docUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar Google Doc. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const createGoogleSheet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;
    if (!token) {
      toast.error('Por favor, conecte sua conta Google primeiro.');
      return;
    }

    setLoading('sheet');
    try {
      const title = `Planilha Condfy - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title }
        }),
      });

      if (!res.ok) {
        throw new Error('Falha na resposta da API do Google');
      }

      const data = await res.json();
      const sheetId = data.spreadsheetId;
      const sheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

      const newFile: CreatedFile = {
        id: sheetId,
        name: title,
        type: 'sheet',
        url: sheetUrl,
        createdAt: new Date().toISOString()
      };

      setRecentFiles(prev => [newFile, ...prev.slice(0, 4)]);
      toast.success('Planilha Google criada com sucesso! Abrindo...');
      
      window.open(sheetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar Planilha Google.');
    } finally {
      setLoading(null);
    }
  };

  const startGoogleMeet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;

    const meetUrl = 'https://meet.google.com/new';
    const title = `Reunião Meet - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const newFile: CreatedFile = {
      id: 'meet-' + Date.now(),
      name: title,
      type: 'meet',
      url: meetUrl,
      createdAt: new Date().toISOString()
    };

    setRecentFiles(prev => [newFile, ...prev.slice(0, 4)]);
    toast.success('Iniciando reunião no Google Meet...');

    window.open(meetUrl, '_blank', 'noopener,noreferrer');
  };

  const triggerUploadInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;
    if (!token) {
      toast.error('Por favor, conecte sua conta Google primeiro.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading('upload');
    setUploadProgress(10);

    try {
      // 1. Upload the raw data
      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      setUploadProgress(60);

      if (!uploadRes.ok) {
        throw new Error('Falha ao enviar arquivo para o Google Drive.');
      }

      const uploadData = await uploadRes.json();
      const fileId = uploadData.id;

      // 2. Patch file name metadata immediately
      setUploadProgress(80);
      const patchRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name
        }),
      });

      if (!patchRes.ok) {
        console.warn('Não foi possível renomear o arquivo, mas o upload foi bem sucedidos');
      }

      const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
      
      const newFile: CreatedFile = {
        id: fileId,
        name: file.name,
        type: 'drive',
        url: fileUrl,
        createdAt: new Date().toISOString()
      };

      setRecentFiles(prev => [newFile, ...prev.slice(0, 4)]);
      toast.success(`Arquivo "${file.name}" enviado com sucesso ao Drive!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao realizar upload para o Google Drive.');
    } finally {
      setLoading(null);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="w-full h-full text-white bg-zinc-950/90 p-4 rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl group/widget"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Subtle Color Accent Glow */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full mix-blend-screen pointer-events-none" />

      {/* Header Container */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-900 rounded-lg border border-white/10">
            <Cloud className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wide">
              Atalhos Workspace
            </h3>
            <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Criação Rápida</p>
          </div>
        </div>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            title={`Conectado como ${user.email} - Desconectar`}
            className="p-1 bg-white/5 hover:bg-rose-500/15 text-white/40 hover:text-rose-400 rounded-lg border border-white/5 transition-all text-[8px] flex items-center gap-1"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-3.5 h-3.5 rounded-full referrerPolicy='no-referrer'" referrerPolicy="no-referrer" />
            ) : (
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
            <LogOut className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 flex flex-col justify-between relative z-10 min-h-0">
        {!user ? (
          /* Locked State - Requires Google Sign-In */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
            <Cloud className="w-8 h-8 text-white/20 mb-1.5 animate-bounce" />
            <p className="text-[10px] font-black uppercase tracking-wider text-white/70 mb-2">Conecte sua Conta</p>
            <p className="text-[8.5px] text-white/40 leading-relaxed max-w-[150px] mb-3">
              Crie docs, planilhas e faça uploads direto do seu painel.
            </p>
            
            <button
              onClick={handleLogin}
              disabled={loading === 'auth'}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 font-extrabold text-[9px] rounded-xl tracking-wider transition-all active:scale-95 shadow-md shrink-0"
            >
              {loading === 'auth' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              )}
              {loading === 'auth' ? 'CONECTANDO...' : 'CONECTAR GOOGLE'}
            </button>
          </div>
        ) : (
          /* Active State - Operation Controls */
          <div className="flex-grow flex flex-col justify-between h-full min-h-0">
            {/* Quick Actions Buttons */}
            <div className="grid grid-cols-4 gap-1 mb-2 shrink-0">
              {/* Google Doc shortcut */}
              <button
                onClick={createGoogleDoc}
                disabled={!!loading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-all text-center aspect-square"
                title="Criar Google Documento"
              >
                {loading === 'doc' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-400 group-hover/widget:scale-110 transition-transform" />
                )}
                <span className="text-[7.5px] font-black uppercase tracking-wider text-blue-300 mt-1.5 truncate max-w-full">
                  {loading === 'doc' ? 'Criando...' : 'Novo Doc'}
                </span>
              </button>

              {/* Google Sheets shortcut */}
              <button
                onClick={createGoogleSheet}
                disabled={!!loading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all text-center aspect-square"
                title="Criar Google Planilha"
              >
                {loading === 'sheet' ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <Table className="w-5 h-5 text-emerald-400 group-hover/widget:scale-110 transition-transform animate-pulse" />
                )}
                <span className="text-[7.5px] font-black uppercase tracking-wider text-emerald-300 mt-1.5 truncate max-w-full">
                  {loading === 'sheet' ? 'Criando...' : 'Planilha'}
                </span>
              </button>

              {/* Google Meet shortcut */}
              <button
                onClick={startGoogleMeet}
                disabled={!!loading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/15 transition-all text-center aspect-square"
                title="Iniciar Reunião no Google Meet"
              >
                <Video className="w-5 h-5 text-sky-400 group-hover/widget:scale-110 transition-transform" />
                <span className="text-[7.5px] font-black uppercase tracking-wider text-sky-300 mt-1.5 truncate max-w-full">
                  Meet
                </span>
              </button>

              {/* Google Drive Upload */}
              <button
                onClick={triggerUploadInput}
                disabled={!!loading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all text-center aspect-square relative"
                title="Fazer Upload para o Drive"
              >
                {loading === 'upload' ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    {uploadProgress && (
                      <span className="text-[7px] font-mono text-amber-400 mt-0.5">{uploadProgress}%</span>
                    )}
                  </div>
                ) : (
                  <Upload className="w-5 h-5 text-amber-400 group-hover/widget:scale-110 transition-transform" />
                )}
                <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-300 mt-1.5 truncate max-w-full">
                  {loading === 'upload' ? 'Enviando...' : 'Drive Up'}
                </span>
              </button>
            </div>

            {/* Hidden native input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="*/*"
            />

            {/* Recent Created and Calendar Agenda list with Tabs */}
            <div className="flex-1 flex flex-col justify-end min-h-0">
              <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mb-1.5 shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSubTab('calendar'); }}
                    className={`text-[7.5px] font-extrabold uppercase tracking-wider pb-0.5 border-b transition-all ${
                      subTab === 'calendar' 
                        ? 'border-sky-400 text-sky-400 font-black' 
                        : 'border-transparent text-white/30 hover:text-white/60'
                    }`}
                  >
                    Agenda
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSubTab('recent'); }}
                    className={`text-[7.5px] font-extrabold uppercase tracking-wider pb-0.5 border-b transition-all ${
                      subTab === 'recent' 
                        ? 'border-emerald-400 text-emerald-400 font-black' 
                        : 'border-transparent text-white/30 hover:text-white/60'
                    }`}
                  >
                    Criados
                  </button>
                </div>

                {subTab === 'calendar' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fetchCalendarEvents(); }}
                    disabled={eventsLoading}
                    title="Atualizar Compromissos"
                    className="p-1 hover:bg-white/5 active:scale-95 text-sky-400 disabled:text-sky-400/20 rounded transition-all"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${eventsLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
              
              {subTab === 'calendar' ? (
                /* Google Calendar Events Sub-view */
                eventsLoading ? (
                  <div className="flex flex-col items-center justify-center py-2 text-white/30">
                    <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin mb-1" />
                    <span className="text-[7px] font-bold uppercase tracking-wider">Carregando compromissos...</span>
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                    {events.map((event) => (
                      <a
                        key={event.id}
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col p-1 px-1.5 rounded-lg bg-sky-500/[0.03] hover:bg-sky-500/[0.08] border border-sky-500/10 hover:border-sky-500/25 transition-all group text-left"
                        title={`${event.summary} - ${event.start}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[8px] font-extrabold uppercase text-white/90 group-hover:text-sky-300 transition-colors truncate max-w-[130px]">
                            {event.summary}
                          </span>
                          <span className="text-[7px] font-bold text-sky-400/70 shrink-0">
                            {event.start}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 border border-dashed border-white/5 rounded-xl bg-white/2 text-center select-none flex flex-col items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-white/10 mb-0.5" />
                    <span className="text-[7.5px] text-white/35 uppercase font-bold tracking-wider">Nenhum evento agendado</span>
                  </div>
                )
              ) : (
                /* Recent Files Sub-view */
                recentFiles.length > 0 ? (
                  <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                    {recentFiles.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-1 px-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                        title={file.name}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                          {file.type === 'doc' ? (
                            <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                          ) : file.type === 'sheet' ? (
                            <Table className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : file.type === 'meet' ? (
                            <Video className="w-3 h-3 text-sky-400 shrink-0" />
                          ) : (
                            <Upload className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <span className="text-[8px] font-bold uppercase truncate text-white/80 group-hover:text-white transition-colors leading-none">
                            {file.name}
                          </span>
                        </div>
                        <ExternalLink className="w-2.5 h-2.5 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 border border-dashed border-white/5 rounded-xl bg-white/2 text-center select-none flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/10 mb-0.5" />
                    <span className="text-[7.5px] text-white/35 uppercase font-bold tracking-wider">Aguardando ações...</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
