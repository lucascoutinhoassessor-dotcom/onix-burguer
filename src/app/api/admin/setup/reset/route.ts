import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// POST /api/admin/setup/reset — recria os admins do zero
export async function POST(request: NextRequest) {
  try {
    const admins = [
      { email: "admin1@modelohamburguer.com.br", password: "admin123", name: "Administrador 1" },
      { email: "admin2@modelohamburguer.com.br", password: "admin456", name: "Administrador 2" }
    ];

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const admin of admins) {
      const passwordHash = await bcrypt.hash(admin.password, 12);

      // Deletar existente
      await supabaseAdmin.from("employees").delete().eq("email", admin.email);
      await supabaseAdmin.from("admin_users").delete().eq("email", admin.email);

      // Criar novo
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
        results.push({ email: admin.email, status: "error", error: empError.message });
        continue;
      }

      // Criar em admin_users
      await supabaseAdmin
        .from("admin_users")
        .insert({
          email: admin.email,
          password_hash: passwordHash
        });

      results.push({ email: admin.email, status: "created" });
    }

    return NextResponse.json({
      success: results.every(r => r.status === "created"),
      results,
      credentials: admins.map(a => ({ email: a.email, password: a.password }))
    });
  } catch (err) {
    console.error("[setup/reset] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/admin/setup/reset — lista admins existentes
export async function GET() {
  try {
    const { data: employees } = await supabaseAdmin
      .from("employees")
      .select("id, email, name, role, active")
      .eq("role", "owner");

    const { data: adminUsers } = await supabaseAdmin
      .from("admin_users")
      .select("id, email");

    return NextResponse.json({
      employees: employees || [],
      adminUsers: adminUsers || []
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
