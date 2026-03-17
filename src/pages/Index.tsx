import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  LoaderCircle,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Truck,
  WalletCards,
  Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import heroPod from "@/assets/hero-pod.png";
import logoV from "@/assets/logo-v.png";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/context/StoreContext";
import { buildWhatsAppMessage, formatCurrency, maskCep, maskPhone, onlyDigits, orderStatusLabel, storeConfig } from "@/lib/store";

const Index = () => {
  const {
    products,
    cart,
    checkout,
    customerUser,
    subtotal,
    shipping,
    total,
    cartCount,
    orders,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCheckout,
    createOrder,
    clearCart,
    markOrderAwaitingStoreConfirmation,
    syncOrderPayment,
    syncMyOrders,
  } = useStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [orderCreated, setOrderCreated] = useState<Awaited<ReturnType<typeof createOrder>>>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedPix, setCopiedPix] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [refreshingPayment, setRefreshingPayment] = useState(false);

  const activeOrder = useMemo(
    () => (orderCreated ? orders.find((order) => order.id === orderCreated.id) ?? orderCreated : null),
    [orderCreated, orders],
  );

  useEffect(() => {
    if (customerUser) {
      void syncMyOrders();
    }
  }, [customerUser, syncMyOrders]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!checkout.fullName.trim()) nextErrors.fullName = "Informe o nome completo";
    if (onlyDigits(checkout.phone).length < 10) nextErrors.phone = "Informe um WhatsApp válido";
    if (onlyDigits(checkout.cep).length !== 8) nextErrors.cep = "CEP inválido";
    if (!checkout.street.trim()) nextErrors.street = "Informe a rua";
    if (!checkout.number.trim()) nextErrors.number = "Informe o número";
    if (!checkout.neighborhood.trim()) nextErrors.neighborhood = "Informe o bairro";
    if (!checkout.city.trim()) nextErrors.city = "Informe a cidade";
    if (!checkout.state.trim()) nextErrors.state = "Informe o estado";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const fetchAddress = async (cepValue: string) => {
    const cep = onlyDigits(cepValue);
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        updateCheckout({
          street: data.logradouro || checkout.street,
          neighborhood: data.bairro || checkout.neighborhood,
          city: data.localidade || checkout.city,
          state: data.uf || checkout.state,
        });
      }
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!customerUser) {
      window.location.href = "/login";
      return;
    }
    if (!validate()) return;
    setCreatingPayment(true);
    try {
      const created = await createOrder();
      if (created) {
        setOrderCreated(created);
        setCopiedPix(false);
        clearCart();
      }
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleWhatsapp = () => {
    if (!activeOrder) return;
    window.open(`https://wa.me/${storeConfig.whatsapp}?text=${buildWhatsAppMessage(activeOrder)}`, "_blank");
  };

  const handlePaymentSent = () => {
    if (!activeOrder) return;
    markOrderAwaitingStoreConfirmation(activeOrder.id);
  };

  const handleCopyPix = async () => {
    if (!activeOrder?.pixCode) return;
    await navigator.clipboard.writeText(activeOrder.pixCode);
    setCopiedPix(true);
  };

  const handleRefreshPayment = async () => {
    if (!activeOrder) return;
    setRefreshingPayment(true);
    try {
      const synced = await syncOrderPayment(activeOrder.id);
      if (synced) setOrderCreated(synced);
    } finally {
      setRefreshingPayment(false);
    }
  };

  const statusPill = activeOrder ? orderStatusLabel[activeOrder.status] : "Carrinho";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoV} alt="Logo" className="h-11 w-11 rounded-2xl" />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary">{storeConfig.name}</p>
              <p className="text-sm text-muted-foreground">Pods premium • Checkout via Pix</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to={customerUser ? "/conta" : "/login"} className="hidden rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary sm:inline-flex">
              {customerUser ? "Minha conta" : "Entrar"}
            </Link>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 font-medium hover:bg-secondary">
                  <ShoppingCart size={18} />
                  Carrinho
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{cartCount}</span>
                </button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto border-l border-border bg-background px-0 sm:max-w-[540px]">
                <div className="px-6 pb-8">
                  <SheetHeader className="border-b border-border pb-5 text-left">
                    <SheetTitle className="flex items-center gap-3 text-2xl"><WalletCards className="text-primary" /> {activeOrder ? "Pagamento do pedido" : "Checkout profissional"}</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 grid gap-6">
                    <div className="rounded-[28px] border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-lg font-bold">{statusPill}</p>
                        </div>
                        {activeOrder?.paymentId ? (
                          <button onClick={handleRefreshPayment} className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm hover:bg-secondary">
                            {refreshingPayment ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
                            Atualizar
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {!activeOrder ? (
                      <>
                        <div className="rounded-[28px] border border-border bg-card p-5">
                          <div className="space-y-4">
                            {cart.length === 0 ? <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p> : cart.map((item) => (
                              <div key={item.id} className="flex gap-4 rounded-[24px] border border-border bg-secondary/30 p-4">
                                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="font-semibold">{item.name}</h3>
                                      <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-sm text-muted-foreground hover:text-foreground">Remover</button>
                                  </div>
                                  <div className="mt-4 flex items-center gap-3">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="rounded-xl border border-border p-2"><Minus size={16} /></button>
                                    <span className="min-w-6 text-center font-medium">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="rounded-xl border border-border p-2"><Plus size={16} /></button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-border bg-card p-5">
                          <h3 className="text-lg font-bold">Dados para entrega</h3>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {[
                              { key: "fullName", label: "Nome completo" },
                              { key: "phone", label: "WhatsApp" },
                              { key: "email", label: "E-mail" },
                              { key: "cep", label: "CEP" },
                              { key: "street", label: "Rua" },
                              { key: "number", label: "Número" },
                              { key: "complement", label: "Complemento" },
                              { key: "neighborhood", label: "Bairro" },
                              { key: "city", label: "Cidade" },
                              { key: "state", label: "UF" },
                            ].map((field) => {
                              const value = checkout[field.key as keyof typeof checkout] as string;
                              return (
                                <div key={field.key} className={field.key === "street" || field.key === "city" ? "sm:col-span-2" : ""}>
                                  <label className="mb-2 block text-sm text-muted-foreground">{field.label}</label>
                                  <input
                                    value={value}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const nextValue = field.key === "phone" ? maskPhone(raw) : field.key === "cep" ? maskCep(raw) : raw;
                                      updateCheckout({ [field.key]: nextValue });
                                      if (field.key === "cep") void fetchAddress(nextValue);
                                    }}
                                    className="h-12 w-full rounded-2xl border border-border bg-secondary px-4 outline-none"
                                  />
                                  {field.key === "cep" && loadingCep ? <p className="mt-1 text-xs text-primary">Buscando endereço...</p> : null}
                                  {errors[field.key] ? <p className="mt-1 text-xs text-destructive">{errors[field.key]}</p> : null}
                                </div>
                              );
                            })}
                            <div className="sm:col-span-2">
                              <label className="mb-2 block text-sm text-muted-foreground">Observações</label>
                              <textarea
                                value={checkout.note}
                                onChange={(e) => updateCheckout({ note: e.target.value })}
                                className="min-h-24 w-full rounded-2xl border border-border bg-secondary px-4 py-3 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-border bg-card p-5">
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                            <div className="flex items-center justify-between"><span className="text-muted-foreground">Frete</span><strong>{formatCurrency(shipping)}</strong></div>
                            <div className="flex items-center justify-between border-t border-border pt-3 text-base"><span>Total</span><strong className="text-primary">{formatCurrency(total)}</strong></div>
                          </div>
                          <button onClick={handleCreateOrder} disabled={creatingPayment || cart.length === 0} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">
                            {creatingPayment ? <LoaderCircle size={18} className="animate-spin" /> : <CreditCard size={18} />} Gerar Pix automático
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-[28px] border border-border bg-card p-5">
                        <div className="space-y-5">
                          <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-4">
                            <p className="text-sm text-muted-foreground">Pedido criado</p>
                            <p className="text-xl font-bold">{activeOrder.id}</p>
                            {activeOrder.paymentId ? <p className="mt-1 text-xs text-muted-foreground">Pagamento: {activeOrder.paymentId}</p> : null}
                          </div>

                          {activeOrder.status === "paid" ? (
                            <div className="space-y-4 text-center">
                              <div className="flex justify-center"><CheckCircle2 size={68} className="text-primary" /></div>
                              <div>
                                <p className="text-2xl font-bold">Pagamento confirmado</p>
                                <p className="mt-2 text-muted-foreground">Seu Pix foi aprovado automaticamente. Logo você recebe o link com os dados do pedido.</p>
                              </div>
                              <button onClick={handleWhatsapp} className="w-full rounded-2xl bg-[hsl(142,70%,45%)] px-4 py-3 font-semibold text-white transition hover:brightness-110">Abrir WhatsApp</button>
                            </div>
                          ) : activeOrder.status === "awaiting_store_confirmation" ? (
                            <div className="space-y-4 text-center">
                              <div className="flex justify-center"><LoaderCircle size={68} className="animate-spin text-primary" /></div>
                              <div>
                                <p className="text-2xl font-bold">Aguardando confirmação</p>
                                <p className="mt-2 text-muted-foreground">Seu pedido foi sinalizado como pago. Estamos conferindo a compensação para liberar os dados.</p>
                              </div>
                              <button onClick={handleRefreshPayment} className="w-full rounded-2xl border border-border px-4 py-3 font-semibold hover:bg-secondary">Verificar pagamento agora</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-center rounded-[24px] bg-white p-4">
                                {activeOrder.qrCodeBase64 ? <img src={activeOrder.qrCodeBase64} alt="QR Code Pix" className="h-[190px] w-[190px]" /> : <QRCodeSVG value={activeOrder.pixCode} size={190} />}
                              </div>
                              <div>
                                <p className="mb-2 text-sm text-muted-foreground">Pix copia e cola</p>
                                <div className="rounded-[24px] border border-border bg-secondary p-4 text-xs break-all text-muted-foreground">{activeOrder.pixCode}</div>
                                <button onClick={handleCopyPix} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary"><Copy size={16} />{copiedPix ? "Código copiado" : "Copiar código Pix"}</button>
                              </div>
                              {activeOrder.paymentExpiresAt ? <p className="text-xs text-muted-foreground">Expira em {new Date(activeOrder.paymentExpiresAt).toLocaleString("pt-BR")}</p> : null}
                              <button onClick={handlePaymentSent} className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:brightness-110">Já escaneei e paguei</button>
                              <button onClick={handleRefreshPayment} className="w-full rounded-2xl border border-border px-4 py-3 font-semibold hover:bg-secondary">
                                {refreshingPayment ? "Verificando..." : "Já paguei, verificar agora"}
                              </button>
                              <button onClick={handleWhatsapp} className="w-full rounded-2xl bg-[hsl(142,70%,45%)] px-4 py-3 font-semibold text-white transition hover:brightness-110">Enviar pedido no WhatsApp</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 pb-16 pt-10">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">Loja pronta para vender</span>
              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.05] sm:text-6xl">Os pods mais procurados, com checkout rápido e seguro.</h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Compre de forma rápida e segura, pague via Pix e acompanhe seu pedido até a confirmação.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#produtos" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:brightness-110"><ShoppingBag size={18} />Comprar agora</a>
                <button onClick={() => setSheetOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-4 font-semibold text-foreground hover:bg-secondary"><CreditCard size={18} />Ir para checkout</button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Truck, title: "Frete fixo", text: "Sem taxas escondidas" },
                  { icon: Shield, title: "Pix imediato", text: "QR Code automático na hora" },
                  { icon: MapPin, title: "Endereço automático", text: "Preenchimento rápido pelo CEP" },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-[24px] border border-border bg-card p-4">
                    <Icon className="text-primary" />
                    <h3 className="mt-4 font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-[110px]" />
              <div className="relative overflow-hidden rounded-[36px] border border-border bg-card px-8 py-10">
                <img src={heroPod} alt="Pod em destaque" className="mx-auto h-[28rem] object-contain drop-shadow-[0_40px_90px_rgba(0,255,170,0.15)]" />
                <div className="absolute bottom-5 left-5 rounded-2xl border border-primary/20 bg-background/80 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-primary">Pix liberado</p>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(total || 89.9)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border bg-card/20 px-4 py-7">
          <div className="mx-auto grid max-w-7xl gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center justify-center gap-3"><Truck className="text-primary" size={18} /> Entrega rápida e discreta</div>
            <div className="flex items-center justify-center gap-3"><Shield className="text-primary" size={18} /> Pedido salvo para acompanhamento</div>
            <div className="flex items-center justify-center gap-3"><Zap className="text-primary" size={18} /> Checkout otimizado para mobile</div>
          </div>
        </section>

        <section id="produtos" className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-primary">Catálogo</p>
                <h2 className="mt-2 text-4xl font-bold">Escolha seu pod</h2>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">Cada produto adiciona ao carrinho em um clique. O pedido fica salvo na conta do cliente e acompanha a confirmação automática do Pix.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} {...product} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p>© 2026 {storeConfig.name}. Todos os direitos reservados.</p>
            <p className="mt-1 text-xs">Produto destinado a maiores de 18 anos.</p>
          </div>
          <div className="flex gap-4">
            <Link to="/conta" className="hover:text-foreground">Minha conta</Link>
            <Link to="/admin" className="hover:text-foreground">Painel admin</Link>
            <button onClick={() => addToCart(products[0])} className="hover:text-foreground">Comprar mais vendido</button>
          </div>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
