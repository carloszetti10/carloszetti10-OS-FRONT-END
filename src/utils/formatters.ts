/** Formata datas ISO vindas do back (DateTime) pro padrão brasileiro */
export function formatarData(iso?: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR");
}

export function formatarDataHora(iso?: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Converte um Date/valor de <input type="datetime-local"> para ISO (o que o back espera) */
export function paraIso(valorInput?: string | null): string | undefined {
  if (!valorInput) return undefined;
  return new Date(valorInput).toISOString();
}

/** Converte uma data ISO do back para o formato aceito por <input type="datetime-local"> */
export function paraInputDatetime(iso?: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const offset = data.getTimezoneOffset();
  const local = new Date(data.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Máscara simples de CPF/CNPJ conforme a quantidade de dígitos digitados */
export function mascararDocumento(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 14);
  if (digitos.length <= 11) {
    return digitos
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digitos
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Máscara de CEP: 00000-000 */
export function mascararCep(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

/** Máscara de telefone: (00) 00000-0000 ou (00) 0000-0000 */
export function mascararTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

/**
 * Formata uma duração em horas (número decimal) pro formato mais legível
 * possível: minutos (< 1h), horas com 1 decimal (< 24h) ou dias + horas (>= 24h).
 * Usado nos indicadores de tempo de conclusão de OS.
 */
export function formatarDuracaoHoras(horas?: number | null): string {
  if (horas === null || horas === undefined || Number.isNaN(horas)) return "—";
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 24) return `${horas.toFixed(1)} h`;

  const dias = Math.floor(horas / 24);
  const horasRestantes = Math.round(horas % 24);
  return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`;
}
