import { useState } from "react";
import { Search, X, Star } from "lucide-react";
import { cn } from "@/utils/cn";
import { useFuncionarioBusca } from "@/hooks/useFuncionarios";
import type { Funcionario } from "@/types/funcionario";

export interface FuncionarioSelecionado {
  idFuncionario: number;
  responsavel: boolean;
}

interface FuncionarioPickerProps {
  valor: FuncionarioSelecionado[];
  aoMudar: (valor: FuncionarioSelecionado[]) => void;
  erro?: string;
}

/**
 * Substitui a lista gigante de checkboxes: pesquisa por nome (agora direto
 * no servidor, GET /Funcionario/paginado — mesmo padrão do useClienteBusca)
 * e vai adicionando funcionários um a um (como "chips"). Clique na estrela
 * pra marcar quem é o responsável — só pode haver um (o back exige
 * exatamente um responsável por OS).
 */
export function FuncionarioPicker({ valor, aoMudar, erro }: FuncionarioPickerProps) {
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const { data: encontrados, isFetching: buscando } = useFuncionarioBusca(termo);

  // Nomes dos já selecionados guardados aqui (não em funcionariosDisponiveis,
  // que não existe mais) — preenchido no momento em que cada um é adicionado,
  // pra continuar mostrando o chip mesmo se ele sair dos resultados da busca.
  const [nomesSelecionados, setNomesSelecionados] = useState<Record<number, string>>({});

  const idsSelecionados = new Set(valor.map((f) => f.idFuncionario));
  const resultados = (encontrados ?? []).filter((f) => !idsSelecionados.has(f.id)).slice(0, 8);

  function adicionar(funcionario: Funcionario) {
    const ehPrimeiro = valor.length === 0;
    aoMudar([...valor, { idFuncionario: funcionario.id, responsavel: ehPrimeiro }]);
    setNomesSelecionados((atual) => ({ ...atual, [funcionario.id]: funcionario.nome }));
    setTermo("");
  }

  function remover(idFuncionario: number) {
    aoMudar(valor.filter((f) => f.idFuncionario !== idFuncionario));
  }

  function definirResponsavel(idFuncionario: number) {
    aoMudar(valor.map((f) => ({ ...f, responsavel: f.idFuncionario === idFuncionario })));
  }

  function nomeDe(idFuncionario: number) {
    return nomesSelecionados[idFuncionario] ?? `Funcionário #${idFuncionario}`;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Funcionários vinculados</p>

      {valor.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {valor.map((f) => (
            <span
              key={f.idFuncionario}
              className={cn(
                "flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-sm",
                f.responsavel
                  ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              )}
            >
              <button
                type="button"
                onClick={() => definirResponsavel(f.idFuncionario)}
                title="Marcar como responsável"
                className={cn("rounded-full p-0.5 hover:bg-black/5", f.responsavel && "text-brand-600")}
              >
                <Star className="h-3.5 w-3.5" fill={f.responsavel ? "currentColor" : "none"} />
              </button>
              {nomeDe(f.idFuncionario)}
              <button
                type="button"
                onClick={() => remover(f.idFuncionario)}
                className="rounded-full p-0.5 hover:bg-black/10"
                title="Remover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={termo}
            onFocus={() => setAberto(true)}
            onChange={(e) => {
              setTermo(e.target.value);
              setAberto(true);
            }}
            placeholder="Buscar funcionário pelo nome…"
            className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm shadow-soft focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        {aberto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-card scrollbar-thin dark:border-neutral-700 dark:bg-neutral-900">
              {termo.trim().length < 2 ? (
                <p className="px-3 py-3 text-center text-sm text-neutral-400">
                  Digite ao menos 2 letras para buscar.
                </p>
              ) : buscando ? (
                <p className="px-3 py-3 text-center text-sm text-neutral-400">Buscando…</p>
              ) : resultados.length === 0 ? (
                <p className="px-3 py-3 text-center text-sm text-neutral-400">Nenhum resultado.</p>
              ) : (
                resultados.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => adicionar(f)}
                    className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    {f.nome}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        Clique na estrela pra marcar o responsável (obrigatório escolher exatamente um).
      </p>
      {erro && <span className="text-xs text-red-500">{erro}</span>}
    </div>
  );
}
