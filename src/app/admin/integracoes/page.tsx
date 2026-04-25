"use client";

import { useState } from "react";

type IntegrationStatus = "active" | "inactive" | "pending";

type Integration = {
  id: string;
  name: string;
  description: string;
  link: string;
  status: IntegrationStatus;
  logo: string;
};

const STATUS_LABELS: Record<IntegrationStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  pending: "Pendente"
};

const STATUS_COLORS: Record<IntegrationStatus, string> = {
  active: "text-green-400 bg-green-400/10 border-green-400/30",
  inactive: "text-red-400 bg-red-400/10 border-red-400/30",
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
};

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: "ifood",
    name: "iFood",
    description: "Marketplace de delivery — receba pedidos diretamente do iFood",
    link: "",
    status: "inactive",
    logo: "🍔"
  },
  {
    id: "ubereats",
    name: "Uber Eats",
    description: "Plataforma de delivery Uber — amplie seu alcance",
    link: "",
    status: "inactive",
    logo: "🚗"
  },
  {
    id: "rappi",
    name: "Rappi",
    description: "Super app de delivery",
    link: "",
    status: "inactive",
    logo: "🛵"
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Comunicação direta com clientes",
    link: "https://wa.me/",
    status: "active",
    logo: "💬"
  }
];

export default function AdminIntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("onix-integrations");
        return saved ? (JSON.parse(saved) as Integration[]) : DEFAULT_INTEGRATIONS;
      } catch {
        return DEFAULT_INTEGRATIONS;
      }
    }
    return DEFAULT_INTEGRATIONS;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateIntegration(id: string, updates: Partial<Integration>) {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }

  function handleSave() {
    if (typeof window !== "undefined") {
      localStorage.setItem("onix-integrations", JSON.stringify(integrations));
    }
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-title text-2xl tracking-wide text-cream">Integrações</h1>
        <p className="mt-0.5 text-sm text-cream/40">Gerencie suas integrações com marketplaces e serviços externos</p>
      </div>

      {saved && (
        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Integrações salvas com sucesso
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <div key={integration.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{integration.logo}</span>
                <div>
                  <h3 className="font-semibold text-cream">{integration.name}</h3>
                  <p className="text-xs text-cream/40">{integration.description}</p>
                </div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[integration.status]}`}>
                {STATUS_LABELS[integration.status]}
              </span>
            </div>

            {editingId === integration.id ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">LINK / URL</label>
                  <input
                    value={integration.link}
                    onChange={(e) => updateIntegration(integration.id, { link: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">STATUS</label>
                  <select
                    value={integration.status}
                    onChange={(e) =>
                      updateIntegration(integration.id, { status: e.target.value as IntegrationStatus })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-amberglow/25 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/35"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg px-3 py-1.5 text-xs text-cream/40 hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {integration.link && (
                  <p className="mb-3 truncate text-xs text-amberglow/70">{integration.link}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingId(integration.id)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/50 hover:bg-white/5 hover:text-cream"
                  >
                    Configurar
                  </button>
                  {integration.link && integration.status === "active" && (
                    <a
                      href={integration.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-amberglow/20 px-3 py-1.5 text-xs text-amberglow/70 hover:bg-amberglow/10"
                    >
                      Abrir
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-5">
        <h3 className="mb-3 font-semibold text-cream">Como integrar</h3>
        <ol className="space-y-2 text-sm text-cream/50">
          <li className="flex gap-2">
            <span className="text-amberglow">1.</span>
            Acesse o portal do marketplace desejado e crie sua conta comercial
          </li>
          <li className="flex gap-2">
            <span className="text-amberglow">2.</span>
            Configure seu cardápio e horários diretamente na plataforma
          </li>
          <li className="flex gap-2">
            <span className="text-amberglow">3.</span>
            Cole o link do seu perfil na integração acima e marque como Ativo
          </li>
          <li className="flex gap-2">
            <span className="text-amberglow">4.</span>
            Os pedidos dos marketplaces chegam no aplicativo da própria plataforma
          </li>
        </ol>
      </div>
    </div>
  );
}
