"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-context";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

const fulfillmentModes = [
  { id: "entrega", label: "Entrega" },
  { id: "retirada", label: "Retirada no local" },
  { id: "local", label: "Comer no local" }
] as const;

export function CartDrawer() {
  const {
    closeCart,
    deliveryAddress,
    fulfillmentMode,
    isOpen,
    items,
    removeItem,
    setDeliveryAddress,
    setFulfillmentMode,
    subtotal,
    total,
    updateQuantity
  } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeCart}
      />

      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#080808] shadow-amber transition duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Seu pedido</p>
            <h2 className="font-title text-3xl uppercase tracking-[0.08em] text-cream">Carrinho</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-amberglow/40 hover:text-amberglow"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          {items.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="font-title text-3xl uppercase tracking-[0.08em] text-cream">Carrinho vazio</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Adicione itens do cardápio para montar seu pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.key} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-semibold text-cream">{item.name}</p>
                      {item.selectedOptions.length > 0 ? (
                        <ul className="space-y-1 text-xs leading-5 text-white/55">
                          {item.selectedOptions.map((option) => (
                            <li key={`${item.key}-${option.groupId}-${option.optionId}`}>
                              {option.groupName}: {option.optionName}
                              {option.price > 0 ? ` (+${formatCurrency(option.price)})` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-xs uppercase tracking-[0.25em] text-white/45 transition hover:text-[#ff8f8f]"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-black/20">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="px-4 py-2 text-lg text-white/80 transition hover:text-amberglow"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-10 text-center text-sm font-semibold text-cream">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="px-4 py-2 text-lg text-white/80 transition hover:text-amberglow"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/45">Unitário</p>
                      <p className="text-sm text-white/65">{formatCurrency(item.unitPrice)}</p>
                      <p className="mt-1 font-semibold text-amberglow">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Modalidade</p>
            <div className="mt-4 grid gap-2">
              {fulfillmentModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFulfillmentMode(mode.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    fulfillmentMode === mode.id
                      ? "border-amberglow/60 bg-amberglow/10 text-cream"
                      : "border-white/10 bg-black/20 text-white/65 hover:border-amberglow/30 hover:text-cream"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {fulfillmentMode === "entrega" ? (
              <div className="mt-4 space-y-2">
                <label htmlFor="delivery-address" className="text-xs uppercase tracking-[0.25em] text-white/45">
                  Endereço de entrega
                </label>
                <textarea
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  rows={3}
                  placeholder="Rua, número, complemento e referência"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-white/25 focus:border-amberglow/50"
                />
              </div>
            ) : null}
          </section>
        </div>

        <div className="border-t border-white/10 px-5 py-5 sm:px-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-white/65">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-cream">
              <span>Total</span>
              <span className="text-lg text-amberglow">{formatCurrency(total)}</span>
            </div>
          </div>

          <Link
            href={items.length === 0 ? "/cardapio" : "/checkout"}
            onClick={closeCart}
            className={`mt-5 flex w-full items-center justify-center rounded-full px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition ${
              items.length === 0
                ? "border border-white/10 text-white/60 hover:border-amberglow/30 hover:text-amberglow"
                : "bg-amberglow text-obsidian hover:bg-[#ffcb7d]"
            }`}
          >
            {items.length === 0 ? "Explorar cardápio" : "Finalizar pedido"}
          </Link>
        </div>
      </aside>
    </>
  );
}