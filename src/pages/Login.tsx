import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ArrowRight, Power, Accessibility, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useStore((state) => state.login);
  const companyLogo = useStore((state) => state.companyLogo);
  const backgroundImage = useStore((state) => state.backgroundImage);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Windows 8 style login usually has a small delay
    setTimeout(() => {
      const success = login('iac', password);
      if (!success) {
        setError(true);
        setLoading(false);
        setPassword('');
      }
    }, 600);
  };

  return (
    <div 
      className="min-h-screen bg-[#004a7c] text-white flex flex-col items-center justify-center font-sans overflow-hidden relative transition-all duration-700"
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(0, 74, 124, 0.7), rgba(0, 74, 124, 0.7)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      {/* Background Curves (Subtle) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center z-10"
      >
        {/* User Avatar */}
        <div className="w-48 h-48 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center overflow-hidden mb-6 shadow-2xl relative group">
          {companyLogo ? (
            <img src={companyLogo} alt="User" className="w-full h-full object-cover" />
          ) : (
            <User className="w-24 h-24 text-white/40" />
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* User Name */}
        <h1 className="text-4xl font-light mb-8 tracking-tight">Administrador</h1>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-[320px] relative">
          <div className="relative flex items-center">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              autoFocus
              className={`w-full bg-white/10 border-2 ${error ? 'border-red-500' : 'border-white/30'} focus:border-white/60 outline-none px-4 py-2.5 pr-12 text-lg transition-all placeholder:text-white/40`}
              required
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-1 w-10 h-10 bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-3 text-center font-medium"
            >
              A senha está incorreta. Tente novamente.
            </motion.p>
          )}
        </form>

        {/* Hint */}
        <p className="mt-8 text-white/40 text-sm font-medium">Dica: iac / iac2010</p>
      </motion.div>

      {/* Bottom Icons */}
      <div className="absolute bottom-10 right-10 flex gap-6 z-10">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Facilidade de Acesso">
          <Accessibility className="w-8 h-8 opacity-60" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Ligar/Desligar">
          <Power className="w-8 h-8 opacity-60" />
        </button>
      </div>

      {/* Date/Time (Bottom Left) */}
      <div className="absolute bottom-10 left-10 text-left z-10">
        <div className="text-7xl font-light mb-2">
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-2xl font-light opacity-80">
          {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
      </div>
    </div>
  );
}
