import { useEffect, useRef, useState } from "react";
import { FileSignature, RefreshCcw, Smartphone, Link2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SignaturePad, type SignaturePadHandle } from "@/components/ui/SignaturePad";
import { LinkComQrCode } from "./LinkComQrCode";
import { useIniciarAssinatura, useSubmeterAssinaturaCliente } from "@/hooks/useAssinatura";
import { useFuncionarioLogado } from "@/hooks/useFuncionarioLogado";
import { useClientes } from "@/hooks/useClientes";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import { gerarPdfOs, uint8ArrayParaBase64 } from "@/utils/gerarPdfOs";
import type { OrdemServico } from "@/types/ordemServico";

interface GerarRelatorioModalProps {
  aberto: boolean;
  aoFechar: () => void;
  ordemServico: OrdemServico;
}

type Etapa = "assinar-funcionario" | "escolher-modo" | "assinar-cliente-agora" | "link-gerado" | "concluido-local";

/**
 * Fluxo: 1) funcionário assina (usa a assinatura salva ou desenha uma nova);
 * 2) escolhe como o CLIENTE vai assinar — agora, neste mesmo aparelho (útil
 * quando estão frente a frente), ou por um link/QR code pro aparelho do
 * próprio cliente (útil pra assinatura remota).
 */
