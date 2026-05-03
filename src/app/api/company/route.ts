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
        note: "Tabela company_settings ainda nÃ£o existe. Rode o script SQL no Supabase."
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
        { success: false, error: "Nome e slug sÃ£o obrigatÃ³rios" }, 
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
          error: "A tabela 'company_settings' nÃ£o existe no banco de dados. Por favor, rode o script SQL 'supabase-company-settings.sql' no Supabase SQL Editor." 
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
