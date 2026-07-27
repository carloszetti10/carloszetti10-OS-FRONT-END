// Espelha os novos DTOs de assinatura do back (OS_API.DTOs.Assinatura)

export interface IniciarAssinaturaPayload {
  imagemAssinaturaFuncionario: string; // base64 (PNG), sem o prefixo "data:image/png;base64,"
  salvarComoPadrao: boolean;
}

export interface TokenAssinatura {
  token: string;
  expiraEm: string; // ISO
}

export interface AssinaturaPublica {
  idOs: number;
  tituloOs: string;
  nomeTipoAtendimento: string;
  nomeCliente: string;
  documentoCliente: string;
  dataHoraInicio?: string | null;
  dataHoraFim?: string | null;
  descricao: string;
  relatorioTecnico?: string | null;
  nomeFuncionario: string;
  assinaturaFuncionarioBase64: string;
  jaAssinadoPeloCliente: boolean;
}

export interface SubmeterAssinaturaClientePayload {
  nomeSignatario: string;
  documentoSignatario?: string;
  imagemAssinatura: string; // base64 (PNG)
  arquivoPdf: string; // base64 do PDF final — o back desserializa como byte[] automaticamente
}
