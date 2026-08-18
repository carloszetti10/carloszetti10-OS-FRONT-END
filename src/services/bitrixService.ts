import { AxiosError } from "axios";
import { api } from "@/api/axios";
import type {
  BitrixListaResponse,
  BitrixWebhookPayload,
  BuscarBitrixConfiguracao,
  SalvarBitrixConfiguracaoPayload,
} from "@/types/bitrix";

export const bitrixService = {
  // GET /Bitrix/Configuracao?funcionarioId= — fonte da verdade de "esse
  // funcionário já tem configuração?". O back joga ValidacaoException
  // ("Funcionario sem configuração.") quando não existe nenhuma linha pra
  // esse funcionário, o que o ExceptionMiddleware converte em HTTP 400 —
  // aqui tratamos esse 400 específico como "ainda não configurado" (null)
  // em vez de propagar como erro de tela.
  buscarConfiguracao: async (funcionarioId: number): Promise<BuscarBitrixConfiguracao | null> => {
    try {
      const { data } = await api.get<BuscarBitrixConfiguracao>("/Bitrix/Configuracao", {
        params: { funcionarioId },
      });
      return data;
    } catch (erro) {
      if (erro instanceof AxiosError && erro.response?.status === 400) {
        return null;
      }
      throw erro;
    }
  },

  // GET /Bitrix/drives/{funcionarioId}. Só funciona se já existir webhook
  // salvo pro funcionário (o back usa o webhook salvo pra montar a URL da
  // API do Bitrix).
  buscarDrives: async (funcionarioId: number): Promise<BitrixListaResponse> => {
    const { data } = await api.get<BitrixListaResponse>(`/Bitrix/drives/${funcionarioId}`);
    return data;
  },

  // GET /Bitrix/pasta/{idFunci,idDrive} — rota real do back (não alterada).
  // O segmento de rota é obrigatório mas o controller não usa esse valor pra
  // nada (o nome do parâmetro de rota "idFunci,idDrive" não bate com os
  // parâmetros do método, funcionarioId/idDrive — o ASP.NET acaba resolvendo
  // os dois via query string mesmo assim). Reaproveitamos o próprio idDrive
  // como esse segmento; o valor em si é ignorado pelo back.
  buscarPastas: async (funcionarioId: number, idDrive: string): Promise<BitrixListaResponse> => {
    const { data } = await api.get<BitrixListaResponse>(`/Bitrix/pasta/${encodeURIComponent(idDrive)}`, {
      params: { funcionarioId, idDrive },
    });
    return data;
  },

  // POST /Bitrix/webhook — só funciona na primeira vez (o back rejeita com
  // "Este funcionário já possui uma configuração Bitrix." se já existir).
  cadastrarWebhook: async (payload: BitrixWebhookPayload): Promise<void> => {
    await api.post("/Bitrix/webhook", payload);
  },

  // PUT /Bitrix/webhook/{id} — troca o webhook de uma configuração já
  // existente. O "id" vem do GET /Bitrix/Configuracao.
  atualizarWebhook: async (id: number, payload: BitrixWebhookPayload): Promise<void> => {
    await api.put(`/Bitrix/webhook/${id}`, payload);
  },

  // POST /Bitrix/config — o back localiza a configuração pelo IdFuncionario
  // (não pelo id) e faz upsert do Drive/Pasta, então o MESMO POST serve tanto
  // pra criar quanto pra atualizar/editar a seleção de Drive/Pasta.
  salvarConfiguracao: async (payload: SalvarBitrixConfiguracaoPayload): Promise<void> => {
    await api.post("/Bitrix/config", payload);
  },
};
