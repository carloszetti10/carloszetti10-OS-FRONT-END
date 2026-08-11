import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Eye, Trash2, FileDown, SlidersHorizontal, X } from "lucide-react";
import { useOrdensServicoPaginado } from "@/hooks/useOrdensServico";
import { useClientes } from "@/hooks/useClientes";
import { useTiposAtendimento } from "@/hooks/useTiposAtendimento";
import { useDebounce } from "@/hooks/useDebounce";
import { ordemServicoService } from "@/services/ordemServicoService";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { SkeletonTabela } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusOsBadge } from "@/components/os/StatusOsBadge";
import { OrdemServicoFormModal } from "@/components/os/OrdemServicoFormModal";
import { STATUS_OS_LABEL, type StatusOs } from "@/types/enums";
import type { OrdemServico, FiltroOrdensServico } from "@/types/ordemServico";
import { formatarData } from "@/utils/formatters";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

const TAMANHO_PAGINA = 10;

export default function OrdensServicoList() {
  const [searchParams, setSearchParams] = useSearchParams();
  //const { data: clientes } = useClientes({ somenteAtivos: true });
  const { data: tiposAtendimento } = useTiposAtendimento();
  const queryClient = useQueryClient();
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [busca, setBusca] = useState("");
  const buscaComAtraso = useDebounce(busca, 400); // evita buscar no servidor a cada letra digitada
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroTipoAtendimento, setFiltroTipoAtendimento] = useState("");
  // Datas em formato "yyyy-mm-dd" (vem direto do <input type="date">).
  const [filtroInicioDe, setFiltroInicioDe] = useState("");
  const [filtroInicioAte, setFiltroInicioAte] = useState("");
  const [filtroTerminoDe, setFiltroTerminoDe] = useState("");
  const [filtroTerminoAte, setFiltroTerminoAte] = useState("");
  const [mostrarMaisFiltros, setMostrarMaisFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [osParaExcluir, setOsParaExcluir] = useState<OrdemServico | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [baixandoPdfId, setBaixandoPdfId] = useState<number | null>(null);

  const modalAberto = searchParams.get("nova") === "1";
  const abrirModal = () => setSearchParams({ nova: "1" });
  const fecharModal = () => setSearchParams({});

  // Filtro/paginação mandados pro back (GET /OrdemServico/paginado) — a
  // filtragem, ordenação e o "só vê OS vinculada" agora são feitos lá,
  // não mais aqui no front.
  const filtro: FiltroOrdensServico = useMemo(
    () => ({
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
      status: filtroStatus ? (Number(filtroStatus) as StatusOs) : undefined,
      idCliente: filtroCliente ? Number(filtroCliente) : undefined,
      idTipoAtendimento: filtroTipoAtendimento ? Number(filtroTipoAtendimento) : undefined,
      dataInicioDe: filtroInicioDe || undefined,
      dataInicioAte: filtroInicioAte || undefined,
      dataFimDe: filtroTerminoDe || undefined,
      dataFimAte: filtroTerminoAte || undefined,
      busca: buscaComAtraso.trim() || undefined,
    }),
    [
      pagina,
      filtroStatus,
      filtroCliente,
      filtroTipoAtendimento,
      filtroInicioDe,
      filtroInicioAte,
      filtroTerminoDe,
      filtroTerminoAte,
      buscaComAtraso,
    ]
  );

  const { data: resultado, isLoading, isFetching } = useOrdensServicoPaginado(filtro);
  const ordens = resultado?.itens ?? [];
  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.totalRegistros / resultado.tamanhoPagina)) : 1;

  const temFiltroAvancadoAtivo =
    !!filtroTipoAtendimento || !!filtroInicioDe || !!filtroInicioAte || !!filtroTerminoDe || !!filtroTerminoAte;
  const temAlgumFiltroAtivo = !!busca || !!filtroStatus || !!filtroCliente || temFiltroAvancadoAtivo;

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("");
    setFiltroCliente("");
    setFiltroTipoAtendimento("");
    setFiltroInicioDe("");
    setFiltroInicioAte("");
    setFiltroTerminoDe("");
    setFiltroTerminoAte("");
    setPagina(1);
  }

  async function confirmarExclusao() {
    if (!osParaExcluir) return;
    setExcluindo(true);
    try {
      await ordemServicoService.remover(osParaExcluir.idOs);
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-servico-paginado"] });
      mostrarToast("Ordem de serviço excluída.", "sucesso");
      setOsParaExcluir(null);
    } catch (erro) {
      mostrarToast(extrairMensagemErro(erro), "erro");
    } finally {
      setExcluindo(false);
    }
  }

  async function aoAbrirPdf(idOs: number) {
    const novaAba = window.open("", "_blank");
    setBaixandoPdfId(idOs);
    try {
      const blob = await ordemServicoService.obterPdf(idOs);
      const url = URL.createObjectURL(blob);
      if (novaAba) novaAba.location.href = url;
      else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (erro) {
      novaAba?.close();
      mostrarToast(extrairMensagemErro(erro), "erro");
    } finally {
      setBaixandoPdfId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-sm text-neutral-500">
            Mostrando as OS às quais você está vinculado como funcionário.
          </p>
        </div>
        <Button onClick={abrirModal}>
          <Plus className="h-4 w-4" /> Nova OS
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Buscar por título ou cliente…"
              className="pl-9"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <Select value={filtroStatus} onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1); }}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_OS_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>{rotulo}</option>
            ))}
          </Select>

           <Select
              value={filtroTipoAtendimento}
              onChange={(e) => { setFiltroTipoAtendimento(e.target.value); setPagina(1); }}
            >
              <option value="">Todos os tipos de atendimento</option>
              {tiposAtendimento?.map((t) => (
                <option key={t.id} value={t.id}>{t.descricao}</option>
              ))}
            </Select>
        {/*
          <Select value={filtroCliente} onChange={(e) => { setFiltroCliente(e.target.value); setPagina(1); }}>
            <option value="">Todos os clientes</option>
            {clientes?.map((c) => (
              <option key={c.idCliente} value={c.idCliente}>{c.nomeFantasia}</option>
            ))}
          </Select>

          
            TODO(back): filtro por Responsável removido daqui — o endpoint
            GET /OrdemServico/paginado ainda não aceita um parâmetro de
            funcionário responsável. Antes disso filtrava em memória no
            front; pra voltar a ter esse filtro, o back precisa ganhar um
            parâmetro tipo IdFuncionarioResponsavel no FiltroOrdemServicoDto.
          */}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMostrarMaisFiltros((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {mostrarMaisFiltros ? "Menos filtros" : "Mais filtros"}
            {temFiltroAvancadoAtivo && (
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
            )}
          </Button>
          {temAlgumFiltroAtivo && (
            <Button type="button" variant="ghost" size="sm" onClick={limparFiltros}>
              <X className="h-4 w-4" /> Limpar filtros
            </Button>
          )}
        </div>

        {mostrarMaisFiltros && (
          <div className="grid grid-cols-1 gap-3 rounded-xl bg-neutral-50 p-3 sm:grid-cols-2 lg:grid-cols-5 dark:bg-neutral-800/50">
           

            <Input
              type="date"
              label="Início de"
              value={filtroInicioDe}
              onChange={(e) => { setFiltroInicioDe(e.target.value); setPagina(1); }}
            />
            <Input
              type="date"
              label="Início até"
              value={filtroInicioAte}
              onChange={(e) => { setFiltroInicioAte(e.target.value); setPagina(1); }}
            />
            <Input
              type="date"
              label="Término de"
              value={filtroTerminoDe}
              onChange={(e) => { setFiltroTerminoDe(e.target.value); setPagina(1); }}
            />
            <Input
              type="date"
              label="Término até"
              value={filtroTerminoAte}
              onChange={(e) => { setFiltroTerminoAte(e.target.value); setPagina(1); }}
            />
          </div>
        )}

        {isLoading ? (
          <SkeletonTabela colunas={6} />
        ) : ordens.length === 0 ? (
          <EmptyState
            titulo="Nenhuma OS encontrada"
            descricao="Ajuste os filtros ou crie uma nova ordem de serviço."
            acao={<Button onClick={abrirModal} size="sm"><Plus className="h-4 w-4" /> Nova OS</Button>}
          />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs uppercase text-neutral-400 dark:border-neutral-800">
                  <th className="py-2.5 pr-2">ID</th>
                  <th className="py-2.5 pr-2">Título</th>
                  <th className="py-2.5 pr-2">Cliente</th>
                  <th className="py-2.5 pr-2">Status</th>
                  <th className="py-2.5 pr-2">Prazo</th>
                  <th className="py-2.5 pr-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((os) => (
                  <tr key={os.idOs} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                    <td className="py-3 pr-2 text-neutral-400">#{os.idOs}</td>
                    <td className="py-3 pr-2 font-medium">
                      <Link to={`/ordens-servico/${os.idOs}`} className="hover:text-brand-600">
                        {os.tituloOs}
                      </Link>
                    </td>
                    <td className="py-3 pr-2 text-neutral-600 dark:text-neutral-300">{os.nomeCliente}</td>
                    <td className="py-3 pr-2"><StatusOsBadge status={os.status} /></td>
                    <td className="py-3 pr-2 text-neutral-600 dark:text-neutral-300">{formatarData(os.prazo)}</td>
                    <td className="py-3 pr-2">
                      <div className="flex justify-end gap-1">
                        {os.possuiPdfAssinado && (
                          <button
                            onClick={() => aoAbrirPdf(os.idOs)}
                            disabled={baixandoPdfId === os.idOs}
                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 disabled:opacity-50 dark:hover:bg-neutral-800"
                            title="Ver PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          to={`/ordens-servico/${os.idOs}`}
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setOsParaExcluir(os)}
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination paginaAtual={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />
      </Card>

      <OrdemServicoFormModal aberto={modalAberto} aoFechar={fecharModal} />

      <ConfirmDialog
        aberto={!!osParaExcluir}
        titulo="Excluir ordem de serviço"
        mensagem={`Tem certeza que deseja excluir a OS "${osParaExcluir?.tituloOs}"? Essa ação não pode ser desfeita.`}
        confirmando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setOsParaExcluir(null)}
      />
    </div>
  );
}
