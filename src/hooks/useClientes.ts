import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteService } from "@/services/clienteService";
import type { CriarClientePayload, AtualizarClientePayload } from "@/types/cliente";

/**
 * TODO(back): GET /api/Clientes devolve ativos e inativos juntos.
 * Filtro "só ativos" aplicado aqui no front — mover pro back (query param
 * ?ativo=true ou endpoint dedicado) assim que possível.
 */
export function useClientes(opcoes?: { somenteAtivos?: boolean }) {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: clienteService.listar,
    select: (clientes) =>
      opcoes?.somenteAtivos ? clientes.filter((c) => c.ativo) : clientes,
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarClientePayload) => clienteService.criar(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useAtualizarCliente(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarClientePayload) => clienteService.atualizar(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useRemoverCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clienteService.remover(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });
}
