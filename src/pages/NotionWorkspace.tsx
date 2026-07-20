import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Sparkles, Plus, Trash2, ArrowLeft, Search, 
  ChevronRight, CheckSquare, List, Code, Quote, 
  Smile, Image as ImageIcon, Heading1, Heading2, Heading3, 
  Copy, Printer, Table, Layers, GripVertical, Check, 
  Loader2, Sparkle, AlertCircle, HelpCircle, Flame, Wrench,
  BookOpen, Compass, Terminal, FileCode, CheckCircle2, ChevronDown, 
  Info, CornerRightDown, RefreshCw, Layers3, Settings, ClipboardList,
  Paperclip, File, UploadCloud, Download, Eye, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { Modal } from '../components/Modal';

// Define Notion Block Type
export interface NotionBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'todo' | 'bullet' | 'code' | 'callout' | 'table' | 'quote' | 'file' | 'textbox';
  content: string;
  properties?: {
    checked?: boolean;
    language?: string;
    icon?: string;
    headers?: string[];
    rows?: string[][];
    colorTheme?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'blueprint';
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    fileUrl?: string;
    width?: number;
    height?: number;
  };
}

// Define Notion Page Type
export interface NotionPage {
  id: string;
  title: string;
  emoji: string;
  coverUrl?: string;
  blocks: NotionBlock[];
  updatedAt: string;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1500', // Modern abstract black/indigo
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=1500', // Neon 3D abstract
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1500', // Aurora gradient
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1500', // Tech Cyberpunk Desk
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1500', // Clean architectural lines
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1500', // Deep Space network
];

const PRESET_EMOJIS = [
  '📝', '🏠', '🔧', '📊', '💡', '⚠️', '📋', '🏢', '⚙️', '📅', 
  '🚀', '🔒', '📞', '🤝', '⚡', '🧠', '🛡️', '🛠️', '📡', '🔍'
];

