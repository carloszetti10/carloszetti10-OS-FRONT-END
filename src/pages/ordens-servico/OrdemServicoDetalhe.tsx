import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock, FileText, User as UserIcon, Pencil, FileSignature, FileDown, PlayCircle, Ban, Camera } from "lucide-react";
import {
  useOrdemServico,
  useAtualizarRelatorio,
  useAlterarStatusOs,
  useFuncionariosDaOs,
} from "@/hooks/useOrdensServico";
import { useFuncionarioLogado } from "@/hooks/useFuncionarioLogado";
import { ordemServicoService } from "@/services/ordemServicoService";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { TelaCarregando } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusOsBadge } from "@/components/os/StatusOsBadge";
import { GerenciarFuncionariosOs } from "@/components/os/GerenciarFuncionariosOs";
import { GerarRelatorioModal } from "@/components/os/GerarRelatorioModal";
import { GerarLinkFotosModal } from "@/components/os/GerarLinkFotosModal";
import { EditarOrdemServicoModal } from "@/components/os/EditarOrdemServicoModal";
import { StatusOs } from "@/types/enums";
import { relatorioSchema, type RelatorioFormValues } from "@/schemas/ordemServicoSchema";
import { formatarDataHora } from "@/utils/formatters";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

export default function OrdemServicoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const idOs = Number(id);
  const navigate = useNavigate();
  const mostrarToast = useToastStore((s) => s.mostrar);

  const { data: os, isLoading } = useOrdemServico(idOs);
  const { data: funcionariosDaOs, isLoading: carregandoFuncionarios } = useFuncionariosDaOs(idOs);
  const { data: funcionarioLogado } = useFuncionarioLogado();

  const { mutate: salvarRelatorio, isPending: salvandoRelatorio, error: erroRelatorio } =
    useAtualizarRelatorio(idOs);
  const { mutate: alterarStatus, isPending: alterandoStatus } = useAlterarStatusOs(idOs);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [editarAberto, setEditarAberto] = useState(false);
  const [gerarRelatorioAberto, setGerarRelatorioAberto] = useState(false);
  const [gerarLinkFotosAberto, setGerarLinkFotosAberto] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [baixandoPdfFotos, setBaixandoPdfFotos] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RelatorioFormValues>({
    resolver: zodResolver(relatorioSchema),
    values: { relatorioTecnico: os?.relatorioTecnico ?? "" },
  });

  if (isLoading) return <TelaCarregando />;
  if (!os) return <p className="text-neutral-500">Ordem de serviço não encontrada.</p>;

  const osConcluida = os.status === StatusOs.Concluida;
  const osCancelada = os.status === StatusOs.Cancelada;
  // Trava única pras duas situações em que a OS não pode mais ser mexida:
  // concluída (fluxo normal) ou cancelada (fluxo interrompido).
  const osTravada = osConcluida || osCancelada;
  const podeIniciar = os.status === StatusOs.Agendada;
  const podeCancelar = !osTravada;
  const ehResponsavel = os.funcionarios.some(
    (f) => f.responsavel && f.idFuncionario === funcionarioLogado?.id
  );
  // Regra: só o responsável edita o relatório, e nunca se a OS estiver
  // concluída ou cancelada. O back valida isso de verdade
  // (VerificarTecnicoEResponsavelAsync + falharSeOSConcluida); aqui é só
  // pra já deixar a UI coerente e não deixar o usuário tentar em vão.
  const podeEditarRelatorio = ehResponsavel && !osTravada;

  // Trava pedida: só dá pra gerar/assinar o relatório depois que o relatório
  // técnico estiver preenchido (o back também valida isso).
  const temRelatorioPreenchido = !!os.relatorioTecnico?.trim();

  function aoSalvarRelatorio(dados: RelatorioFormValues) {
    salvarRelatorio(dados, {
      onSuccess: () => mostrarToast("Relatório atualizado.", "sucesso"),
    });
  }

  async function aoAbrirPdf() {
    // Abre a aba JÁ, ainda dentro do gesto de clique do usuário — celular
    // bloqueia window.open() se ele vier depois de um await (perde o
    // "gesto do usuário"). Preenche o conteúdo dela só depois que o PDF chegar.
    const novaAba = window.open("", "_blank");
    setBaixandoPdf(true);
    try {
      const blob = await ordemServicoService.obterPdf(os!.idOs);
      const url = URL.createObjectURL(blob);
      if (novaAba) novaAba.location.href = url;
      else window.open(url, "_blank"); // navegador bloqueou mesmo assim — tenta de novo
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (erro) {
      novaAba?.close();
      mostrarToast(extrairMensagemErro(erro), "erro");
    } finally {
      setBaixandoPdf(false);
    }
  }

  async function aoAbrirPdfFotos() {
    const novaAba = window.open("", "_blank");
    setBaixandoPdfFotos(true);
    try {
      const blob = await ordemServicoService.obterPdfFotos(os!.idOs);
      const url = URL.createObjectURL(blob);
      if (novaAba) novaAba.location.href = url;
      else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (erro) {
      novaAba?.close();
      mostrarToast(extrairMensagemErro(erro), "erro");
    } finally {
      setBaixandoPdfFotos(false);
    }
  }

  function aoIniciar() {
    // Data/hora de início é setada automaticamente pelo back ao iniciar —
    // não é mais um campo que se define manualmente por aqui.
    alterarStatus(
      { status: StatusOs.EmAtendimento },
      {
        onSuccess: () => mostrarToast("Ordem de serviço iniciada.", "sucesso"),
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  function aoConfirmarCancelamento() {
    alterarStatus(
      { status: StatusOs.Cancelada },
      {
        onSuccess: () => {
          mostrarToast("Ordem de serviço cancelada.", "sucesso");
          setConfirmandoCancelamento(false);
        },
        onError: (erro) => {
          mostrarToast(extrairMensagemErro(erro), "erro");
          setConfirmandoCancelamento(false);
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/ordens-servico")}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para a listagem
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{os.tituloOs}</h1>
            {ehResponsavel && !osTravada && (
              <button
                onClick={() => setEditarAberto(true)}
                title="Editar Ordem de Serviço"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-neutral-500">{os.nomeCliente} · {os.nomeTipoAtendimento}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ehResponsavel && !osTravada && (
            <Button size="sm" variant="secondary" onClick={() => setGerarLinkFotosAberto(true)}>
              <Camera className="h-4 w-4" /> Registrar Fotos
            </Button>
          )}
          {os.possuiPdfFotos && (
            <Button size="sm" variant="secondary" carregando={baixandoPdfFotos} onClick={aoAbrirPdfFotos}>
              <Camera className="h-4 w-4" /> Ver Fotos
            </Button>
          )}
          {os.possuiPdfAssinado && (
            <Button size="sm" variant="secondary" carregando={baixandoPdf} onClick={aoAbrirPdf}>
              <FileDown className="h-4 w-4" /> Ver PDF
            </Button>
          )}
          <StatusOsBadge status={os.status} />
        </div>
      </div>

      {osTravada && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          <Lock className="h-4 w-4 shrink-0" />
          {osConcluida
            ? "Esta OS está concluída e não pode mais ser editada."
            : "Esta OS está cancelada e não pode mais ser editada."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="mb-1 font-display font-semibold">Descrição</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{os.descricao || "—"}</p>
          </div>
          {os.observacao && (
            <div>
              <h2 className="mb-1 font-display font-semibold">Observações</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{os.observacao}</p>
            </div>
          )}

          <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400">Datas</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-400">Início</p>
                <p>{formatarDataHora(os.dataHoraInicio)}</p>
              </div>
              <div>
                <p className="text-neutral-400">Prazo</p>
                <p>{formatarDataHora(os.prazo)}</p>
              </div>
              <div>
                <p className="text-neutral-400">Finalizada em</p>
                <p>{formatarDataHora(os.dataHoraFim)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
            <UserIcon className="h-4 w-4" /> Funcionários
          </h2>

          {osTravada ? (
            carregandoFuncionarios ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <ul className="space-y-2">
                {(funcionariosDaOs ?? []).map((f) => (
                  <li key={f.idOsFuncionario} className="flex items-center justify-between text-sm">
                    <span>{f.nomeFuncionario}</span>
                    {f.responsavel && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        Responsável
                      </span>
                    )}
                  </li>
                ))}
                {(funcionariosDaOs ?? []).length === 0 && (
                  <li className="text-sm text-neutral-400">Nenhum funcionário vinculado.</li>
                )}
              </ul>
            )
          ) : (
            <GerenciarFuncionariosOs idOs={idOs} />
          )}

          {(podeIniciar || podeCancelar) && (
            <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              {podeIniciar && (
                <Button size="sm" className="w-full" carregando={alterandoStatus} onClick={aoIniciar}>
                  <PlayCircle className="h-4 w-4" /> Iniciar OS
                </Button>
              )}
              {podeCancelar && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setConfirmandoCancelamento(true)}
                >
                  <Ban className="h-4 w-4" /> Cancelar OS
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <FileText className="h-4 w-4" /> Relatório técnico
          </h2>
          {ehResponsavel && !osTravada && (
            <Button
              size="sm"
              variant="secondary"
              disabled={!temRelatorioPreenchido}
              title={!temRelatorioPreenchido ? "Preencha e salve o relatório técnico antes de gerar o relatório assinado." : undefined}
              onClick={() => setGerarRelatorioAberto(true)}
            >
              <FileSignature className="h-4 w-4" /> Gerar Relatório
            </Button>
          )}
        </div>
        {ehResponsavel && !osTravada && !temRelatorioPreenchido && (
          <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
            Preencha e salve o relatório técnico abaixo antes de gerar o relatório assinado.
          </p>
        )}
        {!podeEditarRelatorio && (
          <p className="mb-3 text-xs text-neutral-500">
            {osConcluida
              ? "OS concluída — o relatório não pode mais ser alterado."
              : osCancelada
              ? "OS cancelada — o relatório não pode mais ser alterado."
              : "Somente o funcionário responsável pela OS pode editar o relatório."}
          </p>
        )}

        {podeEditarRelatorio ? (
          <form onSubmit={handleSubmit(aoSalvarRelatorio)} className="space-y-3">
            <Textarea rows={6} erro={errors.relatorioTecnico?.message} {...register("relatorioTecnico")} />
            {erroRelatorio && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
                {extrairMensagemErro(erroRelatorio)}
              </p>
            )}
            <Button type="submit" size="sm" carregando={salvandoRelatorio} disabled={!isDirty}>
              Salvar relatório
            </Button>
          </form>
        ) : (
          <p className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {os.relatorioTecnico || "Nenhum relatório registrado ainda."}
          </p>
        )}
      </Card>

      <ConfirmDialog
        aberto={confirmandoCancelamento}
        titulo="Cancelar ordem de serviço"
        mensagem="Tem certeza que deseja cancelar esta OS? Essa ação não pode ser desfeita."
        confirmando={alterandoStatus}
        aoConfirmar={aoConfirmarCancelamento}
        aoCancelar={() => setConfirmandoCancelamento(false)}
        textoConfirmar="Cancelar OS"
      />

      <GerarRelatorioModal
        aberto={gerarRelatorioAberto}
        aoFechar={() => setGerarRelatorioAberto(false)}
        ordemServico={os}
      />

      <EditarOrdemServicoModal
        aberto={editarAberto}
        aoFechar={() => setEditarAberto(false)}
        ordemServico={os}
      />

      <GerarLinkFotosModal
        aberto={gerarLinkFotosAberto}
        aoFechar={() => setGerarLinkFotosAberto(false)}
        idOs={os.idOs}
      />
    </div>
  );
}
