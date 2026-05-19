import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/admin/bot/connect
export async function POST() {
  try {
    // Em produção: iniciar conexão Baileys aqui
    // Por enquanto, simula o fluxo
    return NextResponse.json({
      success: true,
      state: "loading_qr",
      message: "Iniciando conexão com WhatsApp..."
    });
  } catch (err) {
    console.error("[bot/connect] error:", err);
    return NextResponse.json({ error: "Erro ao conectar" }, { status: 500 });
  }
}
