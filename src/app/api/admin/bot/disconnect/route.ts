import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/bot/disconnect
export async function POST() {
  try {
    // Em produção: desconectar Baileys aqui
    return NextResponse.json({
      success: true,
      state: "disconnected",
      message: "Desconectado do WhatsApp"
    });
  } catch (err) {
    console.error("[bot/disconnect] error:", err);
    return NextResponse.json({ error: "Erro ao desconectar" }, { status: 500 });
  }
}