export function GerarRelatorioModal({ aberto, aoFechar, ordemServico }: GerarRelatorioModalProps) {
  const { data: funcionarioLogado } = useFuncionarioLogado();
  const { data: clientes } = useClientes();
  const { mutate: iniciar, isPending: iniciando, error: erroIniciar, data: resultado, reset: resetIniciar } =
    useIniciarAssinatura(ordemServico.idOs);
  const { mutateAsync: submeterCliente, isPending: assinandoCliente } =
    useSubmeterAssinaturaCliente(resultado?.token ?? "");
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [etapa, setEtapa] = useState<Etapa>("assinar-funcionario");
  const [usarAssinaturaSalva, setUsarAssinaturaSalva] = useState(true);
  const [salvarComoPadrao, setSalvarComoPadrao] = useState(true);
  const [imagemFuncionarioUsada, setImagemFuncionarioUsada] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [documentoCliente, setDocumentoCliente] = useState("");
  const [erroAssinaturaCliente, setErroAssinaturaCliente] = useState<string | null>(null);

  const padFuncionarioRef = useRef<SignaturePadHandle>(null);
  const padClienteRef = useRef<SignaturePadHandle>(null);

  const temAssinaturaSalva = !!funcionarioLogado?.assinaturaPadrao;

  useEffect(() => {
    if (aberto) {
      resetIniciar();
      setEtapa("assinar-funcionario");
      setUsarAssinaturaSalva(temAssinaturaSalva);
      setNomeCliente("");
      setDocumentoCliente("");
      setErroAssinaturaCliente(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const link = resultado ? `${window.location.origin}/assinar/${resultado.token}` : null;

  function aoConfirmarAssinaturaFuncionario() {
    const imagem = usarAssinaturaSalva
      ? funcionarioLogado?.assinaturaPadrao ?? null
      : padFuncionarioRef.current?.obterBase64() ?? null;

    if (!imagem) {
      mostrarToast("Assine no campo antes de continuar.", "erro");
      return;
    }

    setImagemFuncionarioUsada(imagem);
    iniciar(
      { imagemAssinaturaFuncionario: imagem, salvarComoPadrao: !usarAssinaturaSalva && salvarComoPadrao },
      {
        onSuccess: () => setEtapa("escolher-modo"),
        onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro"),
      }
    );
  }

  async function aoConfirmarAssinaturaCliente() {
    setErroAssinaturaCliente(null);
    if (!nomeCliente.trim()) {
      setErroAssinaturaCliente("Informe o nome de quem está assinando.");
      return;
    }
    const assinaturaCliente = padClienteRef.current?.obterBase64();
    if (!assinaturaCliente) {
      setErroAssinaturaCliente("Peça pro cliente assinar no campo antes de continuar.");
      return;
    }

    try {
      const documentoCadastrado = clientes?.find((c) => c.idCliente === ordemServico.idCliente)?.documento ?? "";
      const dataFinal = new Date().toISOString();
      const pdfBytes = await gerarPdfOs({
        idOs: ordemServico.idOs,
        tituloOs: ordemServico.tituloOs,
        nomeTipoAtendimento: ordemServico.nomeTipoAtendimento,
        nomeCliente: ordemServico.nomeCliente,
        documentoCliente: documentoCadastrado,
        dataHoraInicio: ordemServico.dataHoraInicio,
        dataHoraFim: dataFinal,
        descricao: ordemServico.descricao,
        relatorioTecnico: ordemServico.relatorioTecnico || "",
        nomeFuncionario: funcionarioLogado?.nome ?? "",
        assinaturaFuncionarioBase64: imagemFuncionarioUsada,
        nomeSignatarioCliente: nomeCliente,
        assinaturaClienteBase64: assinaturaCliente,
        dataAssinaturaCliente: dataFinal,
      });
      const pdfBase64 = uint8ArrayParaBase64(pdfBytes);

      await submeterCliente({
        nomeSignatario: nomeCliente,
        documentoSignatario: documentoCliente || undefined,
        imagemAssinatura: assinaturaCliente,
        arquivoPdf: pdfBase64,
        dataFinal:dataFinal, 
      });

      setEtapa("concluido-local");
    } catch (erro) {
      setErroAssinaturaCliente(extrairMensagemErro(erro));
    }
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Gerar Relatório" largura="sm">
      {etapa === "assinar-funcionario" && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">Assine como responsável técnico pra continuar.</p>

          {temAssinaturaSalva && usarAssinaturaSalva ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <img
                  src={`data:image/png;base64,${funcionarioLogado!.assinaturaPadrao}`}
                  alt="Sua assinatura salva"
                  className="mx-auto h-16 object-contain"
                />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setUsarAssinaturaSalva(false)}>
                <RefreshCcw className="h-4 w-4" /> Assinar novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <SignaturePad ref={padFuncionarioRef} />
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input type="checkbox" checked={salvarComoPadrao} onChange={(e) => setSalvarComoPadrao(e.target.checked)} />
                Salvar como minha assinatura padrão (usar automaticamente da próxima vez)
              </label>
              {temAssinaturaSalva && (
                <button type="button" onClick={() => setUsarAssinaturaSalva(true)} className="text-xs text-brand-600 hover:underline">
                  Usar minha assinatura salva em vez disso
                </button>
              )}
            </div>
          )}

          {erroIniciar && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
              {extrairMensagemErro(erroIniciar)}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={aoFechar}>Cancelar</Button>
            <Button type="button" carregando={iniciando} onClick={aoConfirmarAssinaturaFuncionario}>
              <FileSignature className="h-4 w-4" /> Confirmar assinatura
            </Button>
          </div>
        </div>
      )}

      {etapa === "escolher-modo" && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">Assinatura registrada. Como o cliente vai assinar?</p>

          <button
            type="button"
            onClick={() => setEtapa("assinar-cliente-agora")}
            className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:border-brand-400 hover:bg-brand-50/50 dark:border-neutral-700 dark:hover:bg-brand-950/30"
          >
            <Smartphone className="h-5 w-5 shrink-0 text-brand-600" />
            <span>
              <span className="block font-medium">Agora, neste aparelho</span>
              <span className="block text-xs text-neutral-500">O cliente assina na hora, direto aqui</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEtapa("link-gerado")}
            className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left hover:border-brand-400 hover:bg-brand-50/50 dark:border-neutral-700 dark:hover:bg-brand-950/30"
          >
            <Link2 className="h-5 w-5 shrink-0 text-brand-600" />
            <span>
              <span className="block font-medium">Link pro aparelho do cliente</span>
              <span className="block text-xs text-neutral-500">Gera um link/QR code (válido por 24h) pra assinatura remota</span>
            </span>
          </button>
        </div>
      )}

      {etapa === "assinar-cliente-agora" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setEtapa("escolher-modo")}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>

          <Input label="Nome do cliente" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
          <Input
            label="CPF/CNPJ (opcional)"
            value={documentoCliente}
            onChange={(e) => setDocumentoCliente(e.target.value)}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Assinatura do cliente</p>
            <SignaturePad ref={padClienteRef} />
          </div>

          {erroAssinaturaCliente && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">{erroAssinaturaCliente}</p>
          )}

          <Button type="button" className="w-full" carregando={assinandoCliente} onClick={aoConfirmarAssinaturaCliente}>
            <FileSignature className="h-4 w-4" /> Confirmar assinatura do cliente
          </Button>
        </div>
      )}

      {etapa === "link-gerado" && link && (
        <div className="space-y-4">
          <LinkComQrCode link={link} legenda="Envie este link (ou o QR code) pro cliente assinar no aparelho dele. Válido por 24 horas." />
          <Button type="button" className="w-full" onClick={aoFechar}>Concluir</Button>
        </div>
      )}

      {etapa === "concluido-local" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-brand-600" />
          <p className="font-medium">Ordem de serviço assinada!</p>
          <p className="text-sm text-neutral-500">
            O relatório foi gerado com as duas assinaturas e a OS foi concluída automaticamente.
          </p>
          <Button type="button" className="w-full" onClick={aoFechar}>Fechar</Button>
        </div>
      )}
    </Modal>
  );
}
