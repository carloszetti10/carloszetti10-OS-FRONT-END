import { useMutation, useQuery } from "@tanstack/react-query";
import { ordemServicoService } from "@/services/ordemServicoService";
import { fotosService } from "@/services/fotosService";
import type { SalvarFotosPayload } from "@/types/fotos";

export function useIniciarFotos(idOs: number) {
  return useMutation({
    mutationFn: () => ordemServicoService.iniciarFotos(idOs),
  });
}

export function useFotosPublica(token: string | undefined) {
  return useQuery({
    queryKey: ["fotos-publica", token],
    enabled: !!token,
    retry: false,
    queryFn: () => fotosService.buscarPublica(token!),
  });
}

export function useSalvarFotos(token: string) {
  return useMutation({
    mutationFn: (payload: SalvarFotosPayload) => fotosService.salvar(token, payload),
  });
}
