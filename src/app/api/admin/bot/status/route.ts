import { NextRequest, NextResponse } from "next/server";

// Simulação de status do WhatsApp (em produção, integrar com Baileys ou similar)
let botState: "disconnected" | "loading_qr" | "awaiting_scan" | "connected" | "error" = "disconnected";
let currentQrCode: string | null = null;

// GET /api/admin/bot/status
export async function GET() {
  // Em produção, verificar estado real da conexão WhatsApp
  return NextResponse.json({
    state: botState,
    qrCodeBase64: currentQrCode,
    timestamp: new Date().toISOString()
  });
}

// POST /api/admin/bot/connect — iniciar conexão
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "connect") {
    botState = "loading_qr";
    // Simula geração de QR code após 2s
    setTimeout(() => {
      botState = "awaiting_scan";
      // QR code de exemplo (em produção, gerado pelo Baileys)
      currentQrCode = generateMockQrCode();
    }, 2000);
    return NextResponse.json({ success: true, state: botState });
  }

  if (action === "disconnect") {
    botState = "disconnected";
    currentQrCode = null;
    return NextResponse.json({ success: true, state: botState });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}

// Função mock para QR code (em produção, usar Baileys)
function generateMockQrCode(): string {
  // Retorna um QR code de exemplo (1x1 pixel transparente em base64)
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
}
