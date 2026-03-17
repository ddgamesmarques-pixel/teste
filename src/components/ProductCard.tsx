import { motion } from "framer-motion";
import { ShoppingCart, Zap } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/store";
import type { Product } from "@/data/products";

interface ProductCardProps extends Product {
  index: number;
}

const ProductCard = ({ id, name, price, originalPrice, image, flavor, puffs, nicotine, description, badge, index }: ProductCardProps) => {
  const { addToCart } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="group rounded-[28px] border border-border bg-card/90 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur"
    >
      <div className="relative mb-4 overflow-hidden rounded-3xl bg-secondary/60 p-6">
        {badge && <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">{badge}</span>}
        <img src={image} alt={name} className="mx-auto h-44 w-44 object-contain transition-transform duration-500 group-hover:scale-110" />
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight text-foreground">{name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{flavor}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{puffs} puffs</span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{nicotine}</span>
        </div>

        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(price)}</div>
            {originalPrice ? <div className="text-sm text-muted-foreground line-through">{formatCurrency(originalPrice)}</div> : null}
          </div>
          <button
            onClick={() => addToCart({ id, name, price, originalPrice, image, flavor, puffs, nicotine, description, badge })}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-95"
          >
            <ShoppingCart size={18} />
            Adicionar
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <Zap size={14} className="text-primary" />
          Checkout rápido com Pix e envio para WhatsApp.
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
