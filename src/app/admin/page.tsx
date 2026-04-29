"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/checkout";
import type { DbOrder, OrderStatus } from "@/lib/supabase";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================
type KanbanColumn = {
  id: OrderStatus | "pending" | "confirmed";
  title: string;
  color: string;
  nextStatus?: OrderStatus;
  buttonLabel?: string;
};

type Motoboy = {
  id: string;
  name: string;
  phone: string;
};

// ============================================================================
// CONFIGURAÇÃO DAS COLUNAS DO KANBAN
// ============================================================================
const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "pending", title: "Novos", color: "bg-amber-500/20 text-amber-400", nextStatus: "preparing", buttonLabel: "Aceitar" },
  { id: "preparing", title: "Em Preparo", color: "bg-blue-500/20 text-blue-400", nextStatus: "ready", buttonLabel: "Pronto" },
  { id: "ready", title: "Prontos", color: "bg-emerald-500/20 text-emerald-400", nextStatus: "saiu_para_entrega", buttonLabel: "Despachar" },
  { id: "saiu_para_entrega", title: "Em Rota", color: "bg-purple-500/20 text-purple-400", nextStatus: "delivered", buttonLabel: "Entregue" },
  { id: "delivered", title: "Entregues", color: "bg-green-500/20 text-green-400" },
];

