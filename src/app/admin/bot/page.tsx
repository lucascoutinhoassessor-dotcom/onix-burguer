"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type BotSettings = {
  active: boolean;
  prompt: string;
  responseDelay: number;
  includeMenuContext: boolean;
  welcomeMessage: string;
};

type ConnectionStatus = "disconnected" | "loading_qr" | "awaiting_scan" | "connected" | "error";

const DEFAULT_PROMPT = `Você é o atendente virtual da Hamburgueria Modelo. Siga rigorosamente estas etapas de atendimento.
IMPORTANTE: Verifique o histórico da conversa para saber em qual etapa o cliente está e NUNCA repita etapas já concluídas.

1. SAUDAÇÃO: Cumprimente de forma simpática. (SÓ USE SE FOR O INÍCIO DA CONVERSA).
2. CARDÁPIO: Apresente o cardápio de forma convidativa e clara. Formate os itens em listas (com um emoji por linha) e mostre os preços.
3. ADICIONAIS: Se o cliente escolher um prato que tenha adicionais, ofereça-os com o preço.
4. TIPO DE PEDIDO: Pergunte como deseja pedir (1- Entrega, 2- Retirada, 3- Local).
5. CONCLUSÃO: Resuma o pedido com os valores e aponte o valor final.

Regra de Ouro: Nunca invente itens ou preços. Use formatação do WhatsApp (*negrito* para títulos) para organizar.`;

const DEFAULT_WELCOME = `Olá! Bem-vindo à Hamburgueria Modelo! 🍔

Sou seu assistente virtual e estou aqui para ajudar você com:
• 📋 Cardápio e preços
• 🛒 Fazer pedidos
• ❓ Tirar dúvidas

Como posso ajudar você hoje?`;

