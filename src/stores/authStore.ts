import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
 *
 * SEGURANÇA — token em sessionStorage, não em localStorage:
 * Ambos são acessíveis a qualquer script rodando na página (inclusive
 * código injetado via XSS), então nenhum dos dois é imune a esse ataque —
 * a mitigação definitiva pra isso é a API devolver o JWT num cookie
 * httpOnly + Secure + SameSite, o que depende de mudança no back-end e
 * está fora do escopo desta correção pontual.
 *
 * Dito isso, sessionStorage é bem mais seguro que localStorage na prática:
 *  - É isolado por ABA: uma aba não consegue ler o token de outra, e um
 *    site diferente aberto no mesmo navegador nunca tem acesso a ele.
 *  - Expira sozinho ao fechar a aba/navegador — não fica gravado em disco
 *    indefinidamente esperando alguém (malware, outra pessoa no mesmo PC,
 *    um backup do perfil do navegador) encontrar semanas depois.
 *  - Mantém o F5 funcionando normalmente, que é o comportamento que o
 *    fluxo de assinatura/PDF da OS depende.
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
    {
      name: "os-nortesys-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
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
