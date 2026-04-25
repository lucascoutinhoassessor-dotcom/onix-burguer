"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Customer = { id: string; phone: string; name: string; email: string | null };

type Order = {
  order_id: string;
  total: number;
  status: string;
  items: unknown;
  created_at: string;
  fulfillment_mode: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado"
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  preparing: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  ready: "text-green-400 bg-green-400/10 border-green-400/30",
  delivered: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/30"
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MinhaContaPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/customer/auth");
        const data = (await res.json()) as { customer?: Customer; orders?: Order[] };
        if (!data.customer) {
          router.replace("/login");
          return;
        }
        setCustomer(data.customer);
        setOrders(data.orders ?? []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/customer/auth", { method: "DELETE" });
    router.push("/login");
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-hero-radial">
          <p className="text-cream/40">Carregando...</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!customer) return null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-80px)] bg-hero-radial">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Profile header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">Minha conta</p>
              <h1 className="mt-2 font-title text-4xl uppercase tracking-[0.1em] text-cream">
                Olá, {customer.name.split(" ")[0]}
              </h1>
              <p className="mt-1 text-sm text-white/50">{customer.phone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-cream/40 transition hover:bg-white/5 hover:text-cream"
            >
              Sair
            </button>
          </div>

          {/* Quick stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Total de pedidos</p>
              <p className="mt-1 text-2xl font-semibold text-cream">{orders.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Total gasto</p>
              <p className="mt-1 text-2xl font-semibold text-amberglow">
                {formatCurrency(orders.reduce((s, o) => s + Number(o.total), 0))}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs text-white/40">Pedidos entregues</p>
              <p className="mt-1 text-2xl font-semibold text-green-400">
                {orders.filter((o) => o.status === "delivered").length}
              </p>
            </div>
          </div>

          {/* Orders list */}
          <div>
            <h2 className="mb-4 font-title text-2xl tracking-wide text-cream">Histórico de pedidos</h2>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 py-16 text-center">
                <p className="text-sm text-white/40">Você ainda não fez nenhum pedido</p>
                <Link
                  href="/cardapio"
                  className="mt-4 rounded-full bg-amberglow/15 px-5 py-2 text-sm font-medium text-amberglow hover:bg-amberglow/25"
                >
                  Ver cardápio
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const parsedItems = Array.isArray(order.items)
                    ? (order.items as { name: string; quantity: number }[])
                    : [];

                  return (
                    <div
                      key={order.order_id}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-cream">Pedido #{order.order_id}</p>
                          <p className="mt-0.5 text-xs text-white/40">
                            {new Date(order.created_at).toLocaleString("pt-BR")}
                            {" · "}
                            {order.fulfillment_mode === "entrega"
                              ? "Entrega"
                              : order.fulfillment_mode === "retirada"
                              ? "Retirada"
                              : "Comer no local"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[order.status] ?? "text-cream/50 bg-white/5 border-white/10"
                            }`}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          <span className="font-semibold text-amberglow">{formatCurrency(Number(order.total))}</span>
                        </div>
                      </div>

                      {parsedItems.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-white/8 pt-3">
                          {parsedItems.slice(0, 5).map((item, idx) => (
                            <li key={idx} className="text-xs text-white/50">
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                          {parsedItems.length > 5 && (
                            <li className="text-xs text-white/30">+{parsedItems.length - 5} item(s)</li>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
