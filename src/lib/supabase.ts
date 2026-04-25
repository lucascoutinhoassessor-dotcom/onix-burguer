import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (uses service role key, bypasses RLS) — server-side only
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey ?? supabaseAnonKey);

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "saiu_para_entrega"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado"
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  preparing: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  ready: "text-green-400 bg-green-400/10 border-green-400/30",
  saiu_para_entrega: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  delivered: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/30"
};

export type DbOrder = {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: unknown;
  total: number;
  status: OrderStatus;
  payment_method: string;
  fulfillment_mode: string;
  payment_id: string | null;
  created_at: string;
};

export type DbMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
  active: boolean;
  option_groups: unknown;
  sort_order: number;
  created_at: string;
};

// Role types
export type EmployeeRole = "owner" | "manager" | "staff" | "motoboy";

export type EmployeePermission =
  | "dashboard"
  | "pedidos"
  | "cardapio"
  | "promocoes"
  | "estoque"
  | "financeiro"
  | "colaboradores"
  | "integracoes"
  | "clientes";

export type DbEmployee = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: EmployeeRole;
  active: boolean;
  cpf: string | null;
  cnh: string | null;
  document_photo_url: string | null;
  permissions: EmployeePermission[] | null;
  created_at: string;
};

export type DbPromotion = {
  id: string;
  name: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  code: string | null;
  min_order: number;
  start_at: string | null;
  end_at: string | null;
  active: boolean;
  uses_count: number;
  max_uses: number | null;
  created_at: string;
};

export type DbMarketingCampaign = {
  id: string;
  type: "individual" | "mass";
  target: string | null;
  filters: unknown;
  message: string;
  status: "draft" | "sent" | "failed";
  sent_at: string | null;
  delivered_count: number;
  created_at: string;
};

export type DbFinancialEntry = {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  order_id: string | null;
  created_at: string;
};

export type DbSupplier = {
  id: string;
  name: string;
  legal_name: string | null;
  phone: string | null;
  cnpj_cpf: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
};

export type DbInventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  created_at: string;
};

export type CustomerOrigin = "site" | "manual" | "ifood" | "api";

export type DbCustomerAccount = {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  origin: CustomerOrigin;
  registered_at: string;
  last_order_at: string | null;
  created_at: string;
};

export type DbIntegration = {
  id: string;
  platform: string;
  api_key: string | null;
  api_secret: string | null;
  webhook_url: string | null;
  active: boolean;
  created_at: string;
};
