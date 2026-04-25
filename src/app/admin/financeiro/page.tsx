"use client";

import { useEffect, useState } from "react";
import type { DbFinancialEntry } from "@/lib/supabase";

type FormState = {
  type: "income" | "expense";
  category: string;
  description: string;
  amount: string;
  due_date: string;
  status: "pending" | "paid" | "overdue";
};

const EMPTY_FORM: FormState = {
  type: "expense",
  category: "",
  description: "",
  amount: "",
  due_date: new Date().toISOString().split("T")[0],
  status: "pending"
};

const EXPENSE_CATEGORIES = ["Fornecedor", "Aluguel", "Energia", "Água", "Internet", "Salários", "Marketing", "Manutenção", "Outros"];
const INCOME_CATEGORIES = ["Vendas", "Delivery", "iFood", "Uber Eats", "Outros"];

type Summary = { totalIncome: number; totalExpense: number; balance: number };

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminFinanceiroPage() {
  const [entries, setEntries] = useState<DbFinancialEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  async function load() {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (filterMonth) params.set("month", filterMonth);
      const res = await fetch(`/api/admin/financial?${params}`);
      const data = (await res.json()) as { entries?: DbFinancialEntry[]; summary?: Summary };
      setEntries(data.entries ?? []);
      if (data.summary) setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterType, filterMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(e: DbFinancialEntry) {
    setForm({
      type: e.type,
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      due_date: e.due_date,
      status: e.status
    });
    setEditingId(e.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.category || !form.description || !form.amount || !form.due_date) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = {
        ...(editingId ? { id: editingId } : {}),
        ...form,
        amount: parseFloat(form.amount)
      };
      const res = await fetch("/api/admin/financial", {
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
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/admin/financial?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function markPaid(e: DbFinancialEntry) {
    await fetch("/api/admin/financial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: e.id, status: "paid" })
    });
    await load();
  }

  const STATUS_LABELS = { pending: "Pendente", paid: "Pago", overdue: "Vencido" };
  const STATUS_COLORS = {
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    paid: "text-green-400 bg-green-400/10 border-green-400/30",
    overdue: "text-red-400 bg-red-400/10 border-red-400/30"
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Financeiro</h1>
          <p className="mt-0.5 text-sm text-cream/40">{entries.length} lançamentos</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/30"
        >
          + Novo lançamento
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs text-cream/40">Receitas pagas</p>
          <p className="mt-1 text-xl font-semibold text-green-400">{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs text-cream/40">Despesas pagas</p>
          <p className="mt-1 text-xl font-semibold text-red-400">{formatCurrency(summary.totalExpense)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${summary.balance >= 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          <p className="text-xs text-cream/40">Saldo</p>
          <p className={`mt-1 text-xl font-semibold ${summary.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filterType === t
                  ? "border-amberglow/50 bg-amberglow/15 text-amberglow"
                  : "border-white/8 text-cream/40 hover:border-white/20 hover:text-cream/60"
              }`}
            >
              {t === "all" ? "Todos" : t === "income" ? "Receitas" : "Despesas"}
            </button>
          ))}
        </div>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-cream outline-none focus:border-amberglow/50"
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : entries.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-white/8 text-sm text-cream/30">
          Nenhum lançamento encontrado
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">DESCRIÇÃO</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CATEGORIA</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">VENCIMENTO</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">VALOR</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-cream/90">{e.description}</p>
                    <p className="text-xs text-cream/40">{e.type === "income" ? "Receita" : "Despesa"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-cream/50">{e.category}</td>
                  <td className="px-4 py-3 text-xs text-cream/50">
                    {new Date(e.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${e.type === "income" ? "text-green-400" : "text-red-400"}`}>
                    {e.type === "expense" ? "- " : "+ "}{formatCurrency(Number(e.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {e.status !== "paid" && (
                        <button
                          onClick={() => markPaid(e)}
                          className="rounded px-2 py-1 text-xs text-green-400/60 hover:bg-green-500/10 hover:text-green-400"
                        >
                          Pagar
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(e)}
                        className="rounded px-2 py-1 text-xs text-cream/40 hover:bg-white/5 hover:text-amberglow"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
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
              {editingId ? "Editar Lançamento" : "Novo Lançamento"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TIPO *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "income" | "expense", category: "" }))}
                    className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  >
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CATEGORIA *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  >
                    <option value="">Selecione</option>
                    {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">DESCRIÇÃO *</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição do lançamento"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">VALOR (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">VENCIMENTO *</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">STATUS</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FormState["status"] }))}
                  className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                </select>
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
