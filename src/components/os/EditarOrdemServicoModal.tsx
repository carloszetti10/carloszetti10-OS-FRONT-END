import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useAtualizarOrdemServico } from "@/hooks/useOrdensServico";
import { editarOrdemServicoSchema, type EditarOrdemServicoFormValues } from "@/schemas/ordemServicoSchema";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import { paraIso, paraInputDatetime } from "@/utils/formatters";
import type { OrdemServico } from "@/types/ordemServico";

interface EditarOrdemServicoModalProps {
  aberto: boolean;
  aoFechar: () => void;
  ordemServico: OrdemServico;
}

/**
 * Edição da OS já criada: título, descrição e prazo.
 * Cliente, tipo de atendimento e status ficam de fora de propósito — status
 * agora é controlado pelos botões Iniciar/Cancelar, não por aqui. A data de
 * início também não entra aqui: ela é definida automaticamente pelo back
 * quando o funcionário efetivamente inicia a OS.
 */
export function EditarOrdemServicoModal({ aberto, aoFechar, ordemServico }: EditarOrdemServicoModalProps) {
  const mostrarToast = useToastStore((s) => s.mostrar);
  const { mutate: atualizar, isPending, error } = useAtualizarOrdemServico(ordemServico.idOs);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditarOrdemServicoFormValues>({ resolver: zodResolver(editarOrdemServicoSchema) });

  useEffect(() => {
    if (!aberto) return;
    reset({
      tituloOs: ordemServico.tituloOs,
      descricao: ordemServico.descricao ?? "",
      prazo: paraInputDatetime(ordemServico.prazo),
      idTarefa: ordemServico.idTarefa != null ? String(ordemServico.idTarefa) : "",
    });
  }, [aberto, ordemServico, reset]);

  function aoSubmeter(dados: EditarOrdemServicoFormValues) {
    atualizar(
      {
        tituloOs: dados.tituloOs,
        descricao: dados.descricao || "",
        idTipoAtendimento: ordemServico.idTipoAtendimento,
        idCliente: ordemServico.idCliente,
        status: ordemServico.status,
        dataHoraInicio: ordemServico.dataHoraInicio ?? null,
        dataHoraFim: ordemServico.dataHoraFim ?? null,
        prazo: paraIso(dados.prazo) ?? null,
        observacao: ordemServico.observacao ?? undefined,
        idTarefa: dados.idTarefa ? Number(dados.idTarefa) : null,
      },
      {
        onSuccess: () => {
          mostrarToast("Ordem de serviço atualizada.", "sucesso");
          aoFechar();
        },
      }
    );
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Editar Ordem de Serviço">
      <form onSubmit={handleSubmit(aoSubmeter)} className="space-y-4">
        <Input label="Título" erro={errors.tituloOs?.message} {...register("tituloOs")} />
        <Textarea label="Descrição" erro={errors.descricao?.message} {...register("descricao")} />

        <Input label="Prazo" type="datetime-local" erro={errors.prazo?.message} {...register("prazo")} />

        <Input
          label="ID da Tarefa (Bitrix)"
          type="number"
          placeholder="Opcional"
          erro={errors.idTarefa?.message}
          {...register("idTarefa")}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
            {extrairMensagemErro(error)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" carregando={isPending}>Salvar alterações</Button>
        </div>
      </form>
    </Modal>
  );
}
