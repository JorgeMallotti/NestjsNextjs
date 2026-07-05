const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  companyName?: string;
  location?: string;
  idNumber?: string;
  createdAt: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  location?: string;
  idNumber?: string;
}

/**
 * Extract error message from a failed API response.
 */
async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (Array.isArray(body.message)) return body.message[0];
    return body.message ?? "An unexpected error occurred";
  } catch {
    return "An unexpected error occurred";
  }
}

/**
 * Register a new client account.
 */
export async function register(data: RegisterData): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const message = await extractError(res);
    throw new Error(message);
  }

  return res.json();
}

/**
 * Login as a client.
 */
export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const message = await extractError(res);
    throw new Error(message);
  }

  return res.json();
}

/**
 * Login as an admin.
 */
export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const message = await extractError(res);
    throw new Error(message);
  }

  return res.json();
}

/* ─── Session management ──────────────────────────────── */

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function saveAuth(
  accessToken: string,
  user: LoginResponse["user"],
): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): LoginResponse["user"] | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
