import { api } from "@/api/axios";
import type { Permissao } from "@/types/permissao";

export const permissaoService = {
  // GET /api/Permissao — catálogo completo (todas as permissões cadastradas no banco)
  listarTodas: async (): Promise<Permissao[]> => {
    const { data } = await api.get<Permissao[]>("/Permissao");
    return data;
  },

  // GET /api/Permissao/{usuarioId} — só as permissões que ESSE usuário já tem
  listarDoUsuario: async (usuarioId: string): Promise<Permissao[]> => {
    const { data } = await api.get<Permissao[]>(`/Permissao/${usuarioId}`);
    return data;
  },

  // PUT /api/Permissao/{usuarioId} — substitui a lista inteira de permissões do usuário
  atualizar: async (usuarioId: string, idsPermissao: number[]): Promise<Permissao[]> => {
    const { data } = await api.put<Permissao[]>(`/Permissao/${usuarioId}`, { idsPermissao });
    return data;
  },
};
