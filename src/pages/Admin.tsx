import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, LoaderCircle, LockKeyhole, LogOut, PackageCheck, RefreshCw, ShieldCheck } from "lucide-react";
import logoV from "@/assets/logo-v.png";
import { useStore } from "@/context/StoreContext";
import { formatCurrency, orderStatusLabel, type OrderStatus } from "@/lib/store";

const statuses: OrderStatus[] = ["awaiting_payment", "awaiting_store_confirmation", "paid", "separated", "shipped", "delivered", "cancelled"];

const Admin = () => {
  const { orders, isAdminLogged, loginAdmin, logoutAdmin, updateOrderStatus, syncOrderPayment } = useStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const stats = useMemo(() => ({
    totalOrders: orders.length,
    paidOrders: orders.filter((order) => order.status === "paid").length,
    pendingReview: orders.filter((order) => order.status === "awaiting_store_confirmation").length,
    totalRevenue: orders.filter((order) => order.status === "paid").reduce((sum, order) => sum + order.total, 0),
  }), [orders]);

  if (!isAdminLogged) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-[32px] border border-border bg-card p-8">
          <div className="mb-6 flex items-center gap-4">
            <img src={logoV} alt="Logo" className="h-12 w-12 rounded-2xl" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Painel admin</p>
              <h1 className="text-2xl font-bold">Acesso protegido</h1>
            </div>
          </div>
          <div className="rounded-[24px] border border-border bg-secondary p-4">
            <label className="mb-2 block text-sm text-muted-foreground">Senha do admin</label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4">
              <LockKeyhole size={16} className="text-muted-foreground" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="h-12 w-full bg-transparent outline-none" placeholder="Digite sua senha" />
            </div>
            <button
              onClick={() => {
                const ok = loginAdmin(password);
                if (!ok) setError("Senha inválida.");
              }}
              className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Entrar no admin
            </button>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[32px] border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src={logoV} alt="Logo" className="h-12 w-12 rounded-2xl" />
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-primary">Dashboard</p>
              <h1 className="mt-1 text-3xl font-bold">Painel da loja</h1>
              <p className="mt-1 text-sm text-muted-foreground">Acompanhe os pedidos e consulte a aprovação automática do Pix.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary">Ver loja</Link>
            <button onClick={logoutAdmin} className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary"><LogOut size={16} />Sair</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[28px] border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Pedidos</p><p className="mt-2 text-3xl font-bold">{stats.totalOrders}</p></div>
          <div className="rounded-[28px] border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Pagos</p><p className="mt-2 text-3xl font-bold text-primary">{stats.paidOrders}</p></div>
          <div className="rounded-[28px] border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Em análise</p><p className="mt-2 text-3xl font-bold text-amber-400">{stats.pendingReview}</p></div>
          <div className="rounded-[28px] border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Faturado</p><p className="mt-2 text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p></div>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Nenhum pedido salvo ainda.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-[28px] border border-border bg-card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold">Pedido {order.id}</h2>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{orderStatusLabel[order.status]}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{order.customer.fullName} • {order.customer.phone} • {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{order.customer.street}, {order.customer.number} - {order.customer.neighborhood}, {order.customer.city}/{order.customer.state}</p>
                    <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                      {order.items.map((item) => <div key={item.id}>{item.name} x{item.quantity}</div>)}
                    </div>
                    {order.paymentId ? <p className="mt-3 text-xs text-muted-foreground">Pagamento {order.paymentId}</p> : null}
                    {order.paymentConfirmedAt ? <p className="mt-1 text-xs text-emerald-400">Pagamento confirmado em {new Date(order.paymentConfirmedAt).toLocaleString("pt-BR")}</p> : null}
                  </div>
                  <div className="w-full max-w-sm space-y-4 rounded-[24px] border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Total</span><strong>{formatCurrency(order.total)}</strong></div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Atualizar status</label>
                      <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)} className="h-11 w-full rounded-2xl border border-border bg-background px-3 outline-none">
                        {statuses.map((status) => <option key={status} value={status}>{orderStatusLabel[status]}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        setRefreshingId(order.id);
                        void syncOrderPayment(order.id).finally(() => setRefreshingId(null));
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 font-semibold hover:bg-background"
                    >
                      {refreshingId === order.id ? <LoaderCircle size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      Consultar gateway
                    </button>
                    {order.status === "awaiting_store_confirmation" ? (
                      <button onClick={() => updateOrderStatus(order.id, "paid")} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground"><PackageCheck size={18} />Confirmar manualmente</button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
