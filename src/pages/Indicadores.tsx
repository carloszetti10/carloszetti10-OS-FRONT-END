import { ReactNode, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { CheckCircle2, Clock3, Gauge, RotateCcw } from "lucide-react";
import { useIndicadores } from "@/hooks/useOrdensServico";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatarDuracaoHoras } from "@/utils/formatters";

/**
 * Indicadores de desempenho por consultor/período.
 * A agregação (filtrar concluídas, calcular tempo médio, agrupar por
 * responsável) Esta página só monta o filtro e exibe o resultado.
 */
export default function Indicadores() {
  const { data: funcionarios, isLoading: carregandoFuncionarios } = useFuncionarios({
    somenteAtivos: true,
  });

  const [idConsultor, setIdConsultor] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Mesma regra que existia no front antes de migrar: período considera a
  // DATA DE CONCLUSÃO da OS (dataHoraFim), início do dia até o fim do dia.
  const filtro = useMemo(
    () => ({
      idConsultor: idConsultor === "todos" ? undefined : Number(idConsultor),
      concluidasApartirDe: dataInicio ? `${dataInicio}T00:00:00` : undefined,
      concluidasAte: dataFim ? `${dataFim}T23:59:59` : undefined,
    }),
    [idConsultor, dataInicio, dataFim]
  );

  const { data: indicadores, isLoading: carregandoIndicadores } = useIndicadores(filtro);

  const carregando = carregandoIndicadores || carregandoFuncionarios;

  const filtrosAtivos = idConsultor !== "todos" || !!dataInicio || !!dataFim;

  function limparFiltros() {
    setIdConsultor("todos");
    setDataInicio("");
    setDataFim("");
  }

  const porConsultor = indicadores?.porConsultor ?? [];
  const consultorMaisProdutivo = porConsultor[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Indicadores</h1>
        <p className="text-sm text-neutral-500">
          Desempenho de conclusão das ordens de serviço por consultor e por período
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Consultor"
            value={idConsultor}
            onChange={(e) => setIdConsultor(e.target.value)}
          >
            <option value="todos">Todos os consultores</option>
            {funcionarios?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            label="Concluídas a partir de"
            value={dataInicio}
            max={dataFim || undefined}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <Input
            type="date"
            label="Concluídas até"
            value={dataFim}
            min={dataInicio || undefined}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={limparFiltros}
              disabled={!filtrosAtivos}
            >
              <RotateCcw className="h-4 w-4" /> Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CardIndicador
          icone={<CheckCircle2 className="h-5 w-5" />}
          rotulo="OS concluídas no período"
          valor={carregando ? undefined : String(indicadores?.totalConcluidas ?? 0)}
          cor="brand"
        />
        <CardIndicador
          icone={<Clock3 className="h-5 w-5" />}
          rotulo="Tempo médio de conclusão"
          valor={carregando ? undefined : formatarDuracaoHoras(indicadores?.tempoMedioGeralHoras ?? null)}
          cor="blue"
        />
        <CardIndicador
          icone={<Gauge className="h-5 w-5" />}
          rotulo="Consultor mais produtivo"
          valor={
            carregando
              ? undefined
              : consultorMaisProdutivo
              ? `${consultorMaisProdutivo.nome} (${consultorMaisProdutivo.quantidade})`
              : "—"
          }
          cor="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Gráfico: OS concluídas por consultor */}
        <Card>
          <h2 className="mb-4 font-display font-semibold">OS concluídas por consultor</h2>
          {carregando ? (
            <Skeleton className="h-[240px] w-full" />
          ) : porConsultor.length === 0 ? (
            <EmptyState
              titulo="Nenhuma OS concluída"
              descricao="Não há ordens de serviço concluídas para os filtros selecionados."
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={porConsultor}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-neutral-200 dark:stroke-neutral-800"
                />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(valor: number) => [valor, "OS concluídas"]} />
                <Bar dataKey="quantidade" fill="#22b06b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Tabela: detalhamento por consultor */}
        <Card>
          <h2 className="mb-4 font-display font-semibold">Detalhamento por consultor</h2>
          {carregando ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : porConsultor.length === 0 ? (
            <EmptyState
              titulo="Nenhum dado disponível"
              descricao="Ajuste os filtros para ver o desempenho por consultor."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500 dark:border-neutral-800">
                    <th className="py-2 font-medium">Consultor</th>
                    <th className="py-2 font-medium">OS concluídas</th>
                    <th className="py-2 font-medium">Tempo médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {porConsultor.map((c) => (
                    <tr key={c.idFuncionario}>
                      <td className="py-2.5 font-medium">{c.nome}</td>
                      <td className="py-2.5">{c.quantidade}</td>
                      <td className="py-2.5 text-neutral-600 dark:text-neutral-400">
                        {formatarDuracaoHoras(c.tempoMedioHoras)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  valor?: string;
  cor: "brand" | "amber" | "blue" | "violet";
}) {
  const cores = {
    brand: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  }[cor];

  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cores}`}>{icone}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-neutral-500">{rotulo}</p>
        {valor === undefined ? (
          <Skeleton className="mt-1 h-6 w-16" />
        ) : (
          <p className="truncate font-display text-xl font-bold">{valor}</p>
        )}
      </div>
    </Card>
  );
}
