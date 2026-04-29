"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { DbOrder } from "@/lib/supabase";
import { formatCurrency } from "@/lib/checkout";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { playDoorbell } from "@/lib/audio";
import { SimulacaoProvider, useSimulacao } from "@/contexts/simulacao-context";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
    key: "dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    )
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    exact: false,
    key: "pedidos",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
      </svg>
    )
  },
  {
    href: "/admin/cardapio",
    label: "Cardápio",
    exact: false,
    key: "cardapio",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z" />
      </svg>
    )
  },
  {
    href: "/admin/categorias",
    label: "Categorias",
    exact: false,
    key: "categorias",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l-5.5 9h11z M12 5.84L13.93 9h-3.87z M17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5z M5 21.5h8v-8H5v8z" />
      </svg>
    )
  },
  {
    href: "/admin/promocoes",
    label: "Promoções",
    exact: false,
    key: "promocoes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
      </svg>
    )
  },
  {
    href: "/admin/estoque",
    label: "Estoque",
    exact: false,
    key: "estoque",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.72V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.72c.57-.38 1-.99 1-1.71V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4l16-.02V7z" />
      </svg>
    )
  },
  {
    href: "/admin/financeiro",
    label: "Financeiro",
    exact: false,
    key: "financeiro",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
      </svg>
    )
  },
  {
    href: "/admin/colaboradores",
    label: "Colaboradores",
    exact: false,
    key: "colaboradores",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    )
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    exact: false,
    key: "clientes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    )
  },
  {
    href: "/admin/financeiro/fornecedores",
    label: "Fornecedores",
    exact: false,
    key: "fornecedores",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-1.5 1.5 1.96 2.5H17V9.5h1.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
      </svg>
    )
  },
  {
    href: "/admin/integracoes",
    label: "Integrações",
    exact: false,
    key: "integracoes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      </svg>
    )
  }
];

// ---------------------------------------------------------------------------
// Persistent new-order popup (shown in ALL admin tabs)
// ---------------------------------------------------------------------------
type NewOrderPopupProps = {
  orders: DbOrder[];
  onAccept: (orderId: string) => Promise<void>;
  onCancel: (orderId: string) => Promise<void>;
  onDismiss: () => void;
};

function NewOrderPopup({ orders, onAccept, onCancel, onDismiss }: NewOrderPopupProps) {
  const [acting, setActing] = useState<{ id: string; action: "accept" | "cancel" } | null>(null);

  if (orders.length === 0) return null;

  async function handleAccept(orderId: string) {
    setActing({ id: orderId, action: "accept" });
    await onAccept(orderId);
    setActing(null);
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Cancelar este pedido?")) return;
    setActing({ id: orderId, action: "cancel" });
    await onCancel(orderId);
    setActing(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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
            const isActing = acting?.id === order.order_id;
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
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAccept(order.order_id)}
                    disabled={isActing}
                    className="flex-1 rounded-lg bg-amberglow/25 py-2 text-sm font-semibold text-amberglow transition hover:bg-amberglow/40 disabled:opacity-50"
                  >
                    {isActing && acting?.action === "accept" ? "Aceitando..." : "Aceitar"}
                  </button>
                  <button
                    onClick={() => handleCancel(order.order_id)}
                    disabled={isActing}
                    className="flex-1 rounded-lg bg-red-500/15 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/25 disabled:opacity-50"
                  >
                    {isActing && acting?.action === "cancel" ? "Cancelando..." : "Cancelar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-cream/30">Reaparecer em 30s se não atendido</p>
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

function SidebarNav({ collapsed, onItemClick }: { collapsed: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-amberglow/15 text-amberglow"
                : "text-cream/50 hover:bg-white/5 hover:text-cream/80"
            }`}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SimulacaoProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SimulacaoProvider>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { modoSimulacao, toggleModoSimulacao } = useSimulacao();

  // Detect login page
  const isLoginPage = pathname === "/admin/login";

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // All notification state + actions from the hook (disabled on login page)
  const {
    pendingOrders,
    showPopup,
    setShowPopup,
    handleAccept,
    handleCancel,
    handleDismiss,
  } = useOrderNotifications(!isLoginPage);

  const newOrderCount = pendingOrders.length;

  // Toca a campainha SEMPRE que o popup aparece (exceto na tela de login)
  useEffect(() => {
    if (showPopup && pendingOrders.length > 0 && !isLoginPage) {
      playDoorbell();
    }
  }, [showPopup, pendingOrders.length, isLoginPage]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="fixed inset-0 flex bg-obsidian font-body">
      {/* Global new-order popup — visible on ALL admin pages (exceto login) */}
      {!isLoginPage && showPopup && pendingOrders.length > 0 && (
        <NewOrderPopup
          orders={pendingOrders}
          onAccept={handleAccept}
          onCancel={handleCancel}
          onDismiss={handleDismiss}
        />
      )}

      {/* Login page — render without admin layout */}
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <>
          {/* Mobile overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar - desktop fixed, mobile overlay drawer */}
          <aside
            className={`fixed md:relative z-50 md:z-auto flex flex-col border-r border-white/8 bg-coal transition-transform duration-300 h-full w-56 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            } ${collapsed ? "md:w-16" : "md:w-56"}`}
          >
            {/* Brand */}
            <div className="flex h-14 items-center gap-3 border-b border-white/8 px-4">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-amberglow/20">
                <span className="font-title text-sm text-amberglow">O</span>
              </div>
              {!collapsed && (
                <span className="font-title text-base tracking-widest text-cream/90">ONIX</span>
              )}
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto">
              <SidebarNav collapsed={collapsed} onItemClick={() => setMobileMenuOpen(false)} />
            </div>

            {/* Collapse toggle - apenas desktop */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden md:flex h-12 items-center justify-center border-t border-white/8 text-cream/30 transition hover:text-cream/60"
              title={collapsed ? "Expandir" : "Recolher"}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 fill-current transition-transform ${collapsed ? "rotate-180" : ""}`}
              >
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
              </svg>
            </button>
          </aside>

          {/* Main area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/8 bg-coal/50 px-4 md:px-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Hamburger button - mobile only */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-cream/60 hover:bg-white/5 hover:text-cream"
                  aria-label="Abrir menu"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                  </svg>
                </button>
                <h2 className="text-sm font-semibold text-cream/70">Painel Administrativo</h2>
                {newOrderCount > 0 && (
                  <button
                    onClick={() => setShowPopup(true)}
                    className="flex items-center gap-1.5 rounded-full bg-amberglow/20 px-2 py-0.5 text-xs font-medium text-amberglow hover:bg-amberglow/30"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amberglow opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amberglow" />
                    </span>
                    {newOrderCount} novo{newOrderCount !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleModoSimulacao}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    modoSimulacao
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/5 text-cream/50 hover:bg-white/10"
                  }`}
                  title="Ative para testar funcionalidades com dados simulados"
                >
                  <span className={`h-2 w-2 rounded-full ${modoSimulacao ? "bg-amber-400 animate-pulse" : "bg-cream/30"}`}></span>
                  {modoSimulacao ? "Modo Teste ON" : "Modo Teste OFF"}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-cream/40 transition hover:bg-white/5 hover:text-cream/70"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                  Sair
                </button>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto bg-obsidian">{children}</main>
          </div>
        </>
      )}
    </div>
  );
}
