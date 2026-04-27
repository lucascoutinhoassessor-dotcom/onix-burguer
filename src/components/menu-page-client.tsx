"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDefaultSelections, useCart } from "@/components/cart-context";
import { type MenuCategory, type MenuItem, type MenuOptionGroup } from "@/data/menu";

const categoryLabels: Record<MenuCategory, string> = {
  hamburgueres: "Hambúrgueres",
  acompanhamentos: "Acompanhamentos",
  bebidas: "Bebidas",
  sobremesas: "Sobremesas"
};

const categoryDescriptions: Record<MenuCategory, string> = {
  hamburgueres: "Blends autorais, smashs e receitas premium com finalização impecável.",
  acompanhamentos: "Entradas e extras para completar a experiência da mesa.",
  bebidas: "Clássicos gelados, sucos e milkshakes para harmonizar com o pedido.",
  sobremesas: "Fechamentos indulgentes com assinatura da casa."
};

type SelectedGroupOptions = Record<string, string[]>;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function buildInitialSelection(item: MenuItem): SelectedGroupOptions {
  return (item.optionGroups ?? []).reduce<SelectedGroupOptions>((accumulator, group) => {
    const defaultSelections = getDefaultSelections([group]).map((selection) => selection.optionId);

    if (defaultSelections.length > 0) {
      accumulator[group.id] = defaultSelections;
    }

    return accumulator;
  }, {});
}

function getSelectedOptions(item: MenuItem, selection: SelectedGroupOptions) {
  return (item.optionGroups ?? []).flatMap((group) => {
    const selectedIds = selection[group.id] ?? [];

    return group.options
      .filter((option) => selectedIds.includes(option.id))
      .map((option) => ({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        price: option.price ?? 0
      }));
  });
}

function isSelectionValid(optionGroups: MenuOptionGroup[] | undefined, selection: SelectedGroupOptions) {
  return (optionGroups ?? []).every((group) => {
    const selectedItems = selection[group.id] ?? [];

    if (group.required && selectedItems.length === 0) {
      return false;
    }

    if (group.type === "single") {
      return selectedItems.length <= 1;
    }

    if (group.maxSelections && selectedItems.length > group.maxSelections) {
      return false;
    }

    return true;
  });
}

