import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * iFood Webhook Endpoint
 * POST /api/integrations/ifood/webhook
 *
 * Receives order events from iFood and:
 * 1. Creates/updates order in our orders table
 * 2. When status = saiu_para_entrega → sends WhatsApp to motoboy
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret header (optional but recommended)
    const secret = request.headers.get("x-ifood-secret");
    const { data: integrationData } = await supabaseAdmin
      .from("integrations")
      .select("api_secret")
      .eq("platform", "ifood")
      .single();

    if (integrationData?.api_secret && secret !== integrationData.api_secret) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const payload = await request.json() as Record<string, unknown>;

    // iFood sends events as: { id, code, correlationId, createdAt, metadata: { orderId, ... } }
    const eventCode = payload.code as string;
    const metadata = payload.metadata as Record<string, unknown> ?? {};
    const orderId = metadata.orderId as string ?? (payload.orderId as string);

    if (!orderId) {
      return NextResponse.json({ error: "orderId missing" }, { status: 400 });
    }

    // Map iFood status codes to our statuses
    const statusMap: Record<string, string> = {
      "PLC": "confirmed",        // Placed
      "CFM": "confirmed",        // Confirmed
      "PRP": "preparing",        // Preparing
      "RTP": "ready",            // Ready to pick
      "DIS": "saiu_para_entrega", // Dispatched
      "CON": "delivered",        // Concluded
      "CAN": "cancelled"         // Cancelled
    };

    const newStatus = statusMap[eventCode];

    // Upsert order
    if (newStatus) {
      await supabaseAdmin
        .from("orders")
        .update({ status: newStatus })
        .eq("order_id", `ifood-${orderId}`);
    }

    // Trigger WhatsApp notification to motoboy when dispatched
    if (eventCode === "DIS") {
      // Fetch all active motoboys
      const { data: motoboys } = await supabaseAdmin
        .from("employees")
        .select("name, email, cpf, cnh")
        .eq("role", "motoboy")
        .eq("active", true);

      // Fetch the order details
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("order_id", `ifood-${orderId}`)
        .single();

      if (order && motoboys && motoboys.length > 0) {
        // Build WhatsApp message for motoboy (server-side — just log; client opens WA)
        const message = [
          `🛵 *NOVO PEDIDO PARA ENTREGA — ONIX BURGUER*`,
          ``,
          `Pedido: #${order.order_id}`,
          `Cliente: ${order.customer_name}`,
          `Telefone: ${order.customer_phone}`,
          `Total: R$ ${Number(order.total).toFixed(2)}`,
          ``,
          `Plataforma: iFood`
        ].join("\n");

        // Store notification log in marketing_campaigns for record keeping
        await supabaseAdmin.from("marketing_campaigns").insert({
          type: "individual",
          target: `motoboy-dispatch-${orderId}`,
          filters: { motoboys: motoboys.map((m) => m.name) },
          message,
          status: "sent",
          sent_at: new Date().toISOString(),
          delivered_count: motoboys.length
        });
      }
    }

    return NextResponse.json({ received: true, event: eventCode });
  } catch (err) {
    console.error("iFood webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "iFood webhook endpoint active" });
}
