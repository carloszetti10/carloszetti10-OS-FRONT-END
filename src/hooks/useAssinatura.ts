import { useMutation, useQuery } from "@tanstack/react-query";
import { assinaturaService } from "@/services/assinaturaService";
import { funcionarioService } from "@/services/funcionarioService";
import type { IniciarAssinaturaPayload, SubmeterAssinaturaClientePayload } from "@/types/assinatura";
import type { AtualizarAssinaturaFuncionarioPayload } from "@/types/funcionario";

export function useIniciarAssinatura(idOs: number) {
  return useMutation({
    mutationFn: (payload: IniciarAssinaturaPayload) => assinaturaService.iniciar(idOs, payload),
  });
}

export function useAssinaturaPublica(token: string | undefined) {
  return useQuery({
    queryKey: ["assinatura-publica", token],
    enabled: !!token,
    retry: false, // token inválido/expirado não deve ficar tentando de novo sozinho
    queryFn: () => assinaturaService.buscarPublica(token!),
  });
}

export function useSubmeterAssinaturaCliente(token: string) {
  return useMutation({
    mutationFn: (payload: SubmeterAssinaturaClientePayload) => assinaturaService.submeterCliente(token, payload),
  });
}

export function useAtualizarMinhaAssinatura() {
  return useMutation({
    mutationFn: (payload: AtualizarAssinaturaFuncionarioPayload) =>
      funcionarioService.atualizarMinhaAssinatura(payload),
  });
}
