const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/* ─── Types ────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  user: AuthUser;
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

/* ─── Helpers ──────────────────────────────────────────── */

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
 * Base fetch options with credentials included (for HttpOnly cookie).
 */
function authFetchOptions(method: string, body?: unknown): RequestInit {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  return options;
}

/* ─── Auth API ─────────────────────────────────────────── */

/**
 * Register a new client account.
 */
export async function register(data: RegisterData): Promise<RegisterResponse> {
  const res = await fetch(
    `${API_BASE}/auth/register`,
    authFetchOptions("POST", data),
  );

  if (!res.ok) {
    const message = await extractError(res);
    throw new Error(message);
  }

  return res.json();
}

/**
 * Login as a client.
 * Server sets HttpOnly cookie — no token to store client-side.
 */
export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(
    `${API_BASE}/auth/login`,
    authFetchOptions("POST", { email, password }),
  );

  if (!res.ok) {
    const message = await extractError(res);
    throw new Error(message);
  }

  return res.json();
}

/**
 * Login as an admin.
 * Server sets HttpOnly cookie — no token to store client-side.
 */
export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(
    `${API_BASE}/auth/login/admin`,
    authFetchOptions("POST", { email, password }),
  );

  if (!res.ok) {
    const message = await extractError(res);
    throw new Error(message);
  }

  return res.json();
}

/**
 * Logout — calls backend to clear the HttpOnly cookie.
 */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, authFetchOptions("POST"));
  clearUser();
}

/**
 * Verify current session by fetching user profile.
 * Returns null if not authenticated (cookie missing/expired).
 */
export async function fetchProfile(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── Session management (user info only — NOT the token) ── */

const USER_KEY = "auth_user";

/**
 * Save user info to localStorage for display purposes.
 * The actual JWT is stored in an HttpOnly cookie (inaccessible to JS).
 */
export function saveUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove user info from localStorage.
 * Does NOT clear the cookie — call logout() for that.
 */
export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

/**
 * Get the currently logged-in user from localStorage.
 * Returns null if not logged in.
 */
export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
