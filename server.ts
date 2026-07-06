import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase credentials missing or invalid in server environment. Fallbacking safely.');
}

const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'placeholder-key'
);

let lastWebhookReceived: string | null = null;
let lastMessageExtracted: string | null = null;

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      console.log(`[API Request] ${req.method} ${req.url}`);
    }
    next();
  });

  const apiRouter = express.Router();

  // Health check and status endpoint
  apiRouter.get('/status', (req, res) => {
    res.json({ 
      status: 'online', 
      supabaseConfigured: isSupabaseConfigured,
      geminiConfigured: !!(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      lastWebhookReceived,
      lastMessageExtracted,
      appUrl: process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000',
      time: new Date().toISOString() 
    });
  });

  // IoT Webhook proxy endpoint to bypass CORS and Mixed Content limitations
  apiRouter.post('/iot-proxy', async (req, res) => {
    try {
      const { url, method, headers, body } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      console.log(`[IoT Proxy] Relaying request: ${method || 'GET'} ${url}`);

      // Detect local/internal network domains/IPs that are unreachable by cloud server
      let isLocal = false;
      try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname.toLowerCase();
        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host.endsWith('.local') ||
          host.startsWith('192.168.') ||
          host.startsWith('10.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
        ) {
          isLocal = true;
        }
      } catch (e) {}

      if (isLocal) {
        return res.status(400).json({
          error: 'Local URL Unreachable from Cloud Server',
          details: 'Endereços locais (.local ou IP privado) não são acessíveis a partir de servidores na nuvem. Eles precisam ser disparados diretamente pelo seu navegador (canal local).'
        });
      }

      let parsedHeaders: Record<string, string> = {};
      if (typeof headers === 'string') {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch (e) {
          // Ignore parsing error, fallback to default or empty
        }
      } else if (headers && typeof headers === 'object') {
        parsedHeaders = { ...headers };
      }

      // Prepare request option
      const options: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders
        }
      };

      if (options.method !== 'GET' && body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      res.status(response.status).json({
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
    } catch (error: any) {
      console.warn('[IoT Proxy Warn]: Expected proxy relay restriction or host unreachable:', error?.message || error);
      res.status(500).json({
        error: 'Proxy execution failed',
        details: error?.message || String(error)
      });
    }
  });

  // Gemini Priority Suggestion API based on NBR 5674 failure history
  apiRouter.post('/gemini/suggest-priority', async (req, res) => {
    try {
      const { activeTickets = [], failureHistory = [] } = req.body;
      
      if (activeTickets.length === 0) {
        return res.json({
          suggestions: [],
          generalAnalysis: "Nenhuma ordem de serviço ativa encontrada para priorização."
        });
      }

      const ai = getGeminiClient();

      const systemInstruction = `Você é um Engenheiro de Manutenção Predial e Especialista em NBR 5674 (Manutenção de Edificações).
Sua tarefa é analisar ordens de serviço ativas e sugerir a prioridade delas (CRITICAL, HIGH, MEDIUM, LOW) com base no histórico de falhas dos ativos e sistemas do condomínio.

Diretrizes de Prioridade:
- CRITICAL (Crítica): Falha ativa ou risco iminente de paralisação de sistemas vitais (Abastecimento de água, Elevadores, Segurança de Incêndio, Disjuntor Geral, SPDA), ou risco à integridade física dos ocupantes.
- HIGH (Alta): Sistemas importantes que impactam múltiplos usuários ou cuja falha pode escalar rapidamente se não contida (Ex: Interfone geral, vazamento de água moderado, portão de veículos quebrado).
- MEDIUM (Média): Manutenções preventivas de rotina programadas ou pequenos reparos estéticos/funcionais que não impedem a operação diária.
- LOW (Baixa): Melhorias estéticas, retoques de pintura, pequenos ajustes de mobília ou tarefas sem impacto operacional.

A análise deve correlacionar com o histórico de falhas fornecido. Se uma categoria ou ativo específico apresenta falhas repetitivas no histórico (ex: "bomba", "vazamento"), as ordens de serviço relacionadas a esse ativo ou categoria devem receber maior prioridade.

Responda rigorosamente no formato JSON de acordo com o esquema solicitado. Todo o texto das justificativas e ações recomendadas deve ser em Português do Brasil (pt-BR).`;

      const userPrompt = `Histórico de Falhas/Manutenções Anteriores:
${JSON.stringify(failureHistory.map((h: any) => ({
  title: h.title,
  category: h.maintenanceCategory,
  subcategory: h.maintenanceSubcategory,
  problem: h.reportedProblem || h.observations,
  status: h.status,
  date: h.date
})), null, 2)}

Ordens de Serviço Ativas a serem Priorizadas:
${JSON.stringify(activeTickets.map((t: any) => ({
  id: t.id,
  osNumber: t.osNumber,
  title: t.title,
  type: t.type,
  category: t.maintenanceCategory,
  subcategory: t.maintenanceSubcategory,
  problem: t.reportedProblem || t.observations,
  date: t.date
})), null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                description: "Lista de sugestões de prioridade para cada Ordem de Serviço ativa analisada.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ticketId: { type: Type.STRING, description: "ID exato da ordem de serviço analisada." },
                    suggestedPriority: { 
                      type: Type.STRING, 
                      description: "Prioridade recomendada: CRITICAL, HIGH, MEDIUM ou LOW." 
                    },
                    justification: { 
                      type: Type.STRING, 
                      description: "Justificativa detalhada em português, citando o histórico de falhas anterior ou riscos operacionais." 
                    },
                    recommendedAction: { 
                      type: Type.STRING, 
                      description: "Ação prática recomendada para o técnico executor em português." 
                    }
                  },
                  required: ["ticketId", "suggestedPriority", "justification", "recommendedAction"]
                }
              },
              generalAnalysis: {
                type: Type.STRING,
                description: "Um resumo executivo sobre a saúde dos ativos do condomínio, os maiores riscos atuais e recomendações de planejamento predial."
              }
            },
            required: ["suggestions", "generalAnalysis"]
          }
        }
      });

      const resultText = response.text || "{}";
      const data = JSON.parse(resultText);
      res.json(data);
    } catch (error: any) {
      console.error('Erro na API do Gemini para priorização:', error);
      res.status(500).json({ 
        error: 'Falha ao processar sugestões de prioridade com o Gemini',
        details: error.message || String(error)
      });
    }
  });

  app.use('/api', apiRouter);

  // Prevent API requests from falling through to SPA fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
