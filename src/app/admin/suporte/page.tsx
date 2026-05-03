"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "Duvida", label: "Duvida" },
  { value: "Bug", label: "Bug" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Outros", label: "Outros" },
];

export default function SuportePage() {
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      setMessage({ text: "Preencha todos os campos obrigatorios", type: "error" });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "support",
          title: form.title,
          category: form.category,
          description: form.description,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          text: "Sua solicitacao de suporte foi enviada com sucesso. Nossa equipe retornara em breve.",
          type: "success",
        });
        setForm({ title: "", category: "", description: "" });
      } else {
        setMessage({ text: data.error || "Erro ao enviar", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erro de conexao", type: "error" });
    } finally {
      setSending(false);
      setTimeout(() => setMessage(null), 8000);
    }
  }

  return (
    <div className="p-6 pb-24 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-title text-2xl text-cream">Suporte</h1>
        <p className="text-sm text-cream/50 mt-1">
          Envie sua duvida, reporte um bug ou solicite ajuda. Nossa equipe respondera em breve.
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
            TITULO / ASSUNTO *
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Nao consigo alterar o cardapio"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
            CATEGORIA *
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream outline-none focus:border-amberglow/50"
          >
            <option value="" className="bg-coal text-cream">Selecione...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-coal text-cream">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
            DESCRICAO DETALHADA *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descreva seu problema com o maximo de detalhes possivel..."
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
            {sending ? "Enviando..." : "Enviar Solicitacao"}
          </button>
        </div>
      </form>
    </div>
  );
}
