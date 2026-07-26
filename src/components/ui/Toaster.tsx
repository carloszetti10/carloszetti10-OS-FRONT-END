import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import { cn } from "@/utils/cn";

const ICONES = {
  sucesso: <CheckCircle2 className="h-5 w-5 text-brand-600" />,
  erro: <XCircle className="h-5 w-5 text-red-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
};

/** Renderiza os toasts globais — montado uma única vez em App.tsx */
export function Toaster() {
  const { toasts, remover } = useToastStore();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            className={cn(
              "pointer-events-auto flex w-80 items-start gap-3 rounded-xl border bg-white p-3.5 shadow-card",
              "dark:bg-neutral-900 dark:border-neutral-800"
            )}
          >
            {ICONES[toast.tipo]}
            <p className="flex-1 text-sm text-neutral-700 dark:text-neutral-200">{toast.mensagem}</p>
            <button onClick={() => remover(toast.id)} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
