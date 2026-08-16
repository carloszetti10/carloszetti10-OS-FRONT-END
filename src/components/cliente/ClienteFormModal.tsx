import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
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
import { clienteService } from "@/services/clienteService";
import type { Cliente } from "@/types/cliente";

interface ClienteFormModalProps {
  aberto: boolean;
  aoFechar: () => void;
  clienteEmEdicao?: Cliente | null;
}

export function ClienteFormModal({ aberto, aoFechar, clienteEmEdicao }: ClienteFormModalProps) {
  const mostrarToast = useToastStore((s) => s.mostrar);
  const editando = !!clienteEmEdicao;
  const [buscandoCep, setBuscandoCep] = useState(false);

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
        documento: mascararDocumento(clienteEmEdicao.documento),
        email: clienteEmEdicao.email ?? "",
        telefone: clienteEmEdicao.telefone ?? "",
        cep: clienteEmEdicao.cep,
        uf: clienteEmEdicao.uf ?? "",
        cidade: clienteEmEdicao.cidade ?? "",
        bairro: clienteEmEdicao.bairro ?? "",
        rua: clienteEmEdicao.rua ?? "",
        numero: clienteEmEdicao.numero ?? "",
        ativo: clienteEmEdicao.ativo,
      });
    } else if (aberto) {
      reset({ tipoPessoa: TipoPessoa.Fisica, ativo: true, nomeFantasia: "", razaoSocial: "", documento: "", email: "", telefone: "", cep: "", uf: "", cidade: "", bairro: "", rua: "", numero: "" });
    }
  }, [clienteEmEdicao, aberto, reset]);

  const { mutate: criar, isPending: criando, error: erroCriar } = useCriarCliente();
  const { mutate: atualizar, isPending: atualizando, error: erroAtualizar } = useAtualizarCliente(
    clienteEmEdicao?.idCliente ?? 0
  );

  const tipoPessoa = watch("tipoPessoa");
  const cep = watch("cep");
  const erro = erroCriar ?? erroAtualizar;
  const salvando = criando || atualizando;

  async function aoBuscarCep() {
    const cepLimpo = cep?.replace(/\D/g, "") ?? "";
    if (cepLimpo.length !== 8) {
      mostrarToast("Informe um CEP válido (8 dígitos).", "erro");
      return;
    }

    setBuscandoCep(true);
    try {
      const endereco = await clienteService.consultarCep(cepLimpo);
      setValue("uf", endereco.uf ?? "");
      setValue("cidade", endereco.cidade ?? "");
      setValue("bairro", endereco.bairro ?? "");
      setValue("rua", endereco.rua ?? "");
    } catch (e) {
      mostrarToast(extrairMensagemErro(e) || "CEP não encontrado.", "erro");
    } finally {
      setBuscandoCep(false);
    }
  }

  function aoSubmeter(dados: ClienteFormValues) {
    const payload = {
      tipoPessoa: dados.tipoPessoa,
      nomeFantasia: dados.nomeFantasia,
      razaoSocial: dados.razaoSocial || undefined,
      documento: dados.documento,
      email: dados.email || undefined,
      telefone: dados.telefone || undefined,
      cep: dados.cep,
      uf: dados.uf || undefined,
      cidade: dados.cidade || undefined,
      bairro: dados.bairro || undefined,
      rua: dados.rua || undefined,
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
          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="CEP"
                  erro={errors.cep?.message}
                  {...register("cep", { onChange: (e) => setValue("cep", mascararCep(e.target.value)) })}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                carregando={buscandoCep}
                onClick={aoBuscarCep}
                aria-label="Pesquisar CEP"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input label="Número" erro={errors.numero?.message} {...register("numero")} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Rua" erro={errors.rua?.message} {...register("rua")} />
          <Input label="Bairro" erro={errors.bairro?.message} {...register("bairro")} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Cidade" erro={errors.cidade?.message} {...register("cidade")} />
          <Input label="UF" maxLength={2} erro={errors.uf?.message} {...register("uf")} />
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
