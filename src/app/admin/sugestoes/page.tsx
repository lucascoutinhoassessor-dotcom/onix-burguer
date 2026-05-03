"use client";

import { useState } from "react";

const AREAS = [
  { value: "Melhoria visual", label: "Melhoria visual" },
  { value: "Nova funcionalidade", label: "Nova funcionalidade" },
  { value: "Outros", label: "Outros" },
];

export default function SugestoesPage() {
  const [form, setForm] = useState({ title: "", area: "", description: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.area || !form.description.trim()) {
      setMessage({ text: "Preencha todos os campos obrigatÃ³rios", type: "error" });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "suggestion",
          title: form.title,
          category: form.area,
          description: form.description,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          text: "Obrigado por ajudar a melhorar nossa plataforma! Sua sugestÃ£o foi registrada.",
          type: "success",
        });
        setForm({ title: "", area: "", description: "" });
      } else {
        setMessage({ text: data.error || "Erro ao enviar", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erro de conexÃ£o", type: "error" });
    } finally {
      setSending(false);
      setTimeout(() => setMessage(null), 8000);
    }
  }

  return (
    <div className="p-6 pb-24 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-title text-2xl text-cream">SugestÃµes</h1>
        <p className="text-sm text-cream/50 mt-1">
          Tem uma ideia para melhorar o painel ou o site? Conta pra gente!
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
              : "border-red-500/30 bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
            TÃTULO DA SUGESTÃƒO *
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Adicionar relatÃ³rio de vendas por horÃ¡rio"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
            ÃREA DA PLATAFORMA *
          </label>
          <select
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
          >
            <option value="" className="bg-coal text-cream">Selecione...</option>
            {AREAS.map((area) => (
              <option key={area.value} value={area.value} className="bg-coal text-cream">
                {area.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
            DESCRIÃ‡ÃƒO *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descreva sua sugestÃ£o com detalhes. Como funcionaria? Qual o benefÃ­cio?"
            rows={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50 resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-amberglow/25 px-6 py-2 text-sm font-medium text-amberglow transition hover:bg-amberglow/35 disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar SugestÃ£o"}
          </button>
        </div>
      </form>
    </div>
  );
}
