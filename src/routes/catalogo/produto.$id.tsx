import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShopShell } from "@/components/ShopShell";
import { Btn, Chip, Tag } from "@/components/kit";
import { getCatalogProduct } from "@/lib/catalog.functions";
import { ProductGallery } from "@/components/ProductGallery";
import { brl } from "@/lib/format";
import { cart } from "@/lib/cart";

export const Route = createFileRoute("/catalogo/produto/$id")({
  loader: async ({ params }) => {
    const res = await getCatalogProduct({ data: { id: params.id } });
    if (!res.product) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Peça indisponível — Metah Veste" }, { name: "robots", content: "noindex" }],
      };
    }
    const p = loaderData.product!;
    const description = (p.description ?? `${p.name} por ${brl(p.price)} na Metah Veste.`).slice(
      0,
      155,
    );
    return {
      meta: [
        { title: `${p.name} — Metah Veste` },
        { name: "description", content: description },
        { property: "og:title", content: `${p.name} — Metah Veste` },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Produto,
});

function Produto() {
  const { settings, product } = Route.useLoaderData();
  const navigate = useNavigate();
  const p = product!;
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const sizes = [...new Set(p.variants.map((v) => v.size))];
  const colors = [...new Set(p.variants.filter((v) => !size || v.size === size).map((v) => v.color))];
  const variant = p.variants.find((v) => v.size === size && v.color === color) ?? null;
  const total = p.variants.reduce((s, v) => s + v.quantity, 0);
  const soldOut = total === 0;
  const max = variant?.quantity ?? 0;

  function add() {
    if (!variant) return;
    cart.add({
      product_id: p.id,
      variant_id: variant.id,
      name: p.name,
      image: p.images[0] ?? null,
      size: variant.size,
      color: variant.color,
      price: p.price,
      quantity: Math.min(qty, variant.quantity),
      stock: variant.quantity,
    });
    toast.success("Adicionado ao carrinho.");
    navigate({ to: "/catalogo/carrinho" });
  }

  return (
    <ShopShell logoUrl={settings.logo_url}>
      <div className="px-5 pt-4">
        <Link to="/catalogo" className="font-mono text-[11px] text-muted underline">
          ← Voltar ao catálogo
        </Link>

        <ProductGallery images={p.images} alt={p.name} />

        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {p.category}
          </p>
          <h1 className="mt-1 font-display text-[26px] leading-tight font-bold tracking-tight">
            {p.name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-[22px] font-bold tracking-tight text-glow">
              {brl(p.price)}
            </span>
            {soldOut ? <Tag tone="bad">Esgotado</Tag> : <Tag tone="good">Disponível</Tag>}
          </div>
          {p.description ? (
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{p.description}</p>
          ) : null}
        </div>

        {!soldOut ? (
          <>
            <div className="mt-5">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Tamanho
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => {
                  const has = p.variants.some((v) => v.size === s && v.quantity > 0);
                  return (
                    <button
                      key={s}
                      disabled={!has}
                      onClick={() => {
                        setSize(s);
                        setColor(null);
                        setQty(1);
                      }}
                      className={`rounded-lg px-3 py-2 text-[12px] font-medium ring-1 disabled:opacity-30 ${
                        size === s ? "bg-ink text-bg ring-ink" : "bg-card text-ink ring-line"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Cor
              </p>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => {
                  const has = p.variants.some(
                    (v) => v.color === c && (!size || v.size === size) && v.quantity > 0,
                  );
                  return (
                    <button
                      key={c}
                      disabled={!has || !size}
                      onClick={() => {
                        setColor(c);
                        setQty(1);
                      }}
                      className={`rounded-lg px-3 py-2 text-[12px] font-medium ring-1 disabled:opacity-30 ${
                        color === c ? "bg-ink text-bg ring-ink" : "bg-card text-ink ring-line"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Quantidade
              </p>
              <div className="flex items-center gap-2">
                <Chip onClick={() => setQty(Math.max(1, qty - 1))}>−</Chip>
                <span className="w-8 text-center font-display text-[15px] font-bold">{qty}</span>
                <Chip onClick={() => setQty(Math.min(max || 1, qty + 1))}>+</Chip>
              </div>
              {variant ? (
                <span className="font-mono text-[10px] text-muted">{max} em estoque</span>
              ) : null}
            </div>

            <Btn variant="glow" className="mt-5 w-full" disabled={!variant} onClick={add}>
              {variant ? "Adicionar ao carrinho" : "Escolha tamanho e cor"}
            </Btn>
          </>
        ) : (
          <div className="mt-5 rounded-2xl bg-card p-4 text-center text-[13px] text-muted ring-1 ring-line">
            Esta peça está esgotada no momento.
          </div>
        )}
      </div>
    </ShopShell>
  );
}
