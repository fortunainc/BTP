const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & { token?: string };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not configured");

  const { token, headers, ...init } = options;
  const response = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // Preserve the HTTP fallback when the server did not return JSON.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  questions: {
    list: (token: string) => apiRequest("/api/situations", { token }),
    create: (token: string, payload: unknown) => apiRequest("/api/situations", { token, method: "POST", body: JSON.stringify(payload) }),
    answer: (token: string, id: string, payload: unknown) => apiRequest(`/api/situations/${id}/answers`, { token, method: "POST", body: JSON.stringify(payload) }),
  },
};
