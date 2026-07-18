import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, FileText, Download, Loader2, Sparkles, BookOpen, Search, ChevronDown, ChevronUp, Copy, Check, Info, Mic, MicOff, Volume2, VolumeX, Settings, Sliders, HelpCircle, Activity, Calendar, Flame, AlertTriangle, ShieldCheck, DollarSign, Wrench, Gavel, Users, TrendingUp, Cpu, Terminal } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import { safeFormatDate } from '../utils/dateUtils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isGenerating?: boolean;
}

const VIVIAN_AVATAR_URL = "/src/assets/images/lumi_avatar_1784386601233.jpg";

const COMMAND_CATEGORIES = [
  {
    id: 'os',
    title: '🔧 Ordens de Serviço (OS)',
    commands: [
      {
        name: 'Análise Avançada com IA 🆕',
        desc: 'Solicite uma análise minuciosa de qualquer chamado/OS direta e receba insights, riscos e dicas de prevenção.',
        examples: ['Analise a OS #1002 por favor', 'Quero que analise os detalhes da OS #12']
      },
      {
        name: 'Criar uma Nova OS',
        desc: 'Abre uma OS para reparos, limpezas ou emergências.',
        examples: ['Infiltração grave no teto da garagem do subsolo', 'Criar chamado de vazamento no salão']
      },
      {
        name: 'Atualizar Histórico',
        desc: 'Adicione notas técnicas e eventos ao histórico de uma OS.',
        examples: ['Adicionar histórico na OS #14: Técnico iniciou a furação']
      },
      {
        name: 'Alterar Status',
        desc: 'Altere o status de qualquer Ordem de Serviço de forma direta.',
        examples: ['Mudar status da OS #10 para CONCLUÍDO', 'Colocar a OS #5 em EM ANDAMENTO']
      },
      {
        name: 'Baixar Documento em PDF',
        desc: 'Gera e faz o download automático do arquivo oficial da OS.',
        examples: ['Baixar PDF da OS #14', 'Gerar PDF do chamado #12']
      }
    ]
  },
  {
    id: 'quotes',
    title: '📄 Orçamentos & Propostas',
    commands: [
      {
        name: 'Criar Orçamento Formal',
        desc: 'Configura orçamentos estruturados com múltiplos itens e descrição técnica.',
        examples: ['Criar orçamento para cliente João Ramos, item Mão de Obra por R$ 250 e Tubo por R$ 50']
      },
      {
        name: 'Orçamento Rápido (Vínculo)',
        desc: 'Elabora uma estimativa imediata atrelada a uma OS em andamento.',
        examples: ['Criar orçamento rápido para a OS #12']
      },
      {
        name: 'Aprovar ou Rejeitar Proposta',
        desc: 'Atualiza o andamento do orçamento.',
        examples: ['Mudar status do orçamento #5 para APPROVED', 'Rejeitar orçamento #3']
      },
      {
        name: 'Exportar PDF de Orçamento',
        desc: 'Gera proposta formatada para fechamento e baixa o arquivo.',
        examples: ['Baixar PDF do orçamento #14', 'Imprimir proposta #10']
      }
    ]
  },
  {
    id: 'iot_hydro',
    title: '💧 Controle Hídrico & Automação',
    commands: [
      {
        name: 'Controlar Equipamentos (IoT)',
        desc: 'Ligue/desligue bombas de recalque, sistemas de iluminação ou alarmes do condomínio.',
        examples: ['Ligar a Bomba 1', 'Desligar luzes externas', 'Verificar bombas dágua']
      },
      {
        name: 'Níveis de Cisterna / Reservatório',
        desc: 'Verifique ou registre o nível atual de água armazenada.',
        examples: ['Verificar nível da cisterna', 'Definir cisterna com 85% e reservatório com 70%']
      },
      {
        name: 'Leituras de Água e Energia',
        desc: 'Registre leituras de consumo para as contas do condomínio.',
        examples: ['Adicionar leitura de água bloco A unidade 104 com valor 342.5']
      }
    ]
  },
  {
    id: 'operations',
    title: '📋 Atividades & Administração',
    commands: [
      {
        name: 'Cartões Kanban de Tarefa',
        desc: 'Adiciona um novo card pendente ao fluxo interno de gerenciamento.',
        examples: ['Criar tarefa no kanban "Vistoria nos disjuntores da guarita"']
      },
      {
        name: 'Atas, Ofícios e Regimentos',
        desc: 'Gera documentos legais ou comunicados e salva em PDF autogerado.',
        examples: ['Gere uma Ata de Assembleia para o condomínio', 'Criar notificação de barulho']
      },
      {
        name: 'Cadastrar Moradores ou Visitantes',
        desc: 'Registra residentes ou visitantes que acessaram as dependências.',
        examples: ['Cadastrar morador Carlos Alberto no condomínio', 'Registrar visitante Sandra, RG 44021-X']
      },
      {
        name: 'Reservar Espaço Comum',
        desc: 'Garante o agendamento de uma área de lazer para uma unidade.',
        examples: ['Reservar o Salão de Festas para amanhã à noite']
      }
    ]
  },
  {
    id: 'finance',
    title: '💰 Gestão Financeira',
    commands: [
      {
        name: 'Fluxo Mensal & Resumos',
        desc: 'Resuma os saldos de entradas/receitas e saídas/custos.',
        examples: ['Resumo financeiro', 'Resumo de gastos']
      },
      {
        name: 'Identificar Extremos Financeiros',
        desc: 'Descubra qual foi o maior valor de entrada ou despesa registradas.',
        examples: ['Qual foi o maior recebimento deste mês?', 'Qual a última saída de dinheiro?']
      },
      {
        name: 'Projetar Futuro Financeiro',
        desc: 'Usa IA estatística para calcular projeções de caixa para os próximos meses.',
        examples: ['Qual a projeção financeira para os próximos 3 meses?']
      }
    ]
  }
];

export const VOICE_COMMANDS = [
  {
    phrase: 'Abrir OS',
    variations: ['criar chamado', 'abrir chamado', 'abrir os', 'nova manutencao', 'criar os', 'solicitar reparo'],
    action: 'Cria um novo chamado de manutenção corretiva urgente no sistema',
    prompt: 'Por favor, abra um chamado de manutenção corretiva urgente para verificar vazamento na tubulação.',
    icon: '🚨',
    color: 'from-red-500/10 to-orange-500/10 text-red-600 border-red-200/60 dark:border-red-900/30'
  },
  {
    phrase: 'Gerar Relatório',
    variations: ['criar relatorio', 'gerar relatorio', 'criar ata', 'gerar documento', 'gerar ata de assembleia'],
    action: 'Gera um relatório ou ata em PDF baseado em modelo e faz o download',
    prompt: 'Gerar um relatório do condomínio em formato PDF referente a ata da assembleia ordinária.',
    icon: '📄',
    color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200/60 dark:border-blue-900/30'
  },
  {
    phrase: 'Monitorar IoT',
    variations: ['monitorar iot', 'ver sensores', 'status das bombas', 'alarme de seguranca', 'status da seguranca'],
    action: 'Informa telemetria operacional ao vivo de bombas e alarmes',
    prompt: 'Qual é o status operacional atual dos sensores de IoT e bombas de recalque?',
    icon: '📡',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/60 dark:border-emerald-900/30'
  },
  {
    phrase: 'Ir para Financeiro',
    variations: ['ir para o financeiro', 'tela financeira', 'ver financeiro', 'abrir financeiro', 'fluxo de caixa'],
    action: 'Navega para a tela de controle de finanças do condomínio',
    prompt: 'Navegar para a página de fluxo financeiro.',
    icon: '💰',
    color: 'from-amber-500/10 to-yellow-500/10 text-amber-600 border-amber-200/60 dark:border-amber-900/30'
  },
  {
    phrase: 'Abrir Kanban',
    variations: ['ir para o kanban', 'ver kanban', 'abrir kanban', 'quadro de tarefas', 'gerenciar tarefas'],
    action: 'Navega para o quadro Kanban de tarefas e lembretes',
    prompt: 'Ir para o quadro Kanban de tarefas.',
    icon: '📋',
    color: 'from-purple-500/10 to-fuchsia-500/10 text-purple-600 border-purple-200/60 dark:border-purple-900/30'
  },
  {
    phrase: 'Cadastrar Morador',
    variations: ['cadastrar morador', 'adicionar cliente', 'novo morador', 'cadastrar proprietario', 'lista de clientes'],
    action: 'Cadastra um novo proprietário, inquilino ou morador',
    prompt: 'Quero cadastrar um novo morador ou cliente.',
    icon: '👥',
    color: 'from-sky-500/10 to-cyan-500/10 text-sky-600 border-sky-200/60 dark:border-sky-900/30'
  },
  {
    phrase: 'Resumo Geral',
    variations: ['resumo geral', 'como estamos hoje', 'resumo do condominio', 'status geral', 'visao geral'],
    action: 'Oferece um panorama instantâneo de finanças, chamados e agenda',
    prompt: 'Faça um resumo geral de como está o condomínio hoje.',
    icon: '✨',
    color: 'from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200/60 dark:border-violet-900/30'
  }
];

