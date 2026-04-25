"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (res.ok && data.success) {
        router.replace("/admin");
      } else {
        setError(data.error ?? "Falha ao autenticar.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-obsidian">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(199,138,44,0.15),transparent_60%)]" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full border border-amberglow/30 bg-amberglow/10">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-amberglow" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18v2H3V6zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />
            </svg>
          </div>
          <h1 className="font-title text-3xl tracking-widest text-cream">ONIX ADMIN</h1>
          <p className="mt-1 text-xs tracking-wider text-cream/40">Painel Administrativo</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wider text-cream/60">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@onixburguer.com.br"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-cream placeholder-cream/25 outline-none transition focus:border-amberglow/50 focus:ring-1 focus:ring-amberglow/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-wider text-cream/60">
              SENHA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-cream placeholder-cream/25 outline-none transition focus:border-amberglow/50 focus:ring-1 focus:ring-amberglow/30"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-amberglow px-4 py-2.5 text-sm font-semibold tracking-wider text-obsidian transition hover:bg-ember disabled:opacity-50"
        >
          {loading ? "Entrando..." : "ENTRAR"}
        </button>
      </form>
    </div>
  );
}
