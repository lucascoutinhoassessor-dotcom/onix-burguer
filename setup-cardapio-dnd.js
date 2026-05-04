const fs = require('fs');
const path = require('path');

const projectPath = 'C:\\Users\\Lucas\\Projects\\onix-burguer';
const cardapioPath = path.join(projectPath, 'src/app/admin/cardapio/page.tsx');

let content = fs.readFileSync(cardapioPath, 'utf8');

// 1. Adicionar imports do dnd-kit no inicio (depois do "use client")
const dndImports = `import {
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
`;

content = content.replace(
  '"use client";\n\nimport { useEffect, useState } from "react";',
  '"use client";\n\nimport { useEffect, useState } from "react";\n' + dndImports
);

// 2. Substituir o ItemRow por SortableItemRow
const oldItemRow = `function ItemRow({
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
}`;

const newItemRow = `function SortableItemRow({
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
}`;

content = content.replace(oldItemRow, newItemRow);

// 3. Adicionar sensors e estado de reorderMessage no componente principal
// Procurar por "const [saving, setSaving] = useState(false);" e adicionar depois
content = content.replace(
  'const [saving, setSaving] = useState(false);',
  'const [saving, setSaving] = useState(false);\n  const [reorderMessage, setReorderMessage] = useState<string | null>(null);\n\n  const sensors = useSensors(\n    useSensor(PointerSensor),\n    useSensor(KeyboardSensor, {\n      coordinateGetter: sortableKeyboardCoordinates,\n    })\n  );'
);

// 4. Adicionar funcao handleDragEnd antes do return
const dragEndFunction = `
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex((i) => i.id === active.id);
    const newIndex = filteredItems.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(filteredItems, oldIndex, newIndex);
    
    // Atualizar sort_order dos itens filtrados
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    // Atualizar o estado global de items
    const otherItems = items.filter((i) => !filteredItems.some((fi) => fi.id === i.id));
    setItems([...otherItems, ...updatedItems]);

    // Enviar atualizacao para API
    try {
      const itemsToUpdate = updatedItems.map((item) => ({
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
`;

// Inserir antes do return final
content = content.replace(
  /(return \(\s*<div className="p-6">)/,
  dragEndFunction + '\n$1'
);

// 5. Substituir a tabela para usar DndContext e SortableContext
const oldTable = `<table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PRODUTO</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CATEGORIA</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PRECO</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ACOES</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  categories={categories}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>`;

const newTable = `<DndContext
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
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PRODUTO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CATEGORIA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PRECO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ACOES</th>
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
          </DndContext>`;

content = content.replace(oldTable, newTable);

// 6. Adicionar mensagem de reordenacao
content = content.replace(
  '<div className="mb-6 flex items-center justify-between">',
  '{reorderMessage && (\n        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">\n          {reorderMessage}\n        </div>\n      )}\n\n      <div className="mb-6 flex items-center justify-between">'
);

fs.writeFileSync(cardapioPath, content, { encoding: 'utf8' });
console.log('✅ Pagina de Cardapio atualizada com Drag and Drop!');
