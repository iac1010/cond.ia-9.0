import React, { useEffect } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { GoogleGenAI, Type } from "@google/genai";
import { sendWhatsAppMessage } from '../services/whatsappService';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

/**
 * BiaBrain: The "brain" of the AI assistant that processes WhatsApp commands.
 * It listens for new messages in Supabase and uses Gemini to interpret them.
 */
export const BiaBrain: React.FC = () => {
  const store = useStore();
  const processCommandRef = React.useRef<any>(null);

  // Keep the ref updated with the latest version of processCommand (which has the latest store)
  useEffect(() => {
    processCommandRef.current = processCommand;
  });

  useEffect(() => {
    // Expose a test function to the window for debugging
    (window as any).testBia = async (message: string = "Bia, qual o nosso saldo?") => {
      console.log('BiaBrain: Manually triggering test command:', message);
      const { data, error } = await supabase.from('whatsapp_commands').insert([{
        sender_name: 'Teste Manual',
        sender_number: '5521982240134@s.whatsapp.net',
        message_text: message,
        processed: false,
        created_at: new Date().toISOString()
      }]).select();
      
      if (error) {
        console.error('BiaBrain: Error inserting test command:', error);
        toast.error('Erro ao inserir comando de teste');
      } else {
        console.log('BiaBrain: Test command inserted successfully:', data);
        toast.success('Comando de teste inserido! Bia deve processar em instantes.');
      }
    };

    // 1. Listen for new messages in the 'whatsapp_commands' table
    console.log('BiaBrain: Starting to listen for WhatsApp commands via Supabase Realtime...');
    store.setBiaOnline(true);
    
    const channel = supabase
      .channel('whatsapp-commands')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_commands' },
        (payload) => {
          const newCommand = payload.new;
          console.log('BiaBrain: [REALTIME] New command received:', JSON.stringify(newCommand, null, 2));
          
          if (!newCommand.processed) {
            console.log('BiaBrain: Processing new command...');
            toast.success(`Bia recebeu um comando: "${newCommand.message_text.substring(0, 20)}..."`, {
              icon: '🤖',
              duration: 4000
            });
            if (processCommandRef.current) {
              processCommandRef.current(newCommand);
            } else {
              console.error('BiaBrain: processCommandRef is null, cannot process command.');
            }
          } else {
            console.log('BiaBrain: Command already processed, skipping.');
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`BiaBrain: Realtime subscription status: ${status}`);
        if (err) console.error('BiaBrain: Subscription error:', err);
      });

    // Heartbeat to show Bia is alive
    const heartbeatInterval = setInterval(() => {
      console.log('BiaBrain Heartbeat: Still listening... 🤖');
    }, 60000); // Every minute

    // 2. Fallback polling for new commands (in case Realtime is not enabled)
    const pollingInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_commands')
          .select('*')
          .eq('processed', false)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('BiaBrain Polling Error:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log(`BiaBrain Polling: Found ${data.length} unprocessed commands.`);
          for (const command of data) {
            if (processCommandRef.current) {
              // Mark as processing immediately to avoid duplicate processing during poll
              await supabase.from('whatsapp_commands').update({ processed: true, action_taken: 'PROCESSING' }).eq('id', command.id);
              await processCommandRef.current(command);
              // Add a small delay between commands to be safe
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      } catch (err) {
        console.error('BiaBrain Polling Exception:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log('BiaBrain: Cleaning up Realtime subscription and polling.');
      store.setBiaOnline(false);
      supabase.removeChannel(channel);
      clearInterval(heartbeatInterval);
      clearInterval(pollingInterval);
    };
  }, []);

  const processCommand = async (command: any) => {
    const { id, message_text, sender_name, sender_number, action_taken } = command;
    
    // If it was already being processed by polling, don't re-process
    if (action_taken === 'PROCESSING' && !command.processed) {
      // This is fine, we continue
    } else if (command.processed) {
      return;
    }
    
    console.log(`Bia received message: "${message_text}" from ${sender_name} (${sender_number})`);

    // Check if message is for Bia (starts with Bia or contains Bia)
    const isTriggered = message_text.toLowerCase().includes('bia');
    
    if (!isTriggered) {
      // If not triggered, just mark as processed but with no action
      await supabase.from('whatsapp_commands').update({ processed: true, action_taken: 'IGNORED' }).eq('id', id);
      return;
    }

    // Remove the "Bia, " or "Bia " prefix for the AI
    const cleanMessage = message_text.replace(/bia/gi, '').trim();

    if (!cleanMessage) {
      console.log('Bia: Message is just "Bia", sending greeting.');
      await supabase.from('whatsapp_commands').update({ processed: true, action_taken: 'GREETING' }).eq('id', id);
      await sendWhatsAppMessage(sender_number, "Olá! Sou a Bia, sua assistente. Como posso te ajudar hoje? Você pode me pedir para cadastrar moradores, encomendas, visitantes, agendar mudanças, abrir chamados, fazer orçamentos ou lançamentos financeiros.");
      return;
    }

    console.log(`Bia is thinking about: "${cleanMessage}"`);

    // Send an initial "thinking" message to show Bia is working
    if (sender_number !== 'test@s.whatsapp.net') {
      await sendWhatsAppMessage(sender_number, "Recebi seu comando! Deixa eu processar aqui rapidinho... ⏳");
    } else {
      console.log('BiaBrain: Skipping thinking message for internal test JID.');
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && (import.meta.env as any).VITE_GEMINI_API_KEY);
      
      if (!apiKey) {
        console.error('Bia Error: GEMINI_API_KEY is not defined in process.env or import.meta.env');
        await sendWhatsAppMessage(sender_number, "Minha inteligência está desligada (chave API não configurada). Peça ao administrador para verificar.");
        return;
      }

      console.log('Bia: Using API Key (first 5 chars):', apiKey.substring(0, 5));

      const ai = new GoogleGenAI({ apiKey });
      
      // Define the schema for the AI response
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: "The action to perform: 'ADD_CLIENT', 'ADD_PACKAGE', 'ADD_VISITOR', 'ADD_MOVE', 'ADD_TICKET', 'ADD_QUOTE', 'ADD_FINANCIAL', 'ADD_ANNOUNCEMENT', 'GET_SUMMARY', 'REPLY_ONLY', 'UNKNOWN'",
          },
          data: {
            type: Type.OBJECT,
            description: "The data extracted from the message to perform the action",
          },
          reply: {
            type: Type.STRING,
            description: "A friendly reply to send back to the user via WhatsApp",
          }
        },
        required: ["action", "data", "reply"]
      };

      const prompt = `
        Você é a Bia, a assistente virtual inteligente do sistema de gestão condominial CONDFY.IA.
        Sua tarefa é interpretar comandos de voz ou texto vindos do WhatsApp e transformá-los em ações no sistema.

        Comando do usuário: "${cleanMessage}"
        Remetente: ${sender_name}

        Ações possíveis:
        1. ADD_CLIENT: Cadastrar morador. Campos: name, phone, tower, unit, address.
        2. ADD_PACKAGE: Registrar encomenda. Campos: residentName, apartment, tower, carrier, trackingCode.
        3. ADD_VISITOR: Registrar visitante. Campos: name, document, type (VISITOR/SERVICE_PROVIDER), apartment, tower.
        4. ADD_MOVE: Agendar mudança. Campos: type (IN/OUT), date (ISO string), notes, unit, tower.
        5. ADD_TICKET: Abrir Ordem de Serviço (OS) ou Chamado. Campos: title, type (PREVENTIVA/CORRETIVA/TAREFA), observations, location, reportedBy, apartment, tower.
        6. ADD_QUOTE: Realizar orçamento. Campos: apartment, tower, items (array de {description, quantity, unitPrice}).
        7. ADD_FINANCIAL: Lançamento financeiro. Campos: description, amount, type (INCOME/EXPENSE), category, date.
        8. ADD_ANNOUNCEMENT: Criar comunicado/aviso. Campos: title, content, category (AVISO/EVENTO/MANUTENCAO), priority (LOW/MEDIUM/HIGH).
        9. GET_SUMMARY: Obter resumo ou saldo. Campos: topic ('financeiro', 'chamados', 'moradores', 'agenda', 'encomendas').
        10. REPLY_ONLY: Apenas responder a uma dúvida ou conversa sem ação no sistema.
        11. UNKNOWN: Se não entender o comando.

        Exemplos de entrada e saída:
        - "aviso para todos: amanhã falta água das 14h às 16h" -> { "action": "ADD_ANNOUNCEMENT", "data": { "title": "Falta de Água", "content": "Amanhã faltará água das 14h às 16h para manutenção.", "category": "MANUTENCAO", "priority": "HIGH" }, "reply": "Comunicado criado! Todos os moradores serão avisados sobre a falta de água." }
        - "Bia, como você está?" -> { "action": "REPLY_ONLY", "data": {}, "reply": "Estou ótima e pronta para te ajudar a gerenciar o condomínio! O que vamos fazer hoje?" }
        - "chegou uma encomenda da Amazon para o apto 101 torre A" -> { "action": "ADD_PACKAGE", "data": { "carrier": "Amazon", "apartment": "101", "tower": "A" }, "reply": "Recebido! Registrei a encomenda da Amazon para o apto 101A." }
        - "Bia, qual o nosso saldo?" -> { "action": "GET_SUMMARY", "data": { "topic": "financeiro" }, "reply": "Vou verificar o saldo para você agora mesmo." }
        
        Responda APENAS em formato JSON seguindo o schema fornecido.
      `;

      let response;
      let retries = 5;
      let delay = 3000;

      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema
            }
          });
          break; // Success!
        } catch (err: any) {
          const isRateLimit = err.message?.includes('429') || 
                             err.status === 429 || 
                             err.message?.includes('RESOURCE_EXHAUSTED') ||
                             JSON.stringify(err).includes('RESOURCE_EXHAUSTED');
          
          if (isRateLimit && retries > 1) {
            console.warn(`Bia: Gemini Rate Limit (429). Retrying in ${delay}ms... (${retries - 1} left)`);
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

      const responseText = response.text || '{}';
      const result = JSON.parse(responseText);
      if (!result.action) throw new Error('Invalid AI response');
      
      console.log('Bia interpreted:', result);

      // Execute the action
      let success = false;
      
      const findResident = (apartment?: string, tower?: string) => {
        if (!apartment) return null;
        return store.clients.find(c => {
          const unitMatch = c.unit === apartment || c.address.includes(apartment);
          const towerMatch = !tower || c.tower === tower || c.address.includes(tower);
          return unitMatch && towerMatch;
        });
      };

      switch (result.action) {
        case 'ADD_CLIENT':
          await store.addClient(result.data);
          success = true;
          break;
        case 'ADD_PACKAGE':
          const pkgResident = findResident(result.data.apartment, result.data.tower);
          await store.addPackage({ 
            ...result.data, 
            clientId: pkgResident?.id,
            residentName: result.data.residentName || pkgResident?.name || 'Morador'
          });
          success = true;
          break;
        case 'ADD_VISITOR':
          const visitorResident = findResident(result.data.apartment, result.data.tower);
          await store.addVisitor({ 
            ...result.data, 
            clientId: visitorResident?.id,
            validUntil: new Date(Date.now() + 86400000).toISOString() 
          });
          success = true;
          break;
        case 'ADD_MOVE':
          const moveResident = findResident(result.data.unit, result.data.tower);
          if (moveResident) {
            await store.addMove({ 
              ...result.data, 
              clientId: moveResident.id, 
              status: 'PENDING' 
            });
            success = true;
          } else {
            result.reply = "Não encontrei o morador para agendar essa mudança. Pode me dizer o nome ou unidade?";
          }
          break;
        case 'ADD_TICKET':
          const ticketResident = findResident(result.data.apartment, result.data.tower);
          await store.addTicket({
            title: result.data.title || 'Chamado via WhatsApp',
            type: result.data.type || 'CORRETIVA',
            status: 'PENDENTE_APROVACAO',
            observations: result.data.observations,
            location: result.data.location || `Apto ${result.data.apartment}${result.data.tower || ''}`,
            reportedBy: result.data.reportedBy || sender_name,
            clientId: ticketResident?.id,
            date: new Date().toISOString(),
            technician: 'Não atribuído'
          });
          success = true;
          break;
        case 'ADD_QUOTE':
          const quoteResident = findResident(result.data.apartment, result.data.tower);
          if (quoteResident) {
            const totalValue = result.data.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0) || 0;
            await store.addQuote({
              clientId: quoteResident.id,
              date: new Date().toISOString(),
              totalValue,
              status: 'DRAFT',
              items: result.data.items?.map((item: any, index: number) => ({
                id: (index + 1).toString(),
                ...item,
                total: item.quantity * item.unitPrice
              })) || []
            });
            success = true;
          } else {
            result.reply = "Não encontrei o morador para gerar este orçamento. Pode confirmar a unidade?";
          }
          break;
        case 'ADD_FINANCIAL':
          if (result.data.type === 'INCOME') {
            await store.addReceipt({
              description: result.data.description,
              value: result.data.amount,
              date: result.data.date || new Date().toISOString().split('T')[0],
              clientId: findResident(result.data.apartment, result.data.tower)?.id || 'avulso'
            });
          } else {
            await store.addCost({
              description: result.data.description,
              value: result.data.amount,
              date: result.data.date || new Date().toISOString().split('T')[0],
              category: result.data.category || 'Geral'
            });
          }
          success = true;
          break;
        case 'ADD_ANNOUNCEMENT':
          await store.addNotice({
            title: result.data.title || 'Comunicado via WhatsApp',
            content: result.data.content,
            category: result.data.category || 'GENERAL',
            clientId: 'SYSTEM'
          });
          success = true;
          break;
        case 'GET_SUMMARY':
          const topic = result.data.topic || 'financeiro';
          let summary = '';
          
          if (topic === 'financeiro') {
            const totalReceitas = store.receipts.reduce((acc, r) => acc + r.value, 0);
            const totalDespesas = store.costs.reduce((acc, c) => acc + c.value, 0);
            const saldo = totalReceitas - totalDespesas;
            summary = `Resumo Financeiro:
💰 Receitas: R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
💸 Despesas: R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📊 Saldo: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Status: ${saldo >= 0 ? 'Positivo ✅' : 'Negativo ⚠️'}`;
          } else if (topic === 'chamados') {
            const total = store.tickets.length;
            const abertos = store.tickets.filter(t => t.status !== 'CONCLUIDO').length;
            const concluidos = total - abertos;
            summary = `Resumo de Chamados:
📝 Total: ${total}
⏳ Em aberto: ${abertos}
✅ Concluídos: ${concluidos}`;
          } else if (topic === 'moradores') {
            const total = store.clients.length;
            summary = `Resumo de Moradores:
🏠 Total cadastrados: ${total}`;
          } else if (topic === 'agenda') {
            const hoje = new Date().toISOString().split('T')[0];
            const hojeEvents = store.appointments.filter(a => a.start.startsWith(hoje)).length;
            summary = `Resumo da Agenda:
📅 Total de compromissos: ${store.appointments.length}
🔔 Para hoje: ${hojeEvents}`;
          } else if (topic === 'encomendas') {
            const pendentes = store.packages.filter(p => p.status === 'PENDING').length;
            summary = `Resumo de Encomendas:
📦 Total registradas: ${store.packages.length}
⏳ Aguardando retirada: ${pendentes}`;
          }
          
          result.reply = summary || result.reply;
          success = true;
          break;
        case 'REPLY_ONLY':
          success = true;
          break;
        default:
          console.log('Unknown action:', result.action);
      }

      // Mark as processed in Supabase
      await supabase
        .from('whatsapp_commands')
        .update({ processed: true, action_taken: result.action })
        .eq('id', id);

      // Send reply back via WhatsApp
      if (result.reply) {
        if (sender_number === 'test@s.whatsapp.net') {
          console.log('BiaBrain: Skipping real WhatsApp reply for internal test JID.');
          toast.success(`Bia responderia: "${result.reply}"`, { icon: '💬' });
        } else {
          await sendWhatsAppMessage(sender_number, result.reply);
        }
      }

      if (success) {
        toast.success(`Bia executou: ${result.action}`);
      }

    } catch (error: any) {
      console.error('Bia failed to process command:', error);
      
      const isQuotaError = error.message?.includes('429') || 
                          error.message?.includes('RESOURCE_EXHAUSTED') ||
                          JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError) {
        await sendWhatsAppMessage(sender_number, "Minha inteligência está um pouco sobrecarregada agora (limite de uso atingido). Por favor, aguarde um minutinho e tente novamente! 🤖💤");
      } else {
        await sendWhatsAppMessage(sender_number, "Desculpe, tive um probleminha técnico ao processar seu comando. Pode tentar de novo?");
      }
    }
  };

  return null; // This component doesn't render anything
};
