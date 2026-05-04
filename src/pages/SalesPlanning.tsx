import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '../components/BackButton';
import { Target, Map, Users, MessageSquare, ShieldAlert, CheckCircle, ChevronRight, ChevronDown, Lightbulb, TrendingUp } from 'lucide-react';

const salesSteps = [
  {
    id: 'prospecting',
    title: 'Prospecção e Qualificação',
    icon: <Users className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    description: 'Identificar e avaliar potenciais clientes para garantir que eles têm o perfil ideal.',
    details: [
      'Defina o Perfil de Cliente Ideal (ICP).',
      'Pesquise sobre o condomínio ou empresa antes do contato.',
      'Identifique o tomador de decisão (Síndico, Gerente de Facilities).',
      'Qualifique a dor: O que eles estão tentando resolver?'
    ]
  },
  {
    id: 'approach',
    title: 'Abordagem Inicial',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    description: 'O primeiro contato para gerar interesse e agendar uma demonstração.',
    details: [
      'Use uma abordagem consultiva, não "empurre" o produto.',
      'Apresente-se e cite um problema comum que você resolve.',
      'Faça perguntas abertas para entender o cenário atual.',
      'Objetivo: Agendar uma reunião de 15-30 minutos.'
    ]
  },
  {
    id: 'presentation',
    title: 'Apresentação e Demonstração',
    icon: <Map className="w-6 h-6" />,
    color: 'from-zinc-700 to-black',
    description: 'Mostrar como a solução resolve os problemas específicos do cliente.',
    details: [
      'Foque nas funcionalidades que resolvem as dores mapeadas.',
      'Conte histórias de sucesso de clientes similares.',
      'Mostre o ROI (Retorno sobre Investimento) da solução.',
      'Mantenha a apresentação interativa, faça pausas para dúvidas.'
    ]
  },
  {
    id: 'proposal',
    title: 'Proposta e Negociação',
    icon: <Target className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-500',
    description: 'Apresentar valores e alinhar expectativas para o fechamento.',
    details: [
      'Apresente a proposta de valor antes do preço.',
      'Seja transparente sobre custos de implantação e mensalidades.',
      'Crie senso de urgência (condições especiais, vagas limitadas).',
      'Esteja preparado para ceder em pontos não críticos, se necessário.'
    ]
  },
  {
    id: 'closing',
    title: 'Fechamento e Onboarding',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'from-black to-zinc-900',
    description: 'Assinatura do contrato e transição para a equipe de sucesso do cliente.',
    details: [
      'Facilite o processo de assinatura (use assinatura digital).',
      'Comemore a parceria com o cliente.',
      'Faça uma passagem de bastão clara para a equipe de implantação.',
      'Agende a reunião de kickoff.'
    ]
  }
];

const commonObjections = [
  {
    objection: "Está muito caro / Não temos orçamento.",
    response: "Entendo a preocupação com o orçamento. No entanto, nossos clientes costumam ver um retorno sobre o investimento em X meses devido à redução de custos com Y e Z. Vamos analisar juntos como a solução pode se pagar a médio prazo?"
  },
  {
    objection: "Já usamos outro sistema.",
    response: "Ótimo que vocês já valorizam a tecnologia! O que vocês mais gostam no sistema atual? E o que deixaria a operação de vocês perfeita que o sistema atual não faz? Nossa solução se destaca exatamente em [Diferencial]."
  },
  {
    objection: "A implantação vai dar muito trabalho.",
    response: "Nós temos uma equipe dedicada de onboarding que fará 90% do trabalho pesado. O processo é estruturado para não interromper a operação de vocês. Podemos fazer em fases, se preferirem."
  },
  {
    objection: "Preciso falar com o conselho / outros síndicos.",
    response: "Com certeza, é uma decisão importante. Para facilitar, posso preparar um resumo executivo com os principais benefícios e o ROI para você apresentar a eles. Gostaria que eu participasse dessa reunião para tirar dúvidas técnicas?"
  },
  {
    objection: "Não é o momento certo.",
    response: "Compreendo. Apenas para eu entender o cenário, o que precisaria acontecer para ser o momento ideal? Há algum projeto prioritário no momento que está tomando a atenção de vocês?"
  }
];

export default function SalesPlanning() {
  const [expandedStep, setExpandedStep] = useState<string | null>(salesSteps[0].id);
  const [expandedObjection, setExpandedObjection] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <BackButton className="!bg-white/5 !border-white/10 hover:!bg-white/10" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/80">Estratégia Comercial</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Planejamento de Vendas</h1>
              <p className="text-white/50 mt-2 font-medium max-w-xl">
                Mapeamento passo a passo do processo de vendas, técnicas de abordagem e contorno de objeções para a equipe comercial.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Sales Steps */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-black tracking-tight">Funil de Vendas (Passo a Passo)</h2>
              </div>
              
              <div className="space-y-4">
                {salesSteps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      expandedStep === step.id 
                        ? 'border-white/20 bg-white/10 shadow-lg' 
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg shrink-0`}>
                          {step.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Etapa {index + 1}</p>
                          <h3 className="text-lg font-bold text-white">{step.title}</h3>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-white/40 transition-transform duration-300 ${expandedStep === step.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedStep === step.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-5 pb-5 pt-0">
                            <div className="pl-16">
                              <p className="text-white/70 mb-4 text-sm leading-relaxed">
                                {step.description}
                              </p>
                              <ul className="space-y-2">
                                {step.details.map((detail, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Objections & Tips */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
                <h2 className="text-xl font-black tracking-tight text-white">Contorno de Objeções</h2>
              </div>
              
              <div className="space-y-3">
                {commonObjections.map((item, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedObjection(expandedObjection === index ? null : index)}
                      className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    >
                      <span className="font-bold text-sm text-white/90 leading-tight">{item.objection}</span>
                      <ChevronRight className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${expandedObjection === index ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedObjection === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className="p-4 pt-0 text-sm text-rose-200/80 leading-relaxed border-t border-white/5 mt-2">
                            <div className="flex gap-2 items-start">
                              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <p>{item.response}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4">Dicas de Ouro</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                  <p className="text-sm text-white/70 leading-tight">Escute mais do que fale. A proporção ideal é 70% ouvindo e 30% falando.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                  <p className="text-sm text-white/70 leading-tight">Sempre saia de uma reunião com o próximo passo agendado.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-500/20 text-zinc-400 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                  <p className="text-sm text-white/70 leading-tight">Venda o valor e a transformação, não apenas as funcionalidades do sistema.</p>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
