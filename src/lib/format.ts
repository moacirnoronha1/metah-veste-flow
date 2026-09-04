export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0,
  );

export const shortBrl = (value: number) => brl(value).replace(/\s/g, " ");

export const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

export const dateTimeLabel = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

export const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
  link: "Link",
};

export const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  cancelada: "Cancelada",
  trocada: "Trocada",
};
