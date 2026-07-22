import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Download, Eye, Palette, Layout, Type, Check, 
  Settings, FolderPlus, Sparkles, FileText, FileSignature, 
  User, Calendar, AlertCircle, Wrench, ShieldCheck,
  MapPin, CheckSquare, Layers, Save, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { generatePdf } from '../utils/pdfGenerator';
import { safeFormatDate } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';

interface CustomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
  client: any;
}

// Layout Presets
type LayoutPreset = 'classic' | 'modern' | 'tech' | 'minimalist' | 'letterhead';
type FontSizePreset = 'small' | 'medium' | 'large';

export default function CustomReportModal({ isOpen, onClose, ticket, client }: CustomReportModalProps) {
  const { documentTemplates, addDigitalFolderItem, companyData, companyLogo, companySignature } = useStore();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Customization States
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('modern');
  const [primaryColor, setPrimaryColor] = useState<string>('#004a7c'); // Default Condfy Blue
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [fontSize, setFontSize] = useState<FontSizePreset>('medium');
  
  // Show/Hide Section States
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showReportedProblem, setShowReportedProblem] = useState<boolean>(true);
  const [showTechnicalReport, setShowTechnicalReport] = useState<boolean>(true);
  const [showMaterials, setShowMaterials] = useState<boolean>(true);
  const [showAdditionalComments, setShowAdditionalComments] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(true);
  
  // Document Save options
  const [saveToClientFolder, setSaveToClientFolder] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customObservations, setCustomObservations] = useState<string>(ticket.observations || '');

  // Pre-fill Title
  useEffect(() => {
    if (ticket) {
      setCustomTitle(`Relatório de Ordem de Serviço #${ticket.osNumber || ticket.id.substring(0, 8).toUpperCase()}`);
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  // Pre-defined Primary Colors
  const colorPalette = [
    { name: 'Condfy Blue', hex: '#004a7c' },
    { name: 'Classic Blue', hex: '#2563eb' },
    { name: 'Forest Green', hex: '#059669' },
    { name: 'Cosmic Purple', hex: '#7c3aed' },
    { name: 'Slate Dark', hex: '#1e293b' },
    { name: 'Crimson Red', hex: '#e11d48' },
    { name: 'Deep Gold', hex: '#d97706' },
  ];

  // Fonts List
  const fontOptions = [
    { name: 'Inter (Sansa-serif)', value: 'Inter' },
    { name: 'Space Grotesk (Tech)', value: 'Space Grotesk' },
    { name: 'JetBrains Mono (Dados)', value: 'JetBrains Mono' },
    { name: 'Playfair Display (Serif)', value: 'Playfair Display' },
  ];

  // Size Multipliers
  const sizeClasses = {
    small: { title: 'text-lg', body: 'text-[10px]', label: 'text-[7px]' },
    medium: { title: 'text-2xl', body: 'text-xs', label: 'text-[8px]' },
    large: { title: 'text-3xl', body: 'text-sm', label: 'text-[9px]' },
  };

  // Extract Checklist items if any
  const checklistResults = ticket.checklistResults || [];

  // Replace placeholders inside any custom template text
  const applyPlaceholders = (templateContent: string) => {
    if (!templateContent) return '';
    
    const osNo = ticket.osNumber || ticket.id.substring(0, 8).toUpperCase();
    const formattedDate = safeFormatDate(ticket.date);
    const materialsStr = ticket.usedMaterials && ticket.usedMaterials.length > 0
      ? ticket.usedMaterials.map((m: any) => `- ${m.quantity}x ${m.name}`).join('\n')
      : 'Nenhum material utilizado';
    
    const statusText = ticket.status ? ticket.status.replace('_', ' ') : 'PENDENTE';
    const amountVal = ticket.budgetAmount ? `R$ ${ticket.budgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado';

    return templateContent
      .replace(/\[OS_NUMERO\]/g, osNo)
      .replace(/\[OS\]/g, osNo)
      .replace(/\[TITULO\]/g, ticket.title || '')
      .replace(/\[CLIENTE\]/g, client?.name || '---')
      .replace(/\[CNPJ\]/g, client?.document || '---')
      .replace(/\[CPF\]/g, client?.document || '---')
      .replace(/\[DATA\]/g, formattedDate)
      .replace(/\[STATUS\]/g, statusText)
      .replace(/\[TECNICO\]/g, ticket.technician || '---')
      .replace(/\[PROBLEMA\]/g, ticket.reportedProblem || 'Não detalhado')
      .replace(/\[RELATO_SERVICO\]/g, ticket.serviceReport || 'Não relatado')
      .replace(/\[RELATO\]/g, ticket.serviceReport || 'Não relatado')
      .replace(/\[MATERIAIS\]/g, materialsStr)
      .replace(/\[OBSERVACOES\]/g, customObservations)
      .replace(/\[VALOR\]/g, amountVal)
      .replace(/\[SINDICO\]/g, companyData?.name || 'Administrador');
  };

  const handleGenerate = async () => {
    const element = printRef.current;
    if (!element) return;

    window.scrollTo(0, 0);
    setIsGenerating(true);
    
    try {
      const formattedTitle = customTitle.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const fileName = `${formattedTitle || 'Relatorio_OS'}.pdf`;
      
      const pdfBase64 = await generatePdf(element, fileName);
      
      // Save copy to document library (digital folder) of client if requested
      if (saveToClientFolder && client) {
        addDigitalFolderItem({
          clientId: client.id,
          title: customTitle,
          description: `Relatório Customizado gerado para a OS #${ticket.osNumber || ticket.id.substring(0, 8).toUpperCase()}`,
          category: 'Relatório OS',
          fileUrl: pdfBase64 || '',
          date: new Date().toISOString()
        });
        toast.success('Relatório gerado e salvo na pasta de documentos do cliente!');
      } else {
        toast.success('Relatório PDF gerado com sucesso!');
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao gerar relatório customizado:', error);
      toast.error(`Erro ao gerar PDF: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get current active template text
  const getActiveContent = () => {
    if (selectedTemplateId === 'default') {
      return '';
    }
    const template = documentTemplates.find(t => t.id === selectedTemplateId);
    return template ? applyPlaceholders(template.content) : '';
  };

  const selectedTemplate = selectedTemplateId !== 'default' ? documentTemplates.find(t => t.id === selectedTemplateId) : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] w-full max-w-7xl flex flex-col md:flex-row shadow-2xl overflow-hidden h-[90vh] text-white">
        
        {/* Left: Customization controls */}
        <div className="w-full md:w-5/12 border-r border-zinc-800 flex flex-col h-full bg-zinc-950">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
                <Palette className="w-5 h-5 text-blue-400" />
                Relatório Customizável
              </h2>
              <p className="text-xs text-zinc-400">Personalize o design e o conteúdo da sua OS</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none">
            
            {/* 1. Nome do Relatório */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Nome do Relatório / Arquivo
              </label>
              <input 
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex: Relatorio_OS_Formatada"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-white transition-all"
              />
            </div>

            {/* 2. Selecionar Modelo da Biblioteca */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Layout da Biblioteca de Documentos
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-zinc-200 transition-all"
              >
                <option value="default">✨ Ordem de Serviço Padrão (Ficha Técnica)</option>
                {documentTemplates.map(t => (
                  <option key={t.id} value={t.id}>📂 {t.category}: {t.title}</option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 italic leading-snug">
                Escolha um modelo existente da biblioteca. Os placeholders (como [OS_NUMERO], [CLIENTE], [STATUS], etc.) serão preenchidos automaticamente com os dados reais desta OS.
              </p>
            </div>

            {/* 3. Estilo e Preset de Layout */}
            {selectedTemplateId === 'default' && (
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Preset de Estética
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'classic', label: '🏛️ Clássico' },
                    { id: 'modern', label: '🚀 Moderno' },
                    { id: 'tech', label: '💻 Técnico/Grid' },
                    { id: 'minimalist', label: '⚪ Minimalista' },
                    { id: 'letterhead', label: '📄 Timbrado Oficial' },
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setLayoutPreset(preset.id as LayoutPreset)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        layoutPreset === preset.id
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-md shadow-blue-500/5'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Paleta de Cores */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Cor de Destaque
              </label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => setPrimaryColor(color.hex)}
                    className="w-8 h-8 rounded-full border border-white/10 relative transition-all active:scale-95 flex items-center justify-center group"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {primaryColor === color.hex && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
                {/* Custom Color Input */}
                <input 
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-full bg-transparent cursor-pointer outline-none border border-white/10"
                  title="Cor personalizada"
                />
              </div>
            </div>

            {/* 5. Tipografia & Tamanhos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Type className="w-4 h-4" /> Fonte
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-white transition-all"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Escala
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as FontSizePreset)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-white transition-all"
                >
                  <option value="small">Pequeno (Compacto)</option>
                  <option value="medium">Médio (Padrão)</option>
                  <option value="large">Grande (Acessível)</option>
                </select>
              </div>
            </div>

            {/* 6. Visibilidade de Seções */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" /> Visibilidade das Seções
              </label>
              <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800 space-y-3">
                {[
                  { label: 'Exibir Logotipo da Empresa', state: showLogo, setter: setShowLogo },
                  { label: 'Exibir QR Code de Validação', state: showQrCode, setter: setShowQrCode },
                  { label: 'Exibir Assinaturas no Rodapé', state: showSignature, setter: setShowSignature },
                  { label: 'Exibir Problema Relatado', state: showReportedProblem, setter: setShowReportedProblem },
                  { label: 'Exibir Relato de Execução', state: showTechnicalReport, setter: setShowTechnicalReport },
                  { label: 'Exibir Produtos / Materiais', state: showMaterials, setter: setShowMaterials },
                  { label: 'Exibir Observações Adicionais', state: showAdditionalComments, setter: setShowAdditionalComments },
                  { label: 'Exibir Metadados no Rodapé', state: showFooter, setter: setShowFooter },
                ].map((sec, idx) => (
                  <label key={idx} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-zinc-300 font-bold group-hover:text-white transition-colors">{sec.label}</span>
                    <input 
                      type="checkbox"
                      checked={sec.state}
                      onChange={(e) => sec.setter(e.target.checked)}
                      className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* 7. Observações Adicionais */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Edição de Observações
              </label>
              <textarea 
                rows={3}
                value={customObservations}
                onChange={(e) => setCustomObservations(e.target.value)}
                placeholder="Insira observações adicionais para este PDF..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-medium text-white transition-all resize-none"
              />
            </div>

            {/* 8. Destinação */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-blue-400 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <FolderPlus className="w-4 h-4" /> Biblioteca de Documentos
                </p>
                <p className="text-[10px] text-zinc-400">Salvar cópia na pasta digital do cliente</p>
              </div>
              <input 
                type="checkbox"
                checked={saveToClientFolder}
                onChange={(e) => setSaveToClientFolder(e.target.checked)}
                className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
            </div>

          </div>

          <div className="p-6 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur shrink-0 flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-wider rounded-2xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Printer className="w-5 h-5 animate-pulse" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Gerar PDF Customizado
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-2xl transition-all active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 flex flex-col h-full bg-zinc-900 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
              <Eye className="w-4 h-4" /> Pré-visualização do PDF (A4)
            </h3>
            <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400">Escala de Impressão: 100%</span>
          </div>

          {/* PDF Page Container */}
          <div className="flex-1 overflow-y-auto flex justify-center items-start">
            <div 
              className="bg-white text-zinc-900 shadow-2xl overflow-hidden relative border border-zinc-300"
              style={{ 
                width: '210mm', 
                minHeight: '297mm', 
                padding: '20mm',
                fontFamily: fontFamily === 'Inter' ? '"Inter", sans-serif' : 
                            fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' :
                            fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : 
                            '"Playfair Display", serif',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              ref={printRef}
            >
              
              {/* If customized template selected from Document Library */}
              {selectedTemplateId !== 'default' ? (
                <div className="flex flex-col h-full w-full justify-between flex-1">
                  
                  {/* Top Bar Accent */}
                  <div className="h-2 w-full mb-8" style={{ backgroundColor: primaryColor }} />
                  
                  {/* Header */}
                  <div className="border-b border-zinc-200 pb-6 mb-8 flex justify-between items-start break-inside-avoid">
                    <div className="flex gap-4 items-center">
                      {showLogo && (
                        companyLogo ? (
                          <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100 flex items-center justify-center">
                            <img src={companyLogo} alt="Logo" className="h-12 w-auto object-contain max-w-[100px]" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                            <FileSignature className="w-6 h-6" />
                          </div>
                        )
                      )}
                      <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter leading-tight" style={{ color: '#000000' }}>
                          {selectedTemplate?.title || 'Relatório de OS'}
                        </h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">
                          Documento Gerado • {companyData?.name || 'IA COMPANY'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                        {safeFormatDate(ticket.date)}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">
                        OS #{ticket.osNumber || ticket.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Template Content Filled */}
                  <div className="text-justify text-zinc-800 leading-relaxed space-y-4 flex-1" style={{ fontSize: fontSize === 'small' ? '11px' : fontSize === 'large' ? '15px' : '13px' }}>
                    {getActiveContent().split('\n').map((line, i) => {
                      const isTitle = line.trim().startsWith('CLÁUSULA') || line.trim().startsWith('CAPÍTULO') || line.trim().startsWith('CONTRATO') || line.trim().startsWith('CLÁUSULA PRIMEIRA') || line.trim().startsWith('CLÁUSULA SEGUNDA') || line.trim().startsWith('CLÁUSULA TERCEIRA') || line.trim().startsWith('CLÁUSULA QUARTA') || line.trim().startsWith('CLÁUSULA QUINTA');
                      return (
                        <p 
                          key={i} 
                          className={isTitle ? 'font-black text-black pt-4' : ''}
                          style={isTitle ? { color: primaryColor, borderBottom: `1px solid ${primaryColor}22`, paddingBottom: '4px' } : {}}
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* Signatures & Footer block */}
                  <div className="mt-12 break-inside-avoid">
                    {showSignature && (
                      <div className="grid grid-cols-2 gap-20 pt-10 border-t border-zinc-100">
                        <div className="text-center flex flex-col items-center">
                          <div className="h-16 flex items-end justify-center mb-2 w-full">
                            {companySignature && (
                              <img src={companySignature} alt="Assinatura" className="max-h-full max-w-[180px] object-contain opacity-90" />
                            )}
                          </div>
                          <div className="w-full border-t border-zinc-200 pt-3">
                            <p className="text-xs font-black text-black leading-none mb-1">{companyData?.name || 'IA COMPANY'}</p>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em]">Pelo Emitente</p>
                          </div>
                        </div>
                        <div className="text-center flex flex-col items-center">
                          <div className="h-16 mb-2 w-full"></div>
                          <div className="w-full border-t border-zinc-200 pt-3">
                            <p className="text-xs font-black text-black leading-none mb-1">{client?.name || 'Responsável'}</p>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em]">Pelo Cliente</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {showFooter && (
                      <div className="mt-12 pt-6 border-t border-zinc-100 flex justify-between items-center text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                        <span>Documento gerado eletronicamente com dados da Biblioteca</span>
                        <span>{customTitle}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Else Default OS Report, styled with preset and colors */
                <div className="flex flex-col h-full w-full justify-between flex-1">
                  
                  {/* Header Presets */}
                  {layoutPreset === 'letterhead' && (
                    <div className="h-3 w-full mb-8" style={{ backgroundColor: primaryColor }} />
                  )}

                  {/* Top Header Row */}
                  <div className={`flex justify-between items-start mb-8 pb-6 border-b border-zinc-200 break-inside-avoid ${
                    layoutPreset === 'minimalist' ? 'border-b border-zinc-100' : ''
                  }`}>
                    <div className="flex gap-4 items-center flex-1">
                      {showLogo && (
                        companyLogo ? (
                          <div className="bg-white p-1 rounded-xl border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden" style={{ width: '80px', height: '80px' }}>
                            <img src={companyLogo} alt="Logo" className="max-h-[70px] max-w-[70px] object-contain" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg shrink-0 text-white" style={{ backgroundColor: primaryColor }}>
                            <Wrench className="w-7 h-7" />
                          </div>
                        )
                      )}
                      <div>
                        <h2 className="text-lg font-black leading-tight uppercase tracking-tighter" style={{ color: primaryColor }}>
                          {companyData?.name || 'IA COMPANY'}
                        </h2>
                        <div className="space-y-0.5 text-zinc-500 mt-1" style={{ fontSize: '9px', fontWeight: 600 }}>
                          <p>CNPJ: {companyData?.document || '---'}</p>
                          <p>{companyData?.email || 'contato@iacompany.com'} • {companyData?.phone || '(00) 0000-0000'}</p>
                          <p>Atendimento: {companyData?.businessHours || 'Seg. a Sex. das 08h às 18h'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="w-12 h-1.5 mb-2" style={{ backgroundColor: primaryColor }}></div>
                      <h1 className="text-2xl font-black tracking-tighter text-black uppercase leading-none mb-1">
                        {ticket.type === 'CORRETIVA' ? 'MANUTENÇÃO CORRETIVA' : `ORDEM DE SERVIÇO ${ticket.type}`}
                      </h1>
                      <div className="flex flex-col gap-0.5 items-end text-zinc-400 mt-1" style={{ fontSize: '9px', fontWeight: 700 }}>
                        <div className="flex items-center gap-1.5">
                          <span>Protocolo:</span>
                          <span className="text-black font-black">#{ticket.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Emissão:</span>
                          <span className="text-black font-black">{safeFormatDate(ticket.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status, Category & Tech Grid */}
                  <div className={`grid grid-cols-3 border border-zinc-200 rounded-xl overflow-hidden mb-6 break-inside-avoid ${
                    layoutPreset === 'tech' ? 'grid-cols-3' : 'grid-cols-2'
                  }`}>
                    <div className="p-3 border-r border-zinc-200">
                      <p className="text-zinc-400 uppercase tracking-widest font-black mb-1" style={{ fontSize: '7px' }}>Status do Chamado</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <span className="font-black text-black text-xs uppercase">— {ticket.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="p-3 border-r border-zinc-200">
                      <p className="text-zinc-400 uppercase tracking-widest font-black mb-1" style={{ fontSize: '7px' }}>Responsável Técnico</p>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-black text-black text-xs uppercase">{ticket.technician}</span>
                      </div>
                    </div>
                    {layoutPreset === 'tech' && (
                      <div className="p-3 text-white" style={{ backgroundColor: primaryColor }}>
                        <p className="opacity-75 uppercase tracking-widest font-black mb-1" style={{ fontSize: '7px' }}>Categoria</p>
                        <p className="font-black text-xs uppercase truncate">{ticket.maintenanceCategory || ticket.type}</p>
                      </div>
                    )}
                  </div>

                  {/* Client Details */}
                  <div className="flex gap-4 mb-6 items-stretch break-inside-avoid">
                    <div className="flex-1 p-5 rounded-2xl border flex flex-col relative overflow-hidden bg-zinc-50/50" style={{ borderLeft: `4px solid ${primaryColor}`, borderColor: '#e4e4e7' }}>
                      <h3 className="text-zinc-400 font-black uppercase tracking-widest mb-3" style={{ fontSize: '7px' }}>DADOS DO CLIENTE / UNIDADE</h3>
                      <div>
                        <p className="text-lg font-black text-black leading-tight mb-2 uppercase">{client?.name || '---'}</p>
                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-zinc-700" style={{ fontSize: '10px', fontWeight: 700 }}>
                          <div>
                            <span className="text-zinc-400 block uppercase font-black" style={{ fontSize: '7px' }}>Documento</span>
                            <span>{client?.document || '---'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block uppercase font-black" style={{ fontSize: '7px' }}>Contato</span>
                            <span>{client?.contactPerson || client?.phone || '---'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-zinc-400 block uppercase font-black" style={{ fontSize: '7px' }}>Endereço / Localização</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{client?.address || '---'} {ticket.location ? ` - ${ticket.location}` : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {showQrCode && (
                      <div className="w-28 flex flex-col items-center justify-center p-3 border rounded-2xl text-center bg-white">
                        <QRCodeSVG 
                          value={`${window.location.origin}/tickets/${ticket.id}`} 
                          size={60}
                          level="H"
                          includeMargin={false}
                        />
                        <p className="text-zinc-400 uppercase tracking-widest leading-none mt-2 font-black" style={{ fontSize: '6px' }}>
                          VERIFICAÇÃO DIGITAL
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Sections */}
                  <div className="flex-grow space-y-6">
                    
                    {/* Problem */}
                    {showReportedProblem && (
                      <div className="relative pl-4 break-inside-avoid" style={{ borderLeft: `3px solid ${primaryColor}` }}>
                        <h4 className="font-black uppercase tracking-widest mb-1.5 text-black flex items-center gap-1.5" style={{ fontSize: '8px' }}>
                          <AlertCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} /> Descrição do Chamado
                        </h4>
                        <div className="text-zinc-700 text-xs font-bold leading-relaxed space-y-1">
                          {ticket.reportedProblem ? (
                            ticket.reportedProblem.split('\n').map((line: string, i: number) => (
                              <p key={i}>— {line}</p>
                            ))
                          ) : (
                            <p className="text-zinc-400 italic font-medium">Nenhuma descrição detalhada informada.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Service Report */}
                    {showTechnicalReport && ticket.serviceReport && (
                      <div className="break-inside-avoid">
                        <h4 className="font-black uppercase tracking-widest mb-1.5 text-black" style={{ fontSize: '8px' }}>
                          Laudo de Execução Técnica
                        </h4>
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs font-bold leading-relaxed">
                          {ticket.serviceReport}
                        </div>
                      </div>
                    )}

                    {/* Materials */}
                    {showMaterials && ticket.usedMaterials && ticket.usedMaterials.length > 0 && (
                      <div className="break-inside-avoid">
                        <h4 className="font-black uppercase tracking-widest mb-1.5 text-black" style={{ fontSize: '8px' }}>
                          Peças, Produtos e Materiais Utilizados
                        </h4>
                        <table className="w-full text-left rounded-xl overflow-hidden border border-zinc-200" style={{ fontSize: '10px' }}>
                          <thead>
                            <tr className="bg-zinc-100 text-zinc-500 font-black uppercase" style={{ fontSize: '8px' }}>
                              <th className="p-2 border-b border-zinc-200">Quantidade</th>
                              <th className="p-2 border-b border-zinc-200">Nome do Material</th>
                              <th className="p-2 border-b border-zinc-200 text-right">Valor Unitário</th>
                              <th className="p-2 border-b border-zinc-200 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 font-bold">
                            {ticket.usedMaterials.map((m: any, idx: number) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="p-2">{m.quantity}</td>
                                <td className="p-2">{m.name}</td>
                                <td className="p-2 text-right">R$ {(m.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="p-2 text-right">R$ {((m.price || 0) * m.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Observations */}
                    {showAdditionalComments && customObservations && (
                      <div className="break-inside-avoid p-4 rounded-xl border border-zinc-100 bg-zinc-50/30">
                        <h4 className="font-black uppercase tracking-widest mb-1 text-black" style={{ fontSize: '8px' }}>Comentários & Observações Adicionais</h4>
                        <p className="text-zinc-600 text-[10px] font-medium italic leading-relaxed">
                          "{customObservations}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Signatures Row */}
                  <div className="mt-12 break-inside-avoid">
                    {showSignature && (
                      <div className="grid grid-cols-2 gap-16 pt-10 border-t border-zinc-200">
                        <div className="text-center flex flex-col items-center">
                          <div className="h-12 flex items-end justify-center mb-1 w-full">
                            {companySignature ? (
                              <img src={companySignature} alt="Assinatura" className="max-h-full max-w-[160px] object-contain opacity-95" />
                            ) : (
                              <p className="text-[10px] text-zinc-300 tracking-wider">Assinado Eletronicamente</p>
                            )}
                          </div>
                          <div className="w-full border-t border-zinc-300 pt-2.5">
                            <p className="text-xs font-black text-black leading-none mb-0.5">{ticket.technician}</p>
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Assinatura do Técnico</p>
                          </div>
                        </div>

                        <div className="text-center flex flex-col items-center">
                          <div className="h-12 mb-1 w-full flex items-end justify-center">
                            <span className="text-[10px] text-zinc-300 tracking-wider">Aprovado pelo Cliente</span>
                          </div>
                          <div className="w-full border-t border-zinc-300 pt-2.5">
                            <p className="text-xs font-black text-black leading-none mb-0.5">{client?.name ? client.name.substring(0, 30) : '---'}</p>
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Aprovação / Recebimento</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ultra Footer */}
                    {showFooter && (
                      <div className="mt-12 pt-5 border-t border-zinc-200 flex justify-between items-center text-[8px] font-bold text-zinc-300 uppercase tracking-widest">
                        <span>Emissão Digital via Condfy.IA • CNPJ {companyData?.document || '---'}</span>
                        <span>{customTitle}</span>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
