import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl bg-card p-4 ring-1 ring-line", className)}>{children}</div>
  );
}

export function SectionTitle({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <p className="font-display text-[15px] font-semibold tracking-tight">{title}</p>
      {aside ? <div className="font-mono text-[10px] text-muted">{aside}</div> : null}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "glow";
  size?: "sm" | "md";
};

export function Btn({ variant = "primary", size = "md", className, ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-display font-semibold tracking-tight transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "px-3 py-2 text-[12px]" : "px-4 py-3 text-[14px]",
        variant === "primary" && "bg-ink text-bg",
        variant === "glow" && "bg-glow text-card",
        variant === "outline" && "bg-card text-ink ring-1 ring-line",
        variant === "ghost" && "text-muted hover:text-ink",
        variant === "danger" && "bg-bad text-card",
        className,
      )}
    />
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-xl bg-card px-3 py-2.5 text-[14px] text-ink ring-1 ring-line outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-glow";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-20", props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, "appearance-none", props.className)} />;
}

export function Chip({
  active,
  children,
  onClick,
  tone = "ink",
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  tone?: "ink" | "glow";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-2.5 py-2 text-center text-[12px] font-medium transition",
        active
          ? tone === "glow"
            ? "bg-glow text-card"
            : "bg-ink text-bg"
          : "bg-card text-ink ring-1 ring-line",
      )}
    >
      {children}
    </button>
  );
}

export function Tag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "good" | "glow" | "bad" | "gold";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        tone === "muted" && "bg-line text-muted",
        tone === "good" && "bg-good/10 text-good",
        tone === "glow" && "bg-glow/12 text-glow",
        tone === "gold" && "bg-gold/12 text-gold",
        tone === "bad" && "bg-bad/10 text-bad",
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-bg p-5 ring-1 ring-line sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-[18px] font-bold tracking-tight">{title}</p>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-full text-muted ring-1 ring-line"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-card p-6 text-center text-[13px] text-muted ring-1 ring-line">
      {text}
    </div>
  );
}
