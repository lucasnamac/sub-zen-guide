import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
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
  component: Relatorios;
});

function Relatorios() {
  return null;
}
