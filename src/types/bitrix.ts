// Espelham os DTOs de OS_API.Services.Bitrix.DTOs (repo SISTEMA_OS, branch
// bitrix) EXATAMENTE como estão hoje — nenhum endpoint novo, nenhum campo novo.

// Resposta crua da API do Bitrix repassada pelo back (BitrixDriveResponseDto /
// BitrixPastaResponseDto) — os itens vêm com "ID"/"NAME" maiúsculos porque o
// DTO usa [JsonPropertyName] fixo pra bater com o formato da própria API do
// Bitrix, então a policy camelCase do resto do back não se aplica aqui.
export interface BitrixItemBruto {
  ID: string;
  NAME: string;
}

export interface BitrixListaResponse {
  result: BitrixItemBruto[];
}

// Espelha BitrixWebhookDto (POST /Bitrix/webhook, PUT /Bitrix/webhook/{id}).
export interface BitrixWebhookPayload {
  idFuncionario: number;
  webhookUrl: string;
}

// Espelha SalvarBitrixConfiguracaoDto (POST /Bitrix/config). O back localiza
// a configuração pelo IdFuncionario (não pelo id) e faz upsert do Drive/Pasta,
// então o mesmo POST serve tanto pra criar quanto pra atualizar.
export interface SalvarBitrixConfiguracaoPayload {
  idFuncionario: number;
  driveId: string;
  pastaId: string;
}

// Espelha BuscarBitrixConfiguracaoDto (GET /Bitrix/Configuracao?funcionarioId=).
// driveId/pastaId são "string" no C#, mas o back usa o operador de supressão de
// nulo (configuracao.DriveId!) — ou seja, se o funcionário já tem webhook mas
// ainda não escolheu Drive/Pasta, esses campos chegam null de verdade em
// tempo de execução, apesar do tipo declarado. Tipamos como string | null pra
// refletir o comportamento real, não a assinatura do C#.
export interface BuscarBitrixConfiguracao {
  id: number;
  idFuncionario: number;
  driveId: string | null;
  pastaId: string | null;
}
