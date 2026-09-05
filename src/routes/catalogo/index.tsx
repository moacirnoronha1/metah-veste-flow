import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShopShell } from "@/components/ShopShell";
import { Chip, EmptyState, Tag, TextInput } from "@/components/kit";
import { getCatalog, type CatalogProduct } from "@/lib/catalog.functions";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/catalogo/")({
  loader: () => getCatalog(),
  head: () => ({
    meta: [
      { title: "Catálogo Metah Veste — moda jovem e minimalista" },
      {
        name: "description",
        content:
          "Veja as peças disponíveis da Metah Veste, escolha tamanho e cor e finalize seu pedido pelo WhatsApp.",
      },
      { property: "og:title", content: "Catálogo Metah Veste" },
      {
        property: "og:description",
        content: "Moda jovem, minimalista e cheia de atitude. Peça pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalogo,
});

function stockOf(p: CatalogProduct) {
  return p.variants.reduce((s, v) => s + v.quantity, 0);
}

function Catalogo() {
  const { settings, products } = Route.useLoaderData();
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("todas");
  const [size, setSize] = useState("todos");
  const [color, setColor] = useState("todas");

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  );
  const sizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.variants.map((v) => v.size)))].sort(),
    [products],
  );
  const colors = useMemo(
    () => [...new Set(products.flatMap((p) => p.variants.map((v) => v.color)))].sort(),
    [products],
  );

  const visible = products.filter((p) => {
    if (!settings.show_out_of_stock && stockOf(p) === 0) return false;
    if (term && !`${p.name} ${p.category}`.toLowerCase().includes(term.toLowerCase())) return false;
    if (category !== "todas" && p.category !== category) return false;
    if (size !== "todos" && !p.variants.some((v) => v.size === size && v.quantity > 0)) return false;
    if (color !== "todas" && !p.variants.some((v) => v.color === color && v.quantity > 0))
      return false;
    return true;
  });

  const novidades = visible.filter((p) => p.is_new).slice(0, 6);

  return (
    <ShopShell logoUrl={settings.logo_url}>
      <section className="px-5 pt-4">
        <div className="anim-rise overflow-hidden rounded-[24px] bg-gradient-to-br from-glow-soft via-bg to-card ring-1 ring-line">
          {settings.banner_url ? (
            <img
              src={settings.banner_url}
              alt="Coleção Metah Veste"
              className="h-44 w-full object-cover sm:h-64"
            />
          ) : null}
          <div className="p-5">
            <h1 className="font-display text-[30px] leading-[1.05] font-bold tracking-tight">
              {settings.banner_title}
            </h1>
            <p className="mt-2 max-w-md text-[13px] text-muted">{settings.banner_subtitle}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-2.5 px-5">
        <TextInput
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar peça..."
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Chip tone="glow" active={category === "todas"} onClick={() => setCategory("todas")}>
            Todas
          </Chip>
          {categories.map((c) => (
            <Chip key={c} tone="glow" active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Chip active={size === "todos"} onClick={() => setSize("todos")}>
            Tamanhos
          </Chip>
          {sizes.map((s) => (
            <Chip key={s} active={size === s} onClick={() => setSize(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Chip active={color === "todas"} onClick={() => setColor("todas")}>
            Cores
          </Chip>
          {colors.map((c) => (
            <Chip key={c} active={color === c} onClick={() => setColor(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </section>

      {novidades.length > 0 ? (
        <section className="mt-5 px-5">
          <p className="mb-2.5 font-display text-[15px] font-semibold tracking-tight">Lançamentos</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {novidades.map((p) => (
              <Link
                key={p.id}
                to="/catalogo/produto/$id"
                params={{ id: p.id }}
                className="w-40 shrink-0"
              >
                <Cover product={p} />
                <p className="mt-2 truncate text-[13px] font-medium">{p.name}</p>
                <p className="font-mono text-[11px] text-muted">{brl(p.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 px-5">
        <p className="mb-2.5 font-display text-[15px] font-semibold tracking-tight">Vitrine</p>
        {visible.length === 0 ? (
          <EmptyState text="Nenhuma peça encontrada com esses filtros." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((p) => (
              <Link
                key={p.id}
                to="/catalogo/produto/$id"
                params={{ id: p.id }}
                className="anim-rise"
              >
                <Cover product={p} />
                <p className="mt-2 truncate text-[13px] font-medium">{p.name}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="font-display text-[14px] font-bold tracking-tight">
                    {brl(p.price)}
                  </span>
                  {stockOf(p) === 0 ? <Tag tone="bad">Esgotado</Tag> : null}
                </div>
                <span className="mt-1 inline-block font-mono text-[10px] text-glow underline">
                  Ver produto
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </ShopShell>
  );
}

function Cover({ product }: { product: CatalogProduct }) {
  const image = product.images[0];
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-card ring-1 ring-line">
      {image ? (
        <img src={image} alt={product.name} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center font-mono text-[10px] text-muted">
          sem foto
        </div>
      )}
      {product.is_new ? (
        <span className="absolute top-2 left-2 rounded-full bg-glow px-2 py-0.5 font-mono text-[9px] uppercase text-card">
          Novo
        </span>
      ) : null}
    </div>
  );
}
