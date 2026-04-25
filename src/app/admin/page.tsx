"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/checkout";
import type { DbOrder, OrderStatus } from "@/lib/supabase";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/supabase";

type DashboardStats = {
  todayOrders: number;
  todayRevenue: number;
  preparing: number;
  ready: number;
};

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-cream/40">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="font-title text-3xl text-cream">{value}</p>
      {sub && <p className="mt-1 text-xs text-cream/40">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ todayOrders: 0, todayRevenue: 0, preparing: 0, ready: 0 });
  const [recentOrders, setRecentOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTestOrder, setCreatingTestOrder] = useState(false);
  const [testOrderMsg, setTestOrderMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function loadData() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [todayRes, preparingRes, readyRes, recentRes] = await Promise.all([
        fetch(`/api/orders?date=${today}&limit=200`),
        fetch("/api/orders?status=preparing&limit=1"),
        fetch("/api/orders?status=ready&limit=1"),
        fetch("/api/orders?limit=6")
      ]);

      const todayData = (await todayRes.json()) as { orders?: DbOrder[]; total?: number };
      const preparingData = (await preparingRes.json()) as { total?: number };
      const readyData = (await readyRes.json()) as { total?: number };
      const recentData = (await recentRes.json()) as { orders?: DbOrder[] };

      const todayOrders = todayData.orders ?? [];
      const revenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        todayOrders: todayData.total ?? 0,
        todayRevenue: revenue,
        preparing: preparingData.total ?? 0,
        ready: readyData.total ?? 0
      });

      setRecentOrders(recentData.orders ?? []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createTestOrder() {
    setCreatingTestOrder(true);
    setTestOrderMsg(null);
    try {
      const res = await fetch("/api/admin/test-order", { method: "POST" });
      const data = (await res.json()) as { success: boolean; order?: { order_id: string } };
      if (data.success) {
        setTestOrderMsg({ text: `Pedido teste ${data.order?.order_id} criado! Veja em Pedidos.`, ok: true });
        await loadData();
      } else {
        setTestOrderMsg({ text: "Erro ao criar pedido teste.", ok: false });
      }
    } catch {
      setTestOrderMsg({ text: "Erro ao criar pedido teste.", ok: false });
    } finally {
      setCreatingTestOrder(false);
      setTimeout(() => setTestOrderMsg(null), 6000);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Dashboard</h1>
          <p className="mt-0.5 text-sm capitalize text-cream/40">{today}</p>
        </div>

        {/* Test order button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={createTestOrder}
            disabled={creatingTestOrder}
            className="flex items-center gap-2 rounded-lg border border-dashed border-amberglow/40 bg-amberglow/5 px-3 py-2 text-xs font-medium text-amberglow/80 transition hover:border-amberglow/70 hover:bg-amberglow/10 hover:text-amberglow disabled:opacity-50"
            title="Cria um pedido de teste com status 'Aguardando' para testar as notificações"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
            {creatingTestOrder ? "Criando..." : "Criar pedido teste"}
          </button>
          <p className="text-[10px] text-cream/25">Sem pagamento real • testa notificações</p>
        </div>
      </div>

      {testOrderMsg && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          testOrderMsg.ok
            ? "border-green-500/20 bg-green-500/10 text-green-400"
            : "border-red-500/20 bg-red-500/10 text-red-400"
        }`}>
          {testOrderMsg.text}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="PEDIDOS HOJE"
              value={String(stats.todayOrders)}
              color="bg-amberglow/15 text-amberglow"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
              }
            />
            <StatCard
              label="FATURAMENTO HOJE"
              value={formatCurrency(stats.todayRevenue)}
              color="bg-green-500/15 text-green-400"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
              }
            />
            <StatCard
              label="EM PREPARO"
              value={String(stats.preparing)}
              color="bg-orange-500/15 text-orange-400"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z" />
                </svg>
              }
            />
            <StatCard
              label="PRONTOS"
              value={String(stats.ready)}
              color="bg-green-500/15 text-green-400"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              }
            />
          </div>

          {/* Recent orders */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-cream/70">Pedidos Recentes</h2>
              <Link href="/admin/pedidos" className="text-xs text-amberglow/70 hover:text-amberglow">
                Ver todos
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-8 text-center text-sm text-cream/30">
                Nenhum pedido ainda
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/[0.02]">
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">PEDIDO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">CLIENTE</th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">TOTAL</th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">STATUS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-cream/40">HORÁRIO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-xs text-cream/70">{order.order_id}</td>
                        <td className="px-4 py-3 text-cream/80">{order.customer_name}</td>
                        <td className="px-4 py-3 text-amberglow">{formatCurrency(Number(order.total))}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${ORDER_STATUS_COLORS[order.status as OrderStatus] ?? "text-cream/40"}`}>
                            {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-cream/40">
                          {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
