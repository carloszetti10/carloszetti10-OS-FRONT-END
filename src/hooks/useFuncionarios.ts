import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { funcionarioService } from "@/services/funcionarioService";
import type { CriarFuncionarioPayload, AtualizarFuncionarioPayload } from "@/types/funcionario";

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

export function useCriarFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarFuncionarioPayload) => funcionarioService.criar(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["funcionarios"] }),
  });
}

export function useAtualizarFuncionario(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarFuncionarioPayload) => funcionarioService.atualizar(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["funcionarios"] }),
  });
}

export function useRemoverFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => funcionarioService.remover(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["funcionarios"] }),
  });
}
