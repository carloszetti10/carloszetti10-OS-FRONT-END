import { StatusOs } from "./enums";

export type PeriodoDashboard = "24h" | "7d" | "30d";

// Espelha a query string de GET /api/Dashboard
export interface FiltroDashboard {
  periodo: PeriodoDashboard;
  statusFiltro?: StatusOs;
}

// Espelha VolumeSerieDto
export interface VolumeSerie {
  label: string;
  quantidade: number;
}

// Espelha StatusDistribuicaoDto — status vem como o valor numérico do enum StatusOs
export interface StatusDistribuicao {
  status: StatusOs;
  quantidade: number;
}

// Espelha OrdemServicoResumoDto
export interface OrdemServicoResumo {
  idOs: number;
  tituloOs: string;
  nomeCliente: string;
  dataHoraInicio?: string | null;
  status: StatusOs;
}

// Espelha DashboardMetricDto — toda a agregação (totais, variação, séries,
// distribuição, últimas OS) já vem calculada pelo back.
export interface DashboardMetricas {
  totalOs: number;
  abertas: number;
  concluidas: number;
  atrasadas: number;
  variacaoVolumePercentual: number;
  serieVolume: VolumeSerie[];
  distribuicaoStatus: StatusDistribuicao[];
  ultimasOs: OrdemServicoResumo[];
}