export default function BotAdminPage() {
  const [settings, setSettings] = useState<BotSettings>({
    active: false,
    prompt: DEFAULT_PROMPT,
    responseDelay: 3,
    includeMenuContext: true,
    welcomeMessage: DEFAULT_WELCOME
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/bot/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            prompt: data.settings.prompt || DEFAULT_PROMPT,
            welcomeMessage: data.settings.welcomeMessage || DEFAULT_WELCOME
          }));
        }
      }
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
    }
  }

  async function checkStatus() {
    try {
      const res = await fetch("/api/admin/bot/status");
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data.state || "disconnected");
        if (data.qrCodeBase64) setQrCodeBase64(data.qrCodeBase64);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/bot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage("Configurações salvas com sucesso!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Erro ao salvar configurações.");
      }
    } catch (e) {
      setMessage("Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    const newActive = !settings.active;
    setSettings((prev) => ({ ...prev, active: newActive }));
    try {
      await fetch("/api/admin/bot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, active: newActive })
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleConnect() {
    setLoading(true);
    setConnectionStatus("loading_qr");
    try {
      await fetch("/api/admin/bot/connect", { method: "POST" });
      await checkStatus();
    } catch (e) {
      setConnectionStatus("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp?")) return;
    try {
      await fetch("/api/admin/bot/disconnect", { method: "POST" });
      setConnectionStatus("disconnected");
      setSettings((prev) => ({ ...prev, active: false }));
    } catch (e) {
      alert("Erro ao desconectar");
    }
  }

  const statusLabels: Record<ConnectionStatus, { text: string; color: string }> = {
    disconnected: { text: "Desconectado", color: "text-white/40" },
    loading_qr: { text: "Carregando...", color: "text-yellow-400" },
    awaiting_scan: { text: "Aguardando scan", color: "text-amberglow" },
    connected: { text: "Conectado", color: "text-green-400" },
    error: { text: "Erro", color: "text-red-400" }
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-coal to-obsidian">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-green-500/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between p-6 sm:p-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-title text-xl text-cream">Bot WhatsApp</h1>
                  <p className="text-xs text-white/50">Atendimento automatizado com IA</p>
                </div>
              </div>
              <p className="max-w-lg text-sm text-white/60 leading-relaxed">
                Automatize o atendimento ao cliente, recebimento de pedidos e tire dúvidas sobre o cardápio em tempo real usando inteligência artificial conectada ao seu WhatsApp.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-4">
              <button
                onClick={handleToggleActive}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                  settings.active
                    ? "bg-green-500 text-obsidian shadow-lg shadow-green-500/30"
                    : "bg-white/10 text-white/40 hover:bg-white/20"
                }`}
              >
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
              <span className={`text-xs font-medium ${settings.active ? "text-green-400" : "text-white/40"}`}>
                {settings.active ? "Bot Ativo" : "Bot Desativado"}
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Conexão WhatsApp */}
          <div className="rounded-2xl border border-white/10 bg-coal">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <h3 className="text-sm font-medium text-cream">Conexão WhatsApp</h3>
              </div>
              {connectionStatus === "connected" && (
                <span className="rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-green-400">
                  Conectado
                </span>
              )}
            </div>

            <div className="p-5">
              {(connectionStatus === "disconnected" || connectionStatus === "error") && (
                <div className="text-center py-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-cream">Vincular Dispositivo</h4>
                  <p className="mb-5 px-4 text-xs text-white/50">
                    Gere um QR Code para conectar o bot ao seu WhatsApp de forma segura.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-green-400/30 bg-green-400/10 px-5 py-3 text-sm font-medium text-green-400 transition hover:bg-green-400/20 disabled:opacity-50"
                  >
                    {loading ? "Carregando..." : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Gerar QR Code
                      </>
                    )}
                  </button>
                </div>
              )}

              {connectionStatus === "loading_qr" && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 py-10">
                  <svg className="mb-3 h-8 w-8 animate-spin text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-sm font-medium text-white/60">Iniciando conexão...</p>
                  <p className="mt-1 text-xs text-white/40">Isso pode levar alguns segundos.</p>
                </div>
              )}

              {connectionStatus === "awaiting_scan" && qrCodeBase64 && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-green-400/30 bg-green-400/5 p-5 text-center">
                  <div className="mb-3 rounded-xl bg-white p-2">
                    <img src={qrCodeBase64} alt="QR Code WhatsApp" className="h-48 w-48" />
                  </div>
                  <p className="mb-2 text-sm font-medium text-cream">Escaneie o QR Code</p>
                  <div className="space-y-1 text-xs text-white/50">
                    <p>1. Abra o WhatsApp no celular</p>
                    <p>2. Menu → Aparelhos conectados</p>
                    <p>3. Toque em &quot;Conectar um aparelho&quot;</p>
                  </div>
                </div>
              )}

              {connectionStatus === "connected" && (
                <div className="text-center py-4">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">
                    <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-cream">WhatsApp Conectado!</h4>
                  <p className="mb-5 text-xs text-white/50">O bot já está recebendo as mensagens.</p>
                  <button
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-400/20"
                  >
                    Desconectar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Configurações da IA */}
          <div className="rounded-2xl border border-white/10 bg-coal">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-sm font-medium text-cream">Configuração da IA</h3>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-4">
                <h4 className="mb-1 text-sm font-medium text-green-400">IA Inclusa</h4>
                <p className="text-xs text-white/60">
                  A inteligência artificial já está configurada e pronta para uso, sem custos adicionais.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Tempo de Resposta (Segundos)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={1}
                    value={settings.responseDelay}
                    onChange={(e) => setSettings((prev) => ({ ...prev, responseDelay: parseInt(e.target.value) }))}
                    className="flex-1 accent-amberglow"
                  />
                  <span className="min-w-[50px] rounded-lg bg-white/5 px-3 py-2 text-center text-sm font-medium text-cream">
                    {settings.responseDelay}s
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  Um tempo maior simula a &quot;digitação&quot; e torna o bot mais humano.
                </p>
              </div>
            </div>
          </div>

          {/* Prompt do Bot */}
          <div className="rounded-2xl border border-white/10 bg-coal lg:col-span-2">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-sm font-medium text-cream">Missão do Bot e Personalidade</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="relative">
                <textarea
                  rows={10}
                  value={settings.prompt}
                  onChange={(e) => setSettings((prev) => ({ ...prev, prompt: e.target.value }))}
                  className="w-full resize-y rounded-xl border border-white/10 bg-obsidian px-4 py-3 text-sm text-cream outline-none focus:border-amberglow/50"
                  placeholder="Defina como o bot deve se comportar..."
                />
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, prompt: DEFAULT_PROMPT }))}
                  className="absolute bottom-3 right-3 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-cream transition hover:bg-white/20"
                >
                  Restaurar Padrão
                </button>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Dica: Especifique como o bot deve se comportar. O sistema mantém o histórico da conversa para contexto.
              </p>

              {/* Mensagem de boas-vindas */}
              <div className="mt-5">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Mensagem de Boas-vindas
                </label>
                <textarea
                  rows={4}
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                  className="w-full resize-y rounded-xl border border-white/10 bg-obsidian px-4 py-3 text-sm text-cream outline-none focus:border-amberglow/50"
                  placeholder="Mensagem enviada quando o cliente inicia a conversa..."
                />
              </div>

              {/* Sincronizar com cardápio */}
              <div className="mt-5 border-t border-white/10 pt-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={settings.includeMenuContext}
                    onChange={(e) => setSettings((prev) => ({ ...prev, includeMenuContext: e.target.checked }))}
                    className="mt-0.5 rounded border-white/20 bg-obsidian text-amberglow"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-cream">Sincronizar com o Cardápio</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/40">
                      O bot terá conhecimento dos pratos, categorias, adicionais e preços em tempo real para oferecer e tirar dúvidas.
                    </p>
                  </div>
                </label>
              </div>

              {/* Ações */}
              <div className="mt-6 flex items-center justify-between">
                {message && (
                  <span className={`text-xs ${message.includes("sucesso") ? "text-green-400" : "text-red-400"}`}>
                    {message}
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-amberglow px-6 py-2.5 text-sm font-medium text-obsidian transition hover:bg-[#ffcb7d] disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar Configurações"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
