import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/bot/webhook — recebe mensagens do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message, name } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "phone e message são obrigatórios" }, { status: 400 });
    }

    // Buscar configurações do bot
    const { data: botConfig } = await supabaseAdmin
      .from("bot_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (!botConfig?.active) {
      return NextResponse.json({ error: "Bot desativado" }, { status: 403 });
    }

    // Buscar ou criar cliente
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id, name")
      .eq("phone", phone)
      .single();

    let customerId = customer?.id;
    if (!customerId) {
      const { data: newCustomer } = await supabaseAdmin
        .from("customers")
        .insert({ phone, name: name || "Cliente WhatsApp" })
        .select("id")
        .single();
      customerId = newCustomer?.id;
    }

    // Salvar mensagem no histórico
    await supabaseAdmin.from("bot_conversations").insert({
      customer_id: customerId,
      phone,
      message,
      direction: "incoming",
      created_at: new Date().toISOString()
    });

    // Processar com IA (em produção, integrar com OpenAI/Gemini)
    const reply = await generateReply(message, botConfig, customerId);

    // Salvar resposta
    await supabaseAdmin.from("bot_conversations").insert({
      customer_id: customerId,
      phone,
      message: reply,
      direction: "outgoing",
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      reply,
      customerId
    });
  } catch (err) {
    console.error("[bot/webhook] error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// GET /api/bot/webhook — health check
export async function GET() {
  return NextResponse.json({ status: "ok", service: "bot-webhook" });
}

async function generateReply(
  message: string,
  botConfig: Record<string, unknown>,
  customerId?: string
): Promise<string> {
  const lowerMsg = message.toLowerCase();

  // Respostas simples baseadas em palavras-chave (em produção, usar IA real)
  if (lowerMsg.includes("cardápio") || lowerMsg.includes("menu") || lowerMsg.includes("o que tem")) {
    return await getMenuReply();
  }

  if (lowerMsg.includes("pedido") || lowerMsg.includes("quer") || lowerMsg.includes("quero")) {
    return `Perfeito! Para fazer seu pedido, você pode:\n\n1. Acesse nosso site: https://onix-burguer.vercel.app/cardapio\n2. Ou me diga o que deseja que eu anoto! 📝`;
  }

  if (lowerMsg.includes("horário") || lowerMsg.includes("abre") || lowerMsg.includes("fecha")) {
    return `Nosso horário de funcionamento:\n\n🕕 Todos os dias: 18h às 23h\n\nFechamos às terças-feiras.`;
  }

  if (lowerMsg.includes("endereço") || lowerMsg.includes("onde") || lowerMsg.includes("local")) {
    return `📍 Estamos localizados em:\n\nAv. José Mendonça de Campos, 955 - Loja 07\nColubandê, São Gonçalo - RJ\n\nhttps://maps.google.com/?q=Av.+José+Mendonça+de+Campos,955`;
  }

  if (lowerMsg.includes("entrega") || lowerMsg.includes("delivery")) {
    return `🛵 Fazemos entrega!\n\nTaxa de entrega: a partir de R$ 5,00\nTempo médio: 30-45 minutos\n\nVocê pode pedir pelo site ou me dizer seu endereço!`;
  }

  if (lowerMsg.includes("pagamento") || lowerMsg.includes("pagar")) {
    return `💳 Formas de pagamento:\n\n• Cartão de crédito/débito\n• Pix\n• Dinheiro (na entrega)\n\nNo site aceitamos cartão e Pix!`;
  }

  // Resposta padrão/boas-vindas
  const welcome = botConfig.welcomeMessage as string;
  if (welcome) return welcome;

  return `Olá! Sou o assistente virtual da Hamburgueria Modelo! 🍔\n\nPosso ajudar você com:\n• 📋 Cardápio\n• 🛒 Fazer pedidos\n• ❓ Dúvidas\n• 📍 Endereço e horários\n\nO que você precisa hoje?`;
}

async function getMenuReply(): Promise<string> {
  try {
    const { data: items } = await supabaseAdmin
      .from("menu_items")
      .select("name, price, description, category")
      .eq("active", true)
      .order("category");

    if (!items || items.length === 0) {
      return `Nosso cardápio está sendo atualizado! 🍔\n\nAcesse o site para ver as novidades: https://onix-burguer.vercel.app/cardapio`;
    }

    // Agrupar por categoria
    const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    let reply = "*🍔 CARDÁPIO HAMBURGUERIA MODELO*\n\n";
    const categoryLabels: Record<string, string> = {
      hamburgueres: "🍔 *Hambúrgueres*",
      acompanhamentos: "🍟 *Acompanhamentos*",
      bebidas: "🥤 *Bebidas*",
      sobremesas: "🍰 *Sobremesas*"
    };

    for (const [cat, catItems] of Object.entries(byCategory)) {
      reply += `${categoryLabels[cat] || cat}\n`;
      for (const item of catItems) {
        reply += `• ${item.name} — R$ ${item.price.toFixed(2)}\n`;
      }
      reply += "\n";
    }

    reply += "\n💬 Para pedir, diga *'quero [item]'* ou acesse:\nhttps://onix-burguer.vercel.app/cardapio";
    return reply;
  } catch (e) {
    return `Desculpe, não consegui carregar o cardápio agora. 😕\n\nAcesse nosso site: https://onix-burguer.vercel.app/cardapio`;
  }
}
