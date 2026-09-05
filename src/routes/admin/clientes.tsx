import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Btn, EmptyState, Field, Modal, Panel, Tag, TextArea, TextInput } from "@/components/kit";
import { deleteCustomer, fetchCustomers, fetchSales, saveCustomer } from "@/lib/api";
import { brl, dateLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Metah Veste" },
      {
        name: "description",
        content:
          "Cadastro de clientes da Metah Veste com contato, aniversário, histórico de compras e total gasto.",
      },
      { property: "og:title", content: "Clientes — Metah Veste" },
      {
        property: "og:description",
        content: "Contato, aniversário, histórico de compras e total gasto por cliente.",
      },
    ],
  }),
  component: ClientesPage,
});

const empty = {
  id: undefined as string | undefined,
  name: "",
  phone: "",
  instagram: "",
  email: "",
  cpf: "",
  birthday: "",
  notes: "",
};

function ClientesPage() {
  const qc = useQueryClient();
  const customers = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const sales = useQuery({ queryKey: ["sales"], queryFn: () => fetchSales() });

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: () =>
      saveCustomer({
        id: form.id,
        name: form.name.trim(),
        phone: form.phone,
        instagram: form.instagram,
        email: form.email,
        cpf: form.cpf,
        birthday: form.birthday || null,
        notes: form.notes,
      }),
    onSuccess: () => {
      toast.success(form.id ? "Cliente atualizado" : "Cliente cadastrado");
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      toast.success("Cliente excluído");
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const spentByCustomer = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const s of sales.data ?? []) {
      if (!s.customer_id || s.status === "cancelada") continue;
      const cur = map.get(s.customer_id) ?? { total: 0, count: 0 };
      cur.total += Number(s.total);
      cur.count += 1;
      map.set(s.customer_id, cur);
    }
    return map;
  }, [sales.data]);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (customers.data ?? []).filter(
      (c) =>
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.phone ?? "").includes(term) ||
        (c.instagram ?? "").toLowerCase().includes(term),
    );
  }, [customers.data, search]);

  const detail = (customers.data ?? []).find((c) => c.id === detailId) ?? null;
  const detailSales = (sales.data ?? []).filter((s) => s.customer_id === detailId);

  return (
    <AppShell title="Clientes" subtitle={`${customers.data?.length ?? 0} cadastrados`}>
      <div className="space-y-4 px-5">
        <div className="flex gap-2">
          <TextInput
            placeholder="Pesquisar por nome, telefone ou @"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Btn
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
          >
            Novo
          </Btn>
        </div>

        {list.length === 0 ? (
          <EmptyState text="Nenhum cliente encontrado." />
        ) : (
          <div className="space-y-2.5">
            {list.map((c) => {
              const stats = spentByCustomer.get(c.id);
              return (
                <Panel key={c.id} className="anim-rise">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">{c.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted">
                        {[c.phone, c.instagram, c.email].filter(Boolean).join(" · ") || "sem contato"}
                      </p>
                    </div>
                    <Tag tone="good">{brl(stats?.total ?? 0)}</Tag>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn size="sm" variant="outline" onClick={() => setDetailId(c.id)}>
                      Histórico ({stats?.count ?? 0})
                    </Btn>
                    <Btn
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({
                          id: c.id,
                          name: c.name,
                          phone: c.phone ?? "",
                          instagram: c.instagram ?? "",
                          email: c.email ?? "",
                          cpf: c.cpf ?? "",
                          birthday: c.birthday ?? "",
                          notes: c.notes ?? "",
                        });
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Excluir ${c.name}?`)) removeMut.mutate(c.id);
                      }}
                    >
                      Excluir
                    </Btn>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={open} title={form.id ? "Editar cliente" : "Novo cliente"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Nome">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone">
              <TextInput
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Instagram">
              <TextInput
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@metahveste"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="CPF">
              <TextInput
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Aniversário">
            <TextInput
              type="date"
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            />
          </Field>
          <Field label="Observações">
            <TextArea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex gap-2">
            <Btn
              className="flex-1"
              disabled={!form.name.trim() || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              Salvar
            </Btn>
            <Btn variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} title={detail?.name ?? ""} onClose={() => setDetailId(null)}>
        <div className="space-y-3">
          {detail?.notes ? (
            <p className="rounded-xl bg-card p-3 text-[13px] ring-1 ring-line">{detail.notes}</p>
          ) : null}
          <p className="font-mono text-[11px] text-muted">
            Total gasto:{" "}
            {brl(
              detailSales
                .filter((s) => s.status !== "cancelada")
                .reduce((s, v) => s + Number(v.total), 0),
            )}
          </p>
          {detailSales.length === 0 ? (
            <EmptyState text="Sem compras registradas." />
          ) : (
            <div className="space-y-2">
              {detailSales.map((s) => (
                <div key={s.id} className="rounded-xl bg-card p-3 ring-1 ring-line">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted">
                      {dateLabel(s.created_at)}
                    </span>
                    <span className="font-display text-[14px] font-bold">{brl(Number(s.total))}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">
                    {s.sale_items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}
