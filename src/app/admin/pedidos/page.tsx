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

// ---------------------------------------------------------------------------
// Bell sound via Web Audio API (no external file needed)
// ---------------------------------------------------------------------------
function playBellSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const beep = (freq: number, start: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gainNode.gain.setValueAtTime(gain, ctx.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };

    // Three ascending bell tones
    beep(880, 0, 0.4, 0.4);
    beep(1100, 0.15, 0.4, 0.3);
    beep(1320, 0.3, 0.6, 0.35);
  } catch {
    // audio not available
  }
}

// ---------------------------------------------------------------------------
// WhatsApp message builder
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Persistent new-order popup modal
// ---------------------------------------------------------------------------
type NewOrderPopupProps = {
  orders: DbOrder[];
  onAccept: (orderId: string) => Promise<void>;
  onDismiss: () => void;
};

function NewOrderPopup({ orders, onAccept, onDismiss }: NewOrderPopupProps) {
  const [accepting, setAccepting] = useState<string | null>(null);

  if (orders.length === 0) return null;

  async function handleAccept(orderId: string) {
    setAccepting(orderId);
    await onAccept(orderId);
    setAccepting(null);
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-amberglow/40 bg-coal shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amberglow opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amberglow" />
          </span>
          <h2 className="font-title text-lg text-cream">
            {orders.length === 1 ? "Novo pedido recebido!" : `${orders.length} pedidos aguardando!`}
          </h2>
        </div>

        {/* Orders list */}
        <div className="max-h-72 overflow-y-auto px-5 py-3 space-y-3">
          {orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            return (
              <div key={order.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-cream">{order.customer_name}</p>
                    <p className="font-mono text-xs text-cream/40">{order.order_id}</p>
                    <p className="mt-1 text-xs text-cream/50">
                      {items.slice(0, 3).map((it: { name?: string; quantity?: number }, i: number) => (
                        <span key={i}>{i > 0 ? ", " : ""}{it.quantity}x {it.name}</span>
                      ))}
                      {items.length > 3 && ` +${items.length - 3} itens`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-amberglow">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-cream/40">
                      {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAccept(order.order_id)}
                  disabled={accepting === order.order_id}
                  className="mt-3 w-full rounded-lg bg-amberglow/25 py-2 text-sm font-semibold text-amberglow transition hover:bg-amberglow/40 disabled:opacity-50"
                >
                  {accepting === order.order_id ? "Aceitando..." : "Aceitar pedido"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-cream/30">Popup reaparecer em 30s se não aceitar</p>
          <button
            onClick={onDismiss}
            className="rounded-lg px-3 py-1.5 text-xs text-cream/40 hover:bg-white/5 hover:text-cream/60"
          >
            Ver depois
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OrderCard
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);

  // New order notification state
  const [pendingOrders, setPendingOrders] = useState<DbOrder[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundedOrderIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const url =
        statusFilter === "all" ? "/api/orders?limit=100" : `/api/orders?status=${statusFilter}&limit=100`;
      const res = await fetch(url);
      const data = (await res.json()) as { orders?: DbOrder[] };
      const fetched = data.orders ?? [];
      setOrders(fetched);
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Separately poll ALL pending orders (regardless of filter) for notifications
  const checkPendingOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=pending&limit=50");
      const data = (await res.json()) as { orders?: DbOrder[] };
      const pending = data.orders ?? [];

      // Find brand-new orders not yet seen
      const newOrders = pending.filter((o) => !seenOrderIdsRef.current.has(o.id));

      if (newOrders.length > 0) {
        // Play sound once for each new order
        let didPlaySound = false;
        for (const o of newOrders) {
          if (!soundedOrderIdsRef.current.has(o.id)) {
            soundedOrderIdsRef.current.add(o.id);
            if (!didPlaySound) {
              playBellSound();
              didPlaySound = true;
            }
          }
          seenOrderIdsRef.current.add(o.id);
        }
      }

      setPendingOrders(pending);

      // Show popup if there are pending orders
      if (pending.length > 0) {
        setShowPopup(true);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Poll pending orders every 30 seconds for popup
  useEffect(() => {
    checkPendingOrders();
    const interval = setInterval(checkPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [checkPendingOrders]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
        checkPendingOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, checkPendingOrders]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status })
      });
      await fetchOrders();
      await checkPendingOrders();
    } catch (err) {
      console.error("Status update error:", err);
    }
  }

  // Accept order from popup → change to "preparing"
  async function handleAcceptFromPopup(orderId: string) {
    await handleStatusChange(orderId, "preparing");
    // Update local pending list
    setPendingOrders((prev) => prev.filter((o) => o.order_id !== orderId));
  }

  function handleDismissPopup() {
    setShowPopup(false);
    // Re-show after 30 seconds if still pending
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => {
      checkPendingOrders();
    }, 30000);
  }

  // When pending orders are cleared, hide popup
  useEffect(() => {
    if (pendingOrders.length === 0) {
      setShowPopup(false);
    }
  }, [pendingOrders]);

  return (
    <div className="p-6">
      {/* Persistent popup modal for new pending orders */}
      {showPopup && pendingOrders.length > 0 && (
        <NewOrderPopup
          orders={pendingOrders}
          onAccept={handleAcceptFromPopup}
          onDismiss={handleDismissPopup}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Pedidos</h1>
          <p className="mt-0.5 text-sm text-cream/40">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            {statusFilter !== "all" ? ` — ${ORDER_STATUS_LABELS[statusFilter]}` : ""}
            {pendingOrders.length > 0 && (
              <span className="ml-2 rounded-full bg-amberglow/20 px-2 py-0.5 text-xs font-medium text-amberglow">
                {pendingOrders.length} aguardando
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingOrders.length > 0 && (
            <button
              onClick={() => setShowPopup(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amberglow/30 bg-amberglow/10 px-3 py-1.5 text-xs font-medium text-amberglow hover:bg-amberglow/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amberglow opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amberglow" />
              </span>
              {pendingOrders.length} novo{pendingOrders.length !== 1 ? "s" : ""}
            </button>
          )}
          <button
            onClick={() => fetchOrders()}
            className="rounded-lg border border-white/8 px-3 py-1.5 text-xs text-cream/50 transition hover:border-amberglow/30 hover:text-amberglow"
          >
            Atualizar
          </button>
        </div>
      </div>

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
