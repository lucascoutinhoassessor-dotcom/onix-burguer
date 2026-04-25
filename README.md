# Onix Burguer Artesanal

Landing page + painel admin desenvolvidos com Next.js 14, TypeScript e Tailwind CSS.

## Stack

- Next.js 14 com App Router
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- bcryptjs + jose (JWT)

---

## Configuração do Supabase

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (gratuito)
2. Clique em **New Project**
3. Escolha um nome (ex: `onix-burguer`), defina uma senha forte para o banco e selecione a região mais próxima (ex: São Paulo)
4. Aguarde o projeto inicializar (~2 min)

### 2. Criar as tabelas (executar o SQL)

1. No painel do projeto, vá em **SQL Editor** (menu lateral)
2. Clique em **New Query**
3. Cole o conteúdo inteiro do arquivo `supabase-setup.sql` (na raiz do projeto)
4. Clique em **Run** (ou `Ctrl+Enter`)

O script cria:
- `orders` — pedidos
- `order_status_history` — histórico de status
- `admin_users` — usuários do painel admin
- `menu_items` — itens do cardápio
- Índices e habilita Realtime para `orders`
- **Insere o usuário admin inicial** (veja credenciais abaixo)

> **Nota sobre o hash no SQL:** O arquivo `supabase-setup.sql` contém o hash bcrypt correto para a senha `admin123`. Se o arquivo estiver mostrando um hash diferente (ex: `$2b$12$LQv3c1yqBWVH...`), substitua manualmente pelo hash abaixo antes de executar:
>
> ```
> $2b$12$f6.PfaT9Oxh8gxF4iYzMxuYYcj94yD7yhyEBq2akWOgmBuio9tBfu
> ```

### 3. Obter as credenciais da API

1. No painel do Supabase, vá em **Settings → API** (menu lateral)
2. Copie:
   - **Project URL** → `https://xxxxxxxxxxx.supabase.co`
   - **anon public** (em "Project API keys") → chave pública
   - **service_role** (em "Project API keys", clique para revelar) → chave privada (nunca exponha no frontend)

### 4. Configurar o `.env.local`

Abra `.env.local` na raiz do projeto e substitua os placeholders pelas credenciais reais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...  (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...       (service_role key)
```

O `JWT_SECRET` já está preenchido com um valor seguro gerado automaticamente.

---

## Login no Painel Admin

### Credenciais padrão

| Campo | Valor |
|-------|-------|
| URL   | `http://localhost:3000/admin/login` |
| Email | `admin@onixburguer.com.br` |
| Senha | `admin123` |

> **Importante:** Troque a senha após o primeiro login em produção.

### Como fazer login

1. Certifique-se de que o servidor está rodando (`npm run dev`)
2. Acesse `http://localhost:3000/admin/login`
3. Insira o email e a senha acima
4. Você será redirecionado para `/admin` (dashboard)

O sistema usa JWT armazenado em cookie `httpOnly`. A sessão dura 24 horas.

---

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Edite .env.local com as credenciais do Supabase (veja acima)

# 3. Executar o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/cardapio` | Cardápio completo |
| `/checkout` | Finalizar pedido |
| `/admin/login` | Login do painel admin |
| `/admin` | Dashboard do admin |
| `/admin/pedidos` | Gerenciar pedidos |
| `/admin/cardapio` | Gerenciar cardápio |

## Estrutura

```
src/
├── app/
│   ├── admin/         # Painel administrativo (protegido por JWT)
│   ├── api/           # Rotas de API (auth, orders, menu, payment)
│   └── ...            # Páginas públicas
├── components/        # Componentes React
├── lib/
│   └── supabase.ts    # Clientes Supabase (public + admin)
└── middleware.ts      # Proteção das rotas /admin/*
```

## Solução de problemas

**Login retorna "Credenciais inválidas":**
- Verifique se o SQL foi executado com sucesso no Supabase
- Confirme que `SUPABASE_SERVICE_ROLE_KEY` está correto no `.env.local`
- Reinicie o servidor após alterar o `.env.local`

**Supabase retorna erro de conexão:**
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` está correto (deve terminar em `.supabase.co`)
- Não adicione `/` no final da URL

**Página `/admin` redireciona para login mesmo após autenticar:**
- Verifique se `JWT_SECRET` está definido no `.env.local`