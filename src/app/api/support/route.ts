import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP nÃ£o configurado. E-mail nÃ£o serÃ¡ enviado.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, category, description } = body;

    if (!type || !title || !category || !description) {
      return NextResponse.json(
        { success: false, error: "Todos os campos sÃ£o obrigatÃ³rios" },
        { status: 400 }
      );
    }

    if (!["support", "suggestion"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Tipo invÃ¡lido" },
        { status: 400 }
      );
    }

    const destinationEmail = process.env.DESTINATION_EMAIL;
    if (!destinationEmail) {
      return NextResponse.json(
        { success: false, error: "E-mail de destino nÃ£o configurado" },
        { status: 500 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "Desconhecido";
    const ip = request.headers.get("x-forwarded-for") || "Desconhecido";

    const typeLabel = type === "support" ? "SolicitaÃ§Ã£o de Suporte" : "SugestÃ£o";
    const subject = `[${typeLabel}] ${title}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a1a; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .field-value { margin-top: 4px; font-size: 14px; }
          .description { background: #fff; padding: 12px; border-radius: 4px; border-left: 3px solid #f4a261; }
          .footer { margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0;">${typeLabel}</h2>
            <p style="margin:5px 0 0 0; opacity:0.8;">Painel Administrativo - Onix Burguer</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">TÃ­tulo</div>
              <div class="field-value">${escapeHtml(title)}</div>
            </div>
            <div class="field">
              <div class="field-label">Categoria</div>
              <div class="field-value">${escapeHtml(category)}</div>
            </div>
            <div class="field">
              <div class="field-label">DescriÃ§Ã£o</div>
              <div class="field-value description">${escapeHtml(description).replace(/\n/g, "<br>")}</div>
            </div>
            <div class="field">
              <div class="field-label">Enviado por</div>
              <div class="field-value">UsuÃ¡rio do painel admin</div>
            </div>
            <div class="field">
              <div class="field-label">Data/Hora</div>
              <div class="field-value">${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>
          <div class="footer">
            <p>Este e-mail foi enviado automaticamente pelo painel administrativo.</p>
            <p>IP: ${ip} | User-Agent: ${userAgent}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${typeLabel}
================

TÃ­tulo: ${title}
Categoria: ${category}

DescriÃ§Ã£o:
${description}

Enviado por: UsuÃ¡rio do painel admin
Data/Hora: ${new Date().toLocaleString("pt-BR")}
    `.trim();

    const transporter = getTransporter();

    if (!transporter) {
      console.log("=== E-MAIL SIMULADO (SMTP nÃ£o configurado) ===");
      console.log("Para:", destinationEmail);
      console.log("Assunto:", subject);
      console.log("==============================================");
      
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "E-mail simulado (SMTP nÃ£o configurado). Configure as variÃ¡veis de ambiente SMTP_* para envio real."
      });
    }

    await transporter.sendMail({
      from: `"Painel Onix Burguer" <${process.env.SMTP_USER}>`,
      to: destinationEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: "E-mail enviado com sucesso!"
    });
  } catch (err: any) {
    console.error("POST /api/support error:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao enviar: " + (err.message || String(err)) },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
