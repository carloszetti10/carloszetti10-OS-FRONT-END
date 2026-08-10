import { useState } from "react";
import { Search, Star, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useFuncionariosDaOs,
  useAdicionarFuncionarioOs,
  useRemoverFuncionarioOs,
  useDefinirResponsavelOs,
} from "@/hooks/useOrdensServico";
import { useFuncionarioBusca } from "@/hooks/useFuncionarios";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import type { OsFuncionarioDetalhe } from "@/types/ordemServico";

interface GerenciarFuncionariosOsProps {
  idOs: number;
}

/**
 * Gerencia os funcionários vinculados a uma OS já existente: adicionar,
 * remover e trocar o responsável — espelhando as rotas que já existem no
 * back (POST/DELETE /OrdemServico/.../funcionarios e PUT .../responsavel).
 * Só aparece quando a OS ainda não está concluída (ver OrdemServicoDetalhe).
 */
export function GerenciarFuncionariosOs({ idOs }: GerenciarFuncionariosOsProps) {
  const { data: vinculados, isLoading } = useFuncionariosDaOs(idOs);
  const mostrarToast = useToastStore((s) => s.mostrar);

  const { mutate: adicionar, isPending: adicionando } = useAdicionarFuncionarioOs(idOs);
  const { mutate: remover, isPending: removendo } = useRemoverFuncionarioOs(idOs);
  const { mutate: definirResponsavel } = useDefinirResponsavelOs(idOs);

  const [termo, setTermo] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [paraRemover, setParaRemover] = useState<OsFuncionarioDetalhe | null>(null);

  const idsJaVinculados = new Set((vinculados ?? []).map((f) => f.idFuncionario));

  // Busca no servidor (GET /Funcionario/paginado), mesmo padrão do
  // FuncionarioPicker — não filtra mais uma lista carregada inteira.
  const { data: encontrados, isFetching: buscando } = useFuncionarioBusca(termo);
  const resultadosBusca = (encontrados ?? []).filter((f) => !idsJaVinculados.has(f.id)).slice(0, 8);

  function aoAdicionar(idFuncionario: number) {
    adicionar(
      { idFuncionario, responsavel: false },
      {
        onSuccess: () => {
          mostrarToast("Funcionário adicionado à OS.", "sucesso");
          setTermo("");
        },
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  function aoDefinirResponsavel(idFuncionario: number) {
    definirResponsavel(idFuncionario, {
      onSuccess: () => mostrarToast("Responsável atualizado.", "sucesso"),
      onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
    });
  }

  function aoConfirmarRemocao() {
    if (!paraRemover) return;
    remover(paraRemover.idOsFuncionario, {
      onSuccess: () => {
        mostrarToast("Funcionário removido da OS.", "sucesso");
        setParaRemover(null);
      },
      onError: (erro) => {
        mostrarToast(extrairMensagemErro(erro), "erro");
        setParaRemover(null);
      },
    });
  }

  return (
    <div className="space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
      <p className="text-sm font-medium">Gerenciar funcionários</p>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="space-y-1.5">
          {(vinculados ?? []).map((f) => (
            <div
              key={f.idOsFuncionario}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm",
                f.responsavel
                  ? "border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950"
                  : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
              )}
            >
              <button
                type="button"
                onClick={() => aoDefinirResponsavel(f.idFuncionario)}
                title="Marcar como responsável"
                className={cn(
                  "flex items-center gap-1.5 text-left",
                  f.responsavel ? "text-brand-700 dark:text-brand-300" : "text-neutral-600 dark:text-neutral-300"
                )}
              >
                <Star className="h-3.5 w-3.5 shrink-0" fill={f.responsavel ? "currentColor" : "none"} />
                {f.nomeFuncionario}
              </button>
              <button
                type="button"
                onClick={() => setParaRemover(f)}
                className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                title="Remover da OS"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {(vinculados ?? []).length === 0 && (
            <p className="text-sm text-neutral-400">Nenhum funcionário vinculado.</p>
          )}
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={termo}
            onFocus={() => setBuscaAberta(true)}
            onChange={(e) => {
              setTermo(e.target.value);
              setBuscaAberta(true);
            }}
            placeholder="Adicionar funcionário…"
            disabled={adicionando}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm shadow-soft focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        {buscaAberta && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setBuscaAberta(false)} />
            <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-card scrollbar-thin dark:border-neutral-700 dark:bg-neutral-900">
              {termo.trim().length < 2 ? (
                <p className="px-3 py-3 text-center text-sm text-neutral-400">
                  Digite ao menos 2 letras para buscar.
                </p>
              ) : buscando ? (
                <p className="px-3 py-3 text-center text-sm text-neutral-400">Buscando…</p>
              ) : resultadosBusca.length === 0 ? (
                <p className="px-3 py-3 text-center text-sm text-neutral-400">Nenhum resultado.</p>
              ) : (
                resultadosBusca.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => aoAdicionar(f.id)}
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

      <ConfirmDialog
        aberto={!!paraRemover}
        titulo="Remover funcionário da OS"
        mensagem={`Tem certeza que deseja remover "${paraRemover?.nomeFuncionario}" desta ordem de serviço?`}
        confirmando={removendo}
        aoConfirmar={aoConfirmarRemocao}
        aoCancelar={() => setParaRemover(null)}
        textoConfirmar="Remover"
      />
    </div>
  );
}
