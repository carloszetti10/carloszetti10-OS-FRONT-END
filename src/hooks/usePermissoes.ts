import { useAuthStore, obterPermissoesDoToken } from "@/stores/authStore";

/**
 * O back não expõe o TipoUsuario (Gestor/Técnico/Administrador) em nenhum
 * endpoint hoje — só dá pra inferir pelas claims "Permissao" do JWT.
 * Pelo mapeamento de permissões do back (MapeamentoPermissoes.cs):
 *   - Técnico   → Funcionario.Visualizar, Cliente.Criar
 *   - Gestor    → Funcionario.Visualizar, Cliente.Criar, Cliente.Atualizar
 *   - Administrador → todas
 * "Cliente.Atualizar" é a claim que só Gestor e Administrador têm — por
 * isso ela é usada aqui como sinal de "vê todas as OS".
 * TODO(back): expor uma permissão dedicada (ex.: "OS.VisualizarTodas") pra
 * não depender dessa inferência frágil por uma claim que existe por outro motivo.
 */
export function usePodeVerTodasAsOs(): boolean {
  const token = useAuthStore((s) => s.token);
  const permissoes = obterPermissoesDoToken(token);
  return permissoes.includes("Cliente.Atualizar");
}
