import heroPod from "@/assets/hero-pod.png";
import pod1 from "@/assets/pod-1.png";
import pod3 from "@/assets/pod-3.png";
import pod4 from "@/assets/pod-4.png";

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  flavor: string;
  puffs: string;
  nicotine: string;
  description: string;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "ignite-v80-silver",
    name: "IGNITE V80 Silver",
    price: 89.9,
    originalPrice: 129.9,
    image: pod1,
    flavor: "Menta Gelada",
    puffs: "8000",
    nicotine: "5%",
    description: "Refrescante e intenso, perfeito para quem curte tragada gelada.",
    badge: "Mais vendido",
  },
  {
    id: "ignite-v60-black",
    name: "IGNITE V60 Black",
    price: 79.9,
    image: pod3,
    flavor: "Tabaco Classic",
    puffs: "6000",
    nicotine: "5%",
    description: "Sabor marcante e equilibrado, com pegada clássica.",
    badge: "Entrega rápida",
  },
  {
    id: "ignite-v80-blue",
    name: "IGNITE V80 Blue",
    price: 89.9,
    originalPrice: 119.9,
    image: pod4,
    flavor: "Blueberry Ice",
    puffs: "8000",
    nicotine: "5%",
    description: "Blueberry com toque ice para uma experiência doce e gelada.",
    badge: "Oferta",
  },
  {
    id: "ignite-v80-hero",
    name: "IGNITE V80 Hero",
    price: 99.9,
    image: heroPod,
    flavor: "Uva Grape",
    puffs: "10000",
    nicotine: "5%",
    description: "Modelo premium com maior duração e sabor intenso de uva.",
    badge: "Premium",
  },
];
