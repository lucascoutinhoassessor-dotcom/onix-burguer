import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import type { CartItem } from "@/components/cart-context";
import { normalizeText, splitName, type CustomerData } from "@/lib/checkout";
import { supabaseAdmin } from "@/lib/supabase";

type FulfillmentMode = "entrega" | "retirada" | "local";
type PaymentMethod = "pix" | "credit_card";

type PaymentRequestBody = {
  paymentMethod: PaymentMethod;
  fulfillmentMode: FulfillmentMode;
  customer: CustomerData;
  items: CartItem[];
  total: number;
  card?: {
    token: string;
    issuerId?: number;
    paymentMethodId: string;
    installments: number;
    identificationType: string;
    identificationNumber: string;
    email: string;
  };
};

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Configuração do Mercado Pago ausente. Preencha MERCADOPAGO_ACCESS_TOKEN.");
  }

  const client = new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000
    }
  });

  return new Payment(client);
}

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getOrderId() {
  return `ONIX-${Date.now()}`;
}

function buildDescription(items: CartItem[]) {
  return items
    .slice(0, 3)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(", ")
    .slice(0, 240);
}

function buildAdditionalInfo(items: CartItem[], customer: CustomerData, fulfillmentMode: FulfillmentMode) {
  return {
    items: items.map((item) => ({
      id: item.itemId,
      title: item.name,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice.toFixed(2))
    })),
    payer: {
      first_name: splitName(customer.name).firstName,
      last_name: splitName(customer.name).lastName,
      phone: {
        number: sanitizeDigits(customer.phone)
      }
    },
    shipments:
      fulfillmentMode === "entrega"
        ? {
            receiver_address: {
              zip_code: sanitizeDigits(customer.zipCode),
              street_name: customer.street,
              street_number: sanitizeDigits(customer.number) || "0"
            }
          }
        : undefined
  };
}

function buildPayer(customer: CustomerData, fulfillmentMode: FulfillmentMode) {
  const { firstName, lastName } = splitName(customer.name);

  return {
    email: customer.email,
    first_name: firstName,
    last_name: lastName,
    entity_type: "individual",
    type: "customer",
    identification: {
      type: "CPF",
      number: sanitizeDigits(customer.document)
    },
    phone: {
      area_code: sanitizeDigits(customer.phone).slice(0, 2),
      number: sanitizeDigits(customer.phone).slice(2)
    },
    address:
      fulfillmentMode === "entrega"
        ? {
            zip_code: sanitizeDigits(customer.zipCode),
            street_name: customer.street,
            street_number: sanitizeDigits(customer.number) || "0",
            neighborhood: customer.neighborhood,
            city: customer.city,
            federal_unit: normalizeText(customer.state).toUpperCase()
          }
        : undefined
  };
}

function validatePayload(body: PaymentRequestBody) {
  if (!body.items?.length) {
    return "Carrinho vazio.";
  }

  if (!body.customer?.name || !body.customer.phone || !body.customer.email || !body.customer.document) {
    return "Dados do cliente incompletos.";
  }

  if (body.fulfillmentMode === "entrega") {
    const { street, number, neighborhood, city, state, zipCode } = body.customer;
    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
      return "Endereço de entrega incompleto.";
    }
  }

  if (body.paymentMethod === "credit_card") {
    if (!body.card?.token || !body.card.paymentMethodId) {
      return "Dados do cartão incompletos.";
    }
  }

  return "";
}

function extractPixData(paymentResponse: unknown) {
  const paymentWithPix = paymentResponse as {
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
      };
    };
  };

  return {
    qrCode: paymentWithPix.point_of_interaction?.transaction_data?.qr_code,
    qrCodeBase64: paymentWithPix.point_of_interaction?.transaction_data?.qr_code_base64
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentRequestBody;
    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const paymentClient = getClient();
    const orderId = getOrderId();

    const paymentBody =
      body.paymentMethod === "pix"
        ? {
            transaction_amount: Number(body.total.toFixed(2)),
            description: buildDescription(body.items),
            payment_method_id: "pix",
            external_reference: orderId,
            payer: buildPayer(body.customer, body.fulfillmentMode),
            additional_info: buildAdditionalInfo(body.items, body.customer, body.fulfillmentMode)
          }
        : {
            transaction_amount: Number(body.total.toFixed(2)),
            description: buildDescription(body.items),
            payment_method_id: body.card?.paymentMethodId,
            token: body.card?.token,
            installments: body.card?.installments || 1,
            issuer_id: body.card?.issuerId,
            external_reference: orderId,
            payer: {
              ...buildPayer(body.customer, body.fulfillmentMode),
              email: body.card?.email || body.customer.email,
              identification: {
                type: body.card?.identificationType || "CPF",
                number: sanitizeDigits(body.card?.identificationNumber || body.customer.document)
              }
            },
            additional_info: buildAdditionalInfo(body.items, body.customer, body.fulfillmentMode)
          };

    const payment = await paymentClient.create({
      body: paymentBody,
      requestOptions: {
        idempotencyKey: randomUUID()
      }
    });

    const { qrCode, qrCodeBase64 } = extractPixData(payment);

    // Persist order in Supabase (non-blocking — failures don't abort checkout)
    try {
      const orderStatus = payment.status === "approved" ? "confirmed" : "pending";
      await supabaseAdmin.from("orders").insert({
        order_id: payment.external_reference || orderId,
        customer_name: body.customer.name,
        customer_phone: body.customer.phone,
        customer_email: body.customer.email ?? null,
        items: body.items,
        total: body.total,
        status: orderStatus,
        payment_method: body.paymentMethod,
        fulfillment_mode: body.fulfillmentMode,
        payment_id: String(payment.id)
      });
      await supabaseAdmin.from("order_status_history").insert({
        order_id: payment.external_reference || orderId,
        status: orderStatus
      });
    } catch (dbErr) {
      console.error("Supabase order save failed (non-critical):", dbErr);
    }

    return NextResponse.json({
      success: true,
      orderId: payment.external_reference || orderId,
      paymentId: String(payment.id),
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentMethod: body.paymentMethod,
      pixQrCode: qrCode,
      pixQrCodeBase64: qrCodeBase64
    });
  } catch (error: unknown) {
    const errorWithCause = error as { cause?: { message?: string }; message?: string };
    const message =
      errorWithCause?.cause?.message ||
      errorWithCause?.message ||
      "Não foi possível processar o pagamento com o Mercado Pago.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "Informe o paymentId." }, { status: 400 });
    }

    const paymentClient = getClient();
    const payment = await paymentClient.get({
      id: paymentId
    });
    const { qrCode, qrCodeBase64 } = extractPixData(payment);

    return NextResponse.json({
      success: true,
      orderId: payment.external_reference,
      paymentId: String(payment.id),
      status: payment.status,
      statusDetail: payment.status_detail,
      pixQrCode: qrCode,
      pixQrCodeBase64: qrCodeBase64
    });
  } catch (error: unknown) {
    const errorWithCause = error as { cause?: { message?: string }; message?: string };
    const message =
      errorWithCause?.cause?.message || errorWithCause?.message || "Não foi possível consultar o pagamento.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

