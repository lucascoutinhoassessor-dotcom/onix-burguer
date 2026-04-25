import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { identifier } = body as { identifier: string };

  if (!identifier) {
    return NextResponse.json(
      { error: "Informe seu e-mail ou telefone" },
      { status: 400 }
    );
  }

  const trimmed = identifier.trim();
  const isEmail = trimmed.includes("@");

  let customer: { id: string; name: string; phone: string; email: string | null } | null = null;

  if (isEmail) {
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id, name, phone, email")
      .eq("email", trimmed.toLowerCase())
      .maybeSingle();
    customer = data;
  } else {
    const cleanPhone = trimmed.replace(/\D/g, "");
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id, name, phone, email")
      .eq("phone", cleanPhone)
      .maybeSingle();
    customer = data;
  }

  if (!customer) {
    return NextResponse.json(
      { error: "Email ou telefone não cadastrado" },
      { status: 404 }
    );
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Invalidate old codes
  await supabaseAdmin
    .from("password_resets")
    .update({ used: true })
    .eq("customer_id", customer.id)
    .eq("used", false);

  // Save new OTP
  const { error } = await supabaseAdmin.from("password_resets").insert({
    customer_id: customer.id,
    code,
    expires_at: expiresAt,
    used: false
  });

  if (error) {
    return NextResponse.json({ error: "Erro ao gerar código" }, { status: 500 });
  }

  const hasEmail = !!customer.email;
  const hasPhone = !!customer.phone;

  // Build WhatsApp message
  const whatsappMessage = [
    `*Onix Burguer* - Recuperação de senha`,
    ``,
    `Olá, ${customer.name.split(" ")[0]}!`,
    ``,
    `Seu código de verificação é: *${code}*`,
    ``,
    `Válido por 15 minutos.`,
    `Se não foi você, ignore esta mensagem.`
  ].join("\n");

  // Send via WhatsApp Business API if phone is available and config is active
  let whatsappSent = false;
  if (hasPhone) {
    const result = await sendWhatsAppMessage(customer.phone, whatsappMessage);
    whatsappSent = result.success;
  }

  // Determine which channels were used and build response message
  const channels: string[] = [];
  if (hasEmail) channels.push("email");
  if (hasPhone && whatsappSent) channels.push("WhatsApp");

  let message: string;
  if (channels.length === 2) {
    message = "Código enviado para seu e-mail e WhatsApp.";
  } else if (hasEmail && (!hasPhone || !whatsappSent)) {
    message = "Código enviado para seu e-mail. Verifique sua caixa de entrada.";
  } else if (hasPhone && whatsappSent) {
    message = "Código enviado via WhatsApp. Verifique suas mensagens.";
  } else {
    message = "Código gerado. Use o código abaixo para redefinir sua senha.";
  }

  // Show code on screen when email exists (simulated) or when no channel worked
  const showCodeOnScreen = hasEmail || (!whatsappSent);

  return NextResponse.json({
    success: true,
    method: hasEmail && hasPhone ? "both" : hasEmail ? "email" : "whatsapp",
    message,
    ...(showCodeOnScreen ? { code } : {})
  });
}
