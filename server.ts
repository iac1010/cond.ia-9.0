import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in server environment!');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
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
      supabaseConfigured: !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co',
      geminiConfigured: !!(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      lastWebhookReceived,
      lastMessageExtracted,
      appUrl: process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000',
      time: new Date().toISOString() 
    });
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
