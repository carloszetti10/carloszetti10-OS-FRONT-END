import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bitrixService } from "@/services/bitrixService";
import type { BitrixWebhookPayload, SalvarBitrixConfiguracaoPayload, TipoEnvioBitrix } from "@/types/bitrix";

// Configuração real do funcionário (null = ainda não configurado). Fonte da
// verdade pra tela toda: webhook, Drive e Pasta.
export function useConfiguracaoBitrix(funcionarioId: number | null) {
  return useQuery({
    queryKey: ["bitrix-configuracao", funcionarioId],
    queryFn: () => bitrixService.buscarConfiguracao(funcionarioId as number),
    enabled: funcionarioId != null,
  });
}

export function useDrivesBitrix(funcionarioId: number | null, habilitado: boolean) {
  return useQuery({
    queryKey: ["bitrix-drives", funcionarioId],
    queryFn: () => bitrixService.buscarDrives(funcionarioId as number),
    enabled: funcionarioId != null && habilitado,
    select: (resposta) => resposta.result,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bitrix-configuracao", funcionarioId] }),
  });
}

export function useAtualizarWebhookBitrix(funcionarioId: number, configuracaoId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BitrixWebhookPayload) => bitrixService.atualizarWebhook(configuracaoId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bitrix-configuracao", funcionarioId] }),
  });
}

export function useSalvarConfiguracaoBitrix(funcionarioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalvarBitrixConfiguracaoPayload) => bitrixService.salvarConfiguracao(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bitrix-configuracao", funcionarioId] }),
  });
}

// Envia o PDF de fotos/relatório da OS pro Bitrix. Só faz o POST — a
// confirmação de que o envio realmente aconteceu precisa ser feita por quem
// chama, reconferindo pdfFotoEnviado/pdfRelatorioEnviado na OS depois (ver
// nota em bitrixService.enviarPdf sobre o back sempre responder 200).
// Ainda assim invalida a query da OS pra manter outros lugares em sincronia.
export function useEnviarPdfBitrix(idOs: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tipo: TipoEnvioBitrix) => bitrixService.enviarPdf(idOs, tipo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ordem-servico", idOs] }),
  });
}
