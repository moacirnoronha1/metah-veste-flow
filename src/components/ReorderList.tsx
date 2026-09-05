import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/kit";
import { cn } from "@/lib/utils";

export type ReorderItem = { id: string; name: string; category: string; image?: string | null };

/**
 * Lista com arrastar e soltar (mouse e toque) para definir a ordem dos produtos.
 */
export function ReorderList({
  items,
  onChange,
}: {
  items: ReorderItem[];
  onChange: (ids: string[]) => void;
}) {
  const [order, setOrder] = useState<ReorderItem[]>(items);
  const dragId = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const signature = items.map((i) => i.id).join("|");
  useEffect(() => {
    setOrder(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setOrder(next);
    onChange(next.map((i) => i.id));
  }

  function moveOver(id: string) {
    const from = order.findIndex((i) => i.id === dragId.current);
    const to = order.findIndex((i) => i.id === id);
    if (from < 0 || to < 0) return;
    move(from, to);
  }

  return (
    <div className="space-y-2">
      {order.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => {
            dragId.current = item.id;
            setActiveId(item.id);
          }}
          onDragEnd={() => {
            dragId.current = null;
            setActiveId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragId.current && dragId.current !== item.id) moveOver(item.id);
          }}
          onTouchMove={(e) => {
            if (!dragId.current) return;
            const touch = e.touches[0];
            if (!touch) return;
            const el = document
              .elementFromPoint(touch.clientX, touch.clientY)
              ?.closest("[data-reorder-id]") as HTMLElement | null;
            const overId = el?.dataset["reorderId"];
            if (overId && overId !== dragId.current) moveOver(overId);
          }}
          onTouchEnd={() => {
            dragId.current = null;
            setActiveId(null);
          }}
          data-reorder-id={item.id}
          className={cn(
            "flex touch-none items-center gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-line transition",
            activeId === item.id && "opacity-60 ring-2 ring-glow",
          )}
        >
          <span
            aria-hidden
            onTouchStart={() => {
              dragId.current = item.id;
              setActiveId(item.id);
            }}
            className="cursor-grab select-none px-1 font-mono text-[14px] leading-none text-muted"
          >
            ⠿
          </span>
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-line"
            />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bg font-mono text-[10px] text-muted">
              —
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{item.name}</p>
            <p className="font-mono text-[10px] text-muted">
              {index + 1}º · {item.category}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Btn
              size="sm"
              variant="outline"
              aria-label="Subir"
              className="px-2 py-1"
              onClick={() => move(index, index - 1)}
            >
              ↑
            </Btn>
            <Btn
              size="sm"
              variant="outline"
              aria-label="Descer"
              className="px-2 py-1"
              onClick={() => move(index, index + 1)}
            >
              ↓
            </Btn>
          </div>
        </div>
      ))}
    </div>
  );
}
