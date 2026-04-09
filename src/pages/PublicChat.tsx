import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Camera, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  MapPin,
  User,
  MessageSquare,
  ChevronLeft,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  type?: 'text' | 'photo' | 'input' | 'success';
  photo?: string;
}

export default function PublicChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, addTicket, companyLogo, companyData } = useStore();
  
  const clientId = searchParams.get('client');
  const locationId = searchParams.get('location');
  
  const [client, setClient] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState({
    reportedBy: '',
    description: '',
    photo: null as string | null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
        if (locationId) {
          const foundLoc = foundClient.locations?.find(l => l.id === locationId);
          if (foundLoc) setLocation(foundLoc);
        }
      }
    }
  }, [clientId, locationId, clients]);

  // Initial greeting
  useEffect(() => {
    if (client && messages.length === 0) {
      addBotMessage(`Olá! Bem-vindo ao canal de suporte do **${client.name}**.`);
      setTimeout(() => {
        addBotMessage(`Eu sou o assistente virtual da **${companyData?.name || 'FLORES'}**. Como posso ajudar você hoje?`);
      }, 1000);
      setTimeout(() => {
        addBotMessage(`Para começar, por favor, me diga seu **nome e unidade/apartamento**.`);
        setStep(1);
      }, 2000);
    }
  }, [client]);

  const addBotMessage = (text: string, type: Message['type'] = 'text') => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: Message = {
        id: uuidv4(),
        text,
        sender: 'bot',
        timestamp: new Date(),
        type
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (text: string, photo?: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      text,
      sender: 'user',
      timestamp: new Date(),
      photo
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = () => {
    if (!inputValue.trim() && step !== 3) return;

    const val = inputValue.trim();
    setInputValue('');

    if (step === 1) {
      addUserMessage(val);
      setFormData(prev => ({ ...prev, reportedBy: val }));
      addBotMessage(`Prazer em conhecer você, ${val.split(' ')[0]}!`);
      setTimeout(() => {
        addBotMessage(`Pode descrever o que está acontecendo no local **${location?.name || 'do condomínio'}**?`);
        setStep(2);
      }, 1500);
    } else if (step === 2) {
      addUserMessage(val);
      setFormData(prev => ({ ...prev, description: val }));
      addBotMessage(`Entendi. Você gostaria de enviar uma **foto do problema** para nos ajudar a identificar melhor?`);
      setTimeout(() => {
        addBotMessage(`Se não tiver uma foto agora, pode apenas clicar em "Finalizar".`, 'input');
        setStep(3);
      }, 1500);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        setFormData(prev => ({ ...prev, photo: photoData }));
        addUserMessage('Enviou uma foto', photoData);
        finishTicket(photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const finishTicket = (photo?: string) => {
    setStep(4);
    addBotMessage(`Perfeito! Estou registrando sua solicitação agora...`);
    
    setTimeout(() => {
      const newTicket = {
        id: uuidv4(),
        clientId: client.id,
        type: 'CORRETIVA' as const,
        status: 'PENDENTE_APROVACAO' as const,
        date: new Date().toISOString(),
        technician: 'A definir',
        observations: `Abertura via Chat por ${formData.reportedBy}`,
        reportedBy: formData.reportedBy,
        location: location?.name || 'Não especificado',
        reportedProblem: formData.description,
        photoBefore: photo || formData.photo || undefined,
        items: []
      };

      addTicket(newTicket);
      addBotMessage(`Tudo pronto! Seu chamado foi aberto com sucesso. Nossa equipe já foi notificada.`, 'success');
      setTimeout(() => {
        addBotMessage(`Obrigado por nos avisar! Tenha um ótimo dia.`);
      }, 1500);
    }, 2000);
  };

  if (!clientId || !client) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Link Inválido</h1>
          <p className="text-zinc-400">Este QR Code não parece ser válido ou o condomínio não foi encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col max-w-lg mx-auto border-x border-zinc-800 shadow-2xl relative overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 p-4 flex items-center gap-4 sticky top-0 z-20">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-1.5" />
          ) : (
            <Building2 className="w-6 h-6 text-zinc-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold truncate leading-tight">{client.name}</h1>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Assistente Virtual
          </div>
        </div>
        {location && (
          <div className="bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-cyan-500" />
            <span className="text-white text-[10px] font-bold uppercase truncate max-w-[80px]">{location.name}</span>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] space-y-1`}>
                <div className={`
                  p-4 rounded-2xl text-sm leading-relaxed
                  ${msg.sender === 'user' 
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-900/20' 
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700 shadow-xl'}
                `}>
                  {msg.photo && (
                    <img src={msg.photo} alt="Upload" className="rounded-xl mb-3 w-full max-h-60 object-cover border border-white/10" />
                  )}
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  
                  {msg.type === 'success' && (
                    <div className="mt-3 flex items-center gap-2 text-green-400 font-bold text-xs bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      Chamado Registrado
                    </div>
                  )}
                </div>
                <div className={`text-[9px] text-zinc-500 font-bold uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-zinc-700 flex gap-1">
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 z-20">
        {step === 3 ? (
          <div className="flex gap-3">
            <label className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl border border-zinc-700 flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-95">
              <Camera className="w-5 h-5 text-cyan-500" />
              <span className="font-bold text-sm">Tirar Foto</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <button 
              onClick={() => finishTicket()}
              className="px-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-sm py-4 rounded-2xl border border-zinc-700 transition-all active:scale-95"
            >
              Finalizar
            </button>
          </div>
        ) : step < 4 ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={step === 1 ? "Seu nome e unidade..." : "Descreva o problema..."}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`p-4 rounded-2xl transition-all active:scale-95 ${
                inputValue.trim() ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-600'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-zinc-800 text-white py-4 rounded-2xl border border-zinc-700 font-bold text-sm flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-cyan-500" />
            Iniciar Novo Chat
          </button>
        )}
        <div className="mt-4 text-center">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
            Powered by QR Studio Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
