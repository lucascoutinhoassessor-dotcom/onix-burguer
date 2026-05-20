"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [created, setCreated] = useState(false);
  const [credentials, setCredentials] = useState<Array<{ email: string; password: string }>>([]);

  useEffect(() => {
    async function checkAdmin() {
      try {
        // Tentar rota normal
        let res = await fetch("/api/admin/setup");
        let data = await res.json();
        
        // Se não tem admin, tentar rota force
        if (!data.hasAdmin) {
          res = await fetch("/api/admin/setup/force");
          data = await res.json();
        }
        
        setHasAdmin(data.hasAdmin);
        if (data.hasAdmin) {
          // Não redireciona, mostra os logins
          setChecking(false);
        } else {
          setChecking(false);
        }
      } catch (e) {
        console.error(e);
        setChecking(false);
      }
    }
    checkAdmin();
  }, []);

  async function handleCreateAdmin() {
    setLoading(true);
    try {
      // Tentar rota normal primeiro
      let res = await fetch("/api/admin/setup", { method: "POST" });
      let data = await res.json();
      
      // Se falhou, tentar rota force
      if (!data.success) {
        res = await fetch("/api/admin/setup/force", { method: "POST" });
        data = await res.json();
      }
      
      if (data.success) {
        setCreated(true);
        setCredentials(data.credentials);
      } else {
        alert(data.error || data.errors?.map((e: any) => `${e.email}: ${e.error}`).join("\n") || "Erro ao criar admin");
      }
    } catch (e) {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="text-cream/40">Verificando...</p>
      </div>
    );
  }

  if (hasAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <div className="text-center">
          <p className="text-cream/60">Admin já existe. Redirecionando... </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full border border-amberglow/30 bg-amberglow/10">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-amberglow">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>
          <h1 className="font-title text-2xl tracking-widest text-cream">Configuração Inicial</h1>
          <p className="mt-1 text-xs text-cream/40">Criar administradores padrão</p>
        </div>

        {!created ? (
          <>
            <p className="mb-6 text-sm text-white/60 text-center">
              Nenhum administrador encontrado. Clique abaixo para criar 2 admins padrão.
            </p>
            <button
              onClick={handleCreateAdmin}
              disabled={loading}
              className="w-full rounded-lg bg-amberglow px-4 py-3 text-sm font-semibold text-obsidian transition hover:bg-ember disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar 2 Admins"}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-center">
              <svg className="mx-auto mb-2 h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-green-400">{credentials.length} admin(s) criado(s)!</p>
            </div>

            {credentials.map((cred, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Admin {idx + 1}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-white/40">Email</p>
                    <p className="text-sm font-mono text-cream">{cred.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Senha</p>
                    <p className="text-sm font-mono text-cream">{cred.password}</p>
                  </div>
                </div>
              </div>
            ))}

            <a
              href="/admin/login"
              className="block w-full rounded-lg bg-amberglow px-4 py-3 text-center text-sm font-semibold text-obsidian transition hover:bg-ember"
            >
              Ir para Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
