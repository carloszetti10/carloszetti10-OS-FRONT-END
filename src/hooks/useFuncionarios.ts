import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { funcionarioService } from "@/services/funcionarioService";
import { useDebounce } from "./useDebounce";
import type { CriarFuncionarioPayload, AtualizarFuncionarioPayload, FiltroFuncionarios } from "@/types/funcionario";

/**
 * TODO(back): GET /api/Funcionario devolve ativos e inativos juntos.
 * Filtro "só ativos" aplicado aqui no front — mover pro back assim que possível.
 */
export function useFuncionarios(opcoes?: { somenteAtivos?: boolean }) {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: funcionarioService.listar,
    select: (funcionarios) =>
      opcoes?.somenteAtivos ? funcionarios.filter((f) => f.ativo) : funcionarios,
  });
}

/**
 * Paginação/busca de verdade no back (GET /Funcionario/paginado) — usado na
 * tela cheia de listagem (FuncionariosList), espelhando useClientesPaginado.
 */
export function useFuncionariosPaginado(filtro: FiltroFuncionarios) {
  return useQuery({
    queryKey: ["funcionarios-paginado", filtro],
    queryFn: () => funcionarioService.listarPaginado(filtro),
    placeholderData: keepPreviousData,
  });
}

/**
 * Busca de funcionário pro FuncionarioPicker dentro do formulário de OS.
 * Mesmo padrão de useClienteBusca: debounce de 400ms, mínimo 2 caracteres,
 * staleTime de 1min pra não repetir a mesma busca no servidor.
 */
export function useFuncionarioBusca(termo: string) {
  const termoComAtraso = useDebounce(termo, 400);
  const termoValido = termoComAtraso.trim().length >= 2;

  return useQuery({
    queryKey: ["funcionarios-busca", termoComAtraso],
    queryFn: () => funcionarioService.listarPaginado({ pagina: 1, tamanhoPagina: 10, busca: termoComAtraso.trim() }),
    enabled: termoValido,
    staleTime: 60_000,
    select: (resultado) => resultado.itens,
  });
}

export function useCriarFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarFuncionarioPayload) => funcionarioService.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      queryClient.invalidateQueries({ queryKey: ["funcionarios-paginado"] });
    },
  });
}

export function useAtualizarFuncionario(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarFuncionarioPayload) => funcionarioService.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      queryClient.invalidateQueries({ queryKey: ["funcionarios-paginado"] });
    },
  });
}

export function useRemoverFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => funcionarioService.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      queryClient.invalidateQueries({ queryKey: ["funcionarios-paginado"] });
    },
  });
}
