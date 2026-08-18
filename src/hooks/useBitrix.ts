import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bitrixService } from "../services/bitrixService";
import type { BitrixWebhookPayload, SalvarBitrixConfiguracaoPayload } from "../types/bitrix";

/**
 * Também funciona como o único sinal disponível de "esse funcionário já tem
 * webhook configurado?" — ver comentário em bitrixService.buscarDrives.
 * retry:false porque, quando o funcionário ainda não tem webhook, o erro é
 * esperado (não é uma falha passageira de rede) e tentar de novo só atrasa.
 */
export function useDrivesBitrix(funcionarioId: number | null) {
  return useQuery({
    queryKey: ["bitrix-drives", funcionarioId],
    queryFn: () => bitrixService.buscarDrives(funcionarioId as number),
    enabled: funcionarioId != null,
    select: (resposta) => resposta.result,
    retry: false,
  });
}

export function usePastasBitrix(funcionarioId: number | null, idDrive: string | null) {
  return useQuery({
    queryKey: ["bitrix-pastas", funcionarioId, idDrive],
    queryFn: () => bitrixService.buscarPastas(funcionarioId as number, idDrive as string),
    enabled: funcionarioId != null && !!idDrive,
    select: (resposta) => resposta.result,
  });
}

export function useCadastrarWebhookBitrix(funcionarioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BitrixWebhookPayload) => bitrixService.cadastrarWebhook(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bitrix-drives", funcionarioId] }),
  });
}

export function useSalvarConfiguracaoBitrix() {
  return useMutation({
    mutationFn: (payload: SalvarBitrixConfiguracaoPayload) => bitrixService.salvarConfiguracao(payload),
  });
}
