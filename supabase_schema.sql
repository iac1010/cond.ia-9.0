-- Script SQL para criação das tabelas no Supabase (CONDFY.IA)

-- Habilitar extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document TEXT,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  notes TEXT,
  locations JSONB DEFAULT '[]',
  tower TEXT,
  unit TEXT,
  vehicles TEXT,
  pets TEXT,
  cistern_volume DECIMAL(12, 2),
  reservoir_volume DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Itens de Checklist
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task TEXT NOT NULL,
  category TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Produtos/Serviços
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Ordens de Serviço (Tickets)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_number TEXT,
  title TEXT,
  type TEXT NOT NULL CHECK (type IN ('PREVENTIVA', 'CORRETIVA', 'TAREFA')),
  status TEXT CHECK (status IN ('PENDENTE_APROVACAO', 'APROVADO', 'EM_ROTA', 'AGUARDANDO_MATERIAL', 'REALIZANDO', 'CONCLUIDO', 'REJEITADO')),
  maintenance_category TEXT,
  maintenance_subcategory TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  technician TEXT NOT NULL,
  observations TEXT,
  reported_problem TEXT,
  products_for_quote TEXT,
  service_report TEXT,
  checklist_results JSONB, -- Array de objetos: [{taskId, status, notes}]
  images TEXT[], -- Array de URLs ou Base64 das imagens
  reported_by TEXT,
  location TEXT,
  photo_before TEXT,
  budget_amount DECIMAL(10, 2),
  budget_approved BOOLEAN DEFAULT FALSE,
  color TEXT,
  history JSONB, -- Array de objetos: [{id, date, note, userName}]
  used_materials JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Orçamentos (Quotes)
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_value DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'APPROVED', 'REJECTED')),
  items JSONB NOT NULL, -- Array de objetos QuoteItem: [{id, description, quantity, unitPrice, total}]
  installments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Recibos
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Custos/Despesas
CREATE TABLE IF NOT EXISTS costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Agendamentos (Calendário)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TICKET', 'MEETING', 'OTHER')),
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  category TEXT CHECK (category IN ('LIMPEZA', 'PISCINA', 'GERAL', 'MANUTENCAO', 'SEGURANCA')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de Itens de Suprimentos
CREATE TABLE IF NOT EXISTS supply_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('LIMPEZA', 'PISCINA')),
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT,
  last_price DECIMAL(10, 2),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('PAID', 'PENDING', 'OVERDUE')),
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Tabela de Acordos Jurídicos
CREATE TABLE IF NOT EXISTS legal_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  installments INTEGER NOT NULL,
  remaining_installments INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'BREACHED')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Tabela de Manutenções Agendadas (NBR 5674)
CREATE TABLE IF NOT EXISTS scheduled_maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  standard_id TEXT NOT NULL,
  item TEXT NOT NULL,
  frequency TEXT NOT NULL,
  last_done TIMESTAMP WITH TIME ZONE,
  next_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'DONE', 'OVERDUE')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Tabela de Leituras de Consumo
CREATE TABLE IF NOT EXISTS consumption_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('WATER', 'GAS', 'ENERGY')),
  previous_value DECIMAL(12, 3) NOT NULL,
  current_value DECIMAL(12, 3) NOT NULL,
  consumption DECIMAL(12, 3) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  unit TEXT,
  billed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Tabela de Assembleias Virtuais
CREATE TABLE IF NOT EXISTS assemblies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED')),
  options JSONB NOT NULL, -- Array de objetos: [{id, text}]
  votes JSONB DEFAULT '[]', -- Array de objetos: [{id, userId, userName, optionId, timestamp, signature}]
  legal_validity_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Tabela de Comunicados (Notices)
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MAINTENANCE', 'EVENT', 'GENERAL', 'SECURITY')),
  tower TEXT,
  apartment_line TEXT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Tabela de Encomendas (Packages)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_name TEXT NOT NULL,
  apartment TEXT NOT NULL,
  tower TEXT,
  carrier TEXT,
  tracking_code TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PICKED_UP')),
  qr_code TEXT,
  photo_url TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Tabela de Visitantes
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document TEXT,
  type TEXT NOT NULL CHECK (type IN ('VISITOR', 'SERVICE_PROVIDER')),
  apartment TEXT NOT NULL,
  tower TEXT,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  qr_code TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'USED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Tabela de Eventos Críticos (IoT)
