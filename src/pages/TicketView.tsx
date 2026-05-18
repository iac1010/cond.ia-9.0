import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { Download, Printer, Edit, CheckCircle2, XCircle, DollarSign, Camera, MapPin, User, MessageSquare, Plus, QrCode, Share2, Sparkles, Wrench, ClipboardList, AlertCircle, Package, FileText } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { safeFormatDate } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

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

  const handleDownloadWord = async () => {
    setIsGenerating(true);
    try {
      const logoImage = companyLogo ? await fetch(companyLogo).then(r => r.arrayBuffer()).then(ab => new Uint8Array(ab)).catch(() => null) : null;
      const signatureImage = companySignature ? await fetch(companySignature).then(r => r.arrayBuffer()).then(ab => new Uint8Array(ab)).catch(() => null) : null;

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children: [
            // Top Accent Line
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [new TableRow({ children: [new TableCell({ children: [], shading: { fill: "000000" }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } })] })],
            }),

            new Paragraph({ text: "", spacing: { after: 100 } }),

            // Header Section
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } ,
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 60, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                      children: [
                        new Table({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          rows: [
                            new TableRow({
                              children: [
                                ...(logoImage ? [new TableCell({
                                  children: [new Paragraph({ children: [new ImageRun({ data: logoImage, transformation: { width: 80, height: 80 } } as any)] })],
                                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                  width: { size: 100, type: WidthType.DXA },
                                })] : []),
                                new TableCell({
                                  children: [
                                    new Paragraph({ children: [new TextRun({ text: companyData?.name || 'IA COMPANY SOFTWARE E AUTOMAÇÃO LTDA', bold: true, size: 28 })] }),
                                    new Paragraph({ children: [new TextRun({ text: `CNPJ: ${companyData?.document || '---'}`, size: 16, color: "666666", allCaps: true, bold: true })] }),
                                    new Paragraph({ children: [new TextRun({ text: companyData?.email || '---', size: 16, color: "666666" })] }),
                                    new Paragraph({ children: [new TextRun({ text: companyData?.phone || '---', size: 16, color: "666666" })] }),
                                  ],
                                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                  verticalAlign: VerticalAlign.CENTER,
                                }),
                              ]
                            })
                          ]
                        })
                      ],
                    }),
                    new TableCell({
                      width: { size: 40, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "        ", shading: { fill: "000000" } })], alignment: AlignmentType.RIGHT }),
                        new Paragraph({ children: [new TextRun({ text: ticket.type === 'CORRETIVA' ? 'CORRETIVA' : ticket.type, bold: true, size: 48 })], alignment: AlignmentType.RIGHT }),
                        new Paragraph({ children: [new TextRun({ text: "Protocolo ", size: 16, color: "999999", bold: true, allCaps: true }), new TextRun({ text: `#${ticket.id.substring(0, 8).toUpperCase()}`, bold: true, size: 20 })], alignment: AlignmentType.RIGHT }),
                        new Paragraph({ children: [new TextRun({ text: "Emissão ", size: 16, color: "999999", bold: true, allCaps: true }), new TextRun({ text: safeFormatDate(ticket.date), bold: true, size: 20 })], alignment: AlignmentType.RIGHT }),
                      ],
                      verticalAlign: VerticalAlign.TOP,
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 200 } }),

            // Status & Tech Row
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 2 }, bottom: { style: BorderStyle.SINGLE, size: 2 }, left: { style: BorderStyle.SINGLE, size: 2 }, right: { style: BorderStyle.SINGLE, size: 2 } },
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "STATUS FINAL", size: 16, bold: true, color: "999999" })] }),
                        new Paragraph({ children: [new TextRun({ text: `— ${ticket.status}`, bold: true, size: 24 })] }),
                      ],
                      shading: { fill: "FFFFFF" },
                      margins: { top: 200, bottom: 200, left: 200 },
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "TÉCNICO ENCARREGADO", size: 16, bold: true, color: "999999" })] }),
                        new Paragraph({ children: [new TextRun({ text: ticket.technician, bold: true, size: 24 })] }),
                      ],
                      shading: { fill: "FFFFFF" },
                      margins: { top: 200, bottom: 200, left: 200 },
                    }),
                    new TableCell({
                      width: { size: 40, type: WidthType.PERCENTAGE },
                      children: [],
                      shading: { fill: "000000" },
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 200 } }),

            // Client Box
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { 
                top: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, 
                bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, 
                left: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, 
                right: { style: BorderStyle.SINGLE, size: 12, color: "000000" } 
              },
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "NOME DO CLIENTE / SOLICITANTE", size: 16, bold: true, color: "000000" })], spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: client?.name || '---', bold: true, size: 36 })], spacing: { after: 200 } }),
                        new Table({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          rows: [
                            new TableRow({
                              children: [
                                new TableCell({
                                  children: [new Paragraph({ children: [new TextRun({ text: "CNPJ / CPF", size: 16, bold: true })] }), new Paragraph({ children: [new TextRun({ text: client?.document || '---', bold: true, size: 18 })] })],
                                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                                new TableCell({
                                  children: [new Paragraph({ children: [new TextRun({ text: "CONTATO", size: 16, bold: true })] }), new Paragraph({ children: [new TextRun({ text: client?.contactPerson || client?.phone || '---', bold: true, size: 18 })] })],
                                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                              ]
                            }),
                            new TableRow({
                              children: [
                                new TableCell({
                                  columnSpan: 2,
                                  children: [new Paragraph({ children: [new TextRun({ text: "ENDEREÇO DE ATENDIMENTO", size: 16, bold: true })] }), new Paragraph({ children: [new TextRun({ text: `${client?.address || '---'} ${ticket.location ? ` - ${ticket.location}` : ''}`, bold: true, size: 18 })] })],
                                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                              ]
                            })
                          ]
                        })
                      ],
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    })
                  ]
                })
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 200 } }),

            // Problem Reported
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { left: { style: BorderStyle.SINGLE, size: 40, color: "000000" }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "PROBLEMA RELATADO", size: 20, bold: true, color: "000000" })], spacing: { after: 100 } }),
                        ...(ticket.reportedProblem ? ticket.reportedProblem.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: `- ${line}`, bold: true, size: 22 })] })) : [new Paragraph({ text: "Nenhum problema detalhado." })]),
                      ],
                      margins: { left: 400 },
                    })
                  ]
                })
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 200 } }),

            // Service Report
            new Paragraph({ children: [new TextRun({ text: "RELATO DO SERVIÇO", size: 20, bold: true, color: "000000" })], spacing: { after: 100 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.DASHED, size: 12, color: "CCCCCC" }, bottom: { style: BorderStyle.DASHED, size: 12, color: "CCCCCC" }, left: { style: BorderStyle.DASHED, size: 12, color: "CCCCCC" }, right: { style: BorderStyle.DASHED, size: 12, color: "CCCCCC" } },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: ticket.serviceReport || "Nenhum relato registrado.", bold: true, size: 22 })] })],
                      shading: { fill: "F9FAFB" },
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    })
                  ]
                })
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 200 } }),

            // Observations Box
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 12, color: "000000" } },
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "COMENTÁRIOS ADICIONAIS", size: 18, bold: true, color: "000000" })], spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: `"${ticket.observations || (ticket.budgetAmount ? `Valor de Mão de Obra R$ ${ticket.budgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Nenhuma observação adicional')}"`, italics: true, bold: true, size: 22 })] }),
                      ],
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    })
                  ]
                })
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 600 } }),

            // Signatures
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      children: [
                        ...(signatureImage ? [new Paragraph({ children: [new ImageRun({ data: signatureImage, transformation: { width: 120, height: 60 } } as any)], alignment: AlignmentType.CENTER })] : [new Paragraph({ text: "", spacing: { before: 400 } })]),
                        new Table({ width: { size: 80, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ticket.technician, bold: true, size: 24 })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Assinatura do Técnico", size: 16, bold: true, allCaps: true })], alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } })] })], alignment: AlignmentType.CENTER }),
                      ],
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "", spacing: { before: 400 } }),
                        new Table({ width: { size: 80, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: client?.name.substring(0, 30) || '---', bold: true, size: 24 })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "APROVAÇÃO / RECEBIMENTO", size: 16, bold: true, allCaps: true })], alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } })] })], alignment: AlignmentType.CENTER }),
                      ],
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ]
                })
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Footer
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `GERADO ELETRONICAMENTE EM ${new Date().toLocaleDateString('pt-BR')} ÀS ${new Date().toLocaleTimeString('pt-BR')}`, size: 12, color: "CCCCCC", bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${companyData?.name || 'IA COMPANY'} • PLATAFORMA INTEGRADA`, size: 12, color: "999999", bold: true, allCaps: true })], alignment: AlignmentType.RIGHT })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                  ]
                })
              ]
            })
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const dateStr = safeFormatDate(ticket.date).replace(/\//g, '-');
      const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Tarefa';
      const fileName = ticket.type === 'TAREFA' ? `Tarefa_${safeName}_${dateStr}.docx` : `OS_${ticket.type}_${safeName}_${dateStr}.docx`;
      
      saveAs(blob, fileName);
      toast.success('Arquivo Word gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar Word:', error);
      toast.error('Erro ao gerar arquivo Word.');
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
              onClick={handleDownloadWord}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <FileText className="w-4 h-4" /> {isGenerating ? 'Gerando...' : 'Baixar Word'}
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
            style={{ width: '794px', minHeight: '1123px', margin: '0 auto', backgroundColor: '#ffffff', color: '#18181b', position: 'relative' }}
          >
            {/* Top Accent Line */}
            <div className="h-2 w-full bg-black mb-6" style={{ height: '8px', backgroundColor: '#000', marginBottom: '24px' }}></div>

            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-200 break-inside-avoid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="flex gap-6 items-center flex-1" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {companyLogo ? (
                  <div className="bg-white p-1 rounded-xl border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden" style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={companyLogo} alt="Logo" style={{ height: 'auto', width: '110px', maxWidth: '110px', maxHeight: '110px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div className="w-[120px] h-[120px] bg-black rounded-xl flex items-center justify-center shadow-lg shrink-0" style={{ width: '120px', height: '120px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wrench className="w-12 h-12 text-white" />
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
            <div className="space-y-6" style={{ marginTop: '24px' }}>
              {/* Problema Relatado */}
              <div className="relative pl-6 break-inside-avoid" style={{ position: 'relative', paddingLeft: '24px', borderLeft: '4px solid #000' }}>
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ fontWeight: 900, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle className="w-4 h-4" /> Problema Relatado
                </h3>
                <div className="space-y-1">
                  {ticket.reportedProblem ? (
                    ticket.reportedProblem.split('\n').map((line, i) => (
                      <p key={i} className="text-black text-sm leading-relaxed font-bold" style={{ fontWeight: 700, fontSize: '14px', margin: 0, marginBottom: '2px' }}>
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
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ fontWeight: 900, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList className="w-4 h-4" /> Histórico de Campo
                </h3>
                <div className="p-5 border-2 border-dashed border-zinc-300 rounded-[1.5rem] text-center bg-zinc-50/30" style={{ padding: '20px', border: '2px dashed #d4d4d8', borderRadius: '24px', backgroundColor: '#fafafa' }}>
                  {ticket.history && ticket.history.length > 0 ? (
                    <div className="text-left space-y-3" style={{ textAlign: 'left' }}>
                      {ticket.history.map(entry => (
                        <div key={entry.id} className="pb-2 border-b border-zinc-100 last:border-0 last:pb-0" style={{ paddingBottom: '8px', borderBottom: '1px solid #f4f4f5' }}>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5" style={{ fontWeight: 900, fontSize: '9px', color: '#a1a1aa' }}>
                            {safeFormatDate(entry.date)} • {entry.userName}
                          </p>
                          <p className="text-xs font-bold text-black" style={{ fontWeight: 700, fontSize: '12px' }}>{entry.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic font-bold" style={{ fontStyle: 'italic', fontWeight: 700, color: '#a1a1aa' }}>Nenhum evento registrado no histórico</p>
                  )}
                </div>
              </div>

              {/* Comentários Adicionais */}
              <div className="bg-white p-6 rounded-[2rem] border-2 border-black break-inside-avoid shadow-inner" style={{ padding: '24px', borderRadius: '32px', border: '2px solid #000', backgroundColor: '#fff' }}>
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-3" style={{ fontWeight: 900, fontSize: '10px' }}>COMENTÁRIOS ADICIONAIS</h3>
                <p className="text-black text-sm font-black italic" style={{ fontWeight: 900, fontSize: '14px', fontStyle: 'italic' }}>
                  "{ticket.observations || (ticket.budgetAmount ? `Valor de Mão de Obra R$ ${ticket.budgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Nenhuma observação adicional')}"
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-12 pt-8 border-t-2 border-black flex justify-between gap-20 break-inside-avoid shadow-[0_-20px_20px_-20px_rgba(0,0,0,0.05)]" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid #000', display: 'flex', justifyContent: 'space-between', gap: '80px', breakInside: 'avoid' }}>
              <div className="text-center flex flex-col items-center flex-1 relative" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                <div className="h-24 flex items-end justify-center mb-1 w-full relative" style={{ height: '96px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px', position: 'relative' }}>
                  {companySignature && (
                    <img 
                      src={companySignature} 
                      alt="Assinatura" 
                      className="max-h-32 w-auto object-contain absolute bottom-0 -translate-y-2 opacity-95"
                      style={{ maxHeight: '128px', width: 'auto', opacity: 0.95, position: 'absolute', bottom: 0, transform: 'translateY(-8px)' }} 
                    />
                  )}
                  <div className="w-full border-t-2 border-black/20" style={{ width: '100%', borderTop: '2px solid rgba(0,0,0,0.1)' }}></div>
                </div>
                <div className="w-full pt-4">
                  <p className="text-lg font-black text-black leading-none mb-1" style={{ fontWeight: 900, fontSize: '18px' }}>{ticket.technician}</p>
                  <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]" style={{ fontWeight: 900, fontSize: '10px' }}>Assinatura do Técnico</p>
                </div>
              </div>
              <div className="text-center flex flex-col items-center flex-1" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div className="h-24 flex items-end justify-center mb-1 w-full" style={{ height: '96px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                  <div className="w-full border-t-2 border-black/20" style={{ width: '100%', borderTop: '2px solid rgba(0,0,0,0.1)' }}></div>
                </div>
                <div className="w-full pt-4">
                  <p className="text-lg font-black text-black leading-none mb-1" style={{ fontWeight: 900, fontSize: '18px' }}>{client.name.substring(0, 30)}</p>
                  <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]" style={{ fontWeight: 900, fontSize: '10px' }}>APROVAÇÃO / RECEBIMENTO</p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="mt-10 pt-4 border-t border-zinc-200 flex justify-between items-center break-inside-avoid" style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <div className="mt-12 pt-10" style={{ marginTop: '48px', paddingTop: '40px', pageBreakBefore: 'always', breakBefore: 'page' }}>
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
