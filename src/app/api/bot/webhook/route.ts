import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

// POST /api/bot/webhook — recebe mensagens da Evolution API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Evolution API envia dados no formato:
    // { data: { key: { remoteJid: "..." }, message: { conversation: "..." } } }
    const phone = body.data?.key?.remoteJid?.replace(/@s\.whatsapp\.net/, "");
    const messageText = body.data?.message?.conversation || 
                       body.data?.message?.extendedTextMessage?.text || 
                       "";

    if (!phone || !messageText) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
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
        .insert({ phone, name: "Cliente WhatsApp" })
        .select("id")
        .single();
      customerId = newCustomer?.id;
    }

    // Salvar mensagem recebida
    await supabaseAdmin.from("bot_conversations").insert({
      customer_id: customerId,
      phone,
      message: messageText,
      direction: "incoming"
    });

    // Gerar resposta
    const reply = await generateReply(messageText, botConfig);

    // Enviar resposta via Evolution API
    await sendMessage(phone, reply);

    // Salvar resposta
    await supabaseAdmin.from("bot_conversations").insert({
      customer_id: customerId,
      phone,
      message: reply,
      direction: "outgoing"
    });

    return NextResponse.json({ success: true, reply });
  } catch (err) {
    console.error("[bot/webhook] error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function sendMessage(phone: string, text: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return;

  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/modelo-bot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: phone,
        text
      })
    });
  } catch (err) {
    console.error("[sendMessage] error:", err);
  }
}

async function generateReply(
  message: string,
  botConfig: Record<string, any>
): Promise<string> {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("cardápio") || lowerMsg.includes("menu") || lowerMsg.includes("o que tem")) {
    return await getMenuReply();
  }

  if (lowerMsg.includes("pedido") || lowerMsg.includes("quer") || lowerMsg.includes("quero")) {
    return `Perfeito! Para fazer seu pedido, acesse:\n\nhttps://onix-burguer.vercel.app/cardapio\n\nOu me diga o que deseja que eu anoto! 📝`;
  }

  if (lowerMsg.includes("horário") || lowerMsg.includes("abre") || lowerMsg.includes("fecha")) {
    return `🕕 Nosso horário:\n\nTodos os dias: 18h às 23h\nFechamos às terças-feiras.`;
  }

  if (lowerMsg.includes("endereço") || lowerMsg.includes("onde") || lowerMsg.includes("local")) {
    return `📍 Av. José Mendonça de Campos, 955 - Loja 07\nColubandê, São Gonçalo - RJ`;
  }

  if (lowerMsg.includes("entrega") || lowerMsg.includes("delivery")) {
    return `🛵 Fazemos entrega!\n\nTaxa: a partir de R$ 5,00\nTempo médio: 30-45 minutos`;
  }

  if (lowerMsg.includes("pagamento") || lowerMsg.includes("pagar")) {
    return `💳 Aceitamos:\n• Cartão de crédito/débito\n• Pix\n• Dinheiro (na entrega)`;
  }

  const welcome = botConfig.welcome_message;
  if (welcome) return welcome;

  return `Olá! Sou o assistente virtual da Hamburgueria Modelo! 🍔\n\nPosso ajudar com:\n• 📋 Cardápio\n• 🛒 Pedidos\n• ❓ Dúvidas\n• 📍 Endereço e horários\n\nO que você precisa?`;
}

async function getMenuReply(): Promise<string> {
  try {
    const { data: items } = await supabaseAdmin
      .from("menu_items")
      .select("name, price, description, category")
      .eq("active", true)
      .order("category");

    if (!items?.length) {
      return `Cardápio em atualização! 🍔\nAcesse: https://onix-burguer.vercel.app/cardapio`;
    }

    const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    let reply = "*🍔 CARDÁPIO HAMBURGUERIA MODELO*\n";
    const labels: Record<string, string> = {
      hamburgueres: "🍔 Hambúrgueres",
      acompanhamentos: "🍟 Acompanhamentos",
      bebidas: "🥤 Bebidas",
      sobremesas: "🍰 Sobremesas"
    };

    for (const [cat, catItems] of Object.entries(byCategory)) {
      reply += `\n${labels[cat] || cat}:\n`;
      for (const item of catItems) {
        reply += `• ${item.name} — R$ ${item.price.toFixed(2)}\n`;
      }
    }

    reply += "\n💬 Para pedir, diga 'quero [item]'";
    return reply;
  } catch (e) {
    return `Desculpe, não consegui carregar o cardápio. 😕`;
  }
}
