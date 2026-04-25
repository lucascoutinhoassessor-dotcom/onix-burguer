import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET ?? "onix-customer-secret";

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { name, email, phone, password } = body as {
    name: string;
    email: string;
    phone: string;
    password: string;
  };

  if (!name || !phone || !password) {
    return NextResponse.json(
      { error: "Nome, telefone e senha são obrigatórios" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Senha deve ter pelo menos 6 caracteres" },
      { status: 400 }
    );
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length < 10) {
    return NextResponse.json(
      { error: "Telefone inválido" },
      { status: 400 }
    );
  }

  // Check phone uniqueness
  const { data: byPhone } = await supabaseAdmin
    .from("customer_accounts")
    .select("id")
    .eq("phone", cleanPhone)
    .maybeSingle();

  if (byPhone) {
    return NextResponse.json(
      { error: "Telefone já cadastrado" },
      { status: 409 }
    );
  }

  // Check email uniqueness (if provided)
  const cleanEmail = email?.trim().toLowerCase() || null;
  if (cleanEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const { data: byEmail } = await supabaseAdmin
      .from("customer_accounts")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (byEmail) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 }
      );
    }
  }

  const password_hash = await bcrypt.hash(String(password), 12);

  const { data: customer, error } = await supabaseAdmin
    .from("customer_accounts")
    .insert({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password_hash
    })
    .select("id, name, email, phone")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const token = await new SignJWT({
    sub: customer.id,
    phone: customer.phone,
    type: "customer"
  })
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
