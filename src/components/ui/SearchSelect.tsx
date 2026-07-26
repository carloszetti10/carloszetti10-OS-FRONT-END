import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface OpcaoSearchSelect {
  value: number;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  label?: string;
  placeholder?: string;
  opcoes: OpcaoSearchSelect[];
  valor?: number | null;
  aoSelecionar: (valor: number | null) => void;
  erro?: string;
  vazio?: string;
}

/**
 * Combobox com busca — usado onde antes havia um <select> nativo gigante
 * (Cliente, Tipo de Atendimento). Digita, filtra a lista, clica e seleciona.
 * Bem mais prático quando existem muitos registros.
 */
export function SearchSelect({
  label,
  placeholder = "Buscar…",
  opcoes,
  valor,
  aoSelecionar,
  erro,
  vazio = "Nenhum resultado encontrado.",
}: SearchSelectProps) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selecionada = opcoes.find((o) => o.value === valor);

  const filtradas = useMemo(() => {
    if (!termo.trim()) return opcoes;
    const t = termo.trim().toLowerCase();
    return opcoes.filter(
      (o) => o.label.toLowerCase().includes(t) || o.sublabel?.toLowerCase().includes(t)
    );
  }, [opcoes, termo]);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
        setTermo("");
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>}

      <div className="relative">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm shadow-soft",
            "dark:bg-neutral-900",
            erro ? "border-red-400" : "border-neutral-200 dark:border-neutral-700",
            !selecionada && "text-neutral-400"
          )}
        >
          <span className="truncate">{selecionada ? selecionada.label : placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
        </button>

        {aberto && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card dark:border-neutral-700 dark:bg-neutral-900">
            <div className="relative border-b border-neutral-100 p-2 dark:border-neutral-800">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                autoFocus
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Digite para buscar…"
                className="h-8 w-full rounded-md bg-neutral-50 pl-8 pr-2 text-sm outline-none dark:bg-neutral-800"
              />
            </div>
            <div className="max-h-56 overflow-y-auto scrollbar-thin">
              {filtradas.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-neutral-400">{vazio}</p>
              ) : (
                filtradas.map((opcao) => (
                  <button
                    key={opcao.value}
                    type="button"
                    onClick={() => {
                      aoSelecionar(opcao.value);
                      setAberto(false);
                      setTermo("");
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{opcao.label}</span>
                      {opcao.sublabel && (
                        <span className="block truncate text-xs text-neutral-400">{opcao.sublabel}</span>
                      )}
                    </span>
                    {opcao.value === valor && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {erro && <span className="text-xs text-red-500">{erro}</span>}
    </div>
  );
}
