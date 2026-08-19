import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchSelect, type OpcaoSearchSelect } from "@/components/ui/SearchSelect";
import { Button } from "@/components/ui/Button";
import { FuncionarioPicker } from "./FuncionarioPicker";
import { ordemServicoSchema, type OrdemServicoFormValues } from "@/schemas/ordemServicoSchema";
import { useTiposAtendimento } from "@/hooks/useTiposAtendimento";
import { useClienteBusca } from "@/hooks/useClientes";
import { useCriarOrdemServico } from "@/hooks/useOrdensServico";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import { paraIso, mascararDocumento } from "@/utils/formatters";

interface OrdemServicoFormModalProps {
  aberto: boolean;
  aoFechar: () => void;
}

/**
 * Modal de criação de OS — sempre centralizado, nunca em página separada.
 * Cliente e Tipo de Atendimento usam busca (SearchSelect) em vez de <select>
 * gigante — importante quando há muitos cadastros. Funcionários usam o
 * FuncionarioPicker: pesquisa e adiciona, com só um responsável possível.
 */
export function OrdemServicoFormModal({ aberto, aoFechar }: OrdemServicoFormModalProps) {
  const { data: tipos } = useTiposAtendimento();
  const mostrarToast = useToastStore((s) => s.mostrar);

  // Busca de cliente no servidor (GET /Clientes/paginado?busca=), não mais a
  // lista inteira de clientes carregada e filtrada em memória — evita puxar
  // todo o cadastro pro front e nunca bate no banco a cada tecla (debounce
  // dentro de useClienteBusca).
  const [buscaCliente, setBuscaCliente] = useState("");
  const { data: clientesEncontrados, isFetching: buscandoClientes } = useClienteBusca(buscaCliente);
  const [clienteSelecionado, setClienteSelecionado] = useState<OpcaoSearchSelect | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<OrdemServicoFormValues>({
    resolver: zodResolver(ordemServicoSchema),
    defaultValues: { funcionarios: [] },
  });

  const { mutate: criar, isPending, error } = useCriarOrdemServico();

  function aoSubmeter(dados: OrdemServicoFormValues) {
    criar(
      {
        tituloOs: dados.tituloOs,
        descricao: dados.descricao || "",
        idTipoAtendimento: dados.idTipoAtendimento,
        idCliente: dados.idCliente,
        prazo: paraIso(dados.prazo),
        observacao: dados.observacao || undefined,
        funcionarios: dados.funcionarios,
        idTarefa: dados.idTarefa ? Number(dados.idTarefa) : undefined,
      },
      {
        onSuccess: () => {
          mostrarToast("Ordem de serviço criada com sucesso.", "sucesso");
          reset({ funcionarios: [] });
          setBuscaCliente("");
          setClienteSelecionado(null);
          aoFechar();
        },
      }
    );
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Nova Ordem de Serviço" largura="lg">
      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-6">
        <Input label="Título" erro={errors.tituloOs?.message} {...register("tituloOs")} />
        <Textarea label="Descrição" erro={errors.descricao?.message} {...register("descricao")} />

        {/* Cliente — largura total: é o campo de maior peso pra identificar
            a OS, e o SearchSelect exibe razão social/nome fantasia junto com
            o documento, então precisa de espaço pra não truncar. Busca no
            servidor (GET /Clientes/paginado?busca=), não mais a lista
            inteira de clientes carregada e filtrada em memória. */}
        <Controller
          control={control}
          name="idCliente"
          render={({ field }) => (
            <SearchSelect
              label="Cliente"
              placeholder="Buscar cliente…"
              opcoes={(clientesEncontrados ?? []).map((c) => ({
                value: c.idCliente,
                label: c.nomeFantasia ?? c.razaoSocial ?? `Cliente #${c.idCliente}`,
                sublabel: mascararDocumento(c.documento),
              }))}
              valor={field.value}
              aoSelecionar={(v, opcao) => {
                field.onChange(v);
                setClienteSelecionado(opcao ?? null);
              }}
              termoBusca={buscaCliente}
              aoMudarTermoBusca={setBuscaCliente}
              carregando={buscandoClientes}
              rotuloSelecionado={clienteSelecionado?.label}
              erro={errors.idCliente?.message}
              vazio={
                buscaCliente.trim().length < 2
                  ? "Digite ao menos 2 letras para buscar."
                  : "Nenhum cliente encontrado."
              }
            />
          )}
        />

        {/* Tipo de atendimento e Prazo lado a lado: ambos são inputs de
            altura fixa, então ganham em compacidade sem perder legibilidade.
            O tipo ocupa o espaço flexível e o prazo fica compacto, alinhado
            à direita. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="sm:flex-1">
            <Controller
              control={control}
              name="idTipoAtendimento"
              render={({ field }) => (
                <SearchSelect
                  label="Tipo de atendimento"
                  placeholder="Selecione o tipo…"
                  opcoes={(tipos ?? []).map((t) => ({ value: t.id, label: t.descricao }))}
                  valor={field.value}
                  aoSelecionar={(v) => field.onChange(v)}
                  erro={errors.idTipoAtendimento?.message}
                  vazio="Nenhum tipo de atendimento cadastrado."
                />
              )}
            />
          </div>

          <div className="sm:w-56 sm:shrink-0">
            <Input label="Prazo" type="datetime-local" erro={errors.prazo?.message} {...register("prazo")} />
          </div>
        </div>

        {/* ID da tarefa vinculada no Bitrix — opcional, o funcionário cola o
            ID depois de criar a tarefa lá. */}
        <div className="sm:w-56">
          <Input
            label="ID da Tarefa (Bitrix)"
            type="number"
            placeholder="Opcional"
            erro={errors.idTarefa?.message}
            {...register("idTarefa")}
          />
        </div>

        {/* Equipe — picker com chips + busca que cresce verticalmente,
            então fica melhor em largura total, sem dividir coluna. */}
        <Controller
          control={control}
          name="funcionarios"
          render={({ field }) => (
            <FuncionarioPicker
              valor={field.value}
              aoMudar={field.onChange}
              erro={errors.funcionarios?.message}
            />
          )}
        />

        <Textarea label="Observação" erro={errors.observacao?.message} {...register("observacao")} />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
            {extrairMensagemErro(error)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" carregando={isPending}>
            Criar OS
          </Button>
        </div>
      </form>
    </Modal>
  );
}
