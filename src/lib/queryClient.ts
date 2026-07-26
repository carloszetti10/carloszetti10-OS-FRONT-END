import { QueryClient } from "@tanstack/react-query";

// Configuração central do TanStack Query. retry:1 evita martelar a API em
// erros de validação (400/409), que não vão se resolver tentando de novo.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
