import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Panel, SectionTitle, Tag } from "@/components/kit";
import { fetchCustomers, fetchProducts, fetchSales } from "@/lib/api";
import { brl, startOfDay, startOfMonth } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel da loja — Metah Veste" },
      {
        name: "description",
        content:
          "Painel de controle da Metah Veste: vendas do dia e do mês, estoque baixo e produtos mais vendidos.",
      },
      { property: "og:title", content: "Painel da loja — Metah Veste" },
      {
        property: "og:description",
        content: "Vendas do dia, faturamento do mês, estoque baixo e clientes cadastrados.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Dashboard() {
  const sales = useQuery({ queryKey: ["sales"], queryFn: () => fetchSales() });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const customers = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });

  const paid = (sales.data ?? []).filter((s) => s.status === "paga" || s.status === "pendente");
  const dayStart = startOfDay();
  const monthStart = startOfMonth();

  const todaySales = paid.filter((s) => s.created_at >= dayStart);
  const monthSales = paid.filter((s) => s.created_at >= monthStart);
  const todayTotal = todaySales.reduce((s, v) => s + Number(v.total), 0);
  const monthTotal = monthSales.reduce((s, v) => s + Number(v.total), 0);

  const lowStock = (products.data ?? []).flatMap((p) =>
    p.variants
      .filter((v) => v.quantity <= p.low_stock_threshold)
      .map((v) => ({ product: p, variant: v })),
  );

  const ranking = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const sale of paid) {
    for (const item of sale.sale_items ?? []) {
      const entry = ranking.get(item.product_name) ?? {
        name: item.product_name,
        qty: 0,
        revenue: 0,
      };
      entry.qty += item.quantity;
      entry.revenue += item.quantity * Number(item.unit_price);
      ranking.set(item.product_name, entry);
    }
  }
  const top = [...ranking.values()].sort((a, b) => b.qty - a.qty).slice(0, 3);

  // last 7 days bars
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const total = paid
      .filter((s) => s.created_at >= d.toISOString() && s.created_at < next.toISOString())
      .reduce((sum, s) => sum + Number(s.total), 0);
    return { label: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3), total };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  const now = new Date();
  const subtitle = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <AppShell title={`${greeting()}!`} subtitle={`${subtitle} · loja aberta`}>
      <div
        className="anim-rise mx-5 rounded-[22px] bg-gradient-to-br from-glow-soft via-bg to-card p-5 ring-1 ring-line"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
            Hoje · vendas
          </p>
          <span className="font-mono text-[10px] text-good">{todaySales.length} vendas hoje</span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="font-display text-[40px] leading-none font-bold tracking-tight">
            {brl(todayTotal)}
          </span>
        </div>
        <div className="mt-4 flex h-12 items-end gap-1.5">
          {days.map((d, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-glow"
              style={{
                height: `${Math.max(6, (d.total / max) * 100)}%`,
                opacity: 0.25 + (d.total / max) * 0.75,
              }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-muted">
          {days.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5 px-5">
        <Panel className="anim-rise p-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Mês</p>
          <p className="mt-1 font-display text-[18px] font-bold tracking-tight">
            {brl(monthTotal)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted">{monthSales.length} vendas</p>
        </Panel>
        <Panel className="anim-rise p-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Clientes</p>
          <p className="mt-1 font-display text-[18px] font-bold tracking-tight">
            {customers.data?.length ?? 0}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted">cadastrados</p>
        </Panel>
        <Panel className="anim-rise p-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-glow">Estoque baixo</p>
          <p className="mt-1 font-display text-[18px] font-bold tracking-tight text-glow">
            {lowStock.length}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted">variações</p>
        </Panel>
      </div>

      <div className="mt-4 px-5">
        <SectionTitle title="Mais vendidos" aside="todas as vendas" />
        {top.length === 0 ? (
          <EmptyState text="Nenhuma venda registrada ainda." />
        ) : (
          <div className="space-y-2">
            {top.map((t, i) => (
              <div
                key={t.name}
                className="anim-rise flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-glow-soft font-display text-[13px] font-bold text-gold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{t.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">{brl(t.revenue)}</p>
                </div>
                <span className="font-display text-[14px] font-bold tracking-tight">{t.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 px-5">
        <SectionTitle
          title="Estoque baixo"
          aside={<Link to="/admin/estoque">ver estoque</Link>}
        />
        {lowStock.length === 0 ? (
          <EmptyState text="Tudo certo, nenhum produto em falta." />
        ) : (
          <div className="space-y-2">
            {lowStock.slice(0, 6).map(({ product, variant }) => (
              <div
                key={variant.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{product.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {variant.size} · {variant.color}
                  </p>
                </div>
                <Tag tone={variant.quantity === 0 ? "bad" : "glow"}>
                  {variant.quantity} un
                </Tag>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 px-5">
        <Link
          to="/admin/vendas"
          className="anim-rise block w-full rounded-xl bg-ink py-3.5 text-center font-display text-[14px] font-semibold text-bg"
        >
          Registrar venda
        </Link>
      </div>
    </AppShell>
  );
}
