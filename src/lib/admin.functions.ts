import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

export type AdminQueryInput = {
  table: string;
  action: "select" | "insert" | "update" | "delete";
  select?: string;
  returning?: string;
  values?: unknown;
  filters?: [string, unknown][];
  order?: { column: string; ascending: boolean };
  limit?: number;
  single?: boolean;
};

const ALLOWED_TABLES = new Set([
  "products",
  "variants",
  "customers",
  "sales",
  "sale_items",
  "stock_movements",
  "exchanges",
  "catalog_orders",
  "catalog_order_items",
  "app_settings",
]);

/* ---------------- auth ---------------- */

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isUnlocked } = await import("./admin-session.server");
  return { unlocked: await isUnlocked() };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("Senha de administrador não configurada.");
    const a = createHash("sha256").update(data.password, "utf8").digest();
    const b = createHash("sha256").update(expected, "utf8").digest();
    if (!timingSafeEqual(a, b)) return { ok: false as const };
    const { getAdminSession } = await import("./admin-session.server");
    const session = await getAdminSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

/* ---------------- gated data access ---------------- */

export const adminQuery = createServerFn({ method: "POST" })
  .inputValidator((data: AdminQueryInput) => data)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    if (!ALLOWED_TABLES.has(data.table)) throw new Error("Tabela não permitida.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = supabaseAdmin.from(data.table as never) as never as {
      select: (s: string) => never;
      insert: (v: unknown) => never;
      update: (v: unknown) => never;
      delete: () => never;
    };

    let q: never;
    if (data.action === "select") q = table.select(data.select ?? "*");
    else if (data.action === "insert") q = table.insert(data.values);
    else if (data.action === "update") q = table.update(data.values);
    else q = table.delete();

    let query = q as unknown as {
      select: (s: string) => typeof query;
      eq: (c: string, v: unknown) => typeof query;
      order: (c: string, o: { ascending: boolean }) => typeof query;
      limit: (n: number) => typeof query;
      single: () => typeof query;
    };

    if (data.action !== "select" && data.returning) query = query.select(data.returning);
    for (const [col, val] of data.filters ?? []) query = query.eq(col, val);
    if (data.order) query = query.order(data.order.column, { ascending: data.order.ascending });
    if (data.limit) query = query.limit(data.limit);
    if (data.single) query = query.single();

    const res = (await (query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>)) ?? { data: null, error: null };

    return { data: res.data ?? null, error: res.error ? { message: res.error.message } : null };
  });

/* ---------------- photos ---------------- */

export const uploadProductPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: { fileName: string; contentType: string; base64: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ext = (data.fileName.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
    const path = `produtos/${crypto.randomUUID()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));

    const { error } = await supabaseAdmin.storage
      .from("product-photos")
      .upload(path, bytes, { contentType: data.contentType || "image/jpeg", upsert: false });
    if (error) throw new Error(error.message);

    return { url: `/api/public/foto/${path}` };
  });
