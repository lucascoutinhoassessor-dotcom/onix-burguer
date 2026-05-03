# Script automático para corrigir Dados da Empresa + criar Suporte/Sugestões
# Projeto: Onix Burguer
# Execute no PowerShell como Administrador (ou usuário normal se tiver permissão)

$ErrorActionPreference = "Stop"
$projectPath = "C:\Users\Lucas\Projects\onix-burguer"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Script Automático - Onix Burguer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path $projectPath)) {
    Write-Error "Projeto não encontrado em: $projectPath"
    exit 1
}

Set-Location $projectPath
Write-Host "[OK] Projeto encontrado em: $projectPath" -ForegroundColor Green

# ============================================================================
# PARTE 1: Script SQL para criar tabela company_settings
# ============================================================================
Write-Host ""
Write-Host "[1/9] Criando script SQL..." -ForegroundColor Yellow

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

-- Habilitar RLS (Row Level Security)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações
CREATE POLICY "Allow all" ON company_settings
  FOR ALL USING (true) WITH CHECK (true);
"@

Set-Content -Path "$projectPath\supabase-company-settings.sql" -Value $sqlContent -Encoding UTF8
Write-Host "[OK] Script SQL criado: supabase-company-settings.sql" -ForegroundColor Green

# ============================================================================
# PARTE 2: Atualizar API /api/company/route.ts
# ============================================================================
Write-Host ""
Write-Host "[2/9] Atualizando API /api/company..." -ForegroundColor Yellow

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
Write-Host "[OK] API /api/company atualizada" -ForegroundColor Green

# ============================================================================
# PARTE 3: Atualizar formulário dados-empresa/page.tsx
# ============================================================================
Write-Host ""
Write-Host "[3/9] Atualizando formulário Dados da Empresa..." -ForegroundColor Yellow

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
Write-Host "[OK] Formulário Dados da Empresa atualizado" -ForegroundColor Green

# ============================================================================
# PARTE 4: Instalar Nodemailer
# ============================================================================
Write-Host ""
Write-Host "[4/9] Instalando Nodemailer..." -ForegroundColor Yellow

try {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    & 'C:\Program Files\nodejs\npm.cmd' install nodemailer --save 2>&1 | Out-Null
    & 'C:\Program Files\nodejs\npm.cmd' install -D @types/nodemailer 2>&1 | Out-Null
    Write-Host "[OK] Nodemailer instalado" -ForegroundColor Green
} catch {
    Write-Warning "Erro ao instalar Nodemailer. Tente manualmente: npm install nodemailer"
}

# ============================================================================
# PARTE 5: Criar API /api/support/route.ts
# ============================================================================
Write-Host ""
Write-Host "[5/9] Criando API de suporte..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path "$projectPath\src\app\api\support" -Force | Out-Null

