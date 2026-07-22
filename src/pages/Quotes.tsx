import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { QuoteItem, Quote, QuoteInstallment } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, Plus, Trash2, Save, FileSpreadsheet, CheckCircle, Clock, XCircle, 
  FileText, Download, Eye, Send, Printer, Wrench, Share2, Mail, MapPin, Copy,
  ChevronDown, ChevronUp, Building, Search, Filter, Layers, UserCheck, RefreshCw
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { generatePdf, sharePdf } from '../utils/pdfGenerator';
import { safeFormatDate } from '../utils/dateUtils';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

function GlassPanel({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl ${className}`}>
      {children}
    </div>
  );
}

export default function Quotes() {
  const navigate = useNavigate();
  const { clients, quotes, products, addQuote, updateQuote, deleteQuote, addReceipt, companyLogo, companyData, companySignature } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [taxValue, setTaxValue] = useState(0);
  const [installments, setInstallments] = useState<QuoteInstallment[]>([]);
  const [observations, setObservations] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteToPrint, setQuoteToPrint] = useState<Quote | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED'>('ALL');
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  const approvedQuotes = useMemo(() => quotes.filter(q => q.status === 'APPROVED'), [quotes]);
  const pendingQuotes = useMemo(() => quotes.filter(q => q.status === 'DRAFT' || q.status === 'SENT'), [quotes]);
  const rejectedQuotes = useMemo(() => quotes.filter(q => q.status === 'REJECTED'), [quotes]);

  const totalValueAll = useMemo(() => quotes.reduce((acc, q) => acc + (q.totalValue || 0), 0), [quotes]);
  const totalValueApproved = useMemo(() => approvedQuotes.reduce((acc, q) => acc + (q.totalValue || 0), 0), [approvedQuotes]);
  const totalValuePending = useMemo(() => pendingQuotes.reduce((acc, q) => acc + (q.totalValue || 0), 0), [pendingQuotes]);

  // Group quotes by client
  const groupedQuotes = useMemo(() => {
    const qText = searchQuery.toLowerCase().trim();

    // Filter quotes first by status and search text
    const filtered = quotes.filter(quote => {
      const client = clients.find(c => c.id === quote.clientId);
      const clientName = client?.name?.toLowerCase() || '';
      const quoteId = quote.id.toLowerCase();
      const obs = (quote.observations || '').toLowerCase();
      const itemMatch = (quote.items || []).some(item => item.description.toLowerCase().includes(qText));

      const matchesSearch = !qText || clientName.includes(qText) || quoteId.includes(qText) || obs.includes(qText) || itemMatch;
      const matchesStatus = statusFilter === 'ALL' || quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Group by clientId
    const map = new Map<string, {
      clientId: string;
      clientName: string;
      clientEmail?: string;
      clientPhone?: string;
      clientDocument?: string;
      clientAddress?: string;
      quotes: Quote[];
      totalValue: number;
      approvedValue: number;
      approvedCount: number;
      pendingCount: number;
      draftCount: number;
      rejectedCount: number;
    }>();

    filtered.forEach(quote => {
      const cid = quote.clientId || 'unregistered';
      const client = clients.find(c => c.id === cid);

      if (!map.has(cid)) {
        map.set(cid, {
          clientId: cid,
          clientName: client?.name || 'Cliente Geral / Não Identificado',
          clientEmail: client?.email,
          clientPhone: client?.phone,
          clientDocument: client?.document,
          clientAddress: client?.address,
          quotes: [],
          totalValue: 0,
          approvedValue: 0,
          approvedCount: 0,
          pendingCount: 0,
          draftCount: 0,
          rejectedCount: 0,
        });
      }

      const group = map.get(cid)!;
      group.quotes.push(quote);
      group.totalValue += quote.totalValue || 0;

      if (quote.status === 'APPROVED') {
        group.approvedCount += 1;
        group.approvedValue += quote.totalValue || 0;
      } else if (quote.status === 'SENT' || quote.status === 'DRAFT') {
        group.pendingCount += 1;
      } else if (quote.status === 'REJECTED') {
        group.rejectedCount += 1;
      }
    });

    const list = Array.from(map.values());
    list.forEach(g => {
      g.quotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // Sort client groups by total quote value descending
    list.sort((a, b) => b.totalValue - a.totalValue);

    return list;
  }, [quotes, clients, searchQuery, statusFilter]);

  const toggleClientExpand = (cid: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [cid]: prev[cid] === undefined ? false : !prev[cid]
    }));
  };

  const expandAllClients = () => {
    const newMap: Record<string, boolean> = {};
    groupedQuotes.forEach(g => {
      newMap[g.clientId] = true;
    });
    setExpandedClients(newMap);
  };

  const collapseAllClients = () => {
    const newMap: Record<string, boolean> = {};
    groupedQuotes.forEach(g => {
      newMap[g.clientId] = false;
    });
    setExpandedClients(newMap);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems: QuoteItem[] = results.data.map((row: any) => {
          // Try to guess columns
          const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('prod') || k.toLowerCase().includes('nome'));
          const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes('qtd') || k.toLowerCase().includes('quant'));
          const priceKey = Object.keys(row).find(k => k.toLowerCase().includes('preco') || k.toLowerCase().includes('preço') || k.toLowerCase().includes('valor') || k.toLowerCase().includes('unit'));

          const description = descKey ? row[descKey] : Object.values(row)[0] as string;
          const quantity = qtyKey ? parseFloat(row[qtyKey]) : 1;
          
          let unitPrice = 0;
          if (priceKey) {
            const priceStr = String(row[priceKey]).replace(/[R$\s]/g, '').replace(',', '.');
            unitPrice = parseFloat(priceStr);
          }

          return {
            id: uuidv4(),
            description: description || 'Produto sem nome',
            quantity: isNaN(quantity) ? 1 : quantity,
            unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
            total: (isNaN(quantity) ? 1 : quantity) * (isNaN(unitPrice) ? 0 : unitPrice)
          };
        });

        setItems(prev => [...prev, ...parsedItems]);
        setUploadSuccess(true);
        toast.success('Planilha processada com sucesso!');
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadSuccess(false);
        }, 2000);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: () => {
        setIsUploading(false);
        toast.error('Erro ao processar a planilha.');
      }
    });
  };

  const downloadTemplate = () => {
    const headers = "Descrição,Quantidade,Valor Unitário\n";
    const sampleData = "Serviço de Manutenção,1,150.00\nPeça de Reposição,2,45.50\n";
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_orcamento.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    setItems([...items, { id: uuidv4(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const addInstallment = () => {
    setInstallments([...installments, { id: uuidv4(), description: `${installments.length + 1}ª Parcela`, value: 0 }]);
  };

  const updateInstallment = (id: string, field: keyof QuoteInstallment, value: any) => {
    setInstallments(installments.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  const removeInstallment = (id: string) => {
    setInstallments(installments.filter(inst => inst.id !== id));
  };

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const totalValue = subtotal + taxValue;
  const totalInstallmentsValue = installments.reduce((sum, inst) => sum + inst.value, 0);

  const handleSave = () => {
    try {
      if (!clientId) {
        toast.error('Selecione um cliente');
        return;
      }
      if (items.length === 0) {
        toast.error('Adicione pelo menos um item');
        return;
      }

      // Validar itens e converter valores para números para evitar NaN
      const validatedItems = items.map(item => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return {
          ...item,
          quantity: qty,
          unitPrice: price,
          total: qty * price
        };
      });

      const validatedTotalValue = validatedItems.reduce((sum, item) => sum + item.total, 0) + (Number(taxValue) || 0);

      // Validar parcelas
      const validatedInstallments = installments.map(inst => ({
        ...inst,
        value: Number(inst.value) || 0
      }));

      if (editingQuote) {
        updateQuote(editingQuote.id, {
          ...editingQuote,
          clientId,
          items: validatedItems,
          installments: validatedInstallments,
          taxValue: Number(taxValue) || 0,
          totalValue: validatedTotalValue,
          observations,
        });
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        addQuote({
          clientId,
          date: new Date().toISOString(),
          items: validatedItems,
          installments: validatedInstallments,
          taxValue: Number(taxValue) || 0,
          totalValue: validatedTotalValue,
          status: 'DRAFT',
          observations,
        });
        toast.success('Orçamento salvo com sucesso!');
      }

      // Fechar formulário e resetar estados com um pequeno delay para AnimatePresence
      setIsCreating(false);
      
      setTimeout(() => {
        setEditingQuote(null);
        setClientId('');
        setItems([]);
        setTaxValue(0);
        setInstallments([]);
        setObservations('');
      }, 300);
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err);
      toast.error('Ocorreu um erro inesperado ao salvar o orçamento.');
    }
  };

  const handleStatusChange = (quote: Quote, newStatus: Quote['status']) => {
    updateQuote(quote.id, { ...quote, status: newStatus });
    
    // If approved, automatically create a receipt
    if (newStatus === 'APPROVED' && quote.status !== 'APPROVED') {
      addReceipt({
        clientId: quote.clientId,
        date: new Date().toISOString().split('T')[0],
        value: quote.totalValue,
        description: `Referente ao orçamento aprovado #${quote.id.substring(0, 8)}`
      });
      toast.success('Orçamento aprovado! Receita gerada no Financeiro.');
    }
  };

  const handleCloneQuote = (quoteToClone: Quote) => {
    const clonedItems: QuoteItem[] = (quoteToClone.items || []).map(item => ({
      ...item,
      id: uuidv4()
    }));

    const clonedInstallments: QuoteInstallment[] = (quoteToClone.installments || []).map(inst => ({
      ...inst,
      id: uuidv4()
    }));

    const clonedQuoteData: Omit<Quote, 'id'> = {
      clientId: quoteToClone.clientId,
      date: new Date().toISOString(),
      items: clonedItems,
      installments: clonedInstallments,
      taxValue: quoteToClone.taxValue || 0,
      totalValue: quoteToClone.totalValue || 0,
      status: 'DRAFT',
      observations: quoteToClone.observations ? `${quoteToClone.observations} (Cópia)` : 'Cópia de orçamento',
    };

    addQuote(clonedQuoteData);
    toast.success('Orçamento clonado como Rascunho com sucesso! 📋');
  };

  const handleDownloadPdf = async (quote: Quote) => {
    // Garantir que a página está no topo para evitar problemas de renderização
    window.scrollTo(0, 0);

    setQuoteToPrint(quote);
    setIsGenerating(true);
    
    // Wait for state to update and DOM to render
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) {
        setIsGenerating(false);
        setQuoteToPrint(null);
        toast.error('Erro: Template do PDF não encontrado.');
        return;
      }

      try {
        const client = clients.find(c => c.id === quote.clientId);
        const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Cliente';
        const dateStr = safeFormatDate(quote.date).replace(/\//g, '-');
        const fileName = `Orcamento_${safeName}_${dateStr}.pdf`;

        await generatePdf(element, fileName);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        toast.error(`Erro ao gerar PDF. Tente usar o botão "Imprimir" como alternativa.`);
      } finally {
        setIsGenerating(false);
        setQuoteToPrint(null);
      }
    }, 1500); // Increased timeout for safety
  };

  const handleSharePdf = async (quote: Quote) => {
    window.scrollTo(0, 0);
    setQuoteToPrint(quote);
    setIsGenerating(true);
    
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) {
        setIsGenerating(false);
        setQuoteToPrint(null);
        toast.error('Erro: Template do PDF não encontrado.');
        return;
      }

      try {
        const client = clients.find(c => c.id === quote.clientId);
        const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Cliente';
        const dateStr = safeFormatDate(quote.date).replace(/\//g, '-');
        const fileName = `Orcamento_${safeName}_${dateStr}.pdf`;

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
        setQuoteToPrint(null);
      }
    }, 1500);
  };

  const handleDownloadWord = async (quote: Quote) => {
    setIsGenerating(true);
    try {
      const client = clients.find(c => c.id === quote.clientId);
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

            new Paragraph({ text: "", spacing: { after: 200 } }),

            // Header Section
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } ,
              rows: [
                new TableRow({
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
                                    new Paragraph({ children: [new TextRun({ text: `Atendimento: ${companyData?.businessHours || 'Seg. a Sex. das 08h às 18h'}`, size: 16, color: "666666" })] }),
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
                        new Paragraph({ children: [new TextRun({ text: "ORÇAMENTO", bold: true, size: 48 })], alignment: AlignmentType.RIGHT }),
                        new Paragraph({ children: [new TextRun({ text: "Protocolo ", size: 16, color: "999999", bold: true, allCaps: true }), new TextRun({ text: `#${quote.id.substring(0, 8).toUpperCase()}`, bold: true, size: 20 })], alignment: AlignmentType.RIGHT }),
                        new Paragraph({ children: [new TextRun({ text: "Emissão ", size: 16, color: "999999", bold: true, allCaps: true }), new TextRun({ text: safeFormatDate(quote.date), bold: true, size: 20 })], alignment: AlignmentType.RIGHT }),
                      ],
                      verticalAlign: VerticalAlign.TOP,
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Client/Recipient Box
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
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "DESTINATÁRIO / CLIENTE", size: 16, bold: true, color: "000000" })], spacing: { after: 200 } }),
                        new Paragraph({ children: [new TextRun({ text: client?.name || '---', bold: true, size: 40 })], spacing: { after: 400 } }),
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
                                  children: [new Paragraph({ children: [new TextRun({ text: "ENDEREÇO", size: 16, bold: true })] }), new Paragraph({ children: [new TextRun({ text: client?.address || '---', bold: true, size: 18 })] })],
                                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                }),
                              ]
                            })
                          ]
                        })
                      ],
                      margins: { top: 400, bottom: 400, left: 400, right: 400 },
                    })
                  ]
                })
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Items Table
            new Paragraph({ children: [new TextRun({ text: "ITENS DO ORÇAMENTO", size: 20, bold: true, color: "000000" })], spacing: { after: 200 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DESCRIÇÃO", bold: true, size: 18 })] })], shading: { fill: "F3F4F6" }, margins: { left: 100 } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "QTD", bold: true, size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: "F3F4F6" }, width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "UNITÁRIO", bold: true, size: 18 })], alignment: AlignmentType.RIGHT })], shading: { fill: "F3F4F6" }, width: { size: 20, type: WidthType.PERCENTAGE }, margins: { right: 100 } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true, size: 18 })], alignment: AlignmentType.RIGHT })], shading: { fill: "F3F4F6" }, width: { size: 20, type: WidthType.PERCENTAGE }, margins: { right: 100 } }),
                  ],
                }),
                ...quote.items.map(item => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 18 })] })], margins: { left: 100, top: 100, bottom: 100 } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.quantity.toString(), size: 18 })], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice), size: 18 })], alignment: AlignmentType.RIGHT })], margins: { right: 100 } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total), size: 18, bold: true })], alignment: AlignmentType.RIGHT })], margins: { right: 100 } }),
                  ],
                })),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Total Value
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ 
                          children: [
                            new TextRun({ text: "INVESTIMENTO TOTAL: ", bold: true, size: 24 }),
                            new TextRun({ text: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue), bold: true, size: 36, color: "000000" }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      margins: { top: 400, bottom: 400, right: 400 },
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Observations Box
            quote.observations ? new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" } },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "OBSERVAÇÕES:", bold: true, size: 16 })], spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: quote.observations, italics: true, size: 18 })] }),
                      ],
                      shading: { fill: "F9FAFB" },
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                    })
                  ]
                })
              ]
            }) : new Paragraph({ text: "" }),

            new Paragraph({ text: "", spacing: { after: 1200 } }),

            // Signatures
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        ...(signatureImage ? [new Paragraph({ children: [new ImageRun({ data: signatureImage, transformation: { width: 120, height: 60 } } as any)], alignment: AlignmentType.CENTER })] : [new Paragraph({ text: "", spacing: { before: 800 } })]),
                        new Table({ width: { size: 80, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Responsável Comercial", bold: true, size: 24 })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: companyData?.name || 'IA COMPANY', size: 16, bold: true, allCaps: true })], alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } })] })], alignment: AlignmentType.CENTER }),
                      ],
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "", spacing: { before: 800 } }),
                        new Table({ width: { size: 80, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: client?.name.substring(0, 30) || '---', bold: true, size: 24 })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "ACEITE DO CLIENTE", size: 16, bold: true, allCaps: true })], alignment: AlignmentType.CENTER })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } })] })], alignment: AlignmentType.CENTER }),
                      ],
                      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                  ]
                })
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 800 } }),

            // Footer
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `GERADO EM ${new Date().toLocaleDateString('pt-BR')} ÀS ${new Date().toLocaleTimeString('pt-BR')}`, size: 12, color: "CCCCCC", bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${companyData?.name || 'IA COMPANY'} • SOLUÇÕES INTELIGENTES`, size: 12, color: "999999", bold: true, allCaps: true })], alignment: AlignmentType.RIGHT })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                  ]
                })
              ]
            })
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const safeName = client?.name ? client.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') : 'Cliente';
      const dateStr = safeFormatDate(quote.date).replace(/\//g, '-');
      const fileName = `Orcamento_${safeName}_${dateStr}.docx`;
      
      saveAs(blob, fileName);
      toast.success('Arquivo Word gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar Word:', error);
      toast.error('Erro ao gerar arquivo Word.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintQuote = (quote: Quote) => {
    setQuoteToPrint(quote);
    setTimeout(() => {
      window.print();
      setQuoteToPrint(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white relative overflow-hidden font-sans -m-8 flex flex-col">
      {/* Matte Black Background */}
      <div className="absolute inset-0 z-0 bg-[#0f0f11]">
        {/* Subtle noise texture for the matte/frosted effect */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-black/80"></div>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white font-black uppercase tracking-widest text-sm">Gerando Documento de Alta Qualidade...</p>
          <p className="text-white/60 text-xs mt-2">Isso pode levar alguns segundos</p>
        </div>
      )}

      <div className="relative z-10 p-8 md:p-12 h-full flex flex-col flex-1">
        <AnimatePresence mode="wait">
          {!isCreating ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-7xl mx-auto w-full"
            >
              {/* Header */}
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 px-8 shadow-2xl gap-4">
                <div className="flex items-center gap-4">
                  <BackButton />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-400/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                      <FileText className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-light tracking-wide">
                        <span className="font-bold">Gestão de</span> Orçamentos
                      </h1>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-red-600/80 hover:bg-red-500 border border-red-400/30 text-white px-6 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                >
                  <Plus className="w-5 h-5" /> 
                  Novo Orçamento
                </button>
              </header>

              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <GlassPanel className="p-5 flex items-center justify-between border-white/10 hover:border-white/20 transition-all">
                  <div>
                    <h3 className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-1">Total de Orçamentos</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{quotes.length}</span>
                      <span className="text-xs text-white/50 font-mono">
                        ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValueAll)})
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <FileText className="w-6 h-6 text-white/70" />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5 flex items-center justify-between border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30 transition-all">
                  <div>
                    <h3 className="text-emerald-400/70 font-bold uppercase tracking-widest text-[10px] mb-1">Aprovados</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">{approvedQuotes.length}</span>
                      <span className="text-xs text-emerald-400/60 font-mono">
                        ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValueApproved)})
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5 flex items-center justify-between border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30 transition-all">
                  <div>
                    <h3 className="text-amber-400/70 font-bold uppercase tracking-widest text-[10px] mb-1">Em Negociação</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">{pendingQuotes.length}</span>
                      <span className="text-xs text-amber-400/60 font-mono">
                        ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValuePending)})
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5 flex items-center justify-between border-red-500/20 bg-red-500/5 hover:border-red-500/30 transition-all">
                  <div>
                    <h3 className="text-red-400/70 font-bold uppercase tracking-widest text-[10px] mb-1">Rejeitados</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-red-400">{rejectedQuotes.length}</span>
                      <span className="text-xs text-red-400/50 font-mono">recusados</span>
                    </div>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                </GlassPanel>
              </div>

              {/* Search, Status Filters & Accordion Toggle Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-stretch md:items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-lg">
                {/* Search input */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar por cliente, condomínio, código..."
                    className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 outline-none transition-all font-medium"
                  />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  <button 
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'ALL' ? 'bg-white/20 text-white border border-white/30 shadow' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Todos ({quotes.length})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('APPROVED')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'APPROVED' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Aprovados ({approvedQuotes.length})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('SENT')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'SENT' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Enviados ({quotes.filter(q => q.status === 'SENT').length})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('DRAFT')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'DRAFT' ? 'bg-white/20 text-white border border-white/30 shadow' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Rascunhos ({quotes.filter(q => q.status === 'DRAFT').length})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('REJECTED')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'REJECTED' ? 'bg-red-500/30 text-red-300 border border-red-500/40 shadow' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    Rejeitados ({rejectedQuotes.length})
                  </button>
                </div>

                {/* Accordion expand/collapse buttons */}
                <div className="flex items-center gap-2 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                  <button
                    onClick={expandAllClients}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all"
                  >
                    Expandir Todos
                  </button>
                  <button
                    onClick={collapseAllClients}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all"
                  >
                    Recolher
                  </button>
                </div>
              </div>

              {/* Client Grouped List */}
              <div className="space-y-6">
                {groupedQuotes.map((group) => {
                  const isExpanded = expandedClients[group.clientId] !== false; // default expanded

                  return (
                    <GlassPanel key={group.clientId} className="p-6 overflow-hidden border-white/15 hover:border-white/25 transition-all">
                      {/* Client Header / Accordion Toggle */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleClientExpand(group.clientId)}>
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-900/30 border border-red-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                            <Building className="w-6 h-6 text-red-400" />
                          </div>

                          <div>
                            <div className="flex items-center gap-3">
                              <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                                {group.clientName}
                              </h2>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleClientExpand(group.clientId);
                                }}
                                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all"
                              >
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 mt-1 font-mono">
                              {group.clientDocument && <span>CNPJ/CPF: {group.clientDocument}</span>}
                              {group.clientPhone && <span>Tel: {group.clientPhone}</span>}
                              {group.clientAddress && <span className="line-clamp-1">{group.clientAddress}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Group Stats & Add Quote Button */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold font-mono">
                              {group.quotes.length} {group.quotes.length === 1 ? 'Orçamento' : 'Orçamentos'}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(group.totalValue)}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setClientId(group.clientId);
                              setItems([]);
                              setInstallments([]);
                              setTaxValue(0);
                              setObservations('');
                              setEditingQuote(null);
                              setIsCreating(true);
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4 text-red-400" /> Novo p/ Este Cliente
                          </button>
                        </div>
                      </div>

                      {/* Accordion Quotes Grid */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-6 pt-6 border-t border-white/10"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {group.quotes.map((quote) => {
                                const statusColors = {
                                  DRAFT: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
                                  SENT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                                  APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                                  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30'
                                };

                                const firstItemDesc = quote.items && quote.items.length > 0 ? quote.items[0].description : 'Sem itens';

                                return (
                                  <div
                                    key={quote.id}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between min-h-[220px] group relative"
                                  >
                                    <div>
                                      {/* Top info */}
                                      <div className="flex justify-between items-center mb-3">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[quote.status]}`}>
                                          {quote.status === 'DRAFT' ? 'Rascunho' :
                                           quote.status === 'SENT' ? 'Enviado' :
                                           quote.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                                        </span>
                                        <span className="text-[11px] text-white/40 font-mono">
                                          {safeFormatDate(quote.date)}
                                        </span>
                                      </div>

                                      {/* Quote Code & Items summary */}
                                      <div className="mb-3">
                                        <span className="text-xs text-white/40 font-mono block">#{quote.id.substring(0, 8).toUpperCase()}</span>
                                        <p className="text-2xl font-black text-white tracking-tight mt-1">
                                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue)}
                                        </p>
                                        <p className="text-xs text-white/60 mt-2 line-clamp-1 italic">
                                          {quote.items?.length || 0} {quote.items?.length === 1 ? 'item' : 'itens'}: {firstItemDesc}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Controls Footer */}
                                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-4">
                                      <select 
                                        value={quote.status}
                                        onChange={(e) => handleStatusChange(quote, e.target.value as Quote['status'])}
                                        className="text-[11px] bg-white/10 border border-white/10 text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500/50 transition-colors font-bold uppercase tracking-wider"
                                      >
                                        <option value="DRAFT" className="bg-[#0f0f11]">Rascunho</option>
                                        <option value="SENT" className="bg-[#0f0f11]">Enviado</option>
                                        <option value="APPROVED" className="bg-[#0f0f11]">Aprovado</option>
                                        <option value="REJECTED" className="bg-[#0f0f11]">Rejeitado</option>
                                      </select>
                                      
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => {
                                            setEditingQuote(quote);
                                            setClientId(quote.clientId);
                                            setItems(quote.items);
                                            setTaxValue(quote.taxValue || 0);
                                            setInstallments(quote.installments || []);
                                            setObservations(quote.observations || '');
                                            setIsCreating(true);
                                          }}
                                          className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                          title="Editar"
                                        >
                                          <Wrench className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => setViewingQuote(quote)}
                                          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                          title="Visualizar"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handlePrintQuote(quote)}
                                          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                          title="Imprimir"
                                        >
                                          <Printer className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDownloadPdf(quote)}
                                          disabled={isGenerating}
                                          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                          title="Baixar PDF"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDownloadWord(quote)}
                                          disabled={isGenerating}
                                          className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                          title="Baixar Word"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleCloneQuote(quote)}
                                          className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                          title="Clonar Orçamento"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleSharePdf(quote)}
                                          disabled={isGenerating}
                                          className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                          title="Compartilhar"
                                        >
                                          <Share2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setConfirmModal({
                                              isOpen: true,
                                              title: 'Excluir Orçamento',
                                              message: 'Tem certeza que deseja excluir este orçamento?',
                                              onConfirm: () => {
                                                deleteQuote(quote.id);
                                                toast.success('Orçamento excluído com sucesso!');
                                              }
                                            });
                                          }}
                                          className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassPanel>
                  );
                })}

                {groupedQuotes.length === 0 && (
                  <div className="py-24 text-center">
                    <GlassPanel className="inline-flex flex-col items-center justify-center p-12 border-dashed border-white/20">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-6 border border-white/10">
                        <FileText className="w-10 h-10 text-white/30" />
                      </div>
                      <h3 className="text-2xl font-light text-white/70">Nenhum orçamento encontrado</h3>
                      <p className="text-white/40 mt-2">Tente ajustar a busca ou filtro de status.</p>
                    </GlassPanel>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 px-8 shadow-2xl gap-4">
                <div className="flex items-center gap-4">
                  <BackButton onClick={() => {
                    setIsCreating(false);
                    setEditingQuote(null);
                    setClientId('');
                    setItems([]);
                    setTaxValue(0);
                    setInstallments([]);
                    setObservations('');
                  }} />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-light tracking-wide text-white">
                      <span className="font-bold">{editingQuote ? 'Editar' : 'Nova'}</span> Proposta
                    </h1>
                  </div>
                </div>
                <button 
                  onClick={handleSave}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-8 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                  <Save className="w-5 h-5" /> 
                  FINALIZAR ORÇAMENTO
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Config */}
                <div className="lg:col-span-1 space-y-8">
                  <GlassPanel className="p-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6">Informações Base</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Cliente Destinatário</label>
                        <select 
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 outline-none transition-colors text-white font-bold"
                        >
                          <option value="" className="bg-[#0f0f11]">Selecione um cliente...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0f0f11]">{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Observação</label>
                        <textarea 
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                          placeholder="Observações adicionais para o orçamento..."
                          className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 outline-none transition-colors text-white text-sm min-h-[120px] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Acrescentar Impostos / Taxas (R$)</label>
                        <input 
                          type="number"
                          value={taxValue}
                          onChange={(e) => setTaxValue(parseFloat(e.target.value) || 0)}
                          placeholder="Valor a somar ao total..."
                          className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 outline-none transition-colors text-white font-mono font-bold"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Importação Rápida</label>
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={downloadTemplate}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Baixar Modelo CSV
                          </button>
                          
                          <input 
                            type="file" 
                            accept=".csv" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden" 
                            id="csv-upload"
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-red-600/20 hover:bg-red-500/30 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center justify-center gap-2"
                          >
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                            ) : uploadSuccess ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4" />
                            )}
                            {isUploading ? 'Processando...' : uploadSuccess ? 'Sucesso' : 'Carregar Planilha'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-red-500/20 transition-colors duration-700"></div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6 relative z-10">Resumo Financeiro</h3>
                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 uppercase tracking-widest text-[10px] font-bold">Subtotal Bruto</span>
                        <span className="font-mono font-bold text-white/80">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 uppercase tracking-widest text-[10px] font-bold">Impostos / Taxas</span>
                        <span className="font-mono font-bold text-white/80">
                          {taxValue > 0 ? `+ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxValue)}` : 'R$ 0,00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 uppercase tracking-widest text-[10px] font-bold">Descontos</span>
                        <span className="font-mono font-bold text-white">R$ 0,00</span>
                      </div>
                      <div className="pt-6 border-t border-white/10 flex flex-col gap-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-white/50">Total Final</span>
                          {taxValue > 0 && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 animate-pulse">
                              + Impostos inclusos
                            </span>
                          )}
                        </div>
                        <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </span>
                      </div>
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Condições de Pagamento</h3>
                      <button 
                        onClick={addInstallment}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all active:scale-95 border border-white/10 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Plus className="w-3 h-3" /> Parcela
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {installments.map((inst, index) => (
                        <div key={inst.id} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/10">
                          <input 
                            type="text" 
                            value={inst.description}
                            onChange={(e) => updateInstallment(inst.id, 'description', e.target.value)}
                            className="flex-1 bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs font-bold text-white focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                            placeholder="Ex: Entrada"
                          />
                          <input 
                            type="number" 
                            value={inst.value}
                            onChange={(e) => updateInstallment(inst.id, 'value', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs font-mono font-bold text-right text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                            placeholder="Valor"
                            min="0"
                            step="0.01"
                          />
                          <input 
                            type="date" 
                            value={inst.dueDate || ''}
                            onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                            className="w-32 bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs font-mono text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all [color-scheme:dark]"
                          />
                          <button 
                            onClick={() => removeInstallment(inst.id)}
                            className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {installments.length === 0 && (
                        <p className="text-xs text-white/30 text-center py-4 italic">Nenhuma parcela adicionada. O pagamento será considerado à vista.</p>
                      )}
                      {installments.length > 0 && (
                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total Parcelado</span>
                          <span className={`font-mono font-bold text-sm ${Math.abs(totalInstallmentsValue - totalValue) > 0.01 ? 'text-amber-400' : 'text-white'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInstallmentsValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </GlassPanel>
                </div>

                {/* Right Column: Items */}
                <div className="lg:col-span-2">
                  <GlassPanel className="overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <h2 className="text-xl font-bold tracking-widest uppercase text-white">Itens da Proposta</h2>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <select 
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const product = products.find(p => p.id === e.target.value);
                            if (product) {
                              setItems([...items, { id: uuidv4(), description: product.name, quantity: 1, unitPrice: product.price, total: product.price }]);
                            }
                            e.target.value = '';
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:border-red-500/50 outline-none transition-colors text-white"
                        >
                          <option value="" className="bg-[#0f0f11]">Catálogo...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} className="bg-[#0f0f11]">{p.name} - R$ {p.price}</option>
                          ))}
                        </select>
                        <button 
                          onClick={addItem}
                          className="bg-white/10 text-white p-2 px-4 rounded-xl hover:bg-white/20 transition-all active:scale-95 border border-white/10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto flex-1 p-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                            <th className="p-4">Descrição</th>
                            <th className="p-4 w-24 text-center">Qtd</th>
                            <th className="p-4 w-32 text-right">Unitário</th>
                            <th className="p-4 w-32 text-right">Total</th>
                            <th className="p-4 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {items.map((item) => (
                            <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-sm font-bold text-white focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                                  placeholder="Nome do serviço ou produto"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-sm font-mono font-bold text-center text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                                  min="1"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="number" 
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-sm font-mono font-bold text-right text-white/80 focus:bg-white/5 focus:border-white/20 outline-none transition-all"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <span className="text-sm font-bold text-white font-mono px-3">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="p-2 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-16 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-30">
                                  <Wrench className="w-10 h-10" />
                                  <p className="text-[10px] font-bold uppercase tracking-widest">Adicione itens para compor o orçamento.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </GlassPanel>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quote View Modal */}
      <Modal 
        isOpen={!!viewingQuote} 
        onClose={() => setViewingQuote(null)} 
        title="Detalhes da Proposta"
        maxWidth="4xl"
        glass
      >
        {viewingQuote && (
          <div className="space-y-8 p-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Cliente</p>
                <h3 className="text-3xl font-light text-white">
                  {clients.find(c => c.id === viewingQuote.clientId)?.name}
                </h3>
                <p className="text-sm text-white/40 font-mono mt-1">
                  Emitido em {safeFormatDate(viewingQuote.date)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end">
                  {viewingQuote.taxValue !== undefined && viewingQuote.taxValue > 0 && (
                    <div className="mb-4 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Subtotal Bruto</p>
                      <p className="text-sm font-bold text-white/60 mb-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingQuote.totalValue - viewingQuote.taxValue)}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/60 mb-1">Impostos (+) </p>
                      <p className="text-sm font-bold text-red-400/80 mb-2 font-mono">
                        + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingQuote.taxValue)}
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Investimento Total Final</p>
                    <p className="text-4xl font-black text-white tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingQuote.totalValue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/10">
                    <th className="p-4">Item / Descrição</th>
                    <th className="p-4 text-center">Qtd</th>
                    <th className="p-4 text-right">Unitário</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {viewingQuote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-4 text-sm font-bold text-white">{item.description}</td>
                      <td className="p-4 text-sm text-center text-white/60 font-mono">{item.quantity}</td>
                      <td className="p-4 text-sm text-right text-white/60 font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                      </td>
                      <td className="p-4 text-sm text-right font-bold text-white font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewingQuote.installments && viewingQuote.installments.length > 0 && (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Condições de Pagamento</h4>
                <div className="space-y-3">
                  {viewingQuote.installments.map((inst, idx) => (
                    <div key={inst.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-white/80">{inst.description}</span>
                      <div className="flex items-center gap-4">
                        {inst.dueDate && (
                          <span className="text-white/40 font-mono">{safeFormatDate(inst.dueDate)}</span>
                        )}
                        <span className="font-bold text-white font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewingQuote.observations && (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Observações</h4>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {viewingQuote.observations}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 flex-wrap">
              <button 
                onClick={() => handleDownloadPdf(viewingQuote)}
                className="flex-1 bg-red-600/80 hover:bg-red-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-400/30 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
              >
                <Download className="w-5 h-5" /> Baixar PDF do Orçamento
              </button>
              <button 
                onClick={() => handleDownloadWord(viewingQuote)}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-500/30 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.1)]"
              >
                <FileText className="w-5 h-5" /> Baixar Word (Editável)
              </button>
              <button 
                onClick={() => {
                  handleCloneQuote(viewingQuote);
                  setViewingQuote(null);
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-95"
              >
                <Copy className="w-5 h-5" /> Clonar Orçamento
              </button>
              <button 
                onClick={() => {
                  const client = clients.find(c => c.id === viewingQuote.clientId);
                  const email = client?.email || '';
                  const subject = `Orçamento - ${viewingQuote.id.substring(0, 8).toUpperCase()}`;
                  const body = `Olá ${client?.name || ''},\n\nSegue o orçamento solicitado.\n\nValor Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingQuote.totalValue)}\n\nAtenciosamente,\n${companyData?.name || 'CONDFY.IA'}`;
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  toast.success('Abrindo cliente de e-mail...');
                }}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-500/30 transition-all active:scale-95"
              >
                <Mail className="w-5 h-5" /> Enviar por E-mail
              </button>
              <button 
                onClick={() => setViewingQuote(null)}
                className="px-8 py-4 text-white/60 hover:text-white transition-colors font-bold w-full sm:w-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Ultra-Quality PDF Template */}
      {quoteToPrint && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div 
            ref={printRef}
            ref-name="printRef"
            className="bg-white text-zinc-900 font-sans pdf-content relative overflow-hidden"
            style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '0', boxSizing: 'border-box' }}
          >
            {/* Top Accent Line */}
            <div className="h-1.5 w-full bg-red-600 mb-0" style={{ height: '6px', backgroundColor: '#dc2626' }}></div>

            <div className="p-8" style={{ padding: '32px' }}>
              {/* Header Section Section */}
              <div className="flex justify-between items-start mb-6 pb-6 break-inside-avoid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e4e4e7', paddingBottom: '24px', marginBottom: '24px' }}>
                <div className="flex gap-5 items-center" style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '55%' }}>
                  {companyLogo ? (
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 flex items-center justify-center shrink-0">
                      <img src={companyLogo} alt="Logo" className="h-14 w-auto object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shrink-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-black uppercase tracking-tight leading-none mb-1.5" style={{ fontWeight: 900, marginBottom: '6px' }}>
                      {companyData?.name || 'IA COMPANY'}
                    </h2>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-zinc-500 flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" style={{ display: 'inline-block', width: '4px', height: '4px', backgroundColor: '#d4d4d8', borderRadius: '50%' }}></span> CNPJ: {companyData?.document || '---'}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500 flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" style={{ display: 'inline-block', width: '4px', height: '4px', backgroundColor: '#d4d4d8', borderRadius: '50%' }}></span> {companyData?.email || 'contato@empresa.com'}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500 flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" style={{ display: 'inline-block', width: '4px', height: '4px', backgroundColor: '#d4d4d8', borderRadius: '50%' }}></span> {companyData?.phone || '(00) 0000-0000'}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500 flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" style={{ display: 'inline-block', width: '4px', height: '4px', backgroundColor: '#d4d4d8', borderRadius: '50%' }}></span> Atendimento: {companyData?.businessHours || 'Seg. a Sex. das 08h às 18h'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between items-end" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '40%' }}>
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-3 rounded" style={{ display: 'inline-block', backgroundColor: '#dc2626', color: '#ffffff', borderRadius: '4px', padding: '4px 12px' }}>
                      PROPOSTA COMERCIAL
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-black uppercase leading-none" style={{ fontWeight: 900, fontSize: '32px', margin: 0 }}>
                      ORÇAMENTO
                    </h1>
                  </div>
                  <div className="mt-4 flex flex-col gap-1 items-end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginTop: '16px' }}>
                    <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900 }}>Nº Proposta</span>
                      <span className="text-sm font-black text-black" style={{ fontSize: '14px', color: '#000000', fontWeight: 900 }}>#{quoteToPrint.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900 }}>Data Emissão</span>
                      <span className="text-sm font-black text-black" style={{ fontSize: '14px', color: '#000000', fontWeight: 900 }}>{safeFormatDate(quoteToPrint.date)}</span>
                    </div>
                    <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest" style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 900 }}>Validade</span>
                      <span className="text-sm font-black text-black" style={{ fontSize: '14px', color: '#000000', fontWeight: 900 }}>15 Dias úteis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Card */}
              <div className="mb-4 bg-zinc-50 p-5 rounded-xl flex flex-col relative overflow-hidden break-inside-avoid" style={{ border: '1px solid #e4e4e7', backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', marginBottom: '16px', position: 'relative' }}>
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#dc2626' }}></div>
                <h3 className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1" style={{ fontSize: '8px', color: '#a1a1aa', fontWeight: 900, marginBottom: '8px', marginLeft: '4px' }}>Destinatário da Proposta</h3>
                <div className="ml-1" style={{ marginLeft: '4px' }}>
                  <p className="text-xl font-black text-black leading-tight mb-3" style={{ fontWeight: 900, fontSize: '18px', color: '#000000', marginBottom: '12px', margin: 0 }}>
                    {clients.find(c => c.id === quoteToPrint.clientId)?.name}
                  </p>
                  
                  {/* Grid de Informações usando Inline-Blocks Seguros para o html2canvas */}
                  <div style={{ display: 'block', width: '100%', marginTop: '4px', paddingBottom: '4px' }}>
                    <div style={{ display: 'inline-block', width: '32%', verticalAlign: 'top' }}>
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5" style={{ fontSize: '8px', color: '#a1a1aa', margin: 0, fontWeight: 900, lineHeight: '1.2' }}>Documento / CPF</p>
                      <p className="text-xs font-bold text-black" style={{ fontSize: '11px', color: '#000000', fontWeight: 700, margin: 0, lineHeight: '1.4' }}>{clients.find(c => c.id === quoteToPrint.clientId)?.document || '---'}</p>
                    </div>
                    <div style={{ display: 'inline-block', width: '32%', verticalAlign: 'top' }}>
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5" style={{ fontSize: '8px', color: '#a1a1aa', margin: 0, fontWeight: 900, lineHeight: '1.2' }}>Telefone</p>
                      <p className="text-xs font-bold text-black" style={{ fontSize: '11px', color: '#000000', fontWeight: 700, margin: 0, lineHeight: '1.4' }}>{clients.find(c => c.id === quoteToPrint.clientId)?.phone || '---'}</p>
                    </div>
                    <div style={{ display: 'inline-block', width: '35%', verticalAlign: 'top' }}>
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5" style={{ fontSize: '8px', color: '#a1a1aa', margin: 0, fontWeight: 900, lineHeight: '1.2' }}>E-mail Contato</p>
                      <p className="text-xs font-bold text-black truncate" style={{ fontSize: '11px', color: '#000000', fontWeight: 700, margin: 0, lineHeight: '1.4' }}>{clients.find(c => c.id === quoteToPrint.clientId)?.email || '---'}</p>
                    </div>
                  </div>
                  
                  {/* Divisória explícita de 1px para evitar subir */}
                  <div style={{ height: '1px', backgroundColor: '#e4e4e7', margin: '12px 0 8px 0', width: '100%', display: 'block', clear: 'both' }}></div>
                  
                  <div style={{ marginTop: '4px', paddingBottom: '4px' }}>
                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5" style={{ fontSize: '8px', color: '#a1a1aa', margin: 0, fontWeight: 900, lineHeight: '1.2' }}>Endereço de Atendimento / Instalação</p>
                    <div className="flex items-start gap-2" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '2px' }}>
                      <MapPin className="w-3 h-3 text-zinc-300 mt-0.5 shrink-0" style={{ color: '#d4d4d8', width: '12px', height: '12px' }} />
                      <p className="text-[11px] font-bold text-black leading-relaxed" style={{ fontSize: '11px', color: '#18181b', fontWeight: 700, margin: 0, lineHeight: '1.4' }}>{clients.find(c => c.id === quoteToPrint.clientId)?.address || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table Section */}
              <div className="mb-4 rounded-xl overflow-hidden border border-zinc-200 shadow-sm break-inside-auto" style={{ border: '1px solid #e4e4e7', borderRadius: '8px', marginBottom: '16px' }}>
                <table className="w-full text-left border-collapse" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead className="bg-zinc-50" style={{ backgroundColor: '#f9fafb' }}>
                    <tr className="text-[8px] font-black uppercase tracking-widest text-zinc-400" style={{ borderBottom: '1px solid #e4e4e7' }}>
                      <th className="p-2" style={{ padding: '8px 12px', fontSize: '8px', color: '#a1a1aa', fontWeight: 900 }}>Descrição do Item / Serviço</th>
                      <th className="p-2 text-center w-20" style={{ padding: '8px 12px', textAlign: 'center', width: '80px', fontSize: '8px', color: '#a1a1aa', fontWeight: 900 }}>Quant.</th>
                      <th className="p-2 text-right w-32" style={{ padding: '8px 12px', textAlign: 'right', width: '128px', fontSize: '8px', color: '#a1a1aa', fontWeight: 900 }}>Unitário</th>
                      <th className="p-2 text-right w-36" style={{ padding: '8px 12px', textAlign: 'right', width: '144px', fontSize: '8px', color: '#a1a1aa', fontWeight: 900 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {quoteToPrint.items.map((item) => (
                      <tr key={item.id} className="break-inside-avoid">
                        <td className="p-2" style={{ padding: '8px 12px', borderBottom: '1px solid #f4f4f5' }}>
                          <p className="text-xs font-bold text-zinc-900 leading-relaxed capitalize" style={{ fontSize: '11px', color: '#18181b', fontWeight: 700, margin: 0 }}>{item.description.toLowerCase()}</p>
                        </td>
                        <td className="p-2 text-center text-xs font-black text-zinc-600" style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', color: '#52525b', fontWeight: 900, borderBottom: '1px solid #f4f4f5' }}>{item.quantity}</td>
                        <td className="p-2 text-right text-[10px] font-bold text-zinc-400 font-mono" style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', color: '#a1a1aa', fontWeight: 700, fontFamily: 'monospace', borderBottom: '1px solid #f4f4f5' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                        </td>
                        <td className="p-2 text-right text-sm font-black text-zinc-900 font-mono" style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', color: '#18181b', fontWeight: 900, fontFamily: 'monospace', borderBottom: '1px solid #f4f4f5' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial, Conditions & Signatures Group Block - Prevent page breaks within this block */}
              <div className="break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                {/* Financial & Terms Layout Section */}
                <div style={{ display: 'block', width: '100%', overflow: 'hidden', marginTop: '8px' }}>
                  
                  {/* Left Column (Observations & Info) */}
                  <div style={{ display: 'inline-block', width: '58%', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {quoteToPrint.observations && (
                        <div className="bg-zinc-100/50 p-4 rounded-xl border border-zinc-100" style={{ border: '1px solid #f4f4f5', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                          <h4 className="text-[8px] font-black uppercase tracking-widest text-red-600 mb-1 flex items-center gap-1.5" style={{ fontSize: '8px', color: '#dc2626', fontWeight: 900, marginBottom: '4px' }}>
                            <FileText className="w-3 h-3" /> Observações Gerais
                          </h4>
                          <p className="text-[10px] text-zinc-600 leading-relaxed font-medium whitespace-pre-wrap italic" style={{ fontSize: '10px', color: '#52525b', fontStyle: 'italic', margin: 0 }}>
                            "{quoteToPrint.observations}"
                          </p>
                        </div>
                      )}

                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100" style={{ border: '1px solid #f4f4f5', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                        <h4 className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1" style={{ fontSize: '8px', color: '#a1a1aa', fontWeight: 900, marginBottom: '4px' }}>Informações de Condição</h4>
                        <p className="text-[8px] text-zinc-400 leading-relaxed font-bold" style={{ fontSize: '8px', color: '#a1a1aa', fontWeight: 700, margin: 0 }}>
                          1. Proposta irrevogável pelo período de validade supracitado.<br />
                          2. Impostos inclusos no valor total da proposta.<br />
                          3. Prazo de execução à combinar após aprovação.
                        </p>
                      </div>

                      {quoteToPrint.installments && quoteToPrint.installments.length > 0 && (
                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100" style={{ border: '1px solid #f4f4f5', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                          <h4 className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5" style={{ fontSize: '8px', color: '#a1a1aa', fontWeight: 900, marginBottom: '8px' }}>
                             <Clock className="w-3 h-3" /> Cronograma de Pagamento
                          </h4>
                          <div className="space-y-1">
                            {quoteToPrint.installments.map((inst) => (
                              <div key={inst.id} className="flex justify-between items-center text-[8px] py-1 border-b border-zinc-200/50 last:border-0 last:pb-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', borderBottom: '1px solid #f4f4f5' }}>
                                <span className="font-bold text-zinc-900 uppercase tracking-tight" style={{ fontWeight: 700, color: '#18181b' }}>{inst.description}</span>
                                <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {inst.dueDate && <span className="text-zinc-400 font-mono" style={{ color: '#a1a1aa', fontFamily: 'monospace' }}>{safeFormatDate(inst.dueDate)}</span>}
                                  <span className="font-black text-black font-mono w-20 text-right" style={{ fontWeight: 900, color: '#000000', fontFamily: 'monospace', width: '80px', textAlign: 'right' }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Spacer Column */}
                  <div style={{ display: 'inline-block', width: '4%' }}></div>

                  {/* Right Column (Total Investment Box) */}
                  <div style={{ display: 'inline-block', width: '38%', verticalAlign: 'top' }}>
                    <div className="bg-black p-5 rounded-2xl text-white shadow-xl relative overflow-hidden" style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '16px', color: '#ffffff', position: 'relative' }}>
                      <div className="space-y-3 relative z-10" style={{ position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40" style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 900 }}>Subtotal Bruto</span>
                          <span className="text-xs font-bold font-mono" style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quoteToPrint.totalValue - (quoteToPrint.taxValue || 0))}</span>
                        </div>
                        {/* Linha divisória explícita para evitar subir */}
                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '6px 0' }}></div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40" style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 900 }}>Impostos / Retenções</span>
                          <span className="text-xs font-bold font-mono text-white/90" style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quoteToPrint.taxValue || 0)}</span>
                        </div>
                        {/* Linha divisória explícita */}
                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '8px 0' }}></div>
                        
                        <div className="pt-0.5">
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-red-400 mb-1 block" style={{ fontSize: '8px', color: '#f87171', fontWeight: 900, display: 'block', marginBottom: '4px' }}>INVESTIMENTO TOTAL</span>
                          <p className="text-3xl font-black tracking-tighter leading-none mb-1" style={{ fontWeight: 900, fontSize: '28px', color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quoteToPrint.totalValue)}
                          </p>
                          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-2" style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', fontWeight: 900, marginTop: '8px' }}>
                            * Valor sujeito a alteração após 15 dias
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures Area Section */}
                <div style={{ display: 'block', width: '100%', overflow: 'hidden', marginTop: '32px' }}>
                  
                  {/* Rep Comercial Signature */}
                  <div style={{ display: 'inline-block', width: '45%', verticalAlign: 'top', textAlign: 'center' }}>
                    <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', position: 'relative', marginBottom: '4px' }}>
                      {companySignature && (
                        <img 
                          src={companySignature} 
                          alt="Assinatura" 
                          style={{ maxHeight: '70px', width: 'auto', position: 'absolute', bottom: '4px', opacity: 0.9, left: '50%', transform: 'translateX(-50%)' }}
                        />
                      )}
                      <div style={{ width: '100%', borderTop: '1px solid #18181b' }}></div>
                    </div>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <p className="text-sm font-black text-black leading-none mb-1" style={{ fontWeight: 900, fontSize: '13px', color: '#000000', margin: 0, marginBottom: '2px' }}>{companyData?.name || 'IA COMPANY'}</p>
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em]" style={{ fontSize: '8px', color: '#a1a1aa', fontWeight: 900 }}>Responsável Comercial</p>
                    </div>
                  </div>
                  
                  {/* Spacer Column */}
                  <div style={{ display: 'inline-block', width: '10%' }}></div>

                  {/* Customer Signature */}
                  <div style={{ display: 'inline-block', width: '45%', verticalAlign: 'top', textAlign: 'center' }}>
                    <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', position: 'relative', marginBottom: '4px' }}>
                      <div style={{ width: '100%', borderTop: '1px solid #18181b' }}></div>
                    </div>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <p className="text-sm font-black text-black leading-none mb-1" style={{ fontWeight: 900, fontSize: '13px', color: '#000000', margin: 0, marginBottom: '2px' }}>
                        {clients.find(c => c.id === quoteToPrint.clientId)?.name.substring(0, 30)}
                      </p>
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em]" style={{ fontSize: '8px', color: '#a1a1aa', fontWeight: 900 }}>Aceite do Cliente</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Section */}
              <div className="mt-8 pt-6 flex justify-between items-center break-inside-avoid" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest" style={{ fontSize: '8px', color: '#a1a1aa', fontWeight: 700 }}>
                  Atendimento: {companyData?.businessHours || 'Seg. a Sex. das 08h às 18h'} • Geração Eletrônica via Plataforma Condomínio v4.0
                </p>
                <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p className="text-[8px] font-black text-zinc-900 uppercase tracking-widest" style={{ fontSize: '8px', color: '#18181b', fontWeight: 900 }}>
                     Página 1 de 1
                  </p>
                </div>
              </div>
            </div>
            {/* Hidden marker for height measurement */}
            <div className="h-1 bg-transparent overflow-hidden">.</div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />
    </div>
  );
}

