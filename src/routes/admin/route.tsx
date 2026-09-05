import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { adminStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { unlocked } = await adminStatus();
    if (!unlocked) throw redirect({ to: "/entrar" });
  },
  component: () => <Outlet />,
});
