import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Btn,
  Chip,
  EmptyState,
  Field,
  Modal,
  Panel,
  SectionTitle,
  SelectInput,
  Tag,
  TextArea,
  TextInput,
} from "@/components/kit";
import {
  createExchange,
  createSale,
  deleteExchange,
  deleteSale,
  fetchCustomers,
  fetchExchanges,
  fetchProducts,
  fetchSales,
  updateSaleStatus,
  type NewSaleItem,
  type ProductWithVariants,
  type Sale,
  type Variant,
} from "@/lib/api";
import { PAYMENT_LABELS, STATUS_LABELS, brl, dateTimeLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas e trocas — Metah Veste" },
      {
        name: "description",
        content:
          "Registre vendas em poucos toques, acompanhe o histórico com filtros e faça trocas com baixa automática no estoque.",
      },
      { property: "og:title", content: "Vendas e trocas — Metah Veste" },
      {
        property: "og:description",
        content: "Registro rápido de vendas, histórico com filtros e controle de trocas.",
      },
    ],
  }),
  component: VendasPage,
});

const PAYMENTS = ["pix", "dinheiro", "debito", "credito", "link"] as const;
const STATUSES = ["paga", "pendente", "cancelada"] as const;

function VendasPage() {
  const [tab, setTab] = useState<"nova" | "historico" | "trocas">("nova");
  return (
    <AppShell title="Vendas" subtitle="registro rápido, histórico e trocas">
      <div className="space-y-4 px-5">
        <div className="grid grid-cols-3 gap-1.5">
          <Chip active={tab === "nova"} onClick={() => setTab("nova")}>
            Nova venda
          </Chip>
          <Chip active={tab === "historico"} onClick={() => setTab("historico")}>
            Histórico
          </Chip>
          <Chip active={tab === "trocas"} onClick={() => setTab("trocas")}>
            Trocas
          </Chip>
        </div>
        {tab === "nova" ? <NovaVenda /> : tab === "historico" ? <Historico /> : <Trocas />}
      </div>
    </AppShell>
  );
}

/* --------------------------- nova venda --------------------------- */

