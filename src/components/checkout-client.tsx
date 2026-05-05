"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { useCart } from "@/components/cart-context";
import {
  buildAddressLabel,
  formatCurrency,
  formatDocument,
  formatPhone,
  formatZipCode,
  normalizeText,
  type ConfirmationData,
  type CustomerData,
  type PaymentMethod
} from "@/lib/checkout";

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => {
      cardForm: (config: {
        amount: string;
        iframe: boolean;
        form: {
          id: string;
          cardNumber: { id: string; placeholder?: string };
          expirationDate: { id: string; placeholder?: string };
          securityCode: { id: string; placeholder?: string };
          cardholderName: { id: string; placeholder?: string };
          issuer: { id: string; placeholder?: string };
          installments: { id: string; placeholder?: string };
          identificationType: { id: string; placeholder?: string };
          identificationNumber: { id: string; placeholder?: string };
          cardholderEmail: { id: string; placeholder?: string };
        };
        callbacks: {
          onFormMounted?: (error?: { message?: string }) => void;
          onSubmit?: (event: Event) => void;
          onFetching?: (resource: string) => () => void;
          onError?: (error: { message?: string }) => void;
        };
      }) => MercadoPagoCardForm;
    };
  }
}

type MercadoPagoCardForm = {
  getCardFormData: () => {
    token: string;
    paymentMethodId: string;
    issuerId: string;
    installments: string;
    identificationType: string;
    identificationNumber: string;
    cardholderEmail: string;
  };
  unmount: () => void;
};

type PaymentResponsePayload = {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  status?: string;
  statusDetail?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  error?: string;
};

const emptyCustomer: CustomerData = {
  name: "",
  email: "",
  phone: "",
  document: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  complement: "",
  reference: ""
};

const fulfillmentLabels = {
  entrega: "Entrega",
  retirada: "Retirada no local",
  local: "Comer no local"
} as const;

