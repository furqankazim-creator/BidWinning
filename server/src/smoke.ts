/** End-to-end smoke test against an in-memory MongoDB: signup → org → invite → join → sync → REST → audit. */
import { connectDb } from "./db.js";
import { createApp } from "./index.js";

const port = Number(process.env.PORT) || 4999; const base = `http://localhost:${port}`;
const j = async (path: string, init: RequestInit & { token?: string } = {}) => { const r = await fetch(base + path, { ...init, headers: { "content-type": "application/json", ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...(init.headers || {}) } }); const body = await r.json().catch(() => ({})); return { status: r.status, body }; };
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL:", m); process.exit(1); } console.log("ok  ", m); };

await connectDb(); const app = await createApp(); const server = app.listen(port);
try {
  const su = await j("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Alice Admin", email: "alice@acme.test", password: "password123", organisation: "Acme Contracting" }) });
  assert(su.status === 201 && su.body.token && su.body.user.role === "Organization Admin", "signup creates org + admin");
  const tok = su.body.token;
  const dup = await j("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "X", email: "alice@acme.test", password: "password123", organisation: "Y" }) });
  assert(dup.status === 409, "duplicate email rejected");
  const bad = await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "alice@acme.test", password: "wrong" }) });
  assert(bad.status === 401, "wrong password rejected");
  const inv = await j("/api/org/invites", { method: "POST", token: tok, body: JSON.stringify({ email: "bob@acme.test", role: "Tender Manager" }) });
  assert(inv.status === 201 && inv.body.token, "admin can invite");
  const look = await j(`/api/auth/invite/${inv.body.token}`); assert(look.status === 200 && look.body.organisation === "Acme Contracting", "invite lookup works");
  const bob = await j("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Bob", email: "bob@acme.test", password: "password123", invite: inv.body.token }) });
  assert(bob.status === 201 && bob.body.user.role === "Tender Manager" && bob.body.org.id === su.body.org.id, "invitee joins same org with role");
  const forbid = await j("/api/org/invites", { method: "POST", token: bob.body.token, body: JSON.stringify({ email: "c@acme.test", role: "Viewer" }) });
  assert(forbid.status === 403, "non-admin cannot invite");
  const sync = await j("/api/data/tenders/sync", { method: "PUT", token: tok, body: JSON.stringify({ docs: [{ id: "t1", name: "Tender One", industry: "water" }, { id: "t2", name: "Tender Two", industry: "it" }] }) });
  assert(sync.status === 200 && sync.body.upserted === 2, "bulk sync upserts");
  const list = await j("/api/data/tenders", { token: bob.body.token }); assert(list.status === 200 && list.body.length === 2, "org member reads synced records");
  const upd = await j("/api/data/tenders/t1", { method: "PUT", token: tok, body: JSON.stringify({ stage: "Bid Preparation" }) }); assert(upd.body.stage === "Bid Preparation" && upd.body.name === "Tender One", "PUT merges fields");
  const sync2 = await j("/api/data/tenders/sync", { method: "PUT", token: tok, body: JSON.stringify({ docs: [{ id: "t1", name: "Tender One" }] }) }); assert(sync2.body.deleted === 1, "full sync deletes missing");
  const other = await j("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Eve", email: "eve@other.test", password: "password123", organisation: "Other Co" }) });
  const leak = await j("/api/data/tenders", { token: other.body.token }); assert(leak.body.length === 0, "other org sees nothing (tenant isolation)");
  const st = await j("/api/data/state", { token: tok }); assert(st.body.collections.tenders.length === 1 && Array.isArray(st.body.collections.risks), "state snapshot has all collections");
  const set = await j("/api/data/settings", { method: "PUT", token: tok, body: JSON.stringify({ margin: 14 }) }); assert(set.body.margin === 14, "settings upsert");
  const au = await j("/api/org/audit", { token: tok }); assert(au.body.some((a: { action: string }) => a.action === "Invited"), "audit trail records invite");
  const noauth = await j("/api/data/state"); assert(noauth.status === 401, "unauthenticated rejected");
  console.log("\nALL SMOKE TESTS PASSED");
} finally { server.close(); process.exit(0); }
