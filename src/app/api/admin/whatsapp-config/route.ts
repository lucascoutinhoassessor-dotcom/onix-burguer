import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { testWhatsAppConnection } from "@/lib/whatsapp";

// GET /api/admin/whatsapp-config — fetch config (access_token masked)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("whatsapp_config")
    .select("id, phone_number_id, business_account_id, webhook_verify_token, status, created_at, updated_at")
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}

// POST /api/admin/whatsapp-config — upsert config
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  const body = await request.json() as {
    phone_number_id?: string;
    access_token?: string;
    business_account_id?: string;
    webhook_verify_token?: string;
  };

  // action=test — verify credentials without saving
  if (action === "test") {
    const { phone_number_id, access_token } = body;
    if (!phone_number_id || !access_token) {
      return NextResponse.json({ error: "phone_number_id e access_token são obrigatórios" }, { status: 400 });
    }

    const result = await testWhatsAppConnection(phone_number_id, access_token);

    // Update status in DB if config exists
    const { data: existing } = await supabaseAdmin
      .from("whatsapp_config")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("whatsapp_config")
        .update({ status: result.success ? "connected" : "error", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    return NextResponse.json(result);
  }

  // Normal save
  const { phone_number_id, access_token, business_account_id, webhook_verify_token } = body;

  if (!phone_number_id || !access_token) {
    return NextResponse.json({ error: "phone_number_id e access_token são obrigatórios" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("whatsapp_config")
    .select("id")
    .limit(1)
    .maybeSingle();

  let result;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("whatsapp_config")
      .update({
        phone_number_id,
        access_token,
        business_account_id: business_account_id || null,
        webhook_verify_token: webhook_verify_token || null,
        status: "disconnected",
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .select("id, phone_number_id, business_account_id, webhook_verify_token, status")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("whatsapp_config")
      .insert({
        phone_number_id,
        access_token,
        business_account_id: business_account_id || null,
        webhook_verify_token: webhook_verify_token || null,
        status: "disconnected"
      })
      .select("id, phone_number_id, business_account_id, webhook_verify_token, status")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json({ config: result });
}
