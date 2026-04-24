"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-obsidian/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amberglow/40 bg-gradient-to-br from-ember to-amberglow text-xs font-black uppercase tracking-[0.35em] text-obsidian">
            ÔX
          </div>
          <div>
            <p className="font-title text-2xl uppercase tracking-[0.18em] text-cream">Onix Burguer</p>
            <p className="text-[10px] uppercase tracking-[0.45em] text-amberglow/70">Artesanal Premium</p>
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={openCart}
            className="relative rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white/75 transition-all duration-300 hover:border-amberglow/35 hover:text-amberglow hover:shadow-lg hover:shadow-amber-500/20"
            aria-label="Abrir carrinho"
          >
            Carrinho
            <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-amberglow px-2 py-0.5 text-xs font-bold text-obsidian">
              {itemCount}
            </span>
          </button>

          <Link
            href={pathname === "/cardapio" ? "/checkout" : "/cardapio"}
            className="rounded-full border border-amberglow/40 bg-amberglow px-4 py-3 text-sm font-semibold text-obsidian transition hover:scale-[1.02] hover:bg-[#ffcb7d] sm:px-5"
          >
            {pathname === "/cardapio" ? "Checkout" : "Ver Cardápio"}
          </Link>
        </div>
      </div>
    </header>
  );
}