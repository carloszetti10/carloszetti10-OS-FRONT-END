import { ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useOrdensServico } from "@/hooks/useOrdensServico";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusOsBadge } from "@/components/os/StatusOsBadge";
import { StatusOs, STATUS_OS_LABEL } from "@/types/enums";
import { formatarData } from "@/utils/formatters";
import type { OrdemServico } from "@/types/ordemServico";
import { cn } from "@/utils/cn";

const STATUS_ABERTOS = [StatusOs.Agendada, StatusOs.EmAtendimento];

type Periodo = "24h" | "7d" | "30d";

const PERIODOS: { valor: Periodo; rotulo: string; rotuloCurto: string; horas: number }[] = [
  { valor: "24h", rotulo: "Últimas 24 h", rotuloCurto: "Últimas 24 h", horas: 24 },
  { valor: "7d", rotulo: "Últimos 7 dias", rotuloCurto: "Últimos 7 dias", horas: 24 * 7 },
  { valor: "30d", rotulo: "Últimos 30 dias", rotuloCurto: "Últimos 30 dias", horas: 24 * 30 },
];

const FILTROS_STATUS: { valor: "todos" | StatusOs; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos os status" },
  { valor: StatusOs.Atrasada, rotulo: STATUS_OS_LABEL[StatusOs.Atrasada] },
  { valor: StatusOs.Concluida, rotulo: STATUS_OS_LABEL[StatusOs.Concluida] },
  { valor: StatusOs.Agendada, rotulo: STATUS_OS_LABEL[StatusOs.Agendada] },
  { valor: StatusOs.EmAtendimento, rotulo: STATUS_OS_LABEL[StatusOs.EmAtendimento] },
];

/** Filtra as OS cuja dataHoraInicio caiu dentro das últimas `horas` a partir de agora. */
function filtrarPorPeriodo(ordens: OrdemServico[] | undefined, horas: number, referencia: Date) {
  if (!ordens) return [];
  const limite = referencia.getTime() - horas * 60 * 60 * 1000;
  return ordens.filter((o) => {
    if (!o.dataHoraInicio) return false;
    const t = new Date(o.dataHoraInicio).getTime();
    return !Number.isNaN(t) && t >= limite && t <= referencia.getTime();
  });
}

/** Agrupa as OS do período selecionado em baldes de tempo pro gráfico de volume. */
function gerarSeriesVolume(ordens: OrdemServico[], periodo: Periodo, referencia: Date) {
  const config = {
    "24h": { baldes: 6, passoMs: 4 * 60 * 60 * 1000, formato: (d: Date) => `${String(d.getHours()).padStart(2, "0")}h` },
    "7d": { baldes: 7, passoMs: 24 * 60 * 60 * 1000, formato: (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) },
    "30d": { baldes: 10, passoMs: 3 * 24 * 60 * 60 * 1000, formato: (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) },
  }[periodo];

  const fim = referencia.getTime();
  const inicio = fim - config.baldes * config.passoMs;

  const baldes = Array.from({ length: config.baldes }, (_, i) => {
    const inicioBalde = inicio + i * config.passoMs;
    const fimBalde = inicioBalde + config.passoMs;
    return { inicioBalde, fimBalde, quantidade: 0 };
  });

  for (const os of ordens) {
    if (!os.dataHoraInicio) continue;
    const t = new Date(os.dataHoraInicio).getTime();
    const balde = baldes.find((b) => t >= b.inicioBalde && t < b.fimBalde);
    if (balde) balde.quantidade += 1;
  }

  return baldes.map((b) => ({
    label: config.formato(new Date(b.inicioBalde)),
    quantidade: b.quantidade,
  }));
}

export default function Dashboard() {
  // Lembrete: useOrdensServico já devolve só as OS do funcionário logado
  // (filtro client-side — ver TODO em hooks/useOrdensServico.ts)
  const { data: ordens, isLoading: carregandoOs } = useOrdensServico();

  const [periodo, setPeriodo] = useState<Periodo>("7d");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusOs>("todos");

  const configPeriodo = PERIODOS.find((p) => p.valor === periodo)!;
  const referencia = useMemo(() => new Date(), []);

  // OS que caem dentro do período atualmente selecionado
  const ordensNoPeriodo = useMemo(
    () => filtrarPorPeriodo(ordens, configPeriodo.horas, referencia),
    [ordens, configPeriodo.horas, referencia]
  );

  // Mesma janela de tempo, mas imediatamente anterior — usada só pra calcular a variação (%) do volume
  const ordensPeriodoAnterior = useMemo(() => {
    if (!ordens) return [];
    const fimAnterior = referencia.getTime() - configPeriodo.horas * 60 * 60 * 1000;
    const inicioAnterior = fimAnterior - configPeriodo.horas * 60 * 60 * 1000;
    return ordens.filter((o) => {
      if (!o.dataHoraInicio) return false;
      const t = new Date(o.dataHoraInicio).getTime();
      return !Number.isNaN(t) && t >= inicioAnterior && t < fimAnterior;
    });
  }, [ordens, configPeriodo.horas, referencia]);

  const total = ordensNoPeriodo.length;
  const abertas = ordensNoPeriodo.filter((o) => STATUS_ABERTOS.includes(o.status)).length;
  const concluidas = ordensNoPeriodo.filter((o) => o.status === StatusOs.Concluida).length;
  const atrasadas = ordensNoPeriodo.filter((o) => o.status === StatusOs.Atrasada).length;

  const variacaoVolume =
    ordensPeriodoAnterior.length === 0
      ? total > 0
        ? 100
        : 0
      : Math.round(((total - ordensPeriodoAnterior.length) / ordensPeriodoAnterior.length) * 100);

  const serieVolume = useMemo(
    () => gerarSeriesVolume(ordensNoPeriodo, periodo, referencia),
    [ordensNoPeriodo, periodo, referencia]
  );

  // Lista filtrada pelo dropdown de status, respeitando o período selecionado
  const ordensFiltradas =
    filtroStatus === "todos" ? ordensNoPeriodo : ordensNoPeriodo.filter((o) => o.status === filtroStatus);

  const ultimasOs = [...ordensFiltradas].sort((a, b) => b.idOs - a.idOs).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">Visão Geral</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Acompanhe e gerencie a atividade das suas ordens de serviço.
          </p>
        </div>
        <Link to="/ordens-servico?nova=1">
          <Button>
            <Plus className="h-4 w-4" /> Nova OS
          </Button>
        </Link>
      </div>

      {/* Barra de controles: período + status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl value={periodo} onChange={setPeriodo} opcoes={PERIODOS} />

        <div className="w-full sm:w-56">
          <select
            value={filtroStatus === "todos" ? "todos" : String(filtroStatus)}
            onChange={(e) => setFiltroStatus(e.target.value === "todos" ? "todos" : (Number(e.target.value) as StatusOs))}
            className={cn(
              "h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-soft",
              "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
              "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            )}
          >
            {FILTROS_STATUS.map((f) => (
              <option key={f.rotulo} value={f.valor === "todos" ? "todos" : f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de indicadores (KPIs) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardKpi
          icone={<ClipboardList className="h-4 w-4" />}
          rotulo="Total de OS"
          valor={carregandoOs ? undefined : total}
          badge={{ tipo: "neutro", texto: configPeriodo.rotuloCurto }}
        />
        <CardKpi
          icone={<Clock3 className="h-4 w-4" />}
          rotulo="Em aberto"
          valor={carregandoOs ? undefined : abertas}
          badge={
            abertas > 0
              ? { tipo: "negativo", texto: "Requer atenção" }
              : { tipo: "neutro", texto: configPeriodo.rotuloCurto }
          }
        />
        <CardKpi
          icone={<CheckCircle2 className="h-4 w-4" />}
          rotulo="Concluídas"
          valor={carregandoOs ? undefined : concluidas}
          badge={{ tipo: "positivo", texto: configPeriodo.rotuloCurto }}
        />
        <CardKpi
          icone={<AlertTriangle className="h-4 w-4" />}
          rotulo="Atrasadas"
          valor={carregandoOs ? undefined : atrasadas}
          badge={
            atrasadas > 0
              ? { tipo: "negativo", texto: "Requer atenção" }
              : { tipo: "neutro", texto: configPeriodo.rotuloCurto }
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfico de volume de solicitações */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold">Solicitações</h2>
              <VariacaoBadge valor={variacaoVolume} />
            </div>
            <span className="text-xs text-neutral-500">{configPeriodo.rotuloCurto}</span>
          </div>

          {carregandoOs ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serieVolume} barCategoryGap="28%">
                <defs>
                  <linearGradient id="gradienteVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4bd18d" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0f4831" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  cursor={{ fill: "rgba(34,176,107,0.08)" }}
                  formatter={(valor: number) => [valor, "Solicitações"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="quantidade" fill="url(#gradienteVolume)" radius={[8, 8, 4, 4]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Últimas ordens de serviço */}
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold">Últimas OS</h2>
            <Link to="/ordens-servico" className="text-sm font-medium text-brand-600 hover:underline">
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
            <p className="py-8 text-center text-sm text-neutral-500">Nenhuma OS encontrada para esse filtro.</p>
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

      {/* Distribuição por status */}
      <Card>
        <h2 className="mb-4 font-display font-semibold">Distribuição por status</h2>
        <GraficoStatus ordens={ordensNoPeriodo} carregando={carregandoOs} />
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Segmented control de período                                          */
/* ---------------------------------------------------------------------- */

function SegmentedControl({
  value,
  onChange,
  opcoes,
}: {
  value: Periodo;
  onChange: (v: Periodo) => void;
  opcoes: typeof PERIODOS;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      {opcoes.map((op) => {
        const ativo = op.valor === value;
        return (
          <button
            key={op.valor}
            type="button"
            onClick={() => onChange(op.valor)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              ativo
                ? "border border-brand-200 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
          >
            {op.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Badge de variação percentual (usado no título do gráfico de volume)    */
/* ---------------------------------------------------------------------- */

function VariacaoBadge({ valor }: { valor: number }) {
  const positivo = valor > 0;
  const negativo = valor < 0;
  const Icone = positivo ? TrendingUp : negativo ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        positivo && "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        negativo && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        !positivo && !negativo && "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      )}
    >
      <Icone className="h-3 w-3" />
      {valor > 0 ? "+" : ""}
      {valor}%
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/* Card de KPI (topo do dashboard)                                        */
/* ---------------------------------------------------------------------- */

type BadgeKpi = { tipo: "positivo" | "negativo" | "neutro"; texto: string };

function CardKpi({
  icone,
  rotulo,
  valor,
  badge,
}: {
  icone: ReactNode;
  rotulo: string;
  valor?: number;
  badge: BadgeKpi;
}) {
  const IconeBadge = badge.tipo === "positivo" ? TrendingUp : badge.tipo === "negativo" ? TrendingDown : Minus;
  const corBadge = {
    positivo: "text-brand-600 dark:text-brand-400",
    negativo: "text-red-600 dark:text-red-400",
    neutro: "text-neutral-500",
  }[badge.tipo];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-neutral-500">{rotulo}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
          {icone}
        </div>
      </div>

      {valor === undefined ? (
        <Skeleton className="mt-2 h-7 w-12" />
      ) : (
        <p className="mt-1 font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50 sm:text-3xl">
          {valor}
        </p>
      )}

      <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", corBadge)}>
        <IconeBadge className="h-3.5 w-3.5" />
        <span className="truncate">{badge.texto}</span>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/* Gráfico de distribuição por status                                     */
/* ---------------------------------------------------------------------- */

const CORES_STATUS: Record<StatusOs, string> = {
  [StatusOs.Agendada]: "#3b82f6",
  [StatusOs.EmAtendimento]: "#f59e0b",
  [StatusOs.Concluida]: "#22b06b",
  [StatusOs.Cancelada]: "#a3a3a3",
  [StatusOs.Atrasada]: "#ef4444",
};

function GraficoStatus({ ordens, carregando }: { ordens: OrdemServico[]; carregando: boolean }) {
  const dados = Object.values(StatusOs)
    .filter((v): v is StatusOs => typeof v === "number")
    .map((status) => ({
      status: STATUS_OS_LABEL[status],
      quantidade: ordens.filter((o) => o.status === status).length,
      cor: CORES_STATUS[status],
    }));

  if (carregando) return <Skeleton className="h-[200px] w-full" />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="status" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
        <Tooltip formatter={(valor: number) => [valor, "OS"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey="quantidade" radius={[0, 8, 8, 0]} maxBarSize={22}>
          {dados.map((d) => (
            <Cell key={d.status} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
