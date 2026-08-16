import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { ClipboardList, CheckCircle2, Users, UserCog, Plus } from "lucide-react";
import { useOrdensServico } from "@/hooks/useOrdensServico";
import { useClientes } from "@/hooks/useClientes";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusOsBadge } from "@/components/os/StatusOsBadge";
import { StatusOs, STATUS_OS_LABEL } from "@/types/enums";
import { formatarData } from "@/utils/formatters";

const STATUS_ABERTOS = [StatusOs.Agendada, StatusOs.EmAtendimento, StatusOs.Atrasada];

export default function Dashboard() {
  // Lembrete: useOrdensServico já devolve só as OS do funcionário logado
  // (filtro client-side — ver TODO em hooks/useOrdensServico.ts)
  const { data: ordens, isLoading: carregandoOs } = useOrdensServico();
  const { data: clientes } = useClientes({ somenteAtivos: true });
  const { data: funcionarios } = useFuncionarios({ somenteAtivos: true });

  const abertas = ordens?.filter((o) => STATUS_ABERTOS.includes(o.status)).length ?? 0;
  const concluidas = ordens?.filter((o) => o.status === StatusOs.Concluida).length ?? 0;

  const dadosGrafico = Object.values(StatusOs)
    .filter((v): v is StatusOs => typeof v === "number")
    .map((status) => ({
      status: STATUS_OS_LABEL[status],
      quantidade: ordens?.filter((o) => o.status === status).length ?? 0,
    }));

  const ultimasOs = [...(ordens ?? [])]
    .sort((a, b) => b.idOs - a.idOs)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Visão geral</h1>
          <p>Estatísticas das suas OS.</p>
        </div>
        <Link to="/ordens-servico?nova=1">
          <Button>
            <Plus className="h-4 w-4" /> Nova OS
          </Button>
        </Link>
      </div>

      {/* Cards de indicadores. "Técnicos" não vira card separado porque no
          back não existe entidade própria — é apenas um TipoUsuario dentro
          de Funcionário, então o card de Funcionários já cobre isso. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardIndicador
          icone={<ClipboardList className="h-5 w-5" />}
          rotulo="OS em aberto"
          valor={carregandoOs ? undefined : abertas}
          cor="amber"
        />
        <CardIndicador
          icone={<CheckCircle2 className="h-5 w-5" />}
          rotulo="OS concluídas"
          valor={carregandoOs ? undefined : concluidas}
          cor="brand"
        />
        <CardIndicador
          icone={<Users className="h-5 w-5" />}
          rotulo="Clientes ativos"
          valor={clientes?.length}
          cor="blue"
        />
        <CardIndicador
          icone={<UserCog className="h-5 w-5" />}
          rotulo="Funcionários ativos"
          valor={funcionarios?.length}
          cor="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 font-display font-semibold">OS por status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#22b06b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold">Últimas ordens de serviço</h2>
            <Link to="/ordens-servico" className="text-sm text-brand-600 hover:underline">
              Ver todas
            </Link>
          </div>

          {carregandoOs ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : ultimasOs.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">Nenhuma OS vinculada a você ainda.</p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ultimasOs.map((os) => (
                <Link
                  key={os.idOs}
                  to={`/ordens-servico/${os.idOs}`}
                  className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{os.tituloOs}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {os.nomeCliente} · {formatarData(os.dataHoraInicio)}
                    </p>
                  </div>
                  <StatusOsBadge status={os.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function CardIndicador({
  icone,
  rotulo,
  valor,
  cor,
}: {
  icone: ReactNode;
  rotulo: string;
  valor?: number;
  cor: "brand" | "amber" | "blue" | "violet";
}) {
  const cores = {
    brand: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  }[cor];

  return (
    <Card className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${cores}`}>{icone}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-neutral-500">{rotulo}</p>
        {valor === undefined ? (
          <Skeleton className="mt-1 h-6 w-10" />
        ) : (
          <p className="font-display text-xl font-bold sm:text-2xl">{valor}</p>
        )}
      </div>
    </Card>
  );
}
