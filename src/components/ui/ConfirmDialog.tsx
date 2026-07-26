import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  confirmando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  /** Texto do botão de confirmação. Padrão: "Excluir" (uso mais comum) */
  textoConfirmar?: string;
  /** Estilo do botão/ícone: "danger" pra ações destrutivas, "padrao" pra outras confirmações */
  variante?: "danger" | "padrao";
}

/** Diálogo de confirmação genérico — usado tanto pra ações destrutivas (excluir) quanto outras que merecem uma parada antes de executar (ex.: concluir uma OS). */
export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  confirmando,
  aoConfirmar,
  aoCancelar,
  textoConfirmar = "Excluir",
  variante = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal aberto={aberto} aoFechar={aoCancelar} titulo={titulo} largura="sm">
      <div className="flex gap-3">
        <div
          className={
            variante === "danger"
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950"
          }
        >
          {variante === "danger" ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{mensagem}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={aoCancelar} disabled={confirmando}>
          Cancelar
        </Button>
        <Button variant={variante === "danger" ? "danger" : "primary"} onClick={aoConfirmar} carregando={confirmando}>
          {textoConfirmar}
        </Button>
      </div>
    </Modal>
  );
}
