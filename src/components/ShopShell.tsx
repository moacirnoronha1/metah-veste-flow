import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cartCount, useCart } from "@/lib/cart";
import { Logo } from "@/components/Logo";

export function ShopShell({
  logoUrl,
  children,
}: {
  logoUrl?: string | null;
  children: ReactNode;
}) {
  const items = useCart();
  const count = cartCount(items);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/catalogo" className="flex items-center gap-2.5 py-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Metah Veste"
                className="size-9 rounded-full object-cover ring-1 ring-line"
              />
            ) : (
              <Logo className="h-7" />
            )}
          </Link>
          <Link
            to="/catalogo/carrinho"
            className="relative rounded-full bg-ink px-4 py-2 font-display text-[12px] font-semibold text-bg"
          >
            Carrinho
            {count > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-glow font-mono text-[10px] text-card">
                {count}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 pb-16">{children}</main>

      <footer className="border-t border-line px-5 py-10 text-center">
        <Logo className="mx-auto h-6 opacity-70" />
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Metah Veste
        </p>
      </footer>
    </div>
  );
}
