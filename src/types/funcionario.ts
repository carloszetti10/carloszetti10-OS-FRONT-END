import { TipoUsuario } from "./enums";

// Espelha FuncionarioDto (resposta) do back
export interface Funcionario {
  id: number;
  nome: string;
  usuarioId: string;
  userName: string;
  email: string;
  ativo: boolean;
  assinaturaPadrao?: string | null; // base64 (PNG), null se ainda não registrou
}

// Espelha CriarFuncionarioDto
export interface CriarFuncionarioPayload {
  nome: string;
  userName: string;
  email: string;
  senha: string;
  tipoUsuario: TipoUsuario;
}

// Espelha AtualizarFuncionarioDto
export interface AtualizarFuncionarioPayload {
  nome: string;
  userName: string;
  email: string;
  ativo: boolean;
}

// Espelha AtualizarAssinaturaFuncionarioDto
export interface AtualizarAssinaturaFuncionarioPayload {
  imagemAssinatura: string;
}

// Espelha FiltroFuncionarioDto (query string de GET /Funcionario/paginado)
// ASSUMIDO igual ao padrão de FiltroClienteDto (pagina/tamanhoPagina/busca) —
// conferir contra o back real se a rota/campos vierem diferentes.
export interface FiltroFuncionarios {
  pagina: number;
  tamanhoPagina: number;
  busca?: string;
}

// Espelha ResultadoPaginadoFuncionarioDto — ASSUMIDO no mesmo formato do de
// Cliente (ver types/cliente.ts). Ainda não conferido contra o back real.
export interface ResultadoPaginadoFuncionario {
  itens: Funcionario[];
  totalRegistros: number;
  pagina: number;
  tamanhoPagina: number;
}
