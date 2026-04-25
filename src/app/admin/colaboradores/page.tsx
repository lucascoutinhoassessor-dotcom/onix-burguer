"use client";

import { useEffect, useState } from "react";
import type { DbEmployee, EmployeeRole, EmployeePermission } from "@/lib/supabase";

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
  permissions: EmployeePermission[] | null;
  useCustomPermissions: boolean;
};

// All available tab permissions
const ALL_PERMISSIONS: { key: EmployeePermission; label: string }[] = [
  { key: "dashboard",      label: "Dashboard" },
  { key: "pedidos",        label: "Pedidos" },
  { key: "cardapio",       label: "Cardápio" },
  { key: "promocoes",      label: "Promoções" },
  { key: "estoque",        label: "Estoque" },
  { key: "financeiro",     label: "Financeiro" },
  { key: "colaboradores",  label: "Colaboradores" },
  { key: "integracoes",    label: "Integrações" },
  { key: "clientes",       label: "Clientes" }
];

// Default permissions by role (used when not customized)
const ROLE_DEFAULT_PERMISSIONS: Record<EmployeeRole, EmployeePermission[]> = {
  owner:   ["dashboard","pedidos","cardapio","promocoes","estoque","financeiro","colaboradores","integracoes","clientes"],
  manager: ["dashboard","pedidos","cardapio","promocoes","estoque","financeiro","clientes"],
  staff:   ["dashboard","pedidos","estoque"],
  motoboy: ["dashboard","pedidos"]
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
  uploadMode: "url",
  permissions: null,
  useCustomPermissions: false
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

// Permissions editor sub-component
function PermissionsEditor({
  role,
  permissions,
  useCustom,
  onToggleCustom,
  onTogglePerm
}: {
  role: EmployeeRole;
  permissions: EmployeePermission[];
  useCustom: boolean;
  onToggleCustom: (v: boolean) => void;
  onTogglePerm: (key: EmployeePermission) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium tracking-wider text-cream/50">PERMISSÕES DE ABAS</p>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => onToggleCustom(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-cream/60">Personalizar</span>
        </label>
      </div>
      {!useCustom ? (
        <p className="text-xs text-cream/40">
          Usando permissões padrão do cargo ({ROLE_LABELS[role]}).
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {ALL_PERMISSIONS.map((p) => {
            const enabled = permissions.includes(p.key);
            return (
              <label
                key={p.key}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition ${
                  enabled
                    ? "border-amberglow/40 bg-amberglow/10 text-amberglow"
                    : "border-white/10 bg-white/[0.02] text-cream/40 hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => onTogglePerm(p.key)}
                  className="sr-only"
                />
                <span className={`h-3 w-3 flex-shrink-0 rounded border ${enabled ? "border-amberglow bg-amberglow" : "border-white/30"}`} />
                {p.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
    const hasCustomPerms = emp.permissions != null && Array.isArray(emp.permissions) && emp.permissions.length > 0;
    setForm({
      email: emp.email,
      name: emp.name,
      password: "",
      role: emp.role,
      active: emp.active,
      cpf: emp.cpf ?? "",
      cnh: emp.cnh ?? "",
      document_photo_url: emp.document_photo_url ?? "",
      uploadMode: "url",
      permissions: hasCustomPerms ? (emp.permissions as EmployeePermission[]) : [...ROLE_DEFAULT_PERMISSIONS[emp.role]],
      useCustomPermissions: hasCustomPerms
    });
    setEditingId(emp.id);
    setError("");
    setShowForm(true);
  }

  function handleToggleCustomPerms(v: boolean) {
    setForm((f) => ({
      ...f,
      useCustomPermissions: v,
      permissions: v ? (f.permissions ?? [...ROLE_DEFAULT_PERMISSIONS[f.role]]) : null
    }));
  }

  function handleTogglePerm(key: EmployeePermission) {
    setForm((f) => {
      const current = f.permissions ?? [];
      const updated = current.includes(key)
        ? current.filter((p) => p !== key)
        : [...current, key];
      return { ...f, permissions: updated };
    });
  }

  // When role changes, reset permissions to role defaults (if not customized)
  function handleRoleChange(role: EmployeeRole) {
    setForm((f) => ({
      ...f,
      role,
      permissions: f.useCustomPermissions ? f.permissions : [...ROLE_DEFAULT_PERMISSIONS[role]]
    }));
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
        document_photo_url: form.role === "motoboy" ? (form.document_photo_url || null) : null,
        permissions: form.useCustomPermissions ? (form.permissions ?? null) : null
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
              {role === "owner" && "Acesso completo. Permissões customizáveis por colaborador."}
              {role === "manager" && "Acesso a pedidos, cardápio, estoque, financeiro e promoções."}
              {role === "staff" && "Acesso padrão: pedidos e estoque. Customizável."}
              {role === "motoboy" && "Entregador — pedidos para entrega. Customizável."}
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
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PERMISSÕES</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const hasCustom = emp.permissions != null && Array.isArray(emp.permissions) && emp.permissions.length > 0;
                const displayPerms = hasCustom
                  ? (emp.permissions as EmployeePermission[])
                  : ROLE_DEFAULT_PERMISSIONS[emp.role];
                return (
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {displayPerms.slice(0, 4).map((p) => (
                          <span key={p} className={`rounded px-1.5 py-0.5 text-xs ${hasCustom ? "bg-amberglow/10 text-amberglow/80" : "bg-white/5 text-cream/30"}`}>
                            {ALL_PERMISSIONS.find((ap) => ap.key === p)?.label ?? p}
                          </span>
                        ))}
                        {displayPerms.length > 4 && (
                          <span className="text-xs text-cream/30">+{displayPerms.length - 4}</span>
                        )}
                        {hasCustom && (
                          <span className="rounded px-1.5 py-0.5 text-xs bg-amberglow/15 text-amberglow font-medium">custom</span>
                        )}
                      </div>
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
                );
              })}
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

            <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
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
                    onChange={(e) => handleRoleChange(e.target.value as EmployeeRole)}
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
              )}

              {/* Permissions editor — only for non-owners */}
              {form.role !== "owner" && (
                <PermissionsEditor
                  role={form.role}
                  permissions={form.permissions ?? ROLE_DEFAULT_PERMISSIONS[form.role]}
                  useCustom={form.useCustomPermissions}
                  onToggleCustom={handleToggleCustomPerms}
                  onTogglePerm={handleTogglePerm}
                />
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
