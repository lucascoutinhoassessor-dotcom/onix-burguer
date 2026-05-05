import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TEST_NAMES = [
  "João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa",
  "Carlos Ferreira", "Lucia Almeida", "Rafael Souza", "Beatriz Lima"
];

const TEST_ITEMS = [
  [
    { name: "Smash Burguer", quantity: 1, unitPrice: 32.9 },
    { name: "Batata Frita M", quantity: 1, unitPrice: 14.9 }
  ],
  [
    { name: "Bacon Classic", quantity: 2, unitPrice: 28.9 },
    { name: "Coca-Cola 350ml", quantity: 2, unitPrice: 7.9 }
  ],
  [
    { name: "Veggie Burger", quantity: 1, unitPrice: 26.9 },
    { name: "Milkshake Chocolate", quantity: 1, unitPrice: 18.9 }
  ],
  [
    { name: "Combo Família", quantity: 1, unitPrice: 89.9 }
  ]
];

// POST /api/admin/test-order — creates a fake order + financial entry for testing
export async function POST(_request: NextRequest) {
  try {
    const name = TEST_NAMES[Math.floor(Math.random() * TEST_NAMES.length)];
    const items = TEST_ITEMS[Math.floor(Math.random() * TEST_ITEMS.length)];
    const total = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const orderId = `TESTE-${Date.now().toString().slice(-6)}`;
    const fulfillmentMode = Math.random() > 0.5 ? "delivery" : "local";
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_id: orderId,
        customer_name: name,
        customer_phone: `119${Math.floor(10000000 + Math.random() * 89999999)}`,
        customer_email: null,
        items,
        total,
        status: "pending",
        payment_method: "test",
        fulfillment_mode: fulfillmentMode,
        payment_id: null
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("order_status_history").insert({
      order_id: orderId,
      status: "pending"
    });

    // Auto-create financial income entry linked to this order
    await supabaseAdmin.from("financial_entries").insert({
      type: "income",
      category: "Vendas",
      description: `Pedido #${orderId} — ${name}`,
      amount: total,
      due_date: today,
      status: "pending",
      order_id: orderId
    });

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("POST /api/admin/test-order error:", err);
    return NextResponse.json({ success: false, error: "Erro ao criar pedido teste." }, { status: 500 });
  }
}
