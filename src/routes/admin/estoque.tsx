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
  Tag,
  TextArea,
  TextInput,
} from "@/components/kit";
import {
  addVariant,
  applyStockChange,
  deleteProduct,
  deleteVariant,
  fetchMovements,
  fetchProducts,
  saveProduct,
  saveProductOrder,
  type ProductWithVariants,
  type Variant,
} from "@/lib/api";
import { ReorderList } from "@/components/ReorderList";
import { brl, dateTimeLabel } from "@/lib/format";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({
    meta: [
      { title: "Produtos e estoque — Metah Veste" },
      {
        name: "description",
        content:
          "Cadastro de produtos, controle de estoque por tamanho e cor, entradas, saídas e histórico de movimentações.",
      },
      { property: "og:title", content: "Produtos e estoque — Metah Veste" },
      {
        property: "og:description",
        content: "Cadastre produtos, controle o estoque por tamanho e cor e veja as movimentações.",
      },
    ],
  }),
  component: EstoquePage,
});

const emptyProduct = {
  id: undefined as string | undefined,
  name: "",
  category: "",
  cost: "",
  price: "",
  low_stock_threshold: "3",
  active: true,
  description: "",
  images: [] as string[],
  show_in_catalog: true,
  featured: false,
  is_new: false,
};


