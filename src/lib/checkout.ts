import type { CartItem } from "@/components/cart-context";

export type CustomerData = {
  name: string;
  email: string;
  phone: string;
  document: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string;
  reference: string;
};

export type PaymentMethod = "pix" | "credit_card";

export type ConfirmationData = {
  orderId: string;
  paymentId: string;
  status: string;
  statusDetail?: string;
  paymentMethod: PaymentMethod;
  fulfillmentMode: "entrega" | "retirada" | "local";
  customer: CustomerData;
  items: CartItem[];
  total: number;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  createdAt: string;
};

const RESTAURANT_WHATSAPP_NUMBER = "5521965565600";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit_card: "Cartão"
};

const statusLabels: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  in_process: "Em processamento",
  authorized: "Autorizado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Reembolsado"
};

const fulfillmentLabels: Record<ConfirmationData["fulfillmentMode"], string> = {
  entrega: "Entrega",
  retirada: "Retirada",
  local: "Consumo no local"
};

export function formatOrderDate(isoString: string) {
  try {
    return new Date(isoString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return isoString;
  }
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatDocument(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const [firstName = "Cliente", ...rest] = parts;

  return {
    firstName,
    lastName: rest.join(" ") || "Modelo"
  };
}

export function buildAddressLabel(customer: CustomerData) {
  const main = [customer.street, customer.number].filter(Boolean).join(", ");
  const details = [customer.neighborhood, customer.city, customer.state].filter(Boolean).join(" • ");
  const extras = [customer.complement, customer.reference].filter(Boolean).join(" • ");

  return [main, details, extras].filter(Boolean).join(" — ");
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return paymentMethodLabels[method];
}

export function getFulfillmentLabel(mode: ConfirmationData["fulfillmentMode"]) {
  return fulfillmentLabels[mode];
}

export function buildWhatsAppOrderMessage(order: ConfirmationData) {
  const statusLabel = statusLabels[order.status] ?? order.status;
  const dateLabel = formatOrderDate(order.createdAt);

  const itemLines = order.items.flatMap((item) => {
    const baseLine = `- ${item.quantity}x ${item.name} - ${formatCurrency(item.quantity * item.unitPrice)}`;
    const optionLines = item.selectedOptions.map(
      (option) =>
        `  • ${option.groupName}: ${option.optionName}${option.price > 0 ? ` (+${formatCurrency(option.price)})` : ""}`
    );

    return [baseLine, ...optionLines];
  });

  const customerLines = [`Nome: ${order.customer.name}`, `Telefone: ${order.customer.phone}`];

  if (order.customer.document) {
    customerLines.push(`CPF: ${order.customer.document}`);
  }

  if (order.fulfillmentMode === "entrega") {
    const address = buildAddressLabel(order.customer);

    if (address) {
      customerLines.push(`Endereço: ${address}`);
    }
  }

  return [
    "🍔 *NOVO PEDIDO - ONIX BURGUER*",
    "",
    `Número do pedido: ${order.orderId}`,
    `ID da transação: ${order.paymentId}`,
    `Data: ${dateLabel}`,
    `Status: ${statusLabel}`,
    `Forma de pagamento: ${getPaymentMethodLabel(order.paymentMethod)}`,
    `Modalidade: ${getFulfillmentLabel(order.fulfillmentMode)}`,
    "",
    "*ITENS:*",
    ...itemLines,
    "",
    `*TOTAL: ${formatCurrency(order.total)}*`,
    "",
    "*CLIENTE:*",
    ...customerLines
  ].join("\n");
}

export function buildWhatsAppOrderUrl(order: ConfirmationData) {
  return `https://wa.me/${RESTAURANT_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppOrderMessage(order))}`;
}

export function getRestaurantWhatsAppUrl() {
  return `https://wa.me/${RESTAURANT_WHATSAPP_NUMBER}`;
}