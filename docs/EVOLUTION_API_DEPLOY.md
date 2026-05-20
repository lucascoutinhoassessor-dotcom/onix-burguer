# Deploy da Evolution API no Railway

## Opção 1: Deploy com um clique (Recomendado)

Clique no botão abaixo para fazer deploy direto no Railway:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/evolution-api-4)

## Opção 2: Deploy manual via Docker Compose

### 1. Crie uma conta no Railway
Acesse: https://railway.app e faça login com GitHub.

### 2. Crie um novo projeto
- Clique em "New Project"
- Escolha "Deploy from GitHub repo"
- Selecione este repositório

### 3. Adicione os serviços necessários

#### PostgreSQL:
- Clique em "New" → "Database" → "Add PostgreSQL"
- Anote a variável `DATABASE_URL`

#### Redis:
- Clique em "New" → "Database" → "Add Redis"
- Anote a variável `REDIS_URL`

#### Evolution API (serviço principal):
- Clique em "New" → "Docker Image"
- Image: `atendai/evolution-api:latest`
- Adicione as variáveis de ambiente abaixo

### 4. Variáveis de Ambiente

Configure estas variáveis no serviço da Evolution API:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_PROVIDER` | `postgresql` | Tipo de banco |
| `DATABASE_CONNECTION_URI` | `${{Postgres.DATABASE_URL}}` | URL do PostgreSQL |
| `CACHE_REDIS_URI` | `${{Redis.REDIS_URL}}` | URL do Redis |
| `CACHE_REDIS_ENABLED` | `true` | Ativa cache Redis |
| `SERVER_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | URL pública |
| `AUTHENTICATION_API_KEY` | `sua-chave-secreta-aqui` | Chave de API |
| `WEBHOOK_GLOBAL_ENABLED` | `true` | Ativa webhooks |
| `WEBHOOK_GLOBAL_URL` | `https://onix-burguer.vercel.app/api/bot/webhook` | URL do webhook |
| `WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS` | `true` | Envia por eventos |
| `WEBHOOK_EVENTS_MESSAGES_UPSERT` | `true` | Evento de mensagens |
| `WEBHOOK_EVENTS_MESSAGES_UPDATE` | `true` | Evento de updates |
| `WEBHOOK_EVENTS_CONNECTION_UPDATE` | `true` | Evento de conexão |

### 5. Volume (Persistência)

Adicione um volume para persistir os dados das instâncias:
- Mount path: `/evolution/instances`

### 6. Deploy

Clique em "Deploy" e aguarde o build.

### 7. Configure no Vercel

Após o deploy, copie a URL pública do Railway (ex: `https://evolution-api.seu-usuario.railway.app`) e configure no Vercel:

- `EVOLUTION_API_URL` = URL do Railway
- `EVOLUTION_API_KEY` = `sua-chave-secreta-aqui`

## Comandos úteis

### Verificar status:
```bash
curl https://sua-url.railway.app/
```

### Criar instância via API:
```bash
curl -X POST https://sua-url.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave-secreta" \
  -d '{
    "instanceName": "modelo-bot",
    "token": "modelo-bot-token",
    "qrcode": true
  }'
```

### Conectar (gerar QR Code):
```bash
curl https://sua-url.railway.app/instance/connect/modelo-bot \
  -H "apikey: sua-chave-secreta"
```

### Enviar mensagem:
```bash
curl -X POST https://sua-url.railway.app/message/sendText/modelo-bot \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave-secreta" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Teste do bot"
  }'
```

## Troubleshooting

### Erro 401 (Unauthorized):
- Verifique se a `AUTHENTICATION_API_KEY` está correta
- Confirme que está enviando o header `apikey`

### QR Code não aparece:
- Verifique se a instância foi criada com `"qrcode": true`
- Confirme se o número de telefone não está vinculado em outro lugar

### Webhook não funciona:
- Verifique se a URL do webhook está acessível publicamente
- Confirme se `WEBHOOK_GLOBAL_ENABLED` está `true`
- Verifique os logs no Railway

## Documentação oficial
https://doc.evolution-api.com
