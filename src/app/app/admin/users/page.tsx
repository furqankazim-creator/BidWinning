"use client";
import { useEffect, useState } from "react";
import { Plus, Copy, Trash2, Check } from "lucide-react";
import { Card, Badge, Button, Input, Select, Table, PageHeader, Label, Field } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { roles } from "@/lib/industries";
import { useIndustries } from "@/lib/useIndustries";
import { api, apiEnabled, getSession } from "@/lib/api";

const perms = ["View", "Create", "Edit", "Approve", "Price", "Submit", "Admin"];
const matrix: Record<string, string[]> = { "Super Admin": perms, "Business Development": ["View", "Create", "Edit"], "Tender Manager": ["View", "Create", "Edit", "Submit"], "Technical Manager": ["View", "Edit", "Approve"], Engineer: ["View", "Edit"], "Procurement Manager": ["View", "Create", "Edit", "Approve"], "Commercial Manager": ["View", "Edit", "Price", "Approve"], Finance: ["View", "Price", "Approve"], Legal: ["View", "Edit", "Approve"], Compliance: ["View", "Edit", "Approve"], "Project Manager": ["View", "Create", "Edit"], Reviewer: ["View", "Approve"], Executive: ["View", "Approve"], Viewer: ["View"], "Contractor/Vendor": ["View"], Bidder: ["View", "Create", "Edit", "Submit"] };
interface Invite { id: string; email: string; role: string; token: string; expiresAt: string; invitedBy: string }

export default function Users() {
  const s = useStore(); const industries = useIndustries();
  const [f, setF] = useState({ name: "", email: "", role: "Viewer" }); const [invites, setInvites] = useState<Invite[]>([]); const [err, setErr] = useState<string | null>(null); const [copied, setCopied] = useState<string | null>(null);
  const live = apiEnabled(); const me = getSession()?.user; const isAdmin = !live || ["Super Admin"].includes(me?.role || "");
  const refresh = async () => { if (!live) return; try { const o = await api<{ users: typeof s.users; invites: Invite[] }>("/api/org"); useStore.setState({ users: o.users }); setInvites(o.invites); } catch (e) { setErr(e instanceof Error ? e.message : "load failed"); } };
  useEffect(() => { void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const inviteLink = (t: string) => `${location.origin}/sign-up?invite=${t}`;
  const invite = async () => {
    setErr(null);
    if (!live) { if (f.name) s.addUser({ ...f, active: true }); setF({ name: "", email: "", role: "Viewer" }); return; }
    try { await api("/api/org/invites", { method: "POST", json: { email: f.email, role: f.role } }); setF({ name: "", email: "", role: "Viewer" }); await refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "invite failed"); }
  };
  const patchUser = async (id: string, p: { role?: string; active?: boolean }) => { s.updateUser(id, p); if (live) try { await api(`/api/org/users/${id}`, { method: "PATCH", json: p }); } catch (e) { setErr(e instanceof Error ? e.message : "update failed"); await refresh(); } };
  return (
    <div className="font-sans">
      <PageHeader title="Users & Roles" sub={`${s.org.name} · ${s.org.plan} plan · ${s.users.length} users${live ? " · live" : " · demo mode"}. Data is isolated per organisation.`} />
      <Card className="mb-4 p-4"><Label>Organisation</Label><div className="mt-2 flex flex-wrap gap-4 text-[13px]"><span className="text-app-text">{s.org.name}</span><span className="text-app-muted">Industries: {s.org.industries.map((i) => industries.find((x) => x.id === i)?.name).filter(Boolean).join(", ") || "all"}</span><span className="text-app-muted">Base currency: {s.org.currency}</span><Badge tone="accent">{s.org.plan}</Badge>{me && <span className="text-app-muted">Signed in as {me.name} ({me.role})</span>}</div></Card>
      {isAdmin && <Card className="mb-4 flex flex-wrap items-end gap-2 p-4">
        {!live && <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>}
        <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="colleague@company.com" /></Field>
        <Field label="Role"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</Select></Field>
        <Button variant="primary" onClick={invite} disabled={!f.email}><Plus size={13} /> {live ? "Create invite link" : "Add user"}</Button>
        {err && <span className="text-xs text-app-red">{err}</span>}
      </Card>}
      {live && invites.length > 0 && <Card className="mb-4 divide-y divide-app-border"><div className="px-4 py-2"><Label>Pending invites · share the link (valid 7 days)</Label></div>{invites.map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[13px]"><div><span className="text-app-text">{i.email}</span> <Badge tone="outline">{i.role}</Badge> <span className="text-[11px] text-app-dim">expires {new Date(i.expiresAt).toLocaleDateString()}</span></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(inviteLink(i.token)); setCopied(i.id); setTimeout(() => setCopied(null), 1500); }}>{copied === i.id ? <Check size={11} /> : <Copy size={11} />} {copied === i.id ? "Copied" : "Copy link"}</Button>{isAdmin && <Button size="sm" variant="outline" onClick={async () => { await api(`/api/org/invites/${i.id}`, { method: "DELETE" }); refresh(); }}><Trash2 size={11} /></Button>}</div></div>)}</Card>}
      <Table head={["User", "Email", "Role", "Permissions", "Active"]}>
        {s.users.map((u) => <tr key={u.id}><td className="px-3 py-2 text-app-text">{u.name}{u.name === s.currentUser && <Badge tone="accent" className="ml-2">you</Badge>}</td><td className="px-3 py-2 text-app-muted">{u.email}</td><td className="px-3 py-2"><Select disabled={!isAdmin} className="py-1 text-xs" value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</Select></td><td className="px-3 py-2"><div className="flex flex-wrap gap-1">{(matrix[u.role] || ["View"]).map((p) => <Badge key={p} tone="outline">{p}</Badge>)}</div></td><td className="px-3 py-2"><input type="checkbox" disabled={!isAdmin} checked={u.active} onChange={(e) => patchUser(u.id, { active: e.target.checked })} className="accent-[#c8772e]" /></td></tr>)}
      </Table>
      <Card className="mt-4 p-4"><Label className="mb-2">Role permission matrix</Label><div className="overflow-x-auto"><table className="text-xs"><thead><tr><th className="px-2 py-1 text-left text-app-muted">Role</th>{perms.map((p) => <th key={p} className="px-2 py-1 text-app-muted">{p}</th>)}</tr></thead><tbody>{roles.map((r) => <tr key={r} className="border-t border-app-border"><td className="px-2 py-1 text-app-text">{r}</td>{perms.map((p) => <td key={p} className="px-2 py-1 text-center">{matrix[r]?.includes(p) ? <span className="text-app-green">●</span> : <span className="text-app-dim">·</span>}</td>)}</tr>)}</tbody></table></div><p className="mt-2 text-[11px] text-app-dim">Enforced server-side: Viewer and Contractor/Vendor roles are read-only; only the Super Admin manages users and invites. Bidders can create and edit but only ever see their own workspaces and documents.</p></Card>
    </div>
  );
}
