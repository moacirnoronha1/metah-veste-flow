import { db } from "@/lib/admin-db";

export type Product = {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  low_stock_threshold: number;
  active: boolean;
  created_at: string;
  description: string | null;
  images: string[];
  show_in_catalog: boolean;
  featured: boolean;
  is_new: boolean;
  sort_order: number;
};


export type Variant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
};

export type ProductWithVariants = Product & { variants: Variant[] };

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  instagram: string | null;
  email: string | null;
  cpf: string | null;
  birthday: string | null;
  notes: string | null;
  created_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  variant_id: string | null;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
};

export type Sale = {
  id: string;
  customer_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  cost_total: number;
  payment_method: string;
  installments: number;
  status: string;
  notes: string | null;
  created_at: string;
  sale_items: SaleItem[];
  customers: { id: string; name: string } | null;
};

export type Movement = {
  id: string;
  variant_id: string | null;
  product_name: string;
  size: string;
  color: string;
  kind: string;
  quantity: number;
  reason: string | null;
  created_at: string;
};

export type Exchange = {
  id: string;
  sale_id: string | null;
  customer_id: string | null;
  returned_label: string;
  new_label: string;
  difference: number;
  notes: string | null;
  created_at: string;
  customers: { name: string } | null;
};


function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

/* ---------------- products ---------------- */

export async function fetchProducts(): Promise<ProductWithVariants[]> {
  const res = await db
    .from("products")
    .select("*, variants(*)")
    .order("created_at", { ascending: false });
  const rows = unwrap<ProductWithVariants[]>(res);
  return rows
    .map((p) => ({
      ...p,
      variants: [...(p.variants ?? [])].sort((a, b) =>
        `${a.size}${a.color}`.localeCompare(`${b.size}${b.color}`),
      ),
    }))
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

/** Salva a ordem manual dos produtos no catálogo. */
export async function saveProductOrder(ids: string[]) {
  for (let i = 0; i < ids.length; i++) {
    const res = await db
      .from("products")
      .update({ sort_order: i + 1 })
      .eq("id", ids[i] as string);
    if (res.error) throw new Error(res.error.message);
  }
}

export async function saveProduct(input: {
  id?: string | undefined;
  name: string;
  category: string;
  cost: number;
  price: number;
  low_stock_threshold: number;
  active: boolean;
  description?: string | null;
  images?: string[];
  show_in_catalog?: boolean;
  featured?: boolean;
  is_new?: boolean;
}) {
  const payload = {
    name: input.name,
    category: input.category,
    cost: input.cost,
    price: input.price,
    low_stock_threshold: input.low_stock_threshold,
    active: input.active,
    description: input.description ?? null,
    images: input.images ?? [],
    show_in_catalog: input.show_in_catalog ?? true,
    featured: input.featured ?? false,
    is_new: input.is_new ?? false,
  };

  if (input.id) {
    const res = await db.from("products").update(payload).eq("id", input.id).select().single();
    if (res.error) throw new Error(res.error.message);
    return res.data as Product;
  }
  const res = await db.from("products").insert(payload).select().single();
  if (res.error) throw new Error(res.error.message);
  return res.data as Product;
}

export async function deleteProduct(id: string) {
  const res = await db.from("products").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function addVariant(input: {
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  product_name: string;
}) {
  const res = await db
    .from("variants")
    .insert({
      product_id: input.product_id,
      size: input.size,
      color: input.color,
      quantity: input.quantity,
    })
    .select()
    .single();
  if (res.error) throw new Error(res.error.message);
  if (input.quantity > 0) {
    await registerMovement({
      variant_id: res.data.id,
      product_name: input.product_name,
      size: input.size,
      color: input.color,
      kind: "entrada",
      quantity: input.quantity,
      reason: "Cadastro da variação",
    });
  }
  return res.data as Variant;
}

export async function deleteVariant(id: string) {
  const res = await db.from("variants").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

/* ---------------- stock ---------------- */

export async function registerMovement(input: {
  variant_id: string;
  product_name: string;
  size: string;
  color: string;
  kind: "entrada" | "saida" | "ajuste";
  quantity: number;
  reason?: string | null;
}) {
  const res = await db.from("stock_movements").insert({
    variant_id: input.variant_id,
    product_name: input.product_name,
    size: input.size,
    color: input.color,
    kind: input.kind,
    quantity: input.quantity,
    reason: input.reason ?? null,
  });
  if (res.error) throw new Error(res.error.message);
}

async function setVariantQuantity(variantId: string, quantity: number) {
  const res = await db
    .from("variants")
    .update({ quantity: Math.max(0, quantity) })
    .eq("id", variantId);
  if (res.error) throw new Error(res.error.message);
}

export async function applyStockChange(input: {
  variant: Variant;
  product_name: string;
  kind: "entrada" | "saida" | "ajuste";
  quantity: number;
  reason?: string;
}) {
  const next =
    input.kind === "entrada"
      ? input.variant.quantity + input.quantity
      : input.kind === "saida"
        ? input.variant.quantity - input.quantity
        : input.quantity;
  await setVariantQuantity(input.variant.id, next);
  await registerMovement({
    variant_id: input.variant.id,
    product_name: input.product_name,
    size: input.variant.size,
    color: input.variant.color,
    kind: input.kind,
    quantity: input.quantity,
    reason: input.reason ?? null,
  });
}

export async function adjustVariantStock(variantId: string, delta: number) {
  const res = await db.from("variants").select("quantity").eq("id", variantId).single();
  if (res.error) throw new Error(res.error.message);
  await setVariantQuantity(variantId, (res.data.quantity as number) + delta);
}

export async function fetchMovements(limit = 60): Promise<Movement[]> {
  const res = await db
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return unwrap<Movement[]>(res);
}

/* ---------------- customers ---------------- */

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await db.from("customers").select("*").order("name");
  return unwrap<Customer[]>(res);
}

export async function saveCustomer(input: {
  id?: string | undefined;
  name: string;
  phone?: string | null;
  instagram?: string | null;
  email?: string | null;
  cpf?: string | null;
  birthday?: string | null;
  notes?: string | null;
}) {
  const payload = {
    name: input.name,
    phone: input.phone || null,
    instagram: input.instagram || null,
    email: input.email || null,
    cpf: input.cpf || null,
    birthday: input.birthday || null,
    notes: input.notes || null,
  };
  if (input.id) {
    const res = await db.from("customers").update(payload).eq("id", input.id);
    if (res.error) throw new Error(res.error.message);
    return;
  }
  const res = await db.from("customers").insert(payload);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteCustomer(id: string) {
  const res = await db.from("customers").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

/* ---------------- sales ---------------- */

export async function fetchSales(limit = 300): Promise<Sale[]> {
  const res = await db
    .from("sales")
    .select("*, sale_items(*), customers(id, name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return unwrap<Sale[]>(res);
}

export type NewSaleItem = {
  variant: Variant;
  product_name: string;
  unit_price: number;
  unit_cost: number;
  quantity: number;
};

export async function createSale(input: {
  customer_id: string | null;
  items: NewSaleItem[];
  discount: number;
  payment_method: string;
  installments: number;
  status: string;
  notes?: string;
}) {
  const subtotal = input.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const costTotal = input.items.reduce((s, i) => s + i.unit_cost * i.quantity, 0);
  const total = Math.max(0, subtotal - input.discount);

  const saleRes = await db
    .from("sales")
    .insert({
      customer_id: input.customer_id,
      subtotal,
      discount: input.discount,
      total,
      cost_total: costTotal,
      payment_method: input.payment_method,
      installments: input.installments,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (saleRes.error) throw new Error(saleRes.error.message);
  const sale = saleRes.data as Sale;

  const itemsRes = await db.from("sale_items").insert(
    input.items.map((i) => ({
      sale_id: sale.id,
      variant_id: i.variant.id,
      product_name: i.product_name,
      size: i.variant.size,
      color: i.variant.color,
      quantity: i.quantity,
      unit_price: i.unit_price,
      unit_cost: i.unit_cost,
    })),
  );
  if (itemsRes.error) throw new Error(itemsRes.error.message);

  if (input.status !== "cancelada") {
    for (const item of input.items) {
      await adjustVariantStock(item.variant.id, -item.quantity);
      await registerMovement({
        variant_id: item.variant.id,
        product_name: item.product_name,
        size: item.variant.size,
        color: item.variant.color,
        kind: "saida",
        quantity: item.quantity,
        reason: "Venda",
      });
    }
  }
  return sale;
}

export async function updateSaleStatus(sale: Sale, status: string) {
  const wasActive = sale.status !== "cancelada";
  const willBeActive = status !== "cancelada";
  const res = await db.from("sales").update({ status }).eq("id", sale.id);
  if (res.error) throw new Error(res.error.message);

  if (wasActive && !willBeActive) {
    for (const item of sale.sale_items) {
      if (!item.variant_id) continue;
      await adjustVariantStock(item.variant_id, item.quantity);
      await registerMovement({
        variant_id: item.variant_id,
        product_name: item.product_name,
        size: item.size,
        color: item.color,
        kind: "entrada",
        quantity: item.quantity,
        reason: "Venda cancelada",
      });
    }
  }
  if (!wasActive && willBeActive) {
    for (const item of sale.sale_items) {
      if (!item.variant_id) continue;
      await adjustVariantStock(item.variant_id, -item.quantity);
      await registerMovement({
        variant_id: item.variant_id,
        product_name: item.product_name,
        size: item.size,
        color: item.color,
        kind: "saida",
        quantity: item.quantity,
        reason: "Venda reativada",
      });
    }
  }
}

export async function deleteSale(sale: Sale) {
  if (sale.status !== "cancelada") {
    for (const item of sale.sale_items) {
      if (!item.variant_id) continue;
      await adjustVariantStock(item.variant_id, item.quantity);
    }
  }
  const res = await db.from("sales").delete().eq("id", sale.id);
  if (res.error) throw new Error(res.error.message);
}

/* ---------------- exchanges ---------------- */

export async function fetchExchanges(): Promise<Exchange[]> {
  const res = await db
    .from("exchanges")
    .select("*, customers(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return unwrap<Exchange[]>(res);
}

export async function createExchange(input: {
  sale_id: string | null;
  customer_id: string | null;
  returned: { variant: Variant; product_name: string; price: number };
  delivered: { variant: Variant; product_name: string; price: number };
  notes?: string;
}) {
  const returnedLabel = `${input.returned.product_name} · ${input.returned.variant.size} · ${input.returned.variant.color}`;
  const newLabel = `${input.delivered.product_name} · ${input.delivered.variant.size} · ${input.delivered.variant.color}`;
  const difference = input.delivered.price - input.returned.price;

  const res = await db.from("exchanges").insert({
    sale_id: input.sale_id,
    customer_id: input.customer_id,
    returned_variant_id: input.returned.variant.id,
    returned_label: returnedLabel,
    new_variant_id: input.delivered.variant.id,
    new_label: newLabel,
    difference,
    notes: input.notes || null,
  });
  if (res.error) throw new Error(res.error.message);

  await adjustVariantStock(input.returned.variant.id, 1);
  await registerMovement({
    variant_id: input.returned.variant.id,
    product_name: input.returned.product_name,
    size: input.returned.variant.size,
    color: input.returned.variant.color,
    kind: "entrada",
    quantity: 1,
    reason: "Troca — devolução",
  });

  await adjustVariantStock(input.delivered.variant.id, -1);
  await registerMovement({
    variant_id: input.delivered.variant.id,
    product_name: input.delivered.product_name,
    size: input.delivered.variant.size,
    color: input.delivered.variant.color,
    kind: "saida",
    quantity: 1,
    reason: "Troca — entrega",
  });

  if (input.sale_id) {
    const upd = await db.from("sales").update({ status: "trocada" }).eq("id", input.sale_id);
    if (upd.error) throw new Error(upd.error.message);
  }
}

export async function deleteExchange(id: string) {
  const res = await db.from("exchanges").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

/* ---------------- catálogo: pedidos e configurações ---------------- */

export type CatalogOrderItem = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_id: string | null;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
};

export type CatalogOrder = {
  id: string;
  number: number;
  customer_name: string;
  phone: string;
  fulfillment: string;
  address: string | null;
  payment_method: string;
  installments: number;
  notes: string | null;
  total: number;
  status: string;
  sale_id: string | null;
  created_at: string;
  catalog_order_items: CatalogOrderItem[];
};

export type Settings = {
  id: number;
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

export async function fetchCatalogOrders(limit = 200): Promise<CatalogOrder[]> {
  const res = await db
    .from("catalog_orders")
    .select("*, catalog_order_items(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return unwrap<CatalogOrder[]>(res);
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await db.from("catalog_orders").update({ status }).eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteCatalogOrder(id: string) {
  const res = await db.from("catalog_orders").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function convertOrderToSale(
  order: CatalogOrder,
  products: ProductWithVariants[],
  customers: Customer[],
) {
  if (order.sale_id) throw new Error("Este pedido já foi transformado em venda.");

  const items: NewSaleItem[] = [];
  for (const item of order.catalog_order_items ?? []) {
    const product = products.find((p) => p.variants.some((v) => v.id === item.variant_id));
    const variant = product?.variants.find((v) => v.id === item.variant_id);
    if (!product || !variant) {
      throw new Error(`"${item.product_name}" não existe mais no estoque.`);
    }
    if (variant.quantity < item.quantity) {
      throw new Error(
        `Estoque insuficiente para ${item.product_name} (${variant.size} · ${variant.color}).`,
      );
    }
    items.push({
      variant,
      product_name: product.name,
      unit_price: Number(item.unit_price),
      unit_cost: Number(product.cost),
      quantity: item.quantity,
    });
  }
  if (items.length === 0) throw new Error("Pedido sem itens.");

  const digits = (v: string | null) => (v ?? "").replace(/\D/g, "");
  let customerId =
    customers.find((c) => digits(c.phone) && digits(c.phone) === digits(order.phone))?.id ?? null;

  if (!customerId) {
    const created = await db
      .from("customers")
      .insert({ name: order.customer_name, phone: order.phone })
      .select()
      .single();
    if (created.error) throw new Error(created.error.message);
    customerId = created.data.id as string;
  }

  const sale = await createSale({
    customer_id: customerId,
    items,
    discount: 0,
    payment_method: order.payment_method,
    installments: order.installments,
    status: "paga",
    notes: `Pedido do catálogo #${order.number}`,
  });

  const upd = await db
    .from("catalog_orders")
    .update({ sale_id: sale.id, status: "finalizado" })
    .eq("id", order.id);
  if (upd.error) throw new Error(upd.error.message);
  return sale;
}

export async function fetchSettings(): Promise<Settings> {
  const res = await db.from("app_settings").select("*").eq("id", 1).single();
  if (res.error) throw new Error(res.error.message);
  return res.data as Settings;
}

export async function saveSettings(input: Partial<Settings>) {
  const res = await db.from("app_settings").update(input).eq("id", 1);
  if (res.error) throw new Error(res.error.message);
}
