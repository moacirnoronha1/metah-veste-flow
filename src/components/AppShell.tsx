import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/lib/admin.functions";

const NAV = [
  { to: "/admin", label: "Início" },
  { to: "/admin/vendas", label: "Vendas" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/estoque", label: "Estoque" },
  { to: "/admin/clientes", label: "Clientes" },
  { to: "/admin/relatorios", label: "Relatos" },
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
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function sair() {
    await adminLogout();
    qc.clear();
    navigate({ to: "/entrar", replace: true });
  }

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
          <div className="flex items-center gap-2">
            <Link
              to="/admin/config"
              className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted ring-1 ring-line"
            >
              Config
            </Link>
            <button
              onClick={sair}
              className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-bad ring-1 ring-line"
            >
              Sair
            </button>
          </div>
        </header>
        <main>{children}</main>
      </div>

      <nav className="sticky bottom-0 mt-auto border-t border-line bg-bg/95 px-3 pt-2 pb-4 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-6 gap-1">
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
