"use client";
/** Thin client for the BidWinning Express API. When NEXT_PUBLIC_API_URL is unset the app runs in local demo mode. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const apiEnabled = () => !!API_URL;

export interface Session { token: string; user: { id: string; name: string; email: string; role: string; orgId: string }; org: { id: string; name: string; plan: string; currency: string; industries: string[]; seeded: boolean }; }
const KEY = "vq.session";
export const getSession = (): Session | null => { try { const s = localStorage.getItem(KEY); return s ? (JSON.parse(s) as Session) : null; } catch { return null; } };
export const setSession = (s: Session | null) => { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch {} };

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown; auth?: boolean } = {}): Promise<T> {
  const { json, auth = true, ...rest } = init;
  const headers: Record<string, string> = { ...(rest.headers as Record<string, string> || {}) };
  if (json !== undefined) headers["content-type"] = "application/json";
  if (auth) { const s = getSession(); if (s?.token) headers.authorization = `Bearer ${s.token}`; }
  const res = await fetch(API_URL + path, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && auth) { setSession(null); if (typeof window !== "undefined" && location.pathname.startsWith("/app")) location.href = "/sign-in?expired=1"; } throw new ApiError(res.status, (body as { error?: string }).error || `HTTP ${res.status}`); }
  return body as T;
}

export const authApi = {
  login: (email: string, password: string) => api<Session>("/api/auth/login", { method: "POST", json: { email, password }, auth: false }),
  signup: (p: { name: string; email: string; password: string; organisation?: string; invite?: string }) => api<Session>("/api/auth/signup", { method: "POST", json: p, auth: false }),
  invite: (token: string) => api<{ email: string; role: string; organisation: string }>(`/api/auth/invite/${token}`, { auth: false }),
  me: () => api<Omit<Session, "token">>("/api/auth/me"),
  changePassword: (current: string, next: string) => api("/api/auth/change-password", { method: "POST", json: { current, next } }),
};
