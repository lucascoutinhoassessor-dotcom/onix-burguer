import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/categories - listar todas
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, categories: data });
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao listar categorias." },
      { status: 500 }
    );
  }
}

// POST /api/categories - criar nova
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, sort_order } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Nome e slug sao obrigatorios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({ name, slug, sort_order: sort_order ?? 0 })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (err) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao criar categoria." },
      { status: 500 }
    );
  }
}

// PATCH /api/categories - atualizar
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID e obrigatorio." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (err) {
    console.error("PATCH /api/categories error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar categoria." },
      { status: 500 }
    );
  }
}

// PUT /api/categories - reordenar (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Lista de itens e obrigatoria." },
        { status: 400 }
      );
    }

    // Atualizar cada categoria com sua nova ordem
    for (const item of items) {
      const { error } = await supabaseAdmin
        .from("categories")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);

      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "Ordem atualizada" });
  } catch (err) {
    console.error("PUT /api/categories error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao reordenar categorias." },
      { status: 500 }
    );
  }
}

// DELETE /api/categories - deletar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID e obrigatorio." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/categories error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao excluir categoria." },
      { status: 500 }
    );
  }
}
