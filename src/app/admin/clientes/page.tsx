"use client";

import { useEffect, useState } from "react";
import type { DbCustomerAccount, CustomerOrigin } from "@/lib/supabase";

const ORIGIN_LABELS: Record<CustomerOrigin, string> = {
  site: "Site",
  manual: "Manual",
  ifood: "iFood",
  api: "API"
};

const ORIGIN_COLORS: Record<CustomerOrigin, string> = {
  site: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  manual: "text-cream/60 bg-white/5 border-white/15",
  ifood: "text-red-400 bg-red-400/10 border-red-400/30",
  api: "text-purple-400 bg-purple-400/10 border-purple-400/30"
};

type FilterState = {
  search: string;
  origin: CustomerOrigin | "all";
  registered_from: string;
  registered_to: string;
  last_order_days: string;
};

const EMPTY_FILTERS: FilterState = {
  search: "",
  origin: "all",
  registered_from: "",
  registered_to: "",
  last_order_days: ""
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

type FormState = { phone: string; name: string; email: string; origin: CustomerOrigin };
const EMPTY_FORM: FormState = { phone: "", name: "", email: "", origin: "manual" };

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<DbCustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load(f: FilterState = filters) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.origin !== "all") params.set("origin", f.origin);
      if (f.registered_from) params.set("registered_from", f.registered_from);
      if (f.registered_to) params.set("registered_to", f.registered_to);
      if (f.last_order_days) params.set("last_order_days", f.last_order_days);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = (await res.json()) as { customers?: DbCustomerAccount[] };
      setCustomers(data.customers ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters() { load(filters); }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  }

  async function handleCreate() {
    if (!form.phone || !form.name) { setError("Telefone e nome são obrigatórios"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
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
    if (!confirm("Excluir este cliente?")) return;
    await fetch(`/api/admin/customers?id=${id}`, { method: "DELETE" });
    await load();
  }

  // Separate registered (has password) from non-registered
  const registered = customers.filter((c) => c.registered_at);
  const unregistered = customers.filter((c) => !c.registered_at);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Clientes</h1>
          <p className="mt-0.5 text-sm text-cream/40">{customers.length} clientes encontrados</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(""); setShowForm(true); }}
          className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/30"
        >
          + Novo cliente
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="mb-3 text-xs font-medium tracking-wider text-cream/40">FILTROS</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-cream/40">Buscar</label>
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Nome, telefone, e-mail..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-cream/40">Origem</label>
            <select
              value={filters.origin}
              onChange={(e) => setFilters((f) => ({ ...f, origin: e.target.value as FilterState["origin"] }))}
              className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-xs text-cream outline-none focus:border-amberglow/50"
            >
              <option value="all">Todas</option>
              <option value="site">Site</option>
              <option value="manual">Manual</option>
              <option value="ifood">iFood</option>
              <option value="api">API</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-cream/40">Cadastro a partir de</label>
            <input
              type="date"
              value={filters.registered_from}
              onChange={(e) => setFilters((f) => ({ ...f, registered_from: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cream outline-none focus:border-amberglow/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-cream/40">Último pedido (dias)</label>
            <input
              type="number"
              min="1"
              value={filters.last_order_days}
              onChange={(e) => setFilters((f) => ({ ...f, last_order_days: e.target.value }))}
              placeholder="Ex: 30"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={applyFilters} className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/30">Filtrar</button>
          <button onClick={clearFilters} className="rounded-lg px-3 py-1.5 text-xs text-cream/40 hover:bg-white/5">Limpar</button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : customers.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-white/8 text-sm text-cream/30">
          Nenhum cliente encontrado
        </div>
      ) : (
        <>
          {/* Registered customers */}
          {registered.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-cream/70">
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">{registered.length}</span>
                Cadastrados
              </h2>
              <CustomerTable customers={registered} onDelete={handleDelete} />
            </div>
          )}

          {/* Non-registered (from orders only) */}
          {unregistered.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-cream/60">
                <span className="rounded-full bg-cream/10 px-2 py-0.5 text-xs text-cream/50">{unregistered.length}</span>
                Apenas em pedidos (sem cadastro)
              </h2>
              <CustomerTable customers={unregistered} onDelete={handleDelete} />
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">Novo Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TELEFONE *</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(21) 99999-9999" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">EMAIL</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@cliente.com" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ORIGEM</label>
                <select value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value as CustomerOrigin }))} className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50">
                  <option value="manual">Manual</option>
                  <option value="site">Site</option>
                  <option value="ifood">iFood</option>
                  <option value="api">API</option>
                </select>
              </div>
              {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-cream/50 hover:bg-white/5">Cancelar</button>
              <button onClick={handleCreate} disabled={saving} className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow hover:bg-amberglow/35 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerTable({
  customers,
  onDelete
}: {
  customers: DbCustomerAccount[];
  onDelete: (id: string) => void;
}) {
  const ORIGIN_LABELS: Record<CustomerOrigin, string> = { site: "Site", manual: "Manual", ifood: "iFood", api: "API" };
  const ORIGIN_COLORS: Record<CustomerOrigin, string> = {
    site: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    manual: "text-cream/60 bg-white/5 border-white/15",
    ifood: "text-red-400 bg-red-400/10 border-red-400/30",
    api: "text-purple-400 bg-purple-400/10 border-purple-400/30"
  };

  function fmt(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/8">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8 bg-white/[0.02]">
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">NOME</th>
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">TELEFONE</th>
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">EMAIL</th>
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ORIGEM</th>
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CADASTRO</th>
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ÚLT. PEDIDO</th>
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium text-cream/90">{c.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-cream/50">{c.phone}</td>
              <td className="px-4 py-3 text-xs text-cream/50">{c.email ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ORIGIN_COLORS[c.origin] ?? "text-cream/50"}`}>
                  {ORIGIN_LABELS[c.origin] ?? c.origin}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-cream/50">{fmt(c.registered_at)}</td>
              <td className="px-4 py-3 text-xs text-cream/50">{fmt(c.last_order_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded px-2 py-1 text-xs text-green-400/50 hover:bg-green-500/10 hover:text-green-400"
                  >
                    WA
                  </a>
                  <button onClick={() => onDelete(c.id)} className="rounded px-2 py-1 text-xs text-cream/30 hover:bg-red-500/10 hover:text-red-400">Excluir</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
