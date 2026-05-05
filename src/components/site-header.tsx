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

export function SiteHeader({ companyName = "Hamburgueria Modelo", logoUrl = "" }: { companyName?: string; logoUrl?: string }) {
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
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-9 w-9 rounded-full object-cover sm:h-11 sm:w-11" />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-amberglow/40 bg-gradient-to-br from-ember to-amberglow text-[10px] font-black uppercase tracking-[0.25em] text-obsidian sm:h-11 sm:w-11 sm:text-xs sm:tracking-[0.35em]">
              ÔX
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-title text-lg uppercase tracking-[0.12em] text-cream sm:text-2xl sm:tracking-[0.18em]">{companyName}</p>
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
          {/* Ícone login/usuário — visível só no mobile */}
          <Link
            href={isLoggedIn ? "/minha-conta" : "/login"}
            aria-label={isLoggedIn ? "Minha conta" : "Entrar"}
            className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/75 transition-all duration-300 hover:border-amberglow/35 hover:text-amberglow hover:shadow-lg hover:shadow-amber-500/20 sm:hidden"
          >
            {isLoggedIn ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            )}
          </Link>

          {/* Link texto login/usuário — visível só em sm+ */}
          <Link
            href={isLoggedIn ? "/minha-conta" : "/login"}
            className="hidden rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 transition-all duration-300 hover:border-amberglow/35 hover:text-amberglow hover:shadow-lg hover:shadow-amber-500/20 sm:inline-flex sm:items-center sm:px-4 sm:py-3 sm:text-sm"
          >
            {isLoggedIn ? "Minha Conta" : "Entrar"}
          </Link>

          {/* Botão carrinho */}
          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/75 transition-all duration-300 hover:border-amberglow/35 hover:text-amberglow hover:shadow-lg hover:shadow-amber-500/20 sm:hidden"
            aria-label="Abrir carrinho"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-amberglow px-1 text-[9px] font-bold text-obsidian">
                {itemCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={openCart}
            className="relative hidden rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 transition-all duration-300 hover:border-amberglow/35 hover:text-amberglow hover:shadow-lg hover:shadow-amber-500/20 sm:inline-flex sm:items-center sm:px-4 sm:py-3 sm:text-sm"
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
