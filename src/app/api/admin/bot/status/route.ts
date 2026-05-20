import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import OpenAI from "openai";

// Estado global do bot (em produção, usar Redis ou banco)
let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCodeBase64: string | null = null;
let connectionState: "disconnected" | "loading_qr" | "awaiting_scan" | "connected" | "error" = "disconnected";
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Inicializar OpenAI apenas quando necessário
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// GET /api/admin/bot/status
export async function GET() {
  return NextResponse.json({
    state: connectionState,
    qrCodeBase64,
    reconnectAttempts,
    timestamp: new Date().toISOString()
  });
}

// POST /api/admin/bot/connect
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "connect") {
    return await startBot();
  }

  if (action === "disconnect") {
    return await stopBot();
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

async function startBot() {
  try {
    if (sock) {
      return NextResponse.json({ success: true, state: connectionState, message: "Bot já está rodando" });
    }

    connectionState = "loading_qr";
    qrCodeBase64 = null;
    reconnectAttempts = 0;

    const { state, saveCreds } = await (useMultiFileAuthState as any)("./baileys_auth");

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Modelo Hamburguer", "Chrome", "1.0"]
    });

    // Evento de QR Code
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionState = "awaiting_scan";
        qrCodeBase64 = await QRCode.toDataURL(qr);
      }

      if (connection === "close") {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          connectionState = "loading_qr";
          setTimeout(startBot, 5000);
        } else {
          connectionState = "disconnected";
          qrCodeBase64 = null;
          sock = null;
        }
      }

      if (connection === "open") {
        connectionState = "connected";
        qrCodeBase64 = null;
        reconnectAttempts = 0;
      }
    });

    // Salvar credenciais
    sock.ev.on("creds.update", saveCreds);

    // Receber mensagens
    sock.ev.on("messages.upsert", async (m) => {
      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
          await handleIncomingMessage(msg);
        }
      }
    });

    return NextResponse.json({
      success: true,
      state: connectionState,
      message: "Bot iniciado. Aguardando QR Code..."
    });
  } catch (err) {
    console.error("[bot/connect] error:", err);
    connectionState = "error";
    return NextResponse.json({ error: "Erro ao iniciar bot" }, { status: 500 });
  }
}

async function stopBot() {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
    }
    connectionState = "disconnected";
    qrCodeBase64 = null;
    reconnectAttempts = 0;
    return NextResponse.json({ success: true, state: "disconnected", message: "Bot desconectado" });
  } catch (err) {
    console.error("[bot/disconnect] error:", err);
    return NextResponse.json({ error: "Erro ao desconectar" }, { status: 500 });
  }
}

async function handleIncomingMessage(msg: any) {
  try {
    const phone = msg.key.remoteJid.replace(/@s\.whatsapp\.net/, "").replace(/@g\.us/, "");
    const messageText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       "";

    if (!messageText) return;

    // Buscar configurações do bot
    const { data: botConfig } = await supabaseAdmin
      .from("bot_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (!botConfig?.active) return;

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

    // Buscar histórico de conversas
    const { data: history } = await supabaseAdmin
      .from("bot_conversations")
      .select("message, direction")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(10);

    // Gerar resposta com OpenAI
    const reply = await generateAIReply(messageText, botConfig, history || []);

    // Enviar resposta
    await sock?.sendMessage(msg.key.remoteJid, { text: reply });

    // Salvar resposta
    await supabaseAdmin.from("bot_conversations").insert({
      customer_id: customerId,
      phone,
      message: reply,
      direction: "outgoing"
    });

  } catch (err) {
    console.error("[handleIncomingMessage] error:", err);
  }
}

async function generateAIReply(
  message: string,
  botConfig: Record<string, any>,
  history: Array<{ message: string; direction: string }>
): Promise<string> {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return await generateFallbackReply(message, botConfig);
    }

    // Buscar cardápio se necessário
    let menuContext = "";
    if (botConfig.include_menu_context) {
      const { data: items } = await supabaseAdmin
        .from("menu_items")
        .select("name, price, description, category")
        .eq("active", true);

      if (items) {
        menuContext = "\n\nCARDÁPIO ATUAL:\n";
        const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {});

        for (const [cat, catItems] of Object.entries(byCategory)) {
          menuContext += `\n${cat.toUpperCase()}:\n`;
          for (const item of catItems) {
            menuContext += `- ${item.name}: R$ ${item.price.toFixed(2)}\n`;
          }
        }
      }
    }

    // Construir mensagens para OpenAI
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `${botConfig.prompt || "Você é o atendente virtual da Hamburgueria Modelo."}\n\nRegras:\n- Responda de forma simpática e profissional\n- Use emojis ocasionalmente\n- Nunca invente preços ou itens${menuContext}`
      }
    ];

    // Adicionar histórico
    for (const h of history.slice().reverse()) {
      messages.push({
        role: h.direction === "incoming" ? "user" : "assistant",
        content: h.message
      });
    }

    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || await generateFallbackReply(message, botConfig);
  } catch (err) {
    console.error("[generateAIReply] error:", err);
    return await generateFallbackReply(message, botConfig);
  }
}

async function generateFallbackReply(
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
