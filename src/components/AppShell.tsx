import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ChartPie, Home, Settings, Stethoscope, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/assinaturas", label: "Assinaturas", icon: Wallet },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/relatorios", label: "Relatórios", icon: ChartPie },
  { to: "/raio-x", label: "Raio-X", icon: Stethoscope },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 px-5 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <Link
              to="/ajustes"
              aria-label="Ajustes"
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-5 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-border/60 bg-background/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <ul className="flex items-center justify-between">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl transition-colors",
                      active && "bg-primary/15",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
