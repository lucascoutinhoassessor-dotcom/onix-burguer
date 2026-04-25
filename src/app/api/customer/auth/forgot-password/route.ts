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
      // Log in marketing campaigns for audit
      await supabaseAdmin.from("marketing_campaigns").insert({
        type: "individual",
        target: phone,
        filters: null,
        message,
        status: "draft",
        sent_at: new Date().toISOString(),
        delivered_count: 0
      });
      return false;
    }

    // Call Meta WhatsApp Business Cloud API
    // api_key = Bearer token; api_secret = Phone Number ID
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

  let customer: { id: string; name: string; phone: string } | null = null;

  if (isEmail) {
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id, name, phone")
      .eq("email", trimmed.toLowerCase())
      .maybeSingle();
    customer = data;
  } else {
    const cleanPhone = trimmed.replace(/\D/g, "");
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id, name, phone")
      .eq("phone", cleanPhone)
      .maybeSingle();
    customer = data;
  }

  // Always return success to avoid account enumeration
  if (!customer) {
    return NextResponse.json({
      success: true,
      message: "Se uma conta for encontrada, você receberá o código no WhatsApp."
    });
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

  // Send via WhatsApp
  const message = [
    `*Onix Burguer* - Recuperação de senha`,
    ``,
    `Olá, ${customer.name.split(" ")[0]}!`,
    ``,
    `Seu código de verificação é: *${code}*`,
    ``,
    `Válido por 15 minutos.`,
    `Se não foi você, ignore esta mensagem.`
  ].join("\n");

  await sendWhatsAppMessage(customer.phone, message);

  return NextResponse.json({
    success: true,
    message: "Se uma conta for encontrada, você receberá o código no WhatsApp.",
    // In dev mode expose the code for testing (remove in production)
    ...(process.env.NODE_ENV !== "production" ? { _dev_code: code } : {})
  });
}
