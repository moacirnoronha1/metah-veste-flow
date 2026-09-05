import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Btn, Chip, Field, Panel, SectionTitle, TextArea, TextInput } from "@/components/kit";
import { fetchSettings, saveSettings, type Settings } from "@/lib/api";
import { PAYMENT_LABELS } from "@/lib/format";
import { FULFILLMENT_LABELS } from "@/lib/orders";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/admin/config")({
  head: () => ({
    meta: [
      { title: "Configurações da loja — Metah Veste" },
      {
        name: "description",
        content: "Ajuste WhatsApp, banner, formas de pagamento e entrega do catálogo.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Config,
});

const PAYMENTS = ["pix", "dinheiro", "debito", "credito", "link"];
const FULFILLMENTS = ["retirada", "entrega"];

function Config() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [form, setForm] = useState<Settings | null>(null);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);

  useEffect(() => {
    if (settings.data && !form) setForm(settings.data);
  }, [settings.data, form]);

  const save = useMutation({
    mutationFn: (input: Settings) =>
      saveSettings({
        whatsapp_number: input.whatsapp_number.replace(/\D/g, ""),
        order_intro: input.order_intro,
        banner_url: input.banner_url,
        logo_url: input.logo_url,
        banner_title: input.banner_title,
        banner_subtitle: input.banner_subtitle,
        payment_options: input.payment_options,
        fulfillment_options: input.fulfillment_options,
        delivery_text: input.delivery_text,
        show_out_of_stock: input.show_out_of_stock,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) {
    return (
      <AppShell title="Configurações" subtitle="carregando...">
        <div className="px-5" />
      </AppShell>
    );
  }

  const set = (patch: Partial<Settings>) => setForm({ ...form, ...patch });

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function pick(kind: "logo" | "banner", file?: File) {
    if (!file || !form) return;
    setUploading(kind);
    try {
      const url = await uploadImage(file);
      setForm({ ...form, [kind === "logo" ? "logo_url" : "banner_url"]: url });
      toast.success("Imagem enviada. Salve para aplicar.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  return (
    <AppShell title="Configurações" subtitle="catálogo e WhatsApp">
      <div className="space-y-4 px-5">
        <Panel>
          <SectionTitle title="WhatsApp" />
          <div className="space-y-3">
            <Field label="Número (com DDI e DDD)">
              <TextInput
                value={form.whatsapp_number}
                onChange={(e) => set({ whatsapp_number: e.target.value })}
                placeholder="5581999045295"
              />
            </Field>
            <Field label="Mensagem inicial do pedido">
              <TextArea
                value={form.order_intro}
                onChange={(e) => set({ order_intro: e.target.value })}
              />
            </Field>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Vitrine" />
          <div className="space-y-3">
            <Field label="Título do banner">
              <TextInput
                value={form.banner_title}
                onChange={(e) => set({ banner_title: e.target.value })}
              />
            </Field>
            <Field label="Subtítulo do banner">
              <TextInput
                value={form.banner_subtitle}
                onChange={(e) => set({ banner_subtitle: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Logo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => pick("logo", e.target.files?.[0])}
                  className="w-full text-[11px] text-muted"
                />
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Logo da loja"
                    className="mt-2 h-14 w-14 rounded-xl object-cover ring-1 ring-line"
                  />
                ) : null}
              </Field>
              <Field label="Banner">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => pick("banner", e.target.files?.[0])}
                  className="w-full text-[11px] text-muted"
                />
                {form.banner_url ? (
                  <img
                    src={form.banner_url}
                    alt="Banner da loja"
                    className="mt-2 h-14 w-full rounded-xl object-cover ring-1 ring-line"
                  />
                ) : null}
              </Field>
            </div>
            {uploading ? (
              <p className="font-mono text-[10px] text-muted">Enviando imagem...</p>
            ) : null}
            <Chip
              tone="glow"
              active={form.show_out_of_stock}
              onClick={() => set({ show_out_of_stock: !form.show_out_of_stock })}
            >
              Mostrar produtos esgotados
            </Chip>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Pagamento e recebimento" />
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Formas de pagamento
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENTS.map((p) => (
                  <Chip
                    key={p}
                    tone="glow"
                    active={form.payment_options.includes(p)}
                    onClick={() => set({ payment_options: toggle(form.payment_options, p) })}
                  >
                    {PAYMENT_LABELS[p] ?? p}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Recebimento
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {FULFILLMENTS.map((f) => (
                  <Chip
                    key={f}
                    tone="glow"
                    active={form.fulfillment_options.includes(f)}
                    onClick={() => set({ fulfillment_options: toggle(form.fulfillment_options, f) })}
                  >
                    {FULFILLMENT_LABELS[f]}
                  </Chip>
                ))}
              </div>
            </div>
            <Field label="Texto sobre entrega">
              <TextArea
                value={form.delivery_text}
                onChange={(e) => set({ delivery_text: e.target.value })}
              />
            </Field>
          </div>
        </Panel>

        <div className="flex gap-2">
          <Btn
            variant="glow"
            className="flex-1"
            disabled={save.isPending}
            onClick={() => save.mutate(form)}
          >
            Salvar configurações
          </Btn>
          <Btn variant="outline" onClick={() => setForm(settings.data ?? form)}>
            Cancelar
          </Btn>
        </div>

        <Link
          to="/catalogo"
          className="block pb-4 text-center font-mono text-[11px] text-muted underline"
        >
          Ver catálogo público
        </Link>
      </div>
    </AppShell>
  );
}
