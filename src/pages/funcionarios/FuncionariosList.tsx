import { useMemo, useState } from "react";
import { Search, Plus, Pencil } from "lucide-react";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTabela } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Pagination } from "@/components/ui/Pagination";
import { FuncionarioFormModal } from "@/components/funcionario/FuncionarioFormModal";
import type { Funcionario } from "@/types/funcionario";

const ITENS_POR_PAGINA = 10;

/**
 * Listagem de funcionários (só ativos, ver TODO em hooks/useFuncionarios.ts),
 * com cadastro e edição via modal.
 */
export default function FuncionariosList() {
  const { data: funcionarios, isLoading } = useFuncionarios({ somenteAtivos: true });
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarioEmEdicao, setFuncionarioEmEdicao] = useState<Funcionario | null>(null);

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return funcionarios ?? [];
    const termo = busca.trim().toLowerCase();
    return (funcionarios ?? []).filter(
      (f) => f.nome.toLowerCase().includes(termo) || f.email.toLowerCase().includes(termo)
    );
  }, [funcionarios, busca]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA));
  const listaPagina = listaFiltrada.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  function abrirNovo() {
    setFuncionarioEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(funcionario: Funcionario) {
    setFuncionarioEmEdicao(funcionario);
    setModalAberto(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Funcionários</h1>
          <p className="text-sm text-neutral-500">Mostrando apenas funcionários ativos.</p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo funcionário
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por nome ou e-mail…"
            className="pl-9"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
          />
        </div>

        {isLoading ? (
          <SkeletonTabela colunas={5} />
        ) : listaPagina.length === 0 ? (
          <EmptyState
            titulo="Nenhum funcionário encontrado"
            descricao="Ajuste a busca ou cadastre um novo funcionário."
            acao={<Button onClick={abrirNovo} size="sm"><Plus className="h-4 w-4" /> Novo funcionário</Button>}
          />
        ) : (
          <div>
            {/* Tablets e celulares: lista de cartões, mais fácil de ler que uma tabela larga */}
            <div className="space-y-2 lg:hidden">
              {listaPagina.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-neutral-100 p-3 dark:border-neutral-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar nome={f.nome} className="h-8 w-8 shrink-0 text-xs" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{f.nome}</p>
                        <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{f.email}</p>
                      </div>
                    </div>
                    <Badge cor={f.ativo ? "verde" : "cinza"}>{f.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-50 pt-2 dark:border-neutral-800">
                    <span className="truncate text-xs text-neutral-400">
                      #{f.id} · {f.userName}
                    </span>
                    <button onClick={() => abrirEdicao(f)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
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
                    <th className="py-2.5 pr-2">Usuário</th>
                    <th className="py-2.5 pr-2">E-mail</th>
                    <th className="py-2.5 pr-2">Status</th>
                    <th className="py-2.5 pr-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaPagina.map((f) => (
                    <tr key={f.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                      <td className="py-3 pr-2 text-neutral-400">#{f.id}</td>
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2 font-medium">
                          <Avatar nome={f.nome} className="h-7 w-7 text-xs" />
                          {f.nome}
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-neutral-600 dark:text-neutral-300">{f.userName}</td>
                      <td className="py-3 pr-2 text-neutral-600 dark:text-neutral-300">{f.email}</td>
                      <td className="py-3 pr-2">
                        <Badge cor={f.ativo ? "verde" : "cinza"}>{f.ativo ? "Ativo" : "Inativo"}</Badge>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex justify-end">
                          <button onClick={() => abrirEdicao(f)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800" title="Editar">
                            <Pencil className="h-4 w-4" />
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

      <FuncionarioFormModal
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        funcionarioEmEdicao={funcionarioEmEdicao}
      />
    </div>
  );
}
