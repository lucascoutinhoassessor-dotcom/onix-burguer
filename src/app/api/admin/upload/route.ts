import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande (máx 5 MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("menu-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      // Fallback: return base64 data URL if storage bucket doesn't exist
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;
      return NextResponse.json({ url: dataUrl, method: "base64" });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from("menu-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicData.publicUrl, method: "storage" });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
