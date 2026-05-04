import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { Download, Printer, Edit, CheckCircle2, XCircle, DollarSign, Camera, MapPin, User, MessageSquare, Plus, QrCode, Share2, Sparkles, Wrench, ClipboardList, AlertCircle, Package } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { safeFormatDate } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';

export default function TicketView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, clients, checklistItems, companyLogo, companyData, companySignature, updateTicket, addTicketHistory } = useStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [historyNote, setHistoryNote] = useState('');

  const ticket = tickets.find(t => t.id === id);
  const client = clients.find(c => c.id === ticket?.clientId);

  if (!ticket) {
    return <div className="p-8 text-center text-gray-500">Registro não encontrado.</div>;
  }

  const handleAddHistory = () => {
    if (!historyNote.trim()) return;
    addTicketHistory(ticket.id, historyNote, 'Admin'); // Using 'Admin' as placeholder for current user
    setHistoryNote('');
    toast.success('Nota adicionada ao histórico');
  };

  const handleApproveBudget = () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor de orçamento válido.');
      return;
    }
    updateTicket(ticket.id, { 
      ...ticket, 
      status: 'APROVADO', 
      budgetAmount: amount, 
      budgetApproved: true 
    });
  };

  const handleRejectBudget = () => {
    updateTicket(ticket.id, { ...ticket, status: 'REJEITADO' });
  };

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    setIsGenerating(true);
    try {
      let fileName = '';
      if (ticket.id === '123') {
        fileName = 'OS_CORRETIVA_Condominio_Flores_20-02-2026.pdf';
      } else {
        const dateStr = safeFormatDate(ticket.date).replace(/\//g, '-');
        const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Tarefa';
        fileName = ticket.type === 'TAREFA' ? `Tarefa_${safeName}_${dateStr}.pdf` : `OS_${ticket.type}_${safeName}_${dateStr}.pdf`;
      }

      await generatePdf(element, fileName);
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      const errorMsg = error?.message || 'Erro desconhecido';
      alert(`Erro ao gerar PDF: ${errorMsg}. Tente usar o botão "Imprimir" no topo da página como alternativa.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSharePdf = async () => {
    const element = printRef.current;
    if (!element) return;

    window.scrollTo(0, 0);
    setIsGenerating(true);
    try {
      let fileName = '';
      if (ticket.id === '123') {
        fileName = 'OS_CORRETIVA_Condominio_Flores_20-02-2026.pdf';
      } else {
        const dateStr = safeFormatDate(ticket.date).replace(/\//g, '-');
        const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Tarefa';
        fileName = ticket.type === 'TAREFA' ? `Tarefa_${safeName}_${dateStr}.pdf` : `OS_${ticket.type}_${safeName}_${dateStr}.pdf`;
      }

      await sharePdf(element, fileName);
      toast.success('Compartilhamento iniciado!');
    } catch (error: any) {
      console.error('Erro ao compartilhar PDF:', error);
      const errorMsg = error?.message || 'Erro desconhecido';
      if (errorMsg.includes('Compartilhamento não suportado')) {
        toast.error(errorMsg);
      } else {
        toast.error(`Erro ao compartilhar: ${errorMsg}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative flex flex-col print:bg-white print:text-black print:p-0 print:m-0 print:block">
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden print:hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        {isGenerating && (
          <div className="fixed inset-0 bg-[#004a7c]/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-white font-black uppercase tracking-widest text-sm">Gerando {ticket.type === 'TAREFA' ? 'Tarefa' : 'Ordem de Serviço'}...</p>
          </div>
        )}
        <div className="flex justify-between items-center mb-12 print:hidden">
          <div className="flex items-center gap-6">
            <BackButton />
            <div>
              <h1 className="text-4xl font-light tracking-tight">{ticket.type === 'TAREFA' ? 'Tarefa' : 'Ordem de Serviço'}</h1>
              <p className="text-xl opacity-60 mt-2 font-light">Detalhes e acompanhamento</p>
            </div>
          </div>
          <div className="flex gap-3">
            {ticket.status === 'PENDENTE_APROVACAO' && (
              <span className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                Aguardando Aprovação
              </span>
            )}
            <button 
              onClick={() => {
                const sections = [];
                if (ticket.reportedProblem) sections.push(`Problema relatado: ${ticket.reportedProblem}`);
                if (ticket.serviceReport) sections.push(`Relato do serviço: ${ticket.serviceReport}`);
                
                if (ticket.checklistResults && ticket.checklistResults.length > 0) {
                  const checklistText = ticket.checklistResults.map(r => {
                    const item = checklistItems.find(i => i.id === r.taskId);
                    return `- ${item?.task || 'Tarefa'}: ${r.status}${r.notes ? ` (${r.notes})` : ''}`;
                  }).join('\n');
                  sections.push(`Checklist Realizado:\n${checklistText}`);
                }

                if (ticket.usedMaterials && ticket.usedMaterials.length > 0) {
                  const materialsText = ticket.usedMaterials.map(m => `- ${m.name}: ${m.quantity}`).join('\n');
                  sections.push(`Materiais Utilizados:\n${materialsText}`);
                }

                if (ticket.observations) sections.push(`Observações: ${ticket.observations}`);
                
                const description = sections.join('\n\n');
                navigate('/technical-report', { state: { description, clientId: ticket.clientId } });
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Relatório IA
            </button>
            <Link 
              to={`/tickets/${ticket.id}/edit`}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/10 backdrop-blur-md"
            >
              <Edit className="w-4 h-4" /> Editar
            </Link>
            <button 
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/10 backdrop-blur-md"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button 
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/20 backdrop-blur-md shadow-lg"
            >
              <Download className="w-4 h-4" /> {isGenerating ? 'Gerando...' : 'Baixar PDF'}
            </button>
            <button 
              onClick={handleSharePdf}
              disabled={isGenerating}
              className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <Share2 className="w-4 h-4" /> Compartilhar
            </button>
          </div>
        </div>

        {/* Alerta de Aprovação Pendente */}
        {ticket.status === 'PENDENTE_APROVACAO' && (
          <div className="mb-8 bg-amber-500/20 border border-amber-500/30 rounded-2xl p-6 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-200">Aprovação de Orçamento</h3>
                  <p className="text-sm text-amber-100/70">Defina o valor do orçamento para que o serviço possa ser iniciado.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                  <input 
                    type="number" 
                    placeholder="0,00"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/50 w-40 font-bold"
                  />
                </div>
                <button 
                  onClick={handleApproveBudget}
                  className="bg-black hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-black/20"
                >
                  <CheckCircle2 className="w-5 h-5" /> Aprovar
                </button>
                <button 
                  onClick={handleRejectBudget}
                  className="bg-red-500/20 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold transition-all border border-red-500/30"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          <div 
            ref={printRef} 
            ref-name="printRef"
            className="bg-white text-zinc-900 p-10 md:p-12 print:p-0 print:w-full print:mx-auto pdf-content font-sans"
            style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', backgroundColor: '#ffffff', color: '#18181b', position: 'relative' }}
          >
            {/* Top Accent Line */}
            <div className="h-2 w-full bg-black mb-6"></div>

            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-200 break-inside-avoid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="flex gap-6 items-center flex-1" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {companyLogo ? (
                  <div className="bg-white p-1 rounded-xl border border-zinc-100 flex items-center justify-center shrink-0" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={companyLogo} alt="Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div className="w-[80px] h-[80px] bg-black rounded-xl flex items-center justify-center shadow-lg shrink-0" style={{ width: '80px', height: '80px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wrench className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-black leading-none mb-3" style={{ fontWeight: 900, margin: 0, marginBottom: '8px' }}>
                    {companyData?.name || 'IA COMPANY SOFTWARE E AUTOMAÇÃO LTDA'}
                  </h2>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2" style={{ fontWeight: 700, fontSize: '10px' }}>
                      CNPJ: {companyData?.document || '---'}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2" style={{ fontWeight: 700, fontSize: '10px' }}>
                      {companyData?.email || 'contato@empresa.com'}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2" style={{ fontWeight: 700, fontSize: '10px' }}>
                      {companyData?.phone || '(00) 0000-0000'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col justify-between" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div className="flex flex-col items-end">
                  <div className="w-24 h-4 bg-black mb-3" style={{ width: '96px', height: '16px', backgroundColor: '#000' }}></div>
                  <h1 className="text-4xl font-black tracking-tighter text-black uppercase leading-none mb-3" style={{ fontWeight: 900, fontSize: '36px', letterSpacing: '-0.05em' }}>
                    {ticket.type === 'CORRETIVA' ? 'CORRETIVA' : ticket.type}
                  </h1>
                </div>
                <div className="flex flex-col gap-1 items-end pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest" style={{ fontWeight: 900, fontSize: '10px' }}>Protocolo</span>
                    <span className="text-sm font-black text-black" style={{ fontWeight: 900 }}>#{ticket.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest" style={{ fontWeight: 900, fontSize: '10px' }}>Emissão</span>
                    <span className="text-sm font-black text-black" style={{ fontWeight: 900 }}>{safeFormatDate(ticket.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Tech Boxes */}
            <div className="flex border border-black rounded-2xl overflow-hidden mb-8 break-inside-avoid" style={{ display: 'flex', border: '1px solid #000', borderRadius: '16px', overflow: 'hidden' }}>
              <div className="flex-1 bg-white p-5 border-r border-black" style={{ flex: 1, padding: '20px', borderRight: '1px solid #000' }}>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2" style={{ fontWeight: 900, fontSize: '9px' }}>Status Final</p>
                <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="w-2 h-2 bg-amber-500" style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b' }}></div>
                  <span className="font-black text-black text-base uppercase" style={{ fontWeight: 900 }}>— {ticket.status}</span>
                </div>
              </div>
              <div className="flex-1 bg-white p-5 border-r border-black" style={{ flex: 1, padding: '20px', borderRight: '1px solid #000' }}>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2" style={{ fontWeight: 900, fontSize: '9px' }}>Técnico Encarregado</p>
                <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-black text-black text-sm uppercase" style={{ fontWeight: 900 }}>{ticket.technician}</span>
                </div>
              </div>
              <div className="flex-1 bg-black p-5" style={{ flex: 1, backgroundColor: '#000' }}>
                {/* Black box filler matching image */}
              </div>
            </div>

            {/* Client & QR Row */}
            <div className="flex gap-6 mb-8 items-stretch break-inside-avoid" style={{ display: 'flex', gap: '24px' }}>
              <div className="flex-1 bg-white p-8 rounded-[2.5rem] border-2 border-black flex flex-col relative overflow-hidden" style={{ flex: 1, padding: '32px', borderRadius: '40px', border: '2px solid #000' }}>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-black mb-6" style={{ fontWeight: 900, fontSize: '9px' }}>NOME DO CLIENTE / SOLICITANTE</h3>
                <div>
                  <p className="text-3xl font-black text-black leading-tight mb-6" style={{ fontWeight: 900 }}>{client.name}</p>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '9px' }}>CNPJ / CPF</p>
                      <p className="text-xs font-black text-black" style={{ fontWeight: 900, fontSize: '12px' }}>{client.document || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '9px' }}>Contato</p>
                      <p className="text-xs font-black text-black" style={{ fontWeight: 900, fontSize: '12px' }}>{client.contactPerson || client.phone}</p>
                    </div>
                    <div className="col-span-2" style={{ gridColumn: 'span 2' }}>
                      <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '9px' }}>Endereço de Atendimento</p>
                      <div className="flex items-start gap-2" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin className="w-3.5 h-3.5 text-black mt-0.5" />
                        <p className="text-xs font-black text-black leading-relaxed" style={{ fontWeight: 900, fontSize: '12px' }}>
                          {client.address} {ticket.location ? ` - ${ticket.location}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-[200px] flex flex-col items-center justify-center p-8 border-2 border-black rounded-[2.5rem] bg-white text-center" style={{ width: '200px', padding: '32px', border: '2px solid #000', borderRadius: '40px' }}>
                <div className="mb-4 bg-white">
                  <QRCodeSVG 
                    value={`${window.location.origin}/tickets/${ticket.id}`} 
                    size={100}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[9px] font-black text-black uppercase tracking-widest leading-relaxed" style={{ fontWeight: 900, fontSize: '9px' }}>
                  ESCANEIE PARA VALIDAR AUTENTICIDADE DIGITAL
                </p>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-8" style={{ marginTop: '32px' }}>
              {/* Problema Relatado */}
              <div className="relative pl-6 break-inside-avoid" style={{ position: 'relative', paddingLeft: '24px', borderLeft: '4px solid #000' }}>
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ fontWeight: 900, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle className="w-4 h-4" /> Problema Relatado
                </h3>
                <div className="space-y-1">
                  {ticket.reportedProblem ? (
                    ticket.reportedProblem.split('\n').map((line, i) => (
                      <p key={i} className="text-black text-sm leading-relaxed font-bold" style={{ fontWeight: 700, fontSize: '14px', margin: 0, marginBottom: '4px' }}>
                        - {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-sm italic" style={{ fontStyle: 'italic', color: '#a1a1aa' }}>Nenhum problema detalhado.</p>
                  )}
                </div>
              </div>

              {/* Histórico Section */}
              <div className="break-inside-avoid">
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ fontWeight: 900, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList className="w-4 h-4" /> Histórico de Campo
                </h3>
                <div className="p-6 border-2 border-dashed border-zinc-300 rounded-[2rem] text-center bg-zinc-50/30" style={{ padding: '24px', border: '2px dashed #d4d4d8', borderRadius: '32px', backgroundColor: '#fafafa' }}>
                  {ticket.history && ticket.history.length > 0 ? (
                    <div className="text-left space-y-4" style={{ textAlign: 'left' }}>
                      {ticket.history.map(entry => (
                        <div key={entry.id} className="pb-3 border-b border-zinc-100 last:border-0 last:pb-0" style={{ paddingBottom: '12px', borderBottom: '1px solid #f4f4f5' }}>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1" style={{ fontWeight: 900, fontSize: '10px', color: '#a1a1aa' }}>
                            {safeFormatDate(entry.date)} • {entry.userName}
                          </p>
                          <p className="text-sm font-bold text-black" style={{ fontWeight: 700, fontSize: '14px' }}>{entry.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400 italic font-bold" style={{ fontStyle: 'italic', fontWeight: 700, color: '#a1a1aa' }}>Nenhum evento registrado no histórico</p>
                  )}
                </div>
              </div>

              {/* Comentários Adicionais */}
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-black break-inside-avoid shadow-inner" style={{ padding: '32px', borderRadius: '40px', border: '2px solid #000', backgroundColor: '#fff' }}>
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-4" style={{ fontWeight: 900, fontSize: '10px' }}>COMENTÁRIOS ADICIONAIS</h3>
                <p className="text-black text-base font-black italic" style={{ fontWeight: 900, fontSize: '16px', fontStyle: 'italic' }}>
                  "{ticket.observations || (ticket.budgetAmount ? `Valor de Mão de Obra R$ ${ticket.budgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Nenhuma observação adicional')}"
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-20 pt-12 border-t-2 border-black flex justify-between gap-20 break-inside-avoid" style={{ marginTop: '80px', paddingTop: '48px', borderTop: '2px solid #000', display: 'flex', justifyContent: 'space-between', gap: '80px' }}>
              <div className="text-center flex flex-col items-center flex-1" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div className="h-24 flex items-end justify-center mb-4 w-full" style={{ height: '96px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {companySignature ? (
                    <img src={companySignature} alt="Assinatura" style={{ maxHeight: '90px', width: 'auto', opacity: 0.9 }} />
                  ) : (
                    <div className="h-0.5 w-[200px] bg-zinc-200" style={{ height: '2px', width: '200px', backgroundColor: '#e4e4e7' }}></div>
                  )}
                </div>
                <div className="w-full">
                  <p className="text-lg font-black text-black leading-none mb-1" style={{ fontWeight: 900, fontSize: '18px' }}>{ticket.technician}</p>
                  <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]" style={{ fontWeight: 900, fontSize: '10px' }}>Assinatura do Técnico</p>
                </div>
              </div>
              <div className="text-center flex flex-col items-center flex-1" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div className="h-24 mb-4 w-full" style={{ height: '96px' }}></div>
                <div className="w-full">
                  <p className="text-lg font-black text-black leading-none mb-1" style={{ fontWeight: 900, fontSize: '18px' }}>{client.name.substring(0, 30)}</p>
                  <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]" style={{ fontWeight: 900, fontSize: '10px' }}>APROVAÇÃO / RECEBIMENTO</p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="mt-16 pt-6 border-t border-zinc-200 flex justify-between items-center break-inside-avoid" style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest" style={{ fontWeight: 700, fontSize: '9px', color: '#d4d4d8' }}>
                GERADO ELETRONICAMENTE EM {new Date().toLocaleDateString('pt-BR')} ÀS {new Date().toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right" style={{ fontWeight: 900, fontSize: '9px', color: '#a1a1aa', textAlign: 'right' }}>
                {companyData?.name || 'IA COMPANY SOFTWARE E AUTOMAÇÃO LTDA'} • PLATAFORMA INTEGRADA
              </p>
            </div>
            {/* Hidden spacer */}
            <div className="h-4 bg-transparent overflow-hidden">.</div>
            
            {/* Photo Gallery - Forces New Page if needed or stays close */}
            {(ticket.images?.length || 0) > 0 || ticket.photoBefore ? (
              <div className="mt-12 page-break-before-auto pt-10" style={{ marginTop: '48px', paddingTop: '40px' }}>
                <div className="flex items-center gap-4 mb-8" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div className="h-px flex-1 bg-zinc-200" style={{ height: '1px', flex: 1, backgroundColor: '#e4e4e7' }}></div>
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-3" style={{ fontSize: '12px', fontWeight: 900, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Camera className="w-4 h-4" /> Evidências Fotográficas
                  </h3>
                  <div className="h-px flex-1 bg-zinc-200" style={{ height: '1px', flex: 1, backgroundColor: '#e4e4e7' }}></div>
                </div>
                <div className="flex flex-wrap gap-6 pb-12" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                  {ticket.photoBefore && (
                    <div className="rounded-3xl overflow-hidden border border-zinc-200 break-inside-avoid relative bg-zinc-50 p-2 shadow-sm" style={{ width: 'calc(50% - 12px)', borderRadius: '24px', border: '1px solid #e4e4e7', overflow: 'hidden', position: 'relative', backgroundColor: '#fafafa', padding: '8px' }}>
                      <img src={ticket.photoBefore} alt="Antes" className="w-full h-64 object-cover rounded-2xl" style={{ width: '100%', height: '256px', objectFit: 'cover', borderRadius: '16px' }} />
                      <div className="absolute top-6 left-6 bg-red-600 px-3 py-1.5 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2" style={{ position: 'absolute', top: '24px', left: '24px', backgroundColor: '#dc2626', padding: '6px 12px', borderRadius: '8px', color: '#fff', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div> Antes do Atendimento
                      </div>
                    </div>
                  )}
                  {ticket.images?.map((img, index) => (
                    <div key={index} className="rounded-3xl overflow-hidden border border-zinc-200 break-inside-avoid bg-zinc-50 p-2 shadow-sm relative" style={{ width: 'calc(50% - 12px)', borderRadius: '24px', border: '1px solid #e4e4e7', overflow: 'hidden', position: 'relative', backgroundColor: '#fafafa', padding: '8px' }}>
                      <img src={img} alt={`Depois ${index + 1}`} className="w-full h-64 object-cover rounded-2xl" style={{ width: '100%', height: '256px', objectFit: 'cover', borderRadius: '16px' }} />
                      <div className="absolute top-6 left-6 bg-black px-3 py-1.5 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2" style={{ position: 'absolute', top: '24px', left: '24px', backgroundColor: '#000', padding: '6px 12px', borderRadius: '8px', color: '#fff', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> {index === 0 ? 'Serviço Concluído' : `Registro ${index + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div style={{ height: '40px', color: 'transparent', overflow: 'hidden' }} className="print:hidden">.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
