import { api } from "@/api/axios";
import type { FotosPublica, SalvarFotosPayload } from "@/types/fotos";

export const fotosService = {
  // Público (sem login) — usado na página que o técnico abre no segundo aparelho.
  buscarPublica: async (token: string): Promise<FotosPublica> => {
    const { data } = await api.get<FotosPublica>(`/OrdemServico/fotos/${token}`);
    return data;
  },

  // Público (sem login) — envio final do PDF de fotos.
  salvar: async (token: string, payload: SalvarFotosPayload): Promise<void> => {
    await api.post(`/OrdemServico/fotos/${token}`, payload);
  },
};
