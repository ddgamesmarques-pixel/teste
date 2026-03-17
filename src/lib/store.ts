import type { Product } from "@/data/products";

export type CartItem = Product & { quantity: number };

export type CheckoutData = {
  fullName: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  note: string;
};

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "awaiting_store_confirmation"
  | "paid"
  | "separated"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  customerUserId?: string;
  customerUserEmail?: string;
  createdAt: string;
  customer: CheckoutData;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  pixCode: string;
  qrCodeBase64?: string;
  paymentId?: string;
  paymentStatus?: string;
  paymentExpiresAt?: string;
  status: OrderStatus;
  paymentSentAt?: string;
  paymentConfirmedAt?: string;
};

export const STORAGE_KEYS = {
  cart: "clickvape_cart",
  checkout: "clickvape_checkout",
  orders: "clickvape_orders",
  adminSession: "clickvape_admin_session",
} as const;

export const storeConfig = {
  name: import.meta.env.VITE_STORE_NAME || "Click Vape",
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999",
  pixKey: import.meta.env.VITE_PIX_KEY || "contato@clickvape.com",
  pixKeyType: import.meta.env.VITE_PIX_KEY_TYPE || "email",
  pixCity: import.meta.env.VITE_PIX_CITY || "SAO PAULO",
  shipping: Number(import.meta.env.VITE_FIXED_SHIPPING || 15),
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || "123456",
};

export const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const maskPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const maskCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const getCartSubtotal = (items: CartItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const getCartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0);

export const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

const emv = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

const crc16 = (payload: string) => {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

export const buildPixCode = ({ amount, orderId }: { amount: number; orderId: string }) => {
  const merchantName = storeConfig.name.toUpperCase().slice(0, 25);
  const merchantCity = storeConfig.pixCity.toUpperCase().slice(0, 15);
  const amountText = amount.toFixed(2);

  const gui = emv("00", "br.gov.bcb.pix");
  const key = emv("01", storeConfig.pixKey);
  const desc = emv("02", `Pedido ${orderId}`.slice(0, 72));
  const merchantAccountInfo = emv("26", `${gui}${key}${desc}`);
  const additionalData = emv("62", emv("05", orderId.slice(-10)));

  const payloadWithoutCrc = [
    emv("00", "01"),
    emv("01", "12"),
    merchantAccountInfo,
    emv("52", "0000"),
    emv("53", "986"),
    emv("54", amountText),
    emv("58", "BR"),
    emv("59", merchantName),
    emv("60", merchantCity),
    additionalData,
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`;
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Novo pedido",
  awaiting_payment: "Aguardando pagamento",
  awaiting_store_confirmation: "Pagamento em análise",
  paid: "Pago",
  separated: "Separado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const normalizeGatewayStatus = (status?: string): OrderStatus | null => {
  const normalized = (status || "").toLowerCase();
  if (!normalized) return null;
  if (["approved", "paid", "completed"].includes(normalized)) return "paid";
  if (["pending", "waiting_payment", "awaiting_payment"].includes(normalized)) return "awaiting_payment";
  if (["expired"].includes(normalized)) return "cancelled";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";
  return null;
};

export const buildWhatsAppMessage = (order: Order) => {
  const items = order.items
    .map((item) => `- ${item.name} x${item.quantity} (${formatCurrency(item.price * item.quantity)})`)
    .join("\n");

  const address = [
    `${order.customer.street}, ${order.customer.number}`,
    order.customer.complement,
    `${order.customer.neighborhood} - ${order.customer.city}/${order.customer.state}`,
    `CEP: ${order.customer.cep}`,
  ]
    .filter(Boolean)
    .join("\n");

  return encodeURIComponent(
    [
      `*Novo pedido - ${storeConfig.name}*`,
      `Pedido: ${order.id}`,
      order.paymentId ? `Pagamento: ${order.paymentId}` : "",
      "",
      "*Itens*",
      items,
      "",
      `Subtotal: ${formatCurrency(order.subtotal)}`,
      `Frete: ${formatCurrency(order.shipping)}`,
      `Total: ${formatCurrency(order.total)}`,
      "",
      "*Cliente*",
      `${order.customer.fullName}`,
      `${order.customer.phone}`,
      order.customer.email || "Sem e-mail",
      "",
      "*Entrega*",
      address,
      order.customer.note ? `Obs: ${order.customer.note}` : "",
      "",
      "*Pagamento*",
      order.status === "paid" ? "Pix aprovado automaticamente." : "Aguardando aprovação automática do Pix.",
    ]
      .filter(Boolean)
      .join("\n"),
  );
};
