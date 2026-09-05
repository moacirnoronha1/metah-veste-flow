import { createServerFn } from "@tanstack/react-start";

export type CatalogVariant = {
  id: string;
  size: string;
  color: string;
  quantity: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  images: string[];
  featured: boolean;
  is_new: boolean;
  variants: CatalogVariant[];
};

export type CatalogSettings = {
  whatsapp_number: string;
  order_intro: string;
  banner_url: string | null;
  logo_url: string | null;
  banner_title: string;
  banner_subtitle: string;
  payment_options: string[];
  fulfillment_options: string[];
  delivery_text: string;
  show_out_of_stock: boolean;
};

const DEFAULT_SETTINGS: CatalogSettings = {
  whatsapp_number: "5581999045295",
  order_intro: "Olá! Quero fazer um pedido na Metah Veste:",
  banner_url: null,
  logo_url: null,
  banner_title: "Metah Veste",
  banner_subtitle: "Moda jovem, minimalista e cheia de atitude.",
  payment_options: ["pix", "dinheiro", "debito", "credito", "link"],
  fulfillment_options: ["retirada", "entrega"],
  delivery_text: "Entregamos na região. Combine o frete pelo WhatsApp.",
  show_out_of_stock: true,
};

async function loadSettings(): Promise<CatalogSettings> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  const row = data as Record<string, unknown>;
  return {
    whatsapp_number: String(row["whatsapp_number"] ?? DEFAULT_SETTINGS.whatsapp_number),
    order_intro: String(row["order_intro"] ?? DEFAULT_SETTINGS.order_intro),
    banner_url: (row["banner_url"] as string) ?? null,
    logo_url: (row["logo_url"] as string) ?? null,
    banner_title: String(row["banner_title"] ?? DEFAULT_SETTINGS.banner_title),
    banner_subtitle: String(row["banner_subtitle"] ?? DEFAULT_SETTINGS.banner_subtitle),
    payment_options: (row["payment_options"] as string[]) ?? DEFAULT_SETTINGS.payment_options,
    fulfillment_options:
      (row["fulfillment_options"] as string[]) ?? DEFAULT_SETTINGS.fulfillment_options,
    delivery_text: String(row["delivery_text"] ?? DEFAULT_SETTINGS.delivery_text),
    show_out_of_stock: row["show_out_of_stock"] !== false,
  };
}

function mapProduct(row: Record<string, unknown>): CatalogProduct {
  const variants = ((row["variants"] as Record<string, unknown>[]) ?? []).map((v) => ({
    id: String(v["id"]),
    size: String(v["size"]),
    color: String(v["color"]),
    quantity: Number(v["quantity"] ?? 0),
  }));
  variants.sort((a, b) => `${a.size}${a.color}`.localeCompare(`${b.size}${b.color}`));
  return {
    id: String(row["id"]),
    name: String(row["name"]),
    category: String(row["category"]),
    price: Number(row["price"] ?? 0),
    description: (row["description"] as string) ?? null,
    images: (row["images"] as string[]) ?? [],
    featured: row["featured"] === true,
    is_new: row["is_new"] === true,
    variants,
  };
}

const PUBLIC_COLUMNS =
  "id, name, category, price, description, images, featured, is_new, variants(id, size, color, quantity)";

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const settings = await loadSettings();
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("active", true)
    .eq("show_in_catalog", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const products = ((data ?? []) as unknown as Record<string, unknown>[]).map(mapProduct);
  return { settings, products };
});

export const getCatalogProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const settings = await loadSettings();
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .select(PUBLIC_COLUMNS)
      .eq("id", data.id)
      .eq("active", true)
      .eq("show_in_catalog", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      settings,
      product: row ? mapProduct(row as unknown as Record<string, unknown>) : null,
    };
  });

export type OrderInput = {
  customer_name: string;
  phone: string;
  fulfillment: string;
  address?: string;
  payment_method: string;
  installments: number;
  notes?: string;
  items: { variant_id: string; quantity: number }[];
};

export const submitCatalogOrder = createServerFn({ method: "POST" })
  .inputValidator((data: OrderInput) => data)
  .handler(async ({ data }) => {
    const name = String(data.customer_name ?? "").trim();
    const phone = String(data.phone ?? "").trim();
    if (name.length < 2 || name.length > 120) throw new Error("Informe seu nome.");
    if (phone.replace(/\D/g, "").length < 10) throw new Error("Informe um telefone válido.");
    if (!Array.isArray(data.items) || data.items.length === 0)
      throw new Error("Seu carrinho está vazio.");
    if (data.items.length > 40) throw new Error("Pedido muito grande.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => String(i.variant_id));
    const { data: variants, error: vErr } = await supabaseAdmin
      .from("variants")
      .select("id, size, color, quantity, product_id, products(id, name, price, active)")
      .in("id", ids);
    if (vErr) throw new Error(vErr.message);

    const rows = (variants ?? []) as unknown as Record<string, unknown>[];
    const items = data.items.map((item) => {
      const v = rows.find((r) => String(r["id"]) === String(item.variant_id));
      if (!v) throw new Error("Um dos produtos não está mais disponível.");
      const product = v["products"] as Record<string, unknown>;
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      if (qty > Number(v["quantity"] ?? 0))
        throw new Error(`Estoque insuficiente para ${String(product["name"])}.`);
      return {
        variant_id: String(v["id"]),
        product_id: String(product["id"]),
        product_name: String(product["name"]),
        size: String(v["size"]),
        color: String(v["color"]),
        quantity: qty,
        unit_price: Number(product["price"] ?? 0),
      };
    });

    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    const { data: order, error: oErr } = await supabaseAdmin
      .from("catalog_orders")
      .insert({
        customer_name: name,
        phone,
        fulfillment: data.fulfillment === "entrega" ? "entrega" : "retirada",
        address: (data.address ?? "").trim().slice(0, 400) || null,
        payment_method: String(data.payment_method ?? "pix").slice(0, 20),
        installments: Math.max(1, Math.min(12, Math.floor(Number(data.installments) || 1))),
        notes: (data.notes ?? "").trim().slice(0, 600) || null,
        total,
        status: "aguardando",
      })
      .select("id, number")
      .single();
    if (oErr) throw new Error(oErr.message);

    const orderRow = order as unknown as { id: string; number: number };
    const { error: iErr } = await supabaseAdmin
      .from("catalog_order_items")
      .insert(items.map((i) => ({ ...i, order_id: orderRow.id })));
    if (iErr) throw new Error(iErr.message);

    return { id: orderRow.id, number: orderRow.number, total, items };
  });
