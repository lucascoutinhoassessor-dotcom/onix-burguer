# Deploy Rápido da Evolution API no Railway

## Passo a passo (2 minutos)

### 1. Acesse o template oficial
Clique aqui: https://railway.com/deploy/evolution-api-4

### 2. Configure o projeto
- **Project Name**: `modelo-hamburguer-bot`
- **Environment**: `production`

### 3. Adicione as variáveis de ambiente
Clique em "Variables" e adicione:

```
AUTHENTICATION_API_KEY = modelo-api-key-2024
WEBHOOK_GLOBAL_ENABLED = true
WEBHOOK_GLOBAL_URL = https://onix-burguer.vercel.app/api/bot/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS = true
WEBHOOK_EVENTS_MESSAGES_UPSERT = true
WEBHOOK_EVENTS_CONNECTION_UPDATE = true
```

### 4. Deploy
Clique em "Deploy" e aguarde (cerca de 2-3 minutos).

### 5. Copie a URL pública
Após o deploy, vá em "Settings" → "Domains" e copie a URL (ex: `https://evolution-api-production-xxx.up.railway.app`).

### 6. Configure no Vercel
Acesse: https://vercel.com/lucas-projects-49e9681f/onix-burguer/settings/environment-variables

Adicione:
```
EVOLUTION_API_URL = https://sua-url-do-railway.app
EVOLUTION_API_KEY = modelo-api-key-2024
```

### 7. Teste
Acesse: https://onix-burguer.vercel.app/admin/bot
Clique em "Gerar QR Code" e escaneie no WhatsApp.

---

## Alternativa: Deploy via Docker local

Se preferir testar localmente antes:

```bash
cd C:\Users\Lucas\Projects\onix-burguer
docker-compose -f docker-compose.evolution.yml up -d
```

Acesse: http://localhost:8080

Configure no Vercel:
```
EVOLUTION_API_URL = http://seu-ip-local:8080
EVOLUTION_API_KEY = sua-chave-secreta-aqui
```

**Nota**: Para produção, use o Railway (URL pública) ou um VPS.
