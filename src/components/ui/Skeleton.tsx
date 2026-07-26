import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800", className)} />;
}

/** Skeleton de linhas de tabela — usado enquanto uma listagem carrega */
export function SkeletonTabela({ linhas = 5, colunas = 5 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="w-full">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
          {Array.from({ length: colunas }).map((__, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
