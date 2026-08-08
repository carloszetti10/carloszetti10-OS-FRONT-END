import { api } from "@/api/axios";
import type {
  OrdemServico,
  CriarOrdemServicoPayload,
  AtualizarOrdemServicoPayload,
  AtualizarRelatorioPayload,
  AlterarStatusPayload,
  OsFuncionarioPayload,
  OsFuncionarioDetalhe,
  FiltroOrdensServico,
  ResultadoPaginadoOrdemServico,
} from "@/types/ordemServico";
import type { TokenAssinatura } from "@/types/assinatura";

export const ordemServicoService = {
  // GET /api/OrdemServico
  // ATENÇÃO: não existe filtro por query string no back — devolve TODAS as OS.
  // O filtro "só as OS vinculadas ao funcionário logado" é feito no front
  // (ver hooks/useOrdensServico.ts) até virar uma regra real no back.
  listar: async (): Promise<OrdemServico[]> => {
    const { data } = await api.get<OrdemServico[]>("/OrdemServico");
    return data;
  },

  // GET /api/OrdemServico/paginado — com filtro e paginação de verdade no back
  // (o filtro "só vê OS vinculada" já é aplicado lá, pela permissão do usuário).
  listarPaginado: async (filtro: FiltroOrdensServico): Promise<ResultadoPaginadoOrdemServico> => {
    const { data } = await api.get<ResultadoPaginadoOrdemServico>("/OrdemServico/paginado", {
      params: filtro,
    });
    return data;
  },

  buscarPorId: async (id: number): Promise<OrdemServico> => {
    const { data } = await api.get<OrdemServico>(`/OrdemServico/${id}`);
    return data;
  },

  criar: async (payload: CriarOrdemServicoPayload): Promise<OrdemServico> => {
    const { data } = await api.post<OrdemServico>("/OrdemServico", payload);
    return data;
  },

  atualizar: async (id: number, payload: AtualizarOrdemServicoPayload): Promise<OrdemServico> => {
    const { data } = await api.put<OrdemServico>(`/OrdemServico/${id}`, payload);
    return data;
  },

  // PATCH .../relatorio — só o funcionário responsável consegue (o back valida)
  atualizarRelatorio: async (id: number, payload: AtualizarRelatorioPayload): Promise<OrdemServico> => {
    const { data } = await api.patch<OrdemServico>(`/OrdemServico/${id}/relatorio`, payload);
    return data;
  },

  alterarStatus: async (id: number, payload: AlterarStatusPayload): Promise<OrdemServico> => {
    const { data } = await api.patch<OrdemServico>(`/OrdemServico/${id}/status`, payload);
    return data;
  },

  remover: async (id: number): Promise<void> => {
    await api.delete(`/OrdemServico/${id}`);
  },

  listarFuncionarios: async (idOs: number): Promise<OsFuncionarioDetalhe[]> => {
    const { data } = await api.get<OsFuncionarioDetalhe[]>(`/OrdemServico/${idOs}/funcionarios`);
    return data;
  },

  adicionarFuncionario: async (idOs: number, payload: OsFuncionarioPayload): Promise<void> => {
    await api.post(`/OrdemServico/${idOs}/funcionarios`, payload);
  },

  removerFuncionario: async (idOsFuncionario: number): Promise<void> => {
    await api.delete(`/OrdemServico/funcionarios/${idOsFuncionario}`);
  },

  definirResponsavel: async (idOs: number, idFuncionario: number): Promise<void> => {
    await api.put(`/OrdemServico/${idOs}/funcionarios/${idFuncionario}/responsavel`);
  },

  // Baixa o PDF assinado (binário) — GET /api/OrdemServico/{id}/pdf
  obterPdf: async (idOs: number): Promise<Blob> => {
    const { data } = await api.get(`/OrdemServico/${idOs}/pdf`, { responseType: "blob" });
    return data as Blob;
  },

  // Gera o link/token de fotos do atendimento (segundo aparelho do consultor)
  iniciarFotos: async (idOs: number): Promise<TokenAssinatura> => {
    const { data } = await api.post<TokenAssinatura>(`/OrdemServico/${idOs}/fotos/iniciar`);
    return data;
  },

  // Baixa o PDF de fotos do atendimento (binário) — GET /api/OrdemServico/{id}/pdf-fotos
  obterPdfFotos: async (idOs: number): Promise<Blob> => {
    const { data } = await api.get(`/OrdemServico/${idOs}/pdf-fotos`, { responseType: "blob" });
    return data as Blob;
  },
};
