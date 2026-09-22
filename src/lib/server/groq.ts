/**
 * Groq key pool with automatic failover.
 * Keys come from GROQ_API_KEYS (comma-separated) and/or GROQ_API_KEY. On 429 (rate limit / quota) or 401/403 the
 * current key is put on cooldown and the request is retried with the next key. Cooldown: 429 → 60 s (or Retry-After), 401/403 → 1 h.
 */
const cooldown = new Map<string, number>(); // key → epoch ms until which it is skipped

export function groqKeys(): string[] {
  const list = [...(process.env.GROQ_API_KEYS || "").split(","), process.env.GROQ_API_KEY || ""].map((k) => k.trim()).filter(Boolean);
  return Array.from(new Set(list));
}
export const groqModel = () => process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const now = () => Date.now();
const available = () => groqKeys().filter((k) => (cooldown.get(k) || 0) <= now());

export function keyStatus() { return groqKeys().map((k, i) => ({ index: i + 1, suffix: k.slice(-6), coolingDownFor: Math.max(0, Math.round(((cooldown.get(k) || 0) - now()) / 1000)) })); }

/** POST to Groq chat completions, rotating keys on rate-limit/auth failures. Returns the first successful Response. */
export async function groqFetch(body: Record<string, unknown>): Promise<{ res: Response; keyIndex: number }> {
  const all = groqKeys(); if (!all.length) throw new Error("no_credentials");
  let keys = available(); if (!keys.length) keys = [all.reduce((a, b) => ((cooldown.get(a) || 0) < (cooldown.get(b) || 0) ? a : b))]; // all cooling: try the soonest
  let lastErr = "";
  for (const key of keys) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
    if (res.ok) return { res, keyIndex: all.indexOf(key) + 1 };
    const text = await res.text().catch(() => "");
    lastErr = `Groq ${res.status}: ${text.slice(0, 200)}`;
    if (res.status === 429) { const ra = Number(res.headers.get("retry-after")); cooldown.set(key, now() + (ra > 0 ? ra * 1000 : 60_000)); console.warn(`[groq] key …${key.slice(-6)} rate-limited → switching key`); continue; }
    if (res.status === 401 || res.status === 403) { cooldown.set(key, now() + 3_600_000); console.warn(`[groq] key …${key.slice(-6)} rejected (${res.status}) → switching key`); continue; }
    if (res.status >= 500) { continue; } // transient upstream error: try next key
    throw new Error(lastErr); // 400/404 etc. are request problems, not key problems
  }
  throw new Error(lastErr || "All Groq keys are rate-limited; try again shortly.");
}
