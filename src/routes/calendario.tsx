import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useSubs } from "@/lib/subs/store";
import { brl, chargesBetween, isActive, monthLabel, monthRange } from "@/lib/subs/calc";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário de cobranças | Assinaturas" },
      {
        name: "description",
        content:
          "Visualize mês a mês todas as cobranças das suas assinaturas, o dia mais caro e o total previsto por semana.",
      },
      { property: "og:title", content: "Calendário de cobranças" },
      {
        property: "og:description",
        content: "Cobranças do mês, dia mais caro, semana mais cara e total previsto por semana.",
      },
    ],
  }),
  component: Calendario,
});

function Calendario() {
  const { subs, settings } = useSubs();
  const [offset, setOffset] = useState(0);
  const hoje = new Date();
  const ref = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
  const { start, end } = monthRange(ref);
  const ativos = subs.filter(isActive);
  const cobrancas = chargesBetween(ativos, settings, start, end);

  const porDia = new Map<number, number>();
  cobrancas.forEach((c) => porDia.set(c.date.getDate(), (porDia.get(c.date.getDate()) ?? 0) + c.amount));
  const maxDia = Math.max(...[...porDia.values()], 0);
  const diaMaisCaro = [...porDia.entries()].sort((a, b) => b[1] - a[1])[0];

  const semanas = [0, 1, 2, 3, 4].map((i) => {
    const total = cobrancas
      .filter((c) => Math.floor((c.date.getDate() - 1) / 7) === i)
      .reduce((t, c) => t + c.amount, 0);
    return { semana: i + 1, total };
  });
  const semanaMaisCara = [...semanas].sort((a, b) => b.total - a.total)[0];

  const primeiroDiaSemana = start.getDay();
  const diasNoMes = end.getDate();
  const celulas = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  return (
    <AppShell title="Calendário" subtitle={monthLabel(ref)}>
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" onClick={() => setOffset((o) => o - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-medium capitalize">{monthLabel(ref)}</p>
        <Button variant="secondary" size="icon" onClick={() => setOffset((o) => o + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <section className="surface-card p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {celulas.map((dia, i) => {
            const total = dia ? (porDia.get(dia) ?? 0) : 0;
            const intensidade = maxDia > 0 ? total / maxDia : 0;
            const ehHoje =
              dia === hoje.getDate() && ref.getMonth() === hoje.getMonth() && ref.getFullYear() === hoje.getFullYear();
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg border text-center text-[11px] leading-tight ${
                  dia ? "border-border" : "border-transparent"
                } ${ehHoje ? "ring-1 ring-primary" : ""}`}
                style={
                  total > 0
                    ? { backgroundColor: `color-mix(in oklab, var(--color-primary) ${15 + intensidade * 45}%, transparent)` }
                    : undefined
                }
              >
                <span className="block pt-1">{dia ?? ""}</span>
                {total > 0 ? (
                  <span className="block text-[9px] font-medium">{Math.round(total)}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="surface-card p-3">
          <p className="text-[11px] text-muted-foreground">Dia mais caro</p>
          <p className="mt-1 text-sm font-semibold">
            {diaMaisCaro ? `Dia ${diaMaisCaro[0]} · ${brl(diaMaisCaro[1])}` : "Sem cobranças"}
          </p>
        </div>
        <div className="surface-card p-3">
          <p className="text-[11px] text-muted-foreground">Semana mais cara</p>
          <p className="mt-1 text-sm font-semibold">
            {semanaMaisCara && semanaMaisCara.total > 0
              ? `Semana ${semanaMaisCara.semana} · ${brl(semanaMaisCara.total)}`
              : "Sem cobranças"}
          </p>
        </div>
      </section>

      <section className="surface-card p-4">
        <p className="text-sm font-medium">Total previsto por semana</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {semanas.map((s) => (
            <li key={s.semana} className="flex justify-between">
              <span>Semana {s.semana}</span>
              <span>{brl(s.total)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Cobranças do mês</p>
          <span className="text-xs text-muted-foreground">
            {brl(cobrancas.reduce((t, c) => t + c.amount, 0))}
          </span>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {cobrancas.map((c, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Dia {String(c.date.getDate()).padStart(2, "0")} — {c.sub.name}
              </span>
              <span className="font-medium">{brl(c.amount)}</span>
            </li>
          ))}
          {cobrancas.length === 0 ? (
            <li className="text-muted-foreground">Nenhuma cobrança prevista neste mês.</li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
