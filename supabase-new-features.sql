-- ============================================================
-- ONIX BURGUER - NEW FEATURES MIGRATION
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. PROMOTIONS & CASHBACK
-- ============================================================
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

CREATE TABLE IF NOT EXISTS customers (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  phone            TEXT UNIQUE NOT NULL,
  email            TEXT,
  cashback_balance NUMERIC(10,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EMPLOYEES & PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff', -- 'owner' | 'manager' | 'staff'
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FINANCIAL ENTRIES
-- ============================================================
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

-- 4. INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'un', -- 'un' | 'kg' | 'g' | 'l' | 'ml'
  quantity     NUMERIC(10,3) DEFAULT 0,
  min_quantity NUMERIC(10,3) DEFAULT 0,
  cost_price   NUMERIC(10,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMER ACCOUNTS (login)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_accounts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_financial_entries_type ON financial_entries(type);
CREATE INDEX IF NOT EXISTS idx_financial_entries_due_date ON financial_entries(due_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_phone ON customer_accounts(phone);
