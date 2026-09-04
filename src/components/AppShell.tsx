import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/vendas", label: "Vendas" },
  { to: "/estoque", label: "Estoque" },
  { to: "/clientes", label: "Clientes" },
  { to: "/relatorios", label: "Relatos" },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <div className="mx-auto w-full max-w-3xl flex-1 pb-28">
        <header className="flex items-start justify-between px-5 pt-5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="pulse-live size-1.5 rounded-full bg-glow" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Metah Veste · PDV
              </p>
            </div>
            <h1 className="mt-2 font-display text-[26px] leading-none font-bold tracking-tight">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 font-mono text-[12px] text-muted">{subtitle}</p> : null}
          </div>
          <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-glow to-gold font-display text-sm font-bold text-card ring-2 ring-card">
            MV
          </div>
        </header>
        <main>{children}</main>
      </div>

      <nav className="sticky bottom-0 mt-auto border-t border-line bg-bg/95 px-3 pt-2 pb-4 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          {NAV.map((item, i) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5",
                  active && "bg-glow-soft/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-md text-[11px]",
                    active ? "bg-glow font-bold text-card" : "text-muted ring-1 ring-line",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn("text-[10px]", active ? "font-medium text-glow" : "text-muted")}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
