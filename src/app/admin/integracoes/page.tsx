"use client";

import { useEffect, useState, useCallback } from "react";
import type { DbIntegration } from "@/lib/supabase";

type PlatformConfig = {
  id: string;
  name: string;
  description: string;
  logo: string;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  hasWebhook: boolean;
  docsUrl: string;
};

const PLATFORMS: PlatformConfig[] = [
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
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business API",
    description: "API oficial Meta — envio em massa, templates e automação",
    logo: "💬",
    hasApiKey: true,
    hasApiSecret: true,
    hasWebhook: true,
    docsUrl: "https://developers.facebook.com/docs/whatsapp"
  }
];

type IntegrationForm = {
  api_key: string;
  api_secret: string;
  webhook_url: string;
  active: boolean;
};

const EMPTY_FORM: IntegrationForm = { api_key: "", api_secret: "", webhook_url: "", active: false };

type WAStatus = "disconnected" | "initializing" | "qr_ready" | "connected";

type WAState = {
  status: WAStatus;
  qrDataUrl: string | null;
  phoneNumber: string | null;
  error: string | null;
};

// ---------------------------------------------------------------------------
// WhatsApp Web QR Code panel
// ---------------------------------------------------------------------------
function WhatsAppWebPanel() {
  const [wa, setWa] = useState<WAState>({ status: "disconnected", qrDataUrl: null, phoneNumber: null, error: null });
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-web");
      const data = (await res.json()) as WAState & { success: boolean };
      setWa({ status: data.status, qrDataUrl: data.qrDataUrl, phoneNumber: data.phoneNumber, error: data.error });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while initializing or waiting for QR
  useEffect(() => {
    if (wa.status === "initializing" || wa.status === "qr_ready") {
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [wa.status, fetchStatus]);

  async function handleConnect() {
    setLoading(true);
    try {
      await fetch("/api/admin/whatsapp-web", { method: "POST" });
      await fetchStatus();
      // Start polling
      const interval = setInterval(async () => {
        await fetchStatus();
      }, 3000);
      setTimeout(() => clearInterval(interval), 120000); // stop after 2min
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await fetch("/api/admin/whatsapp-web", { method: "DELETE" });
      setWa({ status: "disconnected", qrDataUrl: null, phoneNumber: null, error: null });
    } finally {
      setLoading(false);
    }
  }

  const statusLabel: Record<WAStatus, string> = {
    disconnected: "Desconectado",
    initializing: "Inicializando...",
    qr_ready: "Aguardando escaneamento",
    connected: "Conectado"
  };

  const statusColor: Record<WAStatus, string> = {
    disconnected: "border-red-500/30 bg-red-500/10 text-red-400",
    initializing: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    qr_ready: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    connected: "border-green-500/30 bg-green-500/10 text-green-400"
  };

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📱</span>
          <div>
            <h3 className="font-semibold text-cream">WhatsApp Web (QR Code)</h3>
            <p className="text-xs text-cream/40">
              Conecte seu WhatsApp pessoal/business via QR Code — sem API paga
            </p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor[wa.status]}`}>
          {statusLabel[wa.status]}
        </span>
      </div>

      <div className="mt-4">
        {wa.status === "connected" && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <p className="text-sm font-medium text-green-400">WhatsApp conectado!</p>
            {wa.phoneNumber && (
              <p className="mt-0.5 font-mono text-xs text-green-400/60">+{wa.phoneNumber}</p>
            )}
            <p className="mt-1 text-xs text-cream/40">
              Mensagens de notificação serão enviadas por este número.
            </p>
          </div>
        )}

        {wa.status === "qr_ready" && wa.qrDataUrl && (
          <div className="mb-4 flex flex-col items-center gap-3">
            <p className="text-sm text-cream/70">
              Abra o WhatsApp no seu celular → Menu → Aparelhos conectados → Conectar aparelho
            </p>
            <div className="rounded-xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wa.qrDataUrl} alt="QR Code WhatsApp" className="h-52 w-52" />
            </div>
            <p className="text-xs text-cream/30 animate-pulse">Aguardando escaneamento...</p>
          </div>
        )}

        {wa.status === "initializing" && (
          <div className="mb-4 flex items-center gap-2 text-sm text-cream/50">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amberglow border-t-transparent" />
            Iniciando navegador, aguarde...
          </div>
        )}

        {wa.error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
            <p className="font-medium">Erro:</p>
            <p className="mt-0.5 font-mono break-all">{wa.error}</p>
            <p className="mt-2 text-cream/30">
              Certifique-se de ter Google Chrome ou Microsoft Edge instalado.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {wa.status === "disconnected" && (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/25 disabled:opacity-50"
            >
              {loading ? "Aguarde..." : "Conectar via QR Code"}
            </button>
          )}
          {(wa.status === "initializing" || wa.status === "qr_ready") && (
            <>
              <button
                onClick={fetchStatus}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/50 hover:bg-white/5"
              >
                Atualizar
              </button>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                Cancelar
              </button>
            </>
          )}
          {wa.status === "connected" && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-cream/25">
        Requer Chrome ou Edge instalado no servidor. Funciona melhor em servidores dedicados (Railway, VPS).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminIntegracoesPage() {
  const [integrations, setIntegrations] = useState<Record<string, DbIntegration>>({});
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [form, setForm] = useState<IntegrationForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  async function load() {
    try {
      const res = await fetch("/api/admin/integrations");
      const data = (await res.json()) as { integrations?: DbIntegration[] };
      const map: Record<string, DbIntegration> = {};
      for (const item of data.integrations ?? []) {
        map[item.platform] = item;
      }
      setIntegrations(map);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(platform: PlatformConfig) {
    const existing = integrations[platform.id];
    setForm({
      api_key: existing?.api_key ?? "",
      api_secret: existing?.api_secret ?? "",
      webhook_url: existing?.webhook_url ?? "",
      active: existing?.active ?? false
    });
    setEditingPlatform(platform.id);
  }

  async function handleSave(platformId: string) {
    setSaving(true);
    try {
      const existing = integrations[platformId];
      const method = existing ? "PATCH" : "POST";
      const body = existing
        ? { id: existing.id, api_key: form.api_key || null, api_secret: form.api_secret || null, webhook_url: form.webhook_url || null, active: form.active }
        : { platform: platformId, api_key: form.api_key || null, api_secret: form.api_secret || null, webhook_url: form.webhook_url || null, active: form.active };

      await fetch("/api/admin/integrations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      setSavedMsg(`${PLATFORMS.find(p => p.id === platformId)?.name} salvo com sucesso!`);
      setTimeout(() => setSavedMsg(""), 3000);
      setEditingPlatform(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex h-48 items-center justify-center p-6 text-cream/30">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-title text-2xl tracking-wide text-cream">Integrações</h1>
        <p className="mt-0.5 text-sm text-cream/40">Configure credenciais de API para marketplaces e serviços externos</p>
      </div>

      {savedMsg && (
        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {savedMsg}
        </div>
      )}

      {/* Webhook URL info */}
      <div className="mb-6 rounded-xl border border-amberglow/20 bg-amberglow/5 p-4">
        <p className="mb-1 text-xs font-medium text-amberglow">Seu URL de Webhook (iFood)</p>
        <p className="font-mono text-xs text-cream/60 break-all">
          {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/integrations/ifood/webhook
        </p>
        <p className="mt-1 text-xs text-cream/40">Configure este URL no painel do iFood para receber pedidos automaticamente.</p>
      </div>

      {/* WhatsApp Web QR Code section */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-cream/60 tracking-wider">WHATSAPP WEB</h2>
        <WhatsAppWebPanel />
      </div>

      {/* API Integrations */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-cream/60 tracking-wider">INTEGRAÇÕES VIA API</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const integration = integrations[platform.id];
          const isActive = integration?.active ?? false;
          const hasCredentials = !!(integration?.api_key);
          const isEditing = editingPlatform === platform.id;

          return (
            <div key={platform.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{platform.logo}</span>
                  <div>
                    <h3 className="font-semibold text-cream">{platform.name}</h3>
                    <p className="text-xs text-cream/40">{platform.description}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : hasCredentials
                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}>
                  {isActive ? "Ativo" : hasCredentials ? "Configurado" : "Inativo"}
                </span>
              </div>

              {isEditing ? (
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
              ) : (
                <div className="mt-4">
                  {hasCredentials && (
                    <p className="mb-3 font-mono text-xs text-amberglow/50">
                      Key: {integration!.api_key!.slice(0, 8)}••••••••
                    </p>
                  )}
                  <button
                    onClick={() => startEdit(platform)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/50 hover:bg-white/5 hover:text-cream"
                  >
                    {hasCredentials ? "Editar credenciais" : "Configurar"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-5">
        <h3 className="mb-3 font-semibold text-cream">Gatilho: Saiu para Entrega → Motoboy</h3>
        <p className="text-sm text-cream/50">
          Quando um pedido atingir o status <span className="rounded bg-purple-500/10 px-1 text-xs text-purple-400">Saiu para entrega</span>,
          o sistema registrará automaticamente um disparo de WhatsApp para os motoboys ativos cadastrados em Colaboradores.
        </p>
      </div>
    </div>
  );
}
