import { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface BadgeProps {
  children: ReactNode;
  cor?: "verde" | "azul" | "amarelo" | "vermelho" | "cinza";
}

const CORES: Record<NonNullable<BadgeProps["cor"]>, string> = {
  verde: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  azul: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  amarelo: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  vermelho: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  cinza: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export function Badge({ children, cor = "cinza" }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", CORES[cor])}>
      {children}
    </span>
  );
}
