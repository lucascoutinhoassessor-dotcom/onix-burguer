import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createDefaultAdmin() {
  const email = "admin@modelohamburguer.com.br";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  // Criar em admin_users (legacy)
  const { error: adminError } = await supabaseAdmin
    .from("admin_users")
    .upsert({
      id: "default-admin",
      email,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    }, { onConflict: "email" });

  if (adminError) {
    console.error("Erro ao criar admin_users:", adminError);
  } else {
    console.log("✅ Admin criado em admin_users");
  }

  // Criar em employees
  const { error: empError } = await supabaseAdmin
    .from("employees")
    .upsert({
      id: "default-employee",
      email,
      name: "Administrador",
      password_hash: passwordHash,
      role: "owner",
      active: true,
      created_at: new Date().toISOString()
    }, { onConflict: "email" });

  if (empError) {
    console.error("Erro ao criar employees:", empError);
  } else {
    console.log("✅ Admin criado em employees");
  }

  console.log("\n📧 Email:", email);
  console.log("🔑 Senha:", password);
  console.log("\nAcesse: /admin/login");
}

createDefaultAdmin();
