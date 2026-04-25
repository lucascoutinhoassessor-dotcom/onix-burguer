import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const { data: integration } = await supabaseAdmin
      .from("integrations")
      .select("api_key, api_secret, active")
      .eq("platform", "whatsapp")
      .maybeSingle();

    if (!integration?.active || !integration.api_key) {
      return false;
    }

    const phoneNumberId = integration.api_secret;
    const token = integration.api_key;
    const waPhone = phone.startsWith("55") ? phone : `55${phone}`;

    const res = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: waPhone,
          type: "text",
          text: { body: message }
        })
      }
    );

    return res.ok;
  } catch {
    return false;
  }
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

  // Return 404 if not found
  if (!customer) {
    return NextResponse.json(
      { error: "Email ou telefone não cadastrado" },
      { status: 404 }
    );
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

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

  // Send via WhatsApp if phone is available
  let whatsappSent = false;
  if (hasPhone) {
    whatsappSent = await sendWhatsAppMessage(customer.phone, whatsappMessage);
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
    // Fallback: neither channel worked — show code on screen
    message = "Código gerado. Use o código abaixo para redefinir sua senha.";
  }

  // Determine whether to expose the code on screen (email simulation or no channel available)
  const showCodeOnScreen = hasEmail || (!whatsappSent);

  return NextResponse.json({
    success: true,
    method: hasEmail && hasPhone ? "both" : hasEmail ? "email" : "whatsapp",
    message,
    // Simulate email: always show code when email exists (email sending is simulated)
    ...(showCodeOnScreen ? { code } : {})
  });
}
