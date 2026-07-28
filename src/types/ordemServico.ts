import { StatusOs } from "./enums";

// Espelha OsFuncionarioDto (payload de vínculo) e OsFuncionarioDetalheDto (leitura)
export interface OsFuncionarioPayload {
  idFuncionario: number;
  responsavel: boolean;
}

export interface OsFuncionarioDetalhe {
  idOsFuncionario: number;
  idFuncionario: number;
  nomeFuncionario: string;
  responsavel: boolean;
}

// Espelha CriarOrdemServicoDto
export interface CriarOrdemServicoPayload {
  tituloOs: string;
  descricao: string;
  idTipoAtendimento: number;
  idCliente: number;
  dataHoraInicio?: string | null;
  prazo?: string | null;
  observacao?: string;
  funcionarios: OsFuncionarioPayload[];
}

// Espelha AtualizarOrdemServicoDto
export interface AtualizarOrdemServicoPayload {
  tituloOs: string;
  descricao: string;
  idTipoAtendimento: number;
  idCliente: number;
  status: StatusOs;
  dataHoraInicio?: string | null;
  dataHoraFim?: string | null;
  prazo?: string | null;
  observacao?: string;
}

// Espelha AtualizarRelatorioDto
export interface AtualizarRelatorioPayload {
  relatorioTecnico: string;
}

// Espelha AlterarStatusOsDto
export interface AlterarStatusPayload {
  status: StatusOs;
}

// Espelha BuscarOrdemServicoDto (o que a API retorna)
export interface OrdemServico {
  idOs: number;
  tituloOs: string;
  descricao: string;
  idTipoAtendimento: number;
  nomeTipoAtendimento: string;
  idUsuarioRegistrou: string;
  idCliente: number;
  nomeCliente: string;
  status: StatusOs;
  dataHoraInicio?: string | null;
  dataHoraFim?: string | null;
  prazo?: string | null;
  relatorioTecnico?: string | null;
  observacao?: string | null;
  cogigoPdf: string;
  funcionarios: OsFuncionarioPayload[];
  possuiPdfAssinado: boolean; // novo campo (back) — true quando já existe um PDF assinado salvo
  possuiPdfFotos: boolean; // true quando já existe um PDF de fotos do atendimento salvo
}
