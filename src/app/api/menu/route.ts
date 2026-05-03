import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/menu
export async function GET() {
  try {
    // Buscar categorias primeiro
    const { data: categories, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id, slug, name");
    
    if (catError) throw catError;
    
    // Criar mapa de id -> slug
    const categoryMap = new Map();
    categories?.forEach(cat => {
      categoryMap.set(cat.id, cat.slug);
    });
    
    // Buscar itens
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true });

    if (itemsError) throw itemsError;

    // Mapear para incluir o slug da categoria
    const mappedItems = items?.map(item => ({
      ...item,
      category: categoryMap.get(item.category) || item.category
    })) || [];

    // Retornar com headers para evitar cache
    return NextResponse.json(
      { success: true, items: mappedItems },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
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

    // Buscar UUID da categoria a partir do slug
    const { data: catData, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();
    
    if (catError || !catData) {
      console.error("POST /api/menu - Categoria não encontrada:", category);
      return NextResponse.json({ success: false, error: "Categoria não encontrada." }, { status: 400 });
    }

    console.log("POST /api/menu - Inserting item with id:", id, "category UUID:", catData.id);

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .insert({ 
        id, 
        name, 
        description, 
        price, 
        category: catData.id, 
        image, 
        active: active ?? true, 
        option_groups: option_groups ?? [], 
        sort_order: sort_order ?? 0 
      })
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

    console.log("[API PATCH] Request received:", JSON.stringify(body, null, 2));

    if (!id) {
      console.error("[API PATCH] ERROR: id is missing");
      return NextResponse.json({ success: false, error: "id é obrigatório." }, { status: 400 });
    }

    // Se estiver atualizando a categoria, converter slug para UUID
    if (updates.category) {
      const { data: catData, error: catError } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", updates.category)
        .single();
      
      if (catError || !catData) {
        console.error("[API PATCH] Categoria não encontrada:", updates.category);
        return NextResponse.json({ success: false, error: "Categoria não encontrada." }, { status: 400 });
      }
      
      updates.category = catData.id;
      console.log("[API PATCH] Converted category slug to UUID:", catData.id);
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[API PATCH] Supabase error:", JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data) {
      console.error("[API PATCH] ERROR: No data returned from Supabase");
      return NextResponse.json({ success: false, error: "Item não encontrado ou não atualizado." }, { status: 404 });
    }

    console.log("[API PATCH] Success - Updated item:", JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    console.error("[API PATCH] Unhandled error:", err);
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

// PUT /api/menu - reordenar (bulk update)
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

    for (const item of items) {
      const { error } = await supabaseAdmin
        .from("menu_items")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);

      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: "Ordem atualizada" });
  } catch (err) {
    console.error("PUT /api/menu error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao reordenar itens." },
      { status: 500 }
    );
  }
}
