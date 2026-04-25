-- ============================================================
-- ONIX BURGUER - Migration: Financial order_id + Employee permissions
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Add order_id to financial_entries (links income entries to orders)
ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES orders(order_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_financial_entries_order_id ON financial_entries(order_id);

-- 2. Add permissions JSONB to employees (custom per-tab access control)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;

-- Examples of permissions array values:
-- Full access: '["dashboard","pedidos","cardapio","promocoes","estoque","financeiro","colaboradores","integracoes","clientes"]'
-- Staff:       '["dashboard","pedidos","estoque"]'
-- Custom:      '["dashboard","pedidos","cardapio","clientes"]'
