export type Cycle = "semanal" | "mensal" | "trimestral" | "semestral" | "anual" | "personalizada";
export type Status = "ativa" | "pausada" | "cancelada";
export type Usage = "diaria" | "semanal" | "mensal" | "rara" | "nunca";
export type Currency = "BRL" | "USD" | "EUR";

export type PricePoint = { date: string; amount: number };
export type Member = { id: string; name: string; share: number; paid: boolean };

export type Subscription = {
  id: string;
  name: string;
  description?: string;
  category: string;
  amount: number;
  currency: Currency;
  cycle: Cycle;
  customDays?: number;
  nextCharge: string; // YYYY-MM-DD
  paymentMethod: string;
  status: Status;
  usage: Usage;
  notifyDaysBefore: number;
  trial: boolean;
  trialStart?: string;
  trialChargeDate?: string;
  priceHistory: PricePoint[];
  members: Member[];
  createdAt: string;
};

export type Settings = {
  monthlyGoal: number;
  maxSubscriptions: number;
  defaultNotifyDays: number;
  usdRate: number;
  eurRate: number;
  customCategories: string[];
};

export const CYCLES: Cycle[] = [
  "semanal",
  "mensal",
  "trimestral",
  "semestral",
  "anual",
  "personalizada",
];

export const STATUSES: Status[] = ["ativa", "pausada", "cancelada"];

export const USAGES: { value: Usage; label: string }[] = [
  { value: "diaria", label: "Diariamente" },
  { value: "semanal", label: "Semanalmente" },
  { value: "mensal", label: "Mensalmente" },
  { value: "rara", label: "Raramente" },
  { value: "nunca", label: "Nunca" },
];

export const BASE_CATEGORIES = [
  "Streaming",
  "Música",
  "Jogos",
  "Educação",
  "Trabalho",
  "Saúde",
  "Academia",
  "Armazenamento",
  "Inteligência artificial",
  "Outros",
];

export const PAYMENT_METHODS = [
  "Cartão de crédito",
  "Cartão de débito",
  "Pix",
  "Boleto",
  "Conta bancária",
  "Vale/benefício",
];
