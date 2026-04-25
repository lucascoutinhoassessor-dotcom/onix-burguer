"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function LoginClientePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!phone || !password) {
      setError("Preencha telefone e senha");
      return;
    }
    if (tab === "register" && !name) {
      setError("Informe seu nome");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: tab, phone, name, password })
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Erro ao processar");
        return;
      }
      router.push("/minha-conta");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-hero-radial px-4 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-amber">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">Cliente</p>
            <h1 className="mt-2 font-title text-4xl uppercase tracking-[0.1em] text-cream">
              {tab === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {tab === "login"
                ? "Acesse seu histórico de pedidos e cashback"
                : "Crie sua conta e acompanhe seus pedidos"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/8 p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  tab === t
                    ? "bg-amberglow/15 text-amberglow"
                    : "text-cream/40 hover:text-cream/60"
                }`}
              >
                {t === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">Nome completo</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-cream outline-none transition placeholder:text-white/25 focus:border-amberglow/50"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">Telefone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(21) 99999-9999"
                className="w-full rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-cream outline-none transition placeholder:text-white/25 focus:border-amberglow/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-cream outline-none transition placeholder:text-white/25 focus:border-amberglow/50"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-[#ff8f8f]/20 bg-[#ff8f8f]/10 px-4 py-3 text-sm text-[#ffd3d3]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:bg-amberglow/50"
            >
              {loading
                ? "Processando..."
                : tab === "login"
                ? "Entrar"
                : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/30">
            <Link href="/" className="text-amberglow/60 hover:text-amberglow">
              ← Voltar ao site
            </Link>
            <span>·</span>
            <Link href="/cardapio" className="text-amberglow/60 hover:text-amberglow">
              Ver cardápio
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
