import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET ?? "onix-customer-secret";

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { action, phone, name, password } = body as {
    action: "login" | "register";
    phone: string;
    name?: string;
    password: string;
  };

  if (!phone || !password) {
    return NextResponse.json({ error: "Telefone e senha obrigatórios" }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (action === "register") {
    if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from("customer_accounts")
      .select("id")
      .eq("phone", cleanPhone)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Telefone já cadastrado" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(String(password), 12);

    const { data: customer, error } = await supabaseAdmin
      .from("customer_accounts")
      .insert({ phone: cleanPhone, name, password_hash })
      .select("id, phone, name, email")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const token = await new SignJWT({ sub: customer.id, phone: customer.phone, type: "customer" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(JWT_SECRET));

    const response = NextResponse.json({ customer, success: true }, { status: 201 });
    response.cookies.set("customer-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    return response;
  }

  // action === "login"
  const { data: customer, error } = await supabaseAdmin
    .from("customer_accounts")
    .select("*")
    .eq("phone", cleanPhone)
    .single();

  if (error || !customer) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 401 });
  }

  const valid = await bcrypt.compare(String(password), customer.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const token = await new SignJWT({ sub: customer.id, phone: customer.phone, type: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(JWT_SECRET));

  const response = NextResponse.json({
    customer: { id: customer.id, phone: customer.phone, name: customer.name, email: customer.email },
    success: true
  });
  response.cookies.set("customer-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("customer-token")?.value;
  if (!token) return NextResponse.json({ customer: null });

  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const customerId = payload.sub;

    const { data: customer, error } = await supabaseAdmin
      .from("customer_accounts")
      .select("id, phone, name, email")
      .eq("id", customerId)
      .single();

    if (error || !customer) return NextResponse.json({ customer: null });

    // Fetch order history
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("order_id, total, status, items, created_at, fulfillment_mode")
      .eq("customer_phone", customer.phone)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ customer, orders: orders ?? [] });
  } catch {
    return NextResponse.json({ customer: null });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("customer-token");
  return response;
}
