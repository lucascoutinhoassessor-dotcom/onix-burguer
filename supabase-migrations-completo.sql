-- ============================================================
-- ONIX BURGUER — Supabase Migrations Completo
-- Execute no SQL Editor do seu projeto Supabase
-- Inclui todas as tabelas: base + novas funcionalidades
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. PEDIDOS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id         TEXT UNIQUE NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT,
  items            JSONB NOT NULL DEFAULT '[]',
  total            NUMERIC(10, 2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  payment_method   TEXT NOT NULL DEFAULT 'pix',
  fulfillment_mode TEXT NOT NULL DEFAULT 'local',
  payment_id       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 2. HISTÓRICO DE STATUS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 3. USUÁRIOS ADMIN (legacy)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 4. ITENS DO CARDÁPIO
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10, 2) NOT NULL,
  category      TEXT NOT NULL,
  image         TEXT,
  active        BOOLEAN DEFAULT TRUE,
  option_groups JSONB DEFAULT '[]',
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 5. PROMOÇÕES E CUPONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed' | 'free_shipping'
  value       NUMERIC(10,2) NOT NULL DEFAULT 0,
  code        TEXT UNIQUE,
  min_order   NUMERIC(10,2) DEFAULT 0,
  start_at    TIMESTAMPTZ,
  end_at      TIMESTAMPTZ,
  active      BOOLEAN DEFAULT TRUE,
  uses_count  INTEGER DEFAULT 0,
  max_uses    INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 6. CAMPANHAS DE MARKETING WHATSAPP
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type            TEXT NOT NULL DEFAULT 'mass',  -- 'individual' | 'mass'
  target          TEXT,                           -- phone number for individual sends
  filters         JSONB,                          -- { city, min_spend, last_order_days }
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'sent' | 'failed'
  sent_at         TIMESTAMPTZ,
  delivered_count INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 7. COLABORADORES / FUNCIONÁRIOS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email               TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  password_hash       TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'staff', -- 'owner' | 'manager' | 'staff' | 'motoboy'
  active              BOOLEAN DEFAULT TRUE,
  cpf                 TEXT,
  cnh                 TEXT,              -- número CNH (motoboy)
  document_photo_url  TEXT,              -- foto do documento (motoboy)
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir (idempotente)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS document_photo_url TEXT;

-- ──────────────────────────────────────────────────────────────
-- 8. LANÇAMENTOS FINANCEIROS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_entries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type        TEXT NOT NULL DEFAULT 'income', -- 'income' | 'expense'
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  due_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'overdue'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 9. FORNECEDORES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  legal_name  TEXT,          -- Razão social
  phone       TEXT,
  cnpj_cpf    TEXT,
  email       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 10. ESTOQUE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'un', -- 'un' | 'kg' | 'g' | 'l' | 'ml'
  quantity     NUMERIC(10,3) DEFAULT 0,
  min_quantity NUMERIC(10,3) DEFAULT 0,
  cost_price   NUMERIC(10,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 11. CONTAS DE CLIENTES (login)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_accounts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT,
  email         TEXT,
  origin        TEXT NOT NULL DEFAULT 'site', -- 'site' | 'manual' | 'ifood' | 'api'
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_order_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'site';
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- ──────────────────────────────────────────────────────────────
-- 12. INTEGRAÇÕES (iFood, Uber Eats, etc.)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform    TEXT UNIQUE NOT NULL,  -- 'ifood' | 'ubereats' | 'rappi' | 'whatsapp'
  api_key     TEXT,
  api_secret  TEXT,
  webhook_url TEXT,                  -- webhook secret token
  active      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default integrations (inactive)
INSERT INTO integrations (platform, active) VALUES
  ('ifood',    FALSE),
  ('ubereats', FALSE),
  ('rappi',    FALSE),
  ('whatsapp', FALSE)
ON CONFLICT (platform) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status              ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at          ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_category        ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_promotions_code            ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active          ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_employees_email            ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role             ON employees(role);
CREATE INDEX IF NOT EXISTS idx_financial_entries_type     ON financial_entries(type);
CREATE INDEX IF NOT EXISTS idx_financial_entries_due_date ON financial_entries(due_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name       ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_phone    ON customer_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_origin   ON customer_accounts(origin);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_last_order ON customer_accounts(last_order_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name             ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_integrations_platform      ON integrations(platform);

-- ──────────────────────────────────────────────────────────────
-- REALTIME
-- ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ──────────────────────────────────────────────────────────────
-- ADMIN INICIAL
-- Substitua o hash pela senha desejada (gerado em https://bcrypt-generator.com com cost=12)
-- ──────────────────────────────────────────────────────────────
INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@onixburguer.com.br',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5udem'
)
ON CONFLICT (email) DO NOTHING;

-- Colaborador owner inicial (opcional)
-- INSERT INTO employees (email, name, password_hash, role)
-- VALUES ('admin@onixburguer.com.br', 'Admin', '$2b$12$...', 'owner')
-- ON CONFLICT (email) DO NOTHING;
