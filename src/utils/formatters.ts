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
 * Formata uma duração em horas (número decimal) sempre em horas e minutos
 * (nunca decimal): minutos isolados (< 1h), horas + minutos (< 24h) ou
 * dias + horas + minutos (>= 24h). Usado nos indicadores de tempo de
 * conclusão de OS.
 */
export function formatarDuracaoHoras(horas?: number | null): string {
  if (horas === null || horas === undefined || Number.isNaN(horas)) return "--";

  const totalMinutos = Math.round(horas * 60);
  if (totalMinutos < 1) return "Menor que 1min";

  if (horas < 24) {
    const h = Math.floor(totalMinutos / 60);
    const min = totalMinutos % 60;
    if (h === 0) return `${min}min`;
    return min > 0 ? `${h}h ${min}min` : `${h}h`;
  }

  const minutosPorDia = 60 * 24;
  const dias = Math.floor(totalMinutos / minutosPorDia);
  const restoMinutos = totalMinutos % minutosPorDia;
  const horasRestantes = Math.floor(restoMinutos / 60);
  const minutosRestantes = restoMinutos % 60;

  const partes = [`${dias}d`];
  if (horasRestantes > 0) partes.push(`${horasRestantes}h`);
  if (minutosRestantes > 0) partes.push(`${minutosRestantes}min`);
  return partes.join(" ");
}
