import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tipoAtendimentoService } from "@/services/tipoAtendimentoService";
import type { CriarTipoAtendimentoPayload, AtualizarTipoAtendimentoPayload } from "@/types/tipoAtendimento";

export function useTiposAtendimento() {
  return useQuery({
    queryKey: ["tipos-atendimento"],
    queryFn: tipoAtendimentoService.listar,
  });
}

export function useCriarTipoAtendimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarTipoAtendimentoPayload) => tipoAtendimentoService.criar(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tipos-atendimento"] }),
  });
}

export function useAtualizarTipoAtendimento(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarTipoAtendimentoPayload) => tipoAtendimentoService.atualizar(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tipos-atendimento"] }),
  });
}

export function useRemoverTipoAtendimento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tipoAtendimentoService.remover(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tipos-atendimento"] }),
  });
}
