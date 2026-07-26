// Espelham exatamente os enums do back (OS_API.Models.Enum).
// Os valores numéricos são os mesmos usados no C# — não mude sem checar o back.

export enum TipoPessoa {
  Fisica = 1,
  Juridica = 2,
}

export enum TipoUsuario {
  Administrador = 1,
  Gestor = 2,
  Tecnico = 3,
}

export enum StatusOs {
  Agendada = 1,
  EmAtendimento = 2,
  Concluida = 3,
  Cancelada = 4,
  Atrasada = 5,
}

// Rótulos em português pra exibir na UI (o back só manda o número/nome do enum)
export const STATUS_OS_LABEL: Record<StatusOs, string> = {
  [StatusOs.Agendada]: "Agendada",
  [StatusOs.EmAtendimento]: "Em atendimento",
  [StatusOs.Concluida]: "Concluída",
  [StatusOs.Cancelada]: "Cancelada",
  [StatusOs.Atrasada]: "Atrasada",
};

export const TIPO_PESSOA_LABEL: Record<TipoPessoa, string> = {
  [TipoPessoa.Fisica]: "Pessoa física",
  [TipoPessoa.Juridica]: "Pessoa jurídica",
};

export const TIPO_USUARIO_LABEL: Record<TipoUsuario, string> = {
  [TipoUsuario.Administrador]: "Administrador",
  [TipoUsuario.Gestor]: "Gestor",
  [TipoUsuario.Tecnico]: "Técnico",
};
