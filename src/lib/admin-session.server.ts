import { useSession } from "@tanstack/react-start/server";

export type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "mv-admin",
    maxAge: 60 * 60 * 24 * 60,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export async function getAdminSession() {
  return useSession<AdminSession>(sessionConfig());
}

export async function isUnlocked(): Promise<boolean> {
  const session = await getAdminSession();
  return session.data.unlocked === true;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isUnlocked())) throw new Error("NAO_AUTORIZADO");
}
