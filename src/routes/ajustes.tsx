import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSubs } from "@/lib/subs/store";
import { BASE_CATEGORIES } from "@/lib/subs/types";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes | Metas, alertas e categorias" },
      {
        name: "description",
        content:
          "Defina metas de gasto, limite de assinaturas, dias de antecedência dos alertas, cotações e categorias personalizadas.",
      },
      { property: "og:title", content: "Ajustes do app de assinaturas" },
      {
        property: "og:description",
        content: "Metas de economia, alertas de renovação, conversão de moeda e categorias personalizadas.",
      },
    ],
  }),
  component: Ajustes,
});

function Ajustes() {
  const { settings, setSettings, addCategory, removeCategory, reset } = useSubs();
  const [nova, setNova] = useState("");

  return (
    <AppShell title="Ajustes" subtitle="Metas, alertas, câmbio e categorias">
      <section className="surface-card space-y-4 p-4">
        <p className="text-sm font-medium">Metas de economia</p>
        <Campo
          label="Limite mensal de gastos (R$)"
          value={settings.monthlyGoal}
          onChange={(v) => setSettings({ monthlyGoal: v })}
        />
        <Campo
          label="Quantidade máxima de assinaturas"
          value={settings.maxSubscriptions}
          onChange={(v) => setSettings({ maxSubscriptions: v })}
        />
      </section>

      <section className="surface-card space-y-4 p-4">
        <p className="text-sm font-medium">Lembretes e notificações</p>
        <Campo
          label="Avisar quantos dias antes da renovação"
          value={settings.defaultNotifyDays}
          onChange={(v) => setSettings({ defaultNotifyDays: v })}
        />
        <p className="text-xs text-muted-foreground">
          Cada assinatura pode ter um prazo próprio de aviso. Os alertas do dia da cobrança, de fim de período
          gratuito e de aumento de preço aparecem no Início e no Raio-X.
        </p>
      </section>

      <section className="surface-card space-y-4 p-4">
        <p className="text-sm font-medium">Conversão de moeda</p>
        <Campo label="Cotação do dólar (R$)" value={settings.usdRate} step onChange={(v) => setSettings({ usdRate: v })} />
        <Campo label="Cotação do euro (R$)" value={settings.eurRate} step onChange={(v) => setSettings({ eurRate: v })} />
        <p className="text-xs text-muted-foreground">
          Assinaturas em moeda estrangeira são convertidas automaticamente com estas cotações.
        </p>
      </section>

      <section className="surface-card space-y-3 p-4">
        <p className="text-sm font-medium">Categorias</p>
        <div className="flex flex-wrap gap-2">
          {BASE_CATEGORIES.map((c) => (
            <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {c}
            </span>
          ))}
          {settings.customCategories.map((c) => (
            <span key={c} className="flex items-center gap-1 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary">
              {c}
              <button onClick={() => removeCategory(c)} aria-label={`Remover ${c}`}>
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Nova categoria" value={nova} onChange={(e) => setNova(e.target.value)} />
          <Button
            variant="secondary"
            onClick={() => {
              if (!nova.trim()) return;
              addCategory(nova.trim());
              setNova("");
              toast.success("Categoria criada.");
            }}
          >
            Criar
          </Button>
        </div>
      </section>

      <Separator />

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          reset();
          toast.success("Dados restaurados para o exemplo inicial.");
        }}
      >
        Restaurar dados de exemplo
      </Button>
    </AppShell>
  );
}

function Campo({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value.replace(",", ".")) || 0)}
        step={step ? "0.01" : undefined}
      />
    </div>
  );
}
