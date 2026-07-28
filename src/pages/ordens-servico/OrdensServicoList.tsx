import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Eye, Trash2, ArrowUpDown, FileDown } from "lucide-react";
import { useOrdensServico } from "@/hooks/useOrdensServico";
import { useClientes } from "@/hooks/useClientes";
import { useFuncionarios } from "@/hooks/useFuncionarios";
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
import { StatusOs, STATUS_OS_LABEL } from "@/types/enums";
import type { OrdemServico } from "@/types/ordemServico";
import { formatarData } from "@/utils/formatters";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

type CampoOrdenacao = "idOs" | "tituloOs" | "nomeCliente" | "status" | "prazo";
const ITENS_POR_PAGINA = 10;

export default function OrdensServicoList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: ordens, isLoading } = useOrdensServico();
  const { data: clientes } = useClientes({ somenteAtivos: true });
  const { data: funcionarios } = useFuncionarios({ somenteAtivos: true });
  const queryClient = useQueryClient();
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<CampoOrdenacao>("prazo");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [osParaExcluir, setOsParaExcluir] = useState<OrdemServico | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [baixandoPdfId, setBaixandoPdfId] = useState<number | null>(null);

  const modalAberto = searchParams.get("nova") === "1";
  const abrirModal = () => setSearchParams({ nova: "1" });
  const fecharModal = () => setSearchParams({});

  const listaFiltrada = useMemo(() => {
    let lista = ordens ?? [];

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(
        (o) => o.tituloOs.toLowerCase().includes(termo) || o.nomeCliente.toLowerCase().includes(termo)
      );
    }
    if (filtroStatus) lista = lista.filter((o) => o.status === Number(filtroStatus));
    if (filtroCliente) lista = lista.filter((o) => o.idCliente === Number(filtroCliente));
    if (filtroResponsavel) {
      lista = lista.filter((o) =>
        o.funcionarios.some((f) => f.responsavel && f.idFuncionario === Number(filtroResponsavel))
      );
    }

    lista = [...lista].sort((a, b) => {
      const va = a[ordenarPor] ?? "";
      const vb = b[ordenarPor] ?? "";
      const cmp = String(va).localeCompare(String(vb), "pt-BR", { numeric: true });
      return ordemAsc ? cmp : -cmp;
    });

    return lista;
  }, [ordens, busca, filtroStatus, filtroCliente, filtroResponsavel, ordenarPor, ordemAsc]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA));
  const listaPagina = listaFiltrada.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  function alternarOrdenacao(campo: CampoOrdenacao) {
    if (ordenarPor === campo) setOrdemAsc((v) => !v);
    else {
      setOrdenarPor(campo);
      setOrdemAsc(true);
    }
  }

  async function confirmarExclusao() {
    if (!osParaExcluir) return;
    setExcluindo(true);
    try {
      await ordemServicoService.remover(osParaExcluir.idOs);
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
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

          <Select value={filtroCliente} onChange={(e) => { setFiltroCliente(e.target.value); setPagina(1); }}>
            <option value="">Todos os clientes</option>
            {clientes?.map((c) => (
              <option key={c.idCliente} value={c.idCliente}>{c.nomeFantasia}</option>
            ))}
          </Select>

          <Select value={filtroResponsavel} onChange={(e) => { setFiltroResponsavel(e.target.value); setPagina(1); }}>
            <option value="">Todos os responsáveis</option>
            {funcionarios?.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <SkeletonTabela colunas={6} />
        ) : listaPagina.length === 0 ? (
          <EmptyState
            titulo="Nenhuma OS encontrada"
            descricao="Ajuste os filtros ou crie uma nova ordem de serviço."
            acao={<Button onClick={abrirModal} size="sm"><Plus className="h-4 w-4" /> Nova OS</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs uppercase text-neutral-400 dark:border-neutral-800">
                  <CabecalhoOrdenavel label="ID" campo="idOs" atual={ordenarPor} asc={ordemAsc} aoClicar={alternarOrdenacao} />
                  <CabecalhoOrdenavel label="Título" campo="tituloOs" atual={ordenarPor} asc={ordemAsc} aoClicar={alternarOrdenacao} />
                  <CabecalhoOrdenavel label="Cliente" campo="nomeCliente" atual={ordenarPor} asc={ordemAsc} aoClicar={alternarOrdenacao} />
                  <CabecalhoOrdenavel label="Status" campo="status" atual={ordenarPor} asc={ordemAsc} aoClicar={alternarOrdenacao} />
                  <CabecalhoOrdenavel label="Prazo" campo="prazo" atual={ordenarPor} asc={ordemAsc} aoClicar={alternarOrdenacao} />
                  <th className="py-2.5 pr-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaPagina.map((os) => (
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

function CabecalhoOrdenavel({
  label,
  campo,
  atual,
  asc,
  aoClicar,
}: {
  label: string;
  campo: CampoOrdenacao;
  atual: CampoOrdenacao;
  asc: boolean;
  aoClicar: (campo: CampoOrdenacao) => void;
}) {
  return (
    <th className="py-2.5 pr-2">
      <button onClick={() => aoClicar(campo)} className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-200">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${atual === campo ? "text-brand-600" : ""} ${atual === campo && !asc ? "rotate-180" : ""}`} />
      </button>
    </th>
  );
}
