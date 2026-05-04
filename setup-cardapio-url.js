const fs = require('fs');
const path = require('path');

const projectPath = 'C:\\Users\\Lucas\\Projects\\onix-burguer';
const menuPagePath = path.join(projectPath, 'src/components/menu-page-client.tsx');

let content = fs.readFileSync(menuPagePath, 'utf8');

// 1. Adicionar import do useSearchParams e useRouter
const oldImports = `import { useEffect, useMemo, useState } from "react";`;
const newImports = `import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";`;

content = content.replace(oldImports, newImports);

// 2. Substituir o estado activeCategory e adicionar leitura da URL
const oldState = `export function MenuPageClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selection, setSelection] = useState<SelectedGroupOptions>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCart();`;

const newState = `export function MenuPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selection, setSelection] = useState<SelectedGroupOptions>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const { addItem, openCart } = useCart();

  // Ler categoria da URL ao carregar
  const urlCategory = searchParams.get("categoria");

  useEffect(() => {
    if (urlCategory && categories.length > 0) {
      const exists = categories.some((c) => c.slug === urlCategory);
      if (exists) {
        setActiveCategory(urlCategory);
      }
    }
  }, [urlCategory, categories]);`;

content = content.replace(oldState, newState);

// 3. Atualizar o useEffect de categorias para usar a categoria da URL
const oldCategoriesEffect = `  // Buscar categorias dinamicas da API
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(\`/api/categories?t=\${Date.now()}\`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        console.log("[Cardapio] Categorias:", data);
        if (data.success && data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          setActiveCategory(data.categories[0].slug);
        }
      } catch (err) {
        console.error("[Cardapio] Erro ao carregar categorias:", err);
      }
    }
    loadCategories();
  }, []);`;

const newCategoriesEffect = `  // Buscar categorias dinamicas da API
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(\`/api/categories?t=\${Date.now()}\`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        console.log("[Cardapio] Categorias:", data);
        if (data.success && data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          // Se nao houver categoria na URL, usar a primeira
          const currentUrlCategory = new URLSearchParams(window.location.search).get("categoria");
          if (!currentUrlCategory) {
            setActiveCategory(data.categories[0].slug);
          }
        }
      } catch (err) {
        console.error("[Cardapio] Erro ao carregar categorias:", err);
      }
    }
    loadCategories();
  }, []);`;

content = content.replace(oldCategoriesEffect, newCategoriesEffect);

// 4. Atualizar funcao de clique na categoria para usar URL
const oldCategoryClick = `                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.slug)}`;

const newCategoryClick = `                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.slug);
                      // Atualizar URL sem recarregar
                      const params = new URLSearchParams(window.location.search);
                      params.set("categoria", category.slug);
                      router.replace(\`/cardapio?\${params.toString()}\`, { scroll: false });
                    }}`;

content = content.replace(oldCategoryClick, newCategoryClick);

// 5. Atualizar handleConfirmCustomization para nao recarregar e mostrar toast
const oldConfirm = `  function handleConfirmCustomization() {
    if (!selectedItem) return;
    if (!isSelectionValid(selectedItem.optionGroups, selection)) return;

    addItem({
      item: selectedItem,
      selectedOptions: getSelectedOptions(selectedItem, selection)
    });
    setSelectedItem(null);
    setSelection({});
  }`;

const newConfirm = `  function handleConfirmCustomization() {
    if (!selectedItem) return;
    if (!isSelectionValid(selectedItem.optionGroups, selection)) return;

    addItem({
      item: selectedItem,
      selectedOptions: getSelectedOptions(selectedItem, selection)
    });
    setSelectedItem(null);
    setSelection({});
    setToast("Item adicionado ao carrinho!");
    setTimeout(() => setToast(null), 3000);
  }`;

content = content.replace(oldConfirm, newConfirm);

// 6. Atualizar handleAddClick para itens sem opcoes (tambem mostrar toast)
const oldAddClick = `  function handleAddClick(item: MenuItem) {
    if (item.optionGroups && item.optionGroups.length > 0) {
      setSelectedItem(item);
      setSelection(buildInitialSelection(item));
      return;
    }

    addItem({ item, selectedOptions: [] });
  }`;

const newAddClick = `  function handleAddClick(item: MenuItem) {
    if (item.optionGroups && item.optionGroups.length > 0) {
      setSelectedItem(item);
      setSelection(buildInitialSelection(item));
      return;
    }

    addItem({ item, selectedOptions: [] });
    setToast("Item adicionado ao carrinho!");
    setTimeout(() => setToast(null), 3000);
  }`;

content = content.replace(oldAddClick, newAddClick);

// 7. Adicionar toast notification no JSX (antes do main)
const oldMainStart = `  return (
    <>
      <main className="min-h-screen bg-hero-radial">`;

const newMainStart = `  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-6 py-3 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      <main className="min-h-screen bg-hero-radial">`;

content = content.replace(oldMainStart, newMainStart);

fs.writeFileSync(menuPagePath, content, { encoding: 'utf8' });
console.log('✅ Cardapio atualizado com:');
console.log('  - Persistencia de categoria via URL (query params)');
console.log('  - Toast notification ao adicionar ao carrinho');
console.log('  - Sem recarregamento de pagina');
