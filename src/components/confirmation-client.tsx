"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildAddressLabel,
  buildWhatsAppOrderUrl,
  formatCurrency,
  getFulfillmentLabel,
  getPaymentMethodLabel,
  type ConfirmationData
} from "@/lib/checkout";

const statusLabels: Record<string, string> = {
  approved: "Pagamento aprovado",
  pending: "Pagamento pendente",
  in_process: "Pagamento em análise",
  rejected: "Pagamento recusado"
};

const statusClasses: Record<string, string> = {
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  pending: "border-amberglow/30 bg-amberglow/10 text-amberglow",
  in_process: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  rejected: "border-[#ff8f8f]/30 bg-[#ff8f8f]/10 text-[#ffd3d3]"
};

export function ConfirmationClient() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [order, setOrder] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoShareMessage, setAutoShareMessage] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem("onix-burguer-last-order");

    if (raw) {
      try {
        setOrder(JSON.parse(raw) as ConfirmationData);
      } catch {
        window.localStorage.removeItem("onix-burguer-last-order");
      }
    }
  }, []);

  useEffect(() => {
    if (!paymentId) {
      return;
    }

    let cancelled = false;

    async function syncStatus() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/payment?paymentId=${paymentId}`);
        const payload = (await response.json()) as {
          success: boolean;
          status?: string;
          statusDetail?: string;
          orderId?: string;
          paymentId?: string;
          pixQrCode?: string;
          pixQrCodeBase64?: string;
          error?: string;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Não foi possível consultar o pagamento.");
        }

        if (!cancelled) {
          setOrder((current) => {
            if (!current) {
              return current;
            }

            const updated = {
              ...current,
              status: payload.status ?? current.status,
              statusDetail: payload.statusDetail ?? current.statusDetail,
              paymentId: payload.paymentId ?? current.paymentId,
              orderId: payload.orderId ?? current.orderId,
              pixQrCode: payload.pixQrCode ?? current.pixQrCode,
              pixQrCodeBase64: payload.pixQrCodeBase64 ?? current.pixQrCodeBase64
            };

            window.localStorage.setItem("onix-burguer-last-order", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (syncError) {
        if (!cancelled) {
          setError(syncError instanceof Error ? syncError.message : "Erro ao consultar o pagamento.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    syncStatus();

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const whatsappUrl = useMemo(() => {
    if (!order) {
      return "";
    }

    return buildWhatsAppOrderUrl(order);
  }, [order]);

  useEffect(() => {
    if (!order || order.status !== "approved" || !whatsappUrl) {
      return;
    }

    const storageKey = `onix-burguer-whatsapp-order-${order.orderId}`;

    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "sent");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setAutoShareMessage("Resumo do pedido preparado para envio no WhatsApp do restaurante.");
  }, [order, whatsappUrl]);

  const statusLabel = useMemo(() => {
    if (!order) {
      return "Pedido não encontrado";
    }

    return statusLabels[order.status] ?? `Status: ${order.status}`;
  }, [order]);

  const statusClass = order ? statusClasses[order.status] ?? statusClasses.pending : statusClasses.pending;
  const addressLabel = order ? buildAddressLabel(order.customer) : "";

  if (!order) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Confirmação</p>
          <h1 className="mt-4 font-title text-5xl uppercase tracking-[0.08em] text-cream">Pedido não encontrado</h1>
          <p className="mt-4 text-sm leading-7 text-white/65">
            Não localizamos os dados do pedido nesta sessão.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/checkout"
              className="rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-obsidian transition hover:bg-[#ffcb7d]"
            >
              Voltar ao checkout
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-amber sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Pedido confirmado</p>
        <h1 className="mt-4 font-title text-5xl uppercase tracking-[0.08em] text-cream sm:text-6xl">
          Obrigado pelo pedido
        </h1>

        <div className={`mt-6 inline-flex rounded-full border px-4 py-2 text-sm font-medium ${statusClass}`}>
          {statusLabel}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <InfoCard label="Número do pedido" value={order.orderId} />
          <InfoCard label="Pagamento" value={getPaymentMethodLabel(order.paymentMethod)} />
          <InfoCard label="Modalidade" value={getFulfillmentLabel(order.fulfillmentMode)} />
          <InfoCard label="ID do pagamento" value={order.paymentId} />
          <InfoCard label="Total" value={formatCurrency(order.total)} />
        </div>

        {order.paymentMethod === "pix" && order.pixQrCode ? (
          <div className="mt-8 rounded-[1.8rem] border border-amberglow/20 bg-amberglow/5 p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {order.pixQrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${order.pixQrCodeBase64}`}
                  alt="QR Code Pix"
                  className="h-48 w-48 rounded-2xl border border-white/10 bg-white p-3"
                />
              ) : null}

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.25em] text-amberglow">Pix copia e cola</p>
                <textarea
                  readOnly
                  value={order.pixQrCode}
                  rows={6}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-cream outline-none"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(order.pixQrCode || "")}
                  className="mt-3 rounded-full border border-amberglow/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amberglow transition hover:bg-amberglow/10"
                >
                  Copiar código Pix
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {order.statusDetail ? (
          <p className="mt-5 text-sm text-white/55">Detalhe do status: {order.statusDetail}</p>
        ) : null}

        {autoShareMessage ? <p className="mt-5 text-sm text-amberglow">{autoShareMessage}</p> : null}
        {loading ? <p className="mt-5 text-sm text-white/45">Atualizando status do pagamento...</p> : null}
        {error ? <p className="mt-5 text-sm text-[#ffd3d3]">{error}</p> : null}
      </div>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Resumo do pedido</p>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div key={item.key} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-cream">
                      {item.quantity}x {item.name}
                    </p>
                    {item.selectedOptions.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-white/50">
                        {item.selectedOptions.map((option) => (
                          <li key={`${item.key}-${option.optionId}`}>
                            {option.groupName}: {option.optionName}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <span className="font-semibold text-amberglow">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Cliente e entrega</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-white/65">
            <p>
              <span className="text-white/40">Nome:</span> {order.customer.name}
            </p>
            <p>
              <span className="text-white/40">Telefone:</span> {order.customer.phone}
            </p>
            {order.fulfillmentMode === "entrega" && addressLabel ? (
              <p>
                <span className="text-white/40">Endereço:</span> {addressLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#25D366]/25 bg-[#25D366]/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#7DFFAD]">WhatsApp do restaurante</p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            {order.status === "approved"
              ? "O pedido foi preparado para envio automático. Se o WhatsApp não abriu, use o botão abaixo."
              : "Assim que o pagamento for aprovado, você pode compartilhar o resumo do pedido com a equipe."}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#25D366] px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#04140a] transition hover:bg-[#35e06f]"
          >
            Enviar pedido via WhatsApp
          </a>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Próximos passos</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-white/65">
            <li>• Acompanhe o status do pagamento nesta página.</li>
            <li>• Para Pix, conclua o pagamento usando o QR Code ou o código copia e cola.</li>
            <li>• Em caso de dúvida, entre em contato pelo WhatsApp da loja.</li>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cardapio"
              className="rounded-full bg-amberglow px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-obsidian transition hover:bg-[#ffcb7d] sm:flex-1"
            >
              Fazer novo pedido
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/10 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-amberglow/35 hover:text-amberglow sm:flex-1"
            >
              Voltar para home
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">{label}</p>
      <p className="mt-2 text-lg font-semibold text-cream">{value}</p>
    </div>
  );
}