import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check } from "lucide-react";

interface LinkComQrCodeProps {
  link: string;
  legenda: string;
}

/** Mostra um link + QR code + botão de copiar. Usado tanto pro link de
 * assinatura do cliente quanto pro link de fotos do atendimento. */
export function LinkComQrCode({ link, legenda }: LinkComQrCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(link, { margin: 1, width: 220 }).then(setQrCodeUrl).catch(() => setQrCodeUrl(null));
  }, [link]);

  function copiar() {
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{legenda}</p>

      {qrCodeUrl && (
        <img
          src={qrCodeUrl}
          alt="QR code"
          className="mx-auto rounded-lg border border-neutral-200 dark:border-neutral-700"
        />
      )}

      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-xs dark:border-neutral-700 dark:bg-neutral-800">
        <span className="flex-1 truncate text-neutral-600 dark:text-neutral-300">{link}</span>
        <button
          onClick={copiar}
          className="shrink-0 rounded-md p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          title="Copiar link"
        >
          {copiado ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
