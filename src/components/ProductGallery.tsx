import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
};

/**
 * Galeria de produto: imagem principal com contain (nunca corta/deforma),
 * miniaturas, setas, swipe, indicadores e lightbox com zoom (pinch + wheel + duplo toque).
 */
export function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;
  const many = count > 1;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  // Swipe na imagem principal
  const touch = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touch.current || !many) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  }

  if (count === 0) {
    return (
      <div className="mt-3 overflow-hidden rounded-[24px] bg-card ring-1 ring-line">
        <div className="grid aspect-[3/4] w-full place-items-center font-mono text-[11px] text-muted">
          sem foto
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3">
        {/* Imagem principal — contain para nunca cortar a peça */}
        <div
          className="relative overflow-hidden rounded-[24px] bg-card ring-1 ring-line select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="Ampliar imagem"
            className="block w-full cursor-zoom-in"
          >
            <img
              key={images[index]}
              src={images[index]}
              alt={`${alt} — foto ${index + 1} de ${count}`}
              className="aspect-[3/4] w-full object-contain sm:aspect-[4/3]"
              draggable={false}
              decoding="async"
              {...(index === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
            />
          </button>

          {many ? (
            <>
              <GalleryArrow side="left" onClick={() => go(index - 1)} />
              <GalleryArrow side="right" onClick={() => go(index + 1)} />
            </>
          ) : null}

          {/* Botão ampliar */}
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="Ampliar"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-ink ring-1 ring-line backdrop-blur transition active:scale-95"
          >
            <ExpandIcon />
          </button>

          {/* Indicadores */}
          {many ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  aria-label={`Ir para foto ${i + 1}`}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/30",
                  )}
                />
              ))}
            </div>
          ) : null}

          {/* Contador */}
          {many ? (
            <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2 py-1 font-mono text-[10px] text-muted ring-1 ring-line backdrop-blur">
              {index + 1}/{count}
            </span>
          ) : null}
        </div>

        {/* Miniaturas */}
        {many ? (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index}
                className="shrink-0"
              >
                <img
                  src={img}
                  alt={`${alt} miniatura ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className={cn(
                    "size-16 rounded-xl bg-card object-contain ring-1 transition",
                    i === index ? "ring-2 ring-ink" : "ring-line",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {zoomed ? (
        <Lightbox
          images={images}
          alt={alt}
          index={index}
          onIndex={go}
          onClose={() => setZoomed(false)}
        />
      ) : null}
    </>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Próxima foto"}
      className={cn(
        "absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-ink ring-1 ring-line backdrop-blur transition active:scale-95",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d={side === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function ExpandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M9.5 2h4.5v4.5M14 2L9 7M6.5 14H2V9.5M2 14l5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Lightbox({
  images,
  alt,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startDist: number; startScale: number; startOffset: { x: number; y: number }; startMid: { x: number; y: number } } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ scale, offset, index });
  stateRef.current = { scale, offset, index };
  const many = images.length > 1;

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Reseta zoom ao trocar de foto
  useEffect(() => resetZoom(), [index, resetZoom]);

  // Trava scroll da página e fecha com Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(stateRef.current.index + 1);
      if (e.key === "ArrowLeft") onIndex(stateRef.current.index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onIndex]);

  // Zoom por roda do mouse (ancorado no cursor)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const { scale: z, offset: o } = stateRef.current;
      const next = Math.min(6, Math.max(1, z * Math.exp(-dy * 0.0018)));
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      const k = next / z;
      setScale(next);
      setOffset(
        next <= 1 ? { x: 0, y: 0 } : { x: px - (px - o.x) * k, y: py - (py - o.y) * k },
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        startDist: Math.hypot(a.x - b.x, a.y - b.y),
        startScale: stateRef.current.scale,
        startOffset: { ...stateRef.current.offset },
        startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && gesture.current) {
      // Pinch zoom + pan
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const next = Math.min(
        6,
        Math.max(1, gesture.current.startScale * (dist / gesture.current.startDist)),
      );
      setScale(next);
      setOffset({
        x: gesture.current.startOffset.x + (mid.x - gesture.current.startMid.x),
        y: gesture.current.startOffset.y + (mid.y - gesture.current.startMid.y),
      });
    } else if (pointers.current.size === 1 && stateRef.current.scale > 1) {
      // Pan com um dedo quando ampliado
      setOffset((o) => ({ x: o.x + (e.clientX - prev.x), y: o.y + (e.clientY - prev.y) }));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const wasSingle = pointers.current.size === 1;
    const start = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
    // Swipe para trocar de foto quando não está ampliado
    if (wasSingle && start && stateRef.current.scale <= 1 && many) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy)) {
        onIndex(stateRef.current.index + (dx < 0 ? 1 : -1));
      }
    }
    if (stateRef.current.scale <= 1.02) resetZoom();
  }

  function onDoubleClick() {
    if (stateRef.current.scale > 1) resetZoom();
    else setScale(2.2);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização ampliada de ${alt}`}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between p-4">
        <span className="font-mono text-[11px] text-card/70">
          {many ? `${index + 1}/${images.length} · ` : ""}toque duas vezes ou role para zoom
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar visualização ampliada"
          className="grid size-10 place-items-center rounded-full bg-card/10 text-card ring-1 ring-card/25 transition active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Área da imagem */}
      <div
        ref={containerRef}
        className="relative flex flex-1 touch-none items-center justify-center overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <img
          key={images[index]}
          src={images[index]}
          alt={`${alt} — foto ${index + 1} ampliada`}
          draggable={false}
          decoding="async"
          className="max-h-full max-w-full object-contain will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: gesture.current ? "none" : "transform 120ms ease-out",
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
        />

        {many ? (
          <>
            <button
              type="button"
              onClick={() => onIndex(index - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card/10 text-card ring-1 ring-card/25 transition active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onIndex(index + 1)}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card/10 text-card ring-1 ring-card/25 transition active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {/* Controles de zoom + miniaturas */}
      <div className="flex flex-col items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <ZoomBtn label="Reduzir zoom" onClick={() => setScale((s) => Math.max(1, s / 1.35))}>−</ZoomBtn>
          <button
            type="button"
            onClick={resetZoom}
            className="min-w-16 rounded-full bg-card/10 px-3 py-2 text-center font-mono text-[11px] text-card ring-1 ring-card/25"
          >
            {Math.round(scale * 100)}%
          </button>
          <ZoomBtn label="Aumentar zoom" onClick={() => setScale((s) => Math.min(6, s * 1.35))}>+</ZoomBtn>
        </div>
        {many ? (
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={img} type="button" onClick={() => onIndex(i)} className="shrink-0" aria-label={`Ver foto ${i + 1}`}>
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    "size-12 rounded-lg object-contain ring-1 transition",
                    i === index ? "ring-2 ring-card" : "ring-card/25 opacity-60",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ZoomBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 place-items-center rounded-full bg-card/10 text-card ring-1 ring-card/25 transition active:scale-95"
    >
      {children}
    </button>
  );
}
