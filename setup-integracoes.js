const fs = require('fs');
const path = require('path');

const projectPath = 'C:\\Users\\Lucas\\Projects\\onix-burguer';
const integracoesPath = path.join(projectPath, 'src/app/admin/integracoes/page.tsx');

let content = fs.readFileSync(integracoesPath, 'utf8');

// 1. Atualizar o card de gatilho no final
const oldGatilho = "      <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-5">
        <h3 className="mb-3 font-semibold text-cream">Gatilho: Saiu para Entrega → Motoboy</h3>
        <p className="text-sm text-cream/50">
          Quando um pedido atingir o status <span className="rounded bg-purple-500/10 px-1 text-xs text-purple-400">Saiu para entrega</span>,
          o sistema registrará automaticamente um disparo de WhatsApp para os motoboys ativos cadastrados em Colaboradores.
        </p>
      </div>";

const newGatilho = "      <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-5">
        <h3 className="mb-3 font-semibold text-cream">Gatilho: Pronto → Chamado de Coleta</h3>
        <p className="text-sm text-cream/50">
          Quando um pedido atingir o status <span className="rounded bg-emerald-500/10 px-1 text-xs text-emerald-400">Pronto</span>,
          o sistema enviará automaticamente uma mensagem em background (via integração WhatsApp) para os motoboys ativos virem buscar o pedido, sem necessidade de interação manual ou abertura de janelas.
        </p>
      </div>";

content = content.replace(oldGatilho, newGatilho);

