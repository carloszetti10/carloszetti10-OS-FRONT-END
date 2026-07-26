import { api } from "@/api/axios";
import type {
  Funcionario,
  CriarFuncionarioPayload,
  AtualizarFuncionarioPayload,
  AtualizarAssinaturaFuncionarioPayload,
} from "@/types/funcionario";

export const funcionarioService = {
  // GET /api/Funcionario — protegido por policy FuncionarioVisualizar.
  // ATENÇÃO: o back ainda NÃO filtra por ativo — devolve todos.
  // Filtro "só ativos" feito no front por enquanto (ver hooks/useFuncionarios.ts).
  listar: async (): Promise<Funcionario[]> => {
    const { data } = await api.get<Funcionario[]>("/Funcionario");
    return data;
  },

  buscarPorId: async (id: number): Promise<Funcionario> => {
    const { data } = await api.get<Funcionario>(`/Funcionario/${id}`);
    return data;
  },

  criar: async (payload: CriarFuncionarioPayload): Promise<Funcionario> => {
    const { data } = await api.post<Funcionario>("/Funcionario", payload);
    return data;
  },

  atualizar: async (id: number, payload: AtualizarFuncionarioPayload): Promise<Funcionario> => {
    const { data } = await api.put<Funcionario>(`/Funcionario/${id}`, payload);
    return data;
  },

  remover: async (id: number): Promise<void> => {
    await api.delete(`/Funcionario/${id}`);
  },

  // Salva/troca a assinatura padrão do PRÓPRIO funcionário logado (o back
  // descobre quem é pelo token, não recebe id — ver rota no back).
  atualizarMinhaAssinatura: async (payload: AtualizarAssinaturaFuncionarioPayload): Promise<void> => {
    await api.put("/Funcionario/assinatura", payload);
  },
};
