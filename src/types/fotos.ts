// Dados públicos (sem login) da tela de fotos do atendimento
export interface FotosPublica {
  idOs: number;
  tituloOs: string;
  nomeCliente: string;
}

export interface SalvarFotosPayload {
  arquivoPdfFotos: string; // base64 do PDF final montado no front
}
