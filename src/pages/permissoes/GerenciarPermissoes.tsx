import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useCatalogoPermissoes, usePermissoesDoUsuario, useAtualizarPermissoesUsuario } from "@/hooks/usePermissao";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import type { Permissao } from "@/types/permissao";

/**
 * Tela de gerenciamento de permissões por usuário. O catálogo de permissões
 * (checkboxes) vem direto do banco via GET /Permissao — qualquer permissão
 * nova cadastrada lá aparece aqui sozinha, sem precisar mexer no front.
 */
export default function GerenciarPermissoes() {
  const { data: funcionarios } = useFuncionarios({ somenteAtivos: true });
  const { data: catalogo, isLoading: carregandoCatalogo } = useCatalogoPermissoes();

  const [idFuncionarioSelecionado, setIdFuncionarioSelecionado] = useState<number | null>(null);
  const funcionarioSelecionado = funcionarios?.find((f) => f.id === idFuncionarioSelecionado);
  const usuarioIdSelecionado = funcionarioSelecionado?.usuarioId;

  const { data: permissoesDoUsuario, isLoading: carregandoPermissoesUsuario } =
    usePermissoesDoUsuario(usuarioIdSelecionado);
  const { mutate: salvar, isPending: salvando, error: erroSalvar } =
    useAtualizarPermissoesUsuario(usuarioIdSelecionado ?? "");
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [idsMarcados, setIdsMarcados] = useState<Set<number>>(new Set());

  // Toda vez que troca de funcionário (ou os dados dele chegam), reseta os
  // checkboxes pro estado real salvo no banco.
  useEffect(() => {
    if (permissoesDoUsuario) {
      setIdsMarcados(new Set(permissoesDoUsuario.map((p) => p.id)));
    } else {
      setIdsMarcados(new Set());
    }
  }, [permissoesDoUsuario, usuarioIdSelecionado]);

  const modulos = useMemo(() => {
    const grupos = new Map<string, Permissao[]>();
    for (const permissao of catalogo ?? []) {
      const lista = grupos.get(permissao.modulo) ?? [];
      lista.push(permissao);
      grupos.set(permissao.modulo, lista);
    }
    return Array.from(grupos.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [catalogo]);

  function alternar(id: number) {
    setIdsMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function alternarModuloInteiro(permissoesDoModulo: Permissao[], marcarTudo: boolean) {
    setIdsMarcados((atual) => {
      const novo = new Set(atual);
      for (const p of permissoesDoModulo) {
        if (marcarTudo) novo.add(p.id);
        else novo.delete(p.id);
      }
      return novo;
    });
  }

  function aoSalvar() {
    if (!usuarioIdSelecionado) return;
    salvar(Array.from(idsMarcados), {
      onSuccess: () => mostrarToast("Permissões atualizadas.", "sucesso"),
      onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Permissões</h1>
        <p className="text-sm text-neutral-500">Escolha um funcionário pra ver e editar as permissões dele.</p>
      </div>

      <Card>
        <SearchSelect
          label="Funcionário"
          placeholder="Buscar funcionário…"
          opcoes={(funcionarios ?? []).map((f) => ({ value: f.id, label: f.nome, sublabel: f.email }))}
          valor={idFuncionarioSelecionado}
          aoSelecionar={setIdFuncionarioSelecionado}
          vazio="Nenhum funcionário ativo encontrado."
        />
      </Card>

      {!idFuncionarioSelecionado ? (
        <EmptyState
          icone={<ShieldCheck className="h-6 w-6" />}
          titulo="Selecione um funcionário"
          descricao="As permissões dele aparecem aqui, organizadas por módulo."
        />
      ) : carregandoCatalogo || carregandoPermissoesUsuario ? (
        <Card className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </Card>
      ) : modulos.length === 0 ? (
        <EmptyState titulo="Nenhuma permissão cadastrada" descricao="Cadastre permissões na tabela do banco pra elas aparecerem aqui." />
      ) : (
        <>
          <div className="space-y-4">
            {modulos.map(([modulo, permissoesDoModulo]) => {
              const todasMarcadas = permissoesDoModulo.every((p) => idsMarcados.has(p.id));
              return (
                <Card key={modulo}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display font-semibold">{modulo}</h2>
                    <button
                      type="button"
                      onClick={() => alternarModuloInteiro(permissoesDoModulo, !todasMarcadas)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      {todasMarcadas ? "Desmarcar tudo" : "Marcar tudo"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {permissoesDoModulo.map((permissao) => (
                      <label
                        key={permissao.id}
                        className="flex items-start gap-2.5 rounded-lg p-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={idsMarcados.has(permissao.id)}
                          onChange={() => alternar(permissao.id)}
                        />
                        <span className="text-neutral-700 dark:text-neutral-300">{permissao.descricao}</span>
                      </label>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {erroSalvar && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
              {extrairMensagemErro(erroSalvar)}
            </p>
          )}

          <div className="flex justify-end">
            <Button carregando={salvando} onClick={aoSalvar}>Salvar permissões</Button>
          </div>
        </>
      )}
    </div>
  );
}
