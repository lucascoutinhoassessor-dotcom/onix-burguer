import { NextRequest, NextResponse } from "next/server";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

// GET /api/admin/bot/status
export async function GET() {
  try {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return NextResponse.json({
        state: "disconnected",
        error: "Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY nas variáveis de ambiente."
      });
    }

    // Listar instâncias
    const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { "apikey": EVOLUTION_API_KEY }
    });

    if (!res.ok) {
      return NextResponse.json({
        state: "error",
        error: `Erro ao conectar na Evolution API: ${res.status}`
      });
    }

    const instances = await res.json();
    
    // Procurar instância do bot
    const botInstance = instances.find((i: any) => i.name === "modelo-bot");
    
    if (!botInstance) {
      return NextResponse.json({
        state: "disconnected",
        instances: instances.map((i: any) => i.name)
      });
    }

    return NextResponse.json({
      state: botInstance.state === "open" ? "connected" : "disconnected",
      instance: botInstance.name,
      number: botInstance.owner
    });
  } catch (err) {
    console.error("[bot/status] error:", err);
    return NextResponse.json({
      state: "error",
      error: String(err)
    });
  }
}

// POST /api/admin/bot/connect?action=connect|disconnect
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "connect") {
      // Se não tem Evolution API configurada, usa modo demo/mock
      if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.log("[bot/connect] Modo demo: Evolution API não configurada");
        
        // Gerar QR Code de demonstração (em produção, virá da Evolution API)
        const demoQrCode = generateDemoQrCode();
        
        return NextResponse.json({
          success: true,
          state: "awaiting_scan",
          qrCodeBase64: demoQrCode,
          message: "Modo demonstração: Configure a Evolution API para conexão real",
          demo: true
        });
      }
      return await createInstance();
    }

    if (action === "disconnect") {
      return NextResponse.json({
        success: true,
        state: "disconnected",
        message: "Desconectado"
      });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    console.error("[bot/connect] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Gerar QR Code de demonstração
function generateDemoQrCode(): string {
  // QR Code que diz "Configure a Evolution API"
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAElJREFUeJzt0EENwCAQwEDZf2h66IJWwE/O3h13zrn33vucc+5zzr3POfc+59z7nHPvc869zzn3Pufc+5xz73POvc859z7n3Puc+5/7fQBYnA+4yQAAAABJRU5ErkJggg==";
}

async function createInstance() {
  try {
    // Criar instância
    const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName: "modelo-bot",
        token: "modelo-bot-token",
        qrcode: true,
        number: ""
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      return NextResponse.json({
        error: `Erro ao criar instância: ${createRes.status} - ${errorText}`
      }, { status: 500 });
    }

    const instance = await createRes.json();

    // Conectar (gerar QR Code)
    const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instance.instance.instanceName}`, {
      method: "GET",
      headers: { "apikey": EVOLUTION_API_KEY }
    });

    if (!connectRes.ok) {
      return NextResponse.json({
        error: `Erro ao conectar: ${connectRes.status}`
      }, { status: 500 });
    }

    const connectData = await connectRes.json();

    return NextResponse.json({
      success: true,
      state: "awaiting_scan",
      qrCodeBase64: connectData.base64,
      pairingCode: connectData.pairingCode,
      message: "Escaneie o QR Code no WhatsApp"
    });
  } catch (err) {
    console.error("[createInstance] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function logoutInstance() {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/modelo-bot`, {
      method: "DELETE",
      headers: { "apikey": EVOLUTION_API_KEY }
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Erro ao desconectar: ${res.status}` }, { status: 500 });
    }

    // Deletar instância
    await fetch(`${EVOLUTION_API_URL}/instance/delete/modelo-bot`, {
      method: "DELETE",
      headers: { "apikey": EVOLUTION_API_KEY }
    });

    return NextResponse.json({
      success: true,
      state: "disconnected",
      message: "Desconectado do WhatsApp"
    });
  } catch (err) {
    console.error("[logoutInstance] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
