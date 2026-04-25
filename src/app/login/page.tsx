"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type View = "login" | "register" | "forgot" | "reset";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function LoginClientePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");

  // Login fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Forgot password fields
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Reset password fields
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);

  function changeView(v: View) {
    setView(v);
    setError("");
    setSuccess("");
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Preencha e-mail/telefone e senha");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Erro ao entrar");
        return;
      }
      router.push("/minha-conta");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!regName || !regPhone || !regPassword) {
      setError("Nome, telefone e senha são obrigatórios");
      return;
    }
    if (regPassword !== regConfirm) {
      setError("As senhas não coincidem");
      return;
    }
    if (regPassword.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail || null,
          phone: regPhone,
          password: regPassword
        })
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Erro ao criar conta");
        return;
      }
      router.push("/minha-conta");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password ────────────────────────────────────────────────────────
  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!forgotIdentifier) {
      setError("Informe seu e-mail ou telefone");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier })
      });
      const data = (await res.json()) as { success?: boolean; _dev_code?: string };
      if (res.ok && data.success) {
        setForgotSent(true);
        setSuccess("Código enviado! Verifique seu WhatsApp.");
        if (data._dev_code) {
          setSuccess(`Código enviado! (DEV: ${data._dev_code})`);
        }
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  // ── Reset password ─────────────────────────────────────────────────────────
  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!resetCode || !resetPassword) {
      setError("Preencha o código e a nova senha");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setError("As senhas não coincidem");
      return;
    }
    if (resetPassword.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: forgotIdentifier,
          code: resetCode,
          newPassword: resetPassword
        })
      });
      const data = (await res.json()) as { success?: boolean; error?: string; message?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Erro ao redefinir senha");
        return;
      }
      setSuccess("Senha redefinida com sucesso! Faça login.");
      setTimeout(() => {
        setView("login");
        setSuccess("");
      }, 2000);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm px-4 py-3 text-sm text-cream outline-none transition placeholder:text-white/25 focus:border-amberglow/60 focus:bg-black/60";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Video background ── */}
      <video
        ref={videoRef}
        src="/videos/hamburguer 2.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* ── Dark overlay ── */}
      <div className="absolute inset-0 bg-black/60" />

      {/* ── Content ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <p className="font-title text-3xl uppercase tracking-[0.3em] text-amberglow drop-shadow-lg">
              Onix Burguer
            </p>
          </Link>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-white/50">
            Artesanal
          </p>
        </div>

        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-amber backdrop-blur-md">
          {/* ── View: Login ── */}
          {view === "login" && (
            <>
              <div className="mb-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">
                  Cliente
                </p>
                <h1 className="mt-2 font-title text-4xl uppercase tracking-[0.1em] text-cream">
                  Entrar
                </h1>
                <p className="mt-1 text-sm text-white/50">
                  Acesse seu histórico de pedidos
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    E-mail ou Telefone
                  </span>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email ou Telefone"
                    autoComplete="username"
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Senha
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={inputCls}
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
                  className="mt-2 w-full rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="mt-6 space-y-2 text-center text-sm">
                <button
                  onClick={() => changeView("forgot")}
                  className="block w-full text-amberglow/60 hover:text-amberglow"
                >
                  Esqueceu a senha?
                </button>
                <p className="text-white/30">
                  Não tem conta?{" "}
                  <button
                    onClick={() => changeView("register")}
                    className="text-amberglow/70 hover:text-amberglow"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── View: Register ── */}
          {view === "register" && (
            <>
              <div className="mb-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">
                  Cliente
                </p>
                <h1 className="mt-2 font-title text-4xl uppercase tracking-[0.1em] text-cream">
                  Criar conta
                </h1>
                <p className="mt-1 text-sm text-white/50">
                  Cadastre-se e acompanhe seus pedidos
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Nome completo *
                  </span>
                  <input
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu@email.com (opcional)"
                    autoComplete="email"
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Telefone (WhatsApp) *
                  </span>
                  <input
                    value={regPhone}
                    onChange={(e) => setRegPhone(formatPhone(e.target.value))}
                    placeholder="(21) 99999-9999"
                    autoComplete="tel"
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Senha *
                  </span>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Confirmar senha *
                  </span>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    className={inputCls}
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
                  className="mt-2 w-full rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/30">
                Já tem conta?{" "}
                <button
                  onClick={() => changeView("login")}
                  className="text-amberglow/70 hover:text-amberglow"
                >
                  Entrar
                </button>
              </p>
            </>
          )}

          {/* ── View: Forgot password ── */}
          {view === "forgot" && (
            <>
              <div className="mb-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">
                  Recuperar senha
                </p>
                <h1 className="mt-2 font-title text-4xl uppercase tracking-[0.1em] text-cream">
                  {forgotSent ? "Código enviado" : "Esqueceu a senha?"}
                </h1>
                <p className="mt-1 text-sm text-white/50">
                  {forgotSent
                    ? "Insira o código recebido no WhatsApp"
                    : "Informe seu e-mail ou telefone cadastrado"}
                </p>
              </div>

              {!forgotSent ? (
                <form onSubmit={handleForgot} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                      E-mail ou Telefone
                    </span>
                    <input
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Email ou Telefone cadastrado"
                      className={inputCls}
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
                    className="mt-2 w-full rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Enviando..." : "Enviar código"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {success && (
                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                      {success}
                    </div>
                  )}
                  <button
                    onClick={() => changeView("reset")}
                    className="w-full rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-obsidian transition hover:bg-[#ffcb7d]"
                  >
                    Inserir código
                  </button>
                  <button
                    onClick={() => {
                      setForgotSent(false);
                      setSuccess("");
                    }}
                    className="w-full rounded-full border border-white/10 px-6 py-3 text-sm text-cream/60 transition hover:bg-white/5"
                  >
                    Reenviar código
                  </button>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-white/30">
                Lembrou a senha?{" "}
                <button
                  onClick={() => changeView("login")}
                  className="text-amberglow/70 hover:text-amberglow"
                >
                  Entrar
                </button>
              </p>
            </>
          )}

          {/* ── View: Reset password ── */}
          {view === "reset" && (
            <>
              <div className="mb-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">
                  Nova senha
                </p>
                <h1 className="mt-2 font-title text-4xl uppercase tracking-[0.1em] text-cream">
                  Redefinir
                </h1>
                <p className="mt-1 text-sm text-white/50">
                  Insira o código recebido e sua nova senha
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Código OTP (6 dígitos)
                  </span>
                  <input
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className={`${inputCls} text-center text-2xl tracking-[0.5em]`}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Nova senha
                  </span>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Confirmar nova senha
                  </span>
                  <input
                    type="password"
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </label>

                {error && (
                  <div className="rounded-2xl border border-[#ff8f8f]/20 bg-[#ff8f8f]/10 px-4 py-3 text-sm text-[#ffd3d3]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>

              <button
                onClick={() => changeView("forgot")}
                className="mt-4 block w-full text-center text-sm text-amberglow/60 hover:text-amberglow"
              >
                ← Voltar
              </button>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-6 flex items-center gap-4 text-xs text-white/30">
          <Link href="/" className="text-amberglow/50 hover:text-amberglow">
            ← Voltar ao site
          </Link>
          <span>·</span>
          <Link href="/cardapio" className="text-amberglow/50 hover:text-amberglow">
            Ver cardápio
          </Link>
        </div>
      </div>
    </div>
  );
}
