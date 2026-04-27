import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/menu
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("category", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, items: data });
  } catch (err) {
    console.error("GET /api/menu error:", err);
    return NextResponse.json({ success: false, error: "Erro ao listar cardápio." }, { status: 500 });
  }
}

// POST /api/menu — create item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, price, category, image, active, option_groups, sort_order } = body;

    console.log("POST /api/menu - Request body:", JSON.stringify(body));

    if (!id || !name || price === undefined || !category) {
      console.log("POST /api/menu - Validation failed:", { id, name, price, category });
      return NextResponse.json({ success: false, error: "Campos obrigatórios: id, name, price, category." }, { status: 400 });
    }

    console.log("POST /api/menu - Inserting item with id:", id);

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .insert({ id, name, description, price, category, image, active: active ?? true, option_groups: option_groups ?? [], sort_order: sort_order ?? 0 })
      .select()
      .single();

    if (error) {
      console.error("POST /api/menu - Supabase error:", error);
      throw error;
    }

    console.log("POST /api/menu - Success:", JSON.stringify(data));
    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    console.error("POST /api/menu error:", err);
    return NextResponse.json({ success: false, error: "Erro ao criar item." }, { status: 500 });
  }
}

// PATCH /api/menu — update item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    console.log("PATCH /api/menu - Request body:", JSON.stringify(body));

    if (!id) {
      console.log("PATCH /api/menu - Error: id is missing");
      return NextResponse.json({ success: false, error: "id é obrigatório." }, { status: 400 });
    }

    console.log("PATCH /api/menu - Updating item:", id, "with updates:", JSON.stringify(updates));

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/menu - Supabase error:", error);
      throw error;
    }

    console.log("PATCH /api/menu - Success:", JSON.stringify(data));
    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    console.error("PATCH /api/menu error:", err);
    return NextResponse.json({ success: false, error: "Erro ao atualizar item." }, { status: 500 });
  }
}

// DELETE /api/menu?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id é obrigatório." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/menu error:", err);
    return NextResponse.json({ success: false, error: "Erro ao remover item." }, { status: 500 });
  }
}
