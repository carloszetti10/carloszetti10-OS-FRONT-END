import { api } from "@/api/axios";
import type {
  Cliente,
  CriarClientePayload,
  AtualizarClientePayload,
  ViaCepResponse,
} from "@/types/cliente";

export const clienteService = {
  // GET /api/Clientes
  // ATENÇÃO: o back ainda NÃO filtra por ativo — devolve todos.
  // O filtro "só clientes ativos" está sendo feito no front (ver hooks/useClientes.ts)
  // até que essa regra seja movida pro back (query param ou endpoint dedicado).
  listar: async (): Promise<Cliente[]> => {
    const { data } = await api.get<Cliente[]>("/Clientes");
    return data;
  },

  buscarPorId: async (id: number): Promise<Cliente> => {
    const { data } = await api.get<Cliente>(`/Clientes/id/${id}`);
    return data;
  },

  buscarPorDocumento: async (documento: string): Promise<Cliente> => {
    const { data } = await api.get<Cliente>(`/Clientes/documento/${documento}`);
    return data;
  },

  criar: async (payload: CriarClientePayload): Promise<Cliente> => {
    const { data } = await api.post<Cliente>("/Clientes", payload);
    return data;
  },

  atualizar: async (id: number, payload: AtualizarClientePayload): Promise<Cliente> => {
    const { data } = await api.put<Cliente>(`/Clientes/${id}`, payload);
    return data;
  },

  remover: async (id: number): Promise<void> => {
    await api.delete(`/Clientes/${id}`);
  },

  consultarCep: async (cep: string): Promise<ViaCepResponse> => {
    const { data } = await api.get<ViaCepResponse>(`/Cep/consulta-cep/${cep}`);
    return data;
  },
};