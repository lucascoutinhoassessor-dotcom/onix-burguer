-- ============================================================
-- ONIX BURGUER — Supabase SQL Setup
-- Execute este arquivo no SQL Editor do Supabase
-- Substitui o supabase-setup.sql com o hash admin correto
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

-- 2. Historico de status
CREATE TABLE IF NOT EXISTS order_status_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Usuarios admin
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Itens do cardapio
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

-- Indices
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- USUARIO ADMIN
-- Email: admin@onixburguer.com.br  |  Senha: admin123
-- Hash bcrypt cost=12 (gerado pelo bcryptjs do projeto)
-- ============================================================
INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@onixburguer.com.br',
  '$2b$12$f6.PfaT9Oxh8gxF4iYzMxuYYcj94yD7yhyEBq2akWOgmBuio9tBfu'
)
ON CONFLICT (email) DO NOTHING;