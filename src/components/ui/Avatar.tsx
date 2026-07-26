import { cn } from "@/utils/cn";

/** Avatar simples com iniciais — sem depender de foto de perfil */
export function Avatar({ nome, className }: { nome: string; className?: string }) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white",
        className
      )}
    >
      {iniciais || "?"}
    </div>
  );
}
