import type { Currency, Cycle, Settings, Subscription } from "./types";

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(v) ? v : 0,
  );

export const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export function rateFor(currency: Currency, s: Settings) {
  if (currency === "USD") return s.usdRate;
  if (currency === "EUR") return s.eurRate;
  return 1;
}

/** Valor de uma cobrança convertido para reais. */
export function chargeInBRL(sub: Subscription, s: Settings) {
  return sub.amount * rateFor(sub.currency, s);
}

export function cycleDays(cycle: Cycle, customDays = 30) {
  switch (cycle) {
    case "semanal":
      return 7;
    case "mensal":
      return 30.44;
    case "trimestral":
      return 91.31;
    case "semestral":
      return 182.62;
    case "anual":
      return 365.25;
    default:
      return customDays || 30;
  }
}

/** Custo mensal normalizado em reais. */
export function monthlyCost(sub: Subscription, s: Settings) {
  return (chargeInBRL(sub, s) * 30.44) / cycleDays(sub.cycle, sub.customDays);
}

export function yearlyCost(sub: Subscription, s: Settings) {
  return monthlyCost(sub, s) * 12;
}

export const isActive = (sub: Subscription) => sub.status === "ativa";

export function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISO(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addCycle(date: Date, cycle: Cycle, customDays = 30) {
  const next = new Date(date);
  switch (cycle) {
    case "semanal":
      next.setDate(next.getDate() + 7);
      break;
    case "mensal":
      next.setMonth(next.getMonth() + 1);
      break;
    case "trimestral":
      next.setMonth(next.getMonth() + 3);
      break;
    case "semestral":
      next.setMonth(next.getMonth() + 6);
      break;
    case "anual":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + (customDays || 30));
  }
  return next;
}

export function daysUntil(iso: string, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = parseDate(iso).getTime();
  return Math.round((b - a) / 86400000);
}

export type Charge = { sub: Subscription; date: Date; amount: number };

/** Todas as cobranças previstas dentro de um intervalo. */
export function chargesBetween(
  subs: Subscription[],
  s: Settings,
  start: Date,
  end: Date,
): Charge[] {
  const out: Charge[] = [];
  for (const sub of subs) {
    if (!isActive(sub)) continue;
    let cursor = parseDate(sub.nextCharge);
    // retrocede até antes do início
    let guard = 0;
    while (cursor > start && guard++ < 400) {
      const prev = new Date(cursor);
      const step = cycleDays(sub.cycle, sub.customDays);
      prev.setDate(prev.getDate() - Math.round(step));
      cursor = prev;
    }
    guard = 0;
    while (cursor <= end && guard++ < 400) {
      if (cursor >= start) {
        out.push({ sub, date: new Date(cursor), amount: chargeInBRL(sub, s) });
      }
      cursor = addCycle(cursor, sub.cycle, sub.customDays);
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function monthRange(ref: Date) {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { start, end };
}

export function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function monthShort(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export function monthTotal(subs: Subscription[], s: Settings, ref: Date) {
  const { start, end } = monthRange(ref);
  return chargesBetween(subs, s, start, end).reduce((t, c) => t + c.amount, 0);
}

export function priceChange(sub: Subscription) {
  if (sub.priceHistory.length < 2) return 0;
  const sorted = [...sub.priceHistory].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].amount;
  const last = sorted[sorted.length - 1].amount;
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

export function totalPaidSince(sub: Subscription, s: Settings) {
  const start = parseDate(sub.createdAt);
  const months = Math.max(
    0,
    (new Date().getFullYear() - start.getFullYear()) * 12 +
      (new Date().getMonth() - start.getMonth()),
  );
  return monthlyCost(sub, s) * months;
}

export function ownerShare(sub: Subscription, s: Settings) {
  const others = sub.members.reduce((t, m) => t + m.share, 0);
  return Math.max(0, chargeInBRL(sub, s) - others);
}