// 2. Substituir o WhatsAppBusinessPanel por um novo com QR Code
const oldWhatsAppPanel = `function WhatsAppBusinessPanel() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<WhatsAppForm>(EMPTY_WA_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-config");
      const data = (await res.json()) as { config?: WhatsAppConfig };
      setConfig(data.config ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConfig(); }, []);

  function startEdit() {
    setForm({
      phone_number_id: config?.phone_number_id ?? "",
      access_token: "",
      business_account_id: config?.business_account_id ?? "",
      webhook_verify_token: config?.webhook_verify_token ?? ""
    });
    setEditing(true);
    setMsg(null);
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/whatsapp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json() as { config?: WhatsAppConfig; error?: string };
      if (!res.ok || data.error) {
        setMsg({ text: data.error ?? "Erro ao salvar", type: "error" });
      } else {
        setMsg({ text: "Configuração salva com sucesso!", type: "success" });
        setEditing(false);
        await loadConfig();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/whatsapp-config?action=test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number_id: editing ? form.phone_number_id : config?.phone_number_id,
          access_token: editing ? form.access_token : undefined
        })
      });
      const data = await res.json() as { success: boolean; display_phone_number?: string; error?: string };
      if (data.success) {
        setMsg({
          text: "Conexão bem-sucedida! Número: ${data.display_phone_number ?? "verificado"}",
          type: "success"
        });
        await loadConfig();
      } else {
        setMsg({ text: "Falha na conexão: ${data.error}", type: "error" });
        await loadConfig();
      }
    } finally {
      setTesting(false);
    }
  }

  const statusColor =
    config?.status === "connected"
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : config?.status === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

  const statusLabel =
    config?.status === "connected" ? "Conectado" :
    config?.status === "error" ? "Erro" :
    config ? "Desconectado" : "Não configurado";

  if (loading) {
    return <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 text-cream/30 text-sm">Carregando...</div>;
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💬</span>
          <div>
            <h3 className="font-semibold text-cream">WhatsApp Business API</h3>
            <p className="text-xs text-cream/40">API oficial Meta — envio de mensagens, notificações de pedidos e recuperação de senha</p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}"}>
          {statusLabel}
        </span>
      </div>

      {/* Status message */}
      {msg && (
        <div className={"mt-4 rounded-lg border p-3 text-sm ${
          msg.type === "success"
            ? "border-green-500/20 bg-green-500/5 text-green-400"
            : "border-red-500/20 bg-red-500/5 text-red-400"
        }"}>
          {msg.text}
        </div>
      )}

      {/* How-to instructions toggle */}
      <button
        onClick={() => setShowInstructions((v) => !v)}
        className="mt-4 flex items-center gap-1.5 text-xs text-amberglow/70 hover:text-amberglow transition-colors"
      >
        <span>{showInstructions ? "▼" : "▶"}</span>
        Como criar seu app no developers.facebook.com
      </button>

      {showInstructions && (
        <div className="mt-3 rounded-lg border border-amberglow/15 bg-amberglow/5 p-4 text-xs text-cream/60 space-y-2">
          <p className="font-semibold text-amberglow">Passo a passo para configurar a API do WhatsApp Business:</p>
          <ol className="list-decimal ml-4 space-y-1.5">
            <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-amberglow underline">developers.facebook.com</a> e faça login com sua conta Meta.</li>
            <li>Clique em <strong className="text-cream/80">Meus Apps</strong> → <strong className="text-cream/80">Criar App</strong>.</li>
            <li>Selecione o tipo <strong className="text-cream/80">Business</strong> e dê um nome ao app (ex: Onix Burguer).</li>
            <li>No painel do app, vá em <strong className="text-cream/80">Adicionar Produto</strong> e clique em <strong className="text-cream/80">Configurar</strong> no WhatsApp.</li>
            <li>Em <strong className="text-cream/80">API de Configuração</strong>, copie o <strong className="text-cream/80">Phone Number ID</strong> e o <strong className="text-cream/80">Token de Acesso Temporário</strong> (ou gere um permanente via <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started" target="_blank" rel="noopener noreferrer" className="text-amberglow underline">System User</a>).</li>
            <li>Em <strong className="text-cream/80">WhatsApp → Configuração</strong>, copie o <strong className="text-cream/80">ID da Conta Comercial</strong> (Business Account ID).</li>
            <li>Para webhook, configure a URL: <span className="font-mono bg-black/20 px-1 rounded">{typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/whatsapp/webhook</span></li>
            <li>Cole os dados abaixo e clique em <strong className="text-cream/80">Salvar</strong> → <strong className="text-cream/80">Testar Conexão</strong>.</li>
          </ol>
          <p className="text-cream/40 mt-2">
            Para tokens permanentes, use um <strong className="text-cream/60">System User</strong> com permissão <code className="bg-black/20 px-1 rounded">whatsapp_business_messaging</code>.
          </p>
        </div>
      )}

      {/* Form */}
      {editing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">PHONE NUMBER ID</label>
            <input
              value={form.phone_number_id}
              onChange={(e) => setForm((f) => ({ ...f, phone_number_id: e.target.value }))}
              placeholder="Ex: 123456789012345"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ACCESS TOKEN</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={form.access_token}
                onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
                placeholder="EAAxxxxxxxxxxxxxxx..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-16 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs text-cream/30 hover:text-cream/60"
              >
                {showToken ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">BUSINESS ACCOUNT ID</label>
            <input
              value={form.business_account_id}
              onChange={(e) => setForm((f) => ({ ...f, business_account_id: e.target.value }))}
              placeholder="Ex: 987654321098765"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">WEBHOOK VERIFY TOKEN</label>
            <input
              value={form.webhook_verify_token}
              onChange={(e) => setForm((f) => ({ ...f, webhook_verify_token: e.target.value }))}
              placeholder="Token secreto para verificação do webhook"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
            <p className="mt-1 text-xs text-cream/35">Use qualquer string aleatória. Configure o mesmo valor no painel do Meta.</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.phone_number_id || !form.access_token}
              className="rounded-lg bg-amberglow/25 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/35 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !form.phone_number_id || !form.access_token}
              className="rounded-lg border border-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow/70 hover:bg-amberglow/10 disabled:opacity-50"
            >
              {testing ? "Testando..." : "Testar Conexão"}
            </button>
            <button
              onClick={() => { setEditing(false); setMsg(null); }}
              className="rounded-lg px-3 py-1.5 text-xs text-cream/40 hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {config && (
            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-cream/40">Phone Number ID</span>
                <span className="font-mono text-cream/60">{config.phone_number_id.slice(0, 6)}••••••</span>
              </div>
              {config.business_account_id && (
                <div className="flex justify-between text-xs">
                  <span className="text-cream/40">Business Account ID</span>
                  <span className="font-mono text-cream/60">{config.business_account_id.slice(0, 6)}••••••</span>
                </div>
              )}
              {config.webhook_verify_token && (
                <div className="flex justify-between text-xs">
                  <span className="text-cream/40">Webhook Token</span>
                  <span className="font-mono text-cream/60">configurado</span>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startEdit}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/50 hover:bg-white/5 hover:text-cream"
            >
              {config ? "Editar credenciais" : "Configurar"}
            </button>
            {config && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="rounded-lg border border-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow/70 hover:bg-amberglow/10 disabled:opacity-50"
              >
                {testing ? "Testando..." : "Testar Conexão"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}";

const newWhatsAppPanel = "function WhatsAppBusinessPanel() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<"waiting" | "connected" | "error">("waiting");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-config");
      const data = (await res.json()) as { config?: WhatsAppConfig };
      setConfig(data.config ?? null);
      if (data.config?.status === "connected") {
        setQrStatus("connected");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConfig(); }, []);

  function generateQR() {
    setQrStatus("waiting");
    setQrCode("mock-qr-code-data"); // Placeholder para QR code real
    setTimeout(() => {
      // Simula conexão após 3 segundos
      setQrStatus("connected");
      setConfig({ id: "1", phone_number_id: "5511999999999", business_account_id: null, webhook_verify_token: null, status: "connected" });
    }, 3000);
  }

  const statusColor =
    qrStatus === "connected"
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : qrStatus === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

  const statusLabel =
    qrStatus === "connected" ? "Conectado" :
    qrStatus === "error" ? "Erro" :
    config ? "Desconectado" : "Não configurado";

  if (loading) {
    return <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 text-cream/30 text-sm">Carregando...</div>;
  }

  return (
    <>
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💬</span>
            <div>
              <h3 className="font-semibold text-cream">WhatsApp Business API</h3>
              <p className="text-xs text-cream/40">Conexão via dispositivo — envio de mensagens e notificações</p>
            </div>
          </div>
          <span className={"flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}"}>
            {statusLabel}
          </span>
        </div>

        {/* Status message */}
        {msg && (
          <div className={"mt-4 rounded-lg border p-3 text-sm ${
            msg.type === "success"
              ? "border-green-500/20 bg-green-500/5 text-green-400"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          }"}>
            {msg.text}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/50 hover:bg-white/5 hover:text-cream"
          >
            {config?.status === "connected" ? "Reconectar" : "Configurar"}
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-title text-lg text-cream">Conectar WhatsApp</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="rounded-lg p-1 text-cream/40 hover:text-cream"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              {/* QR Code Placeholder */}
              <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[0.02]">
                {qrCode ? (
                  qrStatus === "connected" ? (
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="mt-2 text-sm text-green-400">Conectado!</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto h-32 w-32 animate-pulse rounded-lg bg-white/10"></div>
                      <p className="mt-2 text-xs text-cream/40">Escaneie o QR Code</p>
                    </div>
                  )
                ) : (
                  <span className="text-4xl text-cream/20">📷</span>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className={"h-2.5 w-2.5 rounded-full ${
                  qrStatus === "connected" ? "bg-green-400" : "bg-yellow-400 animate-pulse"
                }"}></span>
                <span className="text-sm text-cream/60">
                  {qrStatus === "connected" ? "Conectado" : "Aguardando leitura..."}
                </span>
              </div>

              <button
                onClick={generateQR}
                disabled={qrStatus === "waiting" && qrCode !== null}
                className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow transition hover:bg-amberglow/35 disabled:opacity-50"
              >
                {qrCode ? "Gerar Novo QR Code" : "Gerar QR Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}";

content = content.replace(oldWhatsAppPanel, newWhatsAppPanel);

// 3. Atualizar os modais de delivery (iFood, Uber, Rappi) com campos específicos
// Primeiro, atualizar o PlatformConfig para incluir merchantId
const oldPlatformConfig = "type PlatformConfig = {
  id: string;
  name: string;
  description: string;
  logo: string;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  hasWebhook: boolean;
  docsUrl: string;
};";

const newPlatformConfig = "type PlatformConfig = {
  id: string;
  name: string;
  description: string;
  logo: string;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  hasWebhook: boolean;
  docsUrl: string;
  merchantIdLabel?: string;
};";

content = content.replace(oldPlatformConfig, newPlatformConfig);

// 4. Atualizar PLATFORMS com merchantIdLabel
const oldPlatforms = "const PLATFORMS: PlatformConfig[] = [
  {
    id: "ifood",
    name: "iFood",
    description: "Marketplace de delivery — receba pedidos automaticamente via webhook",
    logo: "🍔",
    hasApiKey: true,
    hasApiSecret: true,
    hasWebhook: true,
    docsUrl: "https://developer.ifood.com.br"
  },
  {
    id: "ubereats",
    name: "Uber Eats",
    description: "Plataforma de delivery Uber — integração via API",
    logo: "🚗",
    hasApiKey: true,
    hasApiSecret: true,
    hasWebhook: false,
    docsUrl: "https://developer.uber.com/docs/eats"
  },
  {
    id: "rappi",
    name: "Rappi",
    description: "Super app de delivery",
    logo: "🛵",
    hasApiKey: true,
    hasApiSecret: false,
    hasWebhook: false,
    docsUrl: "https://dev.rappi.com"
  }
];";

const newPlatforms = "const PLATFORMS: PlatformConfig[] = [
  {
    id: "ifood",
    name: "iFood",
    description: "Marketplace de delivery — receba pedidos automaticamente via webhook",
    logo: "🍔",
    hasApiKey: true,
    hasApiSecret: true,
    hasWebhook: true,
    docsUrl: "https://developer.ifood.com.br",
    merchantIdLabel: "Merchant ID (ID da Loja)"
  },
  {
    id: "ubereats",
    name: "Uber Eats",
    description: "Plataforma de delivery Uber — integração via API",
    logo: "🚗",
    hasApiKey: true,
    hasApiSecret: true,
    hasWebhook: false,
    docsUrl: "https://developer.uber.com/docs/eats",
    merchantIdLabel: "Store ID"
  },
  {
    id: "rappi",
    name: "Rappi",
    description: "Super app de delivery",
    logo: "🛵",
    hasApiKey: true,
    hasApiSecret: true,
    hasWebhook: false,
    docsUrl: "https://dev.rappi.com",
    merchantIdLabel: "Store ID"
  }
];";

content = content.replace(oldPlatforms, newPlatforms);

// 5. Atualizar IntegrationForm para incluir merchant_id
const oldIntegrationForm = "type IntegrationForm = {
  api_key: string;
  api_secret: string;
  webhook_url: string;
  active: boolean;
};

const EMPTY_FORM: IntegrationForm = { api_key: "", api_secret: "", webhook_url: "", active: false };";

const newIntegrationForm = "type IntegrationForm = {
  api_key: string;
  api_secret: string;
  merchant_id: string;
  webhook_url: string;
  active: boolean;
};

const EMPTY_FORM: IntegrationForm = { api_key: "", api_secret: "", merchant_id: "", webhook_url: "", active: false };";

content = content.replace(oldIntegrationForm, newIntegrationForm);

// 6. Atualizar startEdit para incluir merchant_id
const oldStartEdit = "  function startEdit(platform: PlatformConfig) {
    const existing = integrations[platform.id];
    setForm({
      api_key: existing?.api_key ?? "",
      api_secret: existing?.api_secret ?? "",
      webhook_url: existing?.webhook_url ?? "",
      active: existing?.active ?? false
    });
    setEditingPlatform(platform.id);
  }";

const newStartEdit = "  function startEdit(platform: PlatformConfig) {
    const existing = integrations[platform.id];
    setForm({
      api_key: existing?.api_key ?? "",
      api_secret: existing?.api_secret ?? "",
      merchant_id: existing?.merchant_id ?? "",
      webhook_url: existing?.webhook_url ?? "",
      active: existing?.active ?? false
    });
    setEditingPlatform(platform.id);
  }";

content = content.replace(oldStartEdit, newStartEdit);

// 7. Atualizar handleSave para incluir merchant_id
const oldHandleSave = "      const body = existing
        ? { id: existing.id, api_key: form.api_key || null, api_secret: form.api_secret || null, webhook_url: form.webhook_url || null, active: form.active }
        : { platform: platformId, api_key: form.api_key || null, api_secret: form.api_secret || null, webhook_url: form.webhook_url || null, active: form.active };";

const newHandleSave = "      const body = existing
        ? { id: existing.id, api_key: form.api_key || null, api_secret: form.api_secret || null, merchant_id: form.merchant_id || null, webhook_url: form.webhook_url || null, active: form.active }
        : { platform: platformId, api_key: form.api_key || null, api_secret: form.api_secret || null, merchant_id: form.merchant_id || null, webhook_url: form.webhook_url || null, active: form.active };";

content = content.replace(oldHandleSave, newHandleSave);

// 8. Atualizar o formulário de edição para mostrar labels corretos e merchant_id
const oldEditForm = "              {isEditing ? (
                <div className="mt-4 space-y-3">
                  {platform.hasApiKey && (
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">API KEY / Client ID</label>
                      <input
                        value={form.api_key}
                        onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                        placeholder="Chave da API"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                      />
                    </div>
                  )}
                  {platform.hasApiSecret && (
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">API SECRET / Client Secret</label>
                      <div className="relative">
                        <input
                          type={showSecret[platform.id] ? "text" : "password"}
                          value={form.api_secret}
                          onChange={(e) => setForm((f) => ({ ...f, api_secret: e.target.value }))}
                          placeholder="Segredo da API"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-16 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret((s) => ({ ...s, [platform.id]: !s[platform.id] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs text-cream/30 hover:text-cream/60"
                        >
                          {showSecret[platform.id] ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                    </div>
                  )}
                  {platform.hasWebhook && (
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">WEBHOOK SECRET (para verificação)</label>
                      <input
                        value={form.webhook_url}
                        onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))}
                        placeholder="Token secreto do webhook"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-cream/70">Integração ativa</span>
                    </label>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSave(platform.id)}
                      disabled={saving}
                      className="rounded-lg bg-amberglow/25 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/35 disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button onClick={() => setEditingPlatform(null)} className="rounded-lg px-3 py-1.5 text-xs text-cream/40 hover:bg-white/5">Cancelar</button>
                    <a href={platform.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto rounded-lg px-3 py-1.5 text-xs text-amberglow/50 hover:text-amberglow">Documentação</a>
                  </div>
                </div>
              ) : (";

const newEditForm = "              {isEditing ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CLIENT ID *</label>
                    <input
                      value={form.api_key}
                      onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                      placeholder="Client ID da aplicação"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CLIENT SECRET *</label>
                    <div className="relative">
                      <input
                        type={showSecret[platform.id] ? "text" : "password"}
                        value={form.api_secret}
                        onChange={(e) => setForm((f) => ({ ...f, api_secret: e.target.value }))}
                        placeholder="Client Secret da aplicação"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-16 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((s) => ({ ...s, [platform.id]: !s[platform.id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs text-cream/30 hover:text-cream/60"
                      >
                        {showSecret[platform.id] ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>
                  {platform.merchantIdLabel && (
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">{platform.merchantIdLabel.toUpperCase()} *</label>
                      <input
                        value={form.merchant_id}
                        onChange={(e) => setForm((f) => ({ ...f, merchant_id: e.target.value }))}
                        placeholder={platform.merchantIdLabel}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                      />
                    </div>
                  )}
                  {platform.hasWebhook && (
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">WEBHOOK SECRET (para verificação)</label>
                      <input
                        value={form.webhook_url}
                        onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))}
                        placeholder="Token secreto do webhook"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-cream/70">Integração ativa</span>
                    </label>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSave(platform.id)}
                      disabled={saving || !form.api_key || !form.api_secret || (platform.merchantIdLabel ? !form.merchant_id : false)}
                      className="rounded-lg bg-amberglow/25 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/35 disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar Credenciais"}
                    </button>
                    <button onClick={() => setEditingPlatform(null)} className="rounded-lg px-3 py-1.5 text-xs text-cream/40 hover:bg-white/5">Cancelar</button>
                    <a href={platform.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto rounded-lg px-3 py-1.5 text-xs text-amberglow/50 hover:text-amberglow">Documentação</a>
                  </div>
                </div>
              ) : (";

content = content.replace(oldEditForm, newEditForm);

fs.writeFileSync(integracoesPath, content, { encoding: 'utf8' });
console.log('✅ Integrações atualizadas com:');
console.log('  - Card de gatilho atualizado');
console.log('  - Modal WhatsApp com QR Code');
console.log('  - Modais de delivery com Client ID, Client Secret e Merchant ID');
