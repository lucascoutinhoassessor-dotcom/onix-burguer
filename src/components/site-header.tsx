"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Cardápio", href: "/cardapio" },
  { label: "Avaliações", href: "/#avaliacoes" },
  { label: "Localização", href: "/#localizacao" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/customer/auth")
      .then((r) => r.json())
      .then((data: { customer?: unknown }) => setIsLoggedIn(!!data.customer))
      .catch(() => setIsLoggedIn(false));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-obsidian/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-amberglow/40 bg-gradient-to-br from-ember to-amberglow text-[10px] font-black uppercase tracking-[0.25em] text-obsidian sm:h-11 sm:w-11 sm:text-xs sm:tracking-[0.35em]">
            ÔX
          </div>
          <div className="min-w-0">
            <p className="truncate font-title text-lg uppercase tracking-[0.12em] text-cream sm:text-2xl sm:tracking-[0.18em]">Onix Burguer</p>
            <p className="hidden text-[10px] uppercase tracking-[0.45em] text-amberglow/70 sm:block">Artesanal Premium</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-white/70 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`transition-colors duration-200 hover:text-amberglow ${pathname === item.href ? "text-amberglow" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          <Link
            href={isLoggedIn ? "/minha-conta" : "/login"}
            className="hidden rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 transition-all duration-300 hover:border-amberglow/35 hover:text-amberglow hover:shadow-lg hover:shadow-amber-500/20 sm:inline-flex sm:items-center sm:px-4 sm:py-3 sm:text-sm"
          >
            {isLoggedIn ? "Minha Conta" : "Entrar"}
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="relative rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 transition-all duration-300 hover:border-amberglow/35 hover:text-amberglow hover:shadow-lg hover:shadow-amber-500/20 sm:px-4 sm:py-3 sm:text-sm"
            aria-label="Abrir carrinho"
          >
            Carrinho
            <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amberglow px-1.5 py-0.5 text-[10px] font-bold text-obsidian sm:ml-2 sm:min-w-6 sm:px-2 sm:text-xs">
              {itemCount}
            </span>
          </button>

          <Link
            href={pathname === "/cardapio" ? "/checkout" : "/cardapio"}
            className="rounded-full border border-amberglow/40 bg-amberglow px-3 py-2 text-xs font-semibold text-obsidian transition hover:scale-[1.02] hover:bg-[#ffcb7d] sm:px-5 sm:py-3 sm:text-sm"
          >
            {pathname === "/cardapio" ? "Checkout" : "Cardápio"}
          </Link>
        </div>
      </div>
    </header>
  );
}
