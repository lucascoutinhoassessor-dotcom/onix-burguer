"use client";

import Image from "next/image";
import { useState } from "react";
import { getDefaultSelections, useCart } from "@/components/cart-context";
import { featuredItems, type MenuItem, type MenuOptionGroup } from "@/data/menu";

type SelectedGroupOptions = Record<string, string[]>;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function buildInitialSelection(item: MenuItem): SelectedGroupOptions {
  return (item.optionGroups ?? []).reduce<SelectedGroupOptions>((acc, group) => {
    const defaults = getDefaultSelections([group]).map((s) => s.optionId);
    if (defaults.length > 0) acc[group.id] = defaults;
    return acc;
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
    const selected = selection[group.id] ?? [];
    if (group.required && selected.length === 0) return false;
    if (group.type === "single") return selected.length <= 1;
    if (group.maxSelections && selected.length > group.maxSelections) return false;
    return true;
  });
}

export function FeaturedItemsSection() {
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [selection, setSelection] = useState<SelectedGroupOptions>({});
  const { addItem } = useCart();

  function openModal(item: MenuItem) {
    setActiveItem(item);
    setSelection(buildInitialSelection(item));
  }

  function closeModal() {
    setActiveItem(null);
    setSelection({});
  }

  function handleDirectAdd(item: MenuItem) {
    if (item.optionGroups && item.optionGroups.length > 0) {
      openModal(item);
    } else {
      addItem({ item, selectedOptions: [] });
    }
  }

  function handleSelectionChange(group: MenuOptionGroup, optionId: string) {
    setSelection((current) => {
      const currentGroup = current[group.id] ?? [];

      if (group.type === "single") {
        return { ...current, [group.id]: [optionId] };
      }

      const exists = currentGroup.includes(optionId);
      const next = exists ? currentGroup.filter((id) => id !== optionId) : [...currentGroup, optionId];

      if (group.maxSelections && next.length > group.maxSelections) return current;

      return { ...current, [group.id]: next };
    });
  }

  function handleConfirmAdd() {
    if (!activeItem) return;
    if (!isSelectionValid(activeItem.optionGroups, selection)) return;

    addItem({
      item: activeItem,
      selectedOptions: getSelectedOptions(activeItem, selection)
    });
    closeModal();
  }

  const modalOptions = activeItem ? getSelectedOptions(activeItem, selection) : [];
  const modalTotal = (activeItem?.price ?? 0) + modalOptions.reduce((t, o) => t + o.price, 0);
  const canConfirm = activeItem ? isSelectionValid(activeItem.optionGroups, selection) : false;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {featuredItems.map((item) => (
          <article
            key={item.name}
            className="card-premium group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/8 to-white/[0.03] hover:bg-white/[0.08]"
          >
            <div className="overflow-hidden border-b border-white/10 bg-[#0f0f0f]">
              <Image
                src={item.image}
                alt={item.name}
                width={500}
                height={400}
                className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-title text-3xl uppercase leading-none tracking-[0.08em] text-cream">
                  {item.name}
                </h3>
                <span className="rounded-full bg-amberglow px-3 py-1 text-sm font-semibold text-obsidian">
                  {formatCurrency(item.price)}
                </span>
              </div>
              <p className="text-sm leading-7 text-white/65">{item.description}</p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => openModal(item)}
                  className="flex-1 rounded-full border border-white/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-amberglow/40 hover:text-amberglow"
                >
                  Ver detalhes
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectAdd(item)}
                  className="btn-premium flex-1 rounded-full bg-amberglow px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-obsidian hover:bg-[#ffcb7d]"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {activeItem ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 py-6"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-amber"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative overflow-hidden rounded-t-[2rem] bg-[#0f0f0f]">
              <Image
                src={activeItem.image}
                alt={activeItem.name}
                width={640}
                height={400}
                className="h-64 w-full object-cover sm:h-72"
              />
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-amberglow"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="rounded-full bg-amberglow px-4 py-2 text-sm font-semibold text-obsidian">
                  {formatCurrency(activeItem.price)}
                </span>
              </div>
            </div>

            {/* Header */}
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Destaque da casa</p>
              <h2 className="mt-2 font-title text-4xl uppercase tracking-[0.08em] text-cream">{activeItem.name}</h2>
              <p className="mt-3 text-sm leading-7 text-white/60">{activeItem.description}</p>
            </div>

            {/* Options */}
            {(activeItem.optionGroups ?? []).length > 0 ? (
              <div className="space-y-4 px-5 py-5 sm:px-6">
                <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Personalize seu pedido</p>
                {(activeItem.optionGroups ?? []).map((group) => {
                  const selectedIds = selection[group.id] ?? [];
                  return (
                    <section key={group.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-cream">{group.name}</p>
                          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                            {group.type === "single"
                              ? "Escolha 1 opção"
                              : `Escolha até ${group.maxSelections ?? group.options.length}`}
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
                              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
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
                              <div className="text-right">
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
            ) : null}

            {/* Footer */}
            <div className="border-t border-white/10 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/45">Total do item</p>
                  <p className="font-title text-4xl uppercase tracking-[0.08em] text-amberglow">
                    {formatCurrency(modalTotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  disabled={!canConfirm}
                  className="btn-premium rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
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
