"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    exact: true,
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
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z" />
      </svg>
    )
  },
  {
    href: "/admin/promocoes",
    label: "Promoções",
    exact: false,
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
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    )
  },
  {
    href: "/admin/integracoes",
    label: "Integrações",
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      </svg>
    )
  }
];

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }, [router]);

  // Poll for new orders every 30 seconds for notification badge
  useEffect(() => {
    async function checkNewOrders() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`/api/orders?status=pending&date=${today}&limit=1`);
        const data = (await res.json()) as { total?: number };
        if (data.total !== undefined) setNewOrderCount(data.total);
      } catch {
        // silent
      }
    }

    checkNewOrders();
    const interval = setInterval(checkNewOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex bg-obsidian font-body">
      {/* Sidebar */}
      <aside
        className={`flex flex-shrink-0 flex-col border-r border-white/8 bg-coal transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        }`}
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
          <SidebarNav collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex h-12 items-center justify-center border-t border-white/8 text-cream/30 transition hover:text-cream/60"
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
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/8 bg-coal/50 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-cream/70">Painel Administrativo</h2>
            {newOrderCount > 0 && (
              <span className="rounded-full bg-amberglow/20 px-2 py-0.5 text-xs font-medium text-amberglow">
                {newOrderCount} novo{newOrderCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-cream/40 transition hover:bg-white/5 hover:text-cream/70"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Sair
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-obsidian">{children}</main>
      </div>
    </div>
  );
}
