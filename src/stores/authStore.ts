import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, JwtPayload } from "@/types/auth";

interface AuthState {
  token: string | null;
  usuario: { id: string; usuario: string; email: string } | null;
  /** Define os dados de sessão após um login bem-sucedido */
  login: (auth: AuthResponse) => void;
  /** Limpa a sessão (logout manual ou 401 vindo do interceptor) */
  logout: () => void;
  estaAutenticado: () => boolean;
}

/**
 * Estado global de autenticação (Zustand, sem Redux por pedido do projeto).
 * Persistido no localStorage pra sobreviver a um F5 — o "persist" grava
 * automaticamente sob a chave "os-nortesys-auth".
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,

      login: (auth) =>
        set({
          token: auth.token,
          usuario: { id: auth.id, usuario: auth.usuario, email: auth.email },
        }),

      logout: () => set({ token: null, usuario: null }),

      estaAutenticado: () => {
        const { token } = get();
        if (!token) return false;
        // Confere se o token já expirou (campo "exp" em segundos desde epoch)
        try {
          const payload = decodificarJwt(token);
          return payload.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      },
    }),
    { name: "os-nortesys-auth" }
  )
);

/** Decodifica o payload de um JWT sem validar assinatura (só pra ler claims no front) */
export function decodificarJwt(token: string): JwtPayload {
  const payloadBase64 = token.split(".")[1];
  const json = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}

/** Lista de permissões (claims "Permissao") do usuário logado, sempre como array */
export function obterPermissoesDoToken(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = decodificarJwt(token);
    if (!payload.Permissao) return [];
    return Array.isArray(payload.Permissao) ? payload.Permissao : [payload.Permissao];
  } catch {
    return [];
  }
}
