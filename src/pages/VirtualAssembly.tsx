import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Assembly, AssemblyOption } from '../types';
import { 
  Gavel, 
  ShieldCheck, 
  Lock, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users, 
  ChevronRight, 
  Info,
  AlertTriangle,
  FileCheck,
  Fingerprint,
  History,
  BarChart3,
  Trash2,
  Power
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function VirtualAssembly() {
  const navigate = useNavigate();
  const { assemblies, castVote, closeAssembly, deleteAssembly } = useStore();
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | null>(null);
  const [votedAssemblyId, setVotedAssemblyId] = useState<string | null>(null);

  const selectedAssembly = useMemo(() => 
    assemblies.find(a => a.id === selectedAssemblyId),
    [assemblies, selectedAssemblyId]
  );

  const handleVote = (assemblyId: string, optionId: string) => {
    // In a real app, we'd get the user name from auth
    castVote(assemblyId, optionId, 'João Silva');
    setVotedAssemblyId(assemblyId);
    setTimeout(() => setVotedAssemblyId(null), 3000);
  };

  const getStatusColor = (status: Assembly['status']) => {
    switch (status) {
      case 'ACTIVE': return 'text-white bg-white/10 border-white/20';
      case 'UPCOMING': return 'text-amber-400 bg-amber-500/20 border-amber-500/20';
      case 'CLOSED': return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const getStatusLabel = (status: Assembly['status']) => {
    switch (status) {
      case 'ACTIVE': return 'Em Votação';
      case 'UPCOMING': return 'Agendada';
      case 'CLOSED': return 'Encerrada';
    }
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-6xl font-light tracking-tight">Assembleia Virtual</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Votação híbrida com validade jurídica</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
          <ShieldCheck className="w-6 h-6 text-white" />
          <span className="text-sm font-bold">Criptografia Ativa</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Sidebar: Assembly List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/40">Sessões</h2>
            <span className="text-xs font-bold text-white/40 bg-white/5 px-2 py-1 rounded-md">
              {assemblies.length} Total
            </span>
          </div>
          
          {assemblies.length === 0 ? (
            <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 backdrop-blur-md text-center">
              <Gavel className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-medium">Nenhuma assembleia registrada.</p>
            </div>
          ) : (
            assemblies.map((assembly) => (
              <motion.div
                key={assembly.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAssemblyId(assembly.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedAssemblyId(assembly.id);
                  }
                }}
                className={`w-full text-left p-6 rounded-[32px] border transition-all backdrop-blur-md group/item cursor-pointer ${
                  selectedAssemblyId === assembly.id
                    ? 'bg-white text-[#004a7c] border-white shadow-2xl'
                    : 'bg-white/5 border-white/10 hover:border-white/20 text-white shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${
                    selectedAssemblyId === assembly.id ? 'bg-[#004a7c]/10 border-[#004a7c]/20 text-[#004a7c]' : getStatusColor(assembly.status)
                  }`}>
                    {getStatusLabel(assembly.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Deseja realmente excluir esta assembleia?')) {
                          deleteAssembly(assembly.id);
                          if (selectedAssemblyId === assembly.id) setSelectedAssemblyId(null);
                        }
                      }}
                      className={`p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity ${
                        selectedAssemblyId === assembly.id ? 'hover:bg-red-50 text-red-500' : 'hover:bg-red-500/20 text-red-400'
                      }`}
                      title="Excluir Assembleia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Clock className={`w-4 h-4 ${selectedAssemblyId === assembly.id ? 'text-[#004a7c]/40' : 'text-white/40'}`} />
                  </div>
                </div>
                <h3 className="font-black text-lg mb-1 line-clamp-1">{assembly.title}</h3>
                <p className={`text-xs font-medium ${selectedAssemblyId === assembly.id ? 'text-[#004a7c]/60' : 'text-white/40'}`}>
                  {format(new Date(assembly.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* Main Content: Assembly Details & Voting */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedAssembly ? (
              <motion.div
                key={selectedAssembly.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-md shadow-xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-8 md:p-12 border-b border-white/5">
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(selectedAssembly.status)}`}>
                      {getStatusLabel(selectedAssembly.status)}
                    </div>
                    {selectedAssembly.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          if (confirm('Deseja encerrar esta sessão de votação?')) {
                            closeAssembly(selectedAssembly.id);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-red-500/20 border border-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Power className="w-3 h-3" />
                        Encerrar Sessão
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold">
                      <Users className="w-4 h-4" />
                      {selectedAssembly.votes.length} Participantes
                    </div>
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                      <Fingerprint className="w-4 h-4" />
                      ID: {selectedAssembly.legalValidityHash}
                    </div>
                  </div>
                  <h2 className="text-4xl font-black text-white mb-4">{selectedAssembly.title}</h2>
                  <p className="text-white/60 text-lg leading-relaxed">{selectedAssembly.description}</p>
                </div>

                {/* Voting Area */}
                <div className="p-8 md:p-12 bg-white/5">
                  {selectedAssembly.status === 'ACTIVE' ? (
                    <div>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white text-[#004a7c] rounded-xl flex items-center justify-center">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-white">Cédula de Votação Digital</h3>
                          <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Sua escolha é criptografada e anônima</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedAssembly.options.map((option) => (
                          <motion.button
                            key={option.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleVote(selectedAssembly.id, option.id)}
                            className="w-full group relative flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-white/30 transition-all shadow-sm hover:shadow-md"
                          >
                            <span className="text-lg font-bold text-white">{option.text}</span>
                            <div className="w-8 h-8 rounded-full border-2 border-white/20 group-hover:border-white flex items-center justify-center transition-colors">
                              <div className="w-4 h-4 rounded-full bg-white scale-0 group-hover:scale-100 transition-transform" />
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-[32px] flex gap-4">
                        <Info className="w-6 h-6 text-amber-400 flex-shrink-0" />
                        <p className="text-sm text-amber-100 font-medium">
                          Ao confirmar seu voto, uma assinatura digital única será gerada vinculada ao seu CPF, garantindo a validade jurídica conforme a Lei 14.309/22.
                        </p>
                      </div>
                    </div>
                  ) : selectedAssembly.status === 'CLOSED' ? (
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white text-[#004a7c] rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-white">Resultado da Votação</h3>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Auditado e Finalizado</p>
                          </div>
                        </div>
                        <button className="flex items-center gap-2 text-white font-bold text-sm hover:underline">
                          <FileCheck className="w-4 h-4" />
                          Baixar Ata Registrada
                        </button>
                      </div>

                      <div className="space-y-6">
                        {selectedAssembly.options.map((option) => {
                          const voteCount = selectedAssembly.votes.filter(v => v.optionId === option.id).length;
                          const percentage = selectedAssembly.votes.length > 0 
                            ? (voteCount / selectedAssembly.votes.length) * 100 
                            : 0;
                          
                          return (
                            <div key={option.id} className="space-y-2">
                              <div className="flex justify-between text-sm font-black text-white/80">
                                <span>{option.text}</span>
                                <span>{voteCount} votos ({percentage.toFixed(1)}%)</span>
                              </div>
                              <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full bg-white rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-12 pt-8 border-t border-white/5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Trilha de Auditoria (Blockchain Sim)</h4>
                        <div className="space-y-3">
                          {selectedAssembly.votes.slice(0, 3).map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-white" />
                                <span className="text-xs font-bold text-white/60">{vote.userName}</span>
                              </div>
                              <code className="text-[10px] text-blue-400 font-mono">{vote.signature}</code>
                            </div>
                          ))}
                          <button className="w-full py-2 text-xs font-bold text-white/40 hover:text-white transition-colors">
                            Ver todos os registros de auditoria
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-amber-400/20 mx-auto mb-4" />
                      <h3 className="text-2xl font-black text-white mb-2">Aguardando Início</h3>
                      <p className="text-white/40 max-w-md mx-auto">
                        Esta assembleia está agendada para o dia {format(new Date(selectedAssembly.date), "dd/MM/yyyy")}. 
                        O link para a transmissão ao vivo será liberado 15 minutos antes.
                      </p>
                      <button className="mt-8 bg-white text-[#004a7c] px-8 py-3 rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl">
                        Adicionar ao Calendário
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
                <Gavel className="w-20 h-20 text-white/10 mb-6" />
                <h3 className="text-2xl font-black text-white/20">Selecione uma Assembleia</h3>
                <p className="text-white/20 mt-2">Escolha uma sessão na lista ao lado para ver detalhes e votar.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Success Modal for Voting */}
      <AnimatePresence>
        {votedAssemblyId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <div className="bg-white p-12 rounded-[48px] text-center max-w-md shadow-2xl">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-slate-900" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Voto Confirmado!</h2>
              <p className="text-slate-500 mb-8 font-medium">
                Sua participação foi registrada com sucesso e assinada digitalmente. O comprovante foi enviado para seu e-mail.
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <code className="text-xs font-mono text-blue-600">
                  HASH: {assemblies.find(a => a.id === votedAssemblyId)?.legalValidityHash}
                </code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
