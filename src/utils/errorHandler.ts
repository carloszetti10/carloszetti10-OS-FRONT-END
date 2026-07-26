import { AxiosError } from "axios";
import type { ApiErrorBody, ProblemDetailsBody } from "@/types/common";

/**
 * Extrai uma mensagem de erro amigável e REAL (nunca genérica) a partir de
 * um erro do Axios, cobrindo os dois formatos que a API devolve:
 *
 * 1) Exceções de negócio (ValidacaoException, ConflitoException, etc.),
 *    tratadas pelo ExceptionMiddleware do back e devolvidas como:
 *      { "Status": 400, "Mensagem": "O CPF é obrigatório." }
 *
 * 2) Falhas de validação automática do ASP.NET Core (DataAnnotations),
 *    que NÃO passam pelo middleware e vêm no formato padrão ProblemDetails:
 *      { "title": "...", "errors": { "Campo": ["mensagem 1", "mensagem 2"] } }
 *
 * Qualquer coisa fora desses dois formatos (rede fora do ar, timeout, 500
 * sem middleware, etc.) cai num fallback textual, mas sempre citando o que
 * de fato aconteceu — nunca um "Erro ao processar" genérico e mudo.
 */
export function extrairMensagemErro(error: unknown): string {
  if (!(error instanceof AxiosError)) {
    return "Ocorreu um erro inesperado. Tente novamente.";
  }

  // Sem resposta do servidor: problema de rede, CORS, back fora do ar, etc.
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "A requisição demorou demais e foi cancelada. Verifique sua conexão e tente novamente.";
    }
    return "Não foi possível falar com o servidor. Verifique sua conexão ou se a API está no ar.";
  }

  const data = error.response.data as ApiErrorBody | ProblemDetailsBody | undefined;

  // Formato 1: exceções de negócio do ExceptionMiddleware ({ Status, Mensagem })
  if (data && typeof data === "object" && "Mensagem" in data && data.Mensagem) {
    return data.Mensagem;
  }

  // Formato 2: ProblemDetails padrão do ASP.NET Core (validação automática)
  if (data && typeof data === "object" && "errors" in data && data.errors) {
    const mensagens = Object.values(data.errors).flat();
    if (mensagens.length > 0) {
      return mensagens.join(" ");
    }
  }
  if (data && typeof data === "object" && "title" in data && data.title) {
    return data.title;
  }

  // Fallback por status HTTP, ainda assim específico (não genérico)
  switch (error.response.status) {
    case 401:
      return "Sua sessão expirou ou as credenciais são inválidas. Faça login novamente.";
    case 403:
      return "Você não tem permissão para realizar esta ação.";
    case 404:
      return "O recurso solicitado não foi encontrado.";
    case 409:
      return "Já existe um registro em conflito com essas informações.";
    case 500:
      return "Ocorreu um erro interno no servidor. Tente novamente em instantes.";
    default:
      return `Erro inesperado (HTTP ${error.response.status}).`;
  }
}

/**
 * Extrai erros por campo (quando existirem) para marcar inputs individuais
 * de um formulário React Hook Form, além da mensagem geral acima.
 * Só é preenchido no formato ProblemDetails (validação automática).
 */
export function extrairErrosPorCampo(error: unknown): Record<string, string> | null {
  if (!(error instanceof AxiosError) || !error.response) return null;

  const data = error.response.data as ProblemDetailsBody | undefined;
  if (!data?.errors) return null;

  const resultado: Record<string, string> = {};
  for (const [campo, mensagens] of Object.entries(data.errors)) {
    // ASP.NET manda o nome do campo com a capitalização do C# (ex.: "RazaoSocial");
    // normalizamos pra camelCase pra bater com os nomes usados no formulário React.
    const chave = campo.charAt(0).toLowerCase() + campo.slice(1);
    resultado[chave] = mensagens[0];
  }
  return resultado;
}
