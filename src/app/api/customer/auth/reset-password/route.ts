import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { identifier, code, newPassword } = body as {
    identifier: string;
    code: string;
    newPassword: string;
  };

  if (!identifier || !code || !newPassword) {
    return NextResponse.json(
      { error: "Identificador, código e nova senha são obrigatórios" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Senha deve ter pelo menos 6 caracteres" },
      { status: 400 }
    );
  }

  const trimmed = identifier.trim();
  const isEmail = trimmed.includes("@");

  let customer: { id: string } | null = null;

  if (isEmail) {
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id")
      .eq("email", trimmed.toLowerCase())
      .maybeSingle();
    customer = data;
  } else {
    const cleanPhone = trimmed.replace(/\D/g, "");
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();
    customer = data;
  }

  if (!customer) {
    return NextResponse.json(
      { error: "Código inválido ou expirado" },
      { status: 400 }
    );
  }

  // Find valid OTP
  const { data: reset } = await supabaseAdmin
    .from("password_resets")
    .select("id, expires_at")
    .eq("customer_id", customer.id)
    .eq("code", code.trim())
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reset) {
    return NextResponse.json(
      { error: "Código inválido ou expirado" },
      { status: 400 }
    );
  }

  // Mark OTP as used
  await supabaseAdmin
    .from("password_resets")
    .update({ used: true })
    .eq("id", reset.id);

  // Update password
  const password_hash = await bcrypt.hash(String(newPassword), 12);

  const { error } = await supabaseAdmin
    .from("customer_accounts")
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq("id", customer.id);

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar senha" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Senha atualizada com sucesso!" });
}
