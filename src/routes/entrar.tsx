import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Btn, Field, TextInput } from "@/components/kit";
import { adminLogin } from "@/lib/admin.functions";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área restrita — Metah Veste" },
      { name: "description", content: "Acesso restrito ao painel da Metah Veste." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin({ data: { password } });
      if (res.ok) {
        navigate({ to: "/admin", replace: true });
      } else {
        toast.error("Senha incorreta.");
      }
    } catch {
      toast.error("Não foi possível entrar agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5 text-ink">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <Logo className="h-9" />
        <h1 className="mt-8 font-display text-[28px] leading-none font-bold tracking-tight">
          Área restrita
        </h1>
        <p className="mt-2 text-[13px] text-muted">Digite a senha para acessar o painel.</p>
        <div className="mt-6">
          <Field label="Senha">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
        <Btn type="submit" variant="glow" className="mt-4 w-full" disabled={loading || !password}>
          {loading ? "Entrando..." : "Entrar"}
        </Btn>
      </form>
    </div>
  );
}
