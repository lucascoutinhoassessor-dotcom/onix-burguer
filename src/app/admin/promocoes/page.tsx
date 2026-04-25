"use client";

import { useEffect, useState } from "react";
import type { DbPromotion } from "@/lib/supabase";

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

export default function AdminPromocoesPage() {
  const [promotions, setPromotions] = useState<DbPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/promotions");
      const data = (await res.json()) as { promotions?: DbPromotion[] };
      setPromotions(data.promotions ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
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
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.value) {
      setError("Nome e valor são obrigatórios");
      return;
    }
    setSaving(true);
    setError("");
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
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Erro ao salvar");
        return;
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta promoção?")) return;
    await fetch(`/api/admin/promotions?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function handleToggle(p: DbPromotion) {
    await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active })
    });
    await load();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Promoções e Cupons</h1>
          <p className="mt-0.5 text-sm text-cream/40">{promotions.length} promoções cadastradas</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow transition hover:bg-amberglow/30"
        >
          + Nova promoção
        </button>
      </div>

      {loading ? (
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
                    {p.type === "percent"
                      ? `${p.value}%`
                      : p.type === "fixed"
                      ? `R$ ${Number(p.value).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-cream/50">
                    {p.uses_count}{p.max_uses !== null ? ` / ${p.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(p)}
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                        p.active
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {p.active ? "Ativa" : "Inativa"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded px-2 py-1 text-xs text-cream/40 hover:bg-white/5 hover:text-amberglow"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded px-2 py-1 text-xs text-cream/30 hover:bg-red-500/10 hover:text-red-400"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">
              {editingId ? "Editar Promoção" : "Nova Promoção"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Desconto 10% fim de semana"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TIPO *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FormState["type"] }))}
                    className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                    <option value="free_shipping">Frete grátis</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
                    {form.type === "percent" ? "DESCONTO (%) *" : "DESCONTO (R$) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CÓDIGO CUPOM</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="EX: ONIX10"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">PEDIDO MÍNIMO (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.min_order}
                    onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">INÍCIO</label>
                  <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">EXPIRAÇÃO</label>
                  <input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">MÁXIMO DE USOS</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_uses}
                    onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                    placeholder="Ilimitado"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-cream/70">Promoção ativa</span>
                  </label>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2 text-sm text-cream/50 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow hover:bg-amberglow/35 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
