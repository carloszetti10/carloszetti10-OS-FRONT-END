import { api } from "@/api/axios";
import type { DashboardMetricas, FiltroDashboard } from "@/types/dashboard";

export const dashboardService = {
  // GET /api/Dashboard — métricas da tela "Visão Geral" (KPIs, série de
  // volume, distribuição por status e últimas OS). Toda a agregação e o
  // filtro "só vê as próprias OS" (ou todas, se tiver a permissão
  // OS.VisualizarTodas) são feitos no back agora.
  obterMetricas: async (filtro: FiltroDashboard): Promise<DashboardMetricas> => {
    const { data } = await api.get<DashboardMetricas>("/Dashboard", { params: filtro });
    return data;
  },
};
