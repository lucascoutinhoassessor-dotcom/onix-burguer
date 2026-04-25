-- ============================================================
-- ONIX BURGUER — Fix customer_accounts + password_resets
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Criar tabela customer_accounts (com schema completo)
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_accounts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir (idempotente)
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS name          TEXT;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS email         TEXT;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- Garantir que name não seja nulo (preencher registros sem nome)
UPDATE customer_accounts SET name = 'Cliente' WHERE name IS NULL;
ALTER TABLE customer_accounts ALTER COLUMN name SET NOT NULL;

-- Garantir que password_hash não seja nulo (preencher registros sem hash)
UPDATE customer_accounts SET password_hash = '' WHERE password_hash IS NULL;
ALTER TABLE customer_accounts ALTER COLUMN password_hash SET NOT NULL;

-- 2. Índices únicos
-- ============================================================
-- phone único (se ainda não existir como constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_phone_uq
  ON customer_accounts(phone);

-- email único somente quando preenchido
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_email_uq
  ON customer_accounts(email)
  WHERE email IS NOT NULL AND email <> '';

-- índices de busca
CREATE INDEX IF NOT EXISTS idx_customer_accounts_phone
  ON customer_accounts(phone);

CREATE INDEX IF NOT EXISTS idx_customer_accounts_email
  ON customer_accounts(email)
  WHERE email IS NOT NULL;

-- 3. Trigger para atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_accounts_updated_at ON customer_accounts;
CREATE TRIGGER trg_customer_accounts_updated_at
  BEFORE UPDATE ON customer_accounts
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 4. Tabela password_resets (OTP de recuperação de senha)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_customer_id
  ON password_resets(customer_id);

CREATE INDEX IF NOT EXISTS idx_password_resets_code
  ON password_resets(code);

CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at
  ON password_resets(expires_at);

-- Limpeza automática: remover resets expirados há mais de 24h
-- (opcional - execute manualmente ou via cron)
-- DELETE FROM password_resets WHERE expires_at < NOW() - INTERVAL '24 hours';
