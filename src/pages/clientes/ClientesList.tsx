import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useClientesPaginado, useRemoverCliente } from "@/hooks/useClientes";
import { useDebounce } from "@/hooks/useDebounce";
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
import type { Cliente, FiltroClientes } from "@/types/cliente";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import { mascararDocumento } from "@/utils/formatters";

const TAMANHO_PAGINA = 10;

export default function ClientesList() {
  const { mutateAsync: removerCliente } = useRemoverCliente();
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [busca, setBusca] = useState("");
  const buscaComAtraso = useDebounce(busca, 400); // não busca no servidor a cada letra digitada
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Filtro/paginação mandados pro back (GET /Clientes/paginado) — a busca
  // por nome/razão social/documento agora acontece lá, não mais em memória
  // aqui no front (ver ClienteRepository.ListarPaginado no back).
  const filtro: FiltroClientes = useMemo(
    () => ({
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
      busca: buscaComAtraso.trim() || undefined,
    }),
    [pagina, buscaComAtraso]
  );

  const { data: resultado, isLoading, isFetching } = useClientesPaginado(filtro);
  const clientes = resultado?.itens ?? [];
  // NOTA: o back não devolve o tamanhoPagina certo na resposta (vem sempre 0
  // — bug lá, ver comentário em types/cliente.ts), por isso o total de
  // páginas é calculado com o TAMANHO_PAGINA que a GENTE mandou, não com o
  // que voltou na resposta.
  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.totalRegistros / TAMANHO_PAGINA)) : 1;

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
          <p className="text-sm text-neutral-500">
            {/* NOTA: /Clientes/paginado tem um bug no back (Where de "só
                ativos" não é aplicado — ver ClienteRepository) e devolve
                ativos e inativos juntos. Por isso a mensagem mudou e os
                inativos aparecem com o badge "Inativo" abaixo. */}
            Todos os clientes cadastrados.
          </p>
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
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
          />
        </div>

        {isLoading ? (
          <SkeletonTabela colunas={5} />
        ) : clientes.length === 0 ? (
          <EmptyState
            titulo="Nenhum cliente encontrado"
            descricao="Ajuste a busca ou cadastre um novo cliente."
            acao={<Button onClick={abrirNovo} size="sm"><Plus className="h-4 w-4" /> Novo cliente</Button>}
          />
        ) : (
          <div className={`transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            {/* Tablets e celulares: lista de cartões, mais fácil de ler que uma tabela larga */}
            <div className="space-y-2 lg:hidden">
              {clientes.map((c) => (
                <div
                  key={c.idCliente}
                  className="rounded-xl border border-neutral-100 p-3 dark:border-neutral-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.nomeFantasia}</p>
                      <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {mascararDocumento(c.documento)}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Badge cor="cinza">{TIPO_PESSOA_LABEL[c.tipoPessoa]}</Badge>
                      {!c.ativo && <Badge cor="vermelho">Inativo</Badge>}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-50 pt-2 dark:border-neutral-800">
                    <span className="truncate text-xs text-neutral-400">
                      #{c.idCliente} · {c.telefone || c.email || "—"}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => abrirEdicao(c)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setClienteParaExcluir(c)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Telas grandes: tabela normal */}
            <div className="hidden overflow-x-auto lg:block">
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
                  {clientes.map((c) => (
                    <tr key={c.idCliente} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                      <td className="py-3 pr-2 text-neutral-400">#{c.idCliente}</td>
                      <td className="py-3 pr-2 font-medium">{c.nomeFantasia}</td>
                      <td className="py-3 pr-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge cor="cinza">{TIPO_PESSOA_LABEL[c.tipoPessoa]}</Badge>
                          {!c.ativo && <Badge cor="vermelho">Inativo</Badge>}
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-neutral-600 dark:text-neutral-300">{mascararDocumento(c.documento)}</td>
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