$supportApiContent = @'
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP não configurado. E-mail não será enviado.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, category, description } = body;

    if (!type || !title || !category || !description) {
      return NextResponse.json(
        { success: false, error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["support", "suggestion"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Tipo inválido" },
        { status: 400 }
      );
    }

    const destinationEmail = process.env.DESTINATION_EMAIL;
    if (!destinationEmail) {
      return NextResponse.json(
        { success: false, error: "E-mail de destino não configurado" },
        { status: 500 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "Desconhecido";
    const ip = request.headers.get("x-forwarded-for") || "Desconhecido";

    const typeLabel = type === "support" ? "Solicitação de Suporte" : "Sugestão";
    const subject = `[${typeLabel}] ${title}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a1a; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .field-value { margin-top: 4px; font-size: 14px; }
          .description { background: #fff; padding: 12px; border-radius: 4px; border-left: 3px solid #f4a261; }
          .footer { margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0;">${typeLabel}</h2>
            <p style="margin:5px 0 0 0; opacity:0.8;">Painel Administrativo - Onix Burguer</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Título</div>
              <div class="field-value">${escapeHtml(title)}</div>
            </div>
            <div class="field">
              <div class="field-label">Categoria</div>
              <div class="field-value">${escapeHtml(category)}</div>
            </div>
            <div class="field">
              <div class="field-label">Descrição</div>
              <div class="field-value description">${escapeHtml(description).replace(/\n/g, "<br>")}</div>
            </div>
            <div class="field">
              <div class="field-label">Enviado por</div>
              <div class="field-value">Usuário do painel admin</div>
            </div>
            <div class="field">
              <div class="field-label">Data/Hora</div>
              <div class="field-value">${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>
          <div class="footer">
            <p>Este e-mail foi enviado automaticamente pelo painel administrativo.</p>
            <p>IP: ${ip} | User-Agent: ${userAgent}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${typeLabel}
================

Título: ${title}
Categoria: ${category}

Descrição:
${description}

Enviado por: Usuário do painel admin
Data/Hora: ${new Date().toLocaleString("pt-BR")}
    `.trim();

    const transporter = getTransporter();

    if (!transporter) {
      console.log("=== E-MAIL SIMULADO (SMTP não configurado) ===");
      console.log("Para:", destinationEmail);
      console.log("Assunto:", subject);
      console.log("==============================================");
      
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "E-mail simulado (SMTP não configurado). Configure as variáveis de ambiente SMTP_* para envio real."
      });
    }

    await transporter.sendMail({
      from: `"Painel Onix Burguer" <${process.env.SMTP_USER}>`,
      to: destinationEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: "E-mail enviado com sucesso!"
    });
  } catch (err: any) {
    console.error("POST /api/support error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao enviar: " + (err.message || String(err)) },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
'@

Set-Content -Path "$projectPath\src\app\api\support\route.ts" -Value $supportApiContent -Encoding UTF8
Write-Host "[OK] API /api/support criada" -ForegroundColor Green

# ============================================================================
# PARTE 6: Criar página /admin/suporte/page.tsx
# ============================================================================
Write-Host ""
Write-Host "[6/9] Criando página de Suporte..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path "$projectPath\src\app\admin\suporte" -Force | Out-Null

$suporteContent = @'
"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "Dúvida", label: "Dúvida" },
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
      setMessage({ text: "Preencha todos os campos obrigatórios", type: "error" });
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
          text: "Sua solicitação de suporte foi enviada com sucesso. Nossa equipe retornará em breve.",
          type: "success",
        });
        setForm({ title: "", category: "", description: "" });
      } else {
        setMessage({ text: data.error || "Erro ao enviar", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erro de conexão", type: "error" });
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
          Envie sua dúvida, reporte um bug ou solicite ajuda. Nossa equipe responderá em breve.
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
            TÍTULO / ASSUNTO *
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Não consigo alterar o cardápio"
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
            DESCRIÇÃO DETALHADA *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descreva seu problema com o máximo de detalhes possível..."
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
            {sending ? "Enviando..." : "Enviar Solicitação"}
          </button>
        </div>
      </form>
    </div>
  );
}
'@

Set-Content -Path "$projectPath\src\app\admin\suporte\page.tsx" -Value $suporteContent -Encoding UTF8
Write-Host "[OK] Página /admin/suporte criada" -ForegroundColor Green

# ============================================================================
# PARTE 7: Criar página /admin/sugestoes/page.tsx
# ============================================================================
Write-Host ""
Write-Host "[7/9] Criando página de Sugestões..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path "$projectPath\src\app\admin\sugestoes" -Force | Out-Null

$sugestoesContent = @'
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
      setMessage({ text: "Preencha todos os campos obrigatórios", type: "error" });
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
          text: "Obrigado por ajudar a melhorar nossa plataforma! Sua sugestão foi registrada.",
          type: "success",
        });
        setForm({ title: "", area: "", description: "" });
      } else {
        setMessage({ text: data.error || "Erro ao enviar", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erro de conexão", type: "error" });
    } finally {
      setSending(false);
      setTimeout(() => setMessage(null), 8000);
    }
  }

  return (
    <div className="p-6 pb-24 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-title text-2xl text-cream">Sugestões</h1>
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
            TÍTULO DA SUGESTÃO *
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Adicionar relatório de vendas por horário"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amberglow/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium tracking-wider text-cream/50">
            ÁREA DA PLATAFORMA *
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
            DESCRIÇÃO *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Descreva sua sugestão com detalhes. Como funcionaria? Qual o benefício?"
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
            {sending ? "Enviando..." : "Enviar Sugestão"}
          </button>
        </div>
      </form>
    </div>
  );
}
'@

