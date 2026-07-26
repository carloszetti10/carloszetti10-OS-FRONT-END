import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  acao?: ReactNode;
}

export function EmptyState({ titulo, descricao, icone, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center dark:border-neutral-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
        {icone ?? <Inbox className="h-6 w-6" />}
      </div>
      <div>
        <p className="font-medium text-neutral-700 dark:text-neutral-200">{titulo}</p>
        {descricao && <p className="mt-1 text-sm text-neutral-500">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
