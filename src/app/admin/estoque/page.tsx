"use client";

import { useEffect, useState } from "react";
import type { DbInventoryItem } from "@/lib/supabase";

type FormState = {
  name: string;
  unit: string;
  quantity: string;
  min_quantity: string;
  cost_price: string;
};

const EMPTY_FORM: FormState = { name: "", unit: "un", quantity: "0", min_quantity: "0", cost_price: "0" };

const UNITS = ["un", "kg", "g", "l", "ml", "cx", "pct"];

export default function AdminEstoquePage() {
  const [items, setItems] = useState<DbInventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<DbInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/inventory");
      const data = (await res.json()) as { items?: DbInventoryItem[]; lowStock?: DbInventoryItem[] };
      setItems(data.items ?? []);
      setLowStock(data.lowStock ?? []);
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

  function openEdit(item: DbInventoryItem) {
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: String(item.quantity),
      min_quantity: String(item.min_quantity),
      cost_price: String(item.cost_price)
    });
    setEditingId(item.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name) {
      setError("Nome é obrigatório");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name,
        unit: form.unit,
        quantity: parseFloat(form.quantity || "0"),
        min_quantity: parseFloat(form.min_quantity || "0"),
        cost_price: parseFloat(form.cost_price || "0")
      };
      const res = await fetch("/api/admin/inventory", {
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
    if (!confirm("Excluir este item?")) return;
    await fetch(`/api/admin/inventory?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function adjustQuantity(item: DbInventoryItem, delta: number) {
    const newQty = Math.max(0, Number(item.quantity) + delta);
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, quantity: newQty })
    });
    await load();
  }

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const isLow = (item: DbInventoryItem) => Number(item.quantity) <= Number(item.min_quantity);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Controle de Estoque</h1>
          <p className="mt-0.5 text-sm text-cream/40">{items.length} itens cadastrados</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/30"
        >
          + Novo item
        </button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <p className="mb-2 text-sm font-semibold text-orange-400">
            Alerta: {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} com estoque baixo
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <span key={item.id} className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-300">
                {item.name}: {item.quantity} {item.unit} (mín: {item.min_quantity})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar item..."
          className="w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-white/8 text-sm text-cream/30">
          Nenhum item encontrado
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ITEM</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">UNIDADE</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">QUANTIDADE</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">MÍN</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CUSTO UNIT.</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${isLow(item) ? "bg-orange-500/5" : ""}`}>
                  <td className="px-4 py-3 font-medium text-cream/90">{item.name}</td>
                  <td className="px-4 py-3 text-xs text-cream/50">{item.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustQuantity(item, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-cream/50 hover:border-red-400/30 hover:text-red-400"
                      >
                        −
                      </button>
                      <span className={`min-w-[2rem] text-center font-semibold ${isLow(item) ? "text-orange-400" : "text-cream"}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => adjustQuantity(item, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-cream/50 hover:border-green-400/30 hover:text-green-400"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-cream/50">{item.min_quantity}</td>
                  <td className="px-4 py-3 text-xs text-amberglow">
                    R$ {Number(item.cost_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {isLow(item) ? (
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
                        Estoque baixo
                      </span>
                    ) : (
                      <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded px-2 py-1 text-xs text-cream/40 hover:bg-white/5 hover:text-amberglow"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">
              {editingId ? "Editar Item" : "Novo Item"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Carne bovina 80/20"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">UNIDADE</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CUSTO UNITÁRIO (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost_price}
                    onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">QUANTIDADE ATUAL</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">QUANTIDADE MÍNIMA</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.min_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, min_quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-cream/50 hover:bg-white/5">
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
