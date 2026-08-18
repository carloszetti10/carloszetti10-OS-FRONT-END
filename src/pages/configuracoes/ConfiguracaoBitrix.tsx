import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertTriangle, Pencil, Save, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import {
  useConfiguracaoBitrix,
  useDrivesBitrix,
  usePastasBitrix,
  useCadastrarWebhookBitrix,
  useAtualizarWebhookBitrix,
  useSalvarConfiguracaoBitrix,
} from "@/hooks/useBitrix";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

/**
 * Tela de configuração da integração Bitrix por funcionário.
 *
 * Fonte da verdade: GET /Bitrix/Configuracao?funcionarioId= (BuscarBitrixConfiguracaoDto).
 * - 400 "Funcionario sem configuração." → funcionário nunca cadastrou webhook.
 * - 200 com driveId/pastaId nulos → webhook existe, Drive/Pasta ainda não escolhidos.
 * - 200 com driveId/pastaId preenchidos → configuração completa.
 *
 * O DTO acima também traz o "id" da configuração, usado em PUT /Bitrix/webhook/{id}
 * pra permitir trocar o webhook de uma configuração já existente.
 */
export default function ConfiguracaoBitrix() {
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<number | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [webhookDigitado, setWebhookDigitado] = useState("");
  const [driveIdSelecionado, setDriveIdSelecionado] = useState<string | null>(null);
  const [pastaIdSelecionada, setPastaIdSelecionada] = useState<string | null>(null);

  // Pré-preenche Drive/Pasta com o que já está salvo só UMA vez por
  // funcionário escolhido — evita sobrescrever a seleção do usuário toda vez
  // que a configuração é revalidada (ex.: logo após cadastrar o webhook).
  const funcionarioHidratadoRef = useRef<number | null>(null);

  const { data: funcionarios } = useFuncionarios({ somenteAtivos: true });
  const opcoesFuncionarios = (funcionarios ?? []).map((f) => ({ value: f.id, label: f.nome }));

  const configQuery = useConfiguracaoBitrix(funcionarioSelecionado);
  const configuracao = configQuery.data ?? null;
  const temWebhook = configQuery.isSuccess && configuracao !== null;
  const configuracaoCompleta = temWebhook && !!configuracao?.driveId && !!configuracao?.pastaId;

  const drivesQuery = useDrivesBitrix(funcionarioSelecionado, temWebhook);
  const pastasQuery = usePastasBitrix(funcionarioSelecionado, driveIdSelecionado);

  useEffect(() => {
    if (funcionarioSelecionado == null || !configQuery.isSuccess) return;
    if (funcionarioHidratadoRef.current === funcionarioSelecionado) return;

    setDriveIdSelecionado(configuracao?.driveId ?? null);
    setPastaIdSelecionada(configuracao?.pastaId ?? null);
    funcionarioHidratadoRef.current = funcionarioSelecionado;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcionarioSelecionado, configQuery.isSuccess]);

  function aoSelecionarFuncionario(id: number | null) {
    setFuncionarioSelecionado(id);
    setModoEdicao(false);
    setWebhookDigitado("");
    setDriveIdSelecionado(null);
    setPastaIdSelecionada(null);
    funcionarioHidratadoRef.current = null;
  }

  function aoSelecionarDrive(idDrive: string) {
    setDriveIdSelecionado(idDrive || null);
    setPastaIdSelecionada(null); // pasta sempre pertence a um Drive específico
  }

  const idFuncionarioAtual = funcionarioSelecionado ?? 0;
  const idConfiguracaoAtual = configuracao?.id ?? 0;
  const { mutate: cadastrarWebhook, isPending: cadastrandoWebhook } = useCadastrarWebhookBitrix(idFuncionarioAtual);
  const { mutate: atualizarWebhook, isPending: atualizandoWebhook } = useAtualizarWebhookBitrix(idFuncionarioAtual, idConfiguracaoAtual);
  const { mutate: salvarConfiguracao, isPending: salvandoConfiguracao } = useSalvarConfiguracaoBitrix(idFuncionarioAtual);

  function aoCadastrarWebhook() {
    if (!funcionarioSelecionado || !webhookDigitado.trim()) return;

    cadastrarWebhook(
      { idFuncionario: funcionarioSelecionado, webhookUrl: webhookDigitado.trim() },
      {
        onSuccess: () => {
          setWebhookDigitado("");
          mostrarToast("Webhook cadastrado. Agora escolha o Drive e a Pasta.", "sucesso");
        },
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  function aoAtualizarWebhook() {
    if (!funcionarioSelecionado || !idConfiguracaoAtual || !webhookDigitado.trim()) return;

    atualizarWebhook(
      { idFuncionario: funcionarioSelecionado, webhookUrl: webhookDigitado.trim() },
      {
        onSuccess: () => {
          setWebhookDigitado("");
          mostrarToast("Webhook atualizado.", "sucesso");
        },
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  function aoSalvarConfiguracao() {
    if (!funcionarioSelecionado || !driveIdSelecionado || !pastaIdSelecionada) return;

    salvarConfiguracao(
      { idFuncionario: funcionarioSelecionado, driveId: driveIdSelecionado, pastaId: pastaIdSelecionada },
      {
        onSuccess: () => {
          setModoEdicao(false);
          mostrarToast("Configuração salva.", "sucesso");
        },
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  function aoIniciarEdicao() {
    setDriveIdSelecionado(configuracao?.driveId ?? null);
    setPastaIdSelecionada(configuracao?.pastaId ?? null);
    setWebhookDigitado("");
    setModoEdicao(true);
  }

  function aoCancelarEdicao() {
    setWebhookDigitado("");
    setModoEdicao(false);
  }

  const podeSalvarConfiguracao = !!(funcionarioSelecionado && driveIdSelecionado && pastaIdSelecionada);
  const mostrarFormularioDriveEPasta = temWebhook && (!configuracaoCompleta || modoEdicao);

  return (
    <div className="space-y-4">
      <div>
        <Link
          to="/configuracoes"
          className="mb-1 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Configurações
        </Link>
        <h1 className="font-display text-2xl font-bold">Configuração Bitrix</h1>
        <p className="text-sm text-neutral-500">Webhook, Drive e Pasta usados para enviar PDFs ao Bitrix24.</p>
      </div>

      <Card className="max-w-xl space-y-5">
        <SearchSelect
          label="Funcionário"
          placeholder="Selecione o funcionário"
          opcoes={opcoesFuncionarios}
          valor={funcionarioSelecionado}
          aoSelecionar={(valor) => aoSelecionarFuncionario(valor)}
        />

        {funcionarioSelecionado && configQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Spinner className="h-4 w-4" /> Carregando configuração…
          </div>
        )}

        {funcionarioSelecionado && configQuery.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
            {extrairMensagemErro(configQuery.error)}
          </p>
        )}

        {funcionarioSelecionado && configQuery.isSuccess && !temWebhook && (
          <div className="space-y-4">
            <Badge cor="amarelo">
              <AlertTriangle className="mr-1 h-3 w-3" /> Bitrix não configurado
            </Badge>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Webhook"
                  type="password"
                  placeholder="Cole aqui o webhook do Bitrix"
                  value={webhookDigitado}
                  onChange={(e) => setWebhookDigitado(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <Button type="button" onClick={aoCadastrarWebhook} disabled={!webhookDigitado.trim()} carregando={cadastrandoWebhook}>
                Cadastrar Webhook
              </Button>
            </div>

            <Select label="Drive" disabled>
              <option value="">Cadastre o Webhook primeiro</option>
            </Select>
            <Select label="Pasta" disabled>
              <option value="">Cadastre o Webhook primeiro</option>
            </Select>
          </div>
        )}

        {/* Resumo visual — só quando webhook + Drive + Pasta estão completos e não está em edição */}
        {temWebhook && configuracaoCompleta && !modoEdicao && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
              <span>Webhook configurado</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
              <span>
                Drive configurado <span className="text-neutral-400">— ID: {configuracao?.driveId}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
              <span>
                Pasta configurada <span className="text-neutral-400">— ID: {configuracao?.pastaId}</span>
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={aoIniciarEdicao}>
                <Pencil className="h-4 w-4" /> Editar configuração
              </Button>
            </div>
          </div>
        )}

        {/* Formulário de Drive/Pasta — aparece tanto na 1ª configuração (após cadastrar o webhook)
            quanto no modo de edição de uma configuração já existente */}
        {mostrarFormularioDriveEPasta && (
          <div className="space-y-4">
            {modoEdicao && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge cor="verde">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Webhook configurado
                  </Badge>
                  <Button type="button" variant="ghost" size="sm" onClick={aoCancelarEdicao}>
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Novo Webhook"
                      type="password"
                      placeholder="Deixe em branco para manter o atual"
                      value={webhookDigitado}
                      onChange={(e) => setWebhookDigitado(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={aoAtualizarWebhook}
                    disabled={!webhookDigitado.trim()}
                    carregando={atualizandoWebhook}
                  >
                    Atualizar Webhook
                  </Button>
                </div>
              </div>
            )}

            <Select label="Drive" disabled={drivesQuery.isLoading} value={driveIdSelecionado ?? ""} onChange={(e) => aoSelecionarDrive(e.target.value)}>
              <option value="">{drivesQuery.isLoading ? "Carregando Drives…" : "Selecione um Drive"}</option>
              {drivesQuery.data?.map((drive) => (
                <option key={drive.ID} value={drive.ID}>
                  {drive.NAME}
                </option>
              ))}
            </Select>
            {drivesQuery.isError && <p className="text-xs text-red-500">{extrairMensagemErro(drivesQuery.error)}</p>}
            {drivesQuery.isSuccess && drivesQuery.data.length === 0 && (
              <p className="text-xs text-neutral-400">Nenhum Drive encontrado para este funcionário.</p>
            )}

            <Select
              label="Pasta"
              disabled={!driveIdSelecionado || pastasQuery.isLoading}
              value={pastaIdSelecionada ?? ""}
              onChange={(e) => setPastaIdSelecionada(e.target.value || null)}
            >
              <option value="">
                {!driveIdSelecionado ? "Selecione um Drive primeiro" : pastasQuery.isLoading ? "Carregando Pastas…" : "Selecione uma Pasta"}
              </option>
              {pastasQuery.data?.map((pasta) => (
                <option key={pasta.ID} value={pasta.ID}>
                  {pasta.NAME}
                </option>
              ))}
            </Select>
            {driveIdSelecionado && pastasQuery.isError && <p className="text-xs text-red-500">{extrairMensagemErro(pastasQuery.error)}</p>}
            {driveIdSelecionado && pastasQuery.isSuccess && pastasQuery.data.length === 0 && (
              <p className="text-xs text-neutral-400">Nenhuma Pasta encontrada neste Drive.</p>
            )}

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={aoSalvarConfiguracao} disabled={!podeSalvarConfiguracao} carregando={salvandoConfiguracao}>
                <Save className="h-4 w-4" /> Salvar configuração
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
