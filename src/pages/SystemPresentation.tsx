import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  BarChart3,
  Users,
  Hammer,
  Gavel,
  Droplets,
  Bell,
  FileSignature,
  Smartphone,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    id: 'intro',
    title: 'IAC Gestão 19.0',
    subtitle: 'A Revolução na Gestão Condominial',
    content: 'Descubra como nossa plataforma transforma a complexidade do dia a dia do síndico em uma operação fluida, segura e totalmente digital.',
    icon: <Zap className="w-12 h-12 text-blue-500" />,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070',
    benefits: [
      'Redução de 40% no tempo administrativo',
      'Dados em tempo real para tomada de decisão',
      'Interface intuitiva e mobile-first'
    ]
  },
  {
    id: 'maintenance',
    title: 'Manutenção Inteligente',
    subtitle: 'Manutenção Preventiva (NBR 5674)',
    content: 'O síndico não precisa mais decorar prazos. O sistema gera automaticamente o cronograma preventivo, garantindo a vida útil do patrimônio e a segurança dos moradores.',
    icon: <Hammer className="w-12 h-12 text-red-500" />,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=2070',
    benefits: [
      'Alertas automáticos de vencimento',
      'Histórico completo de manutenções',
      'Redução de custos com reparos emergenciais'
    ]
  },
  {
    id: 'iot',
    title: 'Monitoramento IoT',
    subtitle: 'Seu Condomínio Conectado 24/7',
    content: 'Sensores inteligentes monitoram bombas, níveis de caixas d\'água e consumo de energia. O sistema avisa o síndico antes mesmo do problema ser percebido pelos moradores.',
    icon: <Cpu className="w-12 h-12 text-amber-500" />,
    image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=2070',
    benefits: [
      'Prevenção de falta d\'água',
      'Detecção precoce de falhas em bombas',
      'Gestão eficiente de energia elétrica'
    ]
  },
  {
    id: 'financial',
    title: 'Transparência Financeira',
    subtitle: 'Gestão de Fluxo e Inadimplência',
    content: 'Prestação de contas clara e objetiva. O síndico tem controle total sobre receitas e despesas, com gráficos que facilitam a apresentação em assembleias.',
    icon: <TrendingUp className="w-12 h-12 text-emerald-500" />,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=2070',
    benefits: [
      'Pasta digital sempre atualizada',
      'Monitoramento de inadimplência em tempo real',
      'Relatórios automáticos de fluxo de caixa'
    ]
  },
  {
    id: 'legal',
    title: 'Central de Documentos',
    subtitle: 'Base Jurídica e Governança',
    content: 'Acesse uma biblioteca completa de documentos revisados. Gere atas, editais, notificações e contratos em segundos, garantindo conformidade total com o Código Civil.',
    icon: <FileSignature className="w-12 h-12 text-indigo-500" />,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=2070',
    benefits: [
      'Documentos prontos e editáveis',
      'Base jurídica atualizada 2024',
      'Padronização de processos legais'
    ]
  },
  {
    id: 'assembly',
    title: 'Assembleias Virtuais',
    subtitle: 'Democracia Digital e Segura',
    content: 'Realize assembleias remotas com votação criptografada e validade jurídica. Aumente a participação dos condôminos e reduza conflitos presenciais.',
    icon: <Gavel className="w-12 h-12 text-purple-500" />,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=2070',
    benefits: [
      'Votação auditável em tempo real',
      'Lista de presença digital',
      'Redução de custos com locação'
    ]
  },
  {
    id: 'access',
    title: 'Controle e Convivência',
    subtitle: 'QR Codes e Mural Digital',
    content: 'Modernize a portaria com convites via QR Code e mantenha a comunidade informada com avisos segmentados por torre ou bloco.',
    icon: <Users className="w-12 h-12 text-emerald-500" />,
    image: 'https://images.unsplash.com/photo-1556740734-7f96267b118a?auto=format&fit=crop&q=80&w=2070',
    benefits: [
      'Agilidade na entrada de visitantes',
      'Comunicação direta e eficiente',
      'Gestão de encomendas (Locker Digital)'
    ]
  }
];

export default function SystemPresentation() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-zinc-900 z-50">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <header className="p-8 flex justify-between items-center relative z-40">
        <BackButton label="Sair do Tour" variant="minimal" iconSize={5} />
        <div className="text-sm font-black text-zinc-500 tracking-widest">
          {String(currentSlide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
      </header>

      {/* Main Slide Content */}
      <main className="flex-1 relative flex items-center justify-center px-8 md:px-20">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center max-w-7xl w-full"
          >
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mb-6 inline-block p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                  {slide.icon}
                </div>
                <span className="block text-blue-500 font-black uppercase tracking-[0.3em] mb-4 text-sm">
                  {slide.subtitle}
                </span>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-none">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl text-zinc-400 mb-12 font-light leading-relaxed">
                  {slide.content}
                </p>

                <div className="space-y-4">
                  {slide.benefits.map((benefit, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (idx * 0.1) }}
                      className="flex items-center gap-4 text-zinc-300"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-lg font-medium">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Image/Visual Content */}
            <div className="order-1 lg:order-2 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="relative aspect-square lg:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
              >
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                
                {/* Floating Stats/Badges */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/60">Impacto na Gestão</p>
                      <p className="text-lg font-bold">Alta Performance Garantida</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Decorative Background Elements */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -z-10" />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Controls */}
      <footer className="p-8 md:p-12 flex justify-between items-center relative z-40">
        <div className="flex gap-4">
          <button 
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`p-6 rounded-full border border-white/10 transition-all active:scale-90 ${currentSlide === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/10'}`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={nextSlide}
            className="p-6 bg-blue-600 hover:bg-blue-700 rounded-full transition-all active:scale-90 shadow-xl shadow-blue-600/20 flex items-center gap-2 px-10"
          >
            <span className="font-black uppercase tracking-widest">
              {currentSlide === SLIDES.length - 1 ? 'Finalizar' : 'Próximo'}
            </span>
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-zinc-500" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Disponível em Mobile</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-zinc-500" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Dados Criptografados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
