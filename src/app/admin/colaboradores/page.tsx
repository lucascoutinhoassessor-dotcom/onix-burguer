"use client";

import { useEffect, useState } from "react";
import type { DbEmployee, EmployeeRole } from "@/lib/supabase";

type FormState = {
  email: string;
  name: string;
  password: string;
  role: EmployeeRole;
  active: boolean;
};

const EMPTY_FORM: FormState = { email: "", name: "", password: "", role: "staff", active: true };

const ROLE_LABELS: Record<EmployeeRole, string> = {
  owner: "Proprietário",
  manager: "Gerente",
  staff: "Funcionário"
};

const ROLE_COLORS: Record<EmployeeRole, string> = {
  owner: "text-amberglow bg-amberglow/10 border-amberglow/30",
  manager: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  staff: "text-cream/60 bg-white/5 border-white/15"
};

export default function AdminColaboradoresPage() {
  const [employees, setEmployees] = useState<Omit<DbEmployee, "password_hash">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/employees");
      const data = (await res.json()) as { employees?: Omit<DbEmployee, "password_hash">[] };
      setEmployees(data.employees ?? []);
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

  function openEdit(emp: Omit<DbEmployee, "password_hash">) {
    setForm({ email: emp.email, name: emp.name, password: "", role: emp.role, active: emp.active });
    setEditingId(emp.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.email || !form.name || (!editingId && !form.password)) {
      setError("Email, nome e senha são obrigatórios");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const method = editingId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        ...(editingId ? { id: editingId } : {}),
        email: form.email,
        name: form.name,
        role: form.role,
        active: form.active
      };
      if (form.password) body.password = form.password;

      const res = await fetch("/api/admin/employees", {
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
    if (!confirm("Excluir este colaborador?")) return;
    await fetch(`/api/admin/employees?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function handleToggle(emp: Omit<DbEmployee, "password_hash">) {
    await fetch("/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emp.id, active: !emp.active })
    });
    await load();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Colaboradores</h1>
          <p className="mt-0.5 text-sm text-cream/40">{employees.length} colaboradores</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/30"
        >
          + Novo colaborador
        </button>
      </div>

      {/* Permissions reference */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(Object.entries(ROLE_LABELS) as [EmployeeRole, string][]).map(([role, label]) => (
          <div key={role} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}>
              {label}
            </span>
            <p className="mt-2 text-xs text-cream/40">
              {role === "owner" && "Acesso completo ao painel, incluindo integrações e configurações"}
              {role === "manager" && "Acesso a pedidos, cardápio, estoque, financeiro e promoções"}
              {role === "staff" && "Acesso apenas a pedidos e estoque"}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : employees.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-white/8 text-sm text-cream/30">
          Nenhum colaborador cadastrado
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">NOME</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">EMAIL</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">FUNÇÃO</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-cream/90">{emp.name}</td>
                  <td className="px-4 py-3 text-xs text-cream/50">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[emp.role]}`}>
                      {ROLE_LABELS[emp.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(emp)}
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        emp.active
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {emp.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(emp)}
                        className="rounded px-2 py-1 text-xs text-cream/40 hover:bg-white/5 hover:text-amberglow"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
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
              {editingId ? "Editar Colaborador" : "Novo Colaborador"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">EMAIL *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
                  {editingId ? "NOVA SENHA (deixe em branco para manter)" : "SENHA *"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">FUNÇÃO</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as EmployeeRole }))}
                    className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  >
                    <option value="owner">Proprietário</option>
                    <option value="manager">Gerente</option>
                    <option value="staff">Funcionário</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-cream/70">Ativo</span>
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
