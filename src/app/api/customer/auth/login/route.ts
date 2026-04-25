import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET ?? "onix-customer-secret";

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { identifier, password } = body as {
    identifier: string;
    password: string;
  };

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Identificador e senha são obrigatórios" },
      { status: 400 }
    );
  }

  const trimmed = identifier.trim();
  const isEmail = trimmed.includes("@");

  let customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    password_hash: string;
  } | null = null;

  if (isEmail) {
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id, name, email, phone, password_hash")
      .eq("email", trimmed.toLowerCase())
      .maybeSingle();
    customer = data;
  } else {
    const cleanPhone = trimmed.replace(/\D/g, "");
    const { data } = await supabaseAdmin
      .from("customer_accounts")
      .select("id, name, email, phone, password_hash")
      .eq("phone", cleanPhone)
      .maybeSingle();
    customer = data;
  }

  if (!customer) {
    return NextResponse.json(
      { error: "Conta não encontrada" },
      { status: 401 }
    );
  }

  if (!customer.password_hash) {
    return NextResponse.json(
      { error: "Conta sem senha configurada. Use a recuperação de senha." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(String(password), customer.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const token = await new SignJWT({
    sub: customer.id,
    phone: customer.phone,
    type: "customer"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(JWT_SECRET));

  const response = NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone
    },
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
