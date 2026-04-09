import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase.from('company_settings').select('name').limit(1);
    if (error) {
      console.error('❌ Erro ao conectar com o Supabase:', error.message);
    } else {
      console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
      console.log('Dados recebidos:', data);
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

testConnection();
