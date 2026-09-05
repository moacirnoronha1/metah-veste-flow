import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShopShell } from "@/components/ShopShell";
import { Btn, Chip, Field, Panel, SectionTitle, TextArea, TextInput } from "@/components/kit";
import { getCatalog, submitCatalogOrder } from "@/lib/catalog.functions";
import { brl, PAYMENT_LABELS } from "@/lib/format";
import { FULFILLMENT_LABELS } from "@/lib/orders";
import { cart, cartTotal, useCart } from "@/lib/cart";

export const Route = createFileRoute("/catalogo/pedido")({
  loader: async () => {
    const { settings } = await getCatalog();
    return { settings };
  },
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Metah Veste" },
      {
        name: "description",
        content: "Confirme seus dados e envie seu pedido da Metah Veste pelo WhatsApp.",
      },
      { property: "og:title", content: "Finalizar pedido — Metah Veste" },
      { property: "og:description", content: "Confirme seus dados e envie seu pedido." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pedido,
});

function Pedido() {
  const { settings } = Route.useLoaderData();
  const items = useCart();
  const navigate = useNavigate();
  const total = cartTotal(items);

  const [step, setStep] = useState<"dados" | "conferencia" | "pronto">("dados");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState(settings.fulfillment_options[0] ?? "retirada");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState(settings.payment_options[0] ?? "pix");
  const [installments, setInstallments] = useState(1);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [link, setLink] = useState("");
  const [number, setNumber] = useState<number | null>(null);

  const ready =
    name.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 10 &&
    (fulfillment !== "entrega" || address.trim().length >= 5);

  function whatsappLink(orderNumber: number) {
    const lines = [
      settings.order_intro,
      "",
      `Pedido #${orderNumber}`,
      ...items.map(
        (i) => `• ${i.quantity}x ${i.name} — ${i.size} / ${i.color} — ${brl(i.price * i.quantity)}`,
      ),
      "",
      `Total: ${brl(total)}`,
      `Nome: ${name}`,
      `Telefone: ${phone}`,
      `Recebimento: ${FULFILLMENT_LABELS[fulfillment] ?? fulfillment}`,
      ...(fulfillment === "entrega" ? [`Endereço: ${address}`] : []),
      `Pagamento: ${PAYMENT_LABELS[payment] ?? payment}`,
      ...(payment === "credito" && installments > 1 ? [`Parcelas: ${installments}x`] : []),
      ...(notes.trim() ? [`Observações: ${notes.trim()}`] : []),
    ];
    return `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
      lines.join("\n"),
    )}`;
  }

  async function send() {
    setSending(true);
    try {
      const res = await submitCatalogOrder({
        data: {
          customer_name: name.trim(),
          phone: phone.trim(),
          fulfillment,
          address: address.trim(),
          payment_method: payment,
          installments,
          notes: notes.trim(),
          items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        },
      });
      const url = whatsappLink(res.number);
      setLink(url);
      setNumber(res.number);
      setStep("pronto");
      cart.clear();
      window.open(url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (items.length === 0 && step !== "pronto") {
    return (
      <ShopShell logoUrl={settings.logo_url}>
        <div className="px-5 py-10 text-center">
          <p className="text-[14px] text-muted">Seu carrinho está vazio.</p>
          <Btn variant="glow" className="mt-4" onClick={() => navigate({ to: "/catalogo" })}>
            Ver catálogo
          </Btn>
        </div>
      </ShopShell>
    );
  }

  return (
    <ShopShell logoUrl={settings.logo_url}>
      <div className="space-y-4 px-5 pt-5 pb-8">
        <h1 className="font-display text-[26px] leading-none font-bold tracking-tight">
          {step === "pronto" ? "Pedido enviado!" : "Finalizar pedido"}
        </h1>

        {step === "dados" ? (
          <>
            <Panel>
              <SectionTitle title="Seus dados" />
              <div className="space-y-3">
                <Field label="Nome">
                  <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                </Field>
                <Field label="Telefone / WhatsApp">
                  <TextInput
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    maxLength={20}
                    placeholder="(81) 99999-9999"
                  />
                </Field>
              </div>
            </Panel>

            <Panel>
              <SectionTitle title="Como quer receber" />
              <div className="flex gap-1.5">
                {settings.fulfillment_options.map((f) => (
                  <Chip
                    key={f}
                    tone="glow"
                    active={fulfillment === f}
                    onClick={() => setFulfillment(f)}
                  >
                    {FULFILLMENT_LABELS[f] ?? f}
                  </Chip>
                ))}
              </div>
              {fulfillment === "entrega" ? (
                <div className="mt-3">
                  <Field label="Endereço">
                    <TextArea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      maxLength={400}
                    />
                  </Field>
                  <p className="mt-1.5 font-mono text-[10px] text-muted">{settings.delivery_text}</p>
                </div>
              ) : null}
            </Panel>

            <Panel>
              <SectionTitle title="Pagamento" />
              <div className="grid grid-cols-3 gap-1.5">
                {settings.payment_options.map((p) => (
                  <Chip key={p} tone="glow" active={payment === p} onClick={() => setPayment(p)}>
                    {PAYMENT_LABELS[p] ?? p}
                  </Chip>
                ))}
              </div>
              {payment === "credito" ? (
                <div className="mt-3">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    Parcelas (a combinar)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Chip key={n} active={installments === n} onClick={() => setInstallments(n)}>
                        {n}x
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-3">
                <Field label="Observações">
                  <TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={600}
                  />
                </Field>
              </div>
            </Panel>

            <Btn
              variant="glow"
              className="w-full"
              disabled={!ready}
              onClick={() => setStep("conferencia")}
            >
              Conferir pedido
            </Btn>
          </>
        ) : null}

        {step === "conferencia" ? (
          <>
            <Panel>
              <SectionTitle title="Confira seu pedido" />
              <div className="space-y-2">
                {items.map((i) => (
                  <div key={i.variant_id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[13px]">
                      {i.quantity}x {i.name} · {i.size} / {i.color}
                    </span>
                    <span className="font-mono text-[12px]">{brl(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  Total
                </span>
                <span className="font-display text-[22px] font-bold tracking-tight">
                  {brl(total)}
                </span>
              </div>
            </Panel>

            <Panel>
              <p className="text-[13px] font-medium">{name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted">{phone}</p>
              <p className="mt-2 text-[12px] text-muted">
                {FULFILLMENT_LABELS[fulfillment] ?? fulfillment}
                {fulfillment === "entrega" ? ` · ${address}` : ""}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                {PAYMENT_LABELS[payment] ?? payment}
                {payment === "credito" && installments > 1 ? ` · ${installments}x` : ""}
              </p>
              {notes.trim() ? <p className="mt-2 text-[12px]">{notes}</p> : null}
            </Panel>

            <div className="flex gap-2">
              <Btn variant="outline" onClick={() => setStep("dados")}>
                Voltar
              </Btn>
              <Btn variant="glow" className="flex-1" disabled={sending} onClick={send}>
                {sending ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
              </Btn>
            </div>
          </>
        ) : null}

        {step === "pronto" ? (
          <Panel>
            <p className="text-[14px]">
              Seu pedido <strong>#{number}</strong> foi registrado e está aguardando confirmação.
            </p>
            <p className="mt-2 text-[13px] text-muted">
              Se o WhatsApp não abriu automaticamente, use o botão abaixo.
            </p>
            <a href={link} target="_blank" rel="noreferrer" className="mt-4 block">
              <Btn variant="glow" className="w-full">
                Abrir WhatsApp
              </Btn>
            </a>
            <Link
              to="/catalogo"
              className="mt-3 block text-center font-mono text-[11px] text-muted underline"
            >
              Voltar ao catálogo
            </Link>
          </Panel>
        ) : null}
      </div>
    </ShopShell>
  );
}
