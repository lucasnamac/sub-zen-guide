import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pause, Pencil, Play, Plus, Search, Trash2, Users, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useSubs } from "@/lib/subs/store";
import {
  brl,
  daysUntil,
  monthlyCost,
  ownerShare,
  priceChange,
  totalPaidSince,
} from "@/lib/subs/calc";
import { USAGES, type Status, type Subscription } from "@/lib/subs/types";

export const Route = createFileRoute("/assinaturas")({
  head: () => ({
    meta: [
      { title: "Minhas assinaturas | Cadastro e controle" },
      {
        name: "description",
        content:
          "Cadastre assinaturas com valor, categoria, periodicidade, forma de pagamento, status, uso e participantes.",
      },
      { property: "og:title", content: "Minhas assinaturas" },
      {
        property: "og:description",
        content: "Cadastro completo de assinaturas com histórico de preços e divisão entre participantes.",
      },
    ],
  }),
  component: Assinaturas,
});

function Assinaturas() {
  const { subs, settings, updateSub, removeSub, categories } = useSubs();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<Status | "todas">("ativa");
  const [categoria, setCategoria] = useState("todas");
  const [aberta, setAberta] = useState<Subscription | null>(null);

  const lista = useMemo(
    () =>
      subs
        .filter((s) => (status === "todas" ? true : s.status === status))
        .filter((s) => (categoria === "todas" ? true : s.category === categoria))
        .filter((s) => s.name.toLowerCase().includes(busca.toLowerCase()))
        .sort((a, b) => a.nextCharge.localeCompare(b.nextCharge)),
    [subs, status, categoria, busca],
  );

  const detalhe = aberta ? (subs.find((s) => s.id === aberta.id) ?? null) : null;

  return (
    <AppShell
      title="Assinaturas"
      subtitle={`${lista.length} assinatura(s) listada(s)`}
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar assinatura"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as Status | "todas")}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ativa">Ativas</TabsTrigger>
          <TabsTrigger value="pausada">Pausadas</TabsTrigger>
          <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {["todas", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
              categoria === c
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {lista.map((s) => (
          <li key={s.id} className="surface-card p-4">
            <button className="w-full text-left" onClick={() => setAberta(s)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.category} · {s.cycle} · {s.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {s.currency === "BRL"
                      ? brl(s.amount)
                      : `${s.currency} ${s.amount.toFixed(2)}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{brl(monthlyCost(s, settings))}/mês</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={s.status === "ativa" ? "default" : "secondary"} className="capitalize">
                  {s.status}
                </Badge>
                {s.trial ? <Badge variant="outline">Período gratuito</Badge> : null}
                {s.members.length > 0 ? (
                  <Badge variant="outline" className="gap-1">
                    <Users className="size-3" /> {s.members.length}
                  </Badge>
                ) : null}
                {priceChange(s) > 0 ? (
                  <Badge variant="outline">+{priceChange(s).toFixed(0)}% de reajuste</Badge>
                ) : null}
                <span className="ml-auto text-xs text-muted-foreground">
                  {s.status === "ativa" ? `em ${daysUntil(s.nextCharge)} dia(s)` : "sem cobrança"}
                </span>
              </div>
            </button>

            <div className="mt-3 flex gap-2">
              <SubscriptionForm
                sub={s}
                trigger={
                  <Button size="sm" variant="secondary" className="flex-1 gap-1">
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                }
              />
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 gap-1"
                onClick={() => {
                  updateSub(s.id, { status: s.status === "pausada" ? "ativa" : "pausada" });
                  toast.success(s.status === "pausada" ? "Assinatura reativada." : "Assinatura pausada.");
                }}
              >
                {s.status === "pausada" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                {s.status === "pausada" ? "Retomar" : "Pausar"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1"
                onClick={() => {
                  updateSub(s.id, { status: "cancelada" });
                  toast.success("Assinatura marcada como cancelada.");
                }}
              >
                <X className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  removeSub(s.id);
                  toast.success("Assinatura excluída.");
                }}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
        {lista.length === 0 ? (
          <li className="surface-card p-6 text-center text-sm text-muted-foreground">
            Nenhuma assinatura encontrada com estes filtros.
          </li>
        ) : null}
      </ul>

      <Sheet open={!!detalhe} onOpenChange={(o) => !o && setAberta(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
          {detalhe ? <Detalhe sub={detalhe} /> : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function Detalhe({ sub }: { sub: Subscription }) {
  const { settings, updateSub } = useSubs();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const historico = [...sub.priceHistory].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5 pb-6">
      <SheetHeader className="px-0">
        <SheetTitle>{sub.name}</SheetTitle>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Valor" value={sub.currency === "BRL" ? brl(sub.amount) : `${sub.currency} ${sub.amount.toFixed(2)}`} />
        <Info label="Equivalente mensal" value={brl(monthlyCost(sub, settings))} />
        <Info label="Próxima cobrança" value={new Date(sub.nextCharge).toLocaleDateString("pt-BR")} />
        <Info label="Uso informado" value={USAGES.find((u) => u.value === sub.usage)?.label ?? "-"} />
        <Info label="Aviso" value={`${sub.notifyDaysBefore} dia(s) antes`} />
        <Info label="Já pago desde o cadastro" value={brl(totalPaidSince(sub, settings))} />
      </div>

      {sub.description ? <p className="text-sm text-muted-foreground">{sub.description}</p> : null}

      {sub.trial ? (
        <div className="surface-card border-warning/40 bg-warning/10 p-3 text-sm">
          Período gratuito iniciado em {sub.trialStart} e cobrança a partir de {sub.trialChargeDate} (
          {daysUntil(sub.trialChargeDate ?? sub.nextCharge)} dia(s)).
          <Button
            size="sm"
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => {
              updateSub(sub.id, { status: "cancelada", trial: false });
              toast.success("Teste marcado como cancelado.");
            }}
          >
            Marcar teste como cancelado
          </Button>
        </div>
      ) : null}

      <Separator />

      <div>
        <p className="text-sm font-medium">Histórico de preços</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {historico.map((p) => (
            <li key={p.date} className="flex justify-between">
              <span>{new Date(p.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
              <span>{brl(p.amount)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-primary">
          Variação acumulada: {priceChange(sub).toFixed(1)}%
        </p>
        <div className="mt-2 flex gap-2">
          <Input
            inputMode="decimal"
            placeholder="Novo valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => {
              const v = Number(valor.replace(",", "."));
              if (!v) return;
              updateSub(sub.id, {
                amount: v,
                priceHistory: [
                  ...sub.priceHistory,
                  { date: new Date().toISOString().slice(0, 10), amount: v },
                ],
              });
              setValor("");
              toast.success("Reajuste registrado.");
            }}
          >
            Registrar
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-sm font-medium">Assinatura compartilhada</p>
        <p className="text-xs text-muted-foreground">
          Você paga efetivamente {brl(ownerShare(sub, settings))} por cobrança.
        </p>
        <ul className="mt-2 space-y-2">
          {sub.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
              <span>{m.name}</span>
              <span className="flex items-center gap-2">
                {brl(m.share)}
                <button
                  className={`rounded-full px-2 py-0.5 text-xs ${m.paid ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}
                  onClick={() =>
                    updateSub(sub.id, {
                      members: sub.members.map((x) => (x.id === m.id ? { ...x, paid: !x.paid } : x)),
                    })
                  }
                >
                  {m.paid ? "Pago" : "Pendente"}
                </button>
                <button
                  onClick={() =>
                    updateSub(sub.id, { members: sub.members.filter((x) => x.id !== m.id) })
                  }
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <Input placeholder="Nome do participante" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Button
            variant="secondary"
            onClick={() => {
              if (!nome.trim()) return;
              const total = sub.members.length + 2;
              updateSub(sub.id, {
                members: [
                  ...sub.members,
                  {
                    id: crypto.randomUUID(),
                    name: nome.trim(),
                    share: Number((sub.amount / total).toFixed(2)),
                    paid: false,
                  },
                ],
              });
              setNome("");
              toast.success("Participante adicionado.");
            }}
          >
            Adicionar
          </Button>
        </div>
        {sub.members.some((m) => !m.paid) ? (
          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => toast("Lembrete enviado aos participantes pendentes.")}
          >
            Enviar lembrete de pagamento
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
