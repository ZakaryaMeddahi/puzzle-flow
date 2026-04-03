import { getAccessToken, storeTokens, clearTokens, getRefreshToken } from "./auth";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000";

export { API_URL };

type FetchOptions = RequestInit & { skipAuth?: boolean };

/**
 * Authenticated fetch wrapper.
 * Attaches the stored access token and handles 401 by attempting a token refresh.
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });

  // Attempt one silent token refresh on 401
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getAccessToken()}`);
      res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
    } else {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/**
 * Authenticated fetch that returns a raw Blob (e.g. for binary PDF responses).
 * Handles 401 + token refresh the same way as apiFetch.
 */
export async function apiFetchBlob(
  path: string,
  options: FetchOptions = {},
): Promise<Blob> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getAccessToken()}`);
      res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
    } else {
      throw new Error("Session expired");
    }
  }

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.blob();
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    storeTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
