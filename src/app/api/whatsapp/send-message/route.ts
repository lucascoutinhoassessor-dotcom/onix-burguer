import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// POST /api/whatsapp/send-message
// Body: { phone: string, message: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { phone?: string; message?: string };
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "phone e message são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(phone, message);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/whatsapp/send-message error:", err);
    return NextResponse.json({ success: false, error: "Erro interno ao enviar mensagem" }, { status: 500 });
  }
}
