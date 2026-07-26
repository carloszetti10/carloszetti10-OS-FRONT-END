import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock, FileText, User as UserIcon, CheckCircle2, Pencil, X as XIcon, FileSignature, FileDown } from "lucide-react";
import {
  useOrdemServico,
  useAtualizarOrdemServico,
  useAtualizarRelatorio,
  useAlterarStatusOs,
  useFuncionariosDaOs,
} from "@/hooks/useOrdensServico";
import { useFuncionarioLogado } from "@/hooks/useFuncionarioLogado";
import { ordemServicoService } from "@/services/ordemServicoService";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { TelaCarregando } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusOsBadge } from "@/components/os/StatusOsBadge";
import { GerenciarFuncionariosOs } from "@/components/os/GerenciarFuncionariosOs";
import { GerarRelatorioModal } from "@/components/os/GerarRelatorioModal";
import { StatusOs, STATUS_OS_LABEL } from "@/types/enums";
import { relatorioSchema, type RelatorioFormValues } from "@/schemas/ordemServicoSchema";
import { formatarDataHora, paraIso, paraInputDatetime } from "@/utils/formatters";
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
  const { mutate: atualizarOs, isPending: salvandoDatas, error: erroDatas } = useAtualizarOrdemServico(idOs);
  const [statusSelecionado, setStatusSelecionado] = useState<StatusOs | "">("");
  const [confirmandoConclusao, setConfirmandoConclusao] = useState(false);
  const [editandoDatas, setEditandoDatas] = useState(false);
  const [inicioEditado, setInicioEditado] = useState("");
  const [prazoEditado, setPrazoEditado] = useState("");
  const [gerarRelatorioAberto, setGerarRelatorioAberto] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);

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
  const ehResponsavel = os.funcionarios.some(
    (f) => f.responsavel && f.idFuncionario === funcionarioLogado?.id
  );
  // Regra: só o responsável edita o relatório, e nunca se a OS já estiver concluída.
  // O back valida isso de verdade (VerificarTecnicoEResponsavelAsync + falharSeOSConcluida);
  // aqui é só pra já deixar a UI coerente e não deixar o usuário tentar em vão.
  const podeEditarRelatorio = ehResponsavel && !osConcluida;

  // "Concluída" saiu da lista de opções do select: agora é sempre uma ação
  // deliberada (botão + confirmação), nunca só mais um item de dropdown.
  const opcoesStatus = Object.entries(STATUS_OS_LABEL).filter(
    ([valor]) => Number(valor) !== os.status && Number(valor) !== StatusOs.Concluida
  );

  // Trava pedida: só dá pra gerar/assinar o relatório depois que o relatório
  // técnico estiver preenchido (o back também valida isso).
  const temRelatorioPreenchido = !!os.relatorioTecnico?.trim();

  function aoSalvarRelatorio(dados: RelatorioFormValues) {
    salvarRelatorio(dados, {
      onSuccess: () => mostrarToast("Relatório atualizado.", "sucesso"),
    });
  }

  async function aoAbrirPdf() {
    setBaixandoPdf(true);
    try {
      const blob = await ordemServicoService.obterPdf(os!.idOs);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // libera a memória do objeto depois de um tempo, sem pressa de fechar a aba
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (erro) {
      mostrarToast(extrairMensagemErro(erro), "erro");
    } finally {
      setBaixandoPdf(false);
    }
  }

  function aoMudarStatus() {
    if (!statusSelecionado) return;
    alterarStatus(
      { status: statusSelecionado },
      {
        onSuccess: () => {
          mostrarToast("Status atualizado.", "sucesso");
          setStatusSelecionado("");
        },
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  function aoConfirmarConclusao() {
    alterarStatus(
      { status: StatusOs.Concluida },
      {
        onSuccess: () => {
          mostrarToast("Ordem de serviço concluída.", "sucesso");
          setConfirmandoConclusao(false);
        },
        onError: (erro) => {
          mostrarToast(extrairMensagemErro(erro), "erro");
          setConfirmandoConclusao(false);
        },
      }
    );
  }

  function abrirEdicaoDatas() {
    setInicioEditado(paraInputDatetime(os!.dataHoraInicio));
    setPrazoEditado(paraInputDatetime(os!.prazo));
    setEditandoDatas(true);
  }

  function aoSalvarDatas() {
    atualizarOs(
      {
        tituloOs: os!.tituloOs,
        descricao: os!.descricao,
        idTipoAtendimento: os!.idTipoAtendimento,
        idCliente: os!.idCliente,
        status: os!.status,
        dataHoraInicio: paraIso(inicioEditado) ?? null,
        dataHoraFim: os!.dataHoraFim ?? null,
        prazo: paraIso(prazoEditado) ?? null,
        observacao: os!.observacao ?? undefined,
      },
      {
        onSuccess: () => {
          mostrarToast("Datas atualizadas.", "sucesso");
          setEditandoDatas(false);
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
          <h1 className="font-display text-2xl font-bold">{os.tituloOs}</h1>
          <p className="text-sm text-neutral-500">{os.nomeCliente} · {os.nomeTipoAtendimento}</p>
        </div>
        <div className="flex items-center gap-2">
          {os.possuiPdfAssinado && (
            <Button size="sm" variant="secondary" carregando={baixandoPdf} onClick={aoAbrirPdf}>
              <FileDown className="h-4 w-4" /> Ver PDF
            </Button>
          )}
          <StatusOsBadge status={os.status} />
        </div>
      </div>

      {osConcluida && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          <Lock className="h-4 w-4 shrink-0" />
          Esta OS está concluída e não pode mais ser editada.
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
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Datas</p>
              {!osConcluida && !editandoDatas && (
                <button
                  onClick={abrirEdicaoDatas}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  <Pencil className="h-3 w-3" /> Editar
                </button>
              )}
            </div>

            {editandoDatas ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Data/hora de início"
                    type="datetime-local"
                    value={inicioEditado}
                    onChange={(e) => setInicioEditado(e.target.value)}
                  />
                  <Input
                    label="Prazo"
                    type="datetime-local"
                    value={prazoEditado}
                    onChange={(e) => setPrazoEditado(e.target.value)}
                  />
                </div>
                {erroDatas && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
                    {extrairMensagemErro(erroDatas)}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditandoDatas(false)}>
                    <XIcon className="h-4 w-4" /> Cancelar
                  </Button>
                  <Button size="sm" carregando={salvandoDatas} onClick={aoSalvarDatas}>
                    Salvar datas
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
            <UserIcon className="h-4 w-4" /> Funcionários
          </h2>

          {osConcluida ? (
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

          {!osConcluida && (
            <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <p className="text-sm font-medium">Alterar status</p>
              <Select
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(Number(e.target.value) as StatusOs)}
              >
                <option value="">Selecione…</option>
                {opcoesStatus.map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>{rotulo}</option>
                ))}
              </Select>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                disabled={!statusSelecionado}
                carregando={alterandoStatus}
                onClick={aoMudarStatus}
              >
                Atualizar status
              </Button>

              {/* Concluir é uma ação separada e deliberada, sempre com confirmação —
                  não é só mais uma opção no dropdown de status. */}
              <Button
                size="sm"
                className="w-full"
                onClick={() => setConfirmandoConclusao(true)}
              >
                <CheckCircle2 className="h-4 w-4" /> Concluir OS
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <FileText className="h-4 w-4" /> Relatório técnico
          </h2>
          {ehResponsavel && !osConcluida && (
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
        {ehResponsavel && !osConcluida && !temRelatorioPreenchido && (
          <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
            Preencha e salve o relatório técnico abaixo antes de gerar o relatório assinado.
          </p>
        )}
        {!podeEditarRelatorio && (
          <p className="mb-3 text-xs text-neutral-500">
            {osConcluida
              ? "OS concluída — o relatório não pode mais ser alterado."
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
        aberto={confirmandoConclusao}
        titulo="Concluir ordem de serviço"
        mensagem="Tem certeza que deseja concluir esta OS? Depois de concluída, ela não pode mais ser editada nem ter o relatório alterado."
        confirmando={alterandoStatus}
        aoConfirmar={aoConfirmarConclusao}
        aoCancelar={() => setConfirmandoConclusao(false)}
        textoConfirmar="Concluir OS"
        variante="padrao"
      />

      <GerarRelatorioModal
        aberto={gerarRelatorioAberto}
        aoFechar={() => setGerarRelatorioAberto(false)}
        ordemServico={os}
      />
    </div>
  );
}
