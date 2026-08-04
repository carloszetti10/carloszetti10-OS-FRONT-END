import axios from "axios";

/**
 * Instância do Axios para as rotas PÚBLICAS (assinatura/fotos por token),
 * acessadas pelo dispositivo do cliente sem estar logado no sistema.
 *
 * Propositalmente SEM o interceptor que injeta o Bearer Token do
 * funcionário (ver src/api/axios.ts): se um funcionário estiver logado no
 * mesmo navegador e abrir esse link, não queremos que o token dele viaje
 * numa tela pensada para o cliente. Além disso, a política de CORS do back
 * ("PublicoToken") só libera o header Content-Type — mandar Authorization
 * aqui derruba o preflight.
 */
export const apiPublic = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withCredentials: false,
});
