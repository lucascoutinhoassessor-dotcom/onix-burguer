import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "onix-admin-secret");

    // 1. Try admin_users (legacy, full owner access)
    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("id, email, password_hash")
      .eq("email", normalizedEmail)
      .single();

    if (adminUser) {
      const valid = await bcrypt.compare(password, adminUser.password_hash);
      if (!valid) return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });

      const token = await new SignJWT({ id: adminUser.id, email: adminUser.email, role: "owner" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);

      const response = NextResponse.json({ success: true });
      response.cookies.set("admin-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/"
      });
      return response;
    }

    // 2. Try employees table (role-based + per-employee permissions)
    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, email, name, password_hash, role, active, permissions")
      .eq("email", normalizedEmail)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    if (!employee.active) {
      return NextResponse.json({ error: "Conta inativa. Contate o administrador." }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });

    const jwtPayload: Record<string, unknown> = {
      id: employee.id,
      email: employee.email,
      role: employee.role
    };

    // Include custom permissions if set
    if (employee.permissions && Array.isArray(employee.permissions) && employee.permissions.length > 0) {
      jwtPayload.permissions = employee.permissions;
    }

    const token = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/"
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
