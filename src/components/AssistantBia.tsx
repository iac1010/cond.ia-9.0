import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, FileText, Download, Loader2 } from 'lucide-react';
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

const BIA_AVATAR_URL = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Woman%20Office%20Worker.png";

export function AssistantBia() {
  const [isOpen, setIsOpen] = useState(false);
  const [biaAvatarError, setBiaAvatarError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou a Bia, sua assistente virtual. É um prazer falar com você! Como posso te ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const store = useStore();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
        Você é a Bia, uma assistente virtual de gestão de condomínios.
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
        model: 'gemini-3-flash-preview',
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
        const totalReceitas = store.receipts.reduce((acc, r) => acc + r.value, 0);
        const totalDespesas = store.costs.reduce((acc, c) => acc + c.value, 0);
        return `Resumo Financeiro: Receitas totais de R$ ${totalReceitas.toFixed(2)} e despesas totais de R$ ${totalDespesas.toFixed(2)}. Saldo: R$ ${(totalReceitas - totalDespesas).toFixed(2)}.`;
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

      let response;
      let retries = 5;
      let delay = 3000;

      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Histórico da conversa:
${messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Bia'}: ${m.content}`).join('\n')}
Usuário: ${userMessage.content}`,
            config: {
              systemInstruction: 'Você é a Bia, uma assistente virtual inteligente, prestativa, educada e direta para um sistema de gestão de condomínios. Suas respostas devem ser curtas, objetivas, mas sempre muito cordiais e amigáveis. Use palavras como "por favor", "com prazer" e "claro" quando apropriado, mantendo a eficiência. Você tem acesso total às funções do sistema através de ferramentas. Use-as sempre que o usuário solicitar uma ação que corresponda a uma ferramenta. Se o usuário pedir para criar um orçamento, prefira usar "createQuote" para orçamentos formais com itens, ou "createBudget" para orçamentos rápidos vinculados a uma OS. Após criar um orçamento ou OS, sempre pergunte se o usuário deseja baixar o PDF. Se o usuário pedir para adicionar uma tarefa ou card ao Kanban, use obrigatoriamente a ferramenta "createKanbanTask". Se não tiver certeza de qual ferramenta usar, pergunte educadamente ao usuário. Você pode: gerar documentos, navegar, resumir dados, criar chamados/OS, cadastrar moradores, registrar finanças, agendar compromissos, criar orçamentos detalhados, gerar QR Codes, cadastrar insumos, adicionar tarefas de checklist, criar avisos, registrar visitantes, fazer reservas, cadastrar funcionários, controlar chaves, atualizar status de chamados/orçamentos, registrar leituras de água/energia, gerar PDFs de orçamentos e OS para download, fazer projeções financeiras, ajustar estoque de suprimentos, informar ou atualizar a parte hídrica (cisternas/reservatórios) dos condomínios, fornecer informações financeiras específicas como o maior recebimento ou a última entrada e controlar equipamentos como bombas, luzes e alarmes.',
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
                  getDetailedFinancialInfoTool, controlEquipmentTool
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
            console.warn(`AssistantBia: Gemini Rate Limit (429). Retrying in ${delay}ms... (${retries - 1} left)`);
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
          if (call.name === 'generateDocument') {
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
              observations: args.observations || 'Tarefa criada via assistente Bia',
              location: '',
              reportedBy: 'Bia Assistant',
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
              store.addTicketHistory(ticket.id, args.note, 'Bia AI');
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
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Peço desculpas, mas tive um probleminha técnico ao processar sua mensagem. Vamos tentar de novo?' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-white to-slate-50 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 overflow-hidden border-2 border-blue-500 hover:border-blue-600 hover:shadow-blue-500/30 transition-all duration-300 ring-4 ring-blue-500/10 ${isOpen ? 'hidden' : 'flex'}`}
      >
        {!biaAvatarError ? (
          <img 
            src={BIA_AVATAR_URL} 
            alt="Bia" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setBiaAvatarError(true)}
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
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-zinc-800 flex flex-col z-50 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-inner">
                  {!biaAvatarError ? (
                    <img 
                      src={BIA_AVATAR_URL} 
                      alt="Bia" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setBiaAvatarError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Bot className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Bia</h3>
                  <p className="text-xs text-blue-100">Assistente Virtual</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-zinc-950/50">
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
                      !biaAvatarError ? (
                        <img 
                          src={BIA_AVATAR_URL} 
                          alt="Bia" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setBiaAvatarError(true)}
                        />
                      ) : (
                        <Bot className="w-5 h-5 text-indigo-600" />
                      )
                    )}
                  </div>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-700 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {!biaAvatarError ? (
                      <img 
                        src={BIA_AVATAR_URL} 
                        alt="Bia" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setBiaAvatarError(true)}
                      />
                    ) : (
                      <Bot className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div className="bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-xs text-slate-500">Bia está digitando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 p-2 rounded-2xl border border-slate-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pergunte algo ou peça um documento..."
                  className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-700 dark:text-zinc-300"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
