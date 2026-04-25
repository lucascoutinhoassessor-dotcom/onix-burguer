import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// WhatsApp Web (whatsapp-web.js) singleton management
// ---------------------------------------------------------------------------
// This module maintains a single WhatsApp Web client per server process.
// Works perfectly in development; in production requires a persistent server
// (not Vercel serverless). Host on Railway, Render, VPS, etc.
// ---------------------------------------------------------------------------

type WAStatus = "disconnected" | "initializing" | "qr_ready" | "connected";

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phoneNumber: string | null;
  error: string | null;
}

// Module-level singleton
declare global {
  // eslint-disable-next-line no-var
  var __waClient: import("whatsapp-web.js").Client | null;
  // eslint-disable-next-line no-var
  var __waState: WAState;
}

if (!global.__waState) {
  global.__waState = { status: "disconnected", qrDataUrl: null, phoneNumber: null, error: null };
}
if (global.__waClient === undefined) {
  global.__waClient = null;
}

function getState(): WAState {
  return global.__waState;
}

async function initClient(): Promise<void> {
  if (global.__waClient) return; // already running

  global.__waState = { status: "initializing", qrDataUrl: null, phoneNumber: null, error: null };

  try {
    const { Client, LocalAuth } = await import("whatsapp-web.js");
    const QRCode = await import("qrcode");

    // Try common browser paths on Windows
    const possiblePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    ];

    const { existsSync } = await import("fs");
    const executablePath = possiblePaths.find((p) => existsSync(p));

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: "onix-burguer" }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        ...(executablePath ? { executablePath } : {})
      }
    });

    client.on("qr", async (qr) => {
      const dataUrl = await QRCode.default.toDataURL(qr);
      global.__waState = { ...global.__waState, status: "qr_ready", qrDataUrl: dataUrl, error: null };
    });

    client.on("ready", () => {
      const info = client.info;
      global.__waState = {
        status: "connected",
        qrDataUrl: null,
        phoneNumber: info?.wid?.user ?? null,
        error: null
      };
    });

    client.on("authenticated", () => {
      global.__waState = { ...global.__waState, status: "connected", error: null };
    });

    client.on("auth_failure", (msg) => {
      global.__waState = { status: "disconnected", qrDataUrl: null, phoneNumber: null, error: msg };
      global.__waClient = null;
    });

    client.on("disconnected", () => {
      global.__waState = { status: "disconnected", qrDataUrl: null, phoneNumber: null, error: null };
      global.__waClient = null;
    });

    await client.initialize();
    global.__waClient = client;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    global.__waState = { status: "disconnected", qrDataUrl: null, phoneNumber: null, error: msg };
    global.__waClient = null;
  }
}

// GET /api/admin/whatsapp-web — get current status and QR code
export async function GET() {
  return NextResponse.json({ success: true, ...getState() });
}

// POST /api/admin/whatsapp-web — initialize connection
export async function POST(_request: NextRequest) {
  const state = getState();
  if (state.status === "connected") {
    return NextResponse.json({ success: false, error: "Já conectado." });
  }
  if (state.status === "initializing" || state.status === "qr_ready") {
    return NextResponse.json({ success: true, message: "Inicializando...", ...state });
  }

  // Fire and forget — initialization is async
  initClient().catch(console.error);

  return NextResponse.json({ success: true, message: "Iniciando conexão...", status: "initializing" });
}

// DELETE /api/admin/whatsapp-web — disconnect
export async function DELETE() {
  try {
    if (global.__waClient) {
      await global.__waClient.destroy();
      global.__waClient = null;
    }
    global.__waState = { status: "disconnected", qrDataUrl: null, phoneNumber: null, error: null };
    return NextResponse.json({ success: true, message: "Desconectado." });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}
