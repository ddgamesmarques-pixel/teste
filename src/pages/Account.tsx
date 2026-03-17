import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CreditCard, LoaderCircle, LogOut, Package, RefreshCw, ShieldCheck } from "lucide-react";
import logoV from "@/assets/logo-v.png";
import { useStore } from "@/context/StoreContext";
import { formatCurrency, orderStatusLabel } from "@/lib/store";
import { logoutCustomer } from "@/lib/auth";

const Account = () => {
  const navigate = useNavigate();
  const { orders, customerUser, refreshCustomerUser, syncMyOrders } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!customerUser) navigate("/login", { replace: true });
  }, [customerUser, navigate]);

  useEffect(() => {
    if (customerUser) {
      setRefreshing(true);
      void syncMyOrders().finally(() => setRefreshing(false));
    }
  }, [customerUser, syncMyOrders]);

  if (!customerUser) return null;

  const myOrders = orders.filter((order) => order.customerUserId === customerUser.id);

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[28px] border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src={logoV} alt="Logo" className="h-12 w-12 rounded-2xl" />
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-primary">Minha conta</p>
              <h1 className="mt-1 text-3xl font-bold">Olá, {customerUser.fullName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Acompanhe seus pedidos e a aprovação automática do Pix.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary">Voltar para a loja</Link>
            <button
              onClick={() => {
                logoutCustomer();
                refreshCustomerUser();
                navigate("/login", { replace: true });
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary"
            >
              <LogOut size={16} />Sair
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary" />
              <div>
                <h2 className="text-xl font-bold">Seus pedidos</h2>
                <p className="text-sm text-muted-foreground">Quando o pagamento for aprovado, o status muda automaticamente aqui.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setRefreshing(true);
                void syncMyOrders().finally(() => setRefreshing(false));
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary"
            >
              {refreshing ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Atualizar pedidos
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {myOrders.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border p-8 text-center text-muted-foreground">
                Você ainda não fez pedidos. <Link to="/" className="text-primary underline">Ir para a loja</Link>
              </div>
            ) : (
              myOrders.map((order) => (
                <div key={order.id} className="rounded-[24px] border border-border bg-secondary/20 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-primary" />
                        <h3 className="text-lg font-bold">Pedido {order.id}</h3>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{orderStatusLabel[order.status]}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Criado em {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
                      {order.paymentId ? <p className="mt-1 text-xs text-muted-foreground">Pagamento {order.paymentId}</p> : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(order.total)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <p className="text-sm font-semibold">Itens</p>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {order.items.map((item) => (
                          <p key={item.id}>{item.name} x{item.quantity}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="flex items-center gap-2"><CreditCard size={16} className="text-primary" /><p className="text-sm font-semibold">Pagamento</p></div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {order.status === "paid"
                          ? "Pagamento confirmado automaticamente pela integração Pix."
                          : order.status === "awaiting_store_confirmation"
                            ? "Pagamento sinalizado pelo cliente. Você também pode atualizar para checar a confirmação automática."
                            : "Aguardando você escanear o QR Code e concluir o pagamento."}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
