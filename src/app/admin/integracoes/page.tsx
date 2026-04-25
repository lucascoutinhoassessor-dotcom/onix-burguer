"use client";

import { useEffect, useState } from "react";
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
    name: "WhatsApp Business",
    description: "Comunicação direta com clientes via API oficial",
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
