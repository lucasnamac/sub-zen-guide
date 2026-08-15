import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { useSubs } from "@/lib/subs/store";
import { brl, isActive, monthShort, monthTotal, monthlyCost, priceChange } from "@/lib/subs/calc";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios de assinaturas | Gastos por categoria" },
      {
        name: "description",
        content:
          "Gastos por categoria, evolução mensal, assinaturas mais caras, reajustes e projeção de gastos para 12 meses.",
      },
      { property: "og:title", content: "Relatórios de assinaturas" },
      {
        property: "og:description",
        content: "Categorias, evolução mensal, reajustes e projeção anual dos seus gastos recorrentes.",
      },
    ],
  }),
  component: Relatorios,
});

const CORES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Relatorios() {
  const { subs, settings } = useSubs();
  const ativos = subs.filter(isActive);
  const now = new Date();

  const porCategoria = Object.entries(
    ativos.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + monthlyCost(s, settings);
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  const evolucao = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      mes: monthShort(d),
      total: Number(monthTotal(ativos, settings, d).toFixed(2)),
      tipo: i < 6 ? "real" : "projeção",
    };
  });

  const maisCaras = [...ativos]
    .sort((a, b) => monthlyCost(b, settings) - monthlyCost(a, settings))
    .slice(0, 5)
    .map((s) => ({ name: s.name, valor: Number(monthlyCost(s, settings).toFixed(2)) }));

  const reajustes = ativos
    .map((s) => ({ sub: s, variacao: priceChange(s) }))
    .filter((r) => r.variacao !== 0)
    .sort((a, b) => b.variacao - a.variacao);

  const mediaMensal = evolucao.slice(0, 6).reduce((t, e) => t + e.total, 0) / 6;
  const gastoMes = monthTotal(ativos, settings, now);
  const mesAnterior = monthTotal(ativos, settings, new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const projecaoAnual = ativos.reduce((t, s) => t + monthlyCost(s, settings) * 12, 0);

  return (
    <AppShell title="Relatórios" subtitle="Análise dos seus gastos recorrentes">
      <section className="grid grid-cols-2 gap-3">
        <Card label="Média mensal (6 meses)" value={brl(mediaMensal)} />
        <Card label="Gasto do mês" value={brl(gastoMes)} />
        <Card
          label="Comparação com mês anterior"
          value={
            mesAnterior > 0
              ? `${gastoMes >= mesAnterior ? "+" : ""}${(((gastoMes - mesAnterior) / mesAnterior) * 100).toFixed(1)}%`
              : "-"
          }
        />
        <Card label="Projeção para 12 meses" value={brl(projecaoAnual)} />
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Gastos por categoria</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={porCategoria} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                {porCategoria.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                formatter={(v: number) => brl(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {porCategoria.map((c, i) => (
            <li key={c.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ background: CORES[i % CORES.length] }} />
                {c.name}
              </span>
              <span className="font-medium">{brl(c.value)}/mês</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Evolução e projeção mensal</p>
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucao}>
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={10} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                formatter={(v: number) => brl(v)}
              />
              <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground">Os seis últimos pontos são projeções com base nas assinaturas ativas.</p>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Assinaturas mais caras</p>
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maisCaras} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" hide />
              <Tooltip
                cursor={{ fill: "var(--color-accent)" }}
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }}
                formatter={(v: number) => brl(v)}
              />
              <Bar dataKey="valor" fill="var(--color-primary)" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-1 text-sm">
          {maisCaras.map((m) => (
            <li key={m.name} className="flex justify-between text-muted-foreground">
              <span>{m.name}</span>
              <span className="font-medium text-foreground">{brl(m.valor)}/mês</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Histórico de reajustes</p>
        <ul className="mt-2 space-y-2 text-sm">
          {reajustes.length === 0 ? (
            <li className="text-muted-foreground">Nenhum reajuste registrado.</li>
          ) : (
            reajustes.map(({ sub, variacao }) => (
              <li key={sub.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">{sub.name}</span>
                <span className={variacao > 0 ? "font-medium text-warning" : "font-medium text-success"}>
                  {variacao > 0 ? "+" : ""}
                  {variacao.toFixed(1)}%
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
