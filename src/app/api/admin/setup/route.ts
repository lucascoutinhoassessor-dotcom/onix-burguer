import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Hash simples para evitar problemas com bcrypt no Edge Runtime
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// POST /api/admin/setup — cria admins padrão
export async function POST(request: NextRequest) {
  try {
    const admins = [
      { email: "admin1@modelohamburguer.com.br", password: "admin123", name: "Administrador 1" },
      { email: "admin2@modelohamburguer.com.br", password: "admin456", name: "Administrador 2" }
    ];

    const created: Array<{ email: string; password: string }> = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const admin of admins) {
      const passwordHash = simpleHash(admin.password);

      // Criar em employees
      const { data: empData, error: empError } = await supabaseAdmin
        .from("employees")
        .upsert({
          email: admin.email,
          name: admin.name,
          password_hash: passwordHash,
          role: "owner",
          active: true
        }, { onConflict: "email" })
        .select();

      if (empError) {
        console.error(`[setup] employees error for ${admin.email}:`, empError);
        errors.push({ email: admin.email, error: `employees: ${empError.message}` });
        continue;
      }

      // Criar em admin_users (legacy)
      const { error: adminError } = await supabaseAdmin
        .from("admin_users")
        .upsert({
          email: admin.email,
          password_hash: passwordHash
        }, { onConflict: "email" });

      if (adminError) {
        console.error(`[setup] admin_users error for ${admin.email}:`, adminError);
        errors.push({ email: admin.email, error: `admin_users: ${adminError.message}` });
      }

      created.push({ email: admin.email, password: admin.password });
    }

    return NextResponse.json({
      success: created.length > 0,
      message: `${created.length} admin(s) criado(s) com sucesso!`,
      credentials: created,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("[setup] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/admin/setup — verifica se existe admin
export async function GET() {
  try {
    const { data: employees, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, email, name, role, active")
      .eq("role", "owner")
      .limit(10);

    if (empError) {
      console.error("[setup GET] employees error:", empError);
      return NextResponse.json({ hasAdmin: false, error: empError.message });
    }

    const hasAdmin = employees && employees.length > 0;

    return NextResponse.json({ 
      hasAdmin, 
      count: employees?.length || 0,
      admins: employees?.map(e => ({ email: e.email, name: e.name, active: e.active })) || []
    });
  } catch (err) {
    console.error("[setup GET] error:", err);
    return NextResponse.json({ hasAdmin: false, error: String(err) });
  }
}
