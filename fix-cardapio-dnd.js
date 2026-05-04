const fs = require('fs');
const path = require('path');

const projectPath = 'C:\\Users\\Lucas\\Projects\\onix-burguer';
const cardapioPath = path.join(projectPath, 'src/app/admin/cardapio/page.tsx');

let content = fs.readFileSync(cardapioPath, 'utf8');

// 1. Substituir a tabela antiga pela nova com DndContext
const oldTable = `<div className="overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">ITEM</th>
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
          </table>
        </div>`;

const newTable = `<div className="overflow-hidden rounded-xl border border-white/8">
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
          </DndContext>
        </div>`;

if (content.includes(oldTable)) {
  content = content.replace(oldTable, newTable);
  console.log('✅ Tabela substituida com DndContext');
} else {
  console.log('❌ Nao encontrou a tabela antiga');
}

// 2. Adicionar funcao handleDragEnd antes do return principal
const dragEndFunction = `
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
`;

// Encontrar o ultimo "return (" antes do JSX principal
const returnIndex = content.indexOf('return (\n    <div className="p-6">');
if (returnIndex !== -1) {
  content = content.slice(0, returnIndex) + dragEndFunction + '\n' + content.slice(returnIndex);
  console.log('✅ Funcao handleDragEnd adicionada');
} else {
  console.log('❌ Nao encontrou o return principal');
}

// 3. Adicionar mensagem de reordenacao
const headerDiv = '<div className="mb-6 flex items-center justify-between">';
const reorderMessageDiv = `{reorderMessage && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
          {reorderMessage}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">`;

if (content.includes(headerDiv) && !content.includes('reorderMessage')) {
  content = content.replace(headerDiv, reorderMessageDiv);
  console.log('✅ Mensagem de reordenacao adicionada');
}

fs.writeFileSync(cardapioPath, content, { encoding: 'utf8' });
console.log('\\n🎉 Pagina de Cardapio atualizada com Drag and Drop!');
