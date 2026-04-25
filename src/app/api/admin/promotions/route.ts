import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promotions: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  const { data, error } = await supabaseAdmin
    .from("promotions")
    .insert({
      name: body.name,
      type: body.type ?? "percent",
      value: Number(body.value ?? 0),
      code: body.code || null,
      min_order: Number(body.min_order ?? 0),
      start_at: body.start_at || null,
      end_at: body.end_at || null,
      active: body.active !== false,
      max_uses: body.max_uses ? Number(body.max_uses) : null
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promotion: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("promotions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promotion: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("promotions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
