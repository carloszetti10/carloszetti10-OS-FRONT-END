import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { clienteService } from "@/services/clienteService";
import { useDebounce } from "./useDebounce";
import type { CriarClientePayload, AtualizarClientePayload, FiltroClientes } from "@/types/cliente";

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

/**
 * Paginação/busca de verdade no back (GET /Clientes/paginado) — usado na
 * tela cheia de listagem (ClientesList). placeholderData: keepPreviousData
 * mantém a página atual visível enquanto a próxima já está carregando, pra
 * não "piscar" em branco a cada busca/troca de página.
 */
export function useClientesPaginado(filtro: FiltroClientes) {
  return useQuery({
    queryKey: ["clientes-paginado", filtro],
    queryFn: () => clienteService.listarPaginado(filtro),
    placeholderData: keepPreviousData,
  });
}

/**
 * Busca de cliente pro SearchSelect dentro do formulário de OS. Reaproveita
 * o mesmo GET /Clientes/paginado (o back não tem um /buscar dedicado), só
 * que com uma página pequena (10) — e nunca dispara a cada tecla digitada:
 * - useDebounce espera 400ms sem digitar antes de mandar a requisição;
 * - enabled só libera com 2+ caracteres (evita trazer meio banco com "a");
 * - staleTime de 1min: repetir a mesma busca pouco depois usa cache do
 *   TanStack Query em vez de bater no servidor de novo.
 */
export function useClienteBusca(termo: string) {
  const termoComAtraso = useDebounce(termo, 400);
  const termoValido = termoComAtraso.trim().length >= 2;

  return useQuery({
    queryKey: ["clientes-busca", termoComAtraso],
    queryFn: () => clienteService.listarPaginado({ pagina: 1, tamanhoPagina: 10, busca: termoComAtraso.trim() }),
    enabled: termoValido,
    staleTime: 60_000,
    select: (resultado) => resultado.itens,
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarClientePayload) => clienteService.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-paginado"] });
    },
  });
}

export function useAtualizarCliente(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarClientePayload) => clienteService.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-paginado"] });
    },
  });
}

export function useRemoverCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clienteService.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-paginado"] });
    },
  });
}
