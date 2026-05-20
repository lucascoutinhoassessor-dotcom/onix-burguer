import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/admin/setup/force — cria admins com hash verificado
export async function POST(request: NextRequest) {
  try {
    const password1 = "admin123";
    const password2 = "admin456";
    const hash1 = await bcrypt.hash(password1, 12);
    const hash2 = await bcrypt.hash(password2, 12);

    // Verificar se os hashes estão corretos
    const test1 = await bcrypt.compare(password1, hash1);
    const test2 = await bcrypt.compare(password2, hash2);

    if (!test1 || !test2) {
      return NextResponse.json({ error: "Falha ao gerar hashes" }, { status: 500 });
    }

    // Deletar existentes
    const { error: delEmpError } = await supabaseAdmin.from("employees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: delAdminError } = await supabaseAdmin.from("admin_users").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Criar employee 1
    const { data: emp1, error: e1 } = await supabaseAdmin
      .from("employees")
      .insert({
        email: "admin1@modelohamburguer.com.br",
        name: "Administrador 1",
        password_hash: hash1,
        role: "owner",
        active: true
      })
      .select()
      .single();

    // Criar employee 2
    const { data: emp2, error: e2 } = await supabaseAdmin
      .from("employees")
      .insert({
        email: "admin2@modelohamburguer.com.br",
        name: "Administrador 2",
        password_hash: hash2,
        role: "owner",
        active: true
      })
      .select()
      .single();

    // Criar admin_users
    const { error: a1 } = await supabaseAdmin.from("admin_users").insert({
      email: "admin1@modelohamburguer.com.br",
      password_hash: hash1
    });

    const { error: a2 } = await supabaseAdmin.from("admin_users").insert({
      email: "admin2@modelohamburguer.com.br",
      password_hash: hash2
    });

    return NextResponse.json({
      success: !e1 && !e2,
      message: e1 || e2 ? "Erro ao criar" : "Admins criados com sucesso",
      credentials: [
        { email: "admin1@modelohamburguer.com.br", password: password1 },
        { email: "admin2@modelohamburguer.com.br", password: password2 }
      ],
      debug: {
        deleteErrors: { employees: delEmpError?.message, admin_users: delAdminError?.message },
        insertErrors: { emp1: e1?.message, emp2: e2?.message, admin1: a1?.message, admin2: a2?.message },
        emp1Data: emp1,
        emp2Data: emp2
      }
    });
  } catch (err) {
    console.error("[setup/force] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/admin/setup/force — lista admins
export async function GET() {
  try {
    const { data: employees, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, email, name, role, active, password_hash")
      .eq("role", "owner");

    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("id, email");

    return NextResponse.json({
      count: employees?.length || 0,
      admins: employees?.map(e => ({
        email: e.email,
        name: e.name,
        active: e.active,
        hasPassword: !!e.password_hash,
        passwordLength: e.password_hash?.length || 0
      })) || [],
      adminUsers: adminUsers?.map(a => a.email) || [],
      errors: { employees: empError?.message, admin_users: adminError?.message }
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
