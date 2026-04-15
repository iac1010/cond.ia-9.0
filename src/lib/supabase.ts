import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verifica se as variáveis de ambiente estão configuradas
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL');

export const isLocalSupabase = !!supabaseUrl && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'));

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase não configurado ou URL inválida. O sistema usará armazenamento local temporário.');
}

if (isLocalSupabase) {
  console.warn('⚠️ Você está usando uma URL do Supabase apontando para localhost. Isso não funcionará no ambiente de preview do AI Studio.');
}

// Create client with fallback values to prevent crash on initialization
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);
