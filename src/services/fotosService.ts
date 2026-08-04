import { apiPublic } from "@/api/axiosPublic";
import type { FotosPublica, SalvarFotosPayload } from "@/types/fotos";

export const fotosService = {
  // Público (sem login) — usado na página que o técnico abre no segundo aparelho.
  buscarPublica: async (token: string): Promise<FotosPublica> => {
    const { data } = await apiPublic.get<FotosPublica>(`/OrdemServico/fotos/${token}`);
    return data;
  },

  // Público (sem login) — envio final do PDF de fotos. Payload pode ficar
  // grande (várias fotos em base64) — timeout maior que o padrão da
  // instância (15s) pra não falhar em rede mais lenta/instável.
  salvar: async (token: string, payload: SalvarFotosPayload): Promise<void> => {
    await apiPublic.post(`/OrdemServico/fotos/${token}`, payload, { timeout: 60_000 });
  },
};
