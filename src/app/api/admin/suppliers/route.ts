import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suppliers: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { name, legal_name, phone, cnpj_cpf, email, address } = body as {
    name: string;
    legal_name?: string | null;
    phone?: string | null;
    cnpj_cpf?: string | null;
    email?: string | null;
    address?: string | null;
  };

  if (!name) {
    return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .insert({ name, legal_name: legal_name ?? null, phone: phone ?? null, cnpj_cpf: cnpj_cpf ?? null, email: email ?? null, address: address ?? null })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ supplier: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, ...rest } = body as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .update(rest)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ supplier: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("suppliers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
