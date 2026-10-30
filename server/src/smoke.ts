/** End-to-end smoke test against an in-memory MongoDB: signup → org → invite → join → sync → REST → audit. */
import { connectDb } from "./db.js";
import { createApp } from "./index.js";
import { ensureSuperAdmin } from "./bootstrap.js";
process.env.SUPER_ADMIN_EMAIL = "root@platform.test"; process.env.SUPER_ADMIN_PASSWORD = "rootpass123";

const port = Number(process.env.PORT) || 4999; const base = `http://localhost:${port}`;
const j = async (path: string, init: RequestInit & { token?: string } = {}) => { const r = await fetch(base + path, { ...init, headers: { "content-type": "application/json", ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...(init.headers || {}) } }); const body = await r.json().catch(() => ({})); return { status: r.status, body }; };
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL:", m); process.exit(1); } console.log("ok  ", m); };

await connectDb(); await ensureSuperAdmin(); const app = await createApp(); const server = app.listen(port);
try {
  const su = await j("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Alice Admin", email: "alice@acme.test", password: "password123", organisation: "Acme Contracting" }) });
  assert(su.status === 201 && su.body.token && su.body.user.role === "Super Admin", "test-only open signup creates an org + its admin");
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

  // ---- Admin vs Bidder: isolation, authorization, per-bidder persistence ----
  const mkBidder = async (email: string, name: string) => { const i = await j("/api/org/invites", { method: "POST", token: tok, body: JSON.stringify({ email, role: "Bidder" }) }); return j("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password: "password123", invite: i.body.token }) }); };
  const b1 = await mkBidder("bidder1@acme.test", "Bidder One"); const b2 = await mkBidder("bidder2@acme.test", "Bidder Two");
  assert(b1.status === 201 && b1.body.user.role === "Bidder", "admin can invite a Bidder who joins the org");
  await j("/api/data/tenders/sync", { method: "PUT", token: b1.body.token, body: JSON.stringify({ docs: [{ id: "b1-t", name: "B1 Workspace", client: "Aramco", value: 5 }] }) });
  await j("/api/data/docs/sync", { method: "PUT", token: b1.body.token, body: JSON.stringify({ docs: [{ id: "b1-d", tenderId: "b1-t", name: "rfp.pdf", size: 1234, kind: "RFP", status: "INDEXED", text: "hello world" }] }) });
  await j("/api/data/tenders/sync", { method: "PUT", token: b2.body.token, body: JSON.stringify({ docs: [{ id: "b2-t", name: "B2 Workspace" }] }) });
  const own = await j("/api/data/state", { token: b1.body.token }); assert(own.body.collections.tenders.length === 1 && own.body.collections.tenders[0].id === "b1-t" && own.body.collections.docs.length === 1, "bidder state holds only their own workspace + documents");
  const cross = await j("/api/data/tenders/b2-t", { token: b1.body.token }); assert(cross.status === 404, "bidder cannot read another bidder's workspace");
  const steal = await j("/api/data/tenders/sync", { method: "PUT", token: b1.body.token, body: JSON.stringify({ docs: [{ id: "b1-t", name: "B1 Workspace", client: "Aramco", value: 5 }, { id: "b2-t", name: "hijacked" }] }) }); assert(steal.body.skipped === 1, "bidder cannot overwrite another bidder's record by id");
  const still = await j("/api/data/tenders/b2-t", { token: b2.body.token }); assert(still.body.name === "B2 Workspace", "other bidder's record untouched");
  const staleAdmin = await j("/api/data/tenders/sync", { method: "PUT", token: tok, body: JSON.stringify({ docs: [{ id: "t1", name: "Tender One" }] }) });
  const adminSees = await j("/api/data/tenders", { token: tok }); assert(adminSees.body.length === 1 && adminSees.body[0].id === "t1" && staleAdmin.body.deleted === 0, "admin's own workspace list excludes bidders' personal workspaces, and a stale admin sync deletes none of them");
  assert((await j("/api/data/tenders/b1-t", { token: tok })).status === 404 && (await j("/api/data/state", { token: tok })).body.collections.docs.length === 0, "bidder records are not in the admin's own state");
  assert((await j("/api/org", { token: b1.body.token })).body.users.length === 1, "bidder cannot list the team");
  assert((await j("/api/org/bidders", { token: b1.body.token })).status === 403, "bidder cannot open the bidder admin list");
  assert((await j("/api/org/invites", { method: "POST", token: b1.body.token, body: JSON.stringify({ email: "z@acme.test", role: "Viewer" }) })).status === 403, "bidder cannot invite");
  const list2 = await j("/api/org/bidders", { token: tok }); const row = list2.body.find((x: { email: string }) => x.email === "bidder1@acme.test");
  assert(list2.body.length === 2 && row.workspaces === 1 && row.documents === 1, "admin bidder list shows per-bidder workspace/document counts");
  const detail = await j(`/api/org/bidders/${row.id}`, { token: tok }); assert(detail.body.workspaces[0].name === "B1 Workspace" && detail.body.workspaces[0].ownerName === "Bidder One" && detail.body.documents[0].name === "rfp.pdf" && detail.body.workspaces[0].documentCount === 1, "admin can open a bidder's saved workspace + documents");
  const wsd = await j(`/api/org/bidders/${row.id}/workspaces/b1-t`, { token: tok }); assert(wsd.body.tender.name === "B1 Workspace" && wsd.body.collections.docs[0].text === "hello world", "admin can open the full contents of a bidder workspace, incl. document text");
  assert((await j(`/api/org/bidders/${row.id}/workspaces/b1-t`, { token: b2.body.token })).status === 403, "another bidder cannot open it");
  assert((await j(`/api/org/bidders/${row.id}/workspaces/nope`, { token: tok })).status === 404, "unknown workspace is 404");
  await j("/api/data/settings", { method: "PUT", token: b1.body.token, body: JSON.stringify({ margin: 99 }) });
  const orgSettings = await j("/api/data/settings", { token: tok }); assert(orgSettings.body.margin === 14, "bidder settings never overwrite the org's");
  await j("/api/org/users/" + b1.body.user.id, { method: "PATCH", token: tok, body: JSON.stringify({ active: false }) });
  assert((await j("/api/data/state", { token: b1.body.token })).status === 401, "deactivated user is locked out immediately (token still valid)");
  await j("/api/org/users/" + b2.body.user.id, { method: "PATCH", token: tok, body: JSON.stringify({ role: "Viewer" }) });
  assert((await j("/api/data/tenders/sync", { method: "PUT", token: b2.body.token, body: JSON.stringify({ docs: [] }) })).status === 403, "role change applies to an already-issued token");

  // ---- Super Admin: platform console ----
  const sa = await j("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "root@platform.test", password: "rootpass123" }) });
  assert(sa.status === 200 && sa.body.user.role === "Super Admin", "bootstrap creates a Super Admin who can sign in");
  assert((await j("/api/platform/overview", { token: bob.body.token })).status === 403, "a non-admin member cannot open the platform console");
  const ov = await j("/api/platform/overview", { token: sa.body.token }); assert(ov.body.totals.organisations >= 3 && ov.body.totals.bidders === 1 && ov.body.organisations.some((o: { name: string; workspaces: number }) => o.name === "Acme Contracting" && o.workspaces === 3), "super admin sees every organisation with bidder/workspace counts");
  const grant = await j("/api/org/invites", { method: "POST", token: tok, body: JSON.stringify({ email: "evil@acme.test", role: "Super Admin" }) }); assert(grant.status === 403, "org admin cannot invite a Super Admin");
  const plat = await j("/api/platform/overview", { token: sa.body.token }); const aliceId = plat.body.organisations.length && (await j("/api/org", { token: tok })).body.users[0].id;
  assert((await j("/api/platform/users/" + bob.body.user.id, { method: "PATCH", token: sa.body.token, body: JSON.stringify({ role: "Super Admin" }) })).status === 403, "even the Super Admin cannot create a second Super Admin");
  const self = await j("/api/org/users/" + bob.body.user.id, { method: "PATCH", token: tok, body: JSON.stringify({ role: "Super Admin" }) }); assert(self.status === 403, "nobody can promote a member to Super Admin");
  assert((await j("/api/platform/users/" + sa.body.user.id, { method: "PATCH", token: sa.body.token, body: JSON.stringify({ role: "Viewer" }) })).status === 400, "super admin cannot demote themselves / last super admin");
  const acme = ov.body.organisations.find((o: { name: string }) => o.name === "Acme Contracting");
  const pinv = await j(`/api/platform/orgs/${acme.id}/invites`, { method: "POST", token: sa.body.token, body: JSON.stringify({ email: "bidder3@acme.test", role: "Bidder" }) }); assert(pinv.status === 201, "super admin can invite a bidder into any organisation");
  const od = await j(`/api/platform/orgs/${acme.id}`, { token: sa.body.token }); assert(od.body.users.length >= 4 && od.body.invites.length === 1, "super admin can open an organisation's users and invites");
  const xb = await j(`/api/org/bidders?orgId=${acme.id}`, { token: sa.body.token }); assert(xb.body.length === 1, "super admin can browse another organisation's bidders");
  const prof = await j("/api/auth/profile", { method: "PATCH", token: tok, body: JSON.stringify({ company: "Acme Ltd", phone: "123" }) }); assert(prof.body.user.company === "Acme Ltd", "user can update their own profile");
  const em = await j("/api/auth/email", { method: "PATCH", token: tok, body: JSON.stringify({ email: "alice2@acme.test", password: "wrong" }) }); assert(em.status === 401, "email change needs the current password");
  const em2 = await j("/api/auth/email", { method: "PATCH", token: tok, body: JSON.stringify({ email: "alice2@acme.test", password: "password123" }) }); assert(em2.body.user.email === "alice2@acme.test", "user can change their sign-in email");
  assert((await j("/api/auth/email", { method: "PATCH", token: tok, body: JSON.stringify({ email: "bob@acme.test", password: "password123" }) })).status === 409, "cannot take another user's email");
  const noauth = await j("/api/data/state"); assert(noauth.status === 401, "unauthenticated rejected");
  const st401 = await j("/api/standards/stats"); assert(st401.status === 401, "standards library requires login");
  const ocr401 = await j("/api/ocr/status"); assert(ocr401.status === 401, "OCR requires login");
  const svc = await j("/api/standards/stats", { headers: { "x-service-key": "wrong-key" } }); assert(svc.status === 401, "wrong service key rejected");
  const svcOk = await j("/api/standards/stats", { headers: { "x-service-key": process.env.INTERNAL_API_KEY! } }); assert(svcOk.status !== 401, "service key accepted");
  const userOk = await j("/api/standards/stats", { token: tok }); assert(userOk.status !== 401, "logged-in user can use standards library");
  console.log("\nALL SMOKE TESTS PASSED");
} finally { server.close(); process.exit(0); }
