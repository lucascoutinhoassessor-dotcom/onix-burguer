import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'income' | 'expense'
  const status = searchParams.get("status");
  const month = searchParams.get("month"); // YYYY-MM

  let query = supabaseAdmin
    .from("financial_entries")
    .select("*")
    .order("due_date", { ascending: false });

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (month) {
    query = query
      .gte("due_date", `${month}-01`)
      .lte("due_date", `${month}-31`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary totals
  const entries = data ?? [];
  const totalIncome = entries
    .filter((e) => e.type === "income" && e.status === "paid")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = entries
    .filter((e) => e.type === "expense" && e.status === "paid")
    .reduce((s, e) => s + Number(e.amount), 0);

  return NextResponse.json({
    entries,
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  const { data, error } = await supabaseAdmin
    .from("financial_entries")
    .insert({
      type: body.type ?? "expense",
      category: body.category,
      description: body.description,
      amount: Number(body.amount ?? 0),
      due_date: body.due_date,
      status: body.status ?? "pending",
      order_id: body.order_id ?? null
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("financial_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("financial_entries").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PUT /api/admin/financial — sync orders without financial entries
export async function PUT() {
  try {
    // Get all non-cancelled, non-pending orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("order_id, customer_name, total, created_at, status")
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return NextResponse.json({ synced: 0, message: "Nenhum pedido encontrado." });
    }

    // Get existing financial entries that have an order_id
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("financial_entries")
      .select("order_id")
      .not("order_id", "is", null);

    if (existingError) throw existingError;

    const existingOrderIds = new Set((existing ?? []).map((e) => e.order_id as string));

    // Find orders without financial entries
    const missing = orders.filter((o) => !existingOrderIds.has(o.order_id));

    if (missing.length === 0) {
      return NextResponse.json({ synced: 0, message: "Todos os pedidos já têm lançamento financeiro." });
    }

    // Create financial entries for missing orders
    const toInsert = missing.map((o) => ({
      type: "income",
      category: "Vendas",
      description: `Pedido #${o.order_id} — ${o.customer_name}`,
      amount: Number(o.total),
      due_date: new Date(o.created_at).toISOString().split("T")[0],
      status: o.status === "delivered" ? "paid" : "pending",
      order_id: o.order_id
    }));

    const { error: insertError } = await supabaseAdmin
      .from("financial_entries")
      .insert(toInsert);

    if (insertError) throw insertError;

    return NextResponse.json({
      synced: missing.length,
      message: `${missing.length} lançamento${missing.length !== 1 ? "s" : ""} criado${missing.length !== 1 ? "s" : ""}.`
    });
  } catch (err) {
    console.error("PUT /api/admin/financial error:", err);
    return NextResponse.json({ error: "Erro ao sincronizar." }, { status: 500 });
  }
}
