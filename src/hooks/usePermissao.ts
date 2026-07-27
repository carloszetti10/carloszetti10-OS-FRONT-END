import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissaoService } from "@/services/permissaoService";

/** Catálogo completo — sempre buscado do banco, então qualquer permissão nova
 * que for cadastrada aparece aqui sozinha, sem precisar mexer no front. */
export function useCatalogoPermissoes() {
  return useQuery({
    queryKey: ["permissoes-catalogo"],
    queryFn: permissaoService.listarTodas,
  });
}

export function usePermissoesDoUsuario(usuarioId: string | undefined) {
  return useQuery({
    queryKey: ["permissoes-usuario", usuarioId],
    enabled: !!usuarioId,
    queryFn: () => permissaoService.listarDoUsuario(usuarioId!),
  });
}

export function useAtualizarPermissoesUsuario(usuarioId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idsPermissao: number[]) => permissaoService.atualizar(usuarioId, idsPermissao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissoes-usuario", usuarioId] });
    },
  });
}
