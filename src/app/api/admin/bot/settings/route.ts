import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/admin/bot/settings
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("bot_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error) {
      // Se não existir, retorna configurações padrão
      return NextResponse.json({
        settings: {
          active: false,
          prompt: "",
          responseDelay: 3,
          includeMenuContext: true,
          welcomeMessage: ""
        }
      });
    }

    return NextResponse.json({ settings: data });
  } catch (err) {
    console.error("[bot/settings GET] error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/admin/bot/settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      active,
      prompt,
      responseDelay,
      includeMenuContext,
      welcomeMessage
    } = body;

    const payload = {
      id: "default",
      active: Boolean(active),
      prompt: String(prompt || ""),
      responseDelay: typeof responseDelay === "number" ? responseDelay : 3,
      includeMenuContext: Boolean(includeMenuContext),
      welcomeMessage: String(welcomeMessage || ""),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from("bot_settings")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("[bot/settings POST] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (err) {
    console.error("[bot/settings POST] error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
