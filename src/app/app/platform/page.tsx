"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Check, Copy, FileText, Globe, Layers, Plus, Users } from "lucide-react";
import { Card, Badge, Button, Input, Select, Table, PageHeader, Label, Field, Stat, Empty } from "@/components/ui";
import { api, apiEnabled, getSession } from "@/lib/api";
import { roles } from "@/lib/industries";

interface OrgRow { id: string; name: string; plan: string; createdAt: string; users: number; admins: number; bidders: number; workspaces: number; documents: number }
interface Overview { totals: { organisations: number; users: number; bidders: number; workspaces: number; documents: number }; organisations: OrgRow[] }
interface OrgUser { id: string; name: string; email: string; role: string; active: boolean; company?: string; lastLoginAt?: string }
interface OrgInvite { id: string; email: string; role: string; token: string; expiresAt: string }
interface OrgDetail { org: { id: string; name: string; plan: string; currency: string }; users: OrgUser[]; invites: OrgInvite[] }

const when = (d?: string) => (d ? new Date(d).toLocaleString() : "never");

export default function Platform() {
  const me = getSession()?.user;
  const [ov, setOv] = useState<Overview | null>(null); const [org, setOrg] = useState<OrgDetail | null>(null); const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ email: "", role: "Bidder" }); const [copied, setCopied] = useState<string | null>(null);
  const fail = (e: unknown) => setErr(e instanceof Error ? e.message : "request failed");
  const loadOv = () => api<Overview>("/api/platform/overview").then(setOv).catch(fail);
  const openOrg = (id: string) => { setErr(null); return api<OrgDetail>(`/api/platform/orgs/${id}`).then(setOrg).catch(fail); };
  useEffect(() => { if (apiEnabled()) void loadOv(); }, []);

  if (!apiEnabled()) return <div className="font-sans"><PageHeader title="Platform Console" /><Empty icon={<Globe size={18} />} title="Live mode only" body="Set NEXT_PUBLIC_API_URL and start the API to manage organisations." /></div>;

  if (org) {
    const patch = async (u: OrgUser, p: { role?: string; active?: boolean }) => { setErr(null); try { await api(`/api/platform/users/${u.id}`, { method: "PATCH", json: p }); await openOrg(org.org.id); void loadOv(); } catch (e) { fail(e); } };
    const invite = async () => { setErr(null); try { await api(`/api/platform/orgs/${org.org.id}/invites`, { method: "POST", json: f }); setF({ email: "", role: "Bidder" }); await openOrg(org.org.id); } catch (e) { fail(e); } };
    return (
      <div className="font-sans">
        <Button variant="outline" size="sm" className="mb-3" onClick={() => { setOrg(null); setErr(null); }}><ArrowLeft size={12} /> All organisations</Button>
        <PageHeader title={org.org.name} sub={`${org.org.plan} plan · ${org.users.length} users`} right={<Link href={`/app/admin/bidders?orgId=${org.org.id}`}><Button variant="outline" size="sm">View bidders' workspaces</Button></Link>} />
        {err && <p className="mb-3 text-xs text-app-red">{err}</p>}
        <Card className="mb-4 flex flex-wrap items-end gap-2 p-4">
          <Field label="Invite by email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="bidder@company.com" /></Field>
          <Field label="Role"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Button variant="primary" onClick={invite} disabled={!f.email}><Plus size={13} /> Create invite link</Button>
        </Card>
        {org.invites.length > 0 && <Card className="mb-4 divide-y divide-app-border"><div className="px-4 py-2"><Label>Pending invites (valid 7 days)</Label></div>{org.invites.map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[13px]"><span className="text-app-text">{i.email} <Badge tone="outline">{i.role}</Badge></span><Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${location.origin}/sign-up?invite=${i.token}`); setCopied(i.id); setTimeout(() => setCopied(null), 1500); }}>{copied === i.id ? <Check size={11} /> : <Copy size={11} />} {copied === i.id ? "Copied" : "Copy link"}</Button></div>)}</Card>}
        <Table head={["User", "Email", "Role", "Last sign-in", "Active"]}>
          {org.users.map((u) => { const self = u.id === me?.id; return <tr key={u.id}><td className="px-3 py-2 text-app-text">{u.name}{self && <Badge tone="accent" className="ml-2">you</Badge>}{u.company && <span className="block text-[11px] text-app-dim">{u.company}</span>}</td><td className="px-3 py-2 text-app-muted">{u.email}</td><td className="px-3 py-2"><Select disabled={self} className="py-1 text-xs" value={u.role} onChange={(e) => patch(u, { role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</Select></td><td className="px-3 py-2 font-mono text-[11px] text-app-muted">{when(u.lastLoginAt)}</td><td className="px-3 py-2"><input type="checkbox" disabled={self} checked={u.active} onChange={(e) => patch(u, { active: e.target.checked })} className="accent-[#c8772e]" /></td></tr>; })}
        </Table>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <PageHeader title="Platform Console" sub="Every organisation, user and bidder on the platform. Visible to Super Admins only; organisation admins only ever see their own organisation." />
      {err && <p className="mb-3 text-xs text-app-red">{err}</p>}
      {!ov ? <p className="text-xs text-app-muted">Loading…</p> : <>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Stat value={ov.totals.organisations} label="Organisations" icon={<Building2 size={14} />} /><Stat value={ov.totals.users} label="Users" icon={<Users size={14} />} /><Stat value={ov.totals.bidders} label="Bidders" /><Stat value={ov.totals.workspaces} label="Workspaces" icon={<Layers size={14} />} /><Stat value={ov.totals.documents} label="Documents" icon={<FileText size={14} />} /></div>
        <Table head={["Organisation", "Plan", "Users", "Admins", "Bidders", "Workspaces", "Documents", "Created"]}>
          {ov.organisations.map((o) => <tr key={o.id} onClick={() => openOrg(o.id)} className="cursor-pointer hover:bg-app-panel"><td className="px-3 py-2 text-app-text">{o.name}</td><td className="px-3 py-2"><Badge tone="outline">{o.plan}</Badge></td><td className="px-3 py-2 text-app-muted">{o.users}</td><td className="px-3 py-2 text-app-muted">{o.admins}</td><td className="px-3 py-2 text-app-muted">{o.bidders}</td><td className="px-3 py-2 text-app-muted">{o.workspaces}</td><td className="px-3 py-2 text-app-muted">{o.documents}</td><td className="px-3 py-2 font-mono text-[11px] text-app-muted">{new Date(o.createdAt).toLocaleDateString()}</td></tr>)}
        </Table>
      </>}
    </div>
  );
}
