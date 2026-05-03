# Script automático - Correções Onix Burguer (v2)
# Resolve: erro ao salvar dados, upload, botão flutuante sempre visível

$ErrorActionPreference = "Stop"
$projectPath = "C:\Users\Lucas\Projects\onix-burguer"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Script Automático - Onix Burguer v2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $projectPath
Write-Host "[OK] Projeto encontrado" -ForegroundColor Green

# ============================================================================
# PARTE 1: Script SQL para criar tabela company_settings
# ============================================================================
Write-Host ""
Write-Host "[1/6] Criando script SQL..." -ForegroundColor Yellow

$sqlContent = @"
-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  address TEXT,
  instagram TEXT,
  whatsapp TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações
CREATE POLICY "Allow all" ON company_settings
  FOR ALL USING (true) WITH CHECK (true);
"@

Set-Content -Path "$projectPath\supabase-company-settings.sql" -Value $sqlContent -Encoding UTF8
Write-Host "[OK] Script SQL criado" -ForegroundColor Green

# ============================================================================
# PARTE 2: Corrigir API /api/company/route.ts
# ============================================================================
Write-Host ""
Write-Host "[2/6] Corrigindo API /api/company..." -ForegroundColor Yellow

$apiContent = @'
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/company - buscar dados da empresa
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("company_settings")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("GET /api/company error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (err: any) {
    console.error("GET /api/company exception:", err);
    if (err?.message?.includes("relation") && err?.message?.includes("does not exist")) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        note: "Tabela company_settings ainda não existe. Rode o script SQL no Supabase."
      });
    }
    return NextResponse.json({ success: false, error: "Erro ao buscar dados" }, { status: 500 });
  }
}

// POST /api/company - salvar/atualizar dados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, logo_url, address, instagram, whatsapp, description, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Nome e slug são obrigatórios" }, 
        { status: 400 }
      );
    }

    const cleanData = {
      name: String(name || "").trim(),
      slug: String(slug || "").trim().toLowerCase(),
      logo_url: String(logo_url || "").trim(),
      address: String(address || "").trim(),
      instagram: String(instagram || "").trim(),
      whatsapp: String(whatsapp || "").trim(),
      description: String(description || "").trim(),
      updated_at: new Date().toISOString()
    };

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("company_settings")
      .select("id")
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Erro ao buscar registro existente:", existingError);
    }

    let result;
    if (existing?.id) {
      result = await supabaseAdmin
        .from("company_settings")
        .update(cleanData)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from("company_settings")
        .insert(cleanData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("POST /api/company Supabase error:", result.error);
      throw new Error(result.error.message);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    console.error("POST /api/company exception:", err);
    const errorMessage = err?.message || String(err);
    if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A tabela 'company_settings' não existe no banco de dados. Por favor, rode o script SQL 'supabase-company-settings.sql' no Supabase SQL Editor." 
        }, 
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Erro ao salvar dados: " + errorMessage }, 
      { status: 500 }
    );
  }
}
'@

Set-Content -Path "$projectPath\src\app\api\company\route.ts" -Value $apiContent -Encoding UTF8
Write-Host "[OK] API corrigida" -ForegroundColor Green

# ============================================================================
# PARTE 3: Corrigir formulário dados-empresa/page.tsx
# ============================================================================
Write-Host ""
Write-Host "[3/6] Corrigindo formulário Dados da Empresa..." -ForegroundColor Yellow

$formContent = @'
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
      setMessage({ text: "Apenas imagens são permitidas", type: "error" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: "Arquivo muito grande (máx 2MB)", type: "error" });
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
      setMessage({ text: "Erro de conexão com o servidor", type: "error" });
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
        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">NOME DA EMPRESA *</label>
          <input
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Onix Burguer Artesanal"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
        </div>

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
              {uploading ? "Enviando..." : "📁 Escolher arquivo"}
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
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">ENDEREÇO DA EMPRESA</label>
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
            placeholder="Descrição da empresa que aparecerá no site..."
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
'@

Set-Content -Path "$projectPath\src\app\admin\dados-empresa\page.tsx" -Value $formContent -Encoding UTF8
Write-Host "[OK] Formulário corrigido" -ForegroundColor Green

# ============================================================================
# PARTE 4: Botão flutuante SEMPRE visível (independente do admin configurar)
# ============================================================================
Write-Host ""
Write-Host "[4/6] Corrigindo botão flutuante do WhatsApp..." -ForegroundColor Yellow

# Atualizar o componente do botão flutuante para ter número padrão
$fabContent = @'
import { getRestaurantWhatsAppUrl } from "@/lib/checkout";

