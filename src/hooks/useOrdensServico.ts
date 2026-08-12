import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ordemServicoService } from "@/services/ordemServicoService";
import { useFuncionarioLogado } from "./useFuncionarioLogado";
import { usePodeVerTodasAsOs } from "./usePermissoes";
import type {
  CriarOrdemServicoPayload,
  AtualizarOrdemServicoPayload,
  AtualizarRelatorioPayload,
  AlterarStatusPayload,
  OsFuncionarioPayload,
  FiltroOrdensServico,
  FiltroIndicadores,
} from "@/types/ordemServico";

/**
 * Lista as OS.
 * TODO(back): GET /api/OrdemServico ainda devolve TODAS as ordens, sem
 * suportar filtro por funcionário. A regra "o funcionário só vê as OS às
 * quais está vinculado" está sendo aplicada aqui no front, comparando
 * ordem.funcionarios[].idFuncionario com o id do funcionário logado.
 * Isso é só uma camada de UX — quem bater direto na API vê tudo, então
 * essa regra precisa migrar pro back (query param ?idFuncionario= ou
 * filtro automático pelo usuário autenticado) assim que possível.
 *
 * Exceção: usuários com permissão de Gestor/Administrador (ver
 * hooks/usePermissoes.ts) enxergam todas as OS, sem esse filtro.
 */
export function useOrdensServico() {
  const { data: funcionarioLogado } = useFuncionarioLogado();
  const podeVerTodas = usePodeVerTodasAsOs();

  return useQuery({
    queryKey: ["ordens-servico", funcionarioLogado?.id, podeVerTodas],
    enabled: podeVerTodas || !!funcionarioLogado,
    queryFn: async () => {
      const todas = await ordemServicoService.listar();
      if (podeVerTodas) return todas;
      return todas.filter((os) =>
        os.funcionarios.some((f) => f.idFuncionario === funcionarioLogado!.id)
      );
    },
  });
}

export function useOrdemServico(id: number | undefined) {
  return useQuery({
    queryKey: ["ordem-servico", id],
    enabled: !!id,
    queryFn: () => ordemServicoService.buscarPorId(id!),
  });
}

/**
 * Igual ao useOrdensServico() acima, mas usando o endpoint paginado
 * (GET /OrdemServico/paginado) — usado na tela "Todas as OS"
 * (OrdensServicoList), que tem filtro/busca/paginação.
 *
 * Diferente do useOrdensServico(), aqui o filtro "só vê OS vinculada ao
 * funcionário" já é aplicado no BACK (pela permissão do usuário logado),
 * então não precisa repetir esse filtro aqui no front.
 *
 * placeholderData: keepPreviousData mantém a lista da página atual visível
 * (em vez de mostrar undefined/loading) enquanto a próxima página ou um
 * filtro novo ainda está sendo buscado — evita a tela "piscar" em branco.
 */
export function useOrdensServicoPaginado(filtro: FiltroOrdensServico) {
  return useQuery({
    queryKey: ["ordens-servico-paginado", filtro],
    queryFn: () => ordemServicoService.listarPaginado(filtro),
    placeholderData: keepPreviousData,
  });
}

export function useCriarOrdemServico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarOrdemServicoPayload) => ordemServicoService.criar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
    },
  });
}

export function useAtualizarRelatorio(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarRelatorioPayload) =>
      ordemServicoService.atualizarRelatorio(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordem-servico", id] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
    },
  });
}

export function useAlterarStatusOs(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AlterarStatusPayload) => ordemServicoService.alterarStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordem-servico", id] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
    },
  });
}

/** Atualiza dados gerais da OS (título, descrição, tipo, cliente, datas, etc.) — usado aqui pra editar Início/Prazo. */
export function useAtualizarOrdemServico(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarOrdemServicoPayload) => ordemServicoService.atualizar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordem-servico", id] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
    },
  });
}

/** Adiciona um funcionário à OS (POST /OrdemServico/{id}/funcionarios) */
export function useAdicionarFuncionarioOs(idOs: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OsFuncionarioPayload) => ordemServicoService.adicionarFuncionario(idOs, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordem-servico-funcionarios", idOs] });
      queryClient.invalidateQueries({ queryKey: ["ordem-servico", idOs] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
    },
  });
}

/** Remove o vínculo de um funcionário com a OS (DELETE /OrdemServico/funcionarios/{idOsFuncionario}) */
export function useRemoverFuncionarioOs(idOs: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idOsFuncionario: number) => ordemServicoService.removerFuncionario(idOsFuncionario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordem-servico-funcionarios", idOs] });
      queryClient.invalidateQueries({ queryKey: ["ordem-servico", idOs] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
    },
  });
}

/** Troca quem é o responsável pela OS (PUT /OrdemServico/{id}/funcionarios/{idFuncionario}/responsavel) */
export function useDefinirResponsavelOs(idOs: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idFuncionario: number) => ordemServicoService.definirResponsavel(idOs, idFuncionario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordem-servico-funcionarios", idOs] });
      queryClient.invalidateQueries({ queryKey: ["ordem-servico", idOs] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
    },
  });
}

/**
 * Busca os funcionários vinculados a uma OS com o NOME já resolvido
 * (GET /OrdemServico/{id}/funcionarios devolve OsFuncionarioDetalheDto,
 * que tem NomeFuncionario — diferente do campo "funcionarios" que vem
 * dentro do BuscarOrdemServicoDto, que só tem o id).
 */
export function useFuncionariosDaOs(idOs: number | undefined) {
  return useQuery({
    queryKey: ["ordem-servico-funcionarios", idOs],
    enabled: !!idOs,
    queryFn: () => ordemServicoService.listarFuncionarios(idOs!),
  });
}

/**
 * Indicadores de desempenho (OS concluídas, tempo médio, ranking por
 * consultor) — GET /OrdemServico/indicadores. Toda a agregação acontece
 * no back agora; aqui é só um useQuery igual aos outros.
 *
 * placeholderData: keepPreviousData evita a tela piscar em branco toda
 * vez que o usuário troca um filtro (mesmo comportamento do
 * useOrdensServicoPaginado acima).
 */
export function useIndicadores(filtro: FiltroIndicadores) {
  return useQuery({
    queryKey: ["indicadores", filtro],
    queryFn: () => ordemServicoService.obterIndicadores(filtro),
    placeholderData: keepPreviousData,
  });
}
