import { useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { Camera, CheckCircle2, ShieldAlert, Trash2, Wrench, Upload } from "lucide-react";
import { useFotosPublica, useSalvarFotos } from "@/hooks/useFotos";
import { Button } from "@/components/ui/Button";
import { TelaCarregando } from "@/components/ui/Spinner";
import { gerarPdfFotos } from "@/utils/gerarPdfFotos";
import { uint8ArrayParaBase64 } from "@/utils/gerarPdfOs";
import { extrairMensagemErro } from "@/utils/errorHandler";

/**
 * Página PÚBLICA (fora do ProtectedRoute) — o consultor abre isso num
 * segundo aparelho (o celular dele, por exemplo) pra tirar fotos do
 * atendimento sem depender do aparelho que está com o cliente assinando.
 */
export default function RegistrarFotos() {
  const { token } = useParams<{ token: string }>();
  const { data: dados, isLoading, isError, error } = useFotosPublica(token);
  const { mutateAsync: salvar, isPending } = useSalvarFotos(token ?? "");

  const inputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);

  function aoSelecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    arquivos.forEach((arquivo) => {
      const leitor = new FileReader();
      leitor.onload = () => {
        if (typeof leitor.result === "string") {
          setFotos((atual) => [...atual, leitor.result as string]);
        }
      };
      leitor.readAsDataURL(arquivo);
    });
    e.target.value = ""; // permite selecionar a mesma foto de novo depois de remover
  }

  function removerFoto(indice: number) {
    setFotos((atual) => atual.filter((_, i) => i !== indice));
  }

  async function aoEnviar() {
    setErroEnvio(null);
    if (fotos.length === 0) {
      setErroEnvio("Tire ou selecione ao menos uma foto antes de enviar.");
      return;
    }
    if (!dados) return;

    try {
      const pdfBytes = await gerarPdfFotos({
        idOs: dados.idOs,
        tituloOs: dados.tituloOs,
        nomeCliente: dados.nomeCliente,
        fotos: fotos.map((dataUrl) => ({ dataUrl })),
      });
      const pdfBase64 = uint8ArrayParaBase64(pdfBytes);

      await salvar({ arquivoPdfFotos: pdfBase64 });
      setConcluido(true);
    } catch (erro) {
      setErroEnvio(extrairMensagemErro(erro));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 py-10 dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <Wrench className="h-5 w-5" />
          </div>
          <h1 className="font-display text-xl font-bold">Fotos do Atendimento</h1>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card dark:border-neutral-800 dark:bg-neutral-900">
          {isLoading && <TelaCarregando />}

          {isError && (
            <EstadoInfo
              icone={<ShieldAlert className="h-8 w-8 text-red-500" />}
              titulo={(error as AxiosError)?.response?.status === 404 ? "Link inválido" : "Não foi possível abrir este link"}
              mensagem={extrairMensagemErro(error)}
            />
          )}

          {!isLoading && !isError && dados && !concluido && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">{dados.tituloOs}</p>
                <p className="text-neutral-500">{dados.nomeCliente}</p>
              </div>

              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {fotos.map((foto, indice) => (
                    <div key={indice} className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <img src={foto} alt={`Foto ${indice + 1}`} className="h-full w-full object-cover" />
                      <button
                        onClick={() => removerFoto(indice)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={aoSelecionarArquivos}
              />
              <Button type="button" variant="secondary" className="w-full" onClick={() => inputRef.current?.click()}>
                <Camera className="h-4 w-4" /> {fotos.length > 0 ? "Tirar mais fotos" : "Tirar foto"}
              </Button>

              {erroEnvio && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950">{erroEnvio}</p>
              )}

              <Button type="button" className="w-full" carregando={isPending} onClick={aoEnviar} disabled={fotos.length === 0}>
                <Upload className="h-4 w-4" /> Enviar fotos ({fotos.length})
              </Button>
            </div>
          )}

          {concluido && (
            <EstadoInfo
              icone={<CheckCircle2 className="h-8 w-8 text-brand-600" />}
              titulo="Fotos enviadas!"
              mensagem="O PDF com as fotos do atendimento já foi salvo na Ordem de Serviço."
            />
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
