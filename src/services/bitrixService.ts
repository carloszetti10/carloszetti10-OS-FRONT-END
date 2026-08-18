import { api } from "../api/axios";
import type { BitrixListaResponse, BitrixWebhookPayload, SalvarBitrixConfiguracaoPayload } from "../types/bitrix";

export const bitrixService = {
  // GET /Bitrix/drives/{funcionarioId}. O back só consegue montar a URL do
  // Bitrix se já existir um webhook salvo pro funcionário — se não existir,
  // essa chamada falha (ValidacaoException "Erro na api do bitrix"). Por não
  // existir NENHUM endpoint que devolva "esse funcionário já tem webhook?",
  // essa própria chamada é usada pela tela como o único sinal disponível.
  buscarDrives: async (funcionarioId: number): Promise<BitrixListaResponse> => {
    const { data } = await api.get<BitrixListaResponse>(`/Bitrix/drives/${funcionarioId}`);
    return data;
  },

  // GET /Bitrix/pasta/{idFunci,idDrive} — rota real do back (não alterada).
  // O parâmetro de rota é um segmento único obrigatório que o controller não
  // usa pra nada (os nomes dos parâmetros do método, funcionarioId/idDrive,
  // não batem com o nome do segmento da rota "idFunci,idDrive"): o ASP.NET
  // acaba resolvendo funcionarioId/idDrive via query string mesmo assim, mas
  // a URL exige um segmento extra depois de "pasta/". Reaproveitamos o
  // próprio idDrive como esse segmento (o valor em si é ignorado pelo back).
  buscarPastas: async (funcionarioId: number, idDrive: string): Promise<BitrixListaResponse> => {
    const { data } = await api.get<BitrixListaResponse>(`/Bitrix/pasta/${encodeURIComponent(idDrive)}`, {
      params: { funcionarioId, idDrive },
    });
    return data;
  },

  // POST /Bitrix/webhook — só funciona na primeira vez (o back rejeita com
  // "Este funcionário já possui uma configuração Bitrix." se já existir).
  // Não existe PUT usável pela tela: PUT /Bitrix/webhook/{id} pede o id
  // interno da configuração, e nenhum endpoint do back devolve esse id.
  cadastrarWebhook: async (payload: BitrixWebhookPayload): Promise<void> => {
    await api.post("/Bitrix/webhook", payload);
  },

  // POST /Bitrix/config — o back localiza a configuração pelo IdFuncionario
  // (não pelo id) e faz upsert do Drive/Pasta, então o MESMO POST serve tanto
  // pra criar quanto pra atualizar a seleção de Drive/Pasta.
  salvarConfiguracao: async (payload: SalvarBitrixConfiguracaoPayload): Promise<void> => {
    await api.post("/Bitrix/config", payload);
  },
};
