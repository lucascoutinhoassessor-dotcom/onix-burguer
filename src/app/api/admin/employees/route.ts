import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import type { EmployeeRole } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("id, email, name, role, active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { email, name, password, role = "staff", active = true } = body as {
    email: string;
    name: string;
    password: string;
    role?: EmployeeRole;
    active?: boolean;
  };

  if (!email || !name || !password) {
    return NextResponse.json({ error: "email, name e password são obrigatórios" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(String(password), 12);

  const { data, error } = await supabaseAdmin
    .from("employees")
    .insert({ email, name, password_hash, role, active })
    .select("id, email, name, role, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employee: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { id, password, ...rest } = body as { id: string; password?: string; [key: string]: unknown };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = { ...rest };
  if (password) {
    updates.password_hash = await bcrypt.hash(String(password), 12);
  }

  const { data, error } = await supabaseAdmin
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select("id, email, name, role, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employee: data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("employees").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
