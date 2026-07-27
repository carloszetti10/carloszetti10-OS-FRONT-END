import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useClientes, useRemoverCliente } from "@/hooks/useClientes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTabela } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { ClienteFormModal } from "@/components/cliente/ClienteFormModal";
import { TIPO_PESSOA_LABEL } from "@/types/enums";
import type { Cliente } from "@/types/cliente";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

const ITENS_POR_PAGINA = 10;

export default function ClientesList() {
  // TODO(back): mover esse filtro "só ativos" pro back quando o endpoint suportar.
  const { data: clientes, isLoading } = useClientes({ somenteAtivos: true });
  const { mutateAsync: removerCliente } = useRemoverCliente();
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return clientes ?? [];
    const termo = busca.trim().toLowerCase();
    return (clientes ?? []).filter(
      (c) => c.nomeFantasia?.toLowerCase().includes(termo) || c.documento.includes(termo)
    );
  }, [clientes, busca]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA));
  const listaPagina = listaFiltrada.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  function abrirNovo() {
    setClienteEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEmEdicao(cliente);
    setModalAberto(true);
  }

  async function confirmarExclusao() {
    if (!clienteParaExcluir) return;
    setExcluindo(true);
    try {
      await removerCliente(clienteParaExcluir.idCliente);
      mostrarToast("Cliente excluído.", "sucesso");
      setClienteParaExcluir(null);
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
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-neutral-500">Mostrando apenas clientes ativos.</p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por nome ou documento…"
            className="pl-9"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
          />
        </div>

        {isLoading ? (
          <SkeletonTabela colunas={5} />
        ) : listaPagina.length === 0 ? (
          <EmptyState
            titulo="Nenhum cliente encontrado"
            descricao="Ajuste a busca ou cadastre um novo cliente."
            acao={<Button onClick={abrirNovo} size="sm"><Plus className="h-4 w-4" /> Novo cliente</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs uppercase text-neutral-400 dark:border-neutral-800">
                  <th className="py-2.5 pr-2">ID</th>
                  <th className="py-2.5 pr-2">Nome</th>
                  <th className="py-2.5 pr-2">Tipo</th>
                  <th className="py-2.5 pr-2">Documento</th>
                  <th className="py-2.5 pr-2">Contato</th>
                  <th className="py-2.5 pr-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaPagina.map((c) => (
                  <tr key={c.idCliente} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                    <td className="py-3 pr-2 text-neutral-400">#{c.idCliente}</td>
                    <td className="py-3 pr-2 font-medium">{c.nomeFantasia}</td>
                    <td className="py-3 pr-2"><Badge cor="cinza">{TIPO_PESSOA_LABEL[c.tipoPessoa]}</Badge></td>
                    <td className="py-3 pr-2 text-neutral-600 dark:text-neutral-300">{c.documento}</td>
                    <td className="py-3 pr-2 text-neutral-600 dark:text-neutral-300">{c.telefone || c.email || "—"}</td>
                    <td className="py-3 pr-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => abrirEdicao(c)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setClienteParaExcluir(c)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" title="Excluir">
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

      <ClienteFormModal aberto={modalAberto} aoFechar={() => setModalAberto(false)} clienteEmEdicao={clienteEmEdicao} />

      <ConfirmDialog
        aberto={!!clienteParaExcluir}
        titulo="Excluir cliente"
        mensagem={`Tem certeza que deseja excluir "${clienteParaExcluir?.nomeFantasia}"?`}
        confirmando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setClienteParaExcluir(null)}
      />
    </div>
  );
}
