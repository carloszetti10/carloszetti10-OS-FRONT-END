// Formato de erro que o ExceptionMiddleware do back devolve para exceções de negócio.
export interface ApiErrorBody {
  Status: number;
  Mensagem: string;
}

// Formato padrão do ASP.NET Core quando a validação automática de ModelState
// falha antes de chegar no controller (ex.: [Required] do DataAnnotations).
export interface ProblemDetailsBody {
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
  detail?: string;
}
