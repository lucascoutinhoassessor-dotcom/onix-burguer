import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .order("platform", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integrations: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { platform, api_key, api_secret, webhook_url, active = false } = body as {
    platform: string;
    api_key?: string | null;
    api_secret?: string | null;
    webhook_url?: string | null;
    active?: boolean;
  };

  if (!platform) {
    return NextResponse.json({ error: "platform é obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("integrations")
    .upsert({ platform, api_key: api_key ?? null, api_secret: api_secret ?? null, webhook_url: webhook_url ?? null, active }, { onConflict: "platform" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integration: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, ...rest } = body as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("integrations")
    .update(rest)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integration: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("integrations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
