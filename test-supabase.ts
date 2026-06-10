import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis se rodando de forma isolada
dotenv.config();

const TABLES_TO_TEST = [
  'clients',
  'checklist_items',
  'products',
  'tickets',
  'quotes',
  'receipts',
  'costs',
  'appointments',
  'suppliers',
  'supply_items',
  'payments',
  'legal_agreements',
  'scheduled_maintenances',
  'consumption_readings',
  'assemblies',
  'notices',
  'packages',
  'visitors',
  'critical_events',
  'digital_folder',
  'supply_quotations',
  'company_settings',
  'document_templates',
  'savings_goals',
  'energy_records',
  'contracts',
  'renovations',
  'moves',
  'billing_rules',
  'budget_forecasts',
  'sales',
  'feedbacks',
  'notifications',
  'reservations',
  'staff',
  'keys',
  'whatsapp_commands',
  'technical_reports',
  'keep_notes',
  'google_meet_records',
  'translate_history'
];

async function verifyAllTables() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  console.log('========================================================================');
  console.log('🚀 INICIANDO TESTE DE CONECTIVIDADE DE TODAS AS TABELAS NO SUPABASE');
  console.log('========================================================================');
  
  if (!url || !key) {
    console.error('❌ ERRO: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.');
    console.log('Certifique-se de configurar o arquivo .env ou declará-las no ambiente.');
    process.exit(1);
  }

  console.log(`🔗 Endpoint: ${url}`);
  console.log(`🔑 Chave Anon: ${key.substring(0, 15)}...`);
  console.log(`📋 Total de Tabelas mapeadas para teste: ${TABLES_TO_TEST.length}\n`);

  const supabase = createClient(url, key);
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TABLES_TO_TEST.length; i++) {
    const tableName = TABLES_TO_TEST[i];
    const indexStr = String(i + 1).padStart(2, '0');
    
    try {
      // Fazemos um select simples limitado a 1 registro para testar existência e permissões
      const { data, error, status } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        failCount++;
        // Se o erro indicar que a tabela não existe
        if (error.code === 'P0001' || error.message.includes('does not exist')) {
          console.log(`[${indexStr}/${TABLES_TO_TEST.length}] ❌ Tabela "${tableName}": NÃO EXISTE no banco de dados. (Erro: ${error.message})`);
        } else {
          console.log(`[${indexStr}/${TABLES_TO_TEST.length}] ⚠️ Tabela "${tableName}": Falha na resposta (Status ${status}). Erro: ${error.message}`);
        }
      } else {
        successCount++;
        const recordCount = data ? data.length : 0;
        console.log(`[${indexStr}/${TABLES_TO_TEST.length}] ✅ Tabela "${tableName}": CONECTADA E PRONTA! (Retornou ${recordCount} registro(s))`);
      }
    } catch (err: any) {
      failCount++;
      console.log(`[${indexStr}/${TABLES_TO_TEST.length}] ❌ Tabela "${tableName}": Erro inesperado ao consultar. Detalhes: ${err?.message || err}`);
    }
  }

  console.log('\n========================================================================');
  console.log('📊 RESUMO DO TESTE DE CONECTOR');
  console.log('========================================================================');
  console.log(`✅ Tabelas com sucesso:  ${successCount}/${TABLES_TO_TEST.length}`);
  console.log(`❌ Tabelas com falhas:   ${failCount}/${TABLES_TO_TEST.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 PARABÉNS! Todas as tabelas estão perfeitamente conectadas e criadas no Supabase.');
  } else {
    console.log('\n💡 DICA: Para as tabelas marcadas com ❌, certifique-se de executar o arquivo SQL (supabase_schema.sql) no Editor SQL do painel do seu Supabase.');
  }
  console.log('========================================================================\n');
}

verifyAllTables();
