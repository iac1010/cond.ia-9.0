import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Star, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  MapPin,
  MessageSquare,
  User,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicFeedback() {
  const [searchParams] = useSearchParams();
  const { clients, addFeedback, companyLogo, companyData } = useStore();
  
  const clientId = searchParams.get('client');
  const locationId = searchParams.get('location');
  
  const [client, setClient] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || rating === 0) return;

    setIsLoading(true);
    
    const feedback = {
      clientId: client.id,
      locationId: locationId || undefined,
      rating,
      comment,
      userName: userName || 'Anônimo'
    };

    // Simulate network delay
    setTimeout(() => {
      addFeedback(feedback);
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1200);
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
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 flex justify-center items-center relative overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-zinc-900/80 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-800 z-10"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 border-b border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center overflow-hidden">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Building2 className="w-6 h-6 text-zinc-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-white font-black text-lg leading-tight">{client.name}</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {companyData?.name || 'FLORES MANUTENÇÃO'}
                  </p>
                </div>
              </div>
              
              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-400 mb-1">
                  <MapPin className="w-3 h-3 text-pink-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Local Avaliado</span>
                </div>
                <p className="text-white font-bold text-sm">{location?.name || 'Áreas Comuns'}</p>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-white font-black text-xl italic uppercase tracking-tight">Sua opinião importa!</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Como você avalia nosso serviço?</p>
                
                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <button
                      key={index}
                      type="button"
                      className="transition-all duration-200 transform hover:scale-125 active:scale-95"
                      onClick={() => setRating(index)}
                      onMouseEnter={() => setHover(index)}
                      onMouseLeave={() => setHover(0)}
                    >
                      <Star 
                        className={`w-10 h-10 ${
                          (hover || rating) >= index 
                            ? 'fill-pink-500 text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]' 
                            : 'text-zinc-700'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                    <MessageSquare className="w-3 h-3" />
                    Comentário (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="O que podemos melhorar?"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-pink-500/20 transition-all resize-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                    <User className="w-3 h-3" />
                    Seu Nome / Unidade
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: João - Apto 42"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-pink-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || rating === 0}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white flex items-center justify-center gap-3 transition-all ${
                  isLoading || rating === 0 
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-xl shadow-pink-900/20 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Opinião
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-zinc-800 max-w-md w-full text-center space-y-8 z-10"
          >
            <div className="w-24 h-24 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto border border-pink-500/20">
              <Heart className="w-12 h-12 text-pink-500 animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">Obrigado!</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Sua opinião é fundamental para mantermos a excelência no **{client.name}**.
              </p>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl border border-zinc-700 font-bold text-xs uppercase tracking-widest transition-all"
              >
                Avaliar novamente
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em]">
          Powered by QR Studio Intelligence
        </p>
      </div>
    </div>
  );
}