// ============================================================================
// COMPONENTE DE CARD DE PEDIDO
// ============================================================================
function OrderCard({ 
  order, 
  column, 
  onMove, 
  onDespachar 
}: { 
  order: DbOrder; 
  column: KanbanColumn;
  onMove: (orderId: string, newStatus: OrderStatus) => void;
  onDespachar?: (order: DbOrder) => void;
}) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
  
  const handleAction = () => {
    if (column.id === "ready" && onDespachar) {
      onDespachar(order);
    } else if (column.nextStatus) {
      onMove(order.id, column.nextStatus);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 hover:bg-white/[0.08] transition-colors">
      {/* Nº do Pedido e Valor */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="font-mono text-sm font-semibold text-cream">{order.order_id}</span>
        <span className="text-sm font-bold text-amberglow">{formatCurrency(Number(order.total))}</span>
      </div>

      {/* Itens */}
      <p className="text-xs text-cream/60 mb-2 line-clamp-2" title={itemsText}>
        {itemsText || "Sem itens"}
      </p>

      {/* Endereço/Bairro */}
      <div className="flex items-center gap-1.5 mb-2 text-xs text-cream/50">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <span className="truncate">{order.customer_address || order.customer_neighborhood || "Endereço não informado"}</span>
      </div>

      {/* Forma de Pagamento */}
      <div className="flex items-center gap-1.5 mb-3 text-xs text-cream/50">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
        <span className="capitalize">{order.payment_method || "Não informado"}</span>
      </div>

      {/* Botão de Ação */}
      {column.buttonLabel && (
        <button
          onClick={handleAction}
          className={`w-full rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition ${
            column.id === "ready"
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
              : "bg-amberglow/20 text-amberglow hover:bg-amberglow/30 border border-amberglow/30"
          }`}
        >
          {column.buttonLabel}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE DE COLUNA DO KANBAN
// ============================================================================
function KanbanColumn({ 
  column, 
  orders, 
  onMove, 
  onDespachar 
}: { 
  column: KanbanColumn; 
  orders: DbOrder[];
  onMove: (orderId: string, newStatus: OrderStatus) => void;
  onDespachar?: (order: DbOrder) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header da Coluna */}
      <div className={`rounded-t-xl border border-white/10 ${column.color.replace('text-', 'border-').replace('/20', '/30')} ${column.color.replace('text-', 'bg-')} p-3`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{column.title}</span>
          <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs">{orders.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 rounded-b-xl border border-t-0 border-white/10 bg-white/[0.02] p-3 space-y-3 overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-350px)]">
        {orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-cream/30">
            Sem pedidos
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              column={column}
              onMove={onMove}
              onDespachar={onDespachar}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [creatingTestOrder, setCreatingTestOrder] = useState(false);

  // Buscar pedidos
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?limit=100");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar pedido teste
  const createTestOrder = async () => {
    setCreatingTestOrder(true);
    try {
      const res = await fetch("/api/admin/test-order", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: `Pedido teste ${data.order?.order_id} criado!`, type: "success" });
        await loadOrders();
      } else {
        setNotification({ message: "Erro ao criar pedido teste.", type: "error" });
      }
    } catch {
      setNotification({ message: "Erro ao criar pedido teste.", type: "error" });
    } finally {
      setCreatingTestOrder(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Buscar motoboys cadastrados
  const loadMotoboys = useCallback(async () => {
    try {
      const res = await fetch("/api/colaboradores?role=motoboy");
      const data = await res.json();
      setMotoboys(data.colaboradores || []);
    } catch (err) {
      console.error("Erro ao carregar motoboys:", err);
    }
  }, []);

  // Sincronização entre abas
  useEffect(() => {
    loadOrders();
    loadMotoboys();
    
    // Polling a cada 10 segundos
    const interval = setInterval(loadOrders, 10000);
    
    // BroadcastChannel para sincronização entre abas
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("onix-orders-sync");
      bc.onmessage = (event) => {
        if (event.data.type === "ORDER_UPDATED") {
          console.log("[Dashboard] Recebido update de outra aba, recarregando...");
          loadOrders();
        }
      };
    }
    
    return () => {
      clearInterval(interval);
      bc?.close();
    };
  }, [loadOrders, loadMotoboys]);

  // Mover pedido para próxima coluna
  const handleMoveOrder = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        
        // Notificar outras abas
        if (typeof BroadcastChannel !== "undefined") {
          const bc = new BroadcastChannel("onix-orders-sync");
          bc.postMessage({ type: "ORDER_UPDATED" });
          bc.close();
        }
      }
    } catch (err) {
      console.error("Erro ao mover pedido:", err);
    }
  };

  // Enviar dados para motoboy
  const enviarDadosParaMotoboy = async (order: DbOrder) => {
    if (motoboys.length === 0) {
      setNotification({ message: "Nenhum motoboy cadastrado no sistema!", type: "error" });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    // Selecionar primeiro motoboy disponível
    const motoboy = motoboys[0];

    // Montar mensagem formatada
    const items = Array.isArray(order.items) 
      ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join("%0A")
      : "Itens não disponíveis";

    const message = `*NOVO PEDIDO - ONIX BURGUER*%0A%0A` +
      `*Pedido:* ${order.order_id}%0A` +
      `*Cliente:* ${order.customer_name}%0A` +
      `*Endereço:* ${order.customer_address || order.customer_neighborhood || "Não informado"}%0A` +
      `*Forma de Pagamento:* ${order.payment_method || "Não informado"}%0A` +
      `*Valor:* ${formatCurrency(Number(order.total))}%0A%0A` +
      `*Itens:*%0A${items}`;

    // Simular/enviar via WhatsApp
    const whatsappUrl = `https://wa.me/${motoboy.phone.replace(/\D/g, "")}?text=${message}`;
    
    // Abrir WhatsApp em nova aba
    window.open(whatsappUrl, "_blank");

    // Mostrar notificação
    setNotification({ 
      message: `Dados enviados para o motoboy ${motoboy.name}`, 
      type: "success" 
    });
    setTimeout(() => setNotification(null), 5000);

    // Mover para "Em Rota"
    await handleMoveOrder(order.id, "saiu_para_entrega");
  };

  // Agrupar pedidos por status
  const ordersByColumn = KANBAN_COLUMNS.map((col) => ({
    ...col,
    orders: orders.filter((o) => {
      if (col.id === "pending") return o.status === "pending" || o.status === "confirmed";
      return o.status === col.id;
    }),
  }));

  // Estatísticas
  const stats = {
    total: orders.length,
    novos: orders.filter((o) => o.status === "pending").length,
    preparo: orders.filter((o) => o.status === "preparing").length,
    prontos: orders.filter((o) => o.status === "ready").length,
    entregues: orders.filter((o) => o.status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-cream/30">
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[10000] rounded-xl border px-4 py-3 shadow-lg ${
          notification.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
            : "border-red-500/30 bg-red-500/20 text-red-400"
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-title text-2xl tracking-wide text-cream">Dashboard</h1>
          <p className="text-sm text-cream/40">{stats.total} pedidos no sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={createTestOrder}
            disabled={creatingTestOrder}
            className="rounded-lg border border-dashed border-amberglow/40 bg-amberglow/5 px-4 py-2 text-xs font-medium text-amberglow/80 transition hover:border-amberglow/70 hover:bg-amberglow/10 disabled:opacity-50"
          >
            {creatingTestOrder ? "Criando..." : "+ Pedido Teste"}
          </button>
          <button
            onClick={loadOrders}
            className="rounded-lg bg-amberglow/20 px-4 py-2 text-sm font-medium text-amberglow transition hover:bg-amberglow/30"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
          <p className="text-xs text-amber-400/70">Novos</p>
          <p className="text-2xl font-bold text-amber-400">{stats.novos}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
          <p className="text-xs text-blue-400/70">Em Preparo</p>
          <p className="text-2xl font-bold text-blue-400">{stats.preparo}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
          <p className="text-xs text-emerald-400/70">Prontos</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.prontos}</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-center">
          <p className="text-xs text-green-400/70">Entregues</p>
          <p className="text-2xl font-bold text-green-400">{stats.entregues}</p>
        </div>
      </div>

      {/* Kanban - Layout responsivo */}
      <div className="flex flex-col gap-4 lg:flex-row lg:overflow-x-auto lg:pb-4">
        {ordersByColumn.map((column) => (
          <div key={column.id} className="w-full lg:min-w-[280px] lg:w-[280px] lg:flex-shrink-0">
            <KanbanColumn
              column={column}
              orders={column.orders}
              onMove={handleMoveOrder}
              onDespachar={column.id === "ready" ? enviarDadosParaMotoboy : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
