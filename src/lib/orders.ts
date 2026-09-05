export const ORDER_STATUS: Record<string, string> = {
  aguardando: "Aguardando confirmação",
  confirmado: "Confirmado",
  preparacao: "Em preparação",
  pronto: "Pronto",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const ORDER_STATUS_LIST = Object.keys(ORDER_STATUS);

export const FULFILLMENT_LABELS: Record<string, string> = {
  retirada: "Retirada",
  entrega: "Entrega",
};
