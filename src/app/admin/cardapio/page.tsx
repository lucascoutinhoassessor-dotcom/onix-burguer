"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatCurrency } from "@/lib/checkout";
import type { DbMenuItem } from "@/lib/supabase";
import { menuItems as localMenuItems } from "@/data/menu";

type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

type MenuOption = {
  id: string;
  name: string;
  price: number;
};

type MenuOptionGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: MenuOption[];
};

type FormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  active: boolean;
  uploadMode: "url" | "file";
  option_groups: MenuOptionGroup[];
};

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  active: true,
  uploadMode: "url",
  option_groups: []
};

function SortableItemRow({
  item,
  categories,
  onEdit,
  onToggle,
  onDelete
}: {
  item: DbMenuItem;
  categories: Category[];
  onEdit: (item: DbMenuItem) => void;
  onToggle: (item: DbMenuItem) => void;
  onDelete: (id: string) => void;
}) {
  const categoryLabel = categories.find((c) => c.id === item.category)?.name ?? item.category;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-white/5 hover:bg-white/[0.02]"
    >
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-cream/30 hover:text-cream/60"
          title="Arrastar para reordenar"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 .001 3.999A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 3.999A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 3.999A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-3.999A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 3.999A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 3.999A2 2 0 0 0 13 14z" />
          </svg>
        </button>
      </td>
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
      <td className="px-4 py-3 text-xs capitalize text-cream/50">{categoryLabel}</td>
      <td className="px-4 py-3 font-semibold text-amberglow">{formatCurrency(Number(item.price))}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => {
            console.log("[ItemRow] Toggle button clicked for item:", item.id, "active:", item.active);
            onToggle(item);
          }}
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  async function handleFileUpload(file: File) {
    console.log("[handleFileUpload] Starting upload for file:", file.name, "size:", file.size, "type:", file.type);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      console.log("[handleFileUpload] Sending request to /api/admin/upload");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      console.log("[handleFileUpload] Response status:", res.status);

      const data = (await res.json()) as { url?: string; error?: string; method?: string };
      console.log("[handleFileUpload] Response data:", data);

      if (data.error) {
        console.error("[handleFileUpload] Error from API:", data.error);
        alert("Erro no upload: " + data.error);
        return;
      }

      if (data.url) {
        console.log("[handleFileUpload] Success! URL received:", data.url, "method:", data.method);
        setForm((f) => ({ ...f, image: data.url! }));
      } else {
        console.error("[handleFileUpload] No URL in response");
        alert("Erro: URL da imagem não recebida");
      }
    } catch (err) {
      console.error("[handleFileUpload] Upload error:", err);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
  }

  async function loadItems() {
    try {
      const res = await fetch("/api/menu");
      const data = (await res.json()) as { items?: DbMenuItem[] };
      // Garantir que active sempre seja booleano
      const normalizedItems = (data.items ?? []).map((item) => ({
        ...item,
        active: item.active === true ? true : false
      }));
      setItems(normalizedItems);
    } catch (err) {
      console.error("Load menu error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = (await res.json()) as { categories?: Category[] };
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error("Load categories error:", err);
    }
  }

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?.slug ?? ""
    });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item: DbMenuItem) {
    console.log("[openEdit] Opening edit for item:", item.id, "| active:", item.active);
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category,
      image: item.image ?? "",
      active: item.active === true ? true : false,
      uploadMode: "url",
      option_groups: (item.option_groups as MenuOptionGroup[] | undefined) ?? []
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    console.log("handleSave called - form data:", { id: form.id, name: form.name, price: form.price, category: form.category });
    if (!form.id || !form.name || !form.price || !form.category) {
      console.log("handleSave - Validation failed: missing required fields");
      return;
    }
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
        option_groups: editingId ? (items.find((i) => i.id === editingId)?.option_groups ?? []) : [],
        sort_order: 0
      };

      console.log("handleSave - Sending request:", method, "/api/menu, body:", JSON.stringify(body));

      const res = await fetch("/api/menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      console.log("handleSave - Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        console.error("Save error:", errorData);
        alert("Erro ao salvar: " + (errorData.error || "Erro desconhecido"));
        return;
      }

      const responseData = await res.json();
      console.log("handleSave - Success:", JSON.stringify(responseData));

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
    console.log("[handleToggle] Called for item:", item.id, "| current active:", item.active);
    console.log("[handleToggle] Full item data:", JSON.stringify(item, null, 2));

    try {
      const newActiveState = !item.active;
      const body = { id: item.id, active: newActiveState };
      console.log("[handleToggle] New active state will be:", newActiveState);
      console.log("[handleToggle] Sending PATCH request with body:", JSON.stringify(body, null, 2));

      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      console.log("[handleToggle] Response status:", res.status);
      console.log("[handleToggle] Response headers:", JSON.stringify(Object.fromEntries(res.headers.entries())));

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[handleToggle] ERROR - Response not OK:", res.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Erro desconhecido" };
        }
        alert("Erro ao alterar status: " + (errorData.error || "Erro desconhecido"));
        return;
      }

      const responseText = await res.text();
      console.log("[handleToggle] Raw response text:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("[handleToggle] Parsed response data:", JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.error("[handleToggle] ERROR parsing JSON response:", e);
        alert("Erro ao processar resposta do servidor");
        return;
      }

      if (!responseData.success) {
        console.error("[handleToggle] ERROR - API returned success: false:", responseData.error);
        alert("Erro ao alterar status: " + (responseData.error || "Erro desconhecido"));
        return;
      }

      console.log("[handleToggle] API call successful, reloading items...");
      await loadItems();
      console.log("[handleToggle] Items reloaded successfully");
    } catch (err) {
      console.error("[handleToggle] Unhandled error:", err);
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

  // Aplicar filtros na lista de produtos
  const filteredItems = items.filter((item) => {
    // Filtro por nome (case insensitive)
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por categoria - converter slug para UUID para comparar
    let matchesCategory = selectedCategory === "all";
    if (selectedCategory !== "all") {
      // Buscar categoria pelo ID
      const selectedCat = categories.find(c => c.id === selectedCategory);
      if (selectedCat) {
        // Comparar se o slug do item corresponde ao slug da categoria selecionada
        // ou se o category do item é o ID da categoria
        matchesCategory = item.category === selectedCategory || 
                         item.category === selectedCat.slug;
      }
    }
    
    // Filtro por status
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && item.active) || 
      (statusFilter === "inactive" && !item.active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  
  // Funcoes de gerenciamento de complementos
  function addOptionGroup() {
    const newGroup: MenuOptionGroup = {
      id: crypto.randomUUID(),
      name: "",
      type: "single",
      required: false,
      minSelections: 0,
      maxSelections: 1,
      options: []
    };
    setForm((f) => ({ ...f, option_groups: [...f.option_groups, newGroup] }));
  }

  function updateOptionGroup(groupId: string, updates: Partial<MenuOptionGroup>) {
    setForm((f) => ({
      ...f,
      option_groups: f.option_groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      )
    }));
  }

  function removeOptionGroup(groupId: string) {
    setForm((f) => ({
      ...f,
      option_groups: f.option_groups.filter((g) => g.id !== groupId)
    }));
  }

  function addOptionItem(groupId: string) {
    const newOption: MenuOption = {
      id: crypto.randomUUID(),
      name: "",
      price: 0
    };
    setForm((f) => ({
      ...f,
      option_groups: f.option_groups.map((g) =>
        g.id === groupId ? { ...g, options: [...g.options, newOption] } : g
      )
    }));
  }

  function updateOptionItem(groupId: string, optionId: string, updates: Partial<MenuOption>) {
    setForm((f) => ({
      ...f,
      option_groups: f.option_groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === optionId ? { ...o, ...updates } : o
              )
            }
          : g
      )
    }));
  }

  function removeOptionItem(groupId: string, optionId: string) {
    setForm((f) => ({
      ...f,
      option_groups: f.option_groups.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
          : g
      )
    }));
  }