CREATE TABLE IF NOT EXISTS critical_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device TEXT NOT NULL,
  location TEXT,
  type TEXT NOT NULL CHECK (type IN ('PUMP', 'DOOR', 'FIRE', 'ELECTRICAL')),
  status TEXT NOT NULL CHECK (status IN ('NORMAL', 'ALERT', 'CRITICAL')),
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Tabela de Pasta Digital (Documentos)
CREATE TABLE IF NOT EXISTS digital_folder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(12, 2),
  file_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'VALIDATED', 'REJECTED')),
  signatures JSONB DEFAULT '[]', -- Array de objetos: [{id, userName, role, date}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Tabela de Cotações de Suprimentos
CREATE TABLE IF NOT EXISTS supply_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items JSONB NOT NULL, -- Array de objetos: [{supplyItemId, quantity}]
  responses JSONB DEFAULT '{}', -- Objeto: {supplierId: {itemId: price}}
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. Tabela de Configurações da Empresa (Registro Único)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  document TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  signature_url TEXT,
  background_image TEXT,
  theme TEXT DEFAULT 'light',
  menu_order TEXT[],
  tile_sizes JSONB DEFAULT '{}',
  tile_order JSONB DEFAULT '[]',
  hidden_tiles TEXT[] DEFAULT '{}',
  energy_data JSONB DEFAULT '[]',
  iot_state JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro padrão de configurações se não existir
INSERT INTO company_settings (name, theme, menu_order) 
SELECT 'CONDFY.IA', 'light', ARRAY['dashboard', 'accountability', 'consumption', 'clients', 'products', 'supplies', 'tickets', 'kanban', 'quotes', 'receipts', 'financial', 'calendar', 'settings']
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- 23. Tabela de Modelos de Documentos (Document Factory)
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  legal_basis TEXT,
  content TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. Tabela de Metas de Economia (Savings Goals)
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'PAUSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. Tabela de Registros de Energia (Energy Records)
CREATE TABLE IF NOT EXISTS energy_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL,
  consumption DECIMAL(12, 2) NOT NULL,
  solar_generation DECIMAL(12, 2) NOT NULL,
  sensor_savings DECIMAL(12, 2) NOT NULL,
  cost_without_tech DECIMAL(12, 2) NOT NULL,
  actual_cost DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 26. Tabela de Contratos (Contracts)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  category TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  value DECIMAL(12, 2),
  payment_frequency TEXT CHECK (payment_frequency IN ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. Tabela de Reformas (Renovations)
CREATE TABLE IF NOT EXISTS renovations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(12, 2),
  art_file_url TEXT,
  technician_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 28. Tabela de Mudanças (Moves)
CREATE TABLE IF NOT EXISTS moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED')),
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 29. Tabela de Regras de Faturamento (Billing Rules)
CREATE TABLE IF NOT EXISTS billing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  days_before_due INTEGER[],
  days_after_due INTEGER[],
  message_template TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 30. Tabela de Previsão Orçamentária (Budget Forecasts)
CREATE TABLE IF NOT EXISTS budget_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL,
  monthly_projections JSONB DEFAULT '[]',
  categories JSONB DEFAULT '[]',
  insights TEXT[] DEFAULT '{}',
  confidence DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 31. Tabela de Vendas (Sales)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  area TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 32. Tabela de Feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 33. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INFO', 'WARNING', 'SUCCESS', 'ERROR')),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 34. Tabela de Reservas
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 35. Tabela de Funcionários (Staff)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  shift TEXT NOT NULL CHECK (shift IN ('MORNING', 'AFTERNOON', 'NIGHT', 'FLEXIBLE')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 36. Tabela de Controle de Chaves
CREATE TABLE IF NOT EXISTS keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'BORROWED', 'LOST')),
  borrowed_by TEXT,
  borrowed_at TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. Tabela de Comandos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_name TEXT,
  sender_number TEXT,
  message_text TEXT,
  processed BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Realtime para estas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_commands;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Habilitar RLS para whatsapp_commands
ALTER TABLE whatsapp_commands ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_commands (Acesso total para o app)
DROP POLICY IF EXISTS "Allow all access to whatsapp_commands" ON whatsapp_commands;
CREATE POLICY "Allow all access to whatsapp_commands" ON whatsapp_commands FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- TRIGGERS PARA ATUALIZAR O UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('company_settings') -- já tem trigger ou é especial
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_modtime ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_modtime BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE update_modified_column()', t, t);
    END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS update_company_settings_modtime ON company_settings;
CREATE TRIGGER update_company_settings_modtime BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ==========================================
-- SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- ==========================================
-- Para simplificar inicialmente, vamos habilitar RLS e permitir acesso total a usuários autenticados.
-- Em produção, você deve restringir as políticas.

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access to authenticated users" ON %I', t);
        EXECUTE format('CREATE POLICY "Allow full access to authenticated users" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
        
        -- Adicionar política para anon (acesso total para testes sem Auth)
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access to anon" ON %I', t);
        EXECUTE format('CREATE POLICY "Allow full access to anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
    END LOOP;
END;
$$;

-- Atualizações de esquema (para bancos já existentes)
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS tower TEXT;
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS vehicles TEXT;
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS pets TEXT;
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS cistern_volume DECIMAL(12, 2);
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS reservoir_volume DECIMAL(12, 2);

ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS background_image TEXT;
ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS tile_sizes JSONB DEFAULT '{}';
ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS tile_order JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS hidden_tiles TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS energy_data JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS iot_state JSONB DEFAULT '{}';
ALTER TABLE IF EXISTS tickets ADD COLUMN IF NOT EXISTS used_materials JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS quotes ADD COLUMN IF NOT EXISTS installments JSONB DEFAULT '[]';

-- Contracts updates
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS payment_frequency TEXT;
ALTER TABLE IF EXISTS contracts ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Renovations updates
ALTER TABLE IF EXISTS renovations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS renovations ADD COLUMN IF NOT EXISTS art_file_url TEXT;
ALTER TABLE IF EXISTS renovations ADD COLUMN IF NOT EXISTS technician_name TEXT;

-- Moves updates
-- (status is already there, company is already there in some versions but let's be sure)
ALTER TABLE IF EXISTS moves ADD COLUMN IF NOT EXISTS company TEXT;

-- Budget Forecasts updates
ALTER TABLE IF EXISTS budget_forecasts ADD COLUMN IF NOT EXISTS month TEXT;
ALTER TABLE IF EXISTS budget_forecasts ADD COLUMN IF NOT EXISTS monthly_projections JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS budget_forecasts ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS budget_forecasts ADD COLUMN IF NOT EXISTS insights TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS budget_forecasts ADD COLUMN IF NOT EXISTS confidence DECIMAL(5, 2);
