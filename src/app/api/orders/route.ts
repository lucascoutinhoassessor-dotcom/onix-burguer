import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { OrderStatus } from "@/lib/supabase";

// GET /api/orders?status=pending&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const date = searchParams.get("date"); // YYYY-MM-DD

    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (date) {
      query = query.gte("created_at", `${date}T00:00:00Z`).lte("created_at", `${date}T23:59:59Z`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, orders: data, total: count });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ success: false, error: "Erro ao listar pedidos." }, { status: 500 });
  }
}

// POST /api/orders — called by payment route to persist order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      order_id,
      customer_name,
      customer_phone,
      customer_email,
      items,
      total,
      status = "pending",
      payment_method,
      fulfillment_mode,
      payment_id
    } = body;

    if (!order_id || !customer_name || !customer_phone || !items || total === undefined) {
      return NextResponse.json({ success: false, error: "Dados incompletos." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_id,
        customer_name,
        customer_phone,
        customer_email: customer_email ?? null,
        items,
        total,
        status,
        payment_method,
        fulfillment_mode: fulfillment_mode ?? "local",
        payment_id: payment_id ?? null
      })
      .select()
      .single();

    if (error) throw error;

    // Record status history
    await supabaseAdmin.from("order_status_history").insert({
      order_id,
      status
    });

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ success: false, error: "Erro ao salvar pedido." }, { status: 500 });
  }
}

// PATCH /api/orders?id=ONIX-xxx&status=preparing
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { order_id: string; status: OrderStatus };
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ success: false, error: "order_id e status são obrigatórios." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("order_id", order_id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("order_status_history").insert({ order_id, status });

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("PATCH /api/orders error:", err);
    return NextResponse.json({ success: false, error: "Erro ao atualizar pedido." }, { status: 500 });
  }
}
