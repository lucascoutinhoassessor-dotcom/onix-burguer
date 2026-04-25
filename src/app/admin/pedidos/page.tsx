"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/checkout";
import type { DbOrder, OrderStatus } from "@/lib/supabase";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

const STATUS_OPTIONS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Aguardando" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "Em preparo" },
  { value: "ready", label: "Pronto" },
  { value: "saiu_para_entrega", label: "Saiu para entrega" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" }
];

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "saiu_para_entrega", "delivered"];

function buildWhatsAppCustomerMessage(order: DbOrder, newStatus: OrderStatus): string {
  const statusMessages: Record<OrderStatus, string> = {
    pending: "recebemos seu pedido e estamos aguardando confirmação.",
    confirmed: "seu pedido foi confirmado e logo entrará em preparo.",
    preparing: "seu pedido está sendo preparado com muito carinho.",
    ready: "seu pedido está pronto! Passaremos para entrega em breve.",
    saiu_para_entrega: "seu pedido saiu para entrega! Nosso entregador está a caminho.",
    delivered: "seu pedido foi entregue. Obrigado pela preferência!",
    cancelled: "infelizmente seu pedido foi cancelado. Entre em contato conosco."
  };

  const message = [
    `🍔 *ONIX BURGUER - Atualização do Pedido*`,
    ``,
    `Olá, ${order.customer_name.split(" ")[0]}!`,
    ``,
    `Pedido #${order.order_id}`,
    `Status: *${ORDER_STATUS_LABELS[newStatus]}*`,
    ``,
    statusMessages[newStatus],
    ``,
    `Valor total: ${formatCurrency(Number(order.total))}`,
    ``,
    `Qualquer dúvida, fale conosco. 😊`
  ].join("\n");

  const phone = order.customer_phone.replace(/\D/g, "");
  const withCountry = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function OrderCard({
  order,
  onStatusChange
}: {
  order: DbOrder;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
  const nextStatus = canAdvance ? STATUS_FLOW[currentIdx + 1] : null;

  const items = Array.isArray(order.items) ? order.items : [];

  async function advance() {
    if (!nextStatus) return;
    setUpdating(true);
    await onStatusChange(order.order_id, nextStatus);
    setUpdating(false);

    // Auto-open WhatsApp to notify customer
    const waUrl = buildWhatsAppCustomerMessage(order, nextStatus);
    window.open(waUrl, "_blank");
  }

  async function cancel() {
    setUpdating(true);
    await onStatusChange(order.order_id, "cancelled");
    setUpdating(false);
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] transition hover:bg-white/[0.04]">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-cream/50">{order.order_id}</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${ORDER_STATUS_COLORS[order.status as OrderStatus] ?? "text-cream/40"}`}
            >
              {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
            </span>
          </div>
          <p className="mt-1 font-medium text-cream">{order.customer_name}</p>
          <p className="text-xs text-cream/40">{order.customer_phone}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-amberglow">{formatCurrency(Number(order.total))}</p>
          <p className="text-xs text-cream/40">
            {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="mt-0.5 text-xs capitalize text-cream/30">{order.fulfillment_mode}</p>
        </div>
      </button>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          {/* Items */}
          <p className="mb-2 text-xs font-medium tracking-wider text-cream/40">ITENS</p>
          <ul className="mb-4 space-y-1">
            {items.map((item: { name?: string; quantity?: number; unitPrice?: number }, idx: number) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-cream/80">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-cream/50">
                  {item.unitPrice !== undefined ? formatCurrency(item.quantity! * item.unitPrice) : ""}
                </span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {nextStatus && order.status !== "cancelled" && (
              <button
                onClick={advance}
                disabled={updating}
                className="rounded-lg bg-amberglow/20 px-3 py-1.5 text-xs font-medium text-amberglow transition hover:bg-amberglow/30 disabled:opacity-50"
              >
                {updating ? "..." : `Avançar → ${ORDER_STATUS_LABELS[nextStatus]}`}
              </button>
            )}
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button
                onClick={cancel}
                disabled={updating}
                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <a
              href={`https://wa.me/${order.customer_phone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/20"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [newAlert, setNewAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef<number>(0);

  const fetchOrders = useCallback(async () => {
    try {
      const url =
        statusFilter === "all" ? "/api/orders?limit=100" : `/api/orders?status=${statusFilter}&limit=100`;
      const res = await fetch(url);
      const data = (await res.json()) as { orders?: DbOrder[] };
      const fetched = data.orders ?? [];

      if (prevCountRef.current > 0 && fetched.length > prevCountRef.current) {
        setNewAlert(true);
        // Play sound
        try {
          if (!audioRef.current) {
            const audio = new Audio(
              "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA" +
                "ABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDb" +
                "tWlBKyt8t+jwx3w8IiNgt+7/1H1FIiVvye7/1X9GISZxzPH/1X9GISdz" +
                "zvL/1X9GIilz0PP/1X9GIit00vT/1X9GIi130/X/1X9GIit30/X/1X9G" +
                "Iit41PX/1X9GIit41fb/1X9GIit41fb/1X9GIit41fb/1X9GIi141fb/" +
                "1X9GIit51vf/1X9G"
            );
            audioRef.current = audio;
          }
          audioRef.current.play().catch(() => {});
        } catch {
          // audio not available
        }
        setTimeout(() => setNewAlert(false), 5000);
      }

      prevCountRef.current = fetched.length;
      setOrders(fetched);
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status })
      });
      await fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Pedidos</h1>
          <p className="mt-0.5 text-sm text-cream/40">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            {statusFilter !== "all" ? ` — ${ORDER_STATUS_LABELS[statusFilter]}` : ""}
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-cream/50 transition hover:border-amberglow/30 hover:text-amberglow"
        >
          Atualizar
        </button>
      </div>

      {/* New order alert */}
      {newAlert && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amberglow/30 bg-amberglow/10 p-3 text-sm text-amberglow">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amberglow opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amberglow" />
          </span>
          Novo pedido recebido!
        </div>
      )}

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              statusFilter === opt.value
                ? "border-amberglow/50 bg-amberglow/15 text-amberglow"
                : "border-white/8 text-cream/40 hover:border-white/20 hover:text-cream/60"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-cream/30">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-white/8 text-sm text-cream/30">
          Nenhum pedido encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
