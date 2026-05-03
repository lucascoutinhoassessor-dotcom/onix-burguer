"use client";

import { useEffect, useState } from "react";

interface CompanyData {
  id?: string;
  name: string;
  logo_url: string;
  address: string;
  instagram: string;
  whatsapp: string;
  description: string;
  slug: string;
}

const EMPTY_FORM: CompanyData = {
  name: "",
  logo_url: "",
  address: "",
  instagram: "",
  whatsapp: "",
  description: "",
  slug: ""
};

export default function DadosEmpresaPage() {
  const [form, setForm] = useState<CompanyData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/company");
      const data = await res.json();
      if (data.success && data.data) {
        setForm(data.data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.slug) {
      setMessage({ text: "Nome da empresa e slug são obrigatórios", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Dados salvos com sucesso!", type: "success" });
        setForm(data.data);
      } else {
        setMessage({ text: data.error || "Erro ao salvar", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erro de conexão", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  if (loading) return <div className="p-6 text-cream">Carregando...</div>;

  return (
    <div className="p-6 pb-24 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-title text-2xl text-cream">Dados da Empresa</h1>
        <p className="text-sm text-cream/50 mt-1">Configure as informações que aparecerão no site</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 ${
          message.type === "success" 
            ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" 
            : "border-red-500/30 bg-red-500/20 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Nome da Empresa */}
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME DA EMPRESA *</label>
          <input
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Onix Burguer Artesanal"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
        </div>

        {/* Slug/Link Personalizado */}
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">SLUG / LINK PERSONALIZADO *</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-cream/40">onix-burguer.vercel.app/</span>
            <input
              value={form.slug}
              onChange={(e) => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
              placeholder="meu-restaurante"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
          <p className="mt-1 text-xs text-cream/30">URL personalizada do seu site</p>
        </div>

        {/* Logo */}
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">LOGO DA EMPRESA</label>
          <input
            value={form.logo_url}
            onChange={(e) => setForm(f => ({ ...f, logo_url: e.target.value }))}
            placeholder="https://exemplo.com/logo.png"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
          {form.logo_url && (
            <img src={form.logo_url} alt="Logo preview" className="mt-2 h-16 w-auto rounded-lg" />
          )}
        </div>

        {/* Endereço */}
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ENDEREÇO DA EMPRESA</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Rua Exemplo, 123 - Centro"
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50 resize-none"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TEXTO DESCRITIVO</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrição da empresa que aparecerá no site..."
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50 resize-none"
          />
        </div>

        {/* Instagram */}
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">INSTAGRAM (opcional)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-cream/40">@</span>
            <input
              value={form.instagram}
              onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value.replace("@", "") }))}
              placeholder="onixburguer"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">WHATSAPP (opcional)</label>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            placeholder="(21) 96556-5600"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-amberglow/25 px-6 py-2 text-sm font-medium text-amberglow transition hover:bg-amberglow/35 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar Dados"}
        </button>
      </div>
    </div>
  );
}
