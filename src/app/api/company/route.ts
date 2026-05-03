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
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/company error:", err);
    return NextResponse.json({ success: false, error: "Erro ao buscar dados" }, { status: 500 });
  }
}

// POST /api/company - salvar/atualizar dados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, logo_url, address, instagram, whatsapp, description, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: "Nome e slug são obrigatórios" }, { status: 400 });
    }

    // Verificar se já existe registro
    const { data: existing } = await supabaseAdmin
      .from("company_settings")
      .select("id")
      .single();

    let result;
    if (existing) {
      // Update
      result = await supabaseAdmin
        .from("company_settings")
        .update({ name, logo_url, address, instagram, whatsapp, description, slug, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabaseAdmin
        .from("company_settings")
        .insert({ name, logo_url, address, instagram, whatsapp, description, slug })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("POST /api/company error:", err);
    return NextResponse.json({ success: false, error: "Erro ao salvar dados" }, { status: 500 });
  }
}
