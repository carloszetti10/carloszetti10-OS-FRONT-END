import { useQuery } from "@tanstack/react-query";
import { funcionarioService } from "@/services/funcionarioService";
import { useAuthStore, decodificarJwt } from "@/stores/authStore";
import type { Funcionario } from "@/types/funcionario";

/**
 * Não existe endpoint "/api/Usuario/me" no back, então descobrimos qual
 * Funcionario corresponde ao usuário logado cruzando o "sub" do JWT
 * (Id do Usuario) com o campo "usuarioId" da lista de Funcionários.
 * TODO(back): expor um endpoint tipo GET /api/Usuario/me ou incluir
 * "idFuncionario" direto no AuthDto do login, pra não depender de listar
 * todo mundo só pra achar o próprio funcionário.
 */
export function useFuncionarioLogado() {
  const token = useAuthStore((s) => s.token);

  return useQuery<Funcionario | undefined>({
    queryKey: ["funcionario-logado", token],
    enabled: !!token,
    queryFn: async () => {
      const funcionarios = await funcionarioService.listar();
      const { sub } = decodificarJwt(token!);
      return funcionarios.find((f) => f.usuarioId === sub);
    },
    staleTime: 5 * 60_000,
  });
}