async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex((i) => i.id === active.id);
    const newIndex = filteredItems.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newFilteredItems = arrayMove(filteredItems, oldIndex, newIndex);
    
    // Atualizar sort_order dos itens filtrados
    const updatedFilteredItems = newFilteredItems.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    // Atualizar o estado global de items
    const otherItems = items.filter((i) => !filteredItems.some((fi) => fi.id === i.id));
    setItems([...otherItems, ...updatedFilteredItems]);

    // Enviar atualizacao para API
    try {
      const itemsToUpdate = updatedFilteredItems.map((item) => ({
        id: item.id,
        sort_order: item.sort_order,
      }));

      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      if (res.ok) {
        setReorderMessage("Ordem atualizada");
        setTimeout(() => setReorderMessage(null), 2000);
      } else {
        console.error("Erro ao reordenar");
        await loadItems(); // Reverter
      }
    } catch (err) {
      console.error("Reorder error:", err);
      await loadItems(); // Reverter
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      {reorderMessage && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
          {reorderMessage}
        </div>
      )}

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

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        {/* Campo de busca com ícone de lupa */}
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">BUSCAR</label>
          <div className="relative">
            <svg 
              viewBox="0 0 24 24" 
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-cream/30"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
        </div>

        {/* Filtro por categoria */}
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">CATEGORIA</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
          >
            <option value="all">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por status */}
        <div className="w-36">
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">STATUS</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="w-full rounded-lg border border-white/10 bg-coal px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
          >
            <option value="all">Todos</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mb-4 text-xs text-cream/40">
        {filteredItems.length} {filteredItems.length === 1 ? "produto encontrado" : "produtos encontrados"}
        {(searchTerm || selectedCategory !== "all" || statusFilter !== "all") && (
          <span className="ml-2 text-cream/30">
            (filtros aplicados)
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-white/8 text-center">
          <p className="text-sm text-cream/30">
            {items.length === 0 ? "Nenhum item cadastrado" : "Nenhum produto encontrado com os filtros selecionados"}
          </p>
          {items.length === 0 && (
            <button
              onClick={handleImportLocal}
              disabled={importing}
              className="text-xs text-amberglow/60 underline hover:text-amberglow"
            >
              {importing ? "Importando..." : "Importar itens do cardápio estático"}
            </button>
          )}
          {(searchTerm || selectedCategory !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setStatusFilter("all");
              }}
              className="text-xs text-amberglow/60 underline hover:text-amberglow"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/8">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40 w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ITEM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CATEGORIA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PREÇO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <SortableItemRow
                      key={item.id}
                      item={item}
                      categories={categories}
                      onEdit={openEdit}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-coal p-6 shadow-2xl">
            <h2 className="mb-5 font-title text-xl text-cream">{editingId ? "Editar Item" : "Novo Item"}</h2>

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
                    {categories.length === 0 && <option value="">Carregando...</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
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
                      form.uploadMode === "url" ? "bg-amberglow/20 text-amberglow" : "text-cream/40 hover:bg-white/5"
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, uploadMode: "file" }))}
                    className={`rounded-lg px-3 py-1 text-xs transition ${
                      form.uploadMode === "file" ? "bg-amberglow/20 text-amberglow" : "text-cream/40 hover:bg-white/5"
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
                    {uploading && <p className="text-xs text-cream/40">Enviando imagem...</p>}
                    {form.image && !uploading && (
                      <div className="flex items-center gap-2">
                        <img src={form.image} alt="Preview" className="h-12 w-12 rounded-lg object-cover opacity-80" />
                        <p className="truncate text-xs text-green-400">Upload concluído</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Complementos e Adicionais */}
            <div className="mt-6 max-h-[300px] overflow-y-auto rounded-lg border border-white/10 p-4"
              style={{ resize: 'vertical', minHeight: '150px' }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-title text-lg text-cream">Complementos e Adicionais</h3>
                <button
                  type="button"
                  onClick={addOptionGroup}
                  className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow transition hover:bg-amberglow/30"
                >
                  + Novo Grupo
                </button>
              </div>

              {form.option_groups.length === 0 && (
                <p className="text-sm text-cream/40">Nenhum grupo de opcoes cadastrado.</p>
              )}

              <div className="space-y-4">
                {form.option_groups.map((group) => (
                  <div key={group.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <input
                        value={group.name}
                        onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })}
                        placeholder="Nome do grupo (ex: Ponto da carne)"
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                      />
                      <button
                        type="button"
                        onClick={() => removeOptionGroup(group.id)}
                        className="ml-2 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Excluir Grupo
                      </button>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-cream/50">Tipo</label>
                        <select
                          value={group.type}
                          onChange={(e) => updateOptionGroup(group.id, { type: e.target.value as "single" | "multiple" })}
                          className="w-full rounded border border-white/10 bg-coal px-2 py-1 text-xs text-cream"
                        >
                          <option value="single">Unica escolha</option>
                          <option value="multiple">Multipla escolha</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-cream/50">Obrigatorio</label>
                        <select
                          value={group.required ? "true" : "false"}
                          onChange={(e) => updateOptionGroup(group.id, { required: e.target.value === "true" })}
                          className="w-full rounded border border-white/10 bg-coal px-2 py-1 text-xs text-cream"
                        >
                          <option value="false">Nao</option>
                          <option value="true">Sim</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-cream/50">Max. escolhas</label>
                        <input
                          type="number"
                          min="1"
                          value={group.maxSelections}
                          onChange={(e) => updateOptionGroup(group.id, { maxSelections: parseInt(e.target.value) || 1 })}
                          className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-cream"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            value={option.name}
                            onChange={(e) => updateOptionItem(group.id, option.id, { name: e.target.value })}
                            placeholder="Nome do item"
                            className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={option.price}
                            onChange={(e) => updateOptionItem(group.id, option.id, { price: parseFloat(e.target.value) || 0 })}
                            placeholder="Preco"
                            className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-cream"
                          />
                          <button
                            type="button"
                            onClick={() => removeOptionItem(group.id, option.id)}
                            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addOptionItem(group.id)}
                      className="mt-2 rounded-lg border border-dashed border-white/20 px-3 py-1 text-xs text-cream/50 transition hover:border-amberglow/40 hover:text-amberglow"
                    >
                      + Adicionar Item
                    </button>
                  </div>
                ))}
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
