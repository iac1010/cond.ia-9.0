import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão configuradas
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL';
export const isLocalSupabase = !!supabaseUrl && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'));

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase URL ou Anon Key não encontrados ou não configurados corretamente nas variáveis de ambiente. O sistema pode não funcionar corretamente.');
}

if (isLocalSupabase) {
  console.warn('⚠️ Você está usando uma URL do Supabase apontando para localhost. Isso não funcionará no ambiente de preview do AI Studio. Use uma URL de projeto real do Supabase Cloud.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
