import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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
