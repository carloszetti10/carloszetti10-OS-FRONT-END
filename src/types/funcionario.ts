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
