const fs = require('fs');
const path = require('path');

const projectPath = 'C:\\Users\\Lucas\\Projects\\onix-burguer';
const cardapioPath = path.join(projectPath, 'src/app/admin/cardapio/page.tsx');

let content = fs.readFileSync(cardapioPath, 'utf8');

// 1. Atualizar o tipo FormState para incluir option_groups
const oldFormState = `type FormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  active: boolean;
  uploadMode: "url" | "file";
};`;

const newFormState = `type MenuOption = {
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
};`;

content = content.replace(oldFormState, newFormState);

// 2. Atualizar EMPTY_FORM
const oldEmptyForm = `const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  active: true,
  uploadMode: "url"
};`;

const newEmptyForm = `const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  active: true,
  uploadMode: "url",
  option_groups: []
};`;

content = content.replace(oldEmptyForm, newEmptyForm);

// 3. Atualizar openEdit para carregar option_groups
const oldOpenEdit = `function openEdit(item: DbMenuItem) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: categories.find((c) => c.id === item.category)?.slug || item.category,
      image: item.image || "",
      active: item.active ?? true,
      uploadMode: "url"
    });
    setEditingId(item.id);
    setShowForm(true);
  }`;

const newOpenEdit = `function openEdit(item: DbMenuItem) {
    const itemOptionGroups = (item.option_groups as MenuOptionGroup[] | undefined) ?? [];
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: categories.find((c) => c.id === item.category)?.slug || item.category,
      image: item.image || "",
      active: item.active ?? true,
      uploadMode: "url",
      option_groups: itemOptionGroups
    });
    setEditingId(item.id);
    setShowForm(true);
  }`;

content = content.replace(oldOpenEdit, newOpenEdit);

// 4. Atualizar handleSave para enviar option_groups
const oldHandleSaveBody = `const body = {
        id: editingId ? editingId : form.id.toLowerCase().replace(/\\s+/g, "-"),
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category: form.category,
        image: form.image || null,
        active: form.active,
        option_groups: editingId ? (items.find((i) => i.id === editingId)?.option_groups ?? []) : [],
        sort_order: 0
      };`;

const newHandleSaveBody = `const body = {
        id: editingId ? editingId : form.id.toLowerCase().replace(/\\s+/g, "-"),
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category: form.category,
        image: form.image || null,
        active: form.active,
        option_groups: form.option_groups || [],
        sort_order: 0
      };`;

content = content.replace(oldHandleSaveBody, newHandleSaveBody);

// 5. Adicionar funcoes de gerenciamento de complementos antes do return principal
const optionGroupFunctions = `
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
`;

// Inserir antes do handleDragEnd
const handleDragEndIndex = content.indexOf('async function handleDragEnd');
if (handleDragEndIndex !== -1) {
  content = content.slice(0, handleDragEndIndex) + optionGroupFunctions + '\n' + content.slice(handleDragEndIndex);
}

// 6. Adicionar secao de complementos no modal (antes dos botoes de acao)
const oldModalButtons = `            <div className="mt-6 flex justify-end gap-3">
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
            </div>`;

const newModalButtons = `            {/* Complementos e Adicionais */}
            <div className="mt-6 border-t border-white/10 pt-6">
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
            </div>`;

content = content.replace(oldModalButtons, newModalButtons);

fs.writeFileSync(cardapioPath, content, { encoding: 'utf8' });
console.log('✅ Secao de Complementos e Adicionais adicionada ao formulario de produtos!');