// Número padrão do restaurante - sempre visível mesmo sem configuração do admin
const DEFAULT_WHATSAPP = "21965565600"; // (21) 96556-5600

export function WhatsAppFloatingButton({ phone }: { phone?: string }) {
  const whatsappNumber = phone ? phone.replace(/\D/g, "") : DEFAULT_WHATSAPP;
  const whatsappUrl = `https://wa.me/55${whatsappNumber}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir WhatsApp"
      className="fixed bottom-5 right-5 z-[90] inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.35)] transition hover:scale-105 hover:bg-[#20bd5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 fill-current">
        <path d="M19.11 17.49c-.27-.14-1.58-.78-1.83-.86-.24-.09-.42-.14-.6.13-.18.27-.69.86-.84 1.03-.16.18-.31.2-.58.07-.27-.14-1.13-.41-2.15-1.3-.8-.71-1.34-1.57-1.5-1.84-.16-.27-.02-.42.12-.56.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.14-.6-1.44-.82-1.97-.22-.53-.44-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.96 2.57 1.09 2.75.13.18 1.88 2.87 4.56 4.03.64.27 1.14.43 1.53.55.64.2 1.22.17 1.68.1.51-.08 1.58-.65 1.8-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.51-.31Z" />
        <path d="M27.11 4.88A15.78 15.78 0 0 0 16 0C7.18 0 0 7.18 0 16c0 2.82.74 5.58 2.15 8.01L0 32l8.2-2.12A15.93 15.93 0 0 0 16 32c8.82 0 16-7.18 16-16 0-4.27-1.66-8.28-4.89-11.12ZM16 29.15c-2.38 0-4.72-.64-6.77-1.85l-.49-.29-4.87 1.26 1.3-4.75-.32-.49A13.08 13.08 0 0 1 2.86 16C2.86 8.9 8.9 2.86 16 2.86c3.46 0 6.72 1.35 9.17 3.8A12.88 12.88 0 0 1 29.14 16c0 7.1-6.04 13.15-13.14 13.15Z" />
      </svg>
    </a>
  );
}
'@

Set-Content -Path "$projectPath\src\components\whatsapp-floating-button.tsx" -Value $fabContent -Encoding UTF8
Write-Host "[OK] Botão flutuante atualizado - sempre visível" -ForegroundColor Green

# ============================================================================
# PARTE 5: Atualizar page.tsx para sempre mostrar o botão flutuante
# ============================================================================
Write-Host ""
Write-Host "[5/6] Atualizando página inicial..." -ForegroundColor Yellow

$pagePath = "$projectPath\src\app\page.tsx"
$pageContent = Get-Content -Raw $pagePath

# Substituir a linha condicional do botão flutuante para sempre mostrar
$pageContent = $pageContent -replace "\{companyWhatsapp && \<WhatsAppFloatingButton /\>\}", "<WhatsAppFloatingButton phone={companyWhatsapp} />"

Set-Content -Path $pagePath -Value $pageContent -Encoding UTF8
Write-Host "[OK] Página inicial atualizada" -ForegroundColor Green

# ============================================================================
# PARTE 6: Commit e instruções finais
# ============================================================================
Write-Host ""
Write-Host "[6/6] Finalizando..." -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TUDO PRONTO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "O que foi corrigido:" -ForegroundColor Yellow
Write-Host "  ✅ Script SQL para criar tabela company_settings" -ForegroundColor White
Write-Host "  ✅ API /api/company com tratamento de erro melhorado" -ForegroundColor White
Write-Host "  ✅ Formulário Dados da Empresa com validação robusta" -ForegroundColor White
Write-Host "  ✅ Botão flutuante WhatsApp SEMPRE visível (número padrão: 21 96556-5600)" -ForegroundColor White
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Rode o SQL no Supabase:" -ForegroundColor White
Write-Host "   - Acesse https://supabase.com/dashboard" -ForegroundColor DarkGray
Write-Host "   - SQL Editor > New query" -ForegroundColor DarkGray
Write-Host "   - Cole o conteúdo de 'supabase-company-settings.sql'" -ForegroundColor DarkGray
Write-Host "   - Clique em RUN" -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Faça commit e push:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor DarkGray
Write-Host "   git commit -m 'fix: corrige dados empresa + botao flutuante sempre visivel'" -ForegroundColor DarkGray
Write-Host "   git push" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. O botão flutuante agora aparece SEMPRE," -ForegroundColor Green
Write-Host "   mesmo sem o admin configurar nada!" -ForegroundColor Green
Write-Host ""