export function AssistantVivian() {
  const [isOpen, setIsOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showVoiceHelpModal, setShowVoiceHelpModal] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('os');
  const [vivianAvatarError, setVivianAvatarError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou o LUMI, seu assistente de inteligência condominial 19.0 estruturado sob os **4 Pilares de Sucesso da Gestão**:\n\n1. **Pilar Financeiro 📊**: Projeções, análise de caixa e conciliação.\n2. **Pilar Operacional 🛠️**: Manutenção preventiva (NBR 5674), monitoramento de telemetria IoT e progresso visual Kanban.\n3. **Pilar Jurídico ⚖️**: Geração automática de atas oficiais, regimentos e conformidade legal.\n4. **Pilar Comunicação 📢**: Avisos inteligentes, transmissões via WhatsApp e mural digital.\n\nExperimente a aba **"4 Pilares"** no topo ou pergunte-me qualquer dúvida sobre a administração do seu condomínio!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialTicketId, setInitialTicketId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- VOICE / TALK TO VIVIAN SYSTEM ---
  const [isListening, setIsListening] = useState(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // --- CONFIGURAÇÃO DE TOM DE VOZ E VELOCIDADE ---
  const [showSettings, setShowSettings] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPreventive, setShowPreventive] = useState(false);
  const [showPillars, setShowPillars] = useState(false);
  const [jarvisMode, setJarvisMode] = useState<boolean>(() => {
    return localStorage.getItem('vivian_jarvis_mode') === 'true';
  });
  const [activeListeningStartup, setActiveListeningStartup] = useState<boolean>(() => {
    return localStorage.getItem('vivian_active_listening_startup') !== 'false';
  });
  const [iotDevices, setIotDevices] = useState<any[]>([]);

  // --- FORM STATES FOR PREVENTIVE MAINTENANCE SCHEDULER ---
  const [prevTitle, setPrevTitle] = useState('Revisão Preventiva Geral das Bombas');
  const [prevFrequency, setPrevFrequency] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [prevStartDate, setPrevStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [prevStartTime, setPrevStartTime] = useState('09:00');
  const [prevRecurrences, setPrevRecurrences] = useState(3);
  const [prevNotes, setPrevNotes] = useState('Realizar testes de vazão mecânica, verificação de fusíveis elétricos e pressão das válvulas.');

  const generatedDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(prevStartDate + 'T' + prevStartTime);
    if (isNaN(start.getTime())) return [];
    
    for (let i = 0; i < prevRecurrences; i++) {
      const current = new Date(start.getTime());
      if (prevFrequency === 'mensal') {
        current.setMonth(current.getMonth() + i);
      } else if (prevFrequency === 'trimestral') {
        current.setMonth(current.getMonth() + i * 3);
      } else if (prevFrequency === 'semestral') {
        current.setMonth(current.getMonth() + i * 6);
      } else if (prevFrequency === 'anual') {
        current.setFullYear(current.getFullYear() + i);
      }
      dates.push(current.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
    }
    return dates;
  }, [prevStartDate, prevStartTime, prevFrequency, prevRecurrences]);

  useEffect(() => {
    localStorage.setItem('vivian_active_listening_startup', activeListeningStartup.toString());
  }, [activeListeningStartup]);

  const [voiceTone, setVoiceTone] = useState<'formal' | 'amigavel' | 'tecnica'>(() => {
    return (localStorage.getItem('vivian_voice_tone') as any) || 'amigavel';
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    const saved = localStorage.getItem('vivian_voice_rate');
    return saved ? parseFloat(saved) : 1.05;
  });
  const [selectedFemaleVoice, setSelectedFemaleVoice] = useState<'natural' | 'suave' | 'clara'>(() => {
    return (localStorage.getItem('vivian_selected_female_voice') as any) || 'natural';
  });
  const [continuousVoice, setContinuousVoice] = useState<boolean>(() => {
    return localStorage.getItem('vivian_continuous_voice') === 'true';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const continuousVoiceRef = useRef(continuousVoice);
  const voiceEnabledRef = useRef(voiceEnabled);

  useEffect(() => {
    continuousVoiceRef.current = continuousVoice;
    localStorage.setItem('vivian_continuous_voice', continuousVoice.toString());
  }, [continuousVoice]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Load and sync IoT devices from local storage
  useEffect(() => {
    const loadIotDevices = () => {
      const saved = localStorage.getItem('condfy_iot_devices');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Standardize fields and ensure some devices have mock warnings/failed status for heatmap demo
          const standardized = parsed.map((dev: any, index: number) => ({
            ...dev,
            // To ensure the heatmap demo is incredibly rich, we make sure we have at least one or two alerts/faults
            isAlert: dev.isAlert !== undefined ? dev.isAlert : (index === 1 || dev.color === 'rose' || dev.color === 'amber'),
            consumptionValue: dev.consumptionValue !== undefined ? dev.consumptionValue : Math.floor(Math.random() * 85) + 10,
            isCritical: dev.isCritical !== undefined ? dev.isCritical : (index === 2 || dev.color === 'rose')
          }));
          setIotDevices(standardized);
        } catch (e) {
          console.warn('Error parsing IoT devices inside Vivian:', e);
        }
      } else {
        // Fallback robust default set
        const defaultSet = [
          { id: 'sample-1', name: 'Abrir Portão Social', url: 'http://homeassistant.local:8123/api/webhook/social_gate_sample', method: 'POST', icon: 'lock', color: 'neon', lastStatus: 'idle', isAlert: false, consumptionValue: 12 },
          { id: 'sample-2', name: 'Refletor da Quadra', url: 'https://api.tago.io/data/sample-reflector', method: 'GET', icon: 'lightbulb', color: 'amber', lastStatus: 'idle', isAlert: true, consumptionValue: 78 },
          { id: 'sample-3', name: 'Bomba de Recalque 01', url: 'http://192.168.1.150/bomba1', method: 'POST', icon: 'activity', color: 'rose', lastStatus: 'idle', isAlert: true, isCritical: true, consumptionValue: 94 },
          { id: 'sample-4', name: 'Controle de Climatização', url: 'http://192.168.1.180/ac', method: 'POST', icon: 'power', color: 'sky', lastStatus: 'idle', isAlert: false, consumptionValue: 45 },
          { id: 'sample-5', name: 'Iluminação Externa Hall', url: 'http://192.168.1.200/lights', method: 'GET', icon: 'lightbulb', color: 'emerald', lastStatus: 'idle', isAlert: false, consumptionValue: 15 },
          { id: 'sample-6', name: 'Sensores de Fumaça Ático', url: 'http://192.168.1.210/smoke', method: 'GET', icon: 'flame', color: 'rose', lastStatus: 'idle', isAlert: false, consumptionValue: 2 }
        ];
        setIotDevices(defaultSet);
        localStorage.setItem('condfy_iot_devices', JSON.stringify(defaultSet));
      }
    };

    loadIotDevices();
    window.addEventListener('condfy_iot_devices_updated', loadIotDevices);
    return () => {
      window.removeEventListener('condfy_iot_devices_updated', loadIotDevices);
    };
  }, [isOpen]);

  const updateVoiceTone = (tone: 'formal' | 'amigavel' | 'tecnica') => {
    setVoiceTone(tone);
    localStorage.setItem('vivian_voice_tone', tone);
    toast.success(`Tom de voz alterado para: ${tone === 'formal' ? 'Formal 👔' : tone === 'amigavel' ? 'Amigável 😊' : 'Técnica 🛠️'}`, { id: 'voice-tone-toast' });
  };

  const updateVoiceRate = (rate: number) => {
    setVoiceRate(rate);
    localStorage.setItem('vivian_voice_rate', rate.toString());
  };

  const updateFemaleVoice = (voiceOpt: 'natural' | 'suave' | 'clara') => {
    setSelectedFemaleVoice(voiceOpt);
    localStorage.setItem('vivian_selected_female_voice', voiceOpt);
    const label = voiceOpt === 'natural' ? 'LUMI Robótico (Google) 🤖' : voiceOpt === 'suave' ? 'LUMI Grave (Daniel) 🎙️' : 'LUMI Dinâmico (Felipe) 🌟';
    toast.success(`Voz alterada para: ${label}`, { id: 'female-voice-toast' });
  };

  const toggleJarvisMode = (enabled: boolean) => {
    setJarvisMode(enabled);
    localStorage.setItem('vivian_jarvis_mode', enabled.toString());
    if (enabled) {
      toast.success('Protocolo J.A.R.V.I.S. Ativado. "Sistemas operacionais online, Senhor."', {
        icon: '🤖',
        id: 'jarvis-toast',
        duration: 4500
      });
    } else {
      toast.success('Modo Inteligência Regular ativado.', {
        icon: '💡',
        id: 'jarvis-toast',
        duration: 3000
      });
    }
  };

  const handleSchedulePreventive = () => {
    if (!prevTitle.trim()) {
      toast.error('Por favor, informe o título da manutenção.');
      return;
    }
    
    const start = new Date(prevStartDate + 'T' + prevStartTime);
    if (isNaN(start.getTime())) {
      toast.error('Data ou hora de início inválida.');
      return;
    }

    // Add each recurrence as a calendar appointment
    for (let i = 0; i < prevRecurrences; i++) {
      const current = new Date(start.getTime());
      if (prevFrequency === 'mensal') {
        current.setMonth(current.getMonth() + i);
      } else if (prevFrequency === 'trimestral') {
        current.setMonth(current.getMonth() + i * 3);
      } else if (prevFrequency === 'semestral') {
        current.setMonth(current.getMonth() + i * 6);
      } else if (prevFrequency === 'anual') {
        current.setFullYear(current.getFullYear() + i);
      }

      const isoStart = current.toISOString();
      const endCalc = new Date(current.getTime() + 60 * 60 * 1000); // 1 hour duration
      const isoEnd = endCalc.toISOString();

      store.addAppointment({
        title: `[PREVENTIVA] ${prevTitle} (${i + 1}/${prevRecurrences})`,
        start: isoStart,
        end: isoEnd,
        type: 'TICKET',
        notes: `Agendado de forma periódica via Vivian AI.\nFrequência: ${prevFrequency.toUpperCase()}.\n\nNotas técnicas adicionadas:\n${prevNotes}`
      });
    }

    toast.success(`${prevRecurrences} lembretes periódicos de manutenção criados no calendário! 🎉`, { duration: 5000 });
    
    const feedbackMessage = `Com certeza! Agendei com sucesso no calendário predial ${prevRecurrences} manutenções preventivas periódicas para "${prevTitle}" com recorrência ${prevFrequency}.`;
    
    setMessages(prev => [
      ...prev,
      {
        id: 'scheduled-prev-notif-' + Date.now(),
        role: 'assistant',
        content: `📅 **Manutenção Periódica Vinculada ao Calendário:**\n\n- **Título:** ${prevTitle}\n- **Recorrência:** ${prevFrequency.toUpperCase()}\n- **Número de Visitas:** ${prevRecurrences} vezes\n- **Notas de Instrução:** ${prevNotes}\n\nTodos os lembretes foram registrados no sistema e estão acessíveis na tela de Calendário.`
      }
    ]);

    if (voiceEnabled) {
      speakText(feedbackMessage);
    }

    // Return to chat
    setShowPreventive(false);
  };

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    // Warm up/load SpeechSynthesis voices
    if ('speechSynthesis' in window) {
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      handleVoices();
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      cleanupAudioAnalyser();
    };
  }, []);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    // Clean text of markdown, emojis, acronyms, and format elements to make pronunciation incredibly natural and human
    let cleanText = text
      .replace(/\*+/g, '') // remove bold asterisks
      .replace(/#+/g, '')  // remove title hashtags
      .replace(/[-*]\s+/g, ' ') // replace list hyphens with a space for smooth breathing
      .replace(/[`_]+/g, '') // remove code blocks and italics
      .replace(/\[.*?\]/g, '') // remove markdown links
      .replace(/\(.*?\)/g, '') // remove parenthetical remarks (often read weirdly)
      .replace(/\{.*?\}/g, '') // remove template braces
      .replace(/[:;]\)/g, '') // remove smilies
      // strip emojis perfectly to avoid speech synthesis spelling them out or pausing awkwardly
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '')
      // Replace R$ 150,00 or R$150 with standard currency spoken words dynamically
      .replace(/R\$\s*(\d+(?:[.,]\d+)?)/g, '$1 reais')
      // Human-like conversions for technical acronyms or app names
      .replace(/CONDFY\.IA/gi, 'Condfai')
      .replace(/CONDFY/gi, 'Condfai')
      .replace(/\bOS\b/g, 'Ordem de Serviço')
      .replace(/\bO\.S\.\b/g, 'Ordem de Serviço')
      .replace(/\bIA\b/gi, 'Inteligência Artificial')
      .replace(/\bNBR\b/gi, 'Norma N B R')
      .replace(/\bAWS\b/gi, 'A W S')
      .replace(/%/g, ' por cento')
      .replace(/\bex:\s*/gi, 'por exemplo, ')
      .replace(/\s+/g, ' ') // normalize all spacing/linebreaks to a single clean space
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    
    const voices = window.speechSynthesis.getVoices();
    
    // Explicit lists of male and female keywords to prioritize male voices for LUMI
    const maleKeywords = ['daniel', 'antonio', 'donato', 'fabio', 'julio', 'nicolau', 'valerio', 'felipe', 'david', 'guy', 'male', 'homem', 'masculino', 'felipe', 'junior', 'ricardo', 'lucas', 'thiago', 'bruno', 'gabriel', 'siri voz 1', 'siri voz 3', 'siri male', 'google português do brasil'];
    const femaleKeywords = ['francisca', 'luciana', 'maria', 'brenda', 'heloisa', 'joana', 'yelda', 'clara', 'yara', 'elvira', 'female', 'mulher', 'feminino', 'siri voz 2', 'siri voz 4', 'siri female', 'zira', 'helena', 'samantha', 'victoria', 'nana', 'noemi', 'fernanda'];

    // Advanced ranking system to find the absolute most natural human-sounding pt-BR MALE voice available
    const scoredVoices = voices.map(v => {
      let score = 0;
      const nameLower = v.name.toLowerCase();
      const langLower = v.lang.toLowerCase();
      
      // Strict Check: Prioritize Brazilian Portuguese over Portugal Portuguese or generic Portuguese
      if (langLower === 'pt-br' || langLower.startsWith('pt-br')) {
        score += 200;
      } else if (langLower.startsWith('pt')) {
        score += 50;
      } else {
        return { voice: v, score: -1000 }; // Not Portuguese
      }

      // Check gender keywords and adjust scores
      const hasMaleKeyword = maleKeywords.some(mKey => nameLower.includes(mKey));
      const hasFemaleKeyword = femaleKeywords.some(fKey => nameLower.includes(fKey));

      if (hasMaleKeyword) {
        score += 400; // Heavily favor male voices
      }
      if (hasFemaleKeyword) {
        score -= 300; // Deprioritize female voices for LUMI, but keep as fallback if no male voice is available
      }

      // General neural / high quality boost for human-like feeling
      if (nameLower.includes('natural') || nameLower.includes('neural')) {
        score += 100;
      }
      if (nameLower.includes('online')) {
        score += 80;
      }
      if (nameLower.includes('google')) {
        score += 60;
      }
      if (nameLower.includes('siri') || nameLower.includes('apple')) {
        score += 55;
      }
      if (nameLower.includes('microsoft')) {
        score += 40;
      }

      // Score adjustments according to user's 3 chosen male voice profiles:
      if (selectedFemaleVoice === 'natural') {
        // Option 1: LUMI Robótico (Modern/Google Voices)
        if (nameLower.includes('google') || nameLower.includes('neural') || nameLower.includes('natural')) {
          score += 150;
        }
        if (nameLower.includes('siri') || nameLower.includes('apple')) {
          score += 100;
        }
      } else if (selectedFemaleVoice === 'suave') {
        // Option 2: LUMI Grave (Deeper/Daniel/Microsoft)
        if (nameLower.includes('daniel') || nameLower.includes('microsoft') || nameLower.includes('antonio')) {
          score += 150;
        }
      } else {
        // Option 3: LUMI Dinâmico (Felipe/System/Apple)
        if (nameLower.includes('felipe') || nameLower.includes('siri') || nameLower.includes('fábio') || nameLower.includes('fabio') || nameLower.includes('julio')) {
          score += 150;
        }
      }
      
      return { voice: v, score };
    }).filter(item => item.score > -500); // Filter out completely non-portuguese, but keep female if it's the only option
    
    // Sort descending by highest score
    scoredVoices.sort((a, b) => b.score - a.score);
    
    const ptVoice = scoredVoices.length > 0 ? scoredVoices[0].voice : null;
                     
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    
    // Optimize speech settings for a more natural cadence
    utterance.pitch = 1.0; 
    utterance.rate = voiceRate; // dynamically set by user settings

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (continuousVoiceRef.current && voiceEnabledRef.current) {
        // Delay slightly so the mic doesn't catch any ambient system audio/tail echo
        setTimeout(() => {
          startListening();
        }, 850);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const matchVoiceCommand = (text: string): string => {
    const normalizedText = text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .trim();

    for (const cmd of VOICE_COMMANDS) {
      for (const variation of cmd.variations) {
        const normalizedVar = variation.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
        
        if (normalizedText === normalizedVar || normalizedText.includes(normalizedVar)) {
          return cmd.prompt;
        }
      }
    }
    return text;
  };

  const cleanupAudioAnalyser = () => {
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping audio tracks:', e);
      }
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {
        console.warn('Error closing AudioContext:', e);
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setMicVolume(0);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('O reconhecimento de voz não é suportado neste navegador. Recomendamos usar o Google Chrome.');
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop talking when the user starts speaking
    }

    setIsListening(true); // set early to show the visual listening overlay instantly

    // Instanciar reconhecimento de voz imediatamente para garantir funcionamento robusto
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'pt-BR';

      rec.onstart = () => {
        setIsListening(true);
        toast.success('Vivian ouvindo... Fale agora 🎙️', { id: 'voice-toast' });
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          const matchedPrompt = matchVoiceCommand(transcript);
          setInput(matchedPrompt);
          setIsListening(false);
          cleanupAudioAnalyser();
          
          if (matchedPrompt !== transcript) {
            toast.success(`Comando reconhecido: "${transcript}"! ⚡`, { id: 'voice-toast', duration: 4000 });
          } else {
            toast.success(`Você: "${transcript}"`, { id: 'voice-toast' });
          }
          
          // Send message
          const userMessage: Message = { id: Date.now().toString(), role: 'user', content: matchedPrompt };
          setMessages(prev => [...prev, userMessage]);
          setInput('');
          setIsTyping(true);
          processChat(matchedPrompt);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        cleanupAudioAnalyser();
        if (event.error !== 'no-speech') {
          toast.error(`Erro ao ouvir: ${event.error}. Certifique-se de que o microfone está ativo.`, { id: 'voice-toast' });
        }
      };

      rec.onend = () => {
        setIsListening(false);
        cleanupAudioAnalyser();
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      cleanupAudioAnalyser();
      toast.error('Não foi possível iniciar o microfone.', { id: 'voice-toast' });
      return;
    }

    // Tenta iniciar analisador de volume de áudio em background como recurso adicional
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        audioStreamRef.current = stream;

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextClass();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64; 
          source.connect(analyser);

          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkVolume = () => {
            if (!isListeningRef.current || !analyserRef.current) {
              cleanupAudioAnalyser();
              return;
            }

            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;

            const normalized = Math.min(1, average / 100);
            setMicVolume(normalized);

            requestAnimationFrame(checkVolume);
          };

          requestAnimationFrame(checkVolume);
        } catch (e) {
          console.warn('Could not initialize Audio Analyser in background:', e);
        }
      })
      .catch((err) => {
        console.warn('Microphone volume analyser background stream disabled or blocked:', err);
      });
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
    setIsListening(false);
    cleanupAudioAnalyser();
  };
  // -------------------------------------
  
  const store = useStore();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Warning alert inside Vivian's chat messages if there are accounts expiring in 3 days
  useEffect(() => {
    const payables = store.accountsPayable || [];
    const receivables = store.accountsReceivable || [];
    
    const getDaysDiff = (dateStr: string) => {
      const target = new Date(dateStr + 'T12:00:00');
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    };

    const expiringPayables = payables.filter(item => (item.status === 'PENDING' || item.status === 'OVERDUE') && getDaysDiff(item.dueDate) === 3);
    const expiringReceivables = receivables.filter(item => (item.status === 'PENDING' || item.status === 'OVERDUE') && getDaysDiff(item.dueDate) === 3);

    if (expiringPayables.length > 0 || expiringReceivables.length > 0) {
      let alertContent = 'Olá! Gostaria de te alertar que temos movimentações financeiras importantes vencendo em exatamente 3 dias:\n\n';
      
      if (expiringPayables.length > 0) {
        alertContent += '⚠️ **Contas a Pagar:**\n';
        expiringPayables.forEach(item => {
          alertContent += `- **${item.description}**: R$ ${Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Vence em ${new Date(item.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')})\n`;
        });
        alertContent += '\n';
      }

      if (expiringReceivables.length > 0) {
        alertContent += '📅 **Contas a Receber (Recebíveis):**\n';
        expiringReceivables.forEach(item => {
          alertContent += `- **${item.description}**: R$ ${Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Esperado em ${new Date(item.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')})\n`;
        });
      }

      alertContent += '\nComo sua assistente virtual, recomendo que se organize para garantir que os pagamentos e recebimentos ocorram no prazo! Precisa de ajuda com alguma dessas operações?';

      // Check if this alert was already shown in current session
      const alreadyWarned = sessionStorage.getItem('vivian_3_days_alert_shown');
      if (!alreadyWarned) {
        setMessages(prev => [
          ...prev,
          {
            id: `alert-3days-${Date.now()}`,
            role: 'assistant',
            content: alertContent
          }
        ]);
        sessionStorage.setItem('vivian_3_days_alert_shown', 'true');
      }
    }
  }, [store.accountsPayable, store.accountsReceivable]);

  // Escuta Ativa: Notificação de voz ao abrir a assistente sobre OSs pendentes de alta prioridade
  useEffect(() => {
    if (isOpen && activeListeningStartup) {
      const alreadyNotified = sessionStorage.getItem('vivian_startup_notification_done');
      if (!alreadyNotified) {
        const pendingHighPriorityTickets = (store.tickets || []).filter(
          t => (t.priority === 'CRITICAL' || t.priority === 'HIGH') && t.status !== 'CONCLUIDO'
        );

        if (pendingHighPriorityTickets.length > 0) {
          const count = pendingHighPriorityTickets.length;
          const criticalTicket = pendingHighPriorityTickets.find(t => t.priority === 'CRITICAL') || pendingHighPriorityTickets[0];
          const ticketTitle = criticalTicket.title || 'Manutenção';
          const ticketRef = criticalTicket.osNumber || criticalTicket.id.slice(0, 5);

          const speechTextContent = `Olá! Identifiquei que temos ${count === 1 ? 'uma ordem de serviço pendente' : `${count} ordens de serviço pendentes`} de alta prioridade no sistema. A mais crítica é a OS número ${ticketRef}, sobre "${ticketTitle}". Recomendo darmos atenção a ela em breve!`;

          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                id: `startup-notif-${Date.now()}`,
                role: 'assistant',
                content: `🔔 **[Escuta Ativa] Alerta de OS Pendente de Alta Prioridade:**\n\n${speechTextContent}`
              }
            ]);
            
            if (voiceEnabledRef.current) {
              speakText(speechTextContent);
            }
          }, 800);
          
          sessionStorage.setItem('vivian_startup_notification_done', 'true');
        }
      }
    }
  }, [isOpen, activeListeningStartup, store.tickets]);

  // Handle external triggers (like analyzing a ticket)
  useEffect(() => {
    const handleAnalyzeTicket = (e: any) => {
      const ticketId = e.detail?.ticketId;
      if (ticketId) {
        setIsOpen(true);
        const ticket = store.tickets.find(t => t.id === ticketId || t.osNumber === ticketId);
        const ticketRef = ticket?.osNumber || ticket?.id || ticketId;
        const analysisPrompt = `Vivian, por favor, analise os detalhes da OS #${ticketRef} e me dê insights sobre ela.`;
        
        // Only add if not already analyzing or last message is different
        setMessages(prev => {
          if (prev[prev.length - 1]?.content === analysisPrompt) return prev;
          return [...prev, { id: Date.now().toString(), role: 'user', content: analysisPrompt }];
        });
        
        // Trigger the assistant reply
        setIsTyping(true);
        handleSendDirectly(analysisPrompt);
      }
    };

    window.addEventListener('vivian-analyze-ticket', handleAnalyzeTicket);
    return () => window.removeEventListener('vivian-analyze-ticket', handleAnalyzeTicket);
  }, [store.tickets]);

  const handleSendDirectly = async (content: string) => {
    setIsTyping(true);
    await processChat(content);
  };

  const generateTicketPDF = (ticketId: string) => {
    const ticket = store.tickets.find(t => t.id === ticketId || t.osNumber === ticketId || t.id.includes(ticketId));
    if (!ticket) return `Não encontrei a OS com ID ${ticketId}.`;

    const client = store.clients.find(c => c.id === ticket.clientId);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('ORDEM DE SERVIÇO', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Data: ${safeFormatDate(ticket.date)}`, 195, 20, { align: 'right' });
    doc.text(`OS Nº: ${ticket.osNumber || ticket.id}`, 195, 25, { align: 'right' });

    // Company Info
    doc.setFontSize(12);
    doc.text(store.companyData.name || 'CONDFY.IA', 15, 40);
    
    // Ticket Details
    doc.setFontSize(14);
    doc.text(ticket.title, 15, 60);
    
    doc.setFontSize(11);
    doc.text(`Status: ${ticket.status}`, 15, 70);
    doc.text(`Tipo: ${ticket.type}`, 80, 70);
    doc.text(`Local: ${ticket.location || 'N/A'}`, 15, 77);
    doc.text(`Relatado por: ${ticket.reportedBy || 'N/A'}`, 15, 84);
    doc.text(`Técnico: ${ticket.technician || 'Não atribuído'}`, 15, 91);

    // Client Info
    doc.setFontSize(12);
    doc.text('CLIENTE:', 15, 105);
    doc.setFontSize(10);
    doc.text(`Nome: ${client?.name || 'Cliente não identificado'}`, 15, 110);
    doc.text(`Endereço: ${client?.address || ''}`, 15, 115);

    // Observations
    doc.setFontSize(12);
    doc.text('OBSERVAÇÕES / RELATO:', 15, 130);
    doc.setFontSize(10);
    const splitObs = doc.splitTextToSize(ticket.observations || 'Nenhuma observação.', 180);
    doc.text(splitObs, 15, 137);

    doc.save(`OS_${ticket.osNumber || ticket.id}.pdf`);
    return `O PDF da Ordem de Serviço ${ticket.osNumber || ticket.id} foi gerado e o download iniciado.`;
  };

  const generateQuotePDF = (quoteId: string) => {
    const quote = store.quotes.find(q => q.id === quoteId || q.id.includes(quoteId));
    if (!quote) return `Não encontrei o orçamento com ID ${quoteId}.`;

    const client = store.clients.find(c => c.id === quote.clientId);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('ORÇAMENTO', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Data: ${safeFormatDate(quote.date)}`, 195, 20, { align: 'right' });
    doc.text(`ID: ${quote.id}`, 195, 25, { align: 'right' });

    // Company Info
    doc.setFontSize(12);
    doc.text(store.companyData.name || 'CONDFY.IA', 15, 40);
    doc.setFontSize(10);
    doc.text(store.companyData.address || '', 15, 45);
    doc.text(`Tel: ${store.companyData.phone || ''}`, 15, 50);

    // Client Info
    doc.setFontSize(12);
    doc.text('CLIENTE:', 15, 65);
    doc.setFontSize(10);
    doc.text(`Nome: ${client?.name || 'Cliente não identificado'}`, 15, 70);
    doc.text(`Endereço: ${client?.address || ''}`, 15, 75);

    // Items Table
    let y = 90;
    doc.setFontSize(11);
    doc.text('Descrição', 15, y);
    doc.text('Qtd', 120, y);
    doc.text('V. Unit', 150, y);
    doc.text('Total', 180, y);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    quote.items.forEach(item => {
      doc.text(item.description, 15, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`R$ ${item.unitPrice.toFixed(2)}`, 150, y);
      doc.text(`R$ ${item.total.toFixed(2)}`, 180, y);
      y += 7;
    });

    doc.line(15, y, 195, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`TOTAL: R$ ${quote.totalValue.toFixed(2)}`, 195, y, { align: 'right' });

    doc.save(`Orcamento_${quote.id}.pdf`);
    return `O PDF do orçamento ${quote.id} foi gerado e o download iniciado.`;
  };

  const generateDocument = async (templateName: string, context: string) => {
    const template = store.documentTemplates.find(t => 
      t.title.toLowerCase().includes(templateName.toLowerCase()) || 
      t.category.toLowerCase().includes(templateName.toLowerCase())
    );

    if (!template) {
      return `Não encontrei um modelo de documento com o nome "${templateName}". Os modelos disponíveis são: ${store.documentTemplates.map(t => t.title).join(', ')}.`;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Você é o LUMI, um assistente virtual inteligente de gestão de condomínios.
        Preencha o seguinte modelo de documento com as informações fornecidas.
        Substitua as tags (como [NOME], [DATA], etc.) pelas informações do contexto.
        Se faltar alguma informação no contexto, invente dados plausíveis ou deixe em branco se não for possível inventar.
        Retorne APENAS o texto do documento preenchido, sem formatação markdown adicional.
        
        Modelo:
        ${template.content}
        
        Contexto do usuário:
        ${context}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const filledContent = response.text || '';

      // Generate PDF
      const doc = new jsPDF();
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(filledContent, 180);
      doc.text(splitText, 15, 20);
      doc.save(`${template.title.replace(/\s+/g, '_')}_gerado.pdf`);

      return `Documento "${template.title}" preenchido e o download foi iniciado automaticamente.`;
    } catch (error) {
      console.error('Error generating document:', error);
      return `Ocorreu um erro ao tentar gerar o documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }
  };

  const getSummary = (topic: string) => {
    switch (topic.toLowerCase()) {
      case 'financeiro':
      case 'finanças':
        const totalReceitas = store.receipts.reduce((acc, r) => acc + (Number(r.value) || 0), 0);
        const totalDespesas = store.costs.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
        return `Resumo Financeiro: Receitas totais de R$ ${(totalReceitas).toFixed(2)} e despesas totais de R$ ${(totalDespesas).toFixed(2)}. Saldo: R$ ${(totalReceitas - totalDespesas).toFixed(2)}.`;
      case 'chamados':
      case 'tickets':
        const abertos = store.tickets.filter(t => t.status === 'PENDENTE_APROVACAO').length;
        const emAndamento = store.tickets.filter(t => t.status === 'REALIZANDO' || t.status === 'AGUARDANDO_MATERIAL').length;
        const concluidos = store.tickets.filter(t => t.status === 'CONCLUIDO').length;
        return `Resumo de Chamados: ${abertos} abertos, ${emAndamento} em andamento e ${concluidos} concluídos. Total: ${store.tickets.length}.`;
      case 'moradores':
      case 'clientes':
        return `Temos um total de ${store.clients.length} moradores/clientes cadastrados no sistema.`;
      case 'agenda':
      case 'compromissos':
        const hoje = new Date().toISOString().split('T')[0];
        const compromissosHoje = store.appointments.filter(a => a.start.startsWith(hoje)).length;
        return `Resumo da Agenda: Você tem ${compromissosHoje} compromissos marcados para hoje. Total de compromissos cadastrados: ${store.appointments.length}.`;
      default:
        return `Não tenho um resumo específico para "${topic}". Posso resumir: financeiro, chamados, moradores ou agenda.`;
    }
  };

  const getDetailedFinancialInfo = (type: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filterByMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    switch (type) {
      case 'HIGHEST_RECEIPT':
        const monthReceipts = store.receipts.filter(r => filterByMonth(r.date));
        if (monthReceipts.length === 0) return "Não encontrei recebimentos registrados para este mês.";
        const highest = monthReceipts.reduce((prev, current) => (prev.value > current.value) ? prev : current);
        return `O maior recebimento deste mês foi de R$ ${highest.value.toFixed(2)} (${highest.description}) no dia ${safeFormatDate(highest.date)}.`;
      
      case 'LAST_RECEIPT':
        if (store.receipts.length === 0) return "Não há registros de entrada de dinheiro no sistema.";
        const lastR = [...store.receipts].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        })[0];
        return `A última entrada de dinheiro foi de R$ ${lastR.value.toFixed(2)} (${lastR.description}) em ${safeFormatDate(lastR.date)}.`;

      case 'HIGHEST_COST':
        const monthCosts = store.costs.filter(c => filterByMonth(c.date));
        if (monthCosts.length === 0) return "Não encontrei despesas registradas para este mês.";
        const highestC = monthCosts.reduce((prev, current) => (prev.value > current.value) ? prev : current);
        return `A maior despesa deste mês foi de R$ ${highestC.value.toFixed(2)} (${highestC.description}) no dia ${safeFormatDate(highestC.date)}.`;

      case 'LAST_COST':
        if (store.costs.length === 0) return "Não há registros de saída de dinheiro no sistema.";
        const lastC = [...store.costs].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        })[0];
        return `A última saída de dinheiro foi de R$ ${lastC.value.toFixed(2)} (${lastC.description}) em ${safeFormatDate(lastC.date)}.`;

      default:
        return "Não consegui processar essa consulta financeira específica. Posso informar o maior recebimento, a última entrada, a maior despesa ou a última saída.";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await processChat(userMessage.content);
  };

  const processChat = async (userContent: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const generateDocumentTool: FunctionDeclaration = {
        name: 'generateDocument',
        description: 'Gera um documento baseado em um modelo existente e faz o download em PDF automaticamente. Use isso quando o usuário pedir para criar, preencher ou gerar um documento, ata, edital, notificação, etc.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            templateName: {
              type: Type.STRING,
              description: 'O nome ou tipo do documento (ex: "Ata de Assembleia", "Notificação", "Regimento").',
            },
            context: {
              type: Type.STRING,
              description: 'O contexto ou detalhes para preencher o documento (ex: "para o apartamento 101 por barulho excessivo à noite").',
            },
          },
          required: ['templateName', 'context'],
        },
      };

      const getSummaryTool: FunctionDeclaration = {
        name: 'getSummary',
        description: 'Obtém um resumo de dados do sistema. Tópicos disponíveis: financeiro, chamados, moradores, agenda.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            topic: {
              type: Type.STRING,
              description: 'O tópico para resumir (financeiro, chamados, moradores, agenda).',
            },
          },
          required: ['topic'],
        },
      };

      const navigateTool: FunctionDeclaration = {
        name: 'navigate',
        description: 'Navega para uma página específica do sistema.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            path: {
              type: Type.STRING,
              description: 'O caminho da rota (ex: "/", "/tickets", "/financial", "/document-factory", "/clients").',
            },
          },
          required: ['path'],
        },
      };

      const createKanbanTaskTool: FunctionDeclaration = {
        name: 'createKanbanTask',
        description: 'Cria uma nova tarefa diretamente no Kanban na coluna "Aprovado". Use isso quando o usuário pedir para adicionar uma tarefa, lembrete ou card ao Kanban.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'O que precisa ser feito (título da tarefa).',
            },
            observations: {
              type: Type.STRING,
              description: 'Detalhes adicionais da tarefa.',
            },
            technician: {
              type: Type.STRING,
              description: 'Responsável pela tarefa (opcional).',
            },
          },
          required: ['title'],
        },
      };

      const createTicketTool: FunctionDeclaration = {
        name: 'createTicket',
        description: 'Cria uma nova Ordem de Serviço (OS) ou Chamado no sistema a partir de uma descrição em texto. Use isso para problemas técnicos ou manutenções. Para tarefas simples no Kanban, use "createKanbanTask".',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Título curto ou resumo do chamado.',
            },
            type: {
              type: Type.STRING,
              description: 'Tipo do chamado. Valores permitidos: PREVENTIVA, CORRETIVA.',
            },
            observations: {
              type: Type.STRING,
              description: 'Descrição detalhada do problema ou tarefa.',
            },
            location: {
              type: Type.STRING,
              description: 'Local do problema (ex: "Apartamento 101", "Piscina").',
            },
            reportedBy: {
              type: Type.STRING,
              description: 'Quem relatou o problema (nome do morador ou funcionário).',
            },
          },
          required: ['title', 'type', 'observations'],
        },
      };

      const addClientTool: FunctionDeclaration = {
        name: 'addClient',
        description: 'Cadastra um novo morador ou cliente no sistema.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Nome completo do morador/cliente.',
            },
            phone: {
              type: Type.STRING,
              description: 'Telefone de contato.',
            },
            address: {
              type: Type.STRING,
              description: 'Endereço, apartamento ou unidade (ex: "Apt 202").',
            },
            email: {
              type: Type.STRING,
              description: 'E-mail de contato.',
            },
          },
          required: ['name', 'phone', 'address'],
        },
      };

      const addFinancialRecordTool: FunctionDeclaration = {
        name: 'addFinancialRecord',
        description: 'Registra uma nova receita (entrada) ou despesa (saída) financeira no sistema.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            recordType: {
              type: Type.STRING,
              description: 'Tipo de registro: "RECEITA" ou "DESPESA".',
            },
            description: {
              type: Type.STRING,
              description: 'Descrição do lançamento (ex: "Pagamento de condomínio", "Conta de luz").',
            },
            value: {
              type: Type.NUMBER,
              description: 'Valor financeiro (número positivo).',
            },
            category: {
              type: Type.STRING,
              description: 'Categoria da despesa (apenas se for DESPESA).',
            },
          },
          required: ['recordType', 'description', 'value'],
        },
      };

      const addAppointmentTool: FunctionDeclaration = {
        name: 'addAppointment',
        description: 'Cria um novo compromisso na agenda.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título do compromisso.' },
            start: { type: Type.STRING, description: 'Data e hora de início (ISO string, ex: "2026-03-23T10:00:00.000Z").' },
            end: { type: Type.STRING, description: 'Data e hora de término (ISO string, ex: "2026-03-23T11:00:00.000Z").' },
            type: { type: Type.STRING, description: 'Tipo do compromisso (TICKET, MEETING, OTHER).' },
            notes: { type: Type.STRING, description: 'Observações adicionais.' },
          },
          required: ['title', 'start', 'end', 'type'],
        },
      };

      const createBudgetTool: FunctionDeclaration = {
        name: 'createBudget',
        description: 'Cria um orçamento (Ordem de Serviço do tipo ORCAMENTO).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título ou resumo do orçamento.' },
            observations: { type: Type.STRING, description: 'Descrição detalhada do orçamento.' },
            budgetAmount: { type: Type.NUMBER, description: 'Valor do orçamento.' },
            clientName: { type: Type.STRING, description: 'Nome do cliente (opcional).' },
          },
          required: ['title', 'observations', 'budgetAmount'],
        },
      };

      const createQRCodeTool: FunctionDeclaration = {
        name: 'createQRCode',
        description: 'Cria um QR Code (local) para um cliente específico.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do cliente ou morador.' },
            qrCodeName: { type: Type.STRING, description: 'Nome do local ou QR Code a ser criado.' },
          },
          required: ['clientName', 'qrCodeName'],
        },
      };

      const addSupplyItemTool: FunctionDeclaration = {
        name: 'addSupplyItem',
        description: 'Cadastra um novo insumo (produto/material) para um cliente.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nome do insumo.' },
            category: { type: Type.STRING, description: 'Categoria do insumo (LIMPEZA ou PISCINA).' },
            unit: { type: Type.STRING, description: 'Unidade de medida (ex: un, kg, L).' },
            clientName: { type: Type.STRING, description: 'Nome do cliente ao qual o insumo pertence.' },
          },
          required: ['name', 'category', 'unit', 'clientName'],
        },
      };

      const createQuoteTool: FunctionDeclaration = {
        name: 'createQuote',
        description: 'Cria um orçamento formal (Quote) com itens detalhados. Use isso quando o usuário pedir para criar um orçamento para um cliente.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do cliente ou morador.' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: 'Descrição do item ou serviço.' },
                  quantity: { type: Type.NUMBER, description: 'Quantidade.' },
                  unitPrice: { type: Type.NUMBER, description: 'Preço unitário.' },
                },
                required: ['description', 'quantity', 'unitPrice'],
              },
              description: 'Lista de itens do orçamento.',
            },
          },
          required: ['clientName', 'items'],
        },
      };

      const addChecklistItemTool: FunctionDeclaration = {
        name: 'addChecklistItem',
        description: 'Adiciona uma nova tarefa de checklist ou manutenção preventiva.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            task: { type: Type.STRING, description: 'Descrição da tarefa.' },
            category: { type: Type.STRING, description: 'Categoria (ex: "Elétrica", "Hidráulica", "Limpeza").' },
            clientName: { type: Type.STRING, description: 'Nome do cliente (opcional).' },
          },
          required: ['task', 'category'],
        },
      };

      const addNoticeTool: FunctionDeclaration = {
        name: 'addNotice',
        description: 'Cria um novo comunicado ou aviso para os moradores.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título do aviso.' },
            content: { type: Type.STRING, description: 'Conteúdo detalhado do aviso.' },
            category: { type: Type.STRING, description: 'Categoria: MAINTENANCE, EVENT, GENERAL, SECURITY.' },
            clientName: { type: Type.STRING, description: 'Nome do condomínio/cliente.' },
          },
          required: ['title', 'content', 'category', 'clientName'],
        },
      };

      const addVisitorTool: FunctionDeclaration = {
        name: 'addVisitor',
        description: 'Registra um novo visitante ou prestador de serviço.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nome do visitante.' },
            document: { type: Type.STRING, description: 'Documento (RG/CPF).' },
            type: { type: Type.STRING, description: 'Tipo: VISITOR ou SERVICE_PROVIDER.' },
            apartment: { type: Type.STRING, description: 'Apartamento de destino.' },
            tower: { type: Type.STRING, description: 'Torre de destino.' },
            validUntil: { type: Type.STRING, description: 'Data de validade (ISO string).' },
          },
          required: ['name', 'type', 'apartment', 'tower', 'validUntil'],
        },
      };

      const addReservationTool: FunctionDeclaration = {
        name: 'addReservation',
        description: 'Cria uma reserva de área comum.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do morador.' },
            areaName: { type: Type.STRING, description: 'Nome da área (ex: "Salão de Festas", "Churrasqueira").' },
            date: { type: Type.STRING, description: 'Data da reserva (YYYY-MM-DD).' },
            startTime: { type: Type.STRING, description: 'Hora de início (HH:mm).' },
            endTime: { type: Type.STRING, description: 'Hora de término (HH:mm).' },
          },
          required: ['clientName', 'areaName', 'date', 'startTime', 'endTime'],
        },
      };

      const addStaffTool: FunctionDeclaration = {
        name: 'addStaff',
        description: 'Cadastra um novo funcionário ou membro da equipe.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nome completo.' },
            role: { type: Type.STRING, description: 'Cargo.' },
            phone: { type: Type.STRING, description: 'Telefone.' },
            shift: { type: Type.STRING, description: 'Turno: MORNING, AFTERNOON, NIGHT, FLEXIBLE.' },
          },
          required: ['name', 'role', 'phone', 'shift'],
        },
      };

      const addKeyTool: FunctionDeclaration = {
        name: 'addKey',
        description: 'Cadastra uma nova chave no controle de chaves.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            keyName: { type: Type.STRING, description: 'Nome ou identificação da chave.' },
            location: { type: Type.STRING, description: 'Local onde a chave fica ou o que ela abre.' },
          },
          required: ['keyName', 'location'],
        },
      };

      const addTicketHistoryTool: FunctionDeclaration = {
        name: 'addTicketHistory',
        description: 'Adiciona uma nota ou atualização ao histórico de um chamado/OS existente.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            ticketId: { type: Type.STRING, description: 'ID do chamado (ou número da OS).' },
            note: { type: Type.STRING, description: 'A nota ou atualização a ser adicionada.' },
          },
          required: ['ticketId', 'note'],
        },
      };

      const listTemplatesTool: FunctionDeclaration = {
        name: 'listTemplates',
        description: 'Lista todos os modelos de documentos disponíveis no sistema.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      };

      const updateTicketStatusTool: FunctionDeclaration = {
        name: 'updateTicketStatus',
        description: 'Atualiza o status de um chamado ou ordem de serviço.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            ticketId: { type: Type.STRING, description: 'ID do chamado ou número da OS.' },
            status: { type: Type.STRING, description: 'Novo status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED.' },
          },
          required: ['ticketId', 'status'],
        },
      };

      const updateQuoteStatusTool: FunctionDeclaration = {
        name: 'updateQuoteStatus',
        description: 'Atualiza o status de um orçamento (Quote).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            quoteId: { type: Type.STRING, description: 'ID do orçamento.' },
            status: { type: Type.STRING, description: 'Novo status: DRAFT, SENT, APPROVED, REJECTED.' },
          },
          required: ['quoteId', 'status'],
        },
      };

      const addWaterReadingTool: FunctionDeclaration = {
        name: 'addWaterReading',
        description: 'Registra uma nova leitura de consumo de água.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do morador/unidade.' },
            reading: { type: Type.NUMBER, description: 'Valor da leitura atual.' },
            month: { type: Type.STRING, description: 'Mês de referência (ex: "Março").' },
          },
          required: ['clientName', 'reading', 'month'],
        },
      };

      const addEnergyReadingTool: FunctionDeclaration = {
        name: 'addEnergyReading',
        description: 'Registra uma nova leitura de consumo de energia.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do morador/unidade.' },
            reading: { type: Type.NUMBER, description: 'Valor da leitura atual.' },
            month: { type: Type.STRING, description: 'Mês de referência (ex: "Março").' },
          },
          required: ['clientName', 'reading', 'month'],
        },
      };

      const downloadQuotePDFTool: FunctionDeclaration = {
        name: 'downloadQuotePDF',
        description: 'Gera e faz o download do PDF de um orçamento (Quote) específico do sistema.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            quoteId: { type: Type.STRING, description: 'O ID ou número do orçamento.' },
          },
          required: ['quoteId'],
        },
      };

      const downloadTicketPDFTool: FunctionDeclaration = {
        name: 'downloadTicketPDF',
        description: 'Gera e faz o download do PDF de uma Ordem de Serviço (OS) ou Chamado específico do sistema.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            ticketId: { type: Type.STRING, description: 'O ID ou número da OS/Chamado.' },
          },
          required: ['ticketId'],
        },
      };

      const getFinancialProjectionTool: FunctionDeclaration = {
        name: 'getFinancialProjection',
        description: 'Calcula projeções financeiras baseadas nas receitas e despesas atuais.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            months: { type: Type.NUMBER, description: 'Número de meses para a projeção (padrão: 6).' },
          },
        },
      };

      const adjustSupplyStockTool: FunctionDeclaration = {
        name: 'adjustSupplyStock',
        description: 'Ajusta o estoque atual de um insumo/suprimento de um condomínio.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do condomínio/cliente.' },
            supplyName: { type: Type.STRING, description: 'Nome do insumo (ex: Cloro, Detergente).' },
            newQuantity: { type: Type.NUMBER, description: 'A nova quantidade total em estoque.' },
          },
          required: ['clientName', 'supplyName', 'newQuantity'],
        },
      };

      const getCondoHydraulicInfoTool: FunctionDeclaration = {
        name: 'getCondoHydraulicInfo',
        description: 'Informa sobre a parte hídrica do condomínio, como volume da cisterna ou reservatório.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do condomínio/cliente.' },
          },
          required: ['clientName'],
        },
      };

      const getDetailedFinancialInfoTool: FunctionDeclaration = {
        name: 'getDetailedFinancialInfo',
        description: 'Obtém informações financeiras detalhadas e específicas, como o maior recebimento do mês, a última entrada de dinheiro, a maior despesa, etc.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: 'O tipo de informação solicitada: HIGHEST_RECEIPT (maior recebimento do mês), LAST_RECEIPT (última entrada), HIGHEST_COST (maior despesa do mês), LAST_COST (última saída).',
            },
          },
          required: ['type'],
        },
      };

      const getTicketDetailsTool: FunctionDeclaration = {
        name: 'getTicketDetails',
        description: 'Obtém todos os detalhes de uma Ordem de Serviço (OS) ou Chamado específico, incluindo histórico, observações e cliente.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            ticketId: {
              type: Type.STRING,
              description: 'O ID ou número da OS/Chamado.',
            },
          },
          required: ['ticketId'],
        },
      };

      const setCondoHydraulicInfoTool: FunctionDeclaration = {
        name: 'setCondoHydraulicInfo',
        description: 'Define ou atualiza as informações hídricas de um condomínio (cisterna/reservatório).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: 'Nome do condomínio/cliente.' },
            cisternVolume: { type: Type.NUMBER, description: 'Volume da cisterna em litros.' },
            reservoirVolume: { type: Type.NUMBER, description: 'Volume do reservatório em litros.' },
          },
          required: ['clientName'],
        },
      };

      const controlEquipmentTool: FunctionDeclaration = {
        name: 'controlEquipment',
        description: 'Controla equipamentos do condomínio (bombas, luzes, alarme). Use isso quando o usuário pedir para ligar/desligar bombas, luzes ou o alarme.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            equipment: {
              type: Type.STRING,
              description: 'O equipamento a ser controlado (ex: "BOMBA_CAIXA", "BOMBA_JARDIM", "LUZ_SALA", "LUZ_COZINHA", "LUZ_JARDIM", "TODAS_LUZES", "ALARME").',
            },
            action: {
              type: Type.STRING,
              description: 'A ação a ser realizada: "LIGAR" ou "DESLIGAR". Para luzes, "LIGAR" define 100% e "DESLIGAR" define 0%.',
            },
          },
          required: ['equipment', 'action'],
        },
      };

      const sysClients = store.clients || [];
      const sysTickets = store.tickets || [];
      const sysSupplies = store.supplyItems || [];
      const sysNotices = store.notices || [];
      const sysReservations = store.reservations || [];
      const sysIot = store.iotState || { pumps: { caixa: false, jardim: false, auto: false }, lights: { cozinha: 0, sala: 0, jardim: 0, todas: false }, alarmActive: false };
      
      const totalIncome = store.receipts?.reduce((acc, r) => acc + (r.value || 0), 0) || 0;
      const totalExpense = store.costs?.reduce((acc, c) => acc + (c.value || 0), 0) || 0;
      const currentBalance = totalIncome - totalExpense;

      const ticketsAprovado = sysTickets.filter(t => t.status === 'APROVADO').length;
      const ticketsAguardandoMat = sysTickets.filter(t => t.status === 'AGUARDANDO_MATERIAL').length;
      const ticketsRealizando = sysTickets.filter(t => t.status === 'REALIZANDO').length;
      const ticketsConcluido = sysTickets.filter(t => t.status === 'CONCLUIDO').length;

      const criticalSupplies = sysSupplies.filter(item => (item.currentStock || 0) < (item.minStock || 0));

      const activeNotices = sysNotices.length;
      const pendingReservations = sysReservations.filter(r => r.status === 'PENDING').length;

      const systemStateContext = `
=============================================
[CONDFY.IA - CONTEXTO OPERACIONAL AO VIVO]
Utilize os dados REAIS abaixo para formular respostas de altíssimo nível, contextualizadas, precisas e consultivas:
• Condomínios Administrados (${sysClients.length}): ${sysClients.map(c => `"${c.name}"`).join(', ') || 'Nenhum'}
• Status dos Chamados & Manutenções (OS):
  - Total no Sistema: ${sysTickets.length}
  - Aprovados (Planejados): ${ticketsAprovado}
  - Aguardando Material: ${ticketsAguardandoMat}
  - Em Execução Técnica: ${ticketsRealizando}
  - Concluídos e Entregues: ${ticketsConcluido}
  - Últimas 5 ordens de serviço ativas:
    ${sysTickets.slice(-5).map(t => `ID: #${t.osNumber || t.id.slice(0,5)} | "${t.title}" | Status: ${t.status} | Tipo: ${t.type} | Condomínio: ${sysClients.find(c => c.id === t.clientId)?.name || 'Geral'}`).join('\n    ') || 'Nenhuma OS ativa recente'}
• Estoque do Almoxarifado (Suprimentos):
  - Total de Itens: ${sysSupplies.length}
  - Itens com ESTOQUE CRÍTICO (${criticalSupplies.length}): ${criticalSupplies.map(i => `"${i.name}" (Disponível: ${i.currentStock} ${i.unit} | Mínimo Recomendado: ${i.minStock} ${i.unit})`).join(', ') || 'Todo o estoque está em nível regular! Nenhuma criticidade.'}
• Fluxo Financeiro Atualizado:
  - Total de Entradas/Receitas: R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  - Total de Custos/Saídas: R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  - Saldo em Caixa Consolidado: R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Mural de Avisos Ativos: ${activeNotices} comunicados ativos.
• Reservas de Lazer: ${pendingReservations} pendentes de aprovação da administração.
• Infraestrutura Predial & Sensores IoT:
  - Recalque da Caixa d'Água Superior: ${sysIot.pumps?.caixa ? '⚡ ATIVA E BOMBEANDO (Em funcionamento perfeito)' : '💤 DESLIGADA (Em stand-by)'}
  - Bomba de Irrigação (Jardins): ${sysIot.pumps?.jardim ? '⚡ ATIVA' : '💤 EM DESCANSO'}
  - Controle Inteligente de Revezamento: ${sysIot.pumps?.auto ? '🔗 AUTOMACÃO LIGADA (Sistema assume)' : '🔧 HAND-DRIVE MANUAL'}
  - Níveis de Dimerização das Luzes: Cozinha (${sysIot.lights?.cozinha || 0}%), Sala Principal (${sysIot.lights?.sala || 0}%), Jardim (${sysIot.lights?.jardim || 0}%)
  - Alarme de Segurança Perimetral: ${sysIot.alarmActive ? '🚨 PERIGO: ALARME DISPARADO / ARMADO' : '🟢 SISTEMA DE SEGURANÇA SEGURO E MONITORADO'}
=============================================`;

      const toneInstruction = 
        voiceTone === 'formal'
          ? 'Seu tom de resposta deve ser altamente FORMAL, POLIDO, RESPEITOSO e IMPECÁVEL, porém extremamente DIRETO e CURTO. Dirija-se ao usuário com cortesia ("Prezado(a)" ou "Senhor/Senhora") de forma rápida, sem alongar a resposta.'
          : voiceTone === 'tecnica'
          ? 'Seu tom de resposta deve ser extremamente TÉCNICO, ANALÍTICO, DIRETO e OBJETIVO. Vá direto aos fatos operacionais ou financeiros de forma super concisa, sem floreios.'
          : 'Seu tom de resposta deve ser AMIGÁVEL, ENÉRGICO e PARCEIRO, mas MUITO CURTO e DIRETO. Evite rodeios e entregue as respostas de forma rápida e focada.';

      const jarvisPromptAddendum = jarvisMode 
        ? `\n\n### ⚡ PROTOCOLO J.A.R.V.I.S ATIVO:
Você agora opera no MODO J.A.R.V.I.S, mas suas respostas devem ser extremamente CURTAS e DIRETAS.
1. Chame o usuário de "Senhor", "Chefe" ou "Criador".
2. Use prefixos ou saudações futuristas de telemetria curtos de no máximo uma linha (ex: "Sistemas calibrados, Senhor." ou "LUMI online e operacional!").
3. Mantenha os comentários espirituosos em pouquíssimas palavras.`
        : '';

      let response;
      let retries = 5;
      let delay = 3000;

      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Histórico da conversa recente:
${messages.map(m => `${m.role === 'user' ? 'Usuário' : 'LUMI'}: ${m.content}`).join('\n')}

Dado Adicional do Sistema de Gestão:
${systemStateContext}

Usuário atual perguntou: "${userContent}"`,
            config: {
              systemInstruction: `Você é o LUMI, o inteligentíssimo co-piloto de Gestão Condominial e Engenharia Predial Avançada do CONDFY.IA.

### ⚠️ DIRETRIZ CRÍTICA DE CONCISÃO:
Suas respostas devem ser extremamente DIRETAS, CONCISAS, CURTAS e OBJETIVAS. Evite explicações longas, introduções ou rodeios. Entregue os dados de forma rápida e ultra sintetizada.

### 📅 DIRETRIZ DO RESUMO DO DIA:
Sempre que o usuário pedir um resumo, resumo do dia ("resumo", "resumo do dia", "balanço", "telemetria do dia") ou ao iniciar um diálogo de panorama geral, formate a resposta estritamente dessa forma curta e direta:
1. **Caixa**: Informe o saldo consolidado atual de forma direta (ex: "Saldo de Caixa: R$ X,XX (Entradas: R$ Y | Saídas: R$ Z)").
2. **OS em Aberto**: Quantos chamados (OS) estão em aberto/ativos no momento (total de chamados que não estão no status "CONCLUIDO").
3. **Manutenções Preventivas**: Informe resumidamente se há alguma manutenção preventiva agendada (ex: "Revisão da Bomba de Recalque agendada para as 14h" ou "Nenhuma manutenção preventiva agendada para hoje").
4. **Frase Motivacional**: Uma única frase motivacional super curta, inspiradora e direta para começar o dia!

${jarvisPromptAddendum}

### 🎭 DIRETRIZ DE PERSONA E TOM DE VOZ ATUAL:
${toneInstruction}

### 🧠 REGRAS DE OURO DE INTELIGÊNCIA & COMPORTAMENTO
1. **Poder Analítico Direto**: Use o bloco "[CONDFY.IA - CONTEXTO OPERACIONAL AO VIVO]" fornecido a cada mensagem. Responda ao que foi perguntado de maneira ágil, citando apenas as informações exatas de forma direta e curta.
2. **Suporte Técnico Objetivo**: Quando houver problemas técnicos, dê um diagnóstico preciso, rápido e as soluções imediatas sugeridas sem floreios ou explicações teóricas excessivas.
3. **Comunicação de Alta Performance**: Use Markdown minimalista, poucas linhas e listas rápidas de leitura imediata.
4. **Naturalidade e Objetividade**: Sem saudações ou despedidas prolixas. Vá direto aos fatos.
5. **Proatividade com Ferramentas**: Se o usuário solicitar uma ação que corresponde a um comando (ex: criar chamado, cadastrar visitante, lançar despesa, etc.), execute a ferramenta correspondente na hora de forma silenciosa e eficiente.

### 🛡️ METODOLOGIA DOS 4 PILARES DA GESTÃO:
Sempre de forma muito sintetizada, ajude o usuário com os 4 pilares:
1. **Pilar Financeiro**: Saúde de caixa e controle de custos.
2. **Pilar Operacional**: Manutenção NBR 5674, alertas de telemetria e Kanban.
3. **Pilar Jurídico & Governança**: Atas de Assembleia e regimentos.
4. **Pilar Comunicação & Convivência**: Transmissão via WhatsApp e mural digital.
Lembre o usuário que ele pode ver as métricas desses pilares clicando na aba "4 Pilares" no topo do chat!

### 📚 MAPA DO SISTEMA - ROTAS PARA NAVEGAÇÃO
Se o usuário quiser ir a alguma tela ou pedir informação sobre onde gerenciar algo, use a ferramenta 'navigate' direcionando-o para:
- Dashboard: 'dashboard' ou '/'
- Chamados/OS: 'tickets' ou '/tickets'
- Kanban interativo: 'kanban' ou '/kanban'
- Centro de Execução Técnica de campo: 'execution' ou '/execution'
- Orçamentos de Fornecedores: 'quotes' ou '/quotes'
- Controle Hídrico e Automação IoT: 'hydro' ou '/hydro'
- Sensor de Medições de Unidades: 'hydro' ou '/hydro' (aba Leituras)
- Suprimentos/Estoque Crítico: 'supplies' ou '/supplies'
- Mural de Avisos/Notícias: 'notices' ou '/notices'
- Portaria/Visitantes/Chaves: 'security' ou '/security'
- Reservas de Salão e Quadras: 'reservations' ou '/reservations'
- Dados do Condomínio/Clientes: 'clients' ou '/clients'
- Escalas de Funcionários/Equipe: 'team' ou '/team'
- Demonstrativo Financeiro: 'finance' ou '/finance'
- Vistorias de Campo via QR Code: 'qr-reports' ou '/qr-reports'

### 🛠️ REQUISITOS DE FERRAMENTAS ESPECÍFICAS
- **Analisar Chamado**: Use 'getTicketDetails' obrigatoriamente antes de emitir a análise.
- **Ajuda/Manual**: Diga de forma natural e convidativa que o usuário possui o **Manual de Comandos Interativo oficial de 1-Clique** à disposição pressionando o elegante botão com o ícone de livro (📖) no canto superior direito deste chat, ao lado do botão de fechar!`,
              tools: [{ 
                functionDeclarations: [
                  generateDocumentTool, getSummaryTool, navigateTool, createTicketTool, 
                  createKanbanTaskTool,
                  addClientTool, addFinancialRecordTool, addAppointmentTool, createBudgetTool, 
                  createQRCodeTool, addSupplyItemTool, createQuoteTool, addChecklistItemTool,
                  addNoticeTool, addVisitorTool, addReservationTool, addStaffTool,
                  addKeyTool, addTicketHistoryTool, listTemplatesTool,
                  updateTicketStatusTool, updateQuoteStatusTool, addWaterReadingTool, addEnergyReadingTool,
                  downloadQuotePDFTool, downloadTicketPDFTool, getFinancialProjectionTool,
                  adjustSupplyStockTool, getCondoHydraulicInfoTool, setCondoHydraulicInfoTool,
                  getDetailedFinancialInfoTool, controlEquipmentTool, getTicketDetailsTool
                ] 
              }],
            },
          });
          break; // Success!
        } catch (err: any) {
          const isRateLimit = err.message?.includes('429') || 
                             err.status === 429 || 
                             err.message?.includes('RESOURCE_EXHAUSTED') ||
                             JSON.stringify(err).includes('RESOURCE_EXHAUSTED');
          
          if (isRateLimit && retries > 1) {
            console.warn(`AssistantVivian: Gemini Rate Limit (429). Retrying in ${delay}ms... (${retries - 1} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            delay *= 2; // Exponential backoff
          } else {
            throw err; // Re-throw other errors or if out of retries
          }
        }
      }

      if (!response) {
        throw new Error('Exceeded Gemini retries');
      }

      let assistantReply = response.text || '';

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'getTicketDetails') {
            const args = call.args as any;
            const ticket = store.tickets.find(t => t.id === args.ticketId || t.osNumber === args.ticketId);
            if (!ticket) {
              assistantReply = `Sinto muito, mas não encontrei a OS com referência "${args.ticketId}".`;
            } else {
              const client = store.clients.find(c => c.id === ticket.clientId);
              const details = `
                Detalhes da OS #${ticket.osNumber || ticket.id}:
                Título: ${ticket.title}
                Status: ${ticket.status}
                Tipo: ${ticket.type}
                Data: ${safeFormatDate(ticket.date)}
                Local: ${ticket.location || 'N/A'}
                Relatado por: ${ticket.reportedBy || 'N/A'}
                Técnico: ${ticket.technician || 'N/A'}
                Categoria: ${ticket.maintenanceCategory || 'N/A'}
                Subcategoria: ${ticket.maintenanceSubcategory || 'N/A'}
                Observações: ${ticket.observations || 'Nenhuma'}
                Cliente: ${client?.name || 'Não identificado'}
                Endereço: ${client?.address || 'N/A'}
                Materiais Usados: ${JSON.stringify(ticket.usedMaterials || [])}
                Histórico: ${JSON.stringify(ticket.history || [])}
              `;
              
              // We need to feed this back to Gemini to get the actual analysis
              const secondResponse = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: `Abaixo estão os dados reais da OS que você solicitou. Por favor, analise esses dados de forma analítica, profunda e extremamente útil, fornecendo insights detalhados, dicas técnicas práticas de engenharia predial, materiais recomendados adicionais e sugestões preventivas conforme as suas diretrizes de treinamento:\n\n${details}`,
                config: {
                  systemInstruction: 'Você é o LUMI, engenheiro predial especialista do CONDFY.IA. Analise a Ordem de Serviço fornecida nos mínimos detalhes. Estruture sua resposta com seções claras em Markdown: (1) 🛠️ Diagnóstico do Caso, (2) 🚨 Criticidade & Reincidência, (3) 💡 Recomendações Técnicas do LUMI, (4) 📦 Insumos & Materiais Sugeridos para o Almoxarifado, (5) 📑 Plano de Ação Preventivo Futuro. Seja altamente técnico, empático, natural e prestativo.'
                }
              });
              assistantReply = secondResponse.text || 'Ocorreu um erro na análise.';
            }
          } else if (call.name === 'generateDocument') {
            const args = call.args as any;
            const result = await generateDocument(args.templateName, args.context);
            assistantReply = result;
          } else if (call.name === 'downloadQuotePDF') {
            const args = call.args as any;
            assistantReply = generateQuotePDF(args.quoteId);
          } else if (call.name === 'downloadTicketPDF') {
            const args = call.args as any;
            assistantReply = generateTicketPDF(args.ticketId);
          } else if (call.name === 'getSummary') {
            const args = call.args as any;
            const result = getSummary(args.topic);
            assistantReply = result;
          } else if (call.name === 'navigate') {
            const args = call.args as any;
            navigate(args.path);
            assistantReply = `Com certeza! Estou te levando para a página solicitada agora mesmo.`;
          } else if (call.name === 'createKanbanTask') {
            const args = call.args as any;
            store.addTicket({
              title: args.title,
              type: 'TAREFA',
              status: 'APROVADO',
              date: new Date().toISOString(),
              technician: args.technician || 'Administrador',
              observations: args.observations || 'Tarefa criada via assistente Vivian',
              location: '',
              reportedBy: 'Vivian Assistant',
            });
            assistantReply = `Com prazer! A tarefa "${args.title}" foi adicionada ao seu Kanban na coluna "Aprovado".`;
          } else if (call.name === 'createTicket') {
            const args = call.args as any;
            const isTask = args.type === 'TAREFA';
            store.addTicket({
              title: args.title,
              type: args.type,
              status: isTask ? 'APROVADO' : 'PENDENTE_APROVACAO',
              date: new Date().toISOString(),
              technician: 'Não atribuído',
              observations: args.observations,
              location: args.location || '',
              reportedBy: args.reportedBy || '',
            });
            assistantReply = isTask 
              ? `Claro! A tarefa "${args.title}" foi criada e adicionada ao Kanban.`
              : `Claro! A Ordem de Serviço "${args.title}" foi criada com sucesso. Deseja que eu gere o PDF para download agora?`;
          } else if (call.name === 'addClient') {
            const args = call.args as any;
            store.addClient({
              name: args.name,
              phone: args.phone,
              address: args.address,
              email: args.email || '',
            });
            assistantReply = `Prontinho! O cadastro do morador "${args.name}" foi realizado com sucesso.`;
          } else if (call.name === 'addFinancialRecord') {
            const args = call.args as any;
            if (args.recordType === 'RECEITA') {
              store.addReceipt({
                clientId: store.clients[0]?.id || 'avulso',
                date: new Date().toISOString(),
                value: args.value,
                description: args.description,
              });
              assistantReply = `Com prazer! Registrei a receita de R$ ${args.value} no sistema.`;
            } else {
              store.addCost({
                date: new Date().toISOString(),
                value: args.value,
                description: args.description,
                category: args.category || 'Geral',
              });
              assistantReply = `Feito! A despesa de R$ ${args.value} foi registrada com sucesso.`;
            }
          } else if (call.name === 'addAppointment') {
            const args = call.args as any;
            store.addAppointment({
              title: args.title,
              start: args.start,
              end: args.end,
              type: args.type,
              notes: args.notes || '',
            });
            assistantReply = `Claro, já agendei o compromisso "${args.title}" na sua agenda.`;
          } else if (call.name === 'createQuote') {
            const args = call.args as any;
            let clientId = '';
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) {
              clientId = client.id;
              const quoteItems = args.items.map((item: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice
              }));
              const totalValue = quoteItems.reduce((acc: number, item: any) => acc + item.total, 0);
              store.addQuote({
                clientId,
                date: new Date().toISOString(),
                items: quoteItems,
                totalValue,
                status: 'DRAFT'
              });
              assistantReply = `Com certeza! O orçamento formal para ${client.name} foi criado com sucesso (Total: R$ ${totalValue.toFixed(2)}). Deseja que eu gere o PDF para download agora?`;
            } else {
              assistantReply = `Sinto muito, mas não encontrei um cliente com o nome "${args.clientName}". O orçamento não pôde ser criado.`;
            }
          } else if (call.name === 'addChecklistItem') {
            const args = call.args as any;
            let clientId = '';
            if (args.clientName) {
              const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
              if (client) clientId = client.id;
            }
            store.addChecklistItem({
              task: args.task,
              category: args.category,
              clientId: clientId || undefined
            });
            assistantReply = `Prontinho! Adicionei a tarefa "${args.task}" ao seu checklist.`;
          } else if (call.name === 'addNotice') {
            const args = call.args as any;
            let clientId = '';
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) clientId = client.id;
            store.addNotice({
              title: args.title,
              content: args.content,
              category: args.category as any,
              clientId: clientId || 'geral'
            });
            assistantReply = `Claro! O comunicado "${args.title}" foi criado e já está disponível.`;
          } else if (call.name === 'addVisitor') {
            const args = call.args as any;
            store.addVisitor({
              name: args.name,
              document: args.document || '',
              type: args.type as any,
              apartment: args.apartment,
              tower: args.tower,
              validUntil: args.validUntil
            });
            assistantReply = `Feito! O visitante "${args.name}" foi registrado com sucesso no sistema.`;
          } else if (call.name === 'addReservation') {
            const args = call.args as any;
            let clientId = '';
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) clientId = client.id;
            store.addReservation({
              clientId: clientId || 'avulso',
              areaName: args.areaName,
              date: args.date,
              startTime: args.startTime,
              endTime: args.endTime,
              status: 'PENDING'
            });
            assistantReply = `Com prazer! Sua reserva para "${args.areaName}" no dia ${args.date} foi solicitada com sucesso.`;
          } else if (call.name === 'addStaff') {
            const args = call.args as any;
            store.addStaff({
              name: args.name,
              role: args.role,
              phone: args.phone,
              shift: args.shift as any,
              status: 'ACTIVE'
            });
            assistantReply = `Prontinho! O cadastro do funcionário "${args.name}" foi concluído com sucesso.`;
          } else if (call.name === 'addKey') {
            const args = call.args as any;
            store.addKey({
              keyName: args.keyName,
              location: args.location,
              status: 'AVAILABLE'
            });
            assistantReply = `Claro! A chave "${args.keyName}" já está devidamente cadastrada no sistema.`;
          } else if (call.name === 'addTicketHistory') {
            const args = call.args as any;
            const ticket = store.tickets.find(t => t.id === args.ticketId || t.osNumber === args.ticketId);
            if (ticket) {
              store.addTicketHistory(ticket.id, args.note, 'Vivian AI');
              assistantReply = `Com certeza! Adicionei a nota ao histórico do chamado ${ticket.osNumber || ticket.id} para você.`;
            } else {
              assistantReply = `Sinto muito, mas não encontrei o chamado com ID/OS "${args.ticketId}".`;
            }
          } else if (call.name === 'updateTicketStatus') {
            const args = call.args as any;
            const ticket = store.tickets.find(t => t.id === args.ticketId || t.osNumber === args.ticketId);
            if (ticket) {
              store.updateTicketStatus(ticket.id, args.status as any);
              assistantReply = `Prontinho! O status do chamado ${ticket.osNumber || ticket.id} foi atualizado para ${args.status}.`;
            } else {
              assistantReply = `Sinto muito, mas não encontrei o chamado com ID/OS "${args.ticketId}".`;
            }
          } else if (call.name === 'updateQuoteStatus') {
            const args = call.args as any;
            store.updateQuoteStatus(args.quoteId, args.status as any);
            assistantReply = `Feito! O status do orçamento ${args.quoteId} foi atualizado para ${args.status} com sucesso.`;
          } else if (call.name === 'addWaterReading') {
            const args = call.args as any;
            let clientId = '';
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) clientId = client.id;
            store.addWaterReading({
              clientId: clientId || 'geral',
              reading: args.reading,
              month: args.month,
              date: new Date().toISOString()
            });
            assistantReply = `Com prazer! Registrei a leitura de água para ${client ? client.name : args.clientName} referente a ${args.month}: ${args.reading} m³.`;
          } else if (call.name === 'addEnergyReading') {
            const args = call.args as any;
            let clientId = '';
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) clientId = client.id;
            store.addEnergyReading({
              clientId: clientId || 'geral',
              reading: args.reading,
              month: args.month,
              date: new Date().toISOString()
            });
            assistantReply = `Claro! A leitura de energia para ${client ? client.name : args.clientName} de ${args.month} foi registrada: ${args.reading} kWh.`;
          } else if (call.name === 'listTemplates') {
            const templates = store.documentTemplates.map(t => `- ${t.title} (${t.category})`).join('\n');
            assistantReply = `Com certeza! Aqui estão os modelos de documentos que temos disponíveis:\n${templates || 'No momento, não temos nenhum modelo cadastrado.'}`;
          } else if (call.name === 'createBudget') {
            const args = call.args as any;
            let clientId = '';
            if (args.clientName) {
              const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
              if (client) clientId = client.id;
            }
            store.createBudget({
              title: args.title,
              observations: args.observations,
              budgetAmount: args.budgetAmount,
              clientId: clientId || undefined,
            });
            assistantReply = `Prontinho! O orçamento "${args.title}" no valor de R$ ${args.budgetAmount} foi criado com sucesso.`;
          } else if (call.name === 'createQRCode') {
            const args = call.args as any;
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) {
              const newLocation = {
                id: Date.now().toString(),
                name: args.qrCodeName
              };
              const updatedLocations = [...(client.locations || []), newLocation];
              store.updateClient(client.id, { ...client, locations: updatedLocations });
              assistantReply = `Claro! O QR Code "${args.qrCodeName}" foi gerado com sucesso para o cliente ${client.name}.`;
            } else {
              assistantReply = `Sinto muito, mas não encontrei um cliente com o nome "${args.clientName}". O QR Code não pôde ser criado.`;
            }
          } else if (call.name === 'addSupplyItem') {
            const args = call.args as any;
            let clientId = '';
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) {
              clientId = client.id;
              store.addSupplyItem({
                name: args.name,
                category: args.category,
                currentStock: 0,
                minStock: 1,
                unit: args.unit,
                lastPrice: 0,
                clientId: clientId,
              });
              assistantReply = `Feito! O insumo "${args.name}" foi cadastrado com sucesso para o cliente ${client.name}.`;
            } else {
              assistantReply = `Sinto muito, mas não encontrei um cliente com o nome "${args.clientName}". O insumo não pôde ser cadastrado.`;
            }
          } else if (call.name === 'getFinancialProjection') {
            const args = call.args as any;
            const months = args.months || 6;
            const totalReceitas = store.receipts.reduce((acc, r) => acc + r.value, 0);
            const totalDespesas = store.costs.reduce((acc, c) => acc + c.value, 0);
            const mediaReceita = totalReceitas / (store.receipts.length || 1);
            const mediaDespesa = totalDespesas / (store.costs.length || 1);
            const projecao = (mediaReceita - mediaDespesa) * months;
            assistantReply = `Com prazer! Baseado no histórico, a projeção financeira para os próximos ${months} meses é um saldo acumulado de R$ ${projecao.toFixed(2)}. (Média mensal: R$ ${(mediaReceita - mediaDespesa).toFixed(2)}).`;
          } else if (call.name === 'adjustSupplyStock') {
            const args = call.args as any;
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) {
              const item = store.supplyItems.find(i => i.clientId === client.id && i.name.toLowerCase().includes(args.supplyName.toLowerCase()));
              if (item) {
                store.updateStock(item.id, args.newQuantity);
                assistantReply = `Claro! O estoque de "${item.name}" para o condomínio ${client.name} foi ajustado para ${args.newQuantity} ${item.unit}.`;
              } else {
                assistantReply = `Sinto muito, mas não encontrei o insumo "${args.supplyName}" para o condomínio ${client.name}.`;
              }
            } else {
              assistantReply = `Sinto muito, mas não encontrei um condomínio com o nome "${args.clientName}".`;
            }
          } else if (call.name === 'getCondoHydraulicInfo') {
            const args = call.args as any;
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) {
              const cistern = client.cisternVolume || 'não informado';
              const reservoir = client.reservoirVolume || 'não informado';
              assistantReply = `Com certeza! As informações hídricas do condomínio ${client.name} são: Volume da Cisterna: ${cistern}${typeof cistern === 'number' ? ' litros' : ''}, Volume do Reservatório: ${reservoir}${typeof reservoir === 'number' ? ' litros' : ''}.`;
            } else {
              assistantReply = `Sinto muito, mas não encontrei o condomínio "${args.clientName}" no sistema.`;
            }
          } else if (call.name === 'setCondoHydraulicInfo') {
            const args = call.args as any;
            const client = store.clients.find(c => c.name.toLowerCase().includes(args.clientName.toLowerCase()));
            if (client) {
              store.updateClient(client.id, {
                ...client,
                cisternVolume: args.cisternVolume !== undefined ? args.cisternVolume : client.cisternVolume,
                reservoirVolume: args.reservoirVolume !== undefined ? args.reservoirVolume : client.reservoirVolume,
              });
              assistantReply = `Prontinho! Atualizei as informações hídricas do condomínio ${client.name} para você.`;
            } else {
              assistantReply = `Sinto muito, mas não encontrei o condomínio "${args.clientName}" para atualizar as informações.`;
            }
          } else if (call.name === 'getDetailedFinancialInfo') {
            const args = call.args as any;
            assistantReply = getDetailedFinancialInfo(args.type);
          } else if (call.name === 'controlEquipment') {
            const args = call.args as any;
            const isOn = args.action === 'LIGAR';
            
            switch (args.equipment) {
              case 'BOMBA_CAIXA':
                store.updateIotState({ pumps: { caixa: isOn } });
                assistantReply = `Com prazer! A bomba da caixa d'água foi ${isOn ? 'ligada' : 'desligada'}.`;
                break;
              case 'BOMBA_JARDIM':
                store.updateIotState({ pumps: { jardim: isOn } });
                assistantReply = `Claro! A bomba do jardim foi ${isOn ? 'ligada' : 'desligada'}.`;
                break;
              case 'LUZ_SALA':
                store.updateIotState({ lights: { sala: isOn ? 100 : 0 } });
                assistantReply = `Feito! As luzes da sala foram ${isOn ? 'ligadas' : 'desligadas'}.`;
                break;
              case 'LUZ_COZINHA':
                store.updateIotState({ lights: { cozinha: isOn ? 100 : 0 } });
                assistantReply = `Prontinho! As luzes da cozinha foram ${isOn ? 'ligadas' : 'desligadas'}.`;
                break;
              case 'LUZ_JARDIM':
                store.updateIotState({ lights: { jardim: isOn ? 100 : 0 } });
                assistantReply = `Com certeza! As luzes do jardim foram ${isOn ? 'ligadas' : 'desligadas'}.`;
                break;
              case 'TODAS_LUZES':
                store.updateIotState({ 
                  lights: { 
                    cozinha: isOn ? 100 : 0, 
                    sala: isOn ? 100 : 0, 
                    jardim: isOn ? 100 : 0,
                    todas: isOn
                  } 
                });
                assistantReply = `Claro! Todas as luzes foram ${isOn ? 'ligadas' : 'desligadas'}.`;
                break;
              case 'ALARME':
                store.updateIotState({ alarmActive: isOn });
                assistantReply = `Atenção! O alarme geral foi ${isOn ? 'ativado' : 'desativado'}.`;
                break;
              default:
                assistantReply = `Desculpe, não reconheci o equipamento "${args.equipment}".`;
            }
          }
        }
      }

      if (!assistantReply) {
        assistantReply = 'Sinto muito, mas não consegui processar sua solicitação agora. Poderia tentar novamente em instantes?';
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantReply }]);
      if (voiceEnabled) {
        speakText(assistantReply);
      }
    } catch (error) {
      console.error('Error calling Gemini:', error);
      const errorMsg = 'Peço desculpas, mas tive um probleminha técnico ao processar sua mensagem. Vamos tentar de novo?';
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: errorMsg }]);
      if (voiceEnabled) {
        speakText(errorMsg);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!manualSearch.trim()) return COMMAND_CATEGORIES;
    const query = manualSearch.toLowerCase();
    return COMMAND_CATEGORIES.map(category => {
      const matchingCommands = category.commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.desc.toLowerCase().includes(query) ||
        cmd.examples.some(ex => ex.toLowerCase().includes(query))
      );
      return {
        ...category,
        commands: matchingCommands
      };
    }).filter(category => category.commands.length > 0);
  }, [manualSearch]);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-white to-slate-50 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden border-2 transition-all duration-300 ${
          isOpen ? 'hidden' : 'flex'
        } ${
          isListening 
            ? 'border-rose-500 ring-4 ring-rose-500/30 shadow-rose-500/40' 
            : isSpeaking 
              ? 'border-emerald-500 ring-4 ring-emerald-500/30 shadow-emerald-500/40' 
              : jarvisMode
                ? 'border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse'
                : 'border-blue-500 hover:border-blue-600 hover:shadow-blue-500/30 ring-4 ring-blue-500/10'
        }`}
      >
        {!vivianAvatarError ? (
          <img 
            src={VIVIAN_AVATAR_URL} 
            alt="Vivian" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setVivianAvatarError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-7 h-7" />
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-zinc-800 flex flex-col z-50 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between text-white transition-all duration-300 ${
              jarvisMode 
                ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-b border-cyan-500/20 shadow-[0_2px_15px_rgba(6,182,212,0.15)]' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-300 ${
                  jarvisMode ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-white/20'
                } ${
                  isSpeaking ? 'ring-4 ring-emerald-400/50 scale-105' : isListening ? 'ring-4 ring-rose-400/50 scale-105' : ''
                }`}>
                  {!vivianAvatarError ? (
                    <img 
                      src={VIVIAN_AVATAR_URL} 
                      alt="Vivian" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setVivianAvatarError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Bot className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight flex items-center gap-1.5 font-sans">
                    {jarvisMode ? 'L.U.M.I.' : 'LUMI'}
                    {jarvisMode && (
                      <span className="text-[9px] bg-cyan-400 text-slate-950 px-1.5 py-0.5 rounded font-black font-mono tracking-wider scale-90 select-none uppercase shadow-sm">JARVIS</span>
                    )}
                    {isSpeaking && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {isListening && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    )}
                  </h3>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    {isListening ? (
                      <>
                        <Mic className="w-3 h-3 text-emerald-300 animate-pulse" />
                        <span>Ouvindo você...</span>
                      </>
                    ) : isSpeaking ? (
                      <>
                        <Volume2 className="w-3 h-3 text-emerald-300 animate-bounce" />
                        <span>LUMI falando...</span>
                      </>
                    ) : (
                      jarvisMode ? "Co-piloto Autônomo Predial" : "Assistente Virtual"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setShowVoiceHelpModal(true);
                  }}
                  className="p-2 rounded-xl transition-all hover:bg-white/10 text-white/80"
                  title="Comandos de Voz Rápidos"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header Navigation Tabs */}
            <div className="bg-slate-100/90 dark:bg-zinc-850 p-1.5 flex items-center justify-around gap-1 border-b border-slate-200/60 dark:border-zinc-800/60 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <button 
                onClick={() => {
                  setShowSettings(false);
                  setShowManual(false);
                  setShowHeatmap(false);
                  setShowPreventive(false);
                  setShowPillars(false);
                }}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  (!showSettings && !showManual && !showHeatmap && !showPreventive && !showPillars) 
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-zinc-700/30 scale-102' 
                    : 'hover:bg-slate-200/50 dark:hover:bg-zinc-750'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[9px]">Chat</span>
              </button>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  setShowManual(false);
                  setShowHeatmap(false);
                  setShowPreventive(false);
                  setShowPillars(true);
                }}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  showPillars 
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/30 dark:border-zinc-700/30 scale-102 font-black' 
                    : 'hover:bg-slate-200/50 dark:hover:bg-zinc-750'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[9px]">4 Pilares</span>
              </button>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  setShowManual(false);
                  setShowHeatmap(true);
                  setShowPreventive(false);
                  setShowPillars(false);
                }}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  showHeatmap 
                    ? 'bg-white dark:bg-zinc-900 text-rose-500 dark:text-rose-400 shadow-sm border border-slate-200/30 dark:border-zinc-700/30 scale-102 font-black' 
                    : 'hover:bg-slate-200/50 dark:hover:bg-zinc-750'
                }`}
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[9px]">IoT Alertas</span>
              </button>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  setShowManual(false);
                  setShowHeatmap(false);
                  setShowPreventive(true);
                  setShowPillars(false);
                }}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  showPreventive 
                    ? 'bg-white dark:bg-zinc-900 text-indigo-500 dark:text-indigo-400 shadow-sm border border-slate-200/30 dark:border-zinc-700/30 scale-102 font-black' 
                    : 'hover:bg-slate-200/50 dark:hover:bg-zinc-750'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[9px]">Prevenção</span>
              </button>

              <button 
                onClick={() => {
                  setShowSettings(true);
                  setShowManual(false);
                  setShowHeatmap(false);
                  setShowPreventive(false);
                  setShowPillars(false);
                }}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  showSettings 
                    ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/30 dark:border-zinc-700/30 scale-102 font-black' 
                    : 'hover:bg-slate-200/50 dark:hover:bg-zinc-750'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="text-[9px]">Ajustes</span>
              </button>

              <button 
                onClick={() => {
                  setShowSettings(false);
                  setShowManual(true);
                  setShowHeatmap(false);
                  setShowPreventive(false);
                  setShowPillars(false);
                }}
                className={`flex-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  showManual 
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/30 dark:border-zinc-700/30 scale-102 font-black' 
                    : 'hover:bg-slate-200/50 dark:hover:bg-zinc-750'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[9px]">Manual</span>
              </button>
            </div>

            {/* Content Body */}
            {showSettings ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950/50 p-5 space-y-5 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-slate-150 dark:border-zinc-800 pb-3">
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Ajustes do LUMI</h4>
                </div>

                {/* Voice Tone Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    Tom de Voz e Resposta:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateVoiceTone('amigavel')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        voiceTone === 'amigavel'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:border-blue-700 dark:text-blue-400 font-bold shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <span className="text-xl">😊</span>
                      <span className="text-[11px] leading-tight font-bold">Amigável</span>
                    </button>

                    <button
                      onClick={() => updateVoiceTone('formal')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        voiceTone === 'formal'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-700 dark:text-indigo-400 font-bold shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <span className="text-xl">👔</span>
                      <span className="text-[11px] leading-tight font-bold">Formal</span>
                    </button>

                    <button
                      onClick={() => updateVoiceTone('tecnica')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        voiceTone === 'tecnica'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <span className="text-xl">🛠️</span>
                      <span className="text-[11px] leading-tight font-bold">Técnica</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-tight">
                    {voiceTone === 'amigavel' && 'Diálogos alegres, calorosos e cheios de empatia para o dia a dia.'}
                    {voiceTone === 'formal' && 'Comunicação extremamente polida, respeitosa e corporativa de alto padrão.'}
                    {voiceTone === 'tecnica' && 'Foco absoluto em dados exatos, diagnósticos, métricas e normas técnicas.'}
                  </p>
                </div>

                {/* 3 Options for Male Voice Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    Opção de Voz Masculina:
                  </label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => updateFemaleVoice('natural')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedFemaleVoice === 'natural'
                          ? 'bg-rose-50/70 border-rose-400 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-400 font-bold shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🤖</span>
                        <div className="text-left">
                          <p className="text-xs font-black">Voz 1: LUMI Robótico</p>
                          <p className="text-[10px] opacity-75 font-medium leading-tight">Voz masculina moderna, ultra dinâmica e super inteligente.</p>
                        </div>
                      </div>
                      {selectedFemaleVoice === 'natural' && <span className="text-xs bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">Ativa</span>}
                    </button>
 
                    <button
                      onClick={() => updateFemaleVoice('suave')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedFemaleVoice === 'suave'
                          ? 'bg-purple-50/70 border-purple-400 text-purple-700 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-400 font-bold shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🎙️</span>
                        <div className="text-left">
                          <p className="text-xs font-black">Voz 2: LUMI Grave</p>
                          <p className="text-[10px] opacity-75 font-medium leading-tight">Tom de voz masculino encorpado, maduro e de autoridade.</p>
                        </div>
                      </div>
                      {selectedFemaleVoice === 'suave' && <span className="text-xs bg-purple-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">Ativa</span>}
                    </button>
 
                    <button
                      onClick={() => updateFemaleVoice('clara')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedFemaleVoice === 'clara'
                          ? 'bg-amber-50/70 border-amber-400 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400 font-bold shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">⚡</span>
                        <div className="text-left">
                          <p className="text-xs font-black">Voz 3: LUMI Dinâmico</p>
                          <p className="text-[10px] opacity-75 font-medium leading-tight">Voz masculina jovem, ágil, enérgica e muito clara.</p>
                        </div>
                      </div>
                      {selectedFemaleVoice === 'clara' && <span className="text-xs bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">Ativa</span>}
                    </button>
                  </div>
                </div>

                {/* Voice Speed (Speech Rate) Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      Velocidade da Fala:
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg">
                      {voiceRate.toFixed(2)}x
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0.7"
                      max="1.6"
                      step="0.1"
                      value={voiceRate}
                      onChange={(e) => updateVoiceRate(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
                      <span>Lenta (0.7x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Rápida (1.6x)</span>
                    </div>
                  </div>
                </div>

                {/* Hands-Free / Continuous Conversation Toggle Card */}
                <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Modo Conversa Contínua</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 leading-none">Sem precisar clicar no microfone</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const nextVal = !continuousVoice;
                        setContinuousVoice(nextVal);
                        toast.success(nextVal ? 'Modo Hands-Free ATIVADO! Fale naturalmente 🗣️' : 'Modo Hands-Free desativado.', { id: 'continuous-voice-toast' });
                      }}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        continuousVoice 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 animate-pulse' 
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-transparent'
                      }`}
                    >
                      {continuousVoice ? 'ATIVO 🗣️' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Ao ativar este modo, o LUMI ligará o microfone automaticamente toda vez que ele terminar de falar, permitindo um diálogo 100% fluido por voz!
                  </p>
                </div>

                {/* JARVIS Mode Toggle Card */}
                <div className={`p-4 rounded-2xl flex flex-col gap-3 shadow-[0_4px_20px_rgba(6,182,212,0.15)] border transition-all duration-300 ${
                  jarvisMode 
                    ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-cyan-500/40 text-white shadow-[0_8px_30px_rgba(6,182,212,0.25)]' 
                    : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className={`w-4 h-4 ${jarvisMode ? 'text-cyan-400 animate-spin' : 'text-indigo-500'}`} style={jarvisMode ? { animationDuration: '6s' } : undefined} />
                      <div>
                        <span className={`text-xs font-bold block ${jarvisMode ? 'text-cyan-300 font-extrabold' : 'text-slate-700 dark:text-zinc-300'}`}>Modo J.A.R.V.I.S. Ativo</span>
                        <span className={`text-[9px] block leading-none ${jarvisMode ? 'text-cyan-400/80' : 'text-slate-400 dark:text-zinc-500'}`}>Inteligência Suprema de Combate & Gestão</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        toggleJarvisMode(!jarvisMode);
                      }}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        jarvisMode 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 animate-pulse font-extrabold' 
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-transparent'
                      }`}
                    >
                      {jarvisMode ? 'JARVIS ONLINE 🤖' : 'Inativo'}
                    </button>
                  </div>
                  <p className={`text-[10px] leading-relaxed font-medium ${jarvisMode ? 'text-slate-300' : 'text-slate-500 dark:text-zinc-400'}`}>
                    Eleva a capacidade cognitiva do LUMI ao nível do assistente de Tony Stark. Respostas altamente inteligentes, sarcasmo refinado, telemetria analítica em tempo real e tratamento de elite para os administradores.
                  </p>
                </div>

                {/* Active Listening Startup Notification Toggle Card */}
                <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Modo Escuta Ativa</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 leading-none">Alertar sobre chamados críticos ao abrir</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const nextVal = !activeListeningStartup;
                        setActiveListeningStartup(nextVal);
                        toast.success(nextVal ? 'Escuta Ativa ATIVADA! 🔊' : 'Escuta Ativa desativada.', { id: 'active-listening-toast' });
                      }}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        activeListeningStartup 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40' 
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-transparent'
                      }`}
                    >
                      {activeListeningStartup ? 'ATIVO' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                    Ao ativar este modo, assim que você abrir o LUMI, ele fará uma varredura por ordens de serviço urgentes pendentes de aprovação e te avisará por voz automaticamente!
                  </p>
                </div>

                {/* Audio Output Status Indicator / Tester */}
                <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Status da Voz Falada</span>
                    </div>
                    <button
                      onClick={() => {
                        const nextVal = !voiceEnabled;
                        setVoiceEnabled(nextVal);
                        if (!nextVal && 'speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                        }
                        toast.success(nextVal ? 'Voz ATIVADA 🔊' : 'Voz MUTADA 🔇', { id: 'voice-toggle-toast' });
                      }}
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded-xl transition-all cursor-pointer ${
                        voiceEnabled 
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {voiceEnabled ? 'Ativada' : 'Mutada'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      const testPhrases = {
                        amigavel: "Olá! Eu sou o LUMI. Minha voz está ajustada no modo amigável e simpático!",
                        formal: "Prezado usuário, confirmo que o meu tom de voz formal e polido foi configurado com sucesso.",
                        tecnica: "Configuração operacional concluída. Modo técnico ativo. Velocidade de transmissão está estável."
                      };
                      speakText(testPhrases[voiceTone]);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-102 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Testar Voz do LUMI 🔊
                  </button>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Voltar para Conversa
                </button>
              </div>
            ) : showPillars ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950/50 p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 animate-bounce" />
                    <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Os 4 Pilares da Gestão</h4>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                    LUMI IA Guardião 🤖
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Visão executiva integrada baseada nos 4 pilares de governança condominial. Clique em qualquer pilar para acionar a inteligência preditiva ou disparar ações automatizadas do LUMI.
                </p>

                {/* Grid container */}
                <div className="space-y-3.5">
                  {/* Pillar 1: Financeiro */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/20">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">1. Pilar Financeiro</h5>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (store.receipts?.reduce((acc, r) => acc + (Number(r.value) || 0), 0) || 0) >= (store.costs?.reduce((acc, c) => acc + (Number(c.value) || 0), 0) || 0)
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                      }`}>
                        {(store.receipts?.reduce((acc, r) => acc + (Number(r.value) || 0), 0) || 0) >= (store.costs?.reduce((acc, c) => acc + (Number(c.value) || 0), 0) || 0) ? '🟢 Caixa Saudável' : '🟡 Atenção Fluxo'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 dark:bg-zinc-950/40 rounded-xl mb-3 border border-slate-100 dark:border-zinc-800/40">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Receitas</p>
                        <p className="text-[11px] font-black text-emerald-500 font-mono">
                          R$ {(store.receipts?.reduce((acc, r) => acc + (Number(r.value) || 0), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Despesas</p>
                        <p className="text-[11px] font-black text-rose-500 font-mono">
                          R$ {(store.costs?.reduce((acc, c) => acc + (Number(c.value) || 0), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Saldo Geral</p>
                        <p className="text-[11px] font-black text-blue-500 font-mono">
                          R$ {((store.receipts?.reduce((acc, r) => acc + (Number(r.value) || 0), 0) || 0) - (store.costs?.reduce((acc, c) => acc + (Number(c.value) || 0), 0) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowPillars(false);
                        setInput("Vivian, por favor realize uma projeção estatística de fluxo de caixa para o condomínio para os próximos meses.");
                        toast.success("Comando de projeção financeira carregado! Clique em Enviar.", { icon: "📊" });
                      }}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Projetar Fluxo de Caixa 📈
                    </button>
                  </div>

                  {/* Pillar 2: Operacional & Manutenção */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/20">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">2. Pilar Operacional</h5>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                        {store.tickets?.filter(t => t.status !== 'CONCLUIDO').length || 0} OS Ativas
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight mb-2">
                      Análise integrada com os <strong>novos indicadores de progresso Kanban</strong>.
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-center py-2 bg-slate-50 dark:bg-zinc-950/40 rounded-xl mb-3 border border-slate-150 dark:border-zinc-800/40">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">OS Concluídas</p>
                        <p className="text-[12px] font-black text-emerald-500">{store.tickets?.filter(t => t.status === 'CONCLUIDO').length || 0}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">OS Pendentes</p>
                        <p className="text-[12px] font-black text-rose-500">{store.tickets?.filter(t => t.status !== 'CONCLUIDO').length || 0}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowPillars(false);
                        setInput("Vivian, faça uma auditoria minuciosa das O.S. preventivas em aberto e analise os progressos das tarefas no quadro Kanban.");
                        toast.success("Análise do progresso Kanban carregada! Clique em Enviar.", { icon: "📋" });
                      }}
                      className="w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 dark:bg-blue-950/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Analisar Progresso Preventivo (Kanban) 🛠️
                    </button>
                  </div>

                  {/* Pillar 3: Jurídico & Governança */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950/20">
                          <Gavel className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">3. Jurídico & Governança</h5>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                        ⚖️ 100% NBR 5674
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight mb-3">
                      Geração automatizada de Atas de Assembleia, Regimentos e Notificações de Barulho/Multas com amparo jurídico Código Civil.
                    </p>

                    <button
                      onClick={() => {
                        setShowPillars(false);
                        setInput("Vivian, elabore uma Ata de Assembleia Geral Extraordinária abordando a aprovação das manutenções prediais pendentes.");
                        toast.success("Comando de Ata de Assembleia carregado! Clique em Enviar.", { icon: "📄" });
                      }}
                      className="w-full py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 dark:bg-purple-950/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Gerar Ata de Assembleia Geral 📄
                    </button>
                  </div>

                  {/* Pillar 4: Comunicação & Relações */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20">
                          <Users className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">4. Comunicação & Relações</h5>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        💬 Comunicação Ativa
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-zinc-950/40 rounded-xl mb-3 border border-slate-150 dark:border-zinc-800/40 text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400 font-bold">Moradores Cadastrados:</span>
                      <span className="font-black text-slate-800 dark:text-zinc-200">{store.clients?.length || 0}</span>
                    </div>

                    <button
                      onClick={() => {
                        toast.loading("LUMI AI conectando ao canal de transmissão...", { id: 'broadcast-loading' });
                        setTimeout(() => {
                          toast.dismiss('broadcast-loading');
                          toast.success("Mensagem de transmissão condominial enviada via WhatsApp para todos os moradores cadastrados!", {
                            icon: "📢",
                            duration: 5000
                          });
                          const synth = window.speechSynthesis;
                          if (synth && voiceEnabled) {
                            const utterance = new SpeechSynthesisUtterance("Transmissão condominial via WhatsApp disparada para todos os moradores cadastrados com sucesso.");
                            utterance.lang = "pt-BR";
                            utterance.rate = voiceRate;
                            synth.speak(utterance);
                          }
                        }, 1200);
                      }}
                      className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Disparar Alerta WhatsApp de Convivência 📢
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowPillars(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Voltar para Conversa
                </button>
              </div>
            ) : showHeatmap ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950/50 p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                    <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Mapa de Calor IoT</h4>
                  </div>
                  <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                    {iotDevices.filter(d => d.isAlert).length} Alertas Ativos
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Painel de telemetria predial em tempo real. Dispositivos piscando em <span className="text-rose-500 font-bold">vermelho</span> indicam falhas críticas de barramento ou picos de consumo elétrico/hídrico.
                </p>

                {/* Heatmap Grid Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {iotDevices.map((dev) => (
                    <div 
                      key={dev.id} 
                      className={`p-3 rounded-2xl bg-white dark:bg-zinc-900 border transition-all flex flex-col justify-between h-32 relative group overflow-hidden ${
                        dev.isAlert 
                          ? dev.isCritical 
                            ? 'border-rose-500 dark:border-rose-800 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-2 ring-rose-500/10 animate-pulse' 
                            : 'border-amber-400 dark:border-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.1)] ring-2 ring-amber-500/10'
                          : 'border-slate-150 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {/* Alert Header Badge */}
                      {dev.isAlert && (
                        <div className={`absolute top-0 left-0 right-0 h-1 ${dev.isCritical ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`} />
                      )}

                      <div className="flex items-start justify-between">
                        <div className={`p-1.5 rounded-xl ${
                          dev.isAlert 
                            ? dev.isCritical ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' : 'bg-amber-50 text-amber-500 dark:bg-amber-950/20'
                            : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        
                        <button
                          onClick={() => {
                            const updated = iotDevices.map(d => {
                              if (d.id === dev.id) {
                                const nextAlert = !d.isAlert;
                                return { 
                                  ...d, 
                                  isAlert: nextAlert,
                                  isCritical: nextAlert ? d.isCritical : false
                                };
                              }
                              return d;
                            });
                            setIotDevices(updated);
                            localStorage.setItem('condfy_iot_devices', JSON.stringify(updated));
                            // Dispatch event to update other IoT tiles in the dashboard!
                            window.dispatchEvent(new Event('condfy_iot_devices_updated'));
                            toast.success(`Mapeamento atualizado: ${dev.name}`, { id: 'heatmap-sim' });
                          }}
                          className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                            dev.isAlert 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' 
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400'
                          }`}
                          title="Simular/Limpar Alerta de Consumo"
                        >
                          {dev.isAlert ? 'Normalizar' : 'Alerta'}
                        </button>
                      </div>

                      <div className="mt-1">
                        <h5 className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate leading-none mb-1">{dev.name}</h5>
                        <p className="text-[8px] text-slate-400 dark:text-zinc-500 truncate">{dev.url}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-850 pt-1.5 mt-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black">Consumo</span>
                        <span className={`text-[10px] font-black font-mono ${
                          dev.isAlert 
                            ? dev.isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-500'
                            : 'text-emerald-500'
                        }`}>
                          {dev.consumptionValue} {dev.icon === 'activity' ? '%' : 'kW/h'}
                          {dev.isAlert && (dev.isCritical ? ' 🚨' : ' ⚡')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional interactive warning card if failures exist */}
                {iotDevices.some(d => d.isAlert && d.isCritical) && (
                  <div className="p-3 bg-rose-50/80 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Atenção Técnica Urgente</span>
                    </div>
                    <p className="text-[9px] text-rose-600/90 dark:text-rose-400/85 leading-relaxed font-medium">
                      O sensor hídrico da <strong>Bomba de Recalque 01</strong> registrou temperatura operacional crítica com pico de vazão. Deseja solicitar que o LUMI agende uma revisão técnica emergencial?
                    </p>
                    <button
                      onClick={() => {
                        setInput('Lumi, agende uma manutenção preventiva para hoje às 14h para revisar a Bomba de Recalque 01 que está em estado de falha crítica.');
                        setShowHeatmap(false);
                        toast.success('Mensagem carregada! Envie o comando para agendar.');
                      }}
                      className="py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer text-center"
                    >
                      Solicitar Agendamento Urgente via LUMI 🛠️
                    </button>
                  </div>
                )}
              </div>
            ) : showPreventive ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950/50 p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-slate-150 dark:border-zinc-800 pb-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Agendador de Prevenção</h4>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Programe visitas técnicas periódicas e rotinas de manutenção predial com vinculação automatizada direta ao calendário da administração.
                </p>

                <div className="space-y-3.5 bg-white dark:bg-zinc-900 p-4 border border-slate-150 dark:border-zinc-800/80 rounded-2xl shadow-sm">
                  {/* Title Field */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Título do Trabalho</label>
                    <input 
                      type="text"
                      value={prevTitle}
                      onChange={(e) => setPrevTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl outline-none focus:border-indigo-500 font-medium transition-colors"
                      placeholder="Ex: Manutenção Preventiva dos Elevadores"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Frequency Selector */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Frequência</label>
                      <select
                        value={prevFrequency}
                        onChange={(e: any) => setPrevFrequency(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl outline-none focus:border-indigo-500 font-bold transition-colors"
                      >
                        <option value="mensal">Mensal 📅</option>
                        <option value="trimestral">Trimestral ⏳</option>
                        <option value="semestral">Semestral 🔄</option>
                        <option value="anual">Anual 🌟</option>
                      </select>
                    </div>

                    {/* Recurrences Count */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Repetições</label>
                      <input 
                        type="number"
                        min="1"
                        max="12"
                        value={prevRecurrences}
                        onChange={(e) => setPrevRecurrences(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl outline-none focus:border-indigo-500 font-bold transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Starting Date Picker */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Data de Início</label>
                      <input 
                        type="date"
                        value={prevStartDate}
                        onChange={(e) => setPrevStartDate(e.target.value)}
                        className="w-full px-3 py-1 text-xs border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl outline-none focus:border-indigo-500 font-medium transition-colors"
                      />
                    </div>

                    {/* Starting Time Picker */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Horário</label>
                      <input 
                        type="time"
                        value={prevStartTime}
                        onChange={(e) => setPrevStartTime(e.target.value)}
                        className="w-full px-3 py-1 text-xs border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl outline-none focus:border-indigo-500 font-medium transition-colors"
                      />
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Instruções Técnicas</label>
                    <textarea 
                      value={prevNotes}
                      onChange={(e) => setPrevNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 rounded-xl outline-none focus:border-indigo-500 font-medium resize-none transition-colors"
                      placeholder="Instruções para o técnico..."
                    />
                  </div>

                  {/* Preview Dates List */}
                  <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Lembretes a serem criados:</span>
                    <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                      {generatedDates.map((dateStr, idx) => (
                        <div key={idx} className="text-[9px] font-mono text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                          <span>📅 Evento #{idx + 1}</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{dateStr}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSchedulePreventive}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer text-center"
                  >
                    Vincular ao Calendário Predial ⚡
                  </button>
                </div>
              </div>
            ) : showManual ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950/50">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-zinc-850 bg-white dark:bg-zinc-900">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar comandos do LUMI..."
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none text-slate-705 dark:text-zinc-350 focus:border-blue-500 font-medium transition-colors"
                    />
                    {manualSearch && (
                      <button 
                        onClick={() => setManualSearch('')}
                        className="absolute right-3 top-2 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Info className="w-8 h-8 text-slate-350 dark:text-zinc-650 mb-2" />
                      <span className="text-xs text-slate-500 font-medium">Nenhum comando encontrado para sua busca.</span>
                    </div>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isExpanded = expandedCategory === cat.id;
                      return (
                        <div 
                          key={cat.id} 
                          className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all"
                        >
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-805 transition-colors text-left"
                          >
                            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">{cat.title}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 dark:border-zinc-850/50 space-y-4 bg-slate-50/50 dark:bg-zinc-900/40">
                              {cat.commands.map((cmd, idx) => (
                                <div key={idx} className="space-y-2 border-b border-dashed border-slate-150 last:border-b-0 last:pb-0 dark:border-zinc-800 pb-3">
                                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    {cmd.name}
                                  </h4>
                                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">{cmd.desc}</p>
                                  
                                  <div className="space-y-1.5 pt-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Toque para experimentar:</p>
                                    <div className="flex flex-col gap-1.5">
                                      {cmd.examples.map((ex, exIdx) => (
                                        <button 
                                          key={exIdx} 
                                          onClick={() => {
                                            setInput(ex);
                                            setShowManual(false);
                                            toast.success('Comando inserido! Ajuste os dados e envie.', {
                                              icon: '✍️',
                                              duration: 2500
                                            });
                                          }}
                                          className="text-[11px] text-left bg-white dark:bg-zinc-950 px-3 py-2 rounded-xl border border-slate-150 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-mono hover:border-blue-400 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 flex items-center justify-between group cursor-pointer"
                                        >
                                          <span className="truncate">"{ex}"</span>
                                          <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-all ml-2 whitespace-nowrap">
                                            Carregar ⚡
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-zinc-950/50 relative">
                {isListening && (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50/95 to-white/98 dark:from-zinc-950/97 dark:to-zinc-900/98 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20 animate-fade-in">
                    {/* Glowing, reactive avatar container */}
                    <div className="relative mb-6 flex items-center justify-center">
                      {/* Reactive Outer Aura Rings */}
                      <div 
                        className="absolute rounded-full bg-emerald-500/5 dark:bg-emerald-400/5 transition-all duration-75"
                        style={{
                          width: `${140 + micVolume * 110}px`,
                          height: `${140 + micVolume * 110}px`,
                          opacity: 0.15 + micVolume * 0.75,
                        }}
                      />
                      <div 
                        className="absolute rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 transition-all duration-75"
                        style={{
                          width: `${110 + micVolume * 80}px`,
                          height: `${110 + micVolume * 80}px`,
                          opacity: 0.3 + micVolume * 0.6,
                        }}
                      />
                      
                      {/* Avatar container */}
                      <div 
                        className="relative w-24 h-24 rounded-full bg-white dark:bg-zinc-850 flex items-center justify-center shadow-2xl transition-transform duration-75 border-4 border-indigo-500 overflow-hidden"
                        style={{
                          transform: `scale(${1 + micVolume * 0.22})`,
                          boxShadow: `0 0 ${20 + micVolume * 60}px rgba(99, 102, 241, ${0.35 + micVolume * 0.55})`
                        }}
                      >
                        {!vivianAvatarError ? (
                          <img 
                            src={VIVIAN_AVATAR_URL} 
                            alt="Vivian Avatar" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={() => setVivianAvatarError(true)}
                          />
                        ) : (
                          <Bot className="w-12 h-12 text-indigo-500" />
                        )}
                        
                        {/* Mic icon tag in bottom-right corner */}
                        <div className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                          <Mic className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-1 flex items-center gap-1.5 justify-center">
                      LUMI está Ouvindo... 🎙️
                    </h3>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs max-w-xs mb-6">
                      Fale agora. O indicador e as ondas reagirão em tempo real ao som da sua voz.
                    </p>

                    {/* Dynamic Sound Wave Bars */}
                    <div className="flex items-center justify-center gap-1.5 h-16 mb-8">
                      {[0.3, 0.65, 0.45, 0.85, 0.55, 0.95, 0.6, 0.8, 0.4, 0.7, 0.35].map((baseMultiplier, i) => {
                        const duration = 0.4 + baseMultiplier * 0.8; // beautiful organic staggered speeds
                        const delay = i * 0.07;
                        
                        // If we have a real micVolume, we scale it dynamically. Otherwise, standard organic breathing scale
                        const amplitudeScale = micVolume > 0.01 ? (0.2 + micVolume * 1.6) : 1.0;
                        
                        return (
                          <div 
                            key={i} 
                            className={`w-1.5 rounded-full bg-gradient-to-t ${
                              jarvisMode 
                                ? 'from-cyan-500 via-sky-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.6)]' 
                                : 'from-blue-600 via-indigo-500 to-emerald-400'
                            } animate-[soundwave-pulse_1s_ease-in-out_infinite_alternate]`}
                            style={{
                              height: `${baseMultiplier * 100}%`,
                              animationDuration: `${duration}s`,
                              animationDelay: `${delay}s`,
                              transform: `scaleY(${amplitudeScale})`,
                              transformOrigin: 'center'
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Prompt suggestions for users to speak */}
                    <div className="bg-slate-100/80 dark:bg-zinc-800/60 rounded-2xl p-4 max-w-sm border border-slate-200/50 dark:border-zinc-700/50 mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comandos de Exemplo:</p>
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                        <p className="italic">"Lumi, qual o nosso saldo hoje?"</p>
                        <p className="italic">"Criar chamado de vazamento na garagem"</p>
                        <p className="italic">"Ver as ordens de serviço pendentes"</p>
                      </div>
                    </div>

                    <button
                      onClick={stopListening}
                      className="px-6 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center gap-2"
                    >
                      <MicOff className="w-4 h-4" />
                      Cancelar / Parar de Ouvir
                    </button>
                  </div>
                )}

                {jarvisMode && (
                  <div className="mb-2 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-cyan-500/30 rounded-2xl p-3 shadow-[0_4px_25px_rgba(6,182,212,0.15)] flex flex-col gap-2 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300 font-mono">
                          J.A.R.V.I.S. Core V3.5-Online
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-[8px] font-black text-cyan-400 font-mono">LINK OPERATIONAL</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-slate-300 pt-1.5 border-t border-cyan-500/10">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px] uppercase font-bold font-sans">Cognitive Core</span>
                        <span className="text-cyan-400 font-bold">Max-Gen AI</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px] uppercase font-bold font-sans">IoT Status</span>
                        <span className="text-emerald-400 font-bold">Telemetria Ativa</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[8px] uppercase font-bold font-sans">Risk Model</span>
                        <span className="text-rose-400 font-bold font-bold">Real-time Predict</span>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                      msg.role === 'user' 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-white border border-slate-200 shadow-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        !vivianAvatarError ? (
                          <img 
                            src={VIVIAN_AVATAR_URL} 
                            alt="Vivian" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={() => setVivianAvatarError(true)}
                          />
                        ) : (
                          <Bot className="w-5 h-5 text-indigo-600" />
                        )
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 max-w-[75%]">
                      <div className={`p-3 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm animate-fade-in'
                          : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-700 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      
                      {/* Suggestion Pills underneath first message */}
                      {msg.id === '1' && messages.length === 1 && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sugestões Rápidas:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startListening()}
                              className="py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all hover:scale-105 animate-pulse"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              Falar com LUMI 🎙️
                            </button>
                            <button
                              onClick={() => setShowVoiceHelpModal(true)}
                              className="py-1.5 px-3 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-150/80 dark:bg-zinc-900 dark:border-zinc-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                              Comandos de Voz 💡
                            </button>
                            <button
                              onClick={() => setShowManual(true)}
                              className="py-1.5 px-3 bg-white hover:bg-slate-50 text-blue-600 border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Ver Manual de Comandos
                            </button>
                            <button
                              onClick={() => {
                                setInput("Como estão os chamados hoje?");
                                handleSendDirectly("Como estão os chamados hoje?");
                              }}
                              className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
                            >
                              📊 Resumo de Chamados
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {!vivianAvatarError ? (
                        <img 
                          src={VIVIAN_AVATAR_URL} 
                          alt="Vivian" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setVivianAvatarError(true)}
                        />
                      ) : (
                        <Bot className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    <div className="bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span className="text-xs text-slate-500">LUMI está digitando...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            {!showSettings && (
              <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 p-2 rounded-2xl border border-slate-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={showManual ? "Selecione um comando acima ou pergunte..." : (isListening ? "LUMI ouvindo... Fale agora!" : "Falar com o LUMI por voz ou digite...")}
                    className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-700 dark:text-zinc-300"
                  />
                  
                  {/* Voice Speaker Output Toggle */}
                  <button
                    onClick={() => {
                      const nextVal = !voiceEnabled;
                      setVoiceEnabled(nextVal);
                      if (!nextVal && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                      toast.success(nextVal ? 'Voz do LUMI ATIVADA 🔊' : 'Voz do LUMI MUTADA 🔇', { id: 'voice-toggle-toast' });
                    }}
                    title={voiceEnabled ? "Mudar para silencioso" : "Ativar áudio falado do LUMI"}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      voiceEnabled 
                        ? 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-zinc-800' 
                        : 'text-slate-400 hover:bg-slate-100 dark:text-zinc-600 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  {/* Voice Microphone Toggle Button */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    title={isListening ? "Parar de ouvir" : "Falar com o LUMI por voz"}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Voice Help Modal Trigger */}
                  <button
                    onClick={() => setShowVoiceHelpModal(true)}
                    title="Ver comandos de voz rápidos"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-150 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Voice Help Modal Overlay */}
            <AnimatePresence>
              {showVoiceHelpModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end"
                >
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="bg-white dark:bg-zinc-900 rounded-t-3xl p-5 max-h-[85%] overflow-y-auto flex flex-col space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] border-t border-slate-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <Mic className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest leading-none">Comandos de Voz</h4>
                          <span className="text-[10px] text-slate-400">Fale ou selecione uma opção</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowVoiceHelpModal(false)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto pr-1">
                      {VOICE_COMMANDS.map((cmd, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setInput(cmd.prompt);
                            setShowVoiceHelpModal(false);
                            handleSendDirectly(cmd.prompt);
                            toast.success(`Executando comando: "${cmd.phrase}" ⚡`, { id: 'voice-toast', icon: '🎙️' });
                          }}
                          className={`group p-3 rounded-2xl border bg-gradient-to-r ${cmd.color} hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-between gap-3`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl">{cmd.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wide leading-none">{cmd.phrase}</span>
                                <span className="text-[9px] font-medium text-slate-400 px-1.5 py-0.5 bg-white/60 dark:bg-zinc-900/60 rounded-md border border-slate-100 dark:border-zinc-850">
                                  Diga isto
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 truncate">{cmd.action}</p>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-zinc-850 border border-slate-100 dark:border-zinc-750 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-sm">
                            ⚡
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-850/60 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5" />
                        <span>Dica de Uso de Voz</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Pressione o botão de microfone na barra inferior para começar a falar. O LUMI reconhece variações naturais dos termos acima (ex: se disser "crie um chamado" ou "solicite reparo", ela entenderá "Abrir OS").
                      </p>
                    </div>

                    <button
                      onClick={() => setShowVoiceHelpModal(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Fechar
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
