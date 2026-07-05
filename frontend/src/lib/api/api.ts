/**
 * Base API client configuration.
 * All requests include the JWT token from localStorage.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/**
 * Get the Authorization headers from the stored JWT token.
 */
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Base headers for every request.
 */
function baseHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
}

/**
 * Extract error message from a failed API response.
 */
export async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (Array.isArray(body.message)) return body.message[0];
    return body.message ?? "An unexpected error occurred";
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

/**
 * Extract paginated data — returns `response.data` if present, otherwise the whole body.
 */
function unwrapData<T>(body: T | { data: T }): T {
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    Array.isArray((body as any).data)
  ) {
    return (body as any).data as T;
  }
  return body;
}

/* ─── HTTP helpers ────────────────────────────────────── */

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const options: RequestInit = {
    method,
    headers: baseHeaders(),
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const message = await extractError(res);
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  return unwrapData<T>(json);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
