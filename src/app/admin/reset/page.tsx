"use client";

import { useState, useEffect } from "react";

export default function ResetPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    fetchExisting();
  }, []);

  async function fetchExisting() {
    try {
      const res = await fetch("/api/admin/setup/reset");
      const data = await res.json();
      setExisting(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReset() {
    if (!confirm("Isso vai recriar os admins. Continuar?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup/reset", { method: "POST" });
      const data = await res.json();
      setResult(data);
      await fetchExisting();
    } catch (e) {
      alert("Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <h1 className="mb-6 text-center font-title text-2xl text-cream">Reset de Admin</h1>

        {existing && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs font-medium uppercase text-white/40">Admins Existentes</p>
            {existing.employees?.length > 0 ? (
              <div className="space-y-2">
                {existing.employees.map((e: any) => (
                  <div key={e.id} className="text-sm text-cream">
                    {e.email} — {e.name} ({e.active ? "ativo" : "inativo"})
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">Nenhum admin encontrado</p>
            )}
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full rounded-lg bg-amberglow px-4 py-3 text-sm font-semibold text-obsidian transition hover:bg-ember disabled:opacity-50"
        >
          {loading ? "Recriando..." : "Recriar Admins"}
        </button>

        {result && (
          <div className="mt-6 space-y-4">
            {result.credentials?.map((cred: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-green-400/30 bg-green-400/10 p-4">
                <p className="text-xs text-white/40">Admin {idx + 1}</p>
                <p className="font-mono text-sm text-cream">{cred.email}</p>
                <p className="font-mono text-sm text-cream">{cred.password}</p>
              </div>
            ))}
          </div>
        )}

        <a href="/admin/login" className="mt-6 block text-center text-sm text-amberglow">
          Ir para Login
        </a>
      </div>
    </div>
  );
}
