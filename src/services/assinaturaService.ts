import { api } from "@/api/axios";
import type {
  IniciarAssinaturaPayload,
  TokenAssinatura,
  AssinaturaPublica,
  SubmeterAssinaturaClientePayload,
} from "@/types/assinatura";

export const assinaturaService = {
  // Autenticado — só o funcionário responsável consegue (o back valida).
  iniciar: async (idOs: number, payload: IniciarAssinaturaPayload): Promise<TokenAssinatura> => {
    const { data } = await api.post<TokenAssinatura>(
      `/OrdemServico/${idOs}/relatorio/iniciar-assinatura`,
      payload
    );
    return data;
  },

  // Público (sem login) — usado na página que o cliente abre pelo link/QR code.
  buscarPublica: async (token: string): Promise<AssinaturaPublica> => {
    const { data } = await api.get<AssinaturaPublica>(`/OrdemServico/assinatura/${token}`);
    return data;
  },

  // Público (sem login) — envio final da assinatura do cliente + PDF.
  submeterCliente: async (token: string, payload: SubmeterAssinaturaClientePayload): Promise<void> => {
    await api.post(`/OrdemServico/assinatura/${token}`, payload);
  },
};
