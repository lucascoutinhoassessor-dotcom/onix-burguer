"use client";

import { useEffect, useState } from "react";
import type { DbSupplier } from "@/lib/supabase";

type FormState = {
  name: string;
  legal_name: string;
  phone: string;
  cnpj_cpf: string;
  email: string;
  address: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  legal_name: "",
  phone: "",
  cnpj_cpf: "",
  email: "",
  address: ""
};

export default function AdminFornecedoresPage() {
  const [suppliers, setSuppliers] = useState<DbSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/suppliers");
      const data = (await res.json()) as { suppliers?: DbSupplier[] };
      setSuppliers(data.suppliers ?? []);
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

  function openEdit(s: DbSupplier) {
    setForm({
      name: s.name,
      legal_name: s.legal_name ?? "",
      phone: s.phone ?? "",
      cnpj_cpf: s.cnpj_cpf ?? "",
      email: s.email ?? "",
      address: s.address ?? ""
    });
    setEditingId(s.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name) { setError("Nome é obrigatório"); return; }
    setSaving(true);
    setError("");
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name,
        legal_name: form.legal_name || null,
        phone: form.phone || null,
        cnpj_cpf: form.cnpj_cpf || null,
        email: form.email || null,
        address: form.address || null
      };
      const res = await fetch("/api/admin/suppliers", {
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
    if (!confirm("Excluir este fornecedor?")) return;
    await fetch(`/api/admin/suppliers?id=${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = search
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.cnpj_cpf ?? "").includes(search) ||
          (s.phone ?? "").includes(search)
      )
    : suppliers;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Fornecedores</h1>
          <p className="mt-0.5 text-sm text-cream/40">{suppliers.length} fornecedores cadastrados</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/30"
        >
          + Novo fornecedor
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CNPJ ou telefone..."
          className="w-full max-w-sm rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-white/8 text-sm text-cream/30">
          {search ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">NOME</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CNPJ / CPF</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">TELEFONE</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">EMAIL</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-cream/90">{s.name}</p>
                    {s.legal_name && <p className="text-xs text-cream/40">{s.legal_name}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-cream/50">{s.cnpj_cpf ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-cream/50">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-cream/50">{s.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="rounded px-2 py-1 text-xs text-cream/40 hover:bg-white/5 hover:text-amberglow">Editar</button>
                      <button onClick={() => handleDelete(s.id)} className="rounded px-2 py-1 text-xs text-cream/30 hover:bg-red-500/10 hover:text-red-400">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME FANTASIA *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do fornecedor" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">RAZÃO SOCIAL</label>
                <input value={form.legal_name} onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))} placeholder="Razão social" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CNPJ / CPF</label>
                  <input value={form.cnpj_cpf} onChange={(e) => setForm((f) => ({ ...f, cnpj_cpf: e.target.value }))} placeholder="00.000.000/0001-00" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TELEFONE</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(21) 99999-9999" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">EMAIL</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="contato@fornecedor.com.br" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ENDEREÇO</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Rua, nº, bairro, cidade - UF" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50" />
              </div>
              {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-cream/50 hover:bg-white/5">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow hover:bg-amberglow/35 disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
