import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import type { FiltroDashboard } from "@/types/dashboard";

/**
 * Métricas da tela "Visão Geral" (Dashboard) — GET /api/Dashboard.
 * placeholderData: keepPreviousData evita a tela piscar em branco toda vez
 * que o usuário troca o período ou o filtro de status (mesmo comportamento
 * de useIndicadores/useOrdensServicoPaginado).
 */
export function useDashboard(filtro: FiltroDashboard) {
  return useQuery({
    queryKey: ["dashboard", filtro],
    queryFn: () => dashboardService.obterMetricas(filtro),
    placeholderData: keepPreviousData,
  });
}
