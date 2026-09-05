import { createFileRoute, Link } from "@tanstack/react-router";
import { ShopShell } from "@/components/ShopShell";
import { Btn, EmptyState, Panel } from "@/components/kit";
import { getCatalog } from "@/lib/catalog.functions";
import { brl } from "@/lib/format";
import { cart, cartTotal, useCart } from "@/lib/cart";

export const Route = createFileRoute("/catalogo/carrinho")({
  loader: async () => {
    const { settings } = await getCatalog();
    return { settings };
  },
  head: () => ({
    meta: [
      { title: "Seu carrinho — Metah Veste" },
      {
        name: "description",
        content: "Revise as peças escolhidas e finalize seu pedido pelo WhatsApp.",
      },
      { property: "og:title", content: "Seu carrinho — Metah Veste" },
      { property: "og:description", content: "Revise as peças escolhidas e finalize seu pedido." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { settings } = Route.useLoaderData();
  const items = useCart();
  const total = cartTotal(items);

  return (
    <ShopShell logoUrl={settings.logo_url}>
      <div className="px-5 pt-5">
        <h1 className="font-display text-[26px] leading-none font-bold tracking-tight">Carrinho</h1>

        <div className="mt-4 space-y-2">
          {items.length === 0 ? (
            <EmptyState text="Seu carrinho está vazio." />
          ) : (
            items.map((i) => (
              <Panel key={i.variant_id} className="flex gap-3">
                {i.image ? (
                  <img
                    src={i.image}
                    alt={i.name}
                    className="size-16 rounded-xl object-cover ring-1 ring-line"
                  />
                ) : (
                  <div className="grid size-16 place-items-center rounded-xl bg-bg font-mono text-[9px] text-muted ring-1 ring-line">
                    sem foto
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{i.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {i.size} · {i.color}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => cart.setQuantity(i.variant_id, i.quantity - 1)}
                      className="grid size-7 place-items-center rounded-lg bg-bg ring-1 ring-line"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-display text-[13px] font-bold">
                      {i.quantity}
                    </span>
                    <button
                      onClick={() => cart.setQuantity(i.variant_id, i.quantity + 1)}
                      disabled={i.quantity >= i.stock}
                      className="grid size-7 place-items-center rounded-lg bg-bg ring-1 ring-line disabled:opacity-30"
                    >
                      +
                    </button>
                    <button
                      onClick={() => cart.remove(i.variant_id)}
                      className="ml-2 font-mono text-[10px] text-bad underline"
                    >
                      excluir
                    </button>
                  </div>
                </div>
                <span className="font-display text-[14px] font-bold tracking-tight">
                  {brl(i.price * i.quantity)}
                </span>
              </Panel>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-glow-soft p-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Total
              </span>
              <span className="font-display text-[24px] font-bold tracking-tight">
                {brl(total)}
              </span>
            </div>
            <p className="mt-2 text-center font-mono text-[10px] text-muted">
              {settings.delivery_text}
            </p>
          </>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 pb-6 sm:flex-row">
          <Link
            to="/catalogo"
            className="flex-1 rounded-xl bg-card py-3 text-center font-display text-[14px] font-semibold ring-1 ring-line"
          >
            Continuar comprando
          </Link>
          {items.length > 0 ? (
            <Link to="/catalogo/pedido" className="flex-1">
              <Btn variant="glow" className="w-full">
                Finalizar pelo WhatsApp
              </Btn>
            </Link>
          ) : null}
        </div>
      </div>
    </ShopShell>
  );
}
