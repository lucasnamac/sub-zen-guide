import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, Lightbulb } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSubs } from "@/lib/subs/store";
import { brl, isActive, monthTotal, monthlyCost } from "@/lib/subs/calc";
import { buildInsights, healthScore } from "@/lib/subs/insights";
import { USAGES } from "@/lib/subs/types";

export const Route = createFileRoute("/raio-x")({
  head: () => ({
    meta: [
      { title: "Raio-X das assinaturas | Score e simulador" },
      {
        name: "description",
        content:
          "Score de saúde das assinaturas, insights automáticos, detecção de serviços pouco usados e simulador de cancelamento.",
      },
      { property: "og:title", content: "Raio-X das assinaturas" },
      {
        property: "og:description",
        content: "Score financeiro, insights automáticos e simulação de economia ao cancelar assinaturas.",
      },
    ],
  }),
  component: RaioX,
});

function RaioX() {
  const { subs, settings } = useSubs();
  const ativos = subs.filter(isActive);
  const saude = healthScore(subs, settings);
  const insights = buildInsights(subs, settings);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  const economiaMensal = ativos
    .filter((s) => selecionadas.includes(s.id))
    .reduce((t, s) => t + monthlyCost(s, settings), 0);

  const gastoMes = monthTotal(ativos, settings, new Date());
  const cor = saude.score >= 75 ? "text-success" : saude.score >= 50 ? "text-warning" : "text-destructive";

  return (
    <AppShell title="Raio-X" subtitle="Saúde financeira das suas assinaturas">
      <section className="hero-gradient rounded-3xl border border-border p-5 shadow-card">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Score de assinaturas</p>
        <p className={`mt-1 text-5xl font-semibold ${cor}`}>{saude.score}<span className="text-2xl text-muted-foreground">/100</span></p>
        <Progress value={saude.score} className="mt-4 h-2.5" />
        <ul className="mt-4 space-y-1.5 text-sm">
          <Check ok={gastoMes <= settings.monthlyGoal} text={`Gasto mensal de ${brl(gastoMes)} frente à meta de ${brl(settings.monthlyGoal)}`} />
          <Check ok={saude.ociosas.length === 0} text={`${saude.ociosas.length} serviço(s) pouco utilizado(s)`} />
          <Check ok={saude.aumentoMedio < 5} text={`Aumento médio de preços de ${saude.aumentoMedio.toFixed(1)}%`} />
          <Check ok={saude.ativos <= settings.maxSubscriptions} text={`${saude.ativos} assinaturas ativas (limite de ${settings.maxSubscriptions})`} />
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Potencial de economia: <span className="font-semibold text-primary">{brl(saude.potencialEconomia)}</span> por ano
        </p>
      </section>

      <section className="surface-card p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-primary" />
          <p className="text-sm font-medium">Insights automáticos</p>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {insights.map((i) => (
            <li
              key={i.id}
              className={`rounded-xl border px-3 py-2 ${
                i.tone === "alerta"
                  ? "border-warning/40 bg-warning/10"
                  : i.tone === "positivo"
                    ? "border-success/40 bg-success/10"
                    : "border-border"
              }`}
            >
              {i.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Simulador de cancelamento</p>
        <p className="text-xs text-muted-foreground">Selecione as assinaturas para calcular a economia.</p>
        <ul className="mt-3 space-y-2">
          {ativos.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={selecionadas.includes(s.id)}
                  onCheckedChange={(v) =>
                    setSelecionadas((prev) => (v ? [...prev, s.id] : prev.filter((x) => x !== s.id)))
                  }
                />
                <span>{s.name}</span>
              </label>
              <span className="text-muted-foreground">{brl(monthlyCost(s, settings))}/mês</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Economia mensal</p>
            <p className="text-lg font-semibold text-primary">{brl(economiaMensal)}</p>
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Economia anual</p>
            <p className="text-lg font-semibold text-primary">{brl(economiaMensal * 12)}</p>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Assinaturas pouco utilizadas</p>
        <ul className="mt-3 space-y-2 text-sm">
          {saude.ociosas.length === 0 ? (
            <li className="text-muted-foreground">Todas as assinaturas ativas têm uso frequente.</li>
          ) : (
            saude.ociosas.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">{s.name}</span>
                <Badge variant="outline">{USAGES.find((u) => u.value === s.usage)?.label}</Badge>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Se eu continuar com todas as assinaturas</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Você possui {saude.ativos} assinaturas ativas. O gasto estimado é de{" "}
          <span className="font-semibold text-foreground">{brl(gastoMes)}</span> por mês e{" "}
          <span className="font-semibold text-foreground">
            {brl(ativos.reduce((t, s) => t + monthlyCost(s, settings) * 12, 0))}
          </span>{" "}
          por ano.
        </p>
      </section>
    </AppShell>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
      )}
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}
