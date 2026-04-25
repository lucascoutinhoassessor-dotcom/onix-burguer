import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { OrderStatus } from "@/lib/supabase";
import { ORDER_STATUS_LABELS } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/checkout";

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

    // Auto-create financial income entry linked to this order
    const today = new Date().toISOString().split("T")[0];
    await supabaseAdmin.from("financial_entries").insert({
      type: "income",
      category: "Vendas",
      description: `Pedido #${order_id} — ${customer_name}`,
      amount: Number(total),
      due_date: today,
      status: "pending",
      order_id
    });

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ success: false, error: "Erro ao salvar pedido." }, { status: 500 });
  }
}

// PATCH /api/orders — update order status and notify customer via WhatsApp
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

    // Update financial entry status when order is delivered or cancelled
    if (status === "delivered") {
      await supabaseAdmin
        .from("financial_entries")
        .update({ status: "paid" })
        .eq("order_id", order_id);
    } else if (status === "cancelled") {
      // Mark as overdue/cancelled — use description update to flag it
      await supabaseAdmin
        .from("financial_entries")
        .update({ status: "overdue", description: `[CANCELADO] Pedido #${order_id}` })
        .eq("order_id", order_id)
        .eq("type", "income");
    }

    // Send WhatsApp notification to customer (non-blocking)
    try {
      if (data?.customer_phone && status !== "pending" && status !== "cancelled") {
        const statusMessages: Partial<Record<OrderStatus, string>> = {
          confirmed: "seu pedido foi confirmado e logo entrará em preparo.",
          preparing: "seu pedido está sendo preparado com muito carinho.",
          ready: "seu pedido está pronto! Passaremos para entrega em breve.",
          saiu_para_entrega: "seu pedido saiu para entrega! Nosso entregador está a caminho.",
          delivered: "seu pedido foi entregue. Obrigado pela preferência!"
        };

        const statusDetail = statusMessages[status];
        if (statusDetail) {
          const firstName = String(data.customer_name).split(" ")[0];
          const message = [
            `🍔 *ONIX BURGUER - Atualização do Pedido*`,
            ``,
            `Olá, ${firstName}!`,
            ``,
            `Pedido #${order_id}`,
            `Status: *${ORDER_STATUS_LABELS[status]}*`,
            ``,
            statusDetail,
            ``,
            `Valor total: ${formatCurrency(Number(data.total))}`,
            ``,
            `Qualquer dúvida, fale conosco. 😊`
          ].join("\n");

          await sendWhatsAppMessage(String(data.customer_phone), message);
        }
      }
    } catch (waErr) {
      console.error("WhatsApp notification failed (non-critical):", waErr);
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("PATCH /api/orders error:", err);
    return NextResponse.json({ success: false, error: "Erro ao atualizar pedido." }, { status: 500 });
  }
}
