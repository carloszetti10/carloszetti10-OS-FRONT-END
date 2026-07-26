import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

interface ModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
  largura?: "sm" | "md" | "lg" | "xl";
}

const LARGURAS: Record<NonNullable<ModalProps["largura"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

/**
 * Modal centralizado na tela, com X pra fechar — usado em TODO formulário de
 * cadastro do sistema (Cliente, Funcionário, OS, etc.), nunca em página/aba
 * separada, conforme pedido.
 */
export function Modal({ aberto, aoFechar, titulo, children, largura = "md" }: ModalProps) {
  // Fecha com ESC
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoFechar]);

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={aoFechar}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "relative z-10 w-full rounded-2xl bg-white shadow-card dark:bg-neutral-900",
              "max-h-[90vh] overflow-y-auto scrollbar-thin",
              LARGURAS[largura]
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 dark:bg-neutral-900">
              <h2 className="text-lg font-display font-semibold">{titulo}</h2>
              <button
                onClick={aoFechar}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
