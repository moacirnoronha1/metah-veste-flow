import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Btn, Chip, EmptyState, Modal, Panel, SectionTitle, Tag } from "@/components/kit";
import {
  convertOrderToSale,
  deleteCatalogOrder,
  fetchCatalogOrders,
  fetchCustomers,
  fetchProducts,
  updateOrderStatus,
  type CatalogOrder,
} from "@/lib/api";
import { brl, dateTimeLabel, PAYMENT_LABELS } from "@/lib/format";
import { FULFILLMENT_LABELS, ORDER_STATUS, ORDER_STATUS_LIST } from "@/lib/orders";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos do catálogo — Metah Veste" },
      {
        name: "description",
        content: "Pedidos recebidos pelo catálogo online da Metah Veste.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pedidos,
});

function statusTone(status: string) {
  if (status === "cancelado") return "bad" as const;
  if (status === "finalizado") return "good" as const;
  if (status === "aguardando") return "glow" as const;
  return "gold" as const;
}

function Pedidos() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("todos");
  const [open, setOpen] = useState<CatalogOrder | null>(null);

  const orders = useQuery({ queryKey: ["catalog-orders"], queryFn: () => fetchCatalogOrders() });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const customers = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog-orders"] });
      toast.success("Situação atualizada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: deleteCatalogOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog-orders"] });
      setOpen(null);
      toast.success("Pedido excluído.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertMut = useMutation({
    mutationFn: (order: CatalogOrder) =>
      convertOrderToSale(order, products.data ?? [], customers.data ?? []),
    onSuccess: () => {
      qc.invalidateQueries();
      setOpen(null);
      toast.success("Venda registrada e estoque baixado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (orders.data ?? []).filter((o) => filter === "todos" || o.status === filter);

  return (
    <AppShell title="Pedidos" subtitle="chegaram pelo catálogo online">
      <div className="mb-3 flex gap-1.5 overflow-x-auto px-5 pb-1">
        <Chip active={filter === "todos"} tone="glow" onClick={() => setFilter("todos")}>
          Todos
        </Chip>
        {ORDER_STATUS_LIST.map((s) => (
          <Chip key={s} active={filter === s} tone="glow" onClick={() => setFilter(s)}>
            {ORDER_STATUS[s]}
          </Chip>
        ))}
      </div>

      <div className="space-y-2 px-5">
        {list.length === 0 ? (
          <EmptyState text="Nenhum pedido por aqui ainda." />
        ) : (
          list.map((o) => (
            <button key={o.id} onClick={() => setOpen(o)} className="w-full text-left">
              <Panel className="anim-rise">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">
                      #{o.number} · {o.customer_name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">
                      {dateTimeLabel(o.created_at)} · {o.catalog_order_items?.length ?? 0} itens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[15px] font-bold tracking-tight">
                      {brl(Number(o.total))}
                    </p>
                    <div className="mt-1">
                      <Tag tone={statusTone(o.status)}>{ORDER_STATUS[o.status] ?? o.status}</Tag>
                    </div>
                  </div>
                </div>
              </Panel>
            </button>
          ))
        )}
      </div>

      <Modal
        open={!!open}
        title={open ? `Pedido #${open.number}` : ""}
        onClose={() => setOpen(null)}
      >
        {open ? (
          <div className="space-y-4">
            <Panel>
              <p className="text-[14px] font-medium">{open.customer_name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted">{open.phone}</p>
              <p className="mt-2 text-[12px] text-muted">
                {FULFILLMENT_LABELS[open.fulfillment] ?? open.fulfillment}
                {open.address ? ` · ${open.address}` : ""}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                {PAYMENT_LABELS[open.payment_method] ?? open.payment_method}
                {open.installments > 1 ? ` · ${open.installments}x` : ""}
              </p>
              {open.notes ? <p className="mt-2 text-[12px]">{open.notes}</p> : null}
            </Panel>

            <div>
              <SectionTitle title="Itens" />
              <div className="space-y-2">
                {(open.catalog_order_items ?? []).map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{i.product_name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted">
                        {i.size} · {i.color} · {i.quantity} un
                      </p>
                    </div>
                    <span className="font-mono text-[12px]">
                      {brl(Number(i.unit_price) * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right font-display text-[18px] font-bold tracking-tight">
                {brl(Number(open.total))}
              </p>
            </div>

            <div>
              <SectionTitle title="Situação" />
              <div className="grid grid-cols-3 gap-1.5">
                {ORDER_STATUS_LIST.map((s) => (
                  <Chip
                    key={s}
                    tone="glow"
                    active={open.status === s}
                    onClick={() => {
                      statusMut.mutate({ id: open.id, status: s });
                      setOpen({ ...open, status: s });
                    }}
                  >
                    {ORDER_STATUS[s]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Btn
                variant="glow"
                className="flex-1"
                disabled={!!open.sale_id || convertMut.isPending}
                onClick={() => convertMut.mutate(open)}
              >
                {open.sale_id ? "Já virou venda" : "Transformar em venda"}
              </Btn>
              <Btn
                variant="danger"
                onClick={() => {
                  if (confirm("Excluir este pedido?")) delMut.mutate(open.id);
                }}
              >
                Excluir
              </Btn>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
