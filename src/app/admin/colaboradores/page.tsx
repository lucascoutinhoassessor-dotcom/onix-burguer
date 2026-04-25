"use client";

import { useEffect, useState } from "react";
import type { DbEmployee, EmployeeRole } from "@/lib/supabase";

type FormState = {
  email: string;
  name: string;
  password: string;
  role: EmployeeRole;
  active: boolean;
  cpf: string;
  cnh: string;
  document_photo_url: string;
  uploadMode: "url" | "file";
};

const EMPTY_FORM: FormState = {
  email: "",
  name: "",
  password: "",
  role: "staff",
  active: true,
  cpf: "",
  cnh: "",
  document_photo_url: "",
  uploadMode: "url"
};

const ROLE_LABELS: Record<EmployeeRole, string> = {
  owner: "Proprietário",
  manager: "Gerente",
  staff: "Funcionário",
  motoboy: "Motoboy"
};

const ROLE_COLORS: Record<EmployeeRole, string> = {
  owner: "text-amberglow bg-amberglow/10 border-amberglow/30",
  manager: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  staff: "text-cream/60 bg-white/5 border-white/15",
  motoboy: "text-purple-400 bg-purple-400/10 border-purple-400/30"
};

type EmpDisplay = Omit<DbEmployee, "password_hash">;

export default function AdminColaboradoresPage() {
  const [employees, setEmployees] = useState<EmpDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/employees");
      const data = (await res.json()) as { employees?: EmpDisplay[] };
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

  function openEdit(emp: EmpDisplay) {
    setForm({
      email: emp.email,
      name: emp.name,
      password: "",
      role: emp.role,
      active: emp.active,
      cpf: emp.cpf ?? "",
      cnh: emp.cnh ?? "",
      document_photo_url: emp.document_photo_url ?? "",
      uploadMode: "url"
    });
    setEditingId(emp.id);
    setError("");
    setShowForm(true);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) setForm((f) => ({ ...f, document_photo_url: data.url! }));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
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
        active: form.active,
        cpf: form.cpf || null,
        cnh: form.role === "motoboy" ? (form.cnh || null) : null,
        document_photo_url: form.role === "motoboy" ? (form.document_photo_url || null) : null
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

  async function handleToggle(emp: EmpDisplay) {
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
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {(Object.entries(ROLE_LABELS) as [EmployeeRole, string][]).map(([role, label]) => (
          <div key={role} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}>
              {label}
            </span>
            <p className="mt-2 text-xs text-cream/40">
              {role === "owner" && "Acesso completo ao painel, incluindo integrações e configurações"}
              {role === "manager" && "Acesso a pedidos, cardápio, estoque, financeiro e promoções"}
              {role === "staff" && "Acesso apenas a pedidos e estoque"}
              {role === "motoboy" && "Entregador — recebe notificações de pedidos para entrega"}
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
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CPF / CNH</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-cream/90">
                    <div className="flex items-center gap-2">
                      {emp.document_photo_url && (
                        <img
                          src={emp.document_photo_url}
                          alt="doc"
                          className="h-7 w-7 rounded-full object-cover opacity-70"
                        />
                      )}
                      {emp.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-cream/50">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[emp.role]}`}>
                      {ROLE_LABELS[emp.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-cream/50">
                    {emp.cpf ? (
                      <div>
                        <p>CPF: {emp.cpf}</p>
                        {emp.cnh && <p>CNH: {emp.cnh}</p>}
                      </div>
                    ) : (
                      <span className="text-cream/25">—</span>
                    )}
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
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">
              {editingId ? "Editar Colaborador" : "Novo Colaborador"}
            </h2>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
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
                    <option value="motoboy">Motoboy</option>
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

              {/* Common CPF field */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CPF</label>
                <input
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              {/* Motoboy-specific fields */}
              {form.role === "motoboy" && (
                <>
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                    <p className="mb-3 text-xs font-medium text-purple-400">Dados do Motoboy</p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
                          CNH (número)
                        </label>
                        <input
                          value={form.cnh}
                          onChange={(e) => setForm((f) => ({ ...f, cnh: e.target.value }))}
                          placeholder="00000000000"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
                          FOTO DO DOCUMENTO
                        </label>
                        <div className="mb-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, uploadMode: "url" }))}
                            className={`rounded-lg px-3 py-1 text-xs transition ${
                              form.uploadMode === "url"
                                ? "bg-amberglow/20 text-amberglow"
                                : "text-cream/40 hover:bg-white/5"
                            }`}
                          >
                            URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, uploadMode: "file" }))}
                            className={`rounded-lg px-3 py-1 text-xs transition ${
                              form.uploadMode === "file"
                                ? "bg-amberglow/20 text-amberglow"
                                : "text-cream/40 hover:bg-white/5"
                            }`}
                          >
                            Upload
                          </button>
                        </div>

                        {form.uploadMode === "url" ? (
                          <input
                            value={form.document_photo_url}
                            onChange={(e) => setForm((f) => ({ ...f, document_photo_url: e.target.value }))}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                          />
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                              }}
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-cream/70 file:mr-3 file:rounded file:border-0 file:bg-amberglow/20 file:px-2 file:py-1 file:text-xs file:text-amberglow"
                            />
                            {uploading && <p className="text-xs text-cream/40">Enviando...</p>}
                            {form.document_photo_url && !uploading && (
                              <div className="flex items-center gap-2">
                                <img
                                  src={form.document_photo_url}
                                  alt="Documento"
                                  className="h-12 w-20 rounded-lg object-cover opacity-80"
                                />
                                <p className="text-xs text-green-400">Upload concluído</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

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
