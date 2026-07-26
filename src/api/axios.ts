import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

/**
 * Instância única do Axios usada por todos os Services.
 * Base URL vem de variável de ambiente (.env) — nunca hardcoded, porque o
 * túnel do Cloudflare do back muda de endereço com frequência.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// Interceptor de REQUEST: injeta o Bearer Token automaticamente em toda
// chamada, sem precisar repetir isso em cada Service.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de RESPONSE: em 401 (token expirado/inválido), limpa a sessão
// e manda pro login. Os outros status (400/403/404/409/500) são tratados
// tela por tela via utils/errorHandler.ts, porque a mensagem certa depende
// do contexto da ação que o usuário estava tentando fazer.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
