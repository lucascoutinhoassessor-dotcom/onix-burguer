-- Tabela de configuraÃ§Ãµes da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  address TEXT,
  instagram TEXT,
  whatsapp TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica para permitir todas as operaÃ§Ãµes
CREATE POLICY "Allow all" ON company_settings
  FOR ALL USING (true) WITH CHECK (true);
