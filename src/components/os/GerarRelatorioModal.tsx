import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, FileSignature, RefreshCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SignaturePad, type SignaturePadHandle } from "@/components/ui/SignaturePad";
import { useIniciarAssinatura } from "@/hooks/useAssinatura";
import { useFuncionarioLogado } from "@/hooks/useFuncionarioLogado";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";
import type { OrdemServico } from "@/types/ordemServico";

interface GerarRelatorioModalProps {
  aberto: boolean;
  aoFechar: () => void;
  ordemServico: OrdemServico;
}

/**
 * Fluxo: 1) funcionário assina (usa a assinatura salva ou desenha uma nova,
 * sempre com a opção de assinar de novo); 2) gera o token/link de 24h;
 * 3) mostra o link + QR code pra mandar pro cliente assinar no aparelho dele.
 */
export function GerarRelatorioModal({ aberto, aoFechar, ordemServico }: GerarRelatorioModalProps) {
  const { data: funcionarioLogado } = useFuncionarioLogado();
  const { mutate: iniciar, isPending, error, data: resultado, reset } = useIniciarAssinatura(ordemServico.idOs);
  const mostrarToast = useToastStore((s) => s.mostrar);

  const [usarAssinaturaSalva, setUsarAssinaturaSalva] = useState(true);
  const [salvarComoPadrao, setSalvarComoPadrao] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);

  const temAssinaturaSalva = !!funcionarioLogado?.assinaturaPadrao;

  useEffect(() => {
    if (aberto) {
      reset();
      setUsarAssinaturaSalva(temAssinaturaSalva);
      setCopiado(false);
      setQrCodeUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const link = resultado ? `${window.location.origin}/assinar/${resultado.token}` : null;

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { margin: 1, width: 220 }).then(setQrCodeUrl).catch(() => setQrCodeUrl(null));
  }, [link]);

  function aoConfirmarAssinatura() {
    const imagem = usarAssinaturaSalva ? funcionarioLogado?.assinaturaPadrao ?? null : padRef.current?.obterBase64() ?? null;

    if (!imagem) {
      mostrarToast("Assine no campo antes de continuar.", "erro");
      return;
    }

    iniciar(
      { imagemAssinaturaFuncionario: imagem, salvarComoPadrao: !usarAssinaturaSalva && salvarComoPadrao },
      { onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro") }
    );
  }

  function copiarLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Gerar Relatório" largura="sm">
      {!resultado ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Assine como responsável técnico. Depois disso, você vai receber um link pra mandar o
            cliente assinar também — o link expira em 24 horas.
          </p>

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
              <SignaturePad ref={padRef} />
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={salvarComoPadrao}
                  onChange={(e) => setSalvarComoPadrao(e.target.checked)}
                />
                Salvar como minha assinatura padrão (usar automaticamente da próxima vez)
              </label>
              {temAssinaturaSalva && (
                <button
                  type="button"
                  onClick={() => setUsarAssinaturaSalva(true)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Usar minha assinatura salva em vez disso
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
              {extrairMensagemErro(error)}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={aoFechar}>Cancelar</Button>
            <Button type="button" carregando={isPending} onClick={aoConfirmarAssinatura}>
              <FileSignature className="h-4 w-4" /> Confirmar e gerar link
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Envie este link (ou o QR code) pro cliente assinar no aparelho dele. Válido por 24 horas.
          </p>

          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR code do link de assinatura" className="mx-auto rounded-lg border border-neutral-200 dark:border-neutral-700" />
          )}

          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-xs dark:border-neutral-700 dark:bg-neutral-800">
            <span className="flex-1 truncate text-neutral-600 dark:text-neutral-300">{link}</span>
            <button onClick={copiarLink} className="shrink-0 rounded-md p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700" title="Copiar link">
              {copiado ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <Button type="button" className="w-full" onClick={aoFechar}>Concluir</Button>
        </div>
      )}
    </Modal>
  );
}
