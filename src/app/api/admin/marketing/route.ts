import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { type, target, filters, message, delivered_count = 0 } = body as {
    type: "individual" | "mass";
    target: string | null;
    filters: unknown;
    message: string;
    delivered_count?: number;
  };

  if (!message) {
    return NextResponse.json({ error: "message é obrigatória" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("marketing_campaigns")
    .insert({
      type,
      target,
      filters,
      message,
      status: "sent",
      sent_at: new Date().toISOString(),
      delivered_count
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("marketing_campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
