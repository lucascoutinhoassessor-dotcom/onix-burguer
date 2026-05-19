-- Tabela de configurações do bot WhatsApp
CREATE TABLE IF NOT EXISTS bot_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  active BOOLEAN DEFAULT false,
  prompt TEXT DEFAULT '',
  response_delay INTEGER DEFAULT 3,
  include_menu_context BOOLEAN DEFAULT true,
  welcome_message TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO bot_settings (id, active, prompt, response_delay, include_menu_context, welcome_message)
VALUES ('default', false, '', 3, true, '')
ON CONFLICT (id) DO NOTHING;

-- Tabela de histórico de conversas do bot
CREATE TABLE IF NOT EXISTS bot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar conversas por telefone
CREATE INDEX IF NOT EXISTS idx_bot_conversations_phone ON bot_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_bot_conversations_customer ON bot_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_bot_conversations_created_at ON bot_conversations(created_at DESC);
