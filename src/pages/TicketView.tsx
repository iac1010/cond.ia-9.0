import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { Download, Printer, Edit, CheckCircle2, XCircle, DollarSign, Camera, MapPin, User, MessageSquare, Plus, QrCode, Share2, Sparkles, Wrench, ClipboardList } from 'lucide-react';
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
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
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
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
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
            className="bg-white text-zinc-900 p-6 md:p-12 print:p-0 print:w-full print:max-w-[210mm] print:mx-auto pdf-content"
          >
        {/* Cabeçalho do Relatório */}
        <div className="border-b-4 border-emerald-600 flex justify-between items-end pb-8 mb-8 break-inside-avoid page-break-inside-avoid">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="h-20 w-auto object-contain rounded-xl shadow-sm" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight leading-none mb-1">
                {companyData?.name || 'IA COMPANY'}
              </h2>
              <p className="text-sm font-medium text-zinc-500 mt-1">CNPJ: {companyData?.document || '---'}</p>
              <p className="text-sm font-medium text-zinc-500">{companyData?.email || 'contato@empresa.com'}</p>
              <p className="text-sm font-medium text-zinc-500">{companyData?.phone || '(00) 0000-0000'}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black tracking-tighter text-emerald-700 uppercase mb-4">
              {ticket.type === 'CORRETIVA' ? 'OS Corretiva' : 'OS Preventiva'}
            </h2>
            <div className="flex flex-col gap-1 text-right">
              <p className="text-sm font-bold text-zinc-800">
                <span className="text-zinc-400 uppercase tracking-widest text-xs mr-2">Nº</span>
                {ticket.id.substring(0, 8).toUpperCase()}
              </p>
              <p className="text-sm font-bold text-zinc-800">
                <span className="text-zinc-400 uppercase tracking-widest text-xs mr-2">Data</span>
                {safeFormatDate(ticket.date)}
              </p>
              <p className="text-sm font-bold text-zinc-800">
                <span className="text-zinc-400 uppercase tracking-widest text-xs mr-2">Técnico</span>
                {ticket.technician}
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        {client && (
          <div className="mb-10 bg-zinc-50 p-8 rounded-3xl border border-zinc-200 relative overflow-hidden break-inside-avoid page-break-inside-avoid">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Dados do Cliente</h3>
              {ticket.location && (
                <div className="flex items-center gap-1.5 bg-white text-zinc-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-zinc-200 shadow-sm">
                  <MapPin className="w-3 h-3" /> {ticket.location}
                </div>
              )}
            </div>
            <p className="text-3xl font-black text-zinc-900 mb-4">{client.name}</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm text-zinc-600">
              <p><span className="font-semibold text-zinc-400 w-16 inline-block">DOC:</span> {client.document || '-'}</p>
              <p><span className="font-semibold text-zinc-400 w-16 inline-block">TEL:</span> {client.phone}</p>
              <p><span className="font-semibold text-zinc-400 w-16 inline-block">RESP:</span> {client.contactPerson || '-'}</p>
              <p><span className="font-semibold text-zinc-400 w-16 inline-block">EMAIL:</span> {client.email || '-'}</p>
              <p className="col-span-2 mt-2"><span className="font-semibold text-zinc-400 w-16 inline-block">END:</span> {client.address}</p>
            </div>
          </div>
        )}

        {/* Informações do Relatante (QR Code) */}
        {(ticket.reportedBy || ticket.budgetAmount) && (
          <div className="mb-10 flex gap-6 break-inside-avoid page-break-inside-avoid">
            {ticket.reportedBy && (
              <div className="flex-1 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Relatado por (Unidade/Nome)</p>
                  <p className="font-bold text-zinc-900 text-xl">{ticket.reportedBy}</p>
                </div>
              </div>
            )}
            {ticket.budgetAmount && (
              <div className="flex-1 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <DollarSign className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Orçamento Aprovado</p>
                  <p className="font-black text-zinc-900 text-2xl">R$ {ticket.budgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            )}
            <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm shrink-0 flex items-center justify-center">
              <QRCodeSVG 
                value={`${window.location.origin}/tickets/${ticket.id}`} 
                size={72}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
        )}

        {/* Conteúdo Específico */}
        <div className="space-y-10">
          {/* Problema Relatado (Corretiva) */}
          {ticket.reportedProblem && (
            <div className="break-inside-avoid page-break-inside-avoid bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Problema Relatado
              </h3>
              <p className="text-zinc-800 whitespace-pre-wrap text-lg leading-relaxed">{ticket.reportedProblem}</p>
            </div>
          )}

          {/* Relato da Manutenção (Corretiva) */}
          {ticket.serviceReport && (
            <div className="break-inside-avoid page-break-inside-avoid bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Relato da Manutenção
              </h3>
              <p className="text-zinc-800 whitespace-pre-wrap text-lg leading-relaxed">{ticket.serviceReport}</p>
            </div>
          )}

          {/* Resultados do Checklist */}
          {ticket.checklistResults && ticket.checklistResults.length > 0 && (
            <div className="break-inside-avoid page-break-inside-avoid">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-500" /> Resultados do Checklist
              </h3>
              <div className="overflow-hidden border border-zinc-200 rounded-3xl shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500">
                      <th className="p-5 font-black uppercase tracking-widest border-b border-zinc-200">Tarefa Verificada</th>
                      <th className="p-5 font-black uppercase tracking-widest border-b border-zinc-200 w-32 text-center">Status</th>
                      <th className="p-5 font-black uppercase tracking-widest border-b border-zinc-200">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {ticket.checklistResults.map(result => {
                      const item = checklistItems.find(i => i.id === result.taskId);
                      return (
                        <tr key={result.taskId} className="break-inside-avoid">
                          <td className="p-5 text-zinc-900 font-bold text-base">{item?.task || 'Tarefa removida'}</td>
                          <td className="p-5 text-center">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block w-full ${
                              result.status === 'OK' ? 'bg-emerald-100 text-emerald-700' :
                              result.status === 'NOK' ? 'bg-red-100 text-red-700' :
                              'bg-zinc-100 text-zinc-600'
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="p-5 text-zinc-600 text-base">{result.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Materiais Usados */}
          {ticket.usedMaterials && ticket.usedMaterials.length > 0 && (
            <div className="break-inside-avoid page-break-inside-avoid">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" /> Materiais Utilizados
              </h3>
              <div className="overflow-hidden border border-zinc-200 rounded-3xl shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500">
                      <th className="p-5 font-black uppercase tracking-widest border-b border-zinc-200">Material</th>
                      <th className="p-5 font-black uppercase tracking-widest border-b border-zinc-200 w-32 text-center">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {ticket.usedMaterials.map((material, index) => (
                      <tr key={index} className="break-inside-avoid">
                        <td className="p-5 text-zinc-900 font-bold text-base">{material.name}</td>
                        <td className="p-5 text-center text-zinc-600 font-bold">{material.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Observações Gerais */}
          {ticket.observations && (
            <div className="break-inside-avoid page-break-inside-avoid bg-zinc-50 border border-zinc-200 rounded-3xl p-8">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Observações Gerais</h3>
              <p className="text-zinc-700 whitespace-pre-wrap text-base leading-relaxed">{ticket.observations}</p>
            </div>
          )}

          {/* Histórico de Atendimento */}
          <div className="break-inside-avoid page-break-inside-avoid">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-100 pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Histórico de Atendimento
            </h3>
            <div className="space-y-4 mb-6">
              {ticket.history && ticket.history.length > 0 ? (
                ticket.history.map((entry) => (
                  <div key={entry.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        {entry.userName || 'Sistema'} • {safeFormatDate(entry.date, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-zinc-800">{entry.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400 italic">Nenhum histórico registrado.</p>
              )}
            </div>
            
            <div className="flex gap-3 print:hidden">
              <input 
                type="text" 
                placeholder="Adicionar nota ao histórico..."
                value={historyNote}
                onChange={(e) => setHistoryNote(e.target.value)}
                className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-zinc-900"
              />
              <button 
                onClick={handleAddHistory}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" /> Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Assinaturas */}
        <div className="mt-20 grid grid-cols-2 gap-20 break-inside-avoid page-break-inside-avoid no-break">
          <div className="text-center">
            <div className="flex flex-col items-center mb-2">
              <div className="h-24 flex items-end justify-center w-full">
                {companySignature && (
                  <img src={companySignature} alt="Assinatura" className="max-h-full max-w-full object-contain" />
                )}
              </div>
              <div className="border-t-2 border-zinc-300 w-full pt-2">
                <p className="font-black text-zinc-900 text-xl leading-tight">{ticket.technician}</p>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Técnico Responsável</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="h-24 mb-2"></div>
            <div className="border-t-2 border-zinc-300 w-full pt-2">
              <p className="font-black text-zinc-900 text-xl leading-tight">{client.name}</p>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Cliente / Síndico(a)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-100 text-center break-inside-avoid">
          <p className="text-xs font-medium text-zinc-400">
            Documento gerado por {companyData?.name || 'IA COMPANY'} • {new Date().getFullYear()}
          </p>
        </div>

        {/* Fotos do Serviço (Anexos) */}
        {(ticket.images?.length || 0) > 0 || ticket.photoBefore ? (
          <div className="mt-20 page-break-before-always pt-12">
            <div className="flex items-center gap-4 mb-8 border-b border-zinc-200 pb-4">
              <Camera className="w-6 h-6 text-zinc-400" />
              <h3 className="text-lg font-black text-zinc-800 uppercase tracking-widest">Anexo Fotográfico</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {ticket.photoBefore && (
                <div className="rounded-3xl overflow-hidden border border-zinc-200 break-inside-avoid relative bg-zinc-50 p-2 shadow-sm">
                  <img src={ticket.photoBefore} alt="Foto Inicial" className="w-full h-64 object-cover rounded-2xl" />
                  <div className="absolute top-6 left-6 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
                    <Camera className="w-3.5 h-3.5" /> Antes
                  </div>
                </div>
              )}
              {ticket.images?.map((img, index) => (
                <div key={index} className="rounded-3xl overflow-hidden border border-zinc-200 break-inside-avoid bg-zinc-50 p-2 shadow-sm relative">
                  <img src={img} alt={`Foto ${index + 1}`} className="w-full h-64 object-cover rounded-2xl" />
                  <div className="absolute top-6 left-6 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
                    <Camera className="w-3.5 h-3.5" /> Depois
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
          <div style={{ height: '40px', color: 'transparent', overflow: 'hidden' }}>.</div> {/* Bottom Padding for Page Breaks */}
        </div>
      </div>
    </div>
  </div>
);
}