const BLOCK_THEMES = [
  { id: 'default', name: 'Padrão', border: 'border-white/10', bg: 'bg-transparent', text: 'text-white/80' },
  { id: 'indigo', name: 'Indigo Cyber', border: 'border-indigo-500/30', bg: 'bg-indigo-500/5', text: 'text-indigo-200' },
  { id: 'emerald', name: 'Sucesso Verde', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-200' },
  { id: 'amber', name: 'Aviso Alerta', border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-200' },
  { id: 'rose', name: 'Perigo / Crítico', border: 'border-rose-500/30', bg: 'bg-rose-500/5', text: 'text-rose-200' },
  { id: 'cyan', name: 'Informação', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', text: 'text-cyan-200' },
  { id: 'blueprint', name: 'Blueprint Técnico', border: 'border-blue-600/40', bg: 'bg-blue-950/20', text: 'text-blue-200 font-mono text-xs' }
];

const INITIAL_PAGES_SEED: NotionPage[] = [
  {
    id: '1',
    title: 'Planejamento de Manutenção',
    emoji: '🔧',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1500',
    updatedAt: new Date().toISOString(),
    blocks: [
      { id: 'b1', type: 'h1', content: 'Planejamento Semanal de Manutenção' },
      { id: 'b2', type: 'callout', content: 'Espaço reservado para organizar as rotinas operacionais preventivas de manutenção hidráulica, elétrica e de automação de controle predial.', properties: { icon: '💡', colorTheme: 'indigo' } },
      { id: 'b3', type: 'h2', content: 'Atividades Prioritárias de Engenharia' },
      { id: 'b4', type: 'todo', content: 'Vistoriar conjunto motobomba do Bloco A (Garantir chave de transferência operacional)', properties: { checked: true, colorTheme: 'emerald' } },
      { id: 'b5', type: 'todo', content: 'Efetuar ensaio de isolamento nos condutores principais do barramento geral', properties: { checked: false, colorTheme: 'amber' } },
      { id: 'b6', type: 'todo', content: 'Substituir projetores halógenos da fachada por refletores LED de alta potência (Eficiência de 120lm/W)', properties: { checked: false } },
      { id: 'b7', type: 'h2', content: 'Diretrizes Técnicas e Segurança (NR-10)' },
      { id: 'b8', type: 'bullet', content: 'Realizar bloqueio e etiquetagem (LOTO) de todos os dispositivos de manobra antes do manuseio.' },
      { id: 'b9', type: 'bullet', content: 'Verificar ausência de tensão com instrumento aferido e homologado.' },
      { id: 'b10', type: 'quote', content: 'Nenhum trabalho técnico deve ser iniciado sem o preenchimento prévio da Análise Preliminar de Risco (APR). Segurança em primeiro lugar.', properties: { colorTheme: 'rose' } },
      { id: 'b11', type: 'h2', content: 'Escala de Engenheiros & Técnicos Plantonistas' },
      { id: 'b12', type: 'table', content: '', properties: {
        headers: ['Equipe Técnica', 'Especialidade / Turno', 'Status de Escala'],
        rows: [
          ['Carlos Souza', 'Supervisor Elétrico / Manhã', '🟢 EM OPERAÇÃO'],
          ['Antônio Rocha', 'Técnico Hidráulico / Tarde', '🟢 EM OPERAÇÃO'],
          ['Eng. Marcos Silva', 'Engenheiro Residente / Plantão', '🔵 SOBREAVISO']
        ]
      }}
    ]
  },
  {
    id: '2',
    title: 'Ata de Alinhamento com Conselheiros',
    emoji: '📊',
    coverUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=1500',
    updatedAt: new Date().toISOString(),
    blocks: [
      { id: 'b21', type: 'h1', content: 'Ata de Reunião Extraordinária - Impermeabilização' },
      { id: 'b22', type: 'callout', content: 'Registro de diretrizes do conselho fiscal e corpo de engenharia civil para aprovação orçamentária do projeto de retrofit predial.', properties: { icon: '📋', colorTheme: 'cyan' } },
      { id: 'b23', type: 'h2', content: 'Principais Deliberações' },
      { id: 'b24', type: 'bullet', content: 'Aprovação do projeto de impermeabilização de manta asfáltica dupla na laje técnica superior.' },
      { id: 'b25', type: 'bullet', content: 'Sinalização e desvio de rotas de pedestres no pátio interno durante a movimentação de cargas.' },
      { id: 'b26', type: 'h2', content: 'Resolução Legal de Aprovação' },
      { id: 'b27', type: 'quote', content: 'Fica autorizada a contratação da Prestadora Alfa com faturamento direto via fundo de obras extraordinário aprovado em assembleia.', properties: { colorTheme: 'amber' } },
      { id: 'b28', type: 'code', content: 'SELECT id, client_id, total_value, date FROM contract_works WHERE category = "REFORMA" AND approved = true;', properties: { language: 'sql' } }
    ]
  }
];

export default function NotionWorkspace() {
  const navigate = useNavigate();
  const { companyLogo } = useStore();

  const [pages, setPages] = useState<NotionPage[]>(() => {
    const saved = localStorage.getItem('condfy_notion_pages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PAGES_SEED;
      }
    }
    return INITIAL_PAGES_SEED;
  });

  const [selectedPageId, setSelectedPageId] = useState<string>(() => {
    const savedId = localStorage.getItem('condfy_notion_active_page_id');
    if (savedId && pages.some(p => p.id === savedId)) {
      return savedId;
    }
    return pages[0]?.id || '1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  // AI interactive block state
  const [aiLoadingBlockId, setAiLoadingBlockId] = useState<string | null>(null);
  const [aiActiveBlockId, setAiActiveBlockId] = useState<string | null>(null);

  // Active page context
  const activePage = pages.find(p => p.id === selectedPageId) || pages[0];

  // Slash commands popup control
  const [slashMenu, setSlashMenu] = useState<{
    visible: boolean;
    blockId: string;
    filterText: string;
    position: { top: number; left: number };
  }>({
    visible: false,
    blockId: '',
    filterText: '',
    position: { top: 0, left: 0 }
  });

  // Track focused block to show drag / action bars
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Save changes to localstorage
  useEffect(() => {
    localStorage.setItem('condfy_notion_pages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    if (selectedPageId) {
      localStorage.setItem('condfy_notion_active_page_id', selectedPageId);
    }
  }, [selectedPageId]);

  const handleCreatePage = () => {
    const newPage: NotionPage = {
      id: Date.now().toString(),
      title: 'Sem Título',
      emoji: '📝',
      coverUrl: PRESET_COVERS[Math.floor(Math.random() * PRESET_COVERS.length)],
      updatedAt: new Date().toISOString(),
      blocks: [
        { id: Date.now().toString() + '-1', type: 'h1', content: 'Nova Página de Engenharia' },
        { id: Date.now().toString() + '-2', type: 'paragraph', content: 'Comece a digitar aqui. Pressione "/" para inserir elementos estruturados como tabelas, alertas de perigo ou blocos de código.' }
      ]
    };
    setPages(prev => [...prev, newPage]);
    setSelectedPageId(newPage.id);
    toast.success('Nova página inteligente criada!');
  };

  const handleDeletePage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) {
      toast.error('O sistema necessita de ao menos um documento de controle ativo.');
      return;
    }
    const filtered = pages.filter(p => p.id !== id);
    setPages(filtered);
    if (selectedPageId === id) {
      setSelectedPageId(filtered[0].id);
    }
    toast.success('Página excluída com sucesso.');
  };

  const handleUpdatePageTitle = (newTitle: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        return { ...p, title: newTitle, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  };

  const handleUpdatePageEmoji = (emoji: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        return { ...p, emoji, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    setShowEmojiMenu(false);
  };

  const handleUpdatePageCover = (coverUrl: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        return { ...p, coverUrl, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    setShowCoverModal(false);
    toast.success('Imagem de capa atualizada!');
  };

  const handleBlockChange = (blockId: string, content: string, propertiesUpdate?: Partial<NotionBlock['properties']>) => {
    if (!activePage) return;

    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        const updatedBlocks = p.blocks.map(b => {
          if (b.id === blockId) {
            return {
              ...b,
              content,
              properties: {
                ...b.properties,
                ...propertiesUpdate
              }
            };
          }
          return b;
        });
        return { ...p, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    // Handle slash command triggering
    if (content.endsWith('/')) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenu({
          visible: true,
          blockId,
          filterText: '',
          position: {
            top: rect.bottom + window.scrollY - 100, // microadjust
            left: Math.max(20, Math.min(window.innerWidth - 300, rect.left + window.scrollX - 250))
          }
        });
      }
    } else if (slashMenu.visible && slashMenu.blockId === blockId) {
      const match = content.match(/\/(\w*)$/);
      if (match) {
        setSlashMenu(prev => ({ ...prev, filterText: match[1] }));
      } else {
        setSlashMenu(prev => ({ ...prev, visible: false }));
      }
    }
  };

  const handleApplySlashCommand = (type: NotionBlock['type']) => {
    if (!activePage) return;
    const { blockId } = slashMenu;

    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        const updatedBlocks = p.blocks.map(b => {
          if (b.id === blockId) {
            const cleanedContent = b.content.replace(/\/(\w*)$/, '');
            
            let properties: NotionBlock['properties'] = b.properties || {};
            if (type === 'todo') {
              properties.checked = false;
              properties.colorTheme = 'indigo';
            } else if (type === 'code') {
              properties.language = 'sql';
            } else if (type === 'callout') {
              properties.icon = '💡';
              properties.colorTheme = 'indigo';
            } else if (type === 'table') {
              properties.headers = ['Atividade', 'Área', 'Prioridade'];
              properties.rows = [
                ['Limpeza de reservatório de água', 'Geral', 'Alta 🔴'],
                ['Substituição de lâmpadas queimadas', 'Hall Social', 'Baixa 🟡']
              ];
            } else if (type === 'quote') {
              properties.colorTheme = 'rose';
            } else if (type === 'textbox') {
              properties.colorTheme = 'indigo';
              properties.width = 450;
              properties.height = 180;
            }

            return {
              ...b,
              type,
              content: cleanedContent,
              properties
            };
          }
          return b;
        });
        return { ...p, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    setSlashMenu(prev => ({ ...prev, visible: false }));
    toast.success(`Estrutura alterada para: ${type.toUpperCase()}`);
  };

  const handleAddNewBlock = (afterBlockId?: string, type: NotionBlock['type'] = 'paragraph') => {
    if (!activePage) return;

    const newBlock: NotionBlock = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
      type,
      content: '',
      properties: type === 'todo' ? { checked: false, colorTheme: 'default' } : type === 'code' ? { language: 'sql' } : type === 'textbox' ? { colorTheme: 'indigo', width: 450, height: 180 } : { colorTheme: 'default' }
    };

    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        let updatedBlocks: NotionBlock[] = [];
        if (afterBlockId) {
          const index = p.blocks.findIndex(b => b.id === afterBlockId);
          if (index !== -1) {
            updatedBlocks = [...p.blocks];
            updatedBlocks.splice(index + 1, 0, newBlock);
          } else {
            updatedBlocks = [...p.blocks, newBlock];
          }
        } else {
          updatedBlocks = [...p.blocks, newBlock];
        }
        return { ...p, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    setFocusedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!activePage || activePage.blocks.length <= 1) {
      toast.error('O documento necessita de ao menos um elemento de texto.');
      return;
    }

    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        return {
          ...p,
          blocks: p.blocks.filter(b => b.id !== blockId),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!activePage) return;

    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        const index = p.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return p;
        if (direction === 'up' && index === 0) return p;
        if (direction === 'down' && index === p.blocks.length - 1) return p;

        const updatedBlocks = [...p.blocks];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        
        const temp = updatedBlocks[index];
        updatedBlocks[index] = updatedBlocks[swapIndex];
        updatedBlocks[swapIndex] = temp;

        return { ...p, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  };

  // Change block visual theme
  const handleSetBlockTheme = (blockId: string, theme: NotionBlock['properties']['colorTheme']) => {
    setPages(prev => prev.map(p => {
      if (p.id === selectedPageId) {
        const updatedBlocks = p.blocks.map(b => {
          if (b.id === blockId) {
            return {
              ...b,
              properties: {
                ...b.properties,
                colorTheme: theme
              }
            };
          }
          return b;
        });
        return { ...p, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    toast.success('Estilo visual atualizado!');
  };

  const handleFileUpload = (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(blockId, file);
  };

  const handleFileDrop = (blockId: string, event: React.DragEvent<HTMLDivElement>) => {
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    processFile(blockId, file);
  };

  const processFile = (blockId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result as string;
      const formattedSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${(file.size / 1024).toFixed(1)} KB`;

      setPages(prev => prev.map(p => {
        if (p.id === selectedPageId) {
          const updatedBlocks = p.blocks.map(b => {
            if (b.id === blockId) {
              return {
                ...b,
                content: file.name,
                properties: {
                  ...b.properties,
                  fileName: file.name,
                  fileSize: formattedSize,
                  fileType: file.type,
                  fileUrl: base64Content
                }
              };
            }
            return b;
          });
          return { ...p, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
        }
        return p;
      }));
      toast.success(`Arquivo "${file.name}" anexado com sucesso!`);
    };
    reader.readAsDataURL(file);
  };

  // AI Assist action function calling server-side Gemini
  const handleAIAssist = async (blockId: string, command: 'improve' | 'summarize' | 'translate' | 'expand' | 'bullets') => {
    const targetBlock = activePage?.blocks.find(b => b.id === blockId);
    if (!targetBlock || !targetBlock.content.trim()) {
      toast.error('Escreva algum conteúdo no bloco antes de chamar o assistente IA.');
      return;
    }

    setAiLoadingBlockId(blockId);
    setAiActiveBlockId(null);
    const loadToast = toast.loading('Processando com Inteligência Artificial...');

    try {
      const response = await fetch('/api/gemini/notion-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: targetBlock.content,
          command
        })
      });

      if (!response.ok) {
        throw new Error('Falha no processamento da IA');
      }

      const data = await response.json();
      if (data.resultText) {
        // Update block content
        handleBlockChange(blockId, data.resultText);
        toast.success('IA concluiu o aprimoramento!', { id: loadToast });
      } else {
        throw new Error('Nenhum texto retornado pela IA');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Ocorreu um erro no processador de IA. Tente novamente mais tarde.', { id: loadToast });
    } finally {
      setAiLoadingBlockId(null);
    }
  };

  const handleCopyPageMarkdown = () => {
    if (!activePage) return;

    let markdown = `# ${activePage.emoji} ${activePage.title}\n\n`;
    activePage.blocks.forEach(b => {
      switch (b.type) {
        case 'h1':
          markdown += `# ${b.content}\n\n`;
          break;
        case 'h2':
          markdown += `## ${b.content}\n\n`;
          break;
        case 'h3':
          markdown += `### ${b.content}\n\n`;
          break;
        case 'todo':
          markdown += `- [${b.properties?.checked ? 'x' : ' '}] ${b.content}\n`;
          break;
        case 'bullet':
          markdown += `- ${b.content}\n`;
          break;
        case 'code':
          markdown += `\`\`\`${b.properties?.language || 'text'}\n${b.content}\n\`\`\`\n\n`;
          break;
        case 'callout':
          markdown += `> **${b.properties?.icon || '💡'}** ${b.content}\n\n`;
          break;
        case 'quote':
          markdown += `> ${b.content}\n\n`;
          break;
        case 'textbox':
          markdown += `### 📝 Caixa de Texto Ajustável\n${b.content}\n\n`;
          break;
        case 'table':
          if (b.properties?.headers) {
            markdown += `| ${b.properties.headers.join(' | ')} |\n`;
            markdown += `| ${b.properties.headers.map(() => '---').join(' | ')} |\n`;
            b.properties.rows?.forEach(row => {
              markdown += `| ${row.join(' | ')} |\n`;
            });
            markdown += '\n';
          }
          break;
        default:
          markdown += `${b.content}\n\n`;
      }
    });

    navigator.clipboard.writeText(markdown);
    toast.success('Documento copiado no formato Markdown!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter list of pages
  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const slashCommands: { type: NotionBlock['type']; label: string; icon: any; desc: string }[] = [
    { type: 'paragraph', label: 'Texto simples', icon: FileText, desc: 'Comece a escrever texto' },
    { type: 'h1', label: 'Título Principal', icon: Heading1, desc: 'Seção primária grande' },
    { type: 'h2', label: 'Subtítulo', icon: Heading2, desc: 'Subseção média de engenharia' },
    { type: 'h3', label: 'Título Menor', icon: Heading3, desc: 'Divisor de rotinas' },
    { type: 'todo', label: 'Caixa de Seleção (Checklist)', icon: CheckSquare, desc: 'Item de checklist de campo' },
    { type: 'bullet', label: 'Lista com Marcadores', icon: List, desc: 'Pontos chaves de instrução' },
    { type: 'code', label: 'Script / Consulta SQL', icon: Code, desc: 'Bloco de programação ou consulta' },
    { type: 'callout', label: 'Alerta de Atenção / Dica', icon: Sparkles, desc: 'Bloco em destaque com ícone' },
    { type: 'quote', label: 'Citação / Norma Técnica', icon: Quote, desc: 'Citação de normas ou diretrizes' },
    { type: 'table', label: 'Tabela Organizacional', icon: Table, desc: 'Tabela interativa de colunas' },
    { type: 'file', label: 'Anexo de Arquivo / Documento', icon: Paperclip, desc: 'Arraste ou selecione fotos, PDFs, etc.' },
    { type: 'textbox', label: 'Caixa de Texto Ajustável', icon: Maximize2, desc: 'Caixa de texto com dimensões redimensionáveis' },
  ];

  const filteredSlashCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashMenu.filterText.toLowerCase()) ||
    cmd.type.toLowerCase().includes(slashMenu.filterText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* Dynamic Background Grid and Ambient Lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Structural Layout */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Modern Sidebar with Glassmorphism */}
        <div className="w-full md:w-72 bg-zinc-900/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0 relative overflow-hidden">
          
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Layers3 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs tracking-wider uppercase text-white">
                  NOTION ENGINE
                </span>
                <span className="text-[9px] font-black tracking-widest text-[#39FF14] uppercase">
                  Workspace Live
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-xl transition-all md:hidden text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Page Search */}
          <div className="p-4 border-b border-white/5 bg-black/10">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Pesquisar wiki de engenharia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-white/30 text-white"
              />
            </div>
          </div>

          {/* List of Pages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 flex justify-between items-center">
              <span>Seus Manuais & Atas</span>
              <button 
                onClick={handleCreatePage}
                className="p-1 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-500/10"
                title="Criar nova página inteligente"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {filteredPages.map(p => {
                const isActive = p.id === selectedPageId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPageId(p.id)}
                    className={`group w-full flex items-center justify-between p-3 rounded-2xl text-left cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-indigo-500/30 text-white shadow-lg' 
                        : 'hover:bg-white/[0.04] border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {p.emoji && (p.emoji.startsWith('http') || p.emoji.startsWith('data:')) ? (
                        <img src={p.emoji} className="w-5 h-5 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-lg shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{p.emoji}</span>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold truncate leading-snug">{p.title || 'Sem Título'}</span>
                        <span className="text-[8px] font-black text-white/30 tracking-widest uppercase">
                          {p.blocks.length} BLOCOS
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeletePage(p.id, e)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all text-white/30"
                      title="Excluir página"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {filteredPages.length === 0 && (
                <div className="p-6 text-center text-xs text-white/30 italic">
                  Nenhum manual encontrado.
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Panel / User Info inside Sidebar */}
          <div className="p-4 border-t border-white/5 bg-black/15">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-ping" />
              <span className="text-[9px] font-black tracking-widest uppercase text-white/40">Notion Copilot Ativado</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Escreva relatórios e aperte <code className="px-1 py-0.5 bg-black rounded text-indigo-400 font-mono">/</code> para abrir o assistente de bloco.
            </p>
          </div>

          {/* Return Button */}
          <div className="p-4 border-t border-white/10 bg-black/30">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 active:scale-95 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Painel Geral
            </button>
          </div>
        </div>

        {/* Right Active Editor Area with Elegant Layout */}
        <div className="flex-1 flex flex-col bg-[#0b0c10] overflow-y-auto relative print:bg-white print:text-black">
          
          {activePage ? (
            <>
              {/* Cover Image Banner */}
              <div className="h-48 md:h-64 relative group w-full overflow-hidden shrink-0 print:hidden shadow-lg">
                <img
                  src={activePage.coverUrl || PRESET_COVERS[0]}
                  alt="Cover"
                  className="w-full h-full object-cover select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/40 to-transparent" />
                
                {/* Visual Glass Button to Change Cover */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => setShowCoverModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black/60 hover:bg-indigo-600/80 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-300" />
                    Alterar Capa Artística
                  </button>
                </div>
              </div>

              {/* Document Container */}
              <div className="max-w-4xl w-full mx-auto px-4 md:px-14 relative -mt-20 z-20 pb-24">
                
                {/* Emoji Selector Card */}
                <div className="relative inline-block mb-6 print:hidden">
                  <button
                    onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                    className="w-24 h-24 bg-zinc-900 border border-white/15 rounded-[2rem] flex items-center justify-center text-5xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] hover:scale-105 hover:border-indigo-500/50 hover:shadow-indigo-500/5 overflow-hidden transition-all"
                    title="Mudar Ícone do Documento"
                  >
                    {activePage.emoji && (activePage.emoji.startsWith('http') || activePage.emoji.startsWith('data:')) ? (
                      <img src={activePage.emoji} className="w-full h-full object-cover rounded-[2rem]" referrerPolicy="no-referrer" />
                    ) : (
                      activePage.emoji
                    )}
                  </button>
                  
                  {/* Emoji dropdown popup */}
                  <AnimatePresence>
                    {showEmojiMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute left-0 top-full mt-3 p-4 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] z-50 flex flex-wrap gap-2.5 w-72"
                      >
                        <div className="w-full text-[9px] font-black uppercase tracking-wider text-white/40 pb-2 border-b border-white/5 mb-1">
                          Selecione um Ícone Técnico
                        </div>
                        {PRESET_EMOJIS.map(em => (
                          <button
                            key={em}
                            onClick={() => handleUpdatePageEmoji(em)}
                            className="w-11 h-11 hover:bg-indigo-500/20 hover:scale-110 text-2xl rounded-2xl transition-all flex items-center justify-center"
                          >
                            {em}
                          </button>
                        ))}

                        <div className="w-full pt-2 border-t border-white/5 mt-1">
                          <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer">
                            <UploadCloud className="w-3.5 h-3.5" />
                            Fazer Upload de Ícone
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      handleUpdatePageEmoji(reader.result);
                                      setShowEmojiMenu(false);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Print Title indicator */}
                <div className="hidden print:flex items-center gap-4 border-b pb-4 mb-6">
                  {activePage.emoji && (activePage.emoji.startsWith('http') || activePage.emoji.startsWith('data:')) ? (
                    <img src={activePage.emoji} className="w-10 h-10 object-cover rounded-xl" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-4xl">{activePage.emoji}</span>
                  )}
                  <h1 className="text-3xl font-black">{activePage.title}</h1>
                </div>

                {/* Document Control Panel bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5 mb-8 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#39FF14]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
                      Modificado hoje às {new Date(activePage.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyPageMarkdown}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-indigo-500/20 border border-white/10 rounded-2xl text-xs font-bold transition-all text-indigo-300"
                      title="Copiar em Markdown"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Markdown
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-emerald-500/20 border border-white/10 rounded-2xl text-xs font-bold transition-all text-emerald-300"
                      title="Imprimir"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir
                    </button>
                  </div>
                </div>

                {/* Main Interactive Page Title Input */}
                <input
                  type="text"
                  value={activePage.title}
                  onChange={(e) => handleUpdatePageTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-black text-4xl tracking-tight text-white mb-8 print:hidden focus:ring-0 focus:border-none focus:outline-none placeholder-white/20"
                  placeholder="Título do Documento..."
                />

                {/* INTERACTIVE MULTI-THEME BLOCKS LIST */}
                <div className="space-y-5">
                  {activePage.blocks.map((block, index) => {
                    const isFocused = focusedBlockId === block.id;
                    const blockTheme = BLOCK_THEMES.find(t => t.id === (block.properties?.colorTheme || 'default')) || BLOCK_THEMES[0];
                    const isAiLoading = aiLoadingBlockId === block.id;

                    return (
                      <div
                        key={block.id}
                        className={`group relative flex items-start gap-3.5 rounded-2xl border transition-all p-3.5 ${
                          blockTheme.border
                        } ${blockTheme.bg} ${blockTheme.text} ${
                          isFocused ? 'ring-1 ring-indigo-500/30 shadow-lg' : ''
                        }`}
                        onMouseEnter={() => setFocusedBlockId(block.id)}
                        onMouseLeave={() => setFocusedBlockId(null)}
                      >
                        {/* Drag, move and edit handles */}
                        <div className="absolute right-full mr-3 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-30">
                          <button
                            onClick={() => handleMoveBlock(block.id, 'up')}
                            className="p-1.5 bg-zinc-900/80 hover:bg-indigo-500 text-white/50 hover:text-white rounded-lg border border-white/5"
                            title="Mover para cima"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveBlock(block.id, 'down')}
                            className="p-1.5 bg-zinc-900/80 hover:bg-indigo-500 text-white/50 hover:text-white rounded-lg border border-white/5"
                            title="Mover para baixo"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Block Type Marker / Emoji / Checkbox */}
                        <div className="mt-1 shrink-0 select-none">
                          {block.type === 'todo' ? (
                            <input
                              type="checkbox"
                              checked={block.properties?.checked || false}
                              onChange={(e) => handleBlockChange(block.id, block.content, { checked: e.target.checked })}
                              className="w-5 h-5 rounded-lg border-white/20 bg-black text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 focus:outline-none cursor-pointer"
                            />
                          ) : block.type === 'bullet' ? (
                            <div className="w-5 h-5 flex items-center justify-center text-indigo-400 font-bold">•</div>
                          ) : block.type === 'callout' ? (
                            <span className="text-xl">{block.properties?.icon || '💡'}</span>
                          ) : block.type === 'quote' ? (
                            <div className="w-1.5 h-10 bg-rose-500/40 rounded-full" />
                          ) : block.type === 'file' ? (
                            <div className="w-5 h-5 flex items-center justify-center text-amber-400">
                              <Paperclip className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 flex items-center justify-center">
                              <GripVertical className="w-3.5 h-3.5 text-white/10 group-hover:text-white/40 cursor-grab" />
                            </div>
                          )}
                        </div>

                        {/* Interactive content based on block type */}
                        <div className="flex-1 min-w-0">
                          {isAiLoading ? (
                            <div className="flex items-center gap-2 text-indigo-400 font-medium py-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs tracking-wider animate-pulse uppercase font-black">Copilot IA reescrevendo...</span>
                            </div>
                          ) : (
                            <>
                              {/* Heading 1 */}
                              {block.type === 'h1' && (
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none text-2xl font-black tracking-tight text-white focus:ring-0"
                                  placeholder="Título Seção Principal"
                                />
                              )}

                              {/* Heading 2 */}
                              {block.type === 'h2' && (
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none text-xl font-extrabold tracking-tight text-white/90 focus:ring-0"
                                  placeholder="Subtítulo de Atividade"
                                />
                              )}

                              {/* Heading 3 */}
                              {block.type === 'h3' && (
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none text-base font-bold tracking-tight text-white/80 focus:ring-0"
                                  placeholder="Cabeçalho Menor / Tópico"
                                />
                              )}

                              {/* Paragraph */}
                              {block.type === 'paragraph' && (
                                <textarea
                                  rows={Math.max(1, Math.ceil(block.content.length / 85))}
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none text-sm leading-relaxed text-white/80 focus:ring-0 resize-none placeholder-white/20"
                                  placeholder="Escreva algo... Digite '/' para comandos técnicos avançados."
                                />
                              )}

                              {/* Todo */}
                              {block.type === 'todo' && (
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className={`w-full bg-transparent border-none outline-none text-sm focus:ring-0 ${
                                    block.properties?.checked ? 'line-through text-white/30' : 'text-white/95 font-medium'
                                  }`}
                                  placeholder="Atividade técnica a ser feita"
                                />
                              )}

                              {/* Bullet */}
                              {block.type === 'bullet' && (
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none text-sm text-white/90 focus:ring-0"
                                  placeholder="Item descritivo"
                                />
                              )}

                              {/* Quote */}
                              {block.type === 'quote' && (
                                <textarea
                                  rows={Math.max(1, Math.ceil(block.content.length / 85))}
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none text-sm italic text-rose-200/90 focus:ring-0 font-medium resize-none"
                                  placeholder="Norma Técnica NBR ou observação crítica..."
                                />
                              )}

                              {/* Callout */}
                              {block.type === 'callout' && (
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  className="w-full bg-transparent border-none outline-none text-xs text-indigo-100 font-bold tracking-wide focus:ring-0"
                                  placeholder="Nota importante de segurança..."
                                />
                              )}

                              {/* Code Block */}
                              {block.type === 'code' && (
                                <div className="bg-black/80 border border-white/10 rounded-2xl overflow-hidden font-mono text-xs mt-1">
                                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                                    <span className="text-white/40 uppercase text-[10px] font-black tracking-widest flex items-center gap-1.5">
                                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                                      Código / Script de Automação
                                    </span>
                                    <select
                                      value={block.properties?.language || 'sql'}
                                      onChange={(e) => handleBlockChange(block.id, block.content, { language: e.target.value })}
                                      className="bg-zinc-900 border border-white/10 text-[10px] font-black uppercase text-white rounded px-2.5 py-1 focus:outline-none"
                                    >
                                      <option value="sql">SQL / DB</option>
                                      <option value="javascript">JavaScript</option>
                                      <option value="typescript">TypeScript</option>
                                      <option value="json">JSON Config</option>
                                      <option value="html">HTML</option>
                                      <option value="css">CSS Variables</option>
                                    </select>
                                  </div>
                                  <textarea
                                    rows={Math.max(3, block.content.split('\n').length)}
                                    value={block.content}
                                    onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                    className="w-full bg-transparent border-none outline-none p-4 text-xs font-mono leading-relaxed text-indigo-300 focus:ring-0 focus:outline-none resize-none"
                                    placeholder="// Digite aqui códigos, scripts SQL de auditoria, ou comandos técnicos..."
                                  />
                                </div>
                              )}

                              {/* Resizable Text Box Block */}
                              {block.type === 'textbox' && (
                                <div 
                                  className="border border-indigo-500/20 bg-black/50 rounded-2xl flex flex-col overflow-hidden relative mt-1"
                                  style={{
                                    width: block.properties?.width ? `${block.properties.width}px` : '100%',
                                    height: block.properties?.height ? `${block.properties.height}px` : '180px',
                                    resize: 'both',
                                    overflow: 'auto',
                                    minWidth: '200px',
                                    minHeight: '100px'
                                  }}
                                  onMouseUp={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    handleBlockChange(block.id, block.content, { 
                                      width: Math.round(rect.width), 
                                      height: Math.round(rect.height) 
                                    });
                                  }}
                                >
                                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-indigo-500/5 select-none shrink-0">
                                    <span className="text-white/50 uppercase text-[9px] font-black tracking-widest flex items-center gap-1.5">
                                      <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                                      Caixa de Texto Ajustável
                                    </span>
                                    <span className="text-[8px] text-white/20 font-mono">
                                      {block.properties?.width && block.properties?.height 
                                        ? `${block.properties.width}x${block.properties.height}px` 
                                        : 'Ajustável'}
                                    </span>
                                  </div>
                                  <textarea
                                    value={block.content}
                                    onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                    className="flex-1 w-full bg-transparent border-none outline-none p-3.5 text-sm leading-relaxed text-white placeholder-white/20 focus:ring-0 resize-none overflow-y-auto"
                                    placeholder="Escreva anotações livres, memorandos ou relatórios técnicos aqui... Redimensione puxando o canto inferior direito."
                                  />
                                </div>
                              )}

                              {/* File / Attachment Block */}
                              {block.type === 'file' && (
                                <div className="mt-1">
                                  {!block.properties?.fileName ? (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        id={`file-input-${block.id}`}
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(block.id, e)}
                                      />
                                      <div
                                        onDragOver={(e) => { e.preventDefault(); }}
                                        onDrop={(e) => { e.preventDefault(); handleFileDrop(block.id, e); }}
                                        onClick={() => document.getElementById(`file-input-${block.id}`)?.click()}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer text-center group"
                                      >
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl mb-3 text-white/60 group-hover:text-indigo-400 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all">
                                          <UploadCloud className="w-6 h-6 animate-pulse" />
                                        </div>
                                        <p className="text-xs font-bold text-white/90">Arraste seus documentos aqui</p>
                                        <p className="text-[10px] text-white/40 mt-1">ou clique para selecionar do computador</p>
                                        <p className="text-[9px] text-white/20 mt-2 font-mono uppercase">PDF, PNG, JPG, XLS, DOC (Máx 5MB)</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-2xl group/file">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                                          <File className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-black text-white/95 truncate leading-tight">{block.properties.fileName}</p>
                                          <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                                            <span>{block.properties.fileSize}</span>
                                            <span>•</span>
                                            <span className="uppercase text-[9px] bg-white/5 px-1.5 py-0.5 rounded font-mono font-extrabold text-white/60 tracking-wider">
                                              {block.properties.fileType?.split('/')[1] || 'DOC'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 self-end sm:self-auto print:hidden">
                                        {block.properties.fileType?.startsWith('image/') && (
                                          <button
                                            onClick={() => {
                                              const win = window.open();
                                              if (win) {
                                                win.document.write(`<iframe src="${block.properties?.fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                              } else {
                                                toast.error("Bloqueador de popups impediu a visualização direta.");
                                              }
                                            }}
                                            className="p-2.5 bg-white/5 hover:bg-indigo-500/20 border border-white/5 text-white/60 hover:text-indigo-300 rounded-xl transition-all"
                                            title="Visualizar Imagem"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                        )}
                                        <a
                                          href={block.properties.fileUrl}
                                          download={block.properties.fileName}
                                          className="p-2.5 bg-white/5 hover:bg-emerald-500/20 border border-white/5 text-white/60 hover:text-emerald-300 rounded-xl transition-all flex items-center justify-center"
                                          title="Baixar Arquivo"
                                        >
                                          <Download className="w-4 h-4" />
                                        </a>
                                        <button
                                          onClick={() => {
                                            setPages(prev => prev.map(p => {
                                              if (p.id === selectedPageId) {
                                                const updatedBlocks = p.blocks.map(b => {
                                                  if (b.id === block.id) {
                                                    return {
                                                      ...b,
                                                      content: '',
                                                      properties: {
                                                        ...b.properties,
                                                        fileName: undefined,
                                                        fileSize: undefined,
                                                        fileType: undefined,
                                                        fileUrl: undefined
                                                      }
                                                    };
                                                  }
                                                  return b;
                                                });
                                                return { ...p, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
                                              }
                                              return p;
                                            }));
                                            toast.success("Anexo removido.");
                                          }}
                                          className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/5 text-white/30 hover:text-red-400 rounded-xl transition-all"
                                          title="Excluir Anexo"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Table Block */}
                              {block.type === 'table' && (
                                <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/60 mt-1">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-white/5 border-b border-white/10">
                                        {block.properties?.headers?.map((header, colIdx) => (
                                          <th key={colIdx} className="p-3">
                                            <input
                                              type="text"
                                              value={header}
                                              onChange={(e) => {
                                                const headers = [...(block.properties?.headers || [])];
                                                headers[colIdx] = e.target.value;
                                                handleBlockChange(block.id, block.content, { headers });
                                              }}
                                              className="bg-transparent border-none outline-none font-bold text-white tracking-wider focus:ring-0 uppercase text-[10px]"
                                            />
                                          </th>
                                        ))}
                                        <th className="p-2 w-10 shrink-0 text-center text-white/30 print:hidden">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const headers = [...(block.properties?.headers || []), 'Nova Coluna'];
                                              const rows = (block.properties?.rows || []).map(row => [...row, '']);
                                              handleBlockChange(block.id, block.content, { headers, rows });
                                            }}
                                            className="hover:text-white"
                                            title="Adicionar coluna"
                                          >
                                            +
                                          </button>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {block.properties?.rows?.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="border-b border-white/5 hover:bg-white/[0.02]">
                                          {row.map((cell, colIdx) => (
                                            <td key={colIdx} className="p-3">
                                              <input
                                                type="text"
                                                value={cell}
                                                onChange={(e) => {
                                                  const rows = (block.properties?.rows || []).map(r => [...r]);
                                                  rows[rowIdx][colIdx] = e.target.value;
                                                  handleBlockChange(block.id, block.content, { rows });
                                                }}
                                                className="bg-transparent border-none outline-none text-white/80 w-full focus:ring-0"
                                              />
                                            </td>
                                          ))}
                                          <td className="p-2 text-center text-white/30 print:hidden">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const rows = (block.properties?.rows || []).filter((_, idx) => idx !== rowIdx);
                                                handleBlockChange(block.id, block.content, { rows });
                                              }}
                                              className="hover:text-red-400"
                                              title="Excluir linha"
                                            >
                                              ×
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                      <tr className="print:hidden">
                                        <td colSpan={(block.properties?.headers?.length || 0) + 1} className="p-2.5 text-center bg-black/20">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const colCount = block.properties?.headers?.length || 3;
                                              const newRow = Array(colCount).fill('');
                                              const rows = [...(block.properties?.rows || []), newRow];
                                              handleBlockChange(block.id, block.content, { rows });
                                            }}
                                            className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 tracking-wider"
                                          >
                                            + Adicionar Linha
                                          </button>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Interactive Sparkle AI Assist and Styling popups inside each block */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 mt-0.5 print:hidden">
                          
                          {/* Style Presets Trigger */}
                          <div className="relative">
                            <button
                              onClick={() => setAiActiveBlockId(aiActiveBlockId === block.id ? null : block.id)}
                              className="p-1.5 hover:bg-indigo-500/10 text-indigo-300 rounded-lg border border-indigo-500/15"
                              title="Estilo & IA Copilot"
                            >
                              <Sparkle className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* Block contextual style and AI assist menu */}
                            <AnimatePresence>
                              {aiActiveBlockId === block.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                  className="absolute right-0 bottom-full mb-2 p-3 bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl z-40 w-64"
                                >
                                  {/* AI Section */}
                                  <div className="space-y-1 mb-3">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1.5">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Ações de IA Copilot
                                    </div>
                                    <button
                                      onClick={() => handleAIAssist(block.id, 'improve')}
                                      className="w-full text-left text-xs p-1.5 hover:bg-indigo-500/15 rounded-xl transition-all font-bold text-white flex items-center gap-2"
                                    >
                                      <span>✨</span> Melhorar Relato Técnico
                                    </button>
                                    <button
                                      onClick={() => handleAIAssist(block.id, 'bullets')}
                                      className="w-full text-left text-xs p-1.5 hover:bg-indigo-500/15 rounded-xl transition-all font-bold text-white flex items-center gap-2"
                                    >
                                      <span>📋</span> Converter em Tópicos
                                    </button>
                                    <button
                                      onClick={() => handleAIAssist(block.id, 'expand')}
                                      className="w-full text-left text-xs p-1.5 hover:bg-indigo-500/15 rounded-xl transition-all font-bold text-white flex items-center gap-2"
                                    >
                                      <span>🔍</span> Expandir Conceito Técnico
                                    </button>
                                  </div>

                                  {/* Block Style presets Section */}
                                  <div className="border-t border-white/10 pt-2">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-1.5">
                                      Estilo Visual do Bloco
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {BLOCK_THEMES.map(th => (
                                        <button
                                          key={th.id}
                                          onClick={() => {
                                            handleSetBlockTheme(block.id, th.id as any);
                                            setAiActiveBlockId(null);
                                          }}
                                          className={`text-[9px] font-bold p-1 rounded border hover:border-indigo-500 transition-all text-left truncate ${
                                            block.properties?.colorTheme === th.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-black/20'
                                          }`}
                                        >
                                          {th.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <button
                            onClick={() => handleAddNewBlock(block.id)}
                            className="p-1.5 hover:bg-white/15 rounded-lg text-white/50 hover:text-white border border-white/5"
                            title="Inserir bloco abaixo"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/10"
                            title="Excluir bloco"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Bottom Add Block structural trigger buttons */}
                <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-3 print:hidden">
                  <button
                    onClick={() => handleAddNewBlock(activePage.blocks[activePage.blocks.length - 1]?.id, 'paragraph')}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Parágrafo
                  </button>
                  <button
                    onClick={() => handleAddNewBlock(activePage.blocks[activePage.blocks.length - 1]?.id, 'todo')}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Checklist de Campo
                  </button>
                  <button
                    onClick={() => handleAddNewBlock(activePage.blocks[activePage.blocks.length - 1]?.id, 'table')}
                    className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white/80 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
                  >
                    <Table className="w-4 h-4" />
                    Tabela de Atividades
                  </button>
                  <button
                    onClick={() => handleAddNewBlock(activePage.blocks[activePage.blocks.length - 1]?.id, 'file')}
                    className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
                  >
                    <Paperclip className="w-4 h-4" />
                    Anexar Arquivo
                  </button>
                  <button
                    onClick={() => handleAddNewBlock(activePage.blocks[activePage.blocks.length - 1]?.id, 'textbox')}
                    className="flex items-center gap-2 px-5 py-3 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/25 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Caixa de Texto Ajustável
                  </button>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center min-h-[500px]">
              <FileText className="w-16 h-16 text-indigo-500/20 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold mb-2">Nenhum Documento de Controle Ativo</h3>
              <p className="text-sm text-white/40 mb-6 max-w-md">Crie uma nova página de controle ou atas no menu lateral esquerdo para começar a organizar suas rotinas.</p>
              <button
                onClick={handleCreatePage}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
              >
                Criar Nova Página Inteligente
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Floating Slash Commands Popover Menu */}
      <AnimatePresence>
        {slashMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{
              position: 'absolute',
              top: slashMenu.position.top,
              left: slashMenu.position.left,
              zIndex: 1000
            }}
            className="w-72 bg-zinc-900/95 backdrop-blur-md border border-white/15 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden p-2"
          >
            <div className="px-3.5 py-2 border-b border-white/5 text-[9px] font-black uppercase tracking-wider text-indigo-400">
              Rotinas de Engenharia & Estrutura
            </div>
            <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
              {filteredSlashCommands.map(cmd => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.type}
                    onClick={() => handleApplySlashCommand(cmd.type)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-2xl text-left transition-all"
                  >
                    <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
                      <Icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{cmd.label}</div>
                      <div className="text-[10px] text-white/40">{cmd.desc}</div>
                    </div>
                  </button>
                );
              })}

              {filteredSlashCommands.length === 0 && (
                <div className="p-4 text-center text-xs text-white/30 italic">
                  Nenhum comando estruturado encontrado.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Cover Art Modal */}
      <Modal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        title="Selecione um Tema de Capa"
      >
        <div className="space-y-4 p-1">
          {/* File Upload Box */}
          <div className="border border-dashed border-white/20 hover:border-indigo-500/50 rounded-2xl p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center relative cursor-pointer group">
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      handleUpdatePageCover(reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <UploadCloud className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xs font-black uppercase tracking-wider text-white/90">Fazer Upload de Imagem de Fundo</span>
              <span className="text-[10px] text-white/40">Selecione uma imagem do seu dispositivo para colocar como capa</span>
            </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-wider text-white/40 pt-2 border-t border-white/5">
            Ou escolha um tema padrão:
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {PRESET_COVERS.map((cov, idx) => (
              <div
                key={idx}
                onClick={() => handleUpdatePageCover(cov)}
                className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500 cursor-pointer transition-all hover:scale-105 group"
              >
                <img src={cov} alt="Cover option" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </Modal>

    </div>
  );
}
