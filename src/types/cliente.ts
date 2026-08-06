import { TipoPessoa } from "./enums";

// Espelha ClienteDto (resposta) do back
export interface Cliente {
  idCliente: number;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  tipoPessoa: TipoPessoa;
  documento: string;
  telefone?: string | null;
  email?: string | null;
  cep: string;
  uf?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  ativo: boolean;
}

// Espelha CriarClienteDto
export interface CriarClientePayload {
  tipoPessoa: TipoPessoa;
  nomeFantasia: string;
  razaoSocial?: string;
  documento: string;
  email?: string;
  telefone?: string;
  cep: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  rua?: string;
  numero?: string;
}

// Espelha AtualizarClienteDto (igual ao de criar + Ativo)
export interface AtualizarClientePayload extends CriarClientePayload {
  ativo: boolean;
}

// Espelha FiltroClienteDto (query string de GET /Clientes/paginado)
export interface FiltroClientes {
  pagina: number;
  tamanhoPagina: number;
  busca?: string;
}

// Espelha ResultadoPaginadoClienteDto (conferido no back: OS_API/DTOs/Cliente/Filtro).
// ATENÇÃO: o back NÃO preenche o campo TamanhoPagina na resposta (bug lá,
// sempre vem 0) — por isso o front usa o tamanhoPagina que ELE MESMO mandou
// na requisição pra calcular o total de páginas, nunca o valor da resposta.
export interface ResultadoPaginadoCliente {
  itens: Cliente[];
  totalRegistros: number;
  pagina: number;
  tamanhoPagina: number;
}

// Resposta de GET /api/Cep/consulta-cep/{cep} (CepController)
export interface ViaCepResponse {
  cep: string;
  uf: string;
  cidade: string;
  rua: string;
  bairro: string;
  complemento?: string;
}