import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { storeConfig } from "@/lib/store";

const WhatsAppButton = () => {
  return (
    <motion.a
      href={`https://wa.me/${storeConfig.whatsapp}?text=Oi!%20Quero%20saber%20mais%20sobre%20os%20pods%20da%20loja.`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.8, type: "spring" }}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-[hsl(142,70%,45%)] p-4 text-white shadow-lg transition hover:bg-[hsl(142,70%,40%)] hover:shadow-xl active:scale-95"
      aria-label="Fale no WhatsApp"
    >
      <MessageCircle size={28} />
    </motion.a>
  );
};

export default WhatsAppButton;
