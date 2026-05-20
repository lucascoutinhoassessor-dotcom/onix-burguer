import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/admin/setup/force — força criação de admins (ignora verificação)
export async function POST(request: NextRequest) {
  try {
    const admins = [
      { email: "admin1@modelohamburguer.com.br", password: "admin123", name: "Administrador 1" },
      { email: "admin2@modelohamburguer.com.br", password: "admin456", name: "Administrador 2" }
    ];

    const created: Array<{ email: string; password: string }> = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const admin of admins) {
      const passwordHash = await bcrypt.hash(admin.password, 12);

      // Tentar inserir diretamente (sem upsert)
      const { error: empError } = await supabaseAdmin
        .from("employees")
        .insert({
          email: admin.email,
          name: admin.name,
          password_hash: passwordHash,
          role: "owner",
          active: true
        });

      if (empError) {
        // Se já existe, tentar update
        if (empError.code === "23505") {
          const { error: updError } = await supabaseAdmin
            .from("employees")
            .update({ password_hash: passwordHash, active: true })
            .eq("email", admin.email);

          if (updError) {
            errors.push({ email: admin.email, error: `update: ${updError.message}` });
            continue;
          }
        } else {
          errors.push({ email: admin.email, error: `insert: ${empError.message}` });
          continue;
        }
      }

      // Criar em admin_users (legacy)
      const { error: adminError } = await supabaseAdmin
        .from("admin_users")
        .upsert({
          email: admin.email,
          password_hash: passwordHash
        }, { onConflict: "email" });

      if (adminError) {
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
    console.error("[setup/force] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/admin/setup/force — verifica admins existentes
export async function GET() {
  try {
    const { data: employees, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, email, name, role, active")
      .eq("role", "owner")
      .limit(10);

    return NextResponse.json({
      hasAdmin: employees && employees.length > 0,
      count: employees?.length || 0,
      admins: employees || [],
      error: empError?.message
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