export function CheckoutClient() {
  const router = useRouter();
  const {
    clearCart,
    deliveryAddress,
    fulfillmentMode,
    items,
    setDeliveryAddress,
    setFulfillmentMode,
    subtotal,
    total
  } = useCart();

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [customer, setCustomer] = useState<CustomerData>(emptyCustomer);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState("");
  const [formError, setFormError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; valid: boolean } | null>(null);
  const [appliedPromoId, setAppliedPromoId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<
    Pick<
      ConfirmationData,
      "pixQrCode" | "pixQrCodeBase64" | "paymentId" | "orderId" | "status" | "statusDetail"
    > | null
  >(null);
  const cardFormRef = useRef<MercadoPagoCardForm | null>(null);

  const isDelivery = fulfillmentMode === "entrega";
  const canRenderCard = paymentMethod === "credit_card" && total > 0 && Boolean(publicKey);

  useEffect(() => {
    if (fulfillmentMode === "entrega" && deliveryAddress && !customer.reference.trim()) {
      setCustomer((current) => ({
        ...current,
        reference: deliveryAddress
      }));
    }
  }, [customer.reference, deliveryAddress, fulfillmentMode]);

  useEffect(() => {
    if (!canRenderCard) {
      if (cardFormRef.current) {
        cardFormRef.current.unmount();
        cardFormRef.current = null;
      }

      setCardReady(false);
      setCardError("");
      return;
    }

    let active = true;

    async function setupCardForm() {
      try {
        await loadMercadoPago();

        if (!active || !window.MercadoPago) {
          return;
        }

        if (cardFormRef.current) {
          cardFormRef.current.unmount();
          cardFormRef.current = null;
        }

        const mercadoPago = new window.MercadoPago(publicKey, { locale: "pt-BR" });

        cardFormRef.current = mercadoPago.cardForm({
          amount: total.toFixed(2),
          iframe: true,
          form: {
            id: "onix-card-form",
            cardNumber: { id: "form-checkout__cardNumber", placeholder: "Número do cartão" },
            expirationDate: { id: "form-checkout__expirationDate", placeholder: "MM/AA" },
            securityCode: { id: "form-checkout__securityCode", placeholder: "CVV" },
            cardholderName: { id: "form-checkout__cardholderName", placeholder: "Nome do titular" },
            issuer: { id: "form-checkout__issuer", placeholder: "Banco emissor" },
            installments: { id: "form-checkout__installments", placeholder: "Parcelas" },
            identificationType: {
              id: "form-checkout__identificationType",
              placeholder: "Tipo de documento"
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: "Número do documento"
            },
            cardholderEmail: { id: "form-checkout__cardholderEmail", placeholder: "E-mail do titular" }
          },
          callbacks: {
            onFormMounted: (error) => {
              if (!active) {
                return;
              }

              if (error) {
                setCardError("Não foi possível carregar o formulário do cartão.");
                setCardReady(false);
                return;
              }

              setCardError("");
              setCardReady(true);
            },
            onSubmit: (event) => {
              event.preventDefault();
            },
            onFetching: () => {
              setCardError("");
              return () => undefined;
            },
            onError: (error) => {
              if (!active) {
                return;
              }

              setCardError(error.message || "Erro ao validar os dados do cartão.");
            }
          }
        });
      } catch {
        if (active) {
          setCardError("Não foi possível iniciar o Mercado Pago.");
          setCardReady(false);
        }
      }
    }

    setupCardForm();

    return () => {
      active = false;
      if (cardFormRef.current) {
        cardFormRef.current.unmount();
        cardFormRef.current = null;
      }
    };
  }, [canRenderCard, publicKey, total]);

  const summaryAddress = useMemo(() => buildAddressLabel(customer), [customer]);

  function updateCustomer<K extends keyof CustomerData>(field: K, value: CustomerData[K]) {
    setCustomer((current) => ({
      ...current,
      [field]: value
    }));
  }

  function validateForm() {
    if (items.length === 0) {
      return "Seu carrinho está vazio.";
    }

    if (!customer.name.trim()) {
      return "Informe o nome do cliente.";
    }

    if (!customer.phone.trim()) {
      return "Informe o telefone para contato.";
    }

    if (!customer.email.trim()) {
      return "Informe o e-mail do cliente.";
    }

    if (!customer.document.trim()) {
      return "Informe o CPF do cliente.";
    }

    if (isDelivery) {
      const requiredFields: Array<[keyof CustomerData, string]> = [
        ["street", "rua"],
        ["number", "número"],
        ["neighborhood", "bairro"],
        ["city", "cidade"],
        ["state", "estado"],
        ["zipCode", "CEP"]
      ];

      const missing = requiredFields.find(([field]) => !customer[field].trim());
      if (missing) {
        return `Informe o campo ${missing[1]} para entrega.`;
      }
    }

    if (paymentMethod === "credit_card" && !publicKey) {
      return "Configure a chave pública do Mercado Pago para habilitar cartão.";
    }

    return "";
  }

  const finalTotal = Math.max(0, total - couponDiscount);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), total })
      });
      const data = (await res.json()) as {
        valid: boolean;
        discount?: number;
        error?: string;
        promotion?: { id: string; name: string };
      };
      if (data.valid && data.discount !== undefined) {
        setCouponDiscount(data.discount);
        setAppliedPromoId(data.promotion?.id ?? null);
        setCouponMsg({ text: `Cupom aplicado: -R$ ${data.discount.toFixed(2)}`, valid: true });
      } else {
        setCouponDiscount(0);
        setAppliedPromoId(null);
        setCouponMsg({ text: data.error ?? "Cupom inválido", valid: false });
      }
    } catch {
      setCouponMsg({ text: "Erro ao validar cupom", valid: false });
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponDiscount(0);
    setAppliedPromoId(null);
    setCouponMsg(null);
  }

  function saveConfirmation(data: ConfirmationData) {
    window.localStorage.setItem("hamburgueria-modelo-last-order", JSON.stringify(data));
  }

  async function submitPix() {
    const response = await fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod,
        fulfillmentMode,
        customer,
        items,
        total: finalTotal,
        couponCode: appliedPromoId ? couponCode : undefined,
        discount: couponDiscount > 0 ? couponDiscount : undefined
      })
    });

    const payload = (await response.json()) as PaymentResponsePayload;

    if (!response.ok || !payload.success || !payload.paymentId || !payload.orderId || !payload.status) {
      throw new Error(payload.error || "Não foi possível gerar o pagamento via Pix.");
    }

    const confirmation: ConfirmationData = {
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      status: payload.status,
      statusDetail: payload.statusDetail,
      paymentMethod: "pix",
      fulfillmentMode,
      customer,
      items,
      total: finalTotal,
      pixQrCode: payload.pixQrCode,
      pixQrCodeBase64: payload.pixQrCodeBase64,
      createdAt: new Date().toISOString()
    };

    setPixData({
      pixQrCode: payload.pixQrCode,
      pixQrCodeBase64: payload.pixQrCodeBase64,
      paymentId: payload.paymentId,
      orderId: payload.orderId,
      status: payload.status,
      statusDetail: payload.statusDetail
    });

    saveConfirmation(confirmation);
    clearCart();
    router.push(`/confirmacao?orderId=${payload.orderId}&paymentId=${payload.paymentId}`);
  }

  async function submitCard() {
    if (!cardFormRef.current) {
      throw new Error("O formulário do cartão ainda não está pronto.");
    }

    const cardData = cardFormRef.current.getCardFormData();

    if (!cardData.token) {
      throw new Error("Preencha os dados do cartão antes de continuar.");
    }

    const response = await fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod,
        fulfillmentMode,
        customer,
        items,
        total: finalTotal,
        card: {
          token: cardData.token,
          issuerId: cardData.issuerId ? Number(cardData.issuerId) : undefined,
          paymentMethodId: cardData.paymentMethodId,
          installments: Number(cardData.installments || "1"),
          identificationType: cardData.identificationType,
          identificationNumber: cardData.identificationNumber,
          email: cardData.cardholderEmail
        }
      })
    });

    const payload = (await response.json()) as PaymentResponsePayload;

    if (!response.ok || !payload.success || !payload.paymentId || !payload.orderId || !payload.status) {
      throw new Error(payload.error || "Pagamento com cartão não aprovado.");
    }

    const confirmation: ConfirmationData = {
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      status: payload.status,
      statusDetail: payload.statusDetail,
      paymentMethod: "credit_card",
      fulfillmentMode,
      customer,
      items,
      total: finalTotal,
      createdAt: new Date().toISOString()
    };

    saveConfirmation(confirmation);
    clearCart();
    router.push(`/confirmacao?orderId=${payload.orderId}&paymentId=${payload.paymentId}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setPixData(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setProcessing(true);

    try {
      if (paymentMethod === "pix") {
        await submitPix();
      } else {
        await submitCard();
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-3 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-14">
      <form
        id="onix-card-form"
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-amber sm:space-y-6 sm:p-8"
      >
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-amberglow">Checkout</p>
          <h1 className="font-title text-3xl uppercase tracking-[0.08em] text-cream sm:text-5xl sm:tracking-[0.1em] lg:text-6xl">
            Finalizar pedido
          </h1>
          <p className="max-w-2xl text-xs leading-6 text-white/65 sm:text-sm sm:leading-7">
            Revise os itens, preencha seus dados e conclua o pagamento sem sair do site.
          </p>
        </div>

        <section className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Modalidade</p>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {Object.entries(fulfillmentLabels).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFulfillmentMode(mode as "entrega" | "retirada" | "local")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  fulfillmentMode === mode
                    ? "border-amberglow/60 bg-amberglow/10 text-cream"
                    : "border-white/10 bg-[#0b0b0b] text-white/65 hover:border-amberglow/30 hover:text-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Dados do cliente</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="Nome completo"
              value={customer.name}
              onChange={(value) => updateCustomer("name", value)}
              placeholder="Seu nome"
            />
            <Field
              label="Telefone"
              value={customer.phone}
              onChange={(value) => updateCustomer("phone", formatPhone(value))}
              placeholder="(21) 99999-9999"
            />
            <Field
              label="E-mail"
              type="email"
              value={customer.email}
              onChange={(value) => updateCustomer("email", value)}
              placeholder="voce@email.com"
            />
            <Field
              label="CPF"
              value={customer.document}
              onChange={(value) => updateCustomer("document", formatDocument(value))}
              placeholder="000.000.000-00"
            />
          </div>
        </section>

        {isDelivery ? (
          <section className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Endereço de entrega</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Rua" value={customer.street} onChange={(value) => updateCustomer("street", value)} />
              <Field label="Número" value={customer.number} onChange={(value) => updateCustomer("number", value)} />
              <Field
                label="Bairro"
                value={customer.neighborhood}
                onChange={(value) => updateCustomer("neighborhood", value)}
              />
              <Field label="Cidade" value={customer.city} onChange={(value) => updateCustomer("city", value)} />
              <Field
                label="Estado"
                value={customer.state}
                onChange={(value) => updateCustomer("state", normalizeText(value).toUpperCase().slice(0, 2))}
                placeholder="RJ"
              />
              <Field
                label="CEP"
                value={customer.zipCode}
                onChange={(value) => updateCustomer("zipCode", formatZipCode(value))}
                placeholder="00000-000"
              />
              <Field
                label="Complemento"
                value={customer.complement}
                onChange={(value) => updateCustomer("complement", value)}
              />
              <Field
                label="Referência"
                value={customer.reference}
                onChange={(value) => {
                  updateCustomer("reference", value);
                  setDeliveryAddress(value);
                }}
              />
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Cupom de desconto</p>
          {couponDiscount > 0 ? (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-amberglow/30 bg-amberglow/5 px-4 py-3">
              <div>
                <p className="font-mono text-sm font-semibold text-amberglow">{couponCode}</p>
                <p className="text-xs text-white/50">Desconto: -{formatCurrency(couponDiscount)}</p>
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                className="rounded-full border border-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
              >
                Remover
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO DO CUPOM"
                className="flex-1 rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 font-mono text-sm text-cream uppercase outline-none transition placeholder:text-white/25 focus:border-amberglow/50"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="rounded-2xl border border-amberglow/30 bg-amberglow/10 px-4 py-3 text-sm font-medium text-amberglow transition hover:bg-amberglow/20 disabled:opacity-50"
              >
                {couponLoading ? "..." : "Aplicar"}
              </button>
            </div>
          )}
          {couponMsg && !couponDiscount && (
            <p className={`mt-2 text-xs ${couponMsg.valid ? "text-green-400" : "text-red-400"}`}>
              {couponMsg.text}
            </p>
          )}
        </section>

        <section className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Forma de pagamento</p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <ToggleCard
              active={paymentMethod === "pix"}
              title="Pix"
              description="QR Code e código copia e cola."
              onClick={() => setPaymentMethod("pix")}
            />
            <ToggleCard
              active={paymentMethod === "credit_card"}
              title="Cartão de crédito"
              description="Pagamento inline com Mercado Pago."
              onClick={() => setPaymentMethod("credit_card")}
            />
          </div>

          {paymentMethod === "pix" ? (
            <div className="mt-4 rounded-2xl border border-dashed border-amberglow/30 bg-amberglow/5 p-4 text-sm text-white/65">
              O Pix será gerado assim que você confirmar o pedido.
            </div>
          ) : (
            <div className="mt-4 space-y-4 rounded-[1.5rem] border border-white/10 bg-[#0b0b0b] p-4">
              {!publicKey ? (
                <div className="rounded-2xl border border-[#ff8f8f]/20 bg-[#ff8f8f]/10 p-4 text-sm text-[#ffd3d3]">
                  Defina `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` em `.env.local` para habilitar pagamentos com cartão.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">
                    Número do cartão
                  </label>
                  <div id="form-checkout__cardNumber" className="mercado-pago-field min-h-12 rounded-2xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">Validade</label>
                    <div id="form-checkout__expirationDate" className="mercado-pago-field min-h-12 rounded-2xl" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">CVV</label>
                    <div id="form-checkout__securityCode" className="mercado-pago-field min-h-12 rounded-2xl" />
                  </div>
                </div>
                <Field label="Titular" name="form-checkout__cardholderName" placeholder="Nome igual ao cartão" />
                <Field
                  label="E-mail do titular"
                  type="email"
                  name="form-checkout__cardholderEmail"
                  placeholder="titular@email.com"
                />
                <SelectField label="Banco emissor" name="form-checkout__issuer" />
                <SelectField label="Parcelas" name="form-checkout__installments" />
                <SelectField label="Tipo de documento" name="form-checkout__identificationType" />
                <Field
                  label="Número do documento"
                  name="form-checkout__identificationNumber"
                  placeholder="CPF do titular"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/45">
                <span
                  className={`inline-flex rounded-full px-3 py-1 ${
                    cardReady ? "bg-amberglow/15 text-amberglow" : "bg-white/5 text-white/45"
                  }`}
                >
                  {cardReady ? "Cartão pronto" : "Carregando cartão"}
                </span>
                {cardError ? <span className="text-[#ffb6b6]">{cardError}</span> : null}
              </div>
            </div>
          )}
        </section>

        {formError ? (
          <div className="rounded-2xl border border-[#ff8f8f]/20 bg-[#ff8f8f]/10 px-4 py-3 text-sm text-[#ffd3d3]">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={processing || items.length === 0 || (paymentMethod === "credit_card" && !cardReady)}
          className="flex w-full items-center justify-center rounded-full bg-amberglow px-6 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-obsidian transition hover:bg-[#ffcb7d] disabled:cursor-not-allowed disabled:bg-amberglow/50"
        >
          {processing
            ? "Processando pagamento..."
            : paymentMethod === "pix"
            ? `Gerar Pix — ${formatCurrency(finalTotal)}`
            : `Pagar ${formatCurrency(finalTotal)}`}
        </button>

        {pixData?.orderId ? (
          <div className="rounded-[1.6rem] border border-amberglow/20 bg-amberglow/5 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Pagamento gerado</p>
            <p className="mt-3 text-sm text-white/65">Pedido {pixData.orderId}</p>
          </div>
        ) : null}
      </form>

      <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-amber sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Resumo</p>
              <h2 className="mt-2 font-title text-3xl uppercase tracking-[0.06em] text-cream sm:text-4xl sm:tracking-[0.08em]">Seu pedido</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
              {fulfillmentLabels[fulfillmentMode]}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {items.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
                Seu carrinho está vazio. Volte ao cardápio para adicionar itens.
              </div>
            ) : (
              items.map((item) => (
                <article key={item.key} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
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
                    <p className="font-semibold text-amberglow">{formatCurrency(item.quantity * item.unitPrice)}</p>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
            <div className="flex items-center justify-between text-white/60">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-green-400">
                <span>Desconto (cupom)</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold text-cream">
              <span>Total</span>
              <span className="text-lg text-amberglow">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amberglow">Conferência rápida</p>
          <div className="mt-4 space-y-3 text-sm text-white/65">
            <p>
              <span className="text-white/40">Cliente:</span> {customer.name || "Não informado"}
            </p>
            <p>
              <span className="text-white/40">Telefone:</span> {customer.phone || "Não informado"}
            </p>
            <p>
              <span className="text-white/40">Pagamento:</span> {paymentMethod === "pix" ? "Pix" : "Cartão de crédito"}
            </p>
            {isDelivery ? (
              <p>
                <span className="text-white/40">Entrega:</span> {summaryAddress || "Preencha o endereço"}
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </section>
  );
}

type FieldProps = {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  name?: string;
};

function Field({ label, value, onChange, placeholder, type = "text", name }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-cream outline-none transition placeholder:text-white/25 focus:border-amberglow/50"
      />
    </label>
  );
}

function SelectField({ label, name }: { label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/45">{label}</span>
      <select
        id={name}
        name={name}
        className="w-full rounded-2xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-cream outline-none transition focus:border-amberglow/50"
      >
        <option value="">Selecione</option>
      </select>
    </label>
  );
}

function ToggleCard({
  active,
  title,
  description,
  onClick
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? "border-amberglow/60 bg-amberglow/10 text-cream"
          : "border-white/10 bg-[#0b0b0b] text-white/65 hover:border-amberglow/30 hover:text-cream"
      }`}
    >
      <span className="block text-sm font-semibold uppercase tracking-[0.2em]">{title}</span>
      <span className="mt-1 block text-xs text-white/55">{description}</span>
    </button>
  );
}
