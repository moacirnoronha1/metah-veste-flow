import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Field, Panel, SectionTitle, Tag, TextInput } from "@/components/kit";
import { fetchProducts, fetchSales } from "@/lib/api";
import { PAYMENT_LABELS, brl } from "@/lib/format";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Metah Veste" },
      {
        name: "description",
        content:
          "Faturamento por período, lucro estimado, produtos mais vendidos, estoque atual e vendas por forma de pagamento.",
      },
      { property: "og:title", content: "Relatórios — Metah Veste" },
      {
        property: "og:description",
        content: "Faturamento, lucro estimado, mais vendidos e vendas por forma de pagamento.",
      },
    ],
  }),
  component: RelatoriosPage,
});

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function RelatoriosPage() {
  const sales = useQuery({ queryKey: ["sales"], queryFn: () => fetchSales() });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());

  const period = useMemo(
    () =>
      (sales.data ?? []).filter((s) => {
        if (s.status === "cancelada") return false;
        if (from && s.created_at < new Date(`${from}T00:00:00`).toISOString()) return false;
        if (to && s.created_at > new Date(`${to}T23:59:59`).toISOString()) return false;
        return true;
      }),
    [sales.data, from, to],
  );

  const revenue = period.reduce((s, v) => s + Number(v.total), 0);
  const cost = period.reduce((s, v) => s + Number(v.cost_total), 0);
  const profit = revenue - cost;

  const byPayment = new Map<string, { total: number; count: number }>();
  for (const s of period) {
    const cur = byPayment.get(s.payment_method) ?? { total: 0, count: 0 };
    cur.total += Number(s.total);
    cur.count += 1;
    byPayment.set(s.payment_method, cur);
  }

  const ranking = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const s of period) {
    for (const i of s.sale_items ?? []) {
      const cur = ranking.get(i.product_name) ?? { name: i.product_name, qty: 0, revenue: 0 };
      cur.qty += i.quantity;
      cur.revenue += i.quantity * Number(i.unit_price);
      ranking.set(i.product_name, cur);
    }
  }
  const top = [...ranking.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);

  const stock = (products.data ?? []).map((p) => ({
    name: p.name,
    units: p.variants.reduce((s, v) => s + v.quantity, 0),
    low: p.variants.filter((v) => v.quantity <= p.low_stock_threshold),
    value: p.variants.reduce((s, v) => s + v.quantity * Number(p.cost), 0),
  }));
  const stockValue = stock.reduce((s, v) => s + v.value, 0);
  const lowCount = stock.reduce((s, v) => s + v.low.length, 0);

  return (
    <AppShell title="Relatórios" subtitle="faturamento, lucro e estoque">
      <div className="space-y-4 px-5">
        <Panel className="space-y-3">
          <SectionTitle title="Período" aside={`${period.length} vendas`} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="De">
              <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Até">
              <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        </Panel>

        <div className="grid grid-cols-3 gap-2.5">
          <Panel className="anim-rise p-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Faturamento
            </p>
            <p className="mt-1 font-display text-[17px] font-bold tracking-tight">{brl(revenue)}</p>
          </Panel>
          <Panel className="anim-rise p-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Custo</p>
            <p className="mt-1 font-display text-[17px] font-bold tracking-tight">{brl(cost)}</p>
          </Panel>
          <Panel className="anim-rise p-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-good">Lucro est.</p>
            <p className="mt-1 font-display text-[17px] font-bold tracking-tight text-good">
              {brl(profit)}
            </p>
          </Panel>
        </div>

        <div>
          <SectionTitle title="Vendas por forma de pagamento" />
          {byPayment.size === 0 ? (
            <EmptyState text="Sem vendas no período." />
          ) : (
            <div className="space-y-2">
              {[...byPayment.entries()].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line"
                >
                  <span className="flex-1 text-[13px] font-medium">{PAYMENT_LABELS[k] ?? k}</span>
                  <span className="font-mono text-[10px] text-muted">{v.count} vendas</span>
                  <span className="font-display text-[14px] font-bold">{brl(v.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionTitle title="Produtos mais vendidos" />
          {top.length === 0 ? (
            <EmptyState text="Sem vendas no período." />
          ) : (
            <div className="space-y-2">
              {top.map((t, i) => (
                <div
                  key={t.name}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line"
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-glow-soft font-display text-[12px] font-bold text-gold">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{t.name}</span>
                  <span className="font-mono text-[10px] text-muted">{brl(t.revenue)}</span>
                  <span className="font-display text-[14px] font-bold">{t.qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionTitle
            title="Estoque atual"
            aside={`${lowCount} em alerta · ${brl(stockValue)} em custo`}
          />
          {stock.length === 0 ? (
            <EmptyState text="Nenhum produto cadastrado." />
          ) : (
            <div className="space-y-2">
              {stock.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.name}</span>
                  {s.low.length > 0 ? <Tag tone="glow">{s.low.length} baixo</Tag> : null}
                  <span className="font-display text-[14px] font-bold">{s.units} un</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
