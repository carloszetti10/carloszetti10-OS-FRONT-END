import { api } from "@/api/axios";
import type {
  TipoAtendimento,
  CriarTipoAtendimentoPayload,
  AtualizarTipoAtendimentoPayload,
} from "@/types/tipoAtendimento";

export const tipoAtendimentoService = {
  listar: async (): Promise<TipoAtendimento[]> => {
    const { data } = await api.get<TipoAtendimento[]>("/TipoAtendimento");
    return data;
  },

  buscarPorId: async (id: number): Promise<TipoAtendimento> => {
    const { data } = await api.get<TipoAtendimento>(`/TipoAtendimento/${id}`);
    return data;
  },

  criar: async (payload: CriarTipoAtendimentoPayload): Promise<TipoAtendimento> => {
    const { data } = await api.post<TipoAtendimento>("/TipoAtendimento", payload);
    return data;
  },

  atualizar: async (id: number, payload: AtualizarTipoAtendimentoPayload): Promise<TipoAtendimento> => {
    const { data } = await api.put<TipoAtendimento>(`/TipoAtendimento/${id}`, payload);
    return data;
  },

  remover: async (id: number): Promise<void> => {
    await api.delete(`/TipoAtendimento/${id}`);
  },
};
