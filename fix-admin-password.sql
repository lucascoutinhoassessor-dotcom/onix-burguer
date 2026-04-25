-- ============================================================
-- ONIX BURGUER — Fix Admin Login
-- Execute no SQL Editor do Supabase
-- ============================================================
-- Este script corrige o hash da senha do admin padrão.
-- Senha padrão: admin123
-- Hash bcrypt (cost=12) gerado via bcryptjs:

-- 1. Garante que o admin existe em admin_users com hash correto
INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@onixburguer.com.br',
  '$2b$12$eCs4uP9VhLz0tyrkJ7IIgO4BA/.oKvhVTxPu6TY2oIks7OrVv6Q/O'
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = '$2b$12$eCs4uP9VhLz0tyrkJ7IIgO4BA/.oKvhVTxPu6TY2oIks7OrVv6Q/O';

-- 2. Garante que o admin também existe em employees como owner (fallback)
--    Certifique-se de que a coluna permissions existe antes de rodar:
--    ALTER TABLE employees ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;
INSERT INTO employees (email, name, password_hash, role, active, permissions)
VALUES (
  'admin@onixburguer.com.br',
  'Admin',
  '$2b$12$eCs4uP9VhLz0tyrkJ7IIgO4BA/.oKvhVTxPu6TY2oIks7OrVv6Q/O',
  'owner',
  true,
  NULL
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = '$2b$12$eCs4uP9VhLz0tyrkJ7IIgO4BA/.oKvhVTxPu6TY2oIks7OrVv6Q/O',
      role         = 'owner',
      active       = true;

-- Verificação: confirmar os registros inseridos
SELECT 'admin_users' AS tabela, id, email, created_at FROM admin_users WHERE email = 'admin@onixburguer.com.br'
UNION ALL
SELECT 'employees'   AS tabela, id, email, created_at FROM employees   WHERE email = 'admin@onixburguer.com.br';