function NovaVenda() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const customers = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });

  const [search, setSearch] = useState("");
  const [items, setItems] = useState<NewSaleItem[]>([]);
  const [picker, setPicker] = useState<ProductWithVariants | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [payment, setPayment] = useState<string>("pix");
  const [installments, setInstallments] = useState("1");
  const [status, setStatus] = useState<string>("paga");
  const [notes, setNotes] = useState("");

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products.data ?? [])
      .filter((p) => p.active)
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
      .slice(0, 8);
  }, [products.data, search]);

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const addItem = (product: ProductWithVariants, variant: Variant) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.variant.id === variant.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx]!, quantity: copy[idx]!.quantity + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          variant,
          product_name: product.name,
          unit_price: Number(product.price),
          unit_cost: Number(product.cost),
          quantity: 1,
        },
      ];
    });
    setPicker(null);
  };

  const saleMut = useMutation({
    mutationFn: () =>
      createSale({
        customer_id: customerId || null,
        items,
        discount: Number(discount) || 0,
        payment_method: payment,
        installments: Number(installments) || 1,
        status,
        notes,
      }),
    onSuccess: () => {
      toast.success("Venda registrada e estoque atualizado");
      setItems([]);
      setDiscount("0");
      setNotes("");
      setCustomerId("");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Panel className="anim-rise space-y-3">
        <SectionTitle title="Produtos" aside="toque para adicionar" />
        <TextInput
          placeholder="Pesquisar produto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-1.5">
          {list.length === 0 ? (
            <p className="font-mono text-[11px] text-muted">Nenhum produto encontrado.</p>
          ) : (
            list.map((p) => (
              <button
                key={p.id}
                onClick={() => setPicker(p)}
                className="flex w-full items-center gap-3 rounded-xl bg-bg px-3 py-2.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{p.name}</p>
                  <p className="font-mono text-[10px] text-muted">
                    {p.variants.reduce((s, v) => s + v.quantity, 0)} un em estoque
                  </p>
                </div>
                <span className="font-display text-[14px] font-bold">{brl(Number(p.price))}</span>
              </button>
            ))
          )}
        </div>
      </Panel>

      <Panel className="anim-rise space-y-3">
        <SectionTitle title="Carrinho" aside={`${items.length} item(ns)`} />
        {items.length === 0 ? (
          <p className="font-mono text-[11px] text-muted">Nenhum item adicionado.</p>
        ) : (
          items.map((i) => (
            <div key={i.variant.id} className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{i.product_name}</p>
                <p className="font-mono text-[10px] text-muted">
                  {i.variant.size} · {i.variant.color} · {brl(i.unit_price)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="grid size-7 place-items-center rounded-lg ring-1 ring-line"
                  onClick={() =>
                    setItems((prev) =>
                      prev
                        .map((x) =>
                          x.variant.id === i.variant.id ? { ...x, quantity: x.quantity - 1 } : x,
                        )
                        .filter((x) => x.quantity > 0),
                    )
                  }
                >
                  −
                </button>
                <span className="w-6 text-center font-display text-[14px] font-bold">
                  {i.quantity}
                </span>
                <button
                  className="grid size-7 place-items-center rounded-lg ring-1 ring-line"
                  onClick={() =>
                    setItems((prev) =>
                      prev.map((x) =>
                        x.variant.id === i.variant.id ? { ...x, quantity: x.quantity + 1 } : x,
                      ),
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}

        <Field label="Cliente (opcional)">
          <SelectInput value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Sem cliente</option>
            {(customers.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Pagamento
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {PAYMENTS.map((p) => (
              <Chip key={p} tone="glow" active={payment === p} onClick={() => setPayment(p)}>
                {PAYMENT_LABELS[p]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Desconto (R$)">
            <TextInput
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </Field>
          <Field label="Parcelas">
            <SelectInput value={installments} onChange={(e) => setInstallments(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}x {n > 1 ? `de ${brl(total / n)}` : "à vista"}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Situação
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {STATUSES.map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                {STATUS_LABELS[s]}
              </Chip>
            ))}
          </div>
        </div>

        <Field label="Observações">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] text-muted">
            Subtotal {brl(subtotal)} · desconto {brl(Number(discount) || 0)}
          </p>
          <p className="font-display text-[18px] font-bold tracking-tight">{brl(total)}</p>
        </div>

        <div className="flex gap-2">
          <Btn
            className="flex-1"
            disabled={items.length === 0 || saleMut.isPending}
            onClick={() => saleMut.mutate()}
          >
            Finalizar venda
          </Btn>
          <Btn variant="outline" onClick={() => setItems([])} disabled={items.length === 0}>
            Cancelar
          </Btn>
        </div>
      </Panel>

      <Modal open={!!picker} title={picker?.name ?? ""} onClose={() => setPicker(null)}>
        <div className="space-y-2">
          {(picker?.variants ?? []).length === 0 ? (
            <EmptyState text="Este produto ainda não tem variações cadastradas." />
          ) : (
            picker?.variants.map((v) => (
              <button
                key={v.id}
                disabled={v.quantity <= 0}
                onClick={() => addItem(picker, v)}
                className="flex w-full items-center gap-3 rounded-xl bg-card px-3 py-3 text-left ring-1 ring-line disabled:opacity-40"
              >
                <span className="flex-1 text-[13px] font-medium">
                  {v.size} · {v.color}
                </span>
                <Tag tone={v.quantity === 0 ? "bad" : "good"}>{v.quantity} un</Tag>
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}

/* --------------------------- histórico --------------------------- */

function Historico() {
  const qc = useQueryClient();
  const sales = useQuery({ queryKey: ["sales"], queryFn: () => fetchSales() });
  const customers = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState("");

  const list = useMemo(() => {
    return (sales.data ?? []).filter((s) => {
      if (from && s.created_at < new Date(`${from}T00:00:00`).toISOString()) return false;
      if (to && s.created_at > new Date(`${to}T23:59:59`).toISOString()) return false;
      if (customerId && s.customer_id !== customerId) return false;
      if (payment && s.payment_method !== payment) return false;
      return true;
    });
  }, [sales.data, from, to, customerId, payment]);

  const statusMut = useMutation({
    mutationFn: ({ sale, status }: { sale: Sale; status: string }) => updateSaleStatus(sale, status),
    onSuccess: () => {
      toast.success("Situação atualizada");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (sale: Sale) => deleteSale(sale),
    onSuccess: () => {
      toast.success("Venda excluída");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Panel className="space-y-3">
        <SectionTitle title="Filtros" aside={`${list.length} vendas`} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="De">
            <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Até">
            <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <Field label="Cliente">
          <SelectInput value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Todos</option>
            {(customers.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Forma de pagamento">
          <SelectInput value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">Todas</option>
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_LABELS[p]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Btn
          variant="outline"
          size="sm"
          onClick={() => {
            setFrom("");
            setTo("");
            setCustomerId("");
            setPayment("");
          }}
        >
          Limpar filtros
        </Btn>
      </Panel>

      {list.length === 0 ? (
        <EmptyState text="Nenhuma venda no período." />
      ) : (
        <div className="space-y-2.5">
          {list.map((s) => (
            <Panel key={s.id} className="anim-rise">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold">
                    {s.customers?.name ?? "Sem cliente"}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {dateTimeLabel(s.created_at)} · {PAYMENT_LABELS[s.payment_method]}
                    {s.installments > 1 ? ` · ${s.installments}x` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[16px] font-bold tracking-tight">
                    {brl(Number(s.total))}
                  </p>
                  <Tag
                    tone={
                      s.status === "paga"
                        ? "good"
                        : s.status === "pendente"
                          ? "gold"
                          : s.status === "trocada"
                            ? "glow"
                            : "bad"
                    }
                  >
                    {STATUS_LABELS[s.status]}
                  </Tag>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-muted">
                {s.sale_items
                  .map((i) => `${i.quantity}x ${i.product_name} (${i.size}/${i.color})`)
                  .join(", ")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SelectInput
                  className="w-auto py-1.5 text-[12px]"
                  value={s.status}
                  onChange={(e) => statusMut.mutate({ sale: s, status: e.target.value })}
                >
                  {Object.keys(STATUS_LABELS).map((k) => (
                    <option key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </option>
                  ))}
                </SelectInput>
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Excluir esta venda? O estoque será devolvido.")) removeMut.mutate(s);
                  }}
                >
                  Excluir
                </Btn>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

/* --------------------------- trocas --------------------------- */

function Trocas() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const customers = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const sales = useQuery({ queryKey: ["sales"], queryFn: () => fetchSales() });
  const exchanges = useQuery({ queryKey: ["exchanges"], queryFn: fetchExchanges });

  const [returnedId, setReturnedId] = useState("");
  const [deliveredId, setDeliveredId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [saleId, setSaleId] = useState("");
  const [notes, setNotes] = useState("");

  const options = useMemo(
    () =>
      (products.data ?? []).flatMap((p) =>
        p.variants.map((v) => ({
          id: v.id,
          label: `${p.name} · ${v.size} · ${v.color}`,
          price: Number(p.price),
          product_name: p.name,
          variant: v,
        })),
      ),
    [products.data],
  );

  const returned = options.find((o) => o.id === returnedId);
  const delivered = options.find((o) => o.id === deliveredId);
  const difference = (delivered?.price ?? 0) - (returned?.price ?? 0);

  const mut = useMutation({
    mutationFn: () =>
      createExchange({
        sale_id: saleId || null,
        customer_id: customerId || null,
        returned: {
          variant: returned!.variant,
          product_name: returned!.product_name,
          price: returned!.price,
        },
        delivered: {
          variant: delivered!.variant,
          product_name: delivered!.product_name,
          price: delivered!.price,
        },
        notes,
      }),
    onSuccess: () => {
      toast.success("Troca registrada e estoque ajustado");
      setReturnedId("");
      setDeliveredId("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Panel className="anim-rise space-y-3">
        <SectionTitle title="Nova troca" />
        <Field label="Produto devolvido (volta ao estoque)">
          <SelectInput value={returnedId} onChange={(e) => setReturnedId(e.target.value)}>
            <option value="">Selecione</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Produto entregue (sai do estoque)">
          <SelectInput value={deliveredId} onChange={(e) => setDeliveredId(e.target.value)}>
            <option value="">Selecione</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliente (opcional)">
            <SelectInput value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Sem cliente</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Venda de origem (opcional)">
            <SelectInput value={saleId} onChange={(e) => setSaleId(e.target.value)}>
              <option value="">Nenhuma</option>
              {(sales.data ?? []).slice(0, 50).map((s) => (
                <option key={s.id} value={s.id}>
                  {dateTimeLabel(s.created_at)} · {brl(Number(s.total))}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Observações">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] text-muted">
            {difference === 0
              ? "Sem diferença de valor"
              : difference > 0
                ? "Cliente paga a diferença"
                : "Devolver ao cliente"}
          </p>
          <p className="font-display text-[18px] font-bold tracking-tight">
            {brl(Math.abs(difference))}
          </p>
        </div>
        <Btn
          className="w-full"
          disabled={!returned || !delivered || mut.isPending}
          onClick={() => mut.mutate()}
        >
          Registrar troca
        </Btn>
      </Panel>

      <SectionTitle title="Trocas registradas" />
      {(exchanges.data ?? []).length === 0 ? (
        <EmptyState text="Nenhuma troca registrada." />
      ) : (
        <div className="space-y-2">
          {(exchanges.data ?? []).map((x) => (
            <Panel key={x.id}>
              <p className="text-[13px] font-medium">
                {x.returned_label} → {x.new_label}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {dateTimeLabel(x.created_at)}
                {x.customers?.name ? ` · ${x.customers.name}` : ""} · diferença{" "}
                {brl(Number(x.difference))}
              </p>
              {x.notes ? <p className="mt-1 text-[12px] text-muted">{x.notes}</p> : null}
              <div className="mt-2">
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Excluir o registro desta troca?")) return;
                    await deleteExchange(x.id);
                    toast.success("Troca excluída");
                    qc.invalidateQueries({ queryKey: ["exchanges"] });
                  }}
                >
                  Excluir
                </Btn>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
