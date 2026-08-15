import type { Settings, Subscription } from "./types";
import {
  brl,
  chargesBetween,
  daysUntil,
  isActive,
  monthTotal,
  monthlyCost,
  priceChange,
} from "./calc";

export type Insight = {
  id: string;
  tone: "info" | "alerta" | "positivo";
  text: string;
};

export function buildInsights(subs: Subscription[], s: Settings): Insight[] {
  const ativos = subs.filter(isActive);
  const out: Insight[] = [];
  const now = new Date();

  const byCat = new Map<string, number>();
  ativos.forEach((x) => byCat.set(x.category, (byCat.get(x.category) ?? 0) + 1));
  for (const [cat, n] of byCat) {
    if (n >= 2) out.push({ id: `cat-${cat}`, tone: "info", text: `Você possui ${n} assinaturas de ${cat}.` });
  }

  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const proximas = chargesBetween(ativos, s, now, in7);
  const total7 = proximas.reduce((t, c) => t + c.amount, 0);
  if (total7 > 0) {
    out.push({
      id: "7dias",
      tone: proximas.length > 2 ? "alerta" : "info",
      text: `Você terá ${brl(total7)} em cobranças nos próximos 7 dias (${proximas.length} cobranças).`,
    });
  }

  const seisMesesAtras = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const antes = monthTotal(ativos, s, seisMesesAtras);
  const agora = monthTotal(ativos, s, now);
  const variacaoPreco = ativos.reduce((t, x) => t + priceChange(x), 0) / (ativos.length || 1);
  if (variacaoPreco > 1) {
    out.push({
      id: "aumento",
      tone: "alerta",
      text: `Seus preços aumentaram em média ${variacaoPreco.toFixed(1)}% desde o cadastro das assinaturas.`,
    });
  }
  if (antes > 0 && agora > antes) {
    out.push({
      id: "comparacao",
      tone: "alerta",
      text: `O gasto deste mês está ${(((agora - antes) / antes) * 100).toFixed(1)}% acima do mesmo mês há 6 meses.`,
    });
  }

  ativos
    .filter((x) => priceChange(x) >= 10)
    .forEach((x) =>
      out.push({
        id: `preco-${x.id}`,
        tone: "alerta",
        text: `${x.name} teve aumento de ${priceChange(x).toFixed(1)}% desde que foi cadastrada.`,
      }),
    );

  const ociosas = ativos.filter((x) => x.usage === "rara" || x.usage === "nunca");
  const economia = ociosas.reduce((t, x) => t + monthlyCost(x, s), 0);
  ociosas.forEach((x) =>
    out.push({
      id: `uso-${x.id}`,
      tone: "alerta",
      text: `Você paga ${brl(monthlyCost(x, s))} por mês por ${x.name}, mas informou que ${x.usage === "nunca" ? "nunca a utiliza" : "a utiliza raramente"}.`,
    }),
  );
  if (economia > 0) {
    out.push({
      id: "economia",
      tone: "positivo",
      text: `É possível economizar ${brl(economia * 12)} por ano cancelando as assinaturas pouco utilizadas.`,
    });
  }

  subs
    .filter((x) => x.trial && x.trialChargeDate && isActive(x))
    .forEach((x) => {
      const d = daysUntil(x.trialChargeDate!);
      if (d >= 0)
        out.push({
          id: `trial-${x.id}`,
          tone: "alerta",
          text: `O período gratuito de ${x.name} termina em ${d} dia(s). Após essa data será cobrado o valor da assinatura.`,
        });
    });

  const gastoMes = monthTotal(ativos, s, now);
  if (gastoMes > s.monthlyGoal) {
    out.push({
      id: "meta",
      tone: "alerta",
      text: `Você ultrapassou a meta mensal de ${brl(s.monthlyGoal)} em ${brl(gastoMes - s.monthlyGoal)}.`,
    });
  } else {
    out.push({
      id: "meta-ok",
      tone: "positivo",
      text: `Seus gastos estão dentro da meta mensal. Restam ${brl(s.monthlyGoal - gastoMes)} disponíveis.`,
    });
  }

  if (ativos.length > s.maxSubscriptions) {
    out.push({
      id: "qtd",
      tone: "alerta",
      text: `Você possui ${ativos.length} assinaturas ativas, acima do limite definido de ${s.maxSubscriptions}.`,
    });
  }

  return out;
}

export function healthScore(subs: Subscription[], s: Settings) {
  const ativos = subs.filter(isActive);
  const gastoMes = monthTotal(ativos, s, new Date());
  const ociosas = ativos.filter((x) => x.usage === "rara" || x.usage === "nunca");
  const aumento = ativos.reduce((t, x) => t + Math.max(0, priceChange(x)), 0) / (ativos.length || 1);

  let score = 100;
  if (s.monthlyGoal > 0 && gastoMes > s.monthlyGoal)
    score -= Math.min(30, ((gastoMes - s.monthlyGoal) / s.monthlyGoal) * 60);
  score -= Math.min(25, ociosas.length * 8);
  score -= Math.min(20, aumento);
  if (ativos.length > s.maxSubscriptions) score -= Math.min(15, (ativos.length - s.maxSubscriptions) * 5);

  const potencial = ociosas.reduce((t, x) => t + monthlyCost(x, s), 0) * 12;
  return {
    score: Math.max(0, Math.round(score)),
    gastoMes,
    ociosas,
    aumentoMedio: aumento,
    potencialEconomia: potencial,
    ativos: ativos.length,
  };
}
