import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper padrão do ecossistema shadcn/ui pra combinar classes Tailwind
// condicionalmente sem duplicar/conflitar utilitários.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