export function MenuPageClient() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("hamburgueres");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selection, setSelection] = useState<SelectedGroupOptions>({});
  const { addItem, openCart } = useCart();

  const itemsByCategory = useMemo(
    () =>
      menuItems.reduce<Record<MenuCategory, MenuItem[]>>(
        (accumulator, item) => {
          accumulator[item.category].push(item);
          return accumulator;
        },
        {
          hamburgueres: [],
          acompanhamentos: [],
          bebidas: [],
          sobremesas: []
        }
      ),
    []
  );

  const activeItems = itemsByCategory[activeCategory];

  function handleAddClick(item: MenuItem) {
    if (item.optionGroups && item.optionGroups.length > 0) {
      setSelectedItem(item);
      setSelection(buildInitialSelection(item));
      return;
    }

    addItem({ item, selectedOptions: [] });
  }

  function handleSelectionChange(group: MenuOptionGroup, optionId: string) {
    setSelection((currentSelection) => {
      const currentGroupSelection = currentSelection[group.id] ?? [];

      if (group.type === "single") {
        return {
          ...currentSelection,
          [group.id]: [optionId]
        };
      }

      const exists = currentGroupSelection.includes(optionId);
      const nextSelection = exists
        ? currentGroupSelection.filter((id) => id !== optionId)
        : [...currentGroupSelection, optionId];

      if (group.maxSelections && nextSelection.length > group.maxSelections) {
        return currentSelection;
      }

      return {
        ...currentSelection,
        [group.id]: nextSelection
      };
    });
  }

  function handleConfirmCustomization() {
    if (!selectedItem) {
      return;
    }

    if (!isSelectionValid(selectedItem.optionGroups, selection)) {
      return;
    }

    addItem({
      item: selectedItem,
      selectedOptions: getSelectedOptions(selectedItem, selection)
    });
    setSelectedItem(null);
    setSelection({});
  }

  const modalSelectedOptions = selectedItem ? getSelectedOptions(selectedItem, selection) : [];
  const modalTotal =
    (selectedItem?.price ?? 0) + modalSelectedOptions.reduce((total, option) => total + option.price, 0);

  return (
    <>
      <main className="min-h-screen bg-hero-radial">
        <section className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-10 pt-10 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-16">
            <div className="max-w-3xl space-y-4 sm:space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">Cardápio interativo</p>
              <h1 className="font-title text-4xl uppercase leading-none tracking-[0.08em] text-cream sm:text-5xl sm:tracking-[0.1em] lg:text-7xl">
                Monte seu pedido do seu jeito.
              </h1>
              <p className="text-sm leading-7 text-white/65 sm:text-base sm:leading-8 lg:text-lg">
                Navegue por categorias, personalize seus itens e finalize no carrinho com entrega, retirada ou consumo no local.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {(Object.keys(categoryLabels) as MenuCategory[]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition sm:px-5 sm:py-3 sm:text-sm ${
                      activeCategory === category
                        ? "border-amberglow/60 bg-amberglow text-obsidian"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:border-amberglow/35 hover:text-cream"
                    }`}
                  >
                    {categoryLabels[category]}
                  </button>
                ))}
              </div>

              <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65 lg:block">
                {categoryDescriptions[activeCategory]}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {activeItems.map((item) => (
              <article
                key={item.id}
                className="card-premium group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/8 to-white/[0.03] hover:bg-white/[0.08]"
              >
                <div className="relative overflow-hidden border-b border-white/10 bg-[#0f0f0f]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={640}
                    height={480}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-amberglow/25 bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.28em] text-amberglow">
                    {categoryLabels[item.category]}
                  </span>
                </div>

                <div className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="font-title text-3xl uppercase leading-none tracking-[0.08em] text-cream">
                        {item.name}
                      </h2>
                      <p className="text-sm leading-7 text-white/65">{item.description}</p>
                    </div>
                    <span className="rounded-full bg-amberglow px-3 py-1 text-sm font-semibold text-obsidian">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(item.optionGroups ?? []).map((group) => (
                      <span
                        key={group.id}
                        className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/55"
                      >
                        {group.name}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddClick(item)}
                    className="btn-premium flex w-full items-center justify-center rounded-full bg-amberglow px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-obsidian hover:bg-[#ffcb7d]"
                  >
                    {(item.optionGroups?.length ?? 0) > 0 ? "Personalizar e adicionar" : "Adicionar ao carrinho"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Pronto para fechar?</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Seu carrinho fica salvo no dispositivo e pode ser concluído quando quiser.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openCart}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/75 transition hover:border-amberglow/35 hover:text-amberglow"
              >
                Ver carrinho
              </button>
              <Link
                href="/"
                className="rounded-full border border-amberglow/35 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-amberglow transition hover:bg-amberglow/10"
              >
                Voltar para home
              </Link>
            </div>
          </div>
        </section>
      </main>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 sm:items-center sm:px-4 sm:py-6"
          onClick={() => { setSelectedItem(null); setSelection({}); }}
        >
          <div
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0a0a0a] shadow-amber sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product Image */}
            <div className="relative overflow-hidden rounded-t-[2rem] bg-[#0f0f0f]">
              <Image
                src={selectedItem.image}
                alt={selectedItem.name}
                width={640}
                height={400}
                className="h-52 w-full object-cover sm:h-64 lg:h-72"
              />
              <button
                type="button"
                onClick={() => { setSelectedItem(null); setSelection({}); }}
                aria-label="Fechar"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-amberglow"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="rounded-full bg-amberglow px-4 py-2 text-sm font-semibold text-obsidian">
                  {formatCurrency(selectedItem.price)}
                </span>
              </div>
            </div>

            {/* Header */}
            <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
              <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Personalizar item</p>
              <h2 className="mt-2 font-title text-3xl uppercase tracking-[0.06em] text-cream sm:text-4xl sm:tracking-[0.08em]">{selectedItem.name}</h2>
              <p className="mt-2 text-sm leading-7 text-white/60 sm:mt-3">{selectedItem.description}</p>
            </div>

            <div className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
              {(selectedItem.optionGroups ?? []).map((group) => {
                const selectedIds = selection[group.id] ?? [];

                return (
                  <section key={group.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-cream">{group.name}</p>
                        <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                          {group.type === "single" ? "Escolha 1 opção" : `Escolha até ${group.maxSelections ?? group.options.length}`}
                        </p>
                      </div>
                      {group.required ? (
                        <span className="rounded-full border border-amberglow/25 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-amberglow">
                          Obrigatório
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3">
                      {group.options.map((option) => {
                        const isSelected = selectedIds.includes(option.id);

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectionChange(group, option.id)}
                            className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                              isSelected
                                ? "border-amberglow/60 bg-amberglow/10"
                                : "border-white/10 bg-black/20 hover:border-amberglow/30"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-cream">{option.name}</p>
                              <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                                {group.type === "single" ? "Seleção única" : "Adicional"}
                              </p>
                            </div>
                            <div className="ml-3 flex-shrink-0 text-right">
                              <p className="text-sm text-amberglow">
                                {option.price ? `+${formatCurrency(option.price)}` : "Incluso"}
                              </p>
                              <span className="text-xs uppercase tracking-[0.22em] text-white/35">
                                {isSelected ? "Selecionado" : "Selecionar"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="border-t border-white/10 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/45">Total do item</p>
                  <p className="font-title text-3xl uppercase tracking-[0.06em] text-amberglow sm:text-4xl sm:tracking-[0.08em]">
                    {formatCurrency(modalTotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmCustomization}
                  disabled={!isSelectionValid(selectedItem.optionGroups, selection)}
                  className="w-full rounded-full bg-amberglow px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 sm:w-auto sm:py-4"
                >
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}