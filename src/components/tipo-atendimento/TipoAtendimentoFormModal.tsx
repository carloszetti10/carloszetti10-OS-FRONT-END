import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCriarTipoAtendimento, useAtualizarTipoAtendimento } from "@/hooks/useTiposAtendimento";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import type { TipoAtendimento } from "@/types/tipoAtendimento";

const schema = z.object({
  descricao: z.string().min(1, "A descrição é obrigatória."),
});
type FormValues = z.infer<typeof schema>;

interface TipoAtendimentoFormModalProps {
  aberto: boolean;
  aoFechar: () => void;
  tipoEmEdicao?: TipoAtendimento | null;
}

export function TipoAtendimentoFormModal({ aberto, aoFechar, tipoEmEdicao }: TipoAtendimentoFormModalProps) {
  const editando = !!tipoEmEdicao;
  const mostrarToast = useToastStore((s) => s.mostrar);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (aberto) reset({ descricao: tipoEmEdicao?.descricao ?? "" });
  }, [aberto, tipoEmEdicao, reset]);

  const { mutate: criar, isPending: criando, error: erroCriar } = useCriarTipoAtendimento();
  const { mutate: atualizar, isPending: atualizando, error: erroAtualizar } = useAtualizarTipoAtendimento(
    tipoEmEdicao?.id ?? 0
  );

  const erro = erroCriar ?? erroAtualizar;
  const salvando = criando || atualizando;

  function aoSubmeter(dados: FormValues) {
    const aoTerSucesso = () => {
      mostrarToast(editando ? "Tipo de atendimento atualizado." : "Tipo de atendimento cadastrado.", "sucesso");
      aoFechar();
    };
    if (editando) atualizar(dados, { onSuccess: aoTerSucesso });
    else criar(dados, { onSuccess: aoTerSucesso });
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={editando ? "Editar tipo de atendimento" : "Novo tipo de atendimento"} largura="sm">
      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
        <Input label="Descrição" autoFocus erro={errors.descricao?.message} {...register("descricao")} />

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
