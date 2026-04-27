"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/checkout";
import type { DbMenuItem } from "@/lib/supabase";
import { menuItems as localMenuItems } from "@/data/menu";

const CATEGORIES = [
  { value: "hamburgueres", label: "Hambúrgueres" },
  { value: "acompanhamentos", label: "Acompanhamentos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "sobremesas", label: "Sobremesas" }
];

type FormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  active: boolean;
  uploadMode: "url" | "file";
};

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "hamburgueres",
  image: "",
  active: true,
  uploadMode: "url"
};

function ItemRow({
  item,
  onEdit,
  onToggle,
  onDelete
}: {
  item: DbMenuItem;
  onEdit: (item: DbMenuItem) => void;
  onToggle: (item: DbMenuItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="h-10 w-10 flex-shrink-0 rounded-lg object-cover opacity-80"
            />
          )}
          <div>
            <p className="font-medium text-cream/90">{item.name}</p>
            <p className="line-clamp-1 max-w-xs text-xs text-cream/40">{item.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs capitalize text-cream/50">
        {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
      </td>
      <td className="px-4 py-3 font-semibold text-amberglow">{formatCurrency(Number(item.price))}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggle(item)}
          className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
            item.active
              ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400"
              : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-green-500/10 hover:text-green-400"
          }`}
        >
          {item.active ? "Ativo" : "Inativo"}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="rounded px-2 py-1 text-xs text-cream/40 transition hover:bg-white/5 hover:text-amberglow"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="rounded px-2 py-1 text-xs text-cream/30 transition hover:bg-red-500/10 hover:text-red-400"
          >
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminCardapioPage() {
  const [items, setItems] = useState<DbMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setForm((f) => ({ ...f, image: data.url! }));
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  async function loadItems() {
    try {
      const res = await fetch("/api/menu");
      const data = (await res.json()) as { items?: DbMenuItem[] };
      setItems(data.items ?? []);
    } catch (err) {
      console.error("Load menu error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: DbMenuItem) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category,
      image: item.image ?? "",
      active: item.active,
      uploadMode: "url"
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.id || !form.name || !form.price || !form.category) return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = {
        id: editingId ? editingId : form.id.toLowerCase().replace(/\s+/g, "-"),
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category: form.category,
        image: form.image || null,
        active: form.active,
        option_groups: editingId
          ? (items.find((i) => i.id === editingId)?.option_groups ?? [])
          : [],
        sort_order: 0
      };

      const res = await fetch("/api/menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        console.error("Save error:", errorData);
        alert("Erro ao salvar: " + (errorData.error || "Erro desconhecido"));
        return;
      }

      setShowForm(false);
      await loadItems();
    } catch (err) {
      console.error("Save item error:", err);
      alert("Erro de conexão ao salvar item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: DbMenuItem) {
    console.log("handleToggle called for item:", item.id, "current active:", item.active);
    try {
      const body = { id: item.id, active: !item.active };
      console.log("Sending PATCH request with body:", JSON.stringify(body));
      
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      console.log("PATCH response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        console.error("Toggle error:", errorData);
        alert("Erro ao alterar status: " + (errorData.error || "Erro desconhecido"));
        return;
      }
      
      const responseData = await res.json();
      console.log("PATCH response data:", JSON.stringify(responseData));
      
      await loadItems();
      console.log("Items reloaded after toggle");
    } catch (err) {
      console.error("Toggle error:", err);
      alert("Erro de conexão ao alterar status.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Confirmar exclusão?")) return;
    try {
      await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
      await loadItems();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleImportLocal() {
    setImporting(true);
    try {
      for (const item of localMenuItems) {
        const exists = items.some((i) => i.id === item.id);
        if (!exists) {
          await fetch("/api/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              image: item.image,
              active: true,
              option_groups: item.optionGroups ?? [],
              sort_order: 0
            })
          });
        }
      }
      await loadItems();
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setImporting(false);
    }
  }

  const filtered =
    categoryFilter === "all" ? items : items.filter((i) => i.category === categoryFilter);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Cardápio</h1>
          <p className="mt-0.5 text-sm text-cream/40">{items.length} itens cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportLocal}
            disabled={importing}
            className="rounded-lg border border-amberglow/30 px-3 py-1.5 text-xs text-amberglow/70 transition hover:bg-amberglow/10 disabled:opacity-50"
          >
            {importing ? "Importando..." : "Importar cardápio atual"}
          </button>
          <button
            onClick={openCreate}
            className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow transition hover:bg-amberglow/30"
          >
            + Novo item
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            categoryFilter === "all"
              ? "border-amberglow/50 bg-amberglow/15 text-amberglow"
              : "border-white/8 text-cream/40 hover:border-white/20 hover:text-cream/60"
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              categoryFilter === cat.value
                ? "border-amberglow/50 bg-amberglow/15 text-amberglow"
                : "border-white/8 text-cream/40 hover:border-white/20 hover:text-cream/60"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-white/8 text-center">
          <p className="text-sm text-cream/30">Nenhum item cadastrado</p>
          {items.length === 0 && (
            <button
              onClick={handleImportLocal}
              disabled={importing}
              className="text-xs text-amberglow/60 underline hover:text-amberglow"
            >
              {importing ? "Importando..." : "Importar itens do cardápio estático"}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ITEM</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CATEGORIA</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PREÇO</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
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
              {editingId ? "Editar Item" : "Novo Item"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ID *</label>
                  <input
                    value={form.id}
                    onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                    disabled={!!editingId}
                    placeholder="nome-do-item"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none disabled:opacity-50 focus:border-amberglow/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CATEGORIA *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome do item"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">DESCRIÇÃO</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Descrição do item"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">PREÇO (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
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
                    <span className="text-sm text-cream/70">Ativo no cardápio</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">IMAGEM</label>
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
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
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
                    {uploading && (
                      <p className="text-xs text-cream/40">Enviando imagem...</p>
                    )}
                    {form.image && !uploading && (
                      <div className="flex items-center gap-2">
                        <img
                          src={form.image}
                          alt="Preview"
                          className="h-12 w-12 rounded-lg object-cover opacity-80"
                        />
                        <p className="truncate text-xs text-green-400">Upload concluído</p>
                      </div>
                    )}
                  </div>
                )}
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
                disabled={saving || !form.id || !form.name || !form.price}
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
