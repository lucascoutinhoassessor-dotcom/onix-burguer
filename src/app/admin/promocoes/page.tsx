"use client";

import { useEffect, useState } from "react";
import type { DbPromotion, DbMarketingCampaign, DbCustomerAccount } from "@/lib/supabase";

// ─── Promotions ───────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  type: "percent" | "fixed" | "free_shipping";
  value: string;
  code: string;
  min_order: string;
  start_at: string;
  end_at: string;
  active: boolean;
  max_uses: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  type: "percent",
  value: "",
  code: "",
  min_order: "0",
  start_at: "",
  end_at: "",
  active: true,
  max_uses: ""
};

const TYPE_LABELS = {
  percent: "Percentual (%)",
  fixed: "Valor fixo (R$)",
  free_shipping: "Frete grátis"
};

// ─── Marketing Campaign ───────────────────────────────────────────────────────

type CampaignForm = {
  type: "individual" | "mass";
  target_phone: string;
  message: string;
  filter_city: string;
  filter_min_spend: string;
  filter_last_order_days: string;
};

const EMPTY_CAMPAIGN: CampaignForm = {
  type: "mass",
  target_phone: "",
  message: "",
  filter_city: "",
  filter_min_spend: "",
  filter_last_order_days: ""
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPromocoesPage() {
  const [activeTab, setActiveTab] = useState<"promotions" | "marketing">("promotions");

  // Promotions state
  const [promotions, setPromotions] = useState<DbPromotion[]>([]);
  const [loadingPromo, setLoadingPromo] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Marketing state
  const [campaigns, setCampaigns] = useState<DbMarketingCampaign[]>([]);
  const [customers, setCustomers] = useState<DbCustomerAccount[]>([]);
  const [loadingMkt, setLoadingMkt] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(EMPTY_CAMPAIGN);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [mktError, setMktError] = useState("");
  const [previewRecipients, setPreviewRecipients] = useState<DbCustomerAccount[]>([]);

  // ── Load promotions ──
  async function loadPromotions() {
    try {
      const res = await fetch("/api/admin/promotions");
      const data = (await res.json()) as { promotions?: DbPromotion[] };
      setPromotions(data.promotions ?? []);
    } finally {
      setLoadingPromo(false);
    }
  }

  // ── Load marketing ──
  async function loadMarketing() {
    setLoadingMkt(true);
    try {
      const [camRes, cusRes] = await Promise.all([
        fetch("/api/admin/marketing"),
        fetch("/api/admin/customers")
      ]);
      const camData = (await camRes.json()) as { campaigns?: DbMarketingCampaign[] };
      const cusData = (await cusRes.json()) as { customers?: DbCustomerAccount[] };
      setCampaigns(camData.campaigns ?? []);
      setCustomers(cusData.customers ?? []);
    } finally {
      setLoadingMkt(false);
    }
  }

  useEffect(() => { loadPromotions(); }, []);

  useEffect(() => {
    if (activeTab === "marketing") loadMarketing();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Preview recipients ──
  useEffect(() => {
    if (campaignForm.type === "mass") {
      let filtered = [...customers];
      if (campaignForm.filter_city) {
        filtered = filtered.filter((c) =>
          c.name.toLowerCase().includes(campaignForm.filter_city.toLowerCase())
        );
      }
      if (campaignForm.filter_last_order_days) {
        const days = parseInt(campaignForm.filter_last_order_days);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        filtered = filtered.filter((c) =>
          c.last_order_at && new Date(c.last_order_at) >= cutoff
        );
      }
      setPreviewRecipients(filtered);
    } else {
      const found = customers.filter((c) => c.phone === campaignForm.target_phone);
      setPreviewRecipients(found);
    }
  }, [campaignForm, customers]);

  // ── Promotions CRUD ──
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPromoError("");
    setShowForm(true);
  }

  function openEdit(p: DbPromotion) {
    setForm({
      name: p.name,
      type: p.type,
      value: String(p.value),
      code: p.code ?? "",
      min_order: String(p.min_order),
      start_at: p.start_at ? p.start_at.slice(0, 16) : "",
      end_at: p.end_at ? p.end_at.slice(0, 16) : "",
      active: p.active,
      max_uses: p.max_uses !== null ? String(p.max_uses) : ""
    });
    setEditingId(p.id);
    setPromoError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.value) { setPromoError("Nome e valor são obrigatórios"); return; }
    setSaving(true);
    setPromoError("");
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name,
        type: form.type,
        value: parseFloat(form.value),
        code: form.code ? form.code.toUpperCase() : null,
        min_order: parseFloat(form.min_order || "0"),
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        active: form.active,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null
      };
      const res = await fetch("/api/admin/promotions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) { const d = await res.json() as { error?: string }; setPromoError(d.error ?? "Erro ao salvar"); return; }
      setShowForm(false);
      await loadPromotions();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta promoção?")) return;
    await fetch(`/api/admin/promotions?id=${id}`, { method: "DELETE" });
    await loadPromotions();
  }

  async function handleToggle(p: DbPromotion) {
    await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active })
    });
    await loadPromotions();
  }

  // ── Marketing send ──
  function buildWhatsAppUrl(phone: string, message: string): string {
    const digits = phone.replace(/\D/g, "");
    const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
  }

  async function handleSendCampaign() {
    if (!campaignForm.message) { setMktError("A mensagem é obrigatória"); return; }
    if (campaignForm.type === "individual" && !campaignForm.target_phone) {
      setMktError("Selecione um cliente"); return;
    }
    if (previewRecipients.length === 0) { setMktError("Nenhum destinatário encontrado"); return; }

    setSavingCampaign(true);
    setMktError("");
    try {
      const filters = {
        city: campaignForm.filter_city || null,
        min_spend: campaignForm.filter_min_spend ? parseFloat(campaignForm.filter_min_spend) : null,
        last_order_days: campaignForm.filter_last_order_days ? parseInt(campaignForm.filter_last_order_days) : null
      };

      // Save campaign record
      await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: campaignForm.type,
          target: campaignForm.type === "individual" ? campaignForm.target_phone : null,
          filters: campaignForm.type === "mass" ? filters : null,
          message: campaignForm.message,
          delivered_count: previewRecipients.length
        })
      });

      // Open WhatsApp for each recipient (opens one at a time for individual)
      if (campaignForm.type === "individual") {
        window.open(buildWhatsAppUrl(campaignForm.target_phone, campaignForm.message), "_blank");
      } else {
        // For mass: open first, show instructions
        previewRecipients.slice(0, 1).forEach((c) => {
          window.open(buildWhatsAppUrl(c.phone, campaignForm.message), "_blank");
        });
        if (previewRecipients.length > 1) {
          alert(
            `Campanha registrada para ${previewRecipients.length} clientes.\n\n` +
            `O WhatsApp foi aberto para o primeiro destinatário.\n` +
            `Para disparos em massa recomendamos usar a API WhatsApp Business.`
          );
        }
      }

      setShowCampaignForm(false);
      setCampaignForm(EMPTY_CAMPAIGN);
      await loadMarketing();
    } finally {
      setSavingCampaign(false);
    }
  }

  const CAMPAIGN_STATUS_COLORS = {
    draft: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    sent: "text-green-400 bg-green-400/10 border-green-400/30",
    failed: "text-red-400 bg-red-400/10 border-red-400/30"
  };

  return (
    <div className="p-6">
      {/* Header + tabs */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Promoções e Marketing</h1>
          <p className="mt-0.5 text-sm text-cream/40">
            {activeTab === "promotions" ? `${promotions.length} promoções` : `${campaigns.length} campanhas`}
          </p>
        </div>
        {activeTab === "promotions" ? (
          <button
            onClick={openCreate}
            className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow transition hover:bg-amberglow/30"
          >
            + Nova promoção
          </button>
        ) : (
          <button
            onClick={() => { setCampaignForm(EMPTY_CAMPAIGN); setMktError(""); setShowCampaignForm(true); }}
            className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/30"
          >
            + Nova campanha
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 border-b border-white/8 pb-0">
        <button
          onClick={() => setActiveTab("promotions")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "promotions"
              ? "bg-amberglow/15 text-amberglow"
              : "text-cream/40 hover:text-cream/70"
          }`}
        >
          Cupons e Descontos
        </button>
        <button
          onClick={() => setActiveTab("marketing")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "marketing"
              ? "bg-green-500/15 text-green-400"
              : "text-cream/40 hover:text-cream/70"
          }`}
        >
          Marketing WhatsApp
        </button>
      </div>

      {/* ── PROMOTIONS TAB ── */}
      {activeTab === "promotions" && (
        <>
          {loadingPromo ? (
            <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
          ) : promotions.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-white/8 text-sm text-cream/30">
              Nenhuma promoção cadastrada
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">NOME</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CUPOM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">TIPO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">VALOR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">USOS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-cream/90">{p.name}</td>
                      <td className="px-4 py-3">
                        {p.code ? (
                          <span className="rounded border border-amberglow/30 bg-amberglow/10 px-2 py-0.5 font-mono text-xs text-amberglow">
                            {p.code}
                          </span>
                        ) : (
                          <span className="text-xs text-cream/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-cream/50">{TYPE_LABELS[p.type]}</td>
                      <td className="px-4 py-3 font-semibold text-amberglow">
                        {p.type === "percent" ? `${p.value}%` : p.type === "fixed" ? `R$ ${Number(p.value).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-cream/50">
                        {p.uses_count}{p.max_uses !== null ? ` / ${p.max_uses}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(p)}
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                            p.active ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"
                          }`}
                        >
                          {p.active ? "Ativa" : "Inativa"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="rounded px-2 py-1 text-xs text-cream/40 hover:bg-white/5 hover:text-amberglow">Editar</button>
                          <button onClick={() => handleDelete(p.id)} className="rounded px-2 py-1 text-xs text-cream/30 hover:bg-red-500/10 hover:text-red-400">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── MARKETING TAB ── */}
      {activeTab === "marketing" && (
        <>
          {loadingMkt ? (
            <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
          ) : campaigns.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-white/8 text-sm text-cream/30">
              <p>Nenhuma campanha enviada ainda</p>
              <button
                onClick={() => { setCampaignForm(EMPTY_CAMPAIGN); setMktError(""); setShowCampaignForm(true); }}
                className="text-xs text-green-400/60 underline hover:text-green-400"
              >
                Criar primeira campanha
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">MENSAGEM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">TIPO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ENVIADOS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">DATA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 max-w-xs text-xs text-cream/80">{c.message}</p>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-cream/50">
                        {c.type === "individual" ? "Individual" : "Em massa"}
                      </td>
                      <td className="px-4 py-3 text-xs text-cream/50">{c.delivered_count}</td>
                      <td className="px-4 py-3 text-xs text-cream/50">
                        {c.sent_at ? new Date(c.sent_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS_COLORS[c.status]}`}>
                          {c.status === "sent" ? "Enviado" : c.status === "failed" ? "Falhou" : "Rascunho"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── PROMOTION FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">{editingId ? "Editar Promoção" : "Nova Promoção"}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Desconto 10% fim de semana" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TIPO *</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FormState["type"] }))} className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50">
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                    <option value="free_shipping">Frete grátis</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">{form.type === "percent" ? "DESCONTO (%) *" : "DESCONTO (R$) *"}</label>
                  <input type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="0" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CÓDIGO CUPOM</label>
                  <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EX: ONIX10" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">PEDIDO MÍNIMO (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.min_order} onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))} placeholder="0" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">INÍCIO</label>
                  <input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">EXPIRAÇÃO</label>
                  <input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">MÁXIMO DE USOS</label>
                  <input type="number" min="0" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="Ilimitado" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-cream/70">Promoção ativa</span>
                  </label>
                </div>
              </div>
              {promoError && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{promoError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-cream/50 hover:bg-white/5">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow hover:bg-amberglow/35 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGN FORM MODAL ── */}
      {showCampaignForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">Nova Campanha WhatsApp</h2>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TIPO DE ENVIO</label>
                <div className="flex gap-2">
                  {(["individual", "mass"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCampaignForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                        campaignForm.type === t
                          ? "border-green-500/40 bg-green-500/15 text-green-400"
                          : "border-white/10 text-cream/40 hover:bg-white/5"
                      }`}
                    >
                      {t === "individual" ? "Individual" : "Em massa"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual: select customer */}
              {campaignForm.type === "individual" && (
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CLIENTE *</label>
                  <select
                    value={campaignForm.target_phone}
                    onChange={(e) => setCampaignForm((f) => ({ ...f, target_phone: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-green-500/50"
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.phone}>{c.name} — {c.phone}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mass: filters */}
              {campaignForm.type === "mass" && (
                <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-xs font-medium text-cream/50">FILTROS (opcional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-cream/40">Última compra (dias)</label>
                      <input
                        type="number"
                        min="1"
                        value={campaignForm.filter_last_order_days}
                        onChange={(e) => setCampaignForm((f) => ({ ...f, filter_last_order_days: e.target.value }))}
                        placeholder="Ex: 30"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cream placeholder-cream/25 outline-none focus:border-green-500/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-cream/40">Gasto mínimo (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={campaignForm.filter_min_spend}
                        onChange={(e) => setCampaignForm((f) => ({ ...f, filter_min_spend: e.target.value }))}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cream placeholder-cream/25 outline-none focus:border-green-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-cream/40">Cidade</label>
                    <input
                      value={campaignForm.filter_city}
                      onChange={(e) => setCampaignForm((f) => ({ ...f, filter_city: e.target.value }))}
                      placeholder="Ex: Rio de Janeiro"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cream placeholder-cream/25 outline-none focus:border-green-500/50"
                    />
                  </div>
                  <p className="text-xs text-green-400/70">
                    {previewRecipients.length} destinatário{previewRecipients.length !== 1 ? "s" : ""} encontrado{previewRecipients.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">MENSAGEM *</label>
                <textarea
                  value={campaignForm.message}
                  onChange={(e) => setCampaignForm((f) => ({ ...f, message: e.target.value }))}
                  rows={5}
                  placeholder="🍔 Olá! Temos novidades especiais na Onix Burguer para você..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-green-500/50"
                />
                <p className="mt-1 text-xs text-cream/30">{campaignForm.message.length} caracteres</p>
              </div>

              {mktError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{mktError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCampaignForm(false)} className="rounded-lg px-4 py-2 text-sm text-cream/50 hover:bg-white/5">Cancelar</button>
              <button
                onClick={handleSendCampaign}
                disabled={savingCampaign}
                className="rounded-lg bg-green-500/25 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/35 disabled:opacity-50"
              >
                {savingCampaign ? "Enviando..." : `Enviar via WhatsApp${previewRecipients.length > 0 ? ` (${previewRecipients.length})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
