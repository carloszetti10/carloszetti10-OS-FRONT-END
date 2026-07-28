import { useEffect } from "react";
import { Camera } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LinkComQrCode } from "./LinkComQrCode";
import { useIniciarFotos } from "@/hooks/useFotos";
import { useToastStore } from "@/stores/toastStore";
import { extrairMensagemErro } from "@/utils/errorHandler";

interface GerarLinkFotosModalProps {
  aberto: boolean;
  aoFechar: () => void;
  idOs: number;
}

/**
 * Gera um link/QR code separado do de assinatura — pro CONSULTOR abrir num
 * segundo aparelho (o celular dele, por exemplo, enquanto o tablet está com
 * o cliente assinando) e tirar fotos do atendimento. Válido por 2h.
 */
export function GerarLinkFotosModal({ aberto, aoFechar, idOs }: GerarLinkFotosModalProps) {
  const { mutate: iniciar, isPending, error, data: resultado, reset } = useIniciarFotos(idOs);
  const mostrarToast = useToastStore((s) => s.mostrar);

  useEffect(() => {
    if (aberto) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const link = resultado ? `${window.location.origin}/fotos/${resultado.token}` : null;

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Registrar fotos do atendimento" largura="sm">
      {!link ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Gera um link separado (válido por 2 horas) pra você abrir a câmera em outro aparelho — útil
            quando o aparelho principal está sendo usado pra assinatura do cliente.
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">
              {extrairMensagemErro(error)}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={aoFechar}>Cancelar</Button>
            <Button
              type="button"
              carregando={isPending}
              onClick={() => iniciar(undefined, { onError: (erro) => mostrarToast(extrairMensagemErro(erro), "erro") })}
            >
              <Camera className="h-4 w-4" /> Gerar link de fotos
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <LinkComQrCode link={link} legenda="Abra este link no aparelho que vai tirar as fotos." />
          <Button type="button" className="w-full" onClick={aoFechar}>Concluir</Button>
        </div>
      )}
    </Modal>
  );
}
