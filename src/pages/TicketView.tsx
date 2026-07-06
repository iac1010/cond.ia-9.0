import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { Download, Printer, Edit, CheckCircle2, XCircle, DollarSign, Camera, MapPin, User, MessageSquare, Plus, QrCode, Share2, Sparkles, Wrench, ClipboardList, AlertCircle, Package, FileText, Palette } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { safeFormatDate } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import CustomReportModal from '../components/CustomReportModal';

export default function TicketView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, clients, checklistItems, companyLogo, companyData, companySignature, updateTicket, addTicketHistory } = useStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);
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
      toast.error(`Erro ao gerar PDF: ${errorMsg}. Tente usar o botão "Imprimir" no topo da página como alternativa.`);
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

            // Products/Materials
            ...((ticket.productsForQuote || (ticket.usedMaterials && ticket.usedMaterials.length > 0)) ? [
              new Paragraph({ children: [new TextRun({ text: "PRODUTOS / MATERIAIS NECESSÁRIOS", size: 20, bold: true, color: "000000" })], spacing: { after: 100 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "E4E4E7" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "E4E4E7" }, left: { style: BorderStyle.SINGLE, size: 4, color: "E4E4E7" }, right: { style: BorderStyle.SINGLE, size: 4, color: "E4E4E7" } },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          ...(ticket.productsForQuote ? ticket.productsForQuote.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, bold: true, size: 22 })] })) : []),
                          ...(ticket.usedMaterials ? ticket.usedMaterials.map(m => new Paragraph({ children: [new TextRun({ text: `${m.quantity} - ${m.name}${m.price ? ` R$ ${m.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`, bold: true, size: 22 })] })) : []),
                        ],
                        shading: { fill: "F9FAFB" },
                        margins: { top: 200, bottom: 200, left: 200, right: 200 },
                      })
                    ]
                  })
                ]
              }),
              new Paragraph({ text: "", spacing: { after: 200 } }),
            ] : []),

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
                window.dispatchEvent(new CustomEvent('vivian-analyze-ticket', { detail: { ticketId: ticket.id } }));
              }}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 px-4 py-2 rounded-lg text-sm font-black transition-colors flex items-center gap-2 border border-amber-500/20 backdrop-blur-md shadow-lg group/vivian"
              title="Análise Avançada com Vivian"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover/vivian:scale-110 transition-transform" /> 
              Vivian Analisar
            </button>
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
              onClick={() => setIsCustomReportModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-lg transform active:scale-95"
            >
              <Palette className="w-4 h-4" /> PDF Customizado
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
            className="bg-white text-zinc-900 p-8 md:p-10 print:p-0 print:w-full print:mx-auto pdf-content font-sans"
            style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', backgroundColor: '#ffffff', color: '#18181b', position: 'relative', display: 'flex', flexDirection: 'column' }}
          >
            {/* Top Accent Line */}
            <div className="h-1.5 w-full bg-black mb-4 shrink-0" style={{ height: '6px', backgroundColor: '#000', marginBottom: '16px' }}></div>

            {/* Header Section */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-zinc-200 break-inside-avoid shrink-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="flex gap-4 items-center flex-1" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {companyLogo ? (
                  <div className="bg-white p-1 rounded-lg border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden" style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={companyLogo} alt="Logo" style={{ height: 'auto', width: '80px', maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div className="w-[90px] h-[90px] bg-black rounded-lg flex items-center justify-center shadow-lg shrink-0" style={{ width: '90px', height: '90px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wrench className="w-9 h-9 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-black leading-tight mb-2 uppercase tracking-tighter" style={{ fontWeight: 900, margin: 0, marginBottom: '4px' }}>
                    {companyData?.name || 'IA COMPANY'}
                  </h2>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider" style={{ fontWeight: 700, fontSize: '8px' }}>
                      CNPJ: {companyData?.document || '---'}
                    </p>
                    <p className="text-[8px] font-bold text-zinc-400" style={{ fontWeight: 700, fontSize: '8px' }}>
                      {companyData?.email || 'contato@iacompany.com'}
                    </p>
                    <p className="text-[8px] font-bold text-zinc-400" style={{ fontWeight: 700, fontSize: '8px' }}>
                      {companyData?.phone || '(00) 0000-0000'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col justify-between items-end" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div className="flex flex-col items-end">
                  <div className="w-16 h-2 bg-black mb-2" style={{ width: '64px', height: '8px', backgroundColor: '#000' }}></div>
                  <h1 className="text-2xl font-black tracking-tighter text-black uppercase leading-none mb-2" style={{ fontWeight: 900, fontSize: '24px', letterSpacing: '-0.05em' }}>
                    {ticket.type === 'CORRETIVA' ? 'CORRETIVA' : ticket.type}
                  </h1>
                </div>
                <div className="flex flex-col gap-0.5 items-end pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest" style={{ fontWeight: 900, fontSize: '8px' }}>Protocolo</span>
                    <span className="text-[11px] font-black text-black" style={{ fontWeight: 900 }}>#{ticket.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest" style={{ fontWeight: 900, fontSize: '8px' }}>Emissão</span>
                    <span className="text-[11px] font-black text-black" style={{ fontWeight: 900 }}>{safeFormatDate(ticket.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Tech Boxes */}
            <div className="flex border border-black rounded-xl overflow-hidden mb-4 break-inside-avoid shrink-0" style={{ display: 'flex', border: '1px solid #000', borderRadius: '12px', overflow: 'hidden' }}>
              <div className="flex-1 bg-white p-3 border-r border-black" style={{ flex: 1, padding: '12px', borderRight: '1px solid #000' }}>
                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '7px' }}>Status Final</p>
                <div className="flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className={`w-1.5 h-1.5 ${ticket.status === 'CONCLUIDO' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: '6px', height: '6px' }}></div>
                  <span className="font-black text-black text-xs uppercase" style={{ fontWeight: 900 }}>— {ticket.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex-1 bg-white p-3 border-r border-black" style={{ flex: 1, padding: '12px', borderRight: '1px solid #000' }}>
                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '7px' }}>Técnico Encarregado</p>
                <div className="flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="font-black text-black text-[10px] uppercase" style={{ fontWeight: 900 }}>{ticket.technician}</span>
                </div>
              </div>
              <div className="flex-1 bg-black p-3" style={{ flex: 1, backgroundColor: '#000' }}></div>
            </div>

            {/* Client & QR Row */}
            <div className="flex gap-4 mb-4 items-stretch break-inside-avoid shrink-0" style={{ display: 'flex', gap: '16px' }}>
              <div className="flex-1 bg-white p-5 rounded-[1.5rem] border-2 border-black flex flex-col relative overflow-hidden" style={{ flex: 1, padding: '20px', borderRadius: '24px', border: '2px solid #000' }}>
                <h3 className="text-[7px] font-black uppercase tracking-widest text-black mb-3" style={{ fontWeight: 900, fontSize: '7px' }}>DADOS DO CLIENTE / SOLICITANTE</h3>
                <div>
                  <p className="text-xl font-black text-black leading-tight mb-3 uppercase" style={{ fontWeight: 900 }}>{client?.name || '---'}</p>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    <div>
                      <p className="text-[7px] font-black text-black uppercase tracking-widest mb-0.5" style={{ fontWeight: 900, fontSize: '7px' }}>CNPJ / CPF</p>
                      <p className="text-[10px] font-black text-black" style={{ fontWeight: 900, fontSize: '10px' }}>{client?.document || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-black uppercase tracking-widest mb-0.5" style={{ fontWeight: 900, fontSize: '7px' }}>Contato</p>
                      <p className="text-[10px] font-black text-black" style={{ fontWeight: 900, fontSize: '10px' }}>{client?.contactPerson || client?.phone || '---'}</p>
                    </div>
                    <div className="col-span-2" style={{ gridColumn: 'span 2' }}>
                      <p className="text-[7px] font-black text-black uppercase tracking-widest mb-0.5" style={{ fontWeight: 900, fontSize: '7px' }}>Localização do Serviço</p>
                      <div className="flex items-start gap-1.5" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <MapPin className="w-2.5 h-2.5 text-black mt-0.5" />
                        <p className="text-[10px] font-black text-black leading-tight" style={{ fontWeight: 900, fontSize: '10px' }}>
                          {client?.address || '---'} {ticket.location ? ` - ${ticket.location}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-[140px] flex flex-col items-center justify-center p-4 border-2 border-black rounded-[1.5rem] bg-white text-center" style={{ width: '140px', padding: '16px', border: '2px solid #000', borderRadius: '24px' }}>
                <div className="mb-2 bg-white">
                  <QRCodeSVG 
                    value={`${window.location.origin}/tickets/${ticket.id}`} 
                    size={70}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[7px] font-black text-black uppercase tracking-widest leading-none" style={{ fontWeight: 900, fontSize: '7px' }}>
                  VALIDAÇÃO DIGITAL
                </p>
              </div>
            </div>

            {/* Service Content */}
            <div className="flex-1 space-y-4 overflow-hidden" style={{ marginTop: '12px' }}>
              {/* Problem Section */}
              <div className="relative pl-4 break-inside-avoid" style={{ position: 'relative', paddingLeft: '16px', borderLeft: '3px solid #000' }}>
                <h3 className="text-[8px] font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ fontWeight: 900, fontSize: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle className="w-3 h-3" /> Descrição do Chamado
                </h3>
                <div className="space-y-0.5">
                  {ticket.reportedProblem ? (
                    ticket.reportedProblem.split('\n').map((line, i) => (
                      <p key={i} className="text-black text-xs leading-tight font-bold" style={{ fontWeight: 700, fontSize: '12px', margin: 0 }}>
                        — {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-[10px] italic" style={{ fontStyle: 'italic', fontSize: '10px' }}>Sem descrição detalhada.</p>
                  )}
                </div>
              </div>

              {/* Service Report */}
              {ticket.serviceReport && (
                <div className="break-inside-avoid">
                  <h3 className="text-[8px] font-black text-black uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '8px' }}>RELATÓRIO TÉCNICO DE EXECUÇÃO</h3>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl" style={{ padding: '12px', backgroundColor: '#fcfcfc', border: '1px solid #e4e4e7', borderRadius: '12px' }}>
                    <p className="text-black text-xs font-bold leading-relaxed" style={{ fontWeight: 700, fontSize: '12px' }}>
                      {ticket.serviceReport}
                    </p>
                  </div>
                </div>
              )}

              {/* Products/Materials */}
              {(ticket.productsForQuote || (ticket.usedMaterials && ticket.usedMaterials.length > 0)) && (
                <div className="break-inside-avoid">
                  <h3 className="text-[8px] font-black text-black uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '8px' }}>PRODUTOS / MATERIAIS NECESSÁRIOS</h3>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl" style={{ padding: '12px', backgroundColor: '#fcfcfc', border: '1px solid #e4e4e7', borderRadius: '12px' }}>
                    {ticket.productsForQuote && (
                      <div className={`space-y-0.5 ${ticket.usedMaterials && ticket.usedMaterials.length > 0 ? 'mb-2' : ''}`}>
                        {ticket.productsForQuote.split('\n').map((line, i) => (
                          <p key={i} className="text-black text-xs leading-tight font-bold" style={{ fontWeight: 700, fontSize: '12px', margin: 0 }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                    {ticket.usedMaterials && ticket.usedMaterials.length > 0 && (
                      <div className="space-y-0.5">
                        {ticket.usedMaterials.map((m, i) => (
                          <p key={i} className="text-black text-xs leading-tight font-bold" style={{ fontWeight: 700, fontSize: '12px', margin: 0 }}>
                            {m.quantity} - {m.name} {m.price ? ` R$ ${m.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {ticket.checklistResults && ticket.checklistResults.length > 0 && (
                <div className="break-inside-avoid">
                  <h3 className="text-[8px] font-black text-black uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '8px' }}>ITENS VERIFICADOS</h3>
                  <div className="grid grid-cols-2 gap-1.5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {ticket.checklistResults.map((result, i) => {
                      const item = checklistItems.find(it => it.id === result.taskId);
                      return (
                        <div key={i} className="flex items-center justify-between p-1.5 bg-zinc-50 rounded-lg border border-zinc-100" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', backgroundColor: '#fcfcfc', border: '1px solid #f4f4f5', borderRadius: '6px' }}>
                          <span className="text-[9px] font-bold text-zinc-600 truncate mr-2" style={{ fontWeight: 700, fontSize: '9px' }}>{item?.task || 'Tarefa'}</span>
                          <span className={`text-[8px] font-black px-1 py-0.5 rounded ${result.status === 'OK' ? 'bg-emerald-500 text-white' : result.status === 'NOK' ? 'bg-red-500 text-white' : 'bg-zinc-300 text-zinc-600'}`} style={{ fontSize: '8px', fontWeight: 900 }}>
                            {result.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observations */}
              <div className="bg-white p-4 rounded-[1rem] border-2 border-black break-inside-avoid" style={{ padding: '16px', borderRadius: '16px', border: '2px solid #000', backgroundColor: '#fff' }}>
                <h3 className="text-[8px] font-black text-black uppercase tracking-widest mb-1.5" style={{ fontWeight: 900, fontSize: '8px' }}>OBSERVAÇÕES E NOTAS</h3>
                <p className="text-black text-xs font-black italic" style={{ fontWeight: 900, fontSize: '12px', fontStyle: 'italic' }}>
                  "{ticket.observations || (ticket.budgetAmount ? `Mão de Obra: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket.budgetAmount)}` : 'Nenhuma observação adicional registrada pelo técnico.')}"
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 border-t-2 border-black flex justify-between gap-12 break-inside-avoid shrink-0" style={{ marginTop: '32px', paddingTop: '16px', borderTop: '2px solid #000', display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
              <div className="text-center flex flex-col items-center flex-1 relative" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                <div className="h-16 flex items-end justify-center w-full relative mb-1" style={{ height: '64px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', position: 'relative', marginBottom: '4px' }}>
                  {companySignature && (
                    <img 
                      src={companySignature} 
                      alt="Signature" 
                      className="max-h-20 w-auto object-contain absolute bottom-0 -translate-y-1 opacity-95" 
                      style={{ maxHeight: '80px', width: 'auto', position: 'absolute', bottom: 0, transform: 'translateY(-4px)', opacity: 0.95 }}
                    />
                  )}
                  <div className="w-full border-t border-black" style={{ width: '100%', borderTop: '1px solid #000' }}></div>
                </div>
                <p className="text-sm font-black text-black leading-none uppercase tracking-tighter" style={{ fontWeight: 900, fontSize: '14px' }}>IA COMPANY</p>
                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mt-1" style={{ fontWeight: 900, fontSize: '7px' }}>ASSINATURA DO TÉCNICO</p>
              </div>
              
              <div className="text-center flex flex-col items-center flex-1" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div className="h-16 flex items-end justify-center w-full mb-1" style={{ height: '64px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', marginBottom: '4px' }}>
                  <div className="w-full border-t border-black" style={{ width: '100%', borderTop: '1px solid #000' }}></div>
                </div>
                <p className="text-sm font-black text-black leading-none uppercase tracking-tighter truncate max-w-full" style={{ fontWeight: 900, fontSize: '14px' }}>
                  {client?.name?.substring(0, 30) || 'CLIENTE / RESPONSÁVEL'}
                </p>
                <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mt-1" style={{ fontWeight: 900, fontSize: '7px' }}>APROVAÇÃO / RECEBIMENTO</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-100 flex justify-between items-center break-inside-avoid shrink-0" style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="text-[7px] font-bold text-zinc-300 uppercase tracking-widest">
                VERIFICAÇÃO DIGITAL - SISTEMA CONDOMÍNIO v4.0
              </p>
              <p className="text-[7px] font-black text-zinc-900 uppercase tracking-widest">
                 DOCUMENTO ELETRÔNICO PÁGINA 1 DE 1
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <CustomReportModal 
        isOpen={isCustomReportModalOpen} 
        onClose={() => setIsCustomReportModalOpen(false)} 
        ticket={ticket} 
        client={client} 
      />
    </div>
  );
}
