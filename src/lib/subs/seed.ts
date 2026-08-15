import type { Settings, Subscription } from "./types";
import { addCycle, toISO } from "./calc";

const today = new Date();
const inDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const monthsAgo = (n: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - n);
  return toISO(d);
};

const base = (s: Partial<Subscription> & { name: string; amount: number }): Subscription => ({
  id: crypto.randomUUID(),
  description: "",
  category: "Outros",
  currency: "BRL",
  cycle: "mensal",
  nextCharge: inDays(10),
  paymentMethod: "Cartão de crédito",
  status: "ativa",
  usage: "mensal",
  notifyDaysBefore: 3,
  trial: false,
  priceHistory: [{ date: monthsAgo(8), amount: s.amount }],
  members: [],
  createdAt: monthsAgo(8),
  ...s,
});

export const seedSubscriptions = (): Subscription[] => [
  base({
    name: "Netflix",
    amount: 49.9,
    category: "Streaming",
    nextCharge: inDays(4),
    usage: "semanal",
    priceHistory: [
      { date: monthsAgo(12), amount: 39.9 },
      { date: monthsAgo(6), amount: 44.9 },
      { date: monthsAgo(1), amount: 49.9 },
    ],
    members: [
      { id: crypto.randomUUID(), name: "Lucas", share: 16.63, paid: true },
      { id: crypto.randomUUID(), name: "João", share: 16.63, paid: false },
    ],
  }),
  base({
    name: "Spotify Família",
    amount: 34.9,
    category: "Música",
    nextCharge: inDays(2),
    usage: "diaria",
    members: [
      { id: crypto.randomUUID(), name: "Lucas", share: 11.63, paid: true },
      { id: crypto.randomUUID(), name: "João", share: 11.63, paid: false },
      { id: crypto.randomUUID(), name: "Maria", share: 11.64, paid: true },
    ],
  }),
  base({
    name: "ChatGPT Plus",
    amount: 20,
    currency: "USD",
    category: "Inteligência artificial",
    nextCharge: inDays(7),
    usage: "diaria",
  }),
  base({
    name: "Academia",
    amount: 120,
    category: "Academia",
    nextCharge: inDays(15),
    usage: "rara",
    paymentMethod: "Pix",
  }),
  base({
    name: "Disney+",
    amount: 43.9,
    category: "Streaming",
    nextCharge: inDays(21),
    usage: "nunca",
  }),
  base({
    name: "Xbox Game Pass",
    amount: 44.99,
    category: "Jogos",
    nextCharge: inDays(12),
    usage: "semanal",
  }),
  base({
    name: "iCloud 200GB",
    amount: 10.9,
    category: "Armazenamento",
    nextCharge: inDays(18),
    usage: "diaria",
  }),
  base({
    name: "YouTube Premium",
    amount: 24.9,
    category: "Streaming",
    nextCharge: inDays(3),
    trial: true,
    trialStart: inDays(-27),
    trialChargeDate: inDays(3),
    usage: "semanal",
    createdAt: inDays(-27),
    priceHistory: [{ date: inDays(-27), amount: 24.9 }],
  }),
  base({
    name: "Alura",
    amount: 780,
    cycle: "anual",
    category: "Educação",
    nextCharge: toISO(addCycle(today, "trimestral")),
    usage: "semanal",
  }),
];

export const defaultSettings: Settings = {
  monthlyGoal: 300,
  maxSubscriptions: 8,
  defaultNotifyDays: 3,
  usdRate: 5.42,
  eurRate: 5.9,
  customCategories: [],
};
