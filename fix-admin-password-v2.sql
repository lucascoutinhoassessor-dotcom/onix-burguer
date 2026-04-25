-- Corrige login do admin - versão corrigida sem colunas inexistentes

-- Atualiza ou cria o admin em admin_users (tabela original sem name/role)
INSERT INTO admin_users (id, email, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@onixburguer.com.br',
  '$2b$12$eCs4uP9VhLz0tyrkJ7IIgO4BA/.oKvhVTxPu6TY2oIks7OrVv6Q/O'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2b$12$eCs4uP9VhLz0tyrkJ7IIgO4BA/.oKvhVTxPu6TY2oIks7OrVv6Q/O';

-- Verificação
SELECT 'Admin atualizado com sucesso!' as status,
       id,
       email,
       created_at
FROM admin_users 
WHERE email = 'admin@onixburguer.com.br';
