-- ============================================================
-- ONIX BURGUER - WhatsApp Business API Configuration Table
-- Run this in your Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_config (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number_id      TEXT NOT NULL,
  access_token         TEXT NOT NULL,
  business_account_id  TEXT,
  webhook_verify_token TEXT,
  status               TEXT NOT NULL DEFAULT 'disconnected', -- 'connected' | 'disconnected' | 'error'
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Only one row is allowed (singleton config)
-- Ensure only one row can exist via a unique constraint on a constant
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_config_singleton ON whatsapp_config ((TRUE));

-- RLS: only service role can access
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE whatsapp_config IS 'WhatsApp Business API (Meta) configuration - singleton table';
