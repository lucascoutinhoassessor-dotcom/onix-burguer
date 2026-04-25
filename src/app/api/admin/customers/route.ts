import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { CustomerOrigin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin") as CustomerOrigin | null;
  const registered_from = searchParams.get("registered_from");
  const registered_to = searchParams.get("registered_to");
  const last_order_days = searchParams.get("last_order_days");
  const search = searchParams.get("search");

  let query = supabaseAdmin
    .from("customer_accounts")
    .select("*")
    .order("registered_at", { ascending: false });

  if (origin) query = query.eq("origin", origin);
  if (registered_from) query = query.gte("registered_at", registered_from);
  if (registered_to) query = query.lte("registered_at", registered_to + "T23:59:59");
  if (last_order_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(last_order_days));
    query = query.gte("last_order_at", cutoff.toISOString());
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data, total: data?.length ?? 0 });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { phone, name, email, origin = "manual" } = body as {
    phone: string;
    name: string;
    email?: string | null;
    origin?: CustomerOrigin;
  };

  if (!phone || !name) {
    return NextResponse.json({ error: "phone e name são obrigatórios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("customer_accounts")
    .insert({ phone, name, email: email ?? null, origin, registered_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, ...rest } = body as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("customer_accounts")
    .update(rest)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("customer_accounts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
