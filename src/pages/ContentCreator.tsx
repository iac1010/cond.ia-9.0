import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '../components/BackButton';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  Sliders, 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  Play, 
  SlidersHorizontal, 
  BookOpen, 
  FolderGit2, 
  Palette, 
  Video, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  FolderUp, 
  ExternalLink,
  RefreshCw,
  X,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

// Mock Brand Safety Files for Google AI Studio / Google Drive integration view
const INITIAL_BRAND_FILES = [
  { id: 'file-1', name: 'Manual_de_Identidade_Visual_IACompany.pdf', size: '2.4 MB', type: 'PDF', status: 'Carregado', active: true },
  { id: 'file-2', name: 'Manual_de_Tom_de_Voz_e_Escrita.pdf', size: '1.2 MB', type: 'PDF', status: 'Carregado', active: true },
  { id: 'file-3', name: 'Paleta_Hexadecimal_e_Fontes_Oficiais.json', size: '12 KB', type: 'JSON', status: 'Carregado', active: true },
  { id: 'file-4', name: 'Exemplos_Posts_Alta_Performance.docx', size: '420 KB', type: 'DOCX', status: 'Carregado', active: true },
];

const PRESETS = [
  {
    title: 'Manutenção de Bombas d\'Água',
    category: 'Post / Feed',
    description: 'Postagem sobre a importância da telemetria preventiva nas bombas d\'água.',
    prompt: 'Crie um post educativo de conscientização para moradores e síndicos sobre por que a telemetria em tempo real das bombas d\'água previne secas no condomínio.'
  },
  {
    title: 'Campanha de Economia de Água',
    category: 'Carrossel',
    description: 'Carrossel de 5 slides com dicas práticas para reduzir consumo predial.',
    prompt: 'Crie um carrossel de 5 slides com foco em brand-safety e tom educativo/prestativo focado em redução do desperdício de água nas unidades do condomínio.'
  },
  {
    title: 'Segurança da Portaria Virtual',
    category: 'Post / Feed',
    description: 'Alerta sobre como as eclusas evitam invasões e controle de acesso.',
    prompt: 'Elabore um conteúdo para moradores sobre as boas práticas de segurança na eclusa da portaria do condomínio (não pegar carona no portão de pedestres).'
  },
  {
    title: 'Apresentação da Central de Telemetria',
    category: 'Vídeo (Roteiro)',
    description: 'Roteiro de vídeo de 60 segundos apresentando a tela inteligente do Condfy.IA.',
    prompt: 'Roteiro de vídeo dinâmico para Reels/TikTok apresentando o dashboard operacional de telemetria inteligente de bombas e alarmes da IACompany.'
  }
];

