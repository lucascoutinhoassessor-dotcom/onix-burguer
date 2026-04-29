"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

type FormState = {
  name: string;
};

const EMPTY_FORM: FormState = {
  name: ""
};

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = (await res.json()) as { categories?: Category[] };
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error("Load categories error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(category: Category) {
    setForm({
      name: category.name
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  // Função para gerar slug a partir do nome
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  async function handleSave() {
    if (!form.name) {
      alert("Preencha o nome da categoria");
      return;
    }

    const slug = generateSlug(form.name);
    
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = editingId 
        ? { id: editingId, name: form.name }
        : { name: form.name, slug };

      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        alert("Erro ao salvar: " + (errorData.error || "Erro desconhecido"));
        return;
      }

      setShowForm(false);
      await loadCategories();
    } catch (err) {
      console.error("Save category error:", err);
      alert("Erro de conexão ao salvar categoria.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        alert("Erro ao excluir: " + (errorData.error || "Erro desconhecido"));
        return;
      }

      await loadCategories();
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Erro de conexão ao excluir categoria.");
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Categorias</h1>
          <p className="mt-0.5 text-sm text-cream/40">{categories.length} categorias cadastradas</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow transition hover:bg-amberglow/30"
        >
          + Nova categoria
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : categories.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-white/8 text-center">
          <p className="text-sm text-cream/30">Nenhuma categoria cadastrada</p>
          <button
            onClick={openCreate}
            className="text-xs text-amberglow/60 underline hover:text-amberglow"
          >
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">NOME</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ORDEM</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs text-cream/50">{category.id}</td>
                  <td className="px-4 py-3 font-medium text-cream/90">{category.name}</td>
                  <td className="px-4 py-3 text-xs text-cream/50">{category.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(category)}
                        className="rounded px-2 py-1 text-xs text-cream/40 transition hover:bg-white/5 hover:text-amberglow"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="rounded px-2 py-1 text-xs text-cream/30 transition hover:bg-red-500/10 hover:text-red-400"
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

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">
              {editingId ? "Editar Categoria" : "Nova Categoria"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome da categoria"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
                <p className="mt-1 text-xs text-cream/30">Nome exibido no cardápio. Ex: Hambúrgueres</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2 text-sm text-cream/50 transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="rounded-lg bg-amberglow/25 px-4 py-2 text-sm font-medium text-amberglow transition hover:bg-amberglow/35 disabled:opacity-50"
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
