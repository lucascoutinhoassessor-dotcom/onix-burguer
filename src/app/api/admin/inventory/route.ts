import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("inventory_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data ?? [];
  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.min_quantity));

  return NextResponse.json({ items, lowStock });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  const { data, error } = await supabaseAdmin
    .from("inventory_items")
    .insert({
      name: body.name,
      unit: body.unit ?? "un",
      quantity: Number(body.quantity ?? 0),
      min_quantity: Number(body.min_quantity ?? 0),
      cost_price: Number(body.cost_price ?? 0)
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("inventory_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("inventory_items").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
