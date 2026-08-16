import { useAuthStore, obterPermissoesDoToken } from "@/stores/authStore";

/**
 * Espelha a permissão "OS.VisualizarTodas" do back (Permissoes.OSVisualizarTodas).
 * Quem não tem essa permissão só vê as próprias OS/indicadores — não os de colegas
 * vinculados às mesmas OS.
 */
export function usePodeVerTodasAsOs(): boolean {
  const token = useAuthStore((s) => s.token);
  const permissoes = obterPermissoesDoToken(token);
  return permissoes.includes("OS.VisualizarTodas");
}

/**
 * Essa é a claim real "Usuario.GerenciarPermissoes" (existe de propósito no
 * back pra isso, então aqui não é inferência — é a permissão exata).
 */
export function usePodeGerenciarPermissoes(): boolean {
  const token = useAuthStore((s) => s.token);
  const permissoes = obterPermissoesDoToken(token);
  return permissoes.includes("Usuario.GerenciarPermissoes");
}
