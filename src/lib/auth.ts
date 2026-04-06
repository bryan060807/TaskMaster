const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_URL || "/api";

function apiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${AUTH_API_BASE}${normalized}`;
}

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export function handleSSOLogin() {
  return null;
}

async function parseJson(res: Response) {
  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error("API Error:", data);
    return {
      error: data?.error || data?.message || "Request failed",
      status: res.status,
      raw: data?.raw,
    };
  }

  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  return parseJson(res);
}

export async function register(email: string, password: string) {
  const res = await fetch(apiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  return parseJson(res);
}

export async function getMe() {
  const res = await fetch(apiUrl("/auth/me"), {
    credentials: "include",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  return parseJson(res);
}

export function finishLogin(token: string, redirectTarget: string | null = null) {
  if (!token) {
    console.error("No token returned from API");
    return;
  }

  setToken(token);
  window.location.href = redirectTarget || "/";
}

export function readPostLoginRedirect() {
  return new URL(window.location.href).searchParams.get("redirect");
}

export function logout() {
  clearToken();
  window.location.href = "/login";
}
