import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Save, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useDrivesBitrix, usePastasBitrix, useCadastrarWebhookBitrix, useSalvarConfiguracaoBitrix } from "@/hooks/useBitrix";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

/**
 * Tela de configuração da integração Bitrix por funcionário.
 *
 * LIMITAÇÕES DO BACK ATUAL (sem nenhuma alteração no back — ver aviso ao
 * final da resposta que entregou esta tela):
 * - Não existe nenhum GET que devolva a configuração de um funcionário, então
 *   a tela não tem como saber de antemão se o webhook já existe, nem qual
 *   Drive/Pasta foram salvos antes. O único sinal disponível é tentar
 *   GET /Bitrix/drives/{funcionarioId}: se funcionar, o back já tinha
 *   webhook salvo (só ele consegue montar a URL da API do Bitrix); se falhar,
 *   assumimos que ainda não há webhook.
 * - Não existe como trocar um webhook já cadastrado: PUT /Bitrix/webhook/{id}
 *   pede o id interno da configuração, e nenhum endpoint devolve esse id.
 * - Drive/Pasta SEMPRE precisam ser reselecionados (não dá pra pré-preencher
 *   com o que já estava salvo), mas salvar de novo funciona normalmente:
 *   POST /Bitrix/config localiza a configuração pelo funcionário (não pelo
 *   id) e sobrescreve Drive/Pasta, servindo tanto pra criar quanto atualizar.
 */
export default function ConfiguracaoBitrix() {
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<number | null>(null);
  const [webhookDigitado, setWebhookDigitado] = useState("");
  const [driveIdSelecionado, setDriveIdSelecionado] = useState<string | null>(null);
  const [pastaIdSelecionada, setPastaIdSelecionada] = useState<string | null>(null);

  const { data: funcionarios } = useFuncionarios({ somenteAtivos: true });
  const opcoesFuncionarios = (funcionarios ?? []).map((f) => ({ value: f.id, label: f.nome }));

  const drivesQuery = useDrivesBitrix(funcionarioSelecionado);
  const pastasQuery = usePastasBitrix(funcionarioSelecionado, driveIdSelecionado);

  const webhookProvavelmenteConfigurado = drivesQuery.isSuccess;

  const idFuncionarioAtual = funcionarioSelecionado ?? 0;
  const { mutate: cadastrarWebhook, isPending: cadastrandoWebhook } = useCadastrarWebhookBitrix(idFuncionarioAtual);
  const { mutate: salvarConfiguracao, isPending: salvandoConfiguracao } = useSalvarConfiguracaoBitrix();

  function aoSelecionarFuncionario(id: number | null) {
    setFuncionarioSelecionado(id);
    setWebhookDigitado("");
    setDriveIdSelecionado(null);
    setPastaIdSelecionada(null);
  }

  function aoSelecionarDrive(idDrive: string) {
    setDriveIdSelecionado(idDrive || null);
    setPastaIdSelecionada(null); // pasta sempre pertence a um Drive específico
  }

  function aoSubmeterWebhook() {
    if (!funcionarioSelecionado || !webhookDigitado.trim()) return;

    cadastrarWebhook(
      { idFuncionario: funcionarioSelecionado, webhookUrl: webhookDigitado.trim() },
      {
        onSuccess: () => {
          setWebhookDigitado("");
          mostrarToast("Webhook cadastrado.", "sucesso");
        },
        onError: (erro) => {
          const mensagem = extrairMensagemErro(erro);
          mostrarToast(mensagem, "erro");
        },
      }
    );
  }

  function aoSalvarConfiguracao() {
    if (!funcionarioSelecionado || !driveIdSelecionado || !pastaIdSelecionada) return;

    salvarConfiguracao(
      { idFuncionario: funcionarioSelecionado, driveId: driveIdSelecionado, pastaId: pastaIdSelecionada },
      {
        onSuccess: () => mostrarToast("Configuração salva.", "sucesso"),
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  const podeSalvarConfiguracao = !!(funcionarioSelecionado && driveIdSelecionado && pastaIdSelecionada);

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

        {funcionarioSelecionado && drivesQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Spinner className="h-4 w-4" /> Verificando configuração…
          </div>
        )}

        {funcionarioSelecionado && !drivesQuery.isLoading && (
          <>
            {!webhookProvavelmenteConfigurado && (
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
                <Button
                  type="button"
                  onClick={aoSubmeterWebhook}
                  disabled={!webhookDigitado.trim()}
                  carregando={cadastrandoWebhook}
                >
                  Cadastrar
                </Button>
              </div>
            )}

            {webhookProvavelmenteConfigurado && (
              <Badge cor="verde">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Webhook configurado
              </Badge>
            )}

            <Select
              label="Drive"
              disabled={!webhookProvavelmenteConfigurado}
              value={driveIdSelecionado ?? ""}
              onChange={(e) => aoSelecionarDrive(e.target.value)}
            >
              <option value="">
                {!webhookProvavelmenteConfigurado ? "Cadastre o Webhook primeiro" : "Selecione um Drive"}
              </option>
              {drivesQuery.data?.map((drive) => (
                <option key={drive.ID} value={drive.ID}>
                  {drive.NAME}
                </option>
              ))}
            </Select>
            {webhookProvavelmenteConfigurado && drivesQuery.data?.length === 0 && (
              <p className="text-xs text-neutral-400">Nenhum Drive encontrado para este funcionário.</p>
            )}
            {webhookProvavelmenteConfigurado && (
              <p className="flex items-start gap-1.5 text-xs text-neutral-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Se este funcionário já tiver Drive/Pasta salvos, selecione novamente — a tela não consegue
                recuperar a seleção anterior.
              </p>
            )}

            <Select
              label="Pasta"
              disabled={!driveIdSelecionado || pastasQuery.isLoading}
              value={pastaIdSelecionada ?? ""}
              onChange={(e) => setPastaIdSelecionada(e.target.value || null)}
            >
              <option value="">
                {!driveIdSelecionado
                  ? "Selecione um Drive primeiro"
                  : pastasQuery.isLoading
                    ? "Carregando Pastas…"
                    : "Selecione uma Pasta"}
              </option>
              {pastasQuery.data?.map((pasta) => (
                <option key={pasta.ID} value={pasta.ID}>
                  {pasta.NAME}
                </option>
              ))}
            </Select>
            {driveIdSelecionado && pastasQuery.isError && (
              <p className="text-xs text-red-500">{extrairMensagemErro(pastasQuery.error)}</p>
            )}
            {driveIdSelecionado && pastasQuery.isSuccess && pastasQuery.data.length === 0 && (
              <p className="text-xs text-neutral-400">Nenhuma Pasta encontrada neste Drive.</p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={aoSalvarConfiguracao}
                disabled={!podeSalvarConfiguracao}
                carregando={salvandoConfiguracao}
              >
                <Save className="h-4 w-4" /> Salvar configuração
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
