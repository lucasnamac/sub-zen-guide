import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Bell, Plus, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSubs } from "@/lib/subs/store";
import {
  brl,
  chargesBetween,
  daysUntil,
  isActive,
  monthLabel,
  monthShort,
  monthTotal,
  monthlyCost,
} from "@/lib/subs/calc";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Assinaturas | Painel de gastos recorrentes" },
      {
        name: "description",
        content:
          "Controle todas as suas assinaturas em um só lugar: gasto mensal, próximas cobranças, metas e alertas de renovação.",
      },
      { property: "og:title", content: "Assinaturas | Painel de gastos recorrentes" },
      {
        property: "og:description",
        content: "Gasto mensal, próximas cobranças, metas de economia e alertas de renovação.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { subs, settings, ready } = useSubs();
  const ativos = subs.filter(isActive);
  const now = new Date();
  const proximoMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const totalMes = monthTotal(ativos, settings, now);
  const totalProximo = monthTotal(ativos, settings, proximoMes);
  const totalAno = ativos.reduce((t, s) => t + monthlyCost(s, settings) * 12, 0);

  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const proximas = chargesBetween(ativos, settings, now, in7);
  const proxima = chargesBetween(ativos, settings, now, new Date(now.getFullYear(), now.getMonth() + 3, 1))[0];

  const historico = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: monthShort(d), total: monthTotal(ativos, settings, d) };
  });
  const maxHist = Math.max(...historico.map((h) => h.total), 1);
  const mesAnterior = historico[4]?.total ?? 0;
  const variacao = mesAnterior > 0 ? ((totalMes - mesAnterior) / mesAnterior) * 100 : 0;

  const trials = subs.filter((s) => s.trial && isActive(s));
  const metaPct = settings.monthlyGoal > 0 ? Math.min(100, (totalMes / settings.monthlyGoal) * 100) : 0;

  if (!ready) return <AppShell title="Início">{null}</AppShell>;

  return (
    <AppShell
      title="Início"
      subtitle={monthLabel(now)}
      action={
        <SubscriptionForm
          trigger={
            <Button size="sm" className="gap-1 rounded-full">
              <Plus className="size-4" /> Nova
            </Button>
          }
        />
      }
    >
      <section className="hero-gradient relative overflow-hidden rounded-3xl border border-border p-5 shadow-card">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Total gasto no mês</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">{brl(totalMes)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {variacao === 0
            ? "Estável em relação ao mês anterior"
            : `${variacao > 0 ? "Aumento" : "Redução"} de ${Math.abs(variacao).toFixed(1)}% frente ao mês anterior`}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Mini label="Próximo mês" value={brl(totalProximo)} />
          <Mini label="Total no ano" value={brl(totalAno)} />
          <Mini label="Ativas" value={String(ativos.length)} />
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Meta mensal</p>
          <span className="text-xs text-muted-foreground">
            {brl(totalMes)} de {brl(settings.monthlyGoal)}
          </span>
        </div>
        <Progress value={metaPct} className="mt-3 h-2.5" />
        <p className="mt-2 text-xs text-muted-foreground">
          {totalMes <= settings.monthlyGoal
            ? `Restam ${brl(settings.monthlyGoal - totalMes)} dentro da meta.`
            : `Você ultrapassou a meta em ${brl(totalMes - settings.monthlyGoal)}.`}
        </p>
      </section>

      {trials.length > 0 ? (
        <section className="surface-card border-warning/40 bg-warning/10 p-4">
          <div className="flex items-center gap-2 text-warning">
            <TriangleAlert className="size-4" />
            <p className="text-sm font-medium">Períodos gratuitos em andamento</p>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {trials.map((t) => (
              <li key={t.id}>
                {t.name}: cobrança começa em {daysUntil(t.trialChargeDate ?? t.nextCharge)} dia(s) por{" "}
                {brl(t.amount)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="surface-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Próxima cobrança</p>
          <Bell className="size-4 text-muted-foreground" />
        </div>
        {proxima ? (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">{proxima.sub.name}</p>
              <p className="text-xs text-muted-foreground">
                {proxima.date.toLocaleDateString("pt-BR")} · em {daysUntil(proxima.sub.nextCharge)} dia(s)
              </p>
            </div>
            <p className="text-lg font-semibold text-primary">{brl(proxima.amount)}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma cobrança prevista.</p>
        )}
      </section>

      <section className="surface-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Próximos 7 dias</p>
          <Badge variant="secondary">{brl(proximas.reduce((t, c) => t + c.amount, 0))}</Badge>
        </div>
        <ul className="mt-3 space-y-2">
          {proximas.length === 0 ? (
            <li className="text-sm text-muted-foreground">Sem cobranças nesta semana.</li>
          ) : (
            proximas.map((c, i) => (
              <li key={`${c.sub.id}-${i}`} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {c.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {c.sub.name}
                </span>
                <span className="font-medium">{brl(c.amount)}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Últimos 6 meses</p>
        <div className="mt-4 flex h-32 items-end gap-2">
          {historico.map((h) => (
            <div key={h.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className="accent-gradient w-full rounded-t-lg"
                style={{ height: `${Math.max(6, (h.total / maxHist) * 100)}%` }}
              />
              <span className="text-[10px] capitalize text-muted-foreground">{h.label}</span>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/raio-x"
        className="surface-card flex items-center justify-between p-4 text-sm font-medium transition-colors hover:bg-accent"
      >
        Ver o Raio-X das suas assinaturas
        <ArrowUpRight className="size-4 text-primary" />
      </Link>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/60 px-2 py-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
