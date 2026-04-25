-- ============================================================
-- ONIX BURGUER — Supabase SQL Schema
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        TEXT UNIQUE NOT NULL,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT,
  items           JSONB NOT NULL DEFAULT '[]',
  total           NUMERIC(10, 2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  payment_method  TEXT NOT NULL DEFAULT 'pix',
  fulfillment_mode TEXT NOT NULL DEFAULT 'local',
  payment_id      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Histórico de status
CREATE TABLE IF NOT EXISTS order_status_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Usuários admin
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Itens do cardápio (gerenciados pelo admin)
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

-- ============================================================
-- Índices úteis
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- ============================================================
-- Habilitar Realtime para a tabela orders
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- Políticas RLS (Row Level Security)
-- Se quiser usar a chave anon, habilite RLS e crie políticas.
-- Para usar apenas service_role (recomendado), deixe RLS desabilitado.
-- ============================================================
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Criar usuário admin inicial
-- Substitua o hash abaixo pelo hash bcrypt da sua senha.
-- Gere em: https://bcrypt-generator.com (cost=12)
-- Exemplo: senha "admin123" → hash bcrypt abaixo
-- ============================================================
INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@onixburguer.com.br',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5udem'
  -- IMPORTANTE: Este é um hash de exemplo. Substitua pela senha real!
)
ON CONFLICT (email) DO NOTHING;
