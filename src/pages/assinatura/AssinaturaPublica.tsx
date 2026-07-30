import { useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { CheckCircle2, Download, FileSignature, ShieldAlert, Wrench } from "lucide-react";
import { useAssinaturaPublica, useSubmeterAssinaturaCliente } from "@/hooks/useAssinatura";
import { SignaturePad, type SignaturePadHandle } from "@/components/ui/SignaturePad";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TelaCarregando } from "@/components/ui/Spinner";
import { gerarPdfOs, uint8ArrayParaBase64, base64ParaUint8Array } from "@/utils/gerarPdfOs";
import { formatarDataHora } from "@/utils/formatters";
import { extrairMensagemErro } from "@/utils/errorHandler";

/**
 * Página PÚBLICA (fora do ProtectedRoute) — é o que o cliente abre pelo
 * link/QR code enviado pelo funcionário. Não precisa estar logado no sistema.
 */
export default function AssinaturaPublica() {
  const { token } = useParams<{ token: string }>();
  const { data: dados, isLoading, isError, error } = useAssinaturaPublica(token);
  const { mutateAsync: submeter, isPending } = useSubmeterAssinaturaCliente(token ?? "");

  const padRef = useRef<SignaturePadHandle>(null);
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [pdfGeradoBase64, setPdfGeradoBase64] = useState<string | null>(null);

  async function aoAssinar() {
    setErroEnvio(null);

    if (!nome.trim()) {
      setErroEnvio("Informe seu nome completo.");
      return;
    }
    const assinaturaCliente = padRef.current?.obterBase64();
    if (!assinaturaCliente) {
      setErroEnvio("Assine no campo indicado antes de continuar.");
      return;
    }
    if (!dados) return;

    try {
      const pdfBytes = await gerarPdfOs({
        idOs: dados.idOs,
        tituloOs: dados.tituloOs,
        nomeTipoAtendimento: dados.nomeTipoAtendimento,
        nomeCliente: dados.nomeCliente,
        documentoCliente: dados.documentoCliente,
        dataHoraInicio: dados.dataHoraInicio,
        dataHoraFim: dados.dataHoraFim,
        descricao: dados.descricao,
        relatorioTecnico: dados.relatorioTecnico || "",
        nomeFuncionario: dados.nomeFuncionario,
        assinaturaFuncionarioBase64: dados.assinaturaFuncionarioBase64,
        nomeSignatarioCliente: nome,
        assinaturaClienteBase64: assinaturaCliente,
        dataAssinaturaCliente: new Date().toISOString(),
      });
      const pdfBase64 = uint8ArrayParaBase64(pdfBytes);

      await submeter({
        nomeSignatario: nome,
        documentoSignatario: documento || undefined,
        imagemAssinatura: assinaturaCliente,
        arquivoPdf: pdfBase64,
      });

      setPdfGeradoBase64(pdfBase64);
      setConcluido(true);
    } catch (erro) {
      setErroEnvio(extrairMensagemErro(erro));
    }
  }

  function baixarPdf() {
    if (!pdfGeradoBase64) return;
    // Blob URL em vez de data: URI — o atributo "download" e URIs gigantes
    // não são confiáveis no Safari/Chrome mobile; Blob URL abre/baixa direito.
    const bytes = base64ParaUint8Array(pdfGeradoBase64);
    //const blob = new Blob([bytes], { type: "application/pdf" });
    const blob = new Blob([bytes.buffer as ArrayBuffer], {type: "application/pdf",});
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 py-10 dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <Wrench className="h-5 w-5" />
          </div>
          <h1 className="font-display text-xl font-bold">Assinatura de Ordem de Serviço</h1>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card dark:border-neutral-800 dark:bg-neutral-900">
          {isLoading && <TelaCarregando />}

          {isError && (
            <EstadoErro mensagem={extrairMensagemErro(error)} status={(error as AxiosError)?.response?.status} />
          )}

          {!isLoading && !isError && dados?.jaAssinadoPeloCliente && !concluido && (
            <EstadoInfo
              icone={<CheckCircle2 className="h-8 w-8 text-brand-600" />}
              titulo="Esta OS já foi assinada"
              mensagem="O cliente já confirmou a assinatura desta ordem de serviço anteriormente."
            />
          )}

          {!isLoading && !isError && dados && !dados.jaAssinadoPeloCliente && !concluido && (
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="font-medium">{dados.tituloOs}</p>
                <p className="text-neutral-500">{dados.nomeCliente} · {dados.documentoCliente}</p>
                <p className="text-neutral-500">
                  Início: {formatarDataHora(dados.dataHoraInicio)} · Consultor: {dados.nomeFuncionario}
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">Relatório</p>
                <p className="whitespace-pre-wrap">{dados.relatorioTecnico || dados.descricao || "—"}</p>
              </div>

              <Input label="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
              <Input
                label="CPF/CNPJ"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
              />

              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Sua assinatura</p>
                <SignaturePad ref={padRef} />
              </div>

              {erroEnvio && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">{erroEnvio}</p>
              )}

              <Button type="button" className="w-full" carregando={isPending} onClick={aoAssinar}>
                <FileSignature className="h-4 w-4" /> Confirmar assinatura
              </Button>
            </div>
          )}

          {concluido && (
            <div className="space-y-4">
              <EstadoInfo
                icone={<CheckCircle2 className="h-8 w-8 text-brand-600" />}
                titulo="Assinatura confirmada!"
                mensagem="Obrigado. A ordem de serviço assinada já foi enviada de volta pra empresa."
              />
              <Button type="button" variant="secondary" className="w-full" onClick={baixarPdf}>
                <Download className="h-4 w-4" /> Baixar meu comprovante em PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EstadoInfo({ icone, titulo, mensagem }: { icone: ReactNode; titulo: string; mensagem: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      {icone}
      <p className="font-medium">{titulo}</p>
      <p className="text-sm text-neutral-500">{mensagem}</p>
    </div>
  );
}

function EstadoErro({ mensagem, status }: { mensagem: string; status?: number }) {
  return (
    <EstadoInfo
      icone={<ShieldAlert className="h-8 w-8 text-red-500" />}
      titulo={status === 404 ? "Link inválido" : "Não foi possível abrir este link"}
      mensagem={mensagem}
    />
  );
}
