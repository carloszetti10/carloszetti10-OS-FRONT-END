// Espelha TipoAtendimentoDto do back — o campo é "Descricao", não "Nome"
// (isso estava errado antes e quebrava o select de tipo de atendimento).
// Não existe campo "Ativo" nesse DTO no back.
export interface TipoAtendimento {
  id: number;
  descricao: string;
}

export interface CriarTipoAtendimentoPayload {
  descricao: string;
}

export interface AtualizarTipoAtendimentoPayload {
  descricao: string;
}
