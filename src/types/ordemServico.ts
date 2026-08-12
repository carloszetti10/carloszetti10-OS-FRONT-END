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

// Espelha FiltroOrdemServicoDto (query string de GET /OrdemServico/paginado).
// Datas em "yyyy-mm-dd" (mesmo formato do <input type="date">) — o back aceita
// DateTime e faz o parse normalmente.
export interface FiltroOrdensServico {
  pagina: number;
  tamanhoPagina: number;
  status?: StatusOs;
  idCliente?: number;
  idTipoAtendimento?: number;
  dataInicioDe?: string;
  dataInicioAte?: string;
  dataFimDe?: string;
  dataFimAte?: string;
  busca?: string;
}

// Espelha ResultadoPaginadoOrdemServicoDto
export interface ResultadoPaginadoOrdemServico {
  itens: OrdemServico[];
  totalRegistros: number;
  pagina: number;
  tamanhoPagina: number;
}

// Espelha FiltroIndicadoresDto (query string de GET /OrdemServico/indicadores).
// concluidasApartirDe/concluidasAte incidem sobre a DATA DE CONCLUSÃO (dataHoraFim).
export interface FiltroIndicadores {
  idConsultor?: number;
  concluidasApartirDe?: string;
  concluidasAte?: string;
}

// Espelha IndicadorConsultorDto
export interface IndicadorConsultor {
  idFuncionario: number;
  nome: string;
  quantidade: number;
  tempoMedioHoras: number | null;
}

// Espelha IndicadoresDto — agregados já calculados no back.
export interface Indicadores {
  totalConcluidas: number;
  tempoMedioGeralHoras: number | null;
  porConsultor: IndicadorConsultor[];
}
