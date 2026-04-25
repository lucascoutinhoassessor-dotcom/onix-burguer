-- ============================================================
-- ONIX BURGUER — Fix: adicionar order_id na tabela financial_entries
-- Execute no SQL Editor do Supabase se ainda não tiver rodado
-- supabase-permissions-financial.sql
-- ============================================================

-- 1. Adiciona a coluna order_id (idempotente — não falha se já existir)
ALTER TABLE financial_entries
  ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES orders(order_id) ON DELETE SET NULL;

-- 2. Cria índice para melhor performance nas queries de sync
CREATE INDEX IF NOT EXISTS idx_financial_entries_order_id ON financial_entries(order_id);
