import { create } from "zustand";

export type ToastTipo = "sucesso" | "erro" | "info";

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

interface ToastState {
  toasts: Toast[];
  mostrar: (mensagem: string, tipo?: ToastTipo) => void;
  remover: (id: number) => void;
}

let proximoId = 1;

/**
 * Sistema de notificações toast simples e global. Qualquer tela pode chamar
 * useToastStore.getState().mostrar(...) — inclusive de dentro do errorHandler,
 * sem precisar de contexto React. Some sozinho depois de alguns segundos.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  mostrar: (mensagem, tipo = "info") => {
    const id = proximoId++;
    set((state) => ({ toasts: [...state.toasts, { id, mensagem, tipo }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  remover: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
