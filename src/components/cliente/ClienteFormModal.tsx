import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { clienteSchema, type ClienteFormValues } from "@/schemas/clienteSchema";
import { useCriarCliente, useAtualizarCliente } from "@/hooks/useClientes";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import { TipoPessoa, TIPO_PESSOA_LABEL } from "@/types/enums";
import { mascararDocumento, mascararCep, mascararTelefone } from "@/utils/formatters";
import type { Cliente } from "@/types/cliente";

interface ClienteFormModalProps {
  aberto: boolean;
  aoFechar: () => void;
  clienteEmEdicao?: Cliente | null;
}

export function ClienteFormModal({ aberto, aoFechar, clienteEmEdicao }: ClienteFormModalProps) {
  const mostrarToast = useToastStore((s) => s.mostrar);
  const editando = !!clienteEmEdicao;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { tipoPessoa: TipoPessoa.Fisica, ativo: true },
  });

  useEffect(() => {
    if (clienteEmEdicao) {
      reset({
        tipoPessoa: clienteEmEdicao.tipoPessoa,
        nomeFantasia: clienteEmEdicao.nomeFantasia ?? "",
        razaoSocial: clienteEmEdicao.razaoSocial ?? "",
        documento: clienteEmEdicao.documento,
        email: clienteEmEdicao.email ?? "",
        telefone: clienteEmEdicao.telefone ?? "",
        cep: clienteEmEdicao.cep,
        numero: clienteEmEdicao.numero ?? "",
        ativo: clienteEmEdicao.ativo,
      });
    } else if (aberto) {
      reset({ tipoPessoa: TipoPessoa.Fisica, ativo: true, nomeFantasia: "", razaoSocial: "", documento: "", email: "", telefone: "", cep: "", numero: "" });
    }
  }, [clienteEmEdicao, aberto, reset]);

  const { mutate: criar, isPending: criando, error: erroCriar } = useCriarCliente();
  const { mutate: atualizar, isPending: atualizando, error: erroAtualizar } = useAtualizarCliente(
    clienteEmEdicao?.idCliente ?? 0
  );

  const tipoPessoa = watch("tipoPessoa");
  const erro = erroCriar ?? erroAtualizar;
  const salvando = criando || atualizando;

  function aoSubmeter(dados: ClienteFormValues) {
    const payload = {
      tipoPessoa: dados.tipoPessoa,
      nomeFantasia: dados.nomeFantasia,
      razaoSocial: dados.razaoSocial || undefined,
      documento: dados.documento,
      email: dados.email || undefined,
      telefone: dados.telefone || undefined,
      cep: dados.cep,
      numero: dados.numero || undefined,
    };

    const aoTerSucesso = () => {
      mostrarToast(editando ? "Cliente atualizado." : "Cliente cadastrado.", "sucesso");
      aoFechar();
    };

    if (editando) {
      atualizar({ ...payload, ativo: dados.ativo }, { onSuccess: aoTerSucesso });
    } else {
      criar(payload, { onSuccess: aoTerSucesso });
    }
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={editando ? "Editar cliente" : "Novo cliente"}>
      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
        <Select label="Tipo de pessoa" {...register("tipoPessoa", { valueAsNumber: true })}>
          {Object.entries(TIPO_PESSOA_LABEL).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>{rotulo}</option>
          ))}
        </Select>

        <Input label="Nome / Nome fantasia" erro={errors.nomeFantasia?.message} {...register("nomeFantasia")} />

        {tipoPessoa === TipoPessoa.Juridica && (
          <Input label="Razão social" erro={errors.razaoSocial?.message} {...register("razaoSocial")} />
        )}

        <Input
          label={tipoPessoa === TipoPessoa.Juridica ? "CNPJ" : "CPF"}
          erro={errors.documento?.message}
          {...register("documento", {
            onChange: (e) => setValue("documento", mascararDocumento(e.target.value)),
          })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="E-mail" type="email" erro={errors.email?.message} {...register("email")} />
          <Input
            label="Telefone"
            erro={errors.telefone?.message}
            {...register("telefone", {
              onChange: (e) => setValue("telefone", mascararTelefone(e.target.value)),
            })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="CEP"
            erro={errors.cep?.message}
            {...register("cep", { onChange: (e) => setValue("cep", mascararCep(e.target.value)) })}
          />
          <Input label="Número" erro={errors.numero?.message} {...register("numero")} />
        </div>

        {editando && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("ativo")} /> Cliente ativo
          </label>
        )}

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
            {extrairMensagemErro(erro)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" carregando={salvando}>{editando ? "Salvar alterações" : "Cadastrar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
