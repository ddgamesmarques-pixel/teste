import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { products, type Product } from "@/data/products";
import { getCustomerSession, type CustomerUser } from "@/lib/auth";
import { checkRemotePayment, createRemotePayment } from "@/lib/payments";
import {
  STORAGE_KEYS,
  buildPixCode,
  getCartCount,
  getCartSubtotal,
  normalizeGatewayStatus,
  readStorage,
  storeConfig,
  type CartItem,
  type CheckoutData,
  type Order,
  type OrderStatus,
  writeStorage,
} from "@/lib/store";

const initialCheckout: CheckoutData = {
  fullName: "",
  phone: "",
  email: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  note: "",
};

type StoreContextValue = {
  products: Product[];
  cart: CartItem[];
  checkout: CheckoutData;
  orders: Order[];
  subtotal: number;
  shipping: number;
  total: number;
  cartCount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  updateCheckout: (payload: Partial<CheckoutData>) => void;
  createOrder: () => Promise<Order | null>;
  customerUser: CustomerUser | null;
  refreshCustomerUser: () => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markOrderAwaitingStoreConfirmation: (orderId: string) => void;
  syncOrderPayment: (orderId: string) => Promise<Order | null>;
  syncMyOrders: () => Promise<void>;
  isAdminLogged: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const applyStatusSideEffects = (order: Order, status: OrderStatus, gatewayStatus?: string): Order => ({
  ...order,
  status,
  paymentStatus: gatewayStatus ?? order.paymentStatus,
  paymentConfirmedAt: status === "paid" && !order.paymentConfirmedAt ? new Date().toISOString() : order.paymentConfirmedAt,
});

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(STORAGE_KEYS.cart, []));
  const [checkout, setCheckout] = useState<CheckoutData>(() => readStorage(STORAGE_KEYS.checkout, initialCheckout));
  const [orders, setOrders] = useState<Order[]>(() => readStorage(STORAGE_KEYS.orders, []));
  const [isAdminLogged, setIsAdminLogged] = useState<boolean>(() => readStorage(STORAGE_KEYS.adminSession, false));
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => getCustomerSession());

  useEffect(() => writeStorage(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => writeStorage(STORAGE_KEYS.checkout, checkout), [checkout]);
  useEffect(() => writeStorage(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => writeStorage(STORAGE_KEYS.adminSession, isAdminLogged), [isAdminLogged]);

  const subtotal = useMemo(() => getCartSubtotal(cart), [cart]);
  const shipping = cart.length ? storeConfig.shipping : 0;
  const total = subtotal + shipping;
  const cartCount = useMemo(() => getCartCount(cart), [cart]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCart((current) => current.filter((item) => item.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart((current) => current.map((item) => (item.id === productId ? { ...item, quantity } : item)));
  };

  const clearCart = () => setCart([]);
  const updateCheckout = (payload: Partial<CheckoutData>) => setCheckout((current) => ({ ...current, ...payload }));
  const refreshCustomerUser = () => setCustomerUser(getCustomerSession());

  const createOrder = async () => {
    if (!cart.length || !customerUser) return null;
    const id = `CV${Date.now().toString().slice(-8)}`;

    const orderBase: Order = {
      id,
      customerUserId: customerUser.id,
      customerUserEmail: customerUser.email,
      createdAt: new Date().toISOString(),
      customer: checkout,
      items: cart,
      subtotal,
      shipping,
      total,
      pixCode: buildPixCode({ amount: total, orderId: id }),
      status: "awaiting_payment",
      paymentStatus: "pending",
    };

    try {
      const payment = await createRemotePayment({ amount: total, externalId: id });
      const order: Order = {
        ...orderBase,
        paymentId: payment.id,
        paymentStatus: payment.status,
        pixCode: payment.pixCopiaECola || orderBase.pixCode,
        qrCodeBase64: payment.qrCodeBase64,
        paymentExpiresAt: payment.expiresAt,
      };
      setOrders((current) => [order, ...current]);
      return order;
    } catch {
      setOrders((current) => [orderBase, ...current]);
      return orderBase;
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((current) => current.map((order) => (order.id === orderId ? applyStatusSideEffects(order, status) : order)));
  };

  const markOrderAwaitingStoreConfirmation = (orderId: string) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: order.status === "paid" ? order.status : "awaiting_store_confirmation",
              paymentSentAt: order.paymentSentAt || new Date().toISOString(),
            }
          : order,
      ),
    );
  };

  const syncOrderPayment = async (orderId: string) => {
    const target = orders.find((order) => order.id === orderId);
    if (!target?.paymentId) return target ?? null;
    try {
      const payment = await checkRemotePayment(target.paymentId);
      const nextStatus = normalizeGatewayStatus(payment.status) ?? target.status;
      let updated: Order | null = null;
      setOrders((current) =>
        current.map((order) => {
          if (order.id !== orderId) return order;
          updated = {
            ...applyStatusSideEffects(order, nextStatus, payment.status),
            pixCode: payment.pixCopiaECola || order.pixCode,
            qrCodeBase64: payment.qrCodeBase64 || order.qrCodeBase64,
            paymentExpiresAt: payment.expiresAt || order.paymentExpiresAt,
          };
          return updated;
        }),
      );
      return updated;
    } catch {
      return target;
    }
  };

  const syncMyOrders = async () => {
    const mine = orders.filter((order) => order.customerUserId === customerUser?.id && order.paymentId);
    await Promise.all(mine.map((order) => syncOrderPayment(order.id)));
  };

  const loginAdmin = (password: string) => {
    const success = password === storeConfig.adminPassword;
    setIsAdminLogged(success);
    return success;
  };

  const logoutAdmin = () => setIsAdminLogged(false);

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        checkout,
        orders,
        subtotal,
        shipping,
        total,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        updateCheckout,
        createOrder,
        customerUser,
        refreshCustomerUser,
        updateOrderStatus,
        markOrderAwaitingStoreConfirmation,
        syncOrderPayment,
        syncMyOrders,
        isAdminLogged,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
};
