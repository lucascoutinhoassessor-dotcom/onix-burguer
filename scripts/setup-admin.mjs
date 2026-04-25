/**
 * Script para testar conexão com Supabase e criar usuário admin
 * Uso: node scripts/setup-admin.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lê .env.local manualmente
function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const vars = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      vars[key] = value;
    }
    return vars;
  } catch (e) {
    console.error("Erro ao ler .env.local:", e.message);
    return {};
  }
}

const env = loadEnv();

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("=== Verificação de variáveis de ambiente ===");
console.log("SUPABASE_URL:", SUPABASE_URL || "NÃO ENCONTRADA");
console.log("SUPABASE_ANON_KEY (Publishable):", SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 20) + "..." : "NÃO ENCONTRADA");
console.log("SUPABASE_SERVICE_KEY (Secret):", SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.slice(0, 20) + "..." : "NÃO ENCONTRADA");
console.log();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("ERRO: Variáveis do Supabase não encontradas no .env.local");
  process.exit(1);
}

// Testa com chave de serviço (admin)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("=== Testando conexão com Supabase (Service Key) ===");

  // Testa listando tabelas conhecidas
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("admin_users")
    .select("id, email")
    .limit(10);

  if (ordersError) {
    console.error("ERRO ao acessar tabela admin_users:", ordersError.message);
    console.log("\nPossível causa: tabela não existe ou chave inválida.");
    console.log("Tentando criar a tabela admin_users...\n");

    // Tenta criar a tabela via SQL
    const { error: createError } = await supabaseAdmin.rpc("query", {
      sql: `CREATE TABLE IF NOT EXISTS admin_users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        created_at timestamptz DEFAULT now()
      );`
    });

    if (createError) {
      console.log("Não foi possível criar tabela via RPC. Você precisa criar manualmente no Supabase SQL Editor:");
      console.log(`
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);
      `);
    }
  } else {
    console.log("Conexão OK! Usuários encontrados:", orders?.length ?? 0);
    if (orders && orders.length > 0) {
      console.log("Usuários existentes:");
      orders.forEach(u => console.log(" -", u.email));
    }
  }

  // Verifica se o usuário admin já existe
  console.log("\n=== Verificando usuário admin@onixburguer.com.br ===");
  const { data: existingUser, error: findError } = await supabaseAdmin
    .from("admin_users")
    .select("id, email")
    .eq("email", "admin@onixburguer.com.br")
    .maybeSingle();

  if (findError) {
    console.error("Erro ao buscar usuário:", findError.message);
  } else if (existingUser) {
    console.log("Usuário admin JÁ EXISTS. ID:", existingUser.id);
    console.log("Login deve funcionar com email: admin@onixburguer.com.br");
    console.log("\nSe ainda não funciona, o hash da senha pode estar errado.");
    console.log("Atualizando senha para admin123...");
    await updateAdminPassword();
  } else {
    console.log("Usuário admin NÃO encontrado. Criando...");
    await createAdminUser();
  }

  // Testa conexão anon
  console.log("\n=== Testando conexão com Supabase (Anon/Publishable Key) ===");
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error: anonError } = await supabaseAnon.from("menu_items").select("id").limit(1);
  if (anonError) {
    console.log("Anon key: erro ao acessar menu_items:", anonError.message);
  } else {
    console.log("Anon key: conexão OK");
  }
}

async function hashPassword(password) {
  // Usa bcrypt via dynamic import
  try {
    const bcrypt = await import("bcryptjs");
    return await bcrypt.default.hash(password, 12);
  } catch {
    console.log("bcryptjs não disponível, usando SHA256 temporário");
    return createHash("sha256").update(password).digest("hex");
  }
}

async function createAdminUser() {
  const hash = await hashPassword("admin123");
  console.log("Hash gerado:", hash.slice(0, 20) + "...");

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .insert({
      email: "admin@onixburguer.com.br",
      password_hash: hash
    })
    .select("id, email")
    .single();

  if (error) {
    console.error("ERRO ao criar usuário:", error.message);
    console.log("\nSQL para criar manualmente no Supabase:");
    console.log(`INSERT INTO admin_users (email, password_hash) VALUES ('admin@onixburguer.com.br', '${hash}');`);
  } else {
    console.log("Usuário admin criado com sucesso! ID:", data.id);
    console.log("\nCredenciais:");
    console.log("  Email: admin@onixburguer.com.br");
    console.log("  Senha: admin123");
  }
}

async function updateAdminPassword() {
  const hash = await hashPassword("admin123");

  const { error } = await supabaseAdmin
    .from("admin_users")
    .update({ password_hash: hash })
    .eq("email", "admin@onixburguer.com.br");

  if (error) {
    console.error("ERRO ao atualizar senha:", error.message);
  } else {
    console.log("Senha atualizada com sucesso!");
    console.log("\nCredenciais:");
    console.log("  Email: admin@onixburguer.com.br");
    console.log("  Senha: admin123");
  }
}

main().catch(console.error);
