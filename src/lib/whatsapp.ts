import { supabaseAdmin } from "@/lib/supabase";

export type WhatsAppConfig = {
  id: string;
  phone_number_id: string;
  access_token: string;
  business_account_id: string | null;
  webhook_verify_token: string | null;
  status: string;
};

export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  const { data } = await supabaseAdmin
    .from("whatsapp_config")
    .select("*")
    .limit(1)
    .maybeSingle();
  return data as WhatsAppConfig | null;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  config?: WhatsAppConfig | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const cfg = config ?? (await getWhatsAppConfig());

    if (!cfg || cfg.status !== "connected") {
      return { success: false, error: "WhatsApp Business API não configurado ou desconectado" };
    }

    const digits = phone.replace(/\D/g, "");
    const toPhone = digits.startsWith("55") ? digits : `55${digits}`;

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${cfg.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toPhone,
          type: "text",
          text: { body: message }
        })
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
      const errMsg = errBody?.error?.message ?? `HTTP ${res.status}`;
      return { success: false, error: errMsg };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function testWhatsAppConnection(
  phone_number_id: string,
  access_token: string
): Promise<{ success: boolean; display_phone_number?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phone_number_id}?fields=display_phone_number,verified_name&access_token=${access_token}`,
      { method: "GET" }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
      const errMsg = errBody?.error?.message ?? `HTTP ${res.status}`;
      return { success: false, error: errMsg };
    }

    const data = await res.json() as { display_phone_number?: string; verified_name?: string };
    return { success: true, display_phone_number: data.display_phone_number };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
