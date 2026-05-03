import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validar tipo do arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Apenas imagens são permitidas" }, { status: 400 });
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Arquivo muito grande (máx 2MB)" }, { status: 400 });
    }

    // Gerar nome único
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const fileName = `logo-${timestamp}.${extension}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload para Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("company-assets")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ success: false, error: "Erro ao fazer upload" }, { status: 500 });
    }

    // Gerar URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("company-assets")
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
