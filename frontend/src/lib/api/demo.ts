import type { AuthUser } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface DemoAccount {
  id: string;
  email: string;
  name: string;
  role: "admin" | "client";
  companyName: string | null;
  label: string;
}

interface DemoLoginResponse {
  user: AuthUser;
}

/**
 * Fetch the list of demo accounts for 1-click login.
 */
export async function getDemoAccounts(): Promise<DemoAccount[]> {
  const res = await fetch(`${API_BASE}/demo/accounts`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch demo accounts");
  return res.json();
}

/**
 * 1-click demo login — no password required.
 * Server sets HttpOnly cookie automatically.
 */
export async function demoLogin(userId: string): Promise<DemoLoginResponse> {
  const res = await fetch(`${API_BASE}/demo/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Demo login failed");
  }

  return res.json();
}
