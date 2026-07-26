import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  aoMudarPagina: (pagina: number) => void;
}

export function Pagination({ paginaAtual, totalPaginas, aoMudarPagina }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <span className="text-sm text-neutral-500">
        Página {paginaAtual} de {totalPaginas}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={paginaAtual <= 1}
          onClick={() => aoMudarPagina(paginaAtual - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={paginaAtual >= totalPaginas}
          onClick={() => aoMudarPagina(paginaAtual + 1)}
        >
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
