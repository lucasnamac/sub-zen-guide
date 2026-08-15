import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubs } from "@/lib/subs/store";
import { toISO } from "@/lib/subs/calc";
import {
  CYCLES,
  PAYMENT_METHODS,
  STATUSES,
  USAGES,
  type Currency,
  type Cycle,
  type Status,
  type Subscription,
  type Usage,
} from "@/lib/subs/types";

type Props = { sub?: Subscription; trigger: ReactNode };

export function SubscriptionForm({ sub, trigger }: Props) {
  const { addSub, updateSub, categories, settings } = useSubs();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => blank(sub, categories[0] ?? "Outros", settings.defaultNotifyDays));

  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    if (!form.name.trim()) return toast.error("Informe o nome da assinatura.");
    const amount = Number(String(form.amount).replace(",", "."));
    if (!amount || amount <= 0) return toast.error("Informe um valor válido.");

    if (sub) {
      const priceHistory =
        amount !== sub.amount
          ? [...sub.priceHistory, { date: toISO(new Date()), amount }]
          : sub.priceHistory;
      updateSub(sub.id, { ...form, amount, priceHistory });
      toast.success("Assinatura atualizada.");
    } else {
      addSub({
        id: crypto.randomUUID(),
        ...form,
        amount,
        priceHistory: [{ date: toISO(new Date()), amount }],
        members: [],
        createdAt: toISO(new Date()),
      });
      toast.success("Assinatura cadastrada.");
    }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setForm(blank(sub, categories[0] ?? "Outros", settings.defaultNotifyDays));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sub ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Netflix" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor">
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="49,90"
              />
            </Field>
            <Field label="Moeda">
              <Pick value={form.currency} onChange={(v) => set("currency", v as Currency)} options={["BRL", "USD", "EUR"]} />
            </Field>
          </div>

          <Field label="Categoria">
            <Pick value={form.category} onChange={(v) => set("category", v)} options={categories} />
          </Field>

          <Field label="Descrição (opcional)">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Plano família compartilhado"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Periodicidade">
              <Pick value={form.cycle} onChange={(v) => set("cycle", v as Cycle)} options={CYCLES} />
            </Field>
            <Field label="Próxima cobrança">
              <Input type="date" value={form.nextCharge} onChange={(e) => set("nextCharge", e.target.value)} />
            </Field>
          </div>

          {form.cycle === "personalizada" ? (
            <Field label="Intervalo em dias">
              <Input
                inputMode="numeric"
                value={form.customDays}
                onChange={(e) => set("customDays", Number(e.target.value) || 0)}
              />
            </Field>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pagamento">
              <Pick value={form.paymentMethod} onChange={(v) => set("paymentMethod", v)} options={PAYMENT_METHODS} />
            </Field>
            <Field label="Status">
              <Pick value={form.status} onChange={(v) => set("status", v as Status)} options={STATUSES} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Frequência de uso">
              <Select value={form.usage} onValueChange={(v) => set("usage", v as Usage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USAGES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Avisar dias antes">
              <Input
                inputMode="numeric"
                value={form.notifyDaysBefore}
                onChange={(e) => set("notifyDaysBefore", Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Período gratuito</p>
              <p className="text-xs text-muted-foreground">Teste que ainda não é cobrado</p>
            </div>
            <Switch checked={form.trial} onCheckedChange={(v) => set("trial", v)} />
          </div>

          {form.trial ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início do teste">
                <Input type="date" value={form.trialStart} onChange={(e) => set("trialStart", e.target.value)} />
              </Field>
              <Field label="Início da cobrança">
                <Input
                  type="date"
                  value={form.trialChargeDate}
                  onChange={(e) => set("trialChargeDate", e.target.value)}
                />
              </Field>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={submit} className="w-full">
            {sub ? "Salvar alterações" : "Cadastrar assinatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Pick({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function blank(sub: Subscription | undefined, firstCategory: string, notify: number) {
  return {
    name: sub?.name ?? "",
    description: sub?.description ?? "",
    category: sub?.category ?? firstCategory,
    amount: sub ? String(sub.amount) : "",
    currency: (sub?.currency ?? "BRL") as Currency,
    cycle: (sub?.cycle ?? "mensal") as Cycle,
    customDays: sub?.customDays ?? 30,
    nextCharge: sub?.nextCharge ?? toISO(new Date()),
    paymentMethod: sub?.paymentMethod ?? PAYMENT_METHODS[0]!,
    status: (sub?.status ?? "ativa") as Status,
    usage: (sub?.usage ?? "mensal") as Usage,
    notifyDaysBefore: sub?.notifyDaysBefore ?? notify,
    trial: sub?.trial ?? false,
    trialStart: sub?.trialStart ?? toISO(new Date()),
    trialChargeDate: sub?.trialChargeDate ?? toISO(new Date()),
  };
}