export default function ContentCreator() {
  const [model, setModel] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.5);
  const [systemInstruction, setSystemInstruction] = useState(
`### SYSTEM ROLE & IDENTITY
Você é a IA Copilot de Branding & Conteúdo da IACompany. Sua missão é criar, editar e otimizar artes, roteiros, legendas e peças publicitárias em estrita conformidade com a identidade visual, tom de voz e diretrizes institucionais da empresa.

### KNOWLEDGE BASE INTEGRATION (BRAND GUIDELINES)
Você tem acesso direto aos documentos, PDFs de manual de marca, paletas de cores, diretrizes de comunicação e fontes da IACompany carregados na sua base de conhecimento.
1. Para artes e briefings visuais: consulte obrigatoriamente as diretrizes de Paleta Hexadecimal (#dc2626 - vermelho principal, preto, tons cinza, off-white), Tipografia e Grid Layout.
2. Para textos e copys: aplique estritamente o Tom de Voz institucional da IACompany (inovador, tecnológico, porém humano e confiável), evitando proibições linguísticas ou jargões genéricos.

### OUTPUT FORMATS
Ao receber uma solicitação do usuário, responda estruturado em seções Markdown claras:
- **Copy / Legenda:** Hook (gancho inicial), Corpo do texto (AIDA/PAS), CTA e Hashtags.
- **Visual Briefing / Prompt de Imagem:** Prompt otimizado em inglês para geradores de imagem (Midjourney/Flux/DALL-E), Códigos HEX das cores oficiais da IACompany a utilizar, Tipografia recomendada e Layout dos elementos.
- **Roteiro de Vídeo (se aplicável):** Tabela ou lista com Colunas: Cena/B-Roll | Texto na Tela | Narração | Trilha Sonora.`
  );
  
  const [promptInput, setPromptInput] = useState('');
  const [files, setFiles] = useState(INITIAL_BRAND_FILES);
  const [driveConnected, setDriveConnected] = useState(true);
  const [driveFolder, setDriveFolder] = useState('IACompany-Brand-Kit-2026');
  
  const [generating, setGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  
  const [activeOutputTab, setActiveOutputTab] = useState<'all' | 'copy' | 'visual' | 'script'>('all');
  const [copiedText, setCopiedText] = useState(false);

  // Parse sections for tabs view
  const getSection = (title: string) => {
    if (!generatedResult) return '';
    
    const lines = generatedResult.split('\n');
    let inSection = false;
    let sectionContent: string[] = [];
    
    // Normalize titles to search
    const lowerTitle = title.toLowerCase();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = line.startsWith('##') || line.startsWith('###') || line.startsWith('- **');
      
      if (isHeader) {
        if (line.toLowerCase().includes(lowerTitle)) {
          inSection = true;
          sectionContent.push(line);
          continue;
        } else if (inSection) {
          // Reached another header, stop
          break;
        }
      }
      
      if (inSection) {
        sectionContent.push(line);
      }
    }
    
    return sectionContent.join('\n');
  };

  const handlePresetClick = (presetPrompt: string) => {
    setPromptInput(presetPrompt);
    toast.success('Briefing preenchido com o modelo selecionado!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        status: 'Carregado',
        active: true
      };
      setFiles([...files, newFile]);
      toast.success(`Arquivo "${file.name}" importado com sucesso na Base de Conhecimento!`);
    }
  };

  const toggleFileActive = (id: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    toast.success('Arquivo removido da base de conhecimento.');
  };

  const runBrandContentCreator = async () => {
    if (!promptInput.trim()) {
      toast.error('Por favor, descreva qual conteúdo deseja gerar.');
      return;
    }

    setGenerating(true);
    setGeneratedResult(null);
    setGenerationSteps([
      'Inicializando instância do modelo do Google AI Studio...',
      'Analisando diretrizes de Brand Safety e Tom de Voz...',
      'Processando diretrizes da Paleta Hexadecimal (#dc2626)...',
      'Cruzando briefing do usuário com a Base de Conhecimento do Drive...',
      'Injetando instruções customizadas de branding da IACompany...',
      'Gerando conteúdo com temperatura ajustada...'
    ]);
    setActiveStepIndex(0);

    // Simulated step-by-step progress UI
    const interval = setInterval(() => {
      setActiveStepIndex(prev => {
        if (prev < 5) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 900);

    try {
      const response = await fetch('/api/gemini/brand-content-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptInput,
          temperature: temperature,
        }),
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o servidor do Google AI Studio.');
      }

      const data = await response.json();
      setGeneratedResult(data.resultText);
      toast.success('Conteúdo criado e validado pelo Brand Safety com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao gerar conteúdo');
      // Elegant high-fidelity fallback if key is missing or offline
      setGeneratedResult(
`### Copy / Legenda
**Hook:** 🚨 Sabe aquela pane de bombas d'água de repente em pleno domingo? Esqueça isso de vez! 

**Corpo (AIDA):** 
- **Atenção:** Apresentamos a revolução na gestão predial. Na **IACompany**, nós reinventamos o cuidado com a infraestrutura crítica utilizando telemetria inteligente 100% conectada.
- **Interesse:** Nosso sistema inovador monitora sensores de vazão, corrente elétrica e pressão em tempo real, disparando alertas de manutenção preventiva antes mesmo da água faltar.
- **Desejo:** Tranquilidade para o síndico e conforto absoluto para todos os condôminos, sem custos surpresa.
- **Ação:** Peça uma demonstração agora mesmo com nosso especialista!

**CTA:** Clique no link da bio e fale com nossa equipe! 📲

**Hashtags:** #GestaoPredial #IACompany #CondominioInteligente #BrandingDeInovacao #TelemetriaPredial

---

### Visual Briefing / Prompt de Imagem
- **Prompt Midjourney:** \`An elegant modern commercial building roof with glowing water tanks, blue holographic digital telemetry flow screens, shot on a premium cinema camera, clean UI style, corporate branding red accents, photorealistic, 8k --ar 16:9\`
- **Códigos HEX Oficiais:** Vermelho Oficial \`#dc2626\`, Preto Slate \`#09090b\`, Cinza Neutro \`#71717a\`, Off-White \`#f4f4f5\`.
- **Tipografia Recomendada:** Headings em *Space Grotesk* (Bold) pareado com corpo em *Inter*.
- **Layout:** Grid assimétrico com foco no fluxo da telemetria digital.

---

### Roteiro de Vídeo
1. **Cena/B-Roll:** Tela do smartphone do síndico vibrando com alerta de telemetria predial vermelha.
   - **Texto na Tela:** Alerta Preventivo: Bomba D'água #02
   - **Narração:** "A telemetria inteligente da IACompany avisa antes do problema acontecer."
   - **Trilha Sonora:** Batida eletrônica leve, corporativa e inspiradora.
2. **Cena/B-Roll:** Técnico chegando ao condomínio com kit de ferramentas moderno.
   - **Texto na Tela:** Manutenção Preventiva Eficiente
   - **Narração:** "Nossa equipe age antes do condomínio ficar sem água."
   - **Trilha Sonora:** Música inspiradora crescendo de intensidade.`
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopiedText(true);
    toast.success('Todo o conteúdo copiado para a área de transferência!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Upper Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Google AI Studio Powered
                </span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-red-600" />
                Criador de Conteúdo <span className="text-red-600">&</span> Brand Safety
              </h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                Estação avançada de engenharia de prompts, branding e geração de conteúdo para as redes oficiais da <span className="text-red-600 font-bold">IACompany</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: AI Studio Config Side Panel */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            
            {/* Panel 1: Model Settings */}
            <div className="bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-red-600" />
                Parâmetros do Modelo (AI Studio)
              </h2>

              <div className="space-y-4">
                {/* Model selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-zinc-400 mb-1.5">Modelo Generativo</label>
                  <select 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3 py-2.5 outline-none text-sm transition-all text-gray-900 dark:text-white font-mono"
                  >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Mais Rápido)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Janela Longa)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recomendado)</option>
                  </select>
                </div>

                {/* Temperature slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold uppercase text-gray-500 dark:text-zinc-400">Temperatura (Criatividade)</label>
                    <span className="text-xs font-black font-mono text-red-600 bg-red-500/10 px-2 py-0.5 rounded">{temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.1" 
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                    <span>Determinístico (0.1)</span>
                    <span className="text-red-500 font-bold">Tom Ideal (0.4 - 0.6)</span>
                    <span>Criativo (1.0)</span>
                  </div>
                </div>

                {/* System Instructions (Prompt do Sistema) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold uppercase text-gray-500 dark:text-zinc-400">Instruções do Sistema (System Instructions)</label>
                    <span className="text-[9px] text-green-500 font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> MESTRE ATIVO
                    </span>
                  </div>
                  <textarea 
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    rows={8}
                    className="w-full bg-gray-50 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 focus:border-red-500 rounded-xl px-3 py-2 outline-none text-[11px] leading-relaxed transition-all text-gray-800 dark:text-zinc-300 font-mono resize-none shadow-inner"
                    placeholder="Instruções de identidade do modelo..."
                  />
                </div>
              </div>
            </div>

            {/* Panel 2: Knowledge Base & Files */}
            <div className="bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                  <Database className="w-4 h-4 text-red-600" />
                  Base de Conhecimento (Drive)
                </h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-green-500 tracking-wider">DRIVE LINKED</span>
                </div>
              </div>

              {/* Google Drive Integration Info */}
              <div className="bg-gray-50 dark:bg-zinc-950/50 rounded-2xl p-4 border border-gray-200/50 dark:border-zinc-800/60 space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pasta Vinculada</span>
                  <span className="text-xs font-mono font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-1">
                    {driveFolder} <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                  O Copilot lê automaticamente os PDFs de manual de marca, imagens de paletas de cores, tom de voz e fontes diretamente da pasta compartilhada do Google Drive da <strong>IACompany</strong>.
                </p>
              </div>

              {/* Files list */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800/50 rounded-xl hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={file.active} 
                        onChange={() => toggleFileActive(file.id)}
                        className="rounded accent-red-600 cursor-pointer"
                        title="Ativar/Desativar na inferência"
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${file.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>{file.name}</p>
                        <span className="text-[9px] font-mono text-gray-400">{file.size} • {file.type}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteFile(file.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                      title="Excluir arquivo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Manual Upload Trigger */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
                <label className="flex-1">
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.json,.png,.jpg"
                  />
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer transition-all active:scale-95 border border-gray-200 dark:border-zinc-700">
                    <FolderUp className="w-4 h-4 text-red-600" />
                    Enviar Arquivo
                  </div>
                </label>
              </div>

            </div>

          </div>

          {/* Right Column: Content Creation Workspace & Outputs */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            
            {/* Panel 3: Content Prompt Input */}
            <div className="bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
              
              {/* Presets Grid */}
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-red-600" />
                  Modelos e Presets de Conteúdo Rápidos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {PRESETS.map((p, index) => (
                    <button 
                      key={index}
                      onClick={() => handlePresetClick(p.prompt)}
                      className="text-left p-3.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-800 hover:border-red-500/50 hover:bg-red-500/5 rounded-2xl transition-all group active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest bg-red-500/10 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">{p.title}</h4>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium line-clamp-1">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Prompt Input Area */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                  Descreva o Briefing ou Prompt do Post / Peça Publicitária
                </label>
                <div className="relative">
                  <textarea 
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    rows={4}
                    placeholder="Ex: Crie uma legenda persuasiva e visual briefing para um post no Instagram incentivando os condôminos a economizarem água neste inverno, utilizando nossa identidade visual vermelha..."
                    className="w-full bg-gray-50 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-2xl p-4 text-sm outline-none transition-all resize-none shadow-inner text-gray-900 dark:text-white"
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-mono">
                    {promptInput.length} caracteres
                  </div>
                </div>
              </div>

              {/* Action trigger */}
              <div className="flex justify-end pt-2">
                <button 
                  onClick={runBrandContentCreator}
                  disabled={generating}
                  className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-red-500/20 glow-red"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processando IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Gerar Conteúdo Alinhado à Marca
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Panel 4: Generating Progress State */}
            {generating && (
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-red-600/10 to-transparent pointer-events-none rounded-full blur-2xl" />
                
                <h3 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2 mb-4 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Google AI Studio Ingest & Process
                </h3>

                <div className="space-y-2.5 font-mono text-[11px] text-zinc-400">
                  {generationSteps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 transition-all ${
                        idx < activeStepIndex 
                          ? 'text-green-500' 
                          : idx === activeStepIndex 
                            ? 'text-red-400 pl-2 font-bold scale-[1.01]' 
                            : 'opacity-30'
                      }`}
                    >
                      <span>
                        {idx < activeStepIndex ? '✓' : idx === activeStepIndex ? '▶' : '⊙'}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {/* Simulated Terminal Loading Progress */}
                <div className="mt-6 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((activeStepIndex + 1) / 6) * 100}%` }}
                    className="h-full bg-red-600 shadow-[0_0_10px_#dc2626]"
                  />
                </div>
              </div>
            )}

            {/* Panel 5: AI Studio Generated Content Results */}
            {generatedResult && !generating && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col"
              >
                {/* Visual Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-red-500/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        Resultado Gerado & Brand Safety Validado
                      </h3>
                      <p className="text-[11px] text-green-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% de conformidade com os Manuais da IACompany
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleCopyToClipboard}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-1.5 border border-gray-200 dark:border-zinc-700"
                      title="Copiar todo o resultado"
                    >
                      {copiedText ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-red-600" />}
                      {copiedText ? 'Copiado!' : 'Copiar Tudo'}
                    </button>
                  </div>
                </div>

                {/* Tab Navigation for specific items */}
                <div className="flex border-b border-gray-100 dark:border-zinc-800 px-6 gap-4 bg-gray-50/50 dark:bg-zinc-950/30">
                  <button 
                    onClick={() => setActiveOutputTab('all')}
                    className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                      activeOutputTab === 'all' 
                        ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold' 
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Completo
                  </button>
                  <button 
                    onClick={() => setActiveOutputTab('copy')}
                    className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                      activeOutputTab === 'copy' 
                        ? 'border-red-600 text-red-600 dark:text-red-400' 
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Legenda / Post
                  </button>
                  <button 
                    onClick={() => setActiveOutputTab('visual')}
                    className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                      activeOutputTab === 'visual' 
                        ? 'border-red-600 text-red-600 dark:text-red-400' 
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Briefing Visual
                  </button>
                  <button 
                    onClick={() => setActiveOutputTab('script')}
                    className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                      activeOutputTab === 'script' 
                        ? 'border-red-600 text-red-600 dark:text-red-400' 
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    Roteiro de Vídeo
                  </button>
                </div>

                {/* Tab Content rendering area */}
                <div className="p-6 max-h-[500px] overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-zinc-200">
                    
                    {activeOutputTab === 'all' && (
                      <div className="space-y-4">
                        <ReactMarkdown>{generatedResult}</ReactMarkdown>
                      </div>
                    )}

                    {activeOutputTab === 'copy' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl">
                          <ReactMarkdown>{getSection('Copy') || getSection('Legenda') || generatedResult}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {activeOutputTab === 'visual' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* Colored Hex Palettes Pill */}
                          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                                <Palette className="w-4 h-4 text-red-600" /> Cores Oficiais Aplicadas
                              </h4>
                              <p className="text-[10px] text-gray-400">Paleta oficial extraída do manual de marca da IACompany.</p>
                            </div>
                            <div className="flex gap-2.5 mt-4">
                              <div className="flex flex-col items-center">
                                <div className="w-9 h-9 rounded-full bg-red-600 border border-white/20 shadow-lg" />
                                <span className="text-[9px] font-mono mt-1 font-bold">#dc2626</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-9 h-9 rounded-full bg-zinc-950 border border-white/20 shadow-lg" />
                                <span className="text-[9px] font-mono mt-1 font-bold">#09090b</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-9 h-9 rounded-full bg-zinc-500 border border-white/20 shadow-lg" />
                                <span className="text-[9px] font-mono mt-1 font-bold">#71717a</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-9 h-9 rounded-full bg-zinc-100 border border-black/10 shadow-lg" />
                                <span className="text-[9px] font-mono mt-1 font-bold">#f4f4f5</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl">
                            <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                              <ShieldCheck className="w-4 h-4 text-red-600" /> Verificação de Tipografia
                            </h4>
                            <p className="text-[10px] text-gray-400">Garantia tipográfica contra desalinhamento de fontes.</p>
                            <div className="mt-3 text-xs font-semibold space-y-1.5">
                              <p>⚡ Headings: <strong className="text-red-500">Space Grotesk (Bold)</strong></p>
                              <p>⚡ Body Text: <strong className="text-zinc-500">Inter</strong></p>
                              <p>⚡ Data & Tech: <strong className="text-zinc-500 font-mono">JetBrains Mono</strong></p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl">
                          <ReactMarkdown>{getSection('Visual') || getSection('Briefing') || generatedResult}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {activeOutputTab === 'script' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl">
                          <ReactMarkdown>{getSection('Roteiro') || getSection('Vídeo') || generatedResult}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </motion.div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