function EstoquePage() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const movements = useQuery({ queryKey: ["movements"], queryFn: () => fetchMovements() });

  const [tab, setTab] = useState<"produtos" | "ordem" | "historico">("produtos");
  const [orderIds, setOrderIds] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyProduct);
  const [formOpen, setFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [variantFor, setVariantFor] = useState<ProductWithVariants | null>(null);
  const [variantForm, setVariantForm] = useState({ size: "M", color: "", quantity: "0" });
  const [moveFor, setMoveFor] = useState<{ product: ProductWithVariants; variant: Variant } | null>(
    null,
  );
  const [moveForm, setMoveForm] = useState({
    kind: "entrada" as "entrada" | "saida" | "ajuste",
    quantity: "1",
    reason: "",
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["movements"] });
  };

  const orderMut = useMutation({
    mutationFn: (ids: string[]) => saveProductOrder(ids),
    onSuccess: () => {
      toast.success("Ordem do catálogo salva");
      setOrderIds(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      saveProduct({
        id: form.id,
        name: form.name.trim(),
        category: form.category.trim() || "Geral",
        cost: Number(form.cost) || 0,
        price: Number(form.price) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
        active: form.active,
        description: form.description.trim() || null,
        images: form.images,
        show_in_catalog: form.show_in_catalog,
        featured: form.featured,
        is_new: form.is_new,
      }),

    onSuccess: () => {
      toast.success(form.id ? "Produto atualizado" : "Produto cadastrado");
      setFormOpen(false);
      setForm(emptyProduct);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Produto excluído");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const variantMut = useMutation({
    mutationFn: () =>
      addVariant({
        product_id: variantFor!.id,
        product_name: variantFor!.name,
        size: variantForm.size.trim() || "Único",
        color: variantForm.color.trim() || "Único",
        quantity: Number(variantForm.quantity) || 0,
      }),
    onSuccess: () => {
      toast.success("Variação adicionada");
      setVariantFor(null);
      setVariantForm({ size: "M", color: "", quantity: "0" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveMut = useMutation({
    mutationFn: () =>
      applyStockChange({
        variant: moveFor!.variant,
        product_name: moveFor!.product.name,
        kind: moveForm.kind,
        quantity: Number(moveForm.quantity) || 0,
        reason: moveForm.reason,
      }),
    onSuccess: () => {
      toast.success("Estoque atualizado");
      setMoveFor(null);
      setMoveForm({ kind: "entrada", quantity: "1", reason: "" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products.data ?? []).filter(
      (p) =>
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.variants.some((v) => `${v.size} ${v.color}`.toLowerCase().includes(term)),
    );
  }, [products.data, search]);

  const totalUnits = (p: ProductWithVariants) =>
    p.variants.reduce((s, v) => s + v.quantity, 0);

  return (
    <AppShell title="Produtos" subtitle="estoque por tamanho e cor">
      <div className="space-y-4 px-5">
        <div className="grid grid-cols-2 gap-1.5">
          <Chip active={tab === "produtos"} onClick={() => setTab("produtos")}>
            Produtos
          </Chip>
          <Chip active={tab === "historico"} onClick={() => setTab("historico")}>
            Movimentações
          </Chip>
        </div>

        {tab === "produtos" ? (
          <>
            <div className="flex gap-2">
              <TextInput
                placeholder="Pesquisar produto, cor ou tamanho"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Btn
                onClick={() => {
                  setForm(emptyProduct);
                  setFormOpen(true);
                }}
              >
                Novo
              </Btn>
            </div>

            {products.isLoading ? (
              <EmptyState text="Carregando..." />
            ) : list.length === 0 ? (
              <EmptyState text="Nenhum produto cadastrado ainda." />
            ) : (
              <div className="space-y-2.5">
                {list.map((p) => (
                  <Panel key={p.id} className="anim-rise">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold">{p.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted">
                          {p.category} · custo {brl(Number(p.cost))} · venda{" "}
                          {brl(Number(p.price))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-[16px] font-bold tracking-tight">
                          {totalUnits(p)}
                        </p>
                        <p className="font-mono text-[10px] text-muted">un</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {p.variants.length === 0 ? (
                        <p className="font-mono text-[11px] text-muted">Sem variações.</p>
                      ) : (
                        p.variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2"
                          >
                            <span className="flex-1 text-[12px]">
                              {v.size} · {v.color}
                            </span>
                            <Tag
                              tone={
                                v.quantity === 0
                                  ? "bad"
                                  : v.quantity <= p.low_stock_threshold
                                    ? "glow"
                                    : "good"
                              }
                            >
                              {v.quantity} un
                            </Tag>
                            <Btn
                              size="sm"
                              variant="outline"
                              onClick={() => setMoveFor({ product: p, variant: v })}
                            >
                              Movimentar
                            </Btn>
                            <button
                              aria-label="Excluir variação"
                              className="px-1 text-muted"
                              onClick={async () => {
                                if (!confirm("Excluir esta variação?")) return;
                                await deleteVariant(v.id);
                                toast.success("Variação excluída");
                                refresh();
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn size="sm" variant="outline" onClick={() => setVariantFor(p)}>
                        + Variação
                      </Btn>
                      <Btn
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setForm({
                            id: p.id,
                            name: p.name,
                            category: p.category,
                            cost: String(p.cost),
                            price: String(p.price),
                            low_stock_threshold: String(p.low_stock_threshold),
                            active: p.active,
                            description: p.description ?? "",
                            images: p.images ?? [],
                            show_in_catalog: p.show_in_catalog,
                            featured: p.featured,
                            is_new: p.is_new,
                          });

                          setFormOpen(true);
                        }}
                      >
                        Editar
                      </Btn>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Excluir "${p.name}"?`)) removeMut.mutate(p.id);
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
        ) : (
          <>
            <SectionTitle title="Histórico de movimentações" aside="últimas 60" />
            {(movements.data ?? []).length === 0 ? (
              <EmptyState text="Nenhuma movimentação registrada." />
            ) : (
              <div className="space-y-2">
                {(movements.data ?? []).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{m.product_name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted">
                        {m.size} · {m.color} · {dateTimeLabel(m.created_at)}
                        {m.reason ? ` · ${m.reason}` : ""}
                      </p>
                    </div>
                    <Tag
                      tone={m.kind === "entrada" ? "good" : m.kind === "saida" ? "glow" : "gold"}
                    >
                      {m.kind} {m.quantity}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={formOpen}
        title={form.id ? "Editar produto" : "Novo produto"}
        onClose={() => setFormOpen(false)}
      >
        <div className="space-y-3">
          <Field label="Nome">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Camiseta Box"
            />
          </Field>
          <Field label="Categoria">
            <TextInput
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Camisetas"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Custo (R$)">
              <TextInput
                inputMode="decimal"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </Field>
            <Field label="Preço de venda (R$)">
              <TextInput
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Alerta de estoque baixo (un)">
            <TextInput
              inputMode="numeric"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
            />
          </Field>
          <Field label="Descrição para o catálogo">
            <TextArea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Fotos do produto">
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full text-[11px] text-muted"
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                const files = [...(e.target.files ?? [])];
                e.target.value = "";
                if (files.length === 0) return;
                setUploading(true);
                try {
                  const urls: string[] = [];
                  for (const file of files) urls.push(await uploadImage(file));
                  setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
                  toast.success("Fotos enviadas.");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setUploading(false);
                }
              }}
            />
          </Field>
          {uploading ? <p className="font-mono text-[10px] text-muted">Enviando fotos...</p> : null}
          {form.images.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {form.images.map((img) => (
                <div key={img} className="relative shrink-0">
                  <img
                    src={img}
                    alt="Foto do produto"
                    className="size-16 rounded-xl object-cover ring-1 ring-line"
                  />
                  <button
                    onClick={() =>
                      setForm((f) => ({ ...f, images: f.images.filter((i) => i !== img) }))
                    }
                    className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-bad text-[10px] text-card"
                    aria-label="Remover foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <Chip
              tone="glow"
              active={form.show_in_catalog}
              onClick={() => setForm({ ...form, show_in_catalog: !form.show_in_catalog })}
            >
              No catálogo
            </Chip>
            <Chip
              tone="glow"
              active={form.is_new}
              onClick={() => setForm({ ...form, is_new: !form.is_new })}
            >
              Lançamento
            </Chip>
            <Chip
              tone="glow"
              active={form.featured}
              onClick={() => setForm({ ...form, featured: !form.featured })}
            >
              Destaque
            </Chip>
          </div>

          <div className="flex gap-2 pt-1">
            <Btn
              className="flex-1"
              disabled={!form.name.trim() || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              Salvar
            </Btn>
            <Btn variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!variantFor}
        title={`Variação · ${variantFor?.name ?? ""}`}
        onClose={() => setVariantFor(null)}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tamanho">
              <TextInput
                value={variantForm.size}
                onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
              />
            </Field>
            <Field label="Cor">
              <TextInput
                value={variantForm.color}
                onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                placeholder="Preto"
              />
            </Field>
            <Field label="Qtd">
              <TextInput
                inputMode="numeric"
                value={variantForm.quantity}
                onChange={(e) => setVariantForm({ ...variantForm, quantity: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Btn
              className="flex-1"
              disabled={variantMut.isPending}
              onClick={() => variantMut.mutate()}
            >
              Adicionar
            </Btn>
            <Btn variant="outline" onClick={() => setVariantFor(null)}>
              Cancelar
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!moveFor}
        title={`Movimentar · ${moveFor?.variant.size ?? ""} ${moveFor?.variant.color ?? ""}`}
        onClose={() => setMoveFor(null)}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {(["entrada", "saida", "ajuste"] as const).map((k) => (
              <Chip
                key={k}
                active={moveForm.kind === k}
                tone="glow"
                onClick={() => setMoveForm({ ...moveForm, kind: k })}
              >
                {k === "saida" ? "saída" : k}
              </Chip>
            ))}
          </div>
          <Field label={moveForm.kind === "ajuste" ? "Nova quantidade" : "Quantidade"}>
            <TextInput
              inputMode="numeric"
              value={moveForm.quantity}
              onChange={(e) => setMoveForm({ ...moveForm, quantity: e.target.value })}
            />
          </Field>
          <Field label="Motivo (opcional)">
            <TextInput
              value={moveForm.reason}
              onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })}
              placeholder="Reposição, perda, contagem..."
            />
          </Field>
          <div className="flex gap-2">
            <Btn className="flex-1" disabled={moveMut.isPending} onClick={() => moveMut.mutate()}>
              Salvar
            </Btn>
            <Btn variant="outline" onClick={() => setMoveFor(null)}>
              Cancelar
            </Btn>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
