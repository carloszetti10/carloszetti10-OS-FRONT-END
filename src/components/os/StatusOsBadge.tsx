import { Badge } from "@/components/ui/Badge";
import { StatusOs, STATUS_OS_LABEL } from "@/types/enums";

const CORES: Record<StatusOs, "verde" | "azul" | "amarelo" | "vermelho" | "cinza"> = {
  [StatusOs.Agendada]: "azul",
  [StatusOs.EmAtendimento]: "amarelo",
  [StatusOs.Concluida]: "verde",
  [StatusOs.Cancelada]: "cinza",
  [StatusOs.Atrasada]: "vermelho",
};

export function StatusOsBadge({ status }: { status: StatusOs }) {
  return <Badge cor={CORES[status]}>{STATUS_OS_LABEL[status]}</Badge>;
}
