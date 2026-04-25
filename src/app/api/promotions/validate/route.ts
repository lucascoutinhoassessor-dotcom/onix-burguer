import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Validate coupon code and return discount info
export async function POST(request: NextRequest) {
  const body = await request.json() as { code?: string; total?: number };
  const { code, total = 0 } = body;

  if (!code) return NextResponse.json({ valid: false, error: "Código não informado" });

  const { data: promo, error } = await supabaseAdmin
    .from("promotions")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .single();

  if (error || !promo) {
    return NextResponse.json({ valid: false, error: "Cupom inválido ou expirado" });
  }

  const now = new Date();

  if (promo.start_at && new Date(promo.start_at) > now) {
    return NextResponse.json({ valid: false, error: "Cupom ainda não está ativo" });
  }

  if (promo.end_at && new Date(promo.end_at) < now) {
    return NextResponse.json({ valid: false, error: "Cupom expirado" });
  }

  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ valid: false, error: "Cupom esgotado" });
  }

  if (total < promo.min_order) {
    return NextResponse.json({
      valid: false,
      error: `Pedido mínimo de R$ ${Number(promo.min_order).toFixed(2)} para este cupom`
    });
  }

  let discount = 0;
  if (promo.type === "percent") {
    discount = (total * Number(promo.value)) / 100;
  } else if (promo.type === "fixed") {
    discount = Math.min(Number(promo.value), total);
  }

  return NextResponse.json({
    valid: true,
    discount,
    promotion: {
      id: promo.id,
      name: promo.name,
      type: promo.type,
      value: promo.value
    }
  });
}
