"use client";

import { useEffect, useState, useRef } from "react";

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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/company");
      const data = await res.json();
      if (data.success && data.data) {
        setForm({
          name: String(data.data.name || ""),
          logo_url: String(data.data.logo_url || ""),
          address: String(data.data.address || ""),
          instagram: String(data.data.instagram || ""),
          whatsapp: String(data.data.whatsapp || ""),
          description: String(data.data.description || ""),
          slug: String(data.data.slug || ""),
        });
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Apenas imagens sÃ£o permitidas", type: "error" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: "Arquivo muito grande (mÃ¡x 2MB)", type: "error" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setForm(f => ({ ...f, logo_url: data.url }));
        setMessage({ text: "Logo enviado com sucesso!", type: "success" });
      } else {
        setMessage({ text: data.error || "Erro ao enviar logo", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erro ao fazer upload", type: "error" });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      setMessage({ text: "Nome da empresa e slug sÃ£o obrigatÃ³rios", type: "error" });
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
        if (data.data) {
          setForm({
            name: String(data.data.name || ""),
            logo_url: String(data.data.logo_url || ""),
            address: String(data.data.address || ""),
            instagram: String(data.data.instagram || ""),
            whatsapp: String(data.data.whatsapp || ""),
            description: String(data.data.description || ""),
            slug: String(data.data.slug || ""),
          });
        }
      } else {
        setMessage({ text: data.error || "Erro ao salvar", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erro de conexÃ£o com o servidor", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 8000);
    }
  }

  if (loading) return <div className="p-6 text-cream">Carregando...</div>;

  return (
    <div className="p-6 pb-24 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-title text-2xl text-cream">Dados da Empresa</h1>
        <p className="text-sm text-cream/50 mt-1">Configure as informaÃ§Ãµes que aparecerÃ£o no site</p>
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
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME DA EMPRESA *</label>
          <input
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Hamburgueria Modelo"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">SLUG / LINK PERSONALIZADO *</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-cream/40">hamburgueria-modelo.vercel.app/</span>
            <input
              value={form.slug}
              onChange={(e) => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
              placeholder="meu-restaurante"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
          <p className="mt-1 text-xs text-cream/30">URL personalizada do seu site</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">LOGO DA EMPRESA</label>
          
          <div className="flex items-center gap-3 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-2 text-sm text-cream/70 transition hover:border-amberglow/40 hover:text-amberglow disabled:opacity-50"
            >
              {uploading ? "Enviando..." : "ðŸ“ Escolher arquivo"}
            </button>
            <span className="text-xs text-cream/40">ou</span>
            <input
              value={form.logo_url}
              onChange={(e) => setForm(f => ({ ...f, logo_url: e.target.value }))}
              placeholder="https://exemplo.com/logo.png"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
            />
          </div>
          
          {form.logo_url && (
            <div className="flex items-center gap-3">
              <img src={form.logo_url} alt="Logo preview" className="h-16 w-auto rounded-lg border border-white/10" />
              <button
                onClick={() => setForm(f => ({ ...f, logo_url: "" }))}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ENDEREÃ‡O DA EMPRESA</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Rua Exemplo, 123 - Centro"
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50 resize-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">TEXTO DESCRITIVO</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="DescriÃ§Ã£o da empresa que aparecerÃ¡ no site..."
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50 resize-none"
          />
        </div>

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
