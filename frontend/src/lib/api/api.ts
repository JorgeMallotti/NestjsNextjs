/**
 * Base API client configuration.
 * JWT is sent automatically via HttpOnly cookie — no manual token handling needed.
 * All requests include credentials for cross-origin cookie support.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/**
 * Fetch options shared across all requests.
 * - credentials: 'include' ensures the HttpOnly auth cookie is sent automatically.
 * - Content-Type header for JSON requests.
 */
function fetchOptions(method: string, body?: unknown): RequestInit {
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
function unwrapData<T>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    Array.isArray((body as Record<string, unknown>).data)
  ) {
    return (body as Record<string, unknown>).data as T;
  }
  return body as T;
}

/* --- HTTP helpers ------------------------------------------------- */

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, fetchOptions(method, body));

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
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
  /**
   * GET request that preserves the full paginated response structure { data, meta }.
   * Unlike `api.get`, this does NOT unwrap the `data` array from paginated responses.
   */
  getPaginated: <T>(path: string): Promise<T> => {
    return fetch(`${API_BASE}${path}`, fetchOptions("GET")).then(
      async (res) => {
        if (!res.ok) {
          const message = await extractError(res);
          throw new Error(message);
        }
        return res.json();
      },
    );
  },
};