Set-Content -Path "$projectPath\src\app\admin\sugestoes\page.tsx" -Value $sugestoesContent -Encoding UTF8
Write-Host "[OK] Página /admin/sugestoes criada" -ForegroundColor Green

# ============================================================================
# PARTE 8: Atualizar menu do admin (layout.tsx)
# ============================================================================
Write-Host ""
Write-Host "[8/9] Atualizando menu do admin..." -ForegroundColor Yellow

$layoutPath = "$projectPath\src\app\admin\layout.tsx"
$layoutContent = Get-Content -Raw $layoutPath

# Encontrar a posição depois do item "Dados da Empresa" e adicionar Suporte e Sugestões
$searchPattern = @'
  {
    href: "/admin/dados-empresa",
    label: "Dados da Empresa",
    exact: false,
    key: "dados-empresa",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z" />
      </svg>
    )
  }
'@

$replaceWith = @'
  {
    href: "/admin/dados-empresa",
    label: "Dados da Empresa",
    exact: false,
    key: "dados-empresa",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z" />
      </svg>
    )
  },
  {
    href: "/admin/suporte",
    label: "Suporte",
    exact: false,
    key: "suporte",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
      </svg>
    )
  },
  {
    href: "/admin/sugestoes",
    label: "Sugestões",
    exact: false,
    key: "sugestoes",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
      </svg>
    )
  }
'@

if ($layoutContent -match [regex]::Escape($searchPattern)) {
    $layoutContent = $layoutContent -replace [regex]::Escape($searchPattern), $replaceWith
    Set-Content -Path $layoutPath -Value $layoutContent -Encoding UTF8
    Write-Host "[OK] Menu do admin atualizado com Suporte e Sugestões" -ForegroundColor Green
} else {
    Write-Warning "Não foi possível encontrar o padrão exato no layout.tsx. Você precisará adicionar os itens de menu manualmente."
}

# ============================================================================
# PARTE 9: Atualizar .env.local e criar .env.example
# ============================================================================
Write-Host ""
Write-Host "[9/9] Atualizando variáveis de ambiente..." -ForegroundColor Yellow

# Adicionar DESTINATION_EMAIL ao .env.local se não existir
$envPath = "$projectPath\.env.local"
$envContent = Get-Content -Raw $envPath

if ($envContent -notmatch "DESTINATION_EMAIL") {
    $envContent += "`n# E-mail de destino para Suporte e Sugestões`nDESTINATION_EMAIL=lucascoutinho.assessor@gmail.com`n"
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host "[OK] DESTINATION_EMAIL adicionado ao .env.local" -ForegroundColor Green
} else {
    Write-Host "[INFO] DESTINATION_EMAIL já existe no .env.local" -ForegroundColor Cyan
}

# Criar .env.example
$envExample = @"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tbnvdilfpieqvpalegiu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...

# JWT secret para o painel admin
JWT_SECRET=...

# E-mail de destino para Suporte e Sugestões (NUNCA expor no front-end)
DESTINATION_EMAIL=lucascoutinho.assessor@gmail.com

# SMTP (configurar para envio real de e-mails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
"@

Set-Content -Path "$projectPath\.env.example" -Value $envExample -Encoding UTF8
Write-Host "[OK] .env.example criado" -ForegroundColor Green

# ============================================================================
# FINAL
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SCRIPT CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Rode o script SQL 'supabase-company-settings.sql' no Supabase SQL Editor" -ForegroundColor White
Write-Host "2. Configure as variáveis SMTP na Vercel (Settings > Environment Variables)" -ForegroundColor White
Write-Host "3. Faça commit e push:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor DarkGray
Write-Host "   git commit -m 'feat: corrige dados empresa + adiciona suporte e sugestoes'" -ForegroundColor DarkGray
Write-Host "   git push" -ForegroundColor DarkGray
Write-Host ""
Write-Host "IMPORTANTE: O .env.local NÃO deve ser commitado (já deve estar no .gitignore)" -ForegroundColor Red
Write-Host ""
