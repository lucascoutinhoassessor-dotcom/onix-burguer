import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return vars;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: user, error } = await supabase
  .from("admin_users")
  .select("id, email, password_hash")
  .eq("email", "admin@onixburguer.com.br")
  .single();

if (error || !user) {
  console.log("ERRO: usuário não encontrado.", error?.message);
  process.exit(1);
}

console.log("Usuário encontrado:", user.email);
console.log("Hash armazenado:", user.password_hash.slice(0, 30) + "...");

const valid = await bcrypt.compare("admin123", user.password_hash);
console.log("Senha admin123 válida?", valid ? "SIM - LOGIN DEVE FUNCIONAR" : "NÃO - hash incompatível");

if (!valid) {
  console.log("\nCorrigindo hash...");
  const newHash = await bcrypt.hash("admin123", 12);
  const { error: updateError } = await supabase
    .from("admin_users")
    .update({ password_hash: newHash })
    .eq("email", "admin@onixburguer.com.br");
  if (updateError) {
    console.log("Erro ao atualizar:", updateError.message);
  } else {
    console.log("Hash corrigido! Login deve funcionar agora.");
  }
}
