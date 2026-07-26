import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useTiposAtendimento, useRemoverTipoAtendimento } from "@/hooks/useTiposAtendimento";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { SkeletonTabela } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { TipoAtendimentoFormModal } from "@/components/tipo-atendimento/TipoAtendimentoFormModal";
import type { TipoAtendimento } from "@/types/tipoAtendimento";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

const ITENS_POR_PAGINA = 10;

export default function TiposAtendimentoList() {
  const { data: tipos, isLoading } = useTiposAtendimento();
  const { mutateAsync: removerTipo } = useRemoverTipoAtendimento();
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoEmEdicao, setTipoEmEdicao] = useState<TipoAtendimento | null>(null);
  const [tipoParaExcluir, setTipoParaExcluir] = useState<TipoAtendimento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return tipos ?? [];
    const termo = busca.trim().toLowerCase();
    return (tipos ?? []).filter((t) => t.descricao.toLowerCase().includes(termo));
  }, [tipos, busca]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA));
  const listaPagina = listaFiltrada.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  function abrirNovo() {
    setTipoEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(tipo: TipoAtendimento) {
    setTipoEmEdicao(tipo);
    setModalAberto(true);
  }

  async function confirmarExclusao() {
    if (!tipoParaExcluir) return;
    setExcluindo(true);
    try {
      await removerTipo(tipoParaExcluir.id);
      mostrarToast("Tipo de atendimento excluído.", "sucesso");
      setTipoParaExcluir(null);
    } catch (erro) {
      mostrarToast(extrairMensagemErro(erro), "erro");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Tipos de Atendimento</h1>
          <p className="text-sm text-neutral-500">Categorias usadas ao criar uma Ordem de Serviço.</p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo tipo
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por descrição…"
            className="pl-9"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
          />
        </div>

        {isLoading ? (
          <SkeletonTabela colunas={2} />
        ) : listaPagina.length === 0 ? (
          <EmptyState
            titulo="Nenhum tipo de atendimento encontrado"
            descricao="Ajuste a busca ou cadastre um novo tipo."
            acao={<Button onClick={abrirNovo} size="sm"><Plus className="h-4 w-4" /> Novo tipo</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs uppercase text-neutral-400 dark:border-neutral-800">
                  <th className="py-2.5 pr-2">Descrição</th>
                  <th className="py-2.5 pr-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaPagina.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                    <td className="py-3 pr-2 font-medium">{t.descricao}</td>
                    <td className="py-3 pr-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => abrirEdicao(t)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setTipoParaExcluir(t)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" title="Excluir">
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

      <TipoAtendimentoFormModal aberto={modalAberto} aoFechar={() => setModalAberto(false)} tipoEmEdicao={tipoEmEdicao} />

      <ConfirmDialog
        aberto={!!tipoParaExcluir}
        titulo="Excluir tipo de atendimento"
        mensagem={`Tem certeza que deseja excluir "${tipoParaExcluir?.descricao}"?`}
        confirmando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setTipoParaExcluir(null)}
      />
    </div>
  );
}
