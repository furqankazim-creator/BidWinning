"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Briefcase, FileText, Layers } from "lucide-react";
import { Card, Badge, Button, Table, PageHeader, Label, Empty, Stat } from "@/components/ui";
import { api, apiEnabled } from "@/lib/api";
import { WorkspaceView, type WsDetail } from "./WorkspaceView";

interface Bidder { id: string; name: string; email: string; company: string; phone: string; title: string; active: boolean; lastLoginAt?: string; createdAt?: string; workspaces: number; documents: number; bytes: number }
interface Workspace { _id: string; tenderId: string; name?: string; reference?: string; client?: string; industry?: string; stage?: string; status?: string; value?: number; currency?: string; closing?: string; documentCount?: number; updatedAt: string }
interface Document { _id: string; docId: string; tenderId?: string; name?: string; kind?: string; size?: number; status?: string; pages?: number; textLength?: number; uploadedAt?: string; updatedAt: string }
interface Detail { bidder: Bidder; workspaces: Workspace[]; documents: Document[] }

const kb = (n = 0) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const when = (d?: string) => (d ? new Date(d).toLocaleString() : "never");

export default function Bidders() {
  const [list, setList] = useState<Bidder[] | null>(null); const [detail, setDetail] = useState<Detail | null>(null); const [ws, setWs] = useState<WsDetail | null>(null); const [err, setErr] = useState<string | null>(null);
  const orgQ = () => { const o = new URLSearchParams(location.search).get("orgId"); return o ? `?orgId=${encodeURIComponent(o)}` : ""; };
  const load = () => api<Bidder[]>("/api/org/bidders" + orgQ()).then(setList).catch((e) => setErr(e instanceof Error ? e.message : "load failed"));
  useEffect(() => { if (apiEnabled()) void load(); }, []);
  const open = (id: string) => api<Detail>(`/api/org/bidders/${id}${orgQ()}`).then(setDetail).catch((e) => setErr(e instanceof Error ? e.message : "load failed"));

  if (!apiEnabled()) return <div className="font-sans"><PageHeader title="Bidders" /><Empty icon={<Briefcase size={18} />} title="Live mode only" body="Bidder accounts are stored in MongoDB. Set NEXT_PUBLIC_API_URL and start the API to use this page." /></div>;
  const openWs = (tenderId: string) => api<WsDetail>(`/api/org/bidders/${detail!.bidder.id}/workspaces/${encodeURIComponent(tenderId)}${orgQ()}`).then(setWs).catch((e) => setErr(e instanceof Error ? e.message : "load failed"));
  if (detail && ws) return <WorkspaceView ws={ws} onBack={() => setWs(null)} />;
  if (detail) {
    const b = detail.bidder; const names = new Map(detail.workspaces.map((w) => [w.tenderId, w.name || w.tenderId]));
    return (
      <div className="font-sans">
        <Button variant="outline" size="sm" className="mb-3" onClick={() => setDetail(null)}><ArrowLeft size={12} /> All bidders</Button>
        <PageHeader title={b.name} sub={<>{b.company || "No company on file"} · {b.email}{b.phone ? ` · ${b.phone}` : ""}{b.title ? ` · ${b.title}` : ""}</>} right={<Badge tone={b.active ? "green" : "red"}>{b.active ? "Active" : "Deactivated"}</Badge>} />
        <div className="mb-4 grid gap-3 sm:grid-cols-3"><Stat value={detail.workspaces.length} label="Workspaces" icon={<Layers size={14} />} /><Stat value={detail.documents.length} label="Documents" icon={<FileText size={14} />} /><Stat value={kb(detail.documents.reduce((a, d) => a + (d.size || 0), 0))} label="Stored" sub={`Last sign-in ${when(b.lastLoginAt)}`} /></div>
        <Label className="mb-2">Workspaces <span className="normal-case text-app-dim">· click one to open everything inside it</span></Label>
        {detail.workspaces.length === 0 ? <Card className="mb-5 p-4 text-[13px] text-app-muted">This bidder has not created a workspace yet.</Card> :
          <div className="mb-5"><Table head={["Workspace", "Client", "Stage", "Value", "Closing", "Docs", "Updated"]}>{detail.workspaces.map((w) => <tr key={w._id} onClick={() => openWs(w.tenderId)} className="cursor-pointer hover:bg-app-panel"><td className="px-3 py-2 text-app-text">{w.name}<span className="block text-[11px] text-app-dim">{w.reference}</span></td><td className="px-3 py-2 text-app-muted">{w.client}</td><td className="px-3 py-2"><Badge tone="outline">{w.stage || w.status || "—"}</Badge></td><td className="px-3 py-2 text-app-muted">{w.value ? `${w.currency || ""} ${w.value.toLocaleString()}` : "—"}</td><td className="px-3 py-2 text-app-muted">{w.closing || "—"}</td><td className="px-3 py-2 text-app-muted">{w.documentCount || 0}</td><td className="px-3 py-2 font-mono text-[11px] text-app-muted">{when(w.updatedAt)}</td></tr>)}</Table></div>}
        <Label className="mb-2">Documents</Label>
        {detail.documents.length === 0 ? <Card className="p-4 text-[13px] text-app-muted">No documents uploaded.</Card> :
          <Table head={["Document", "Workspace", "Type", "Size", "Pages", "Status", "Uploaded"]}>{detail.documents.map((d) => <tr key={d._id} onClick={() => names.has(d.tenderId || "") && openWs(d.tenderId!)} className={names.has(d.tenderId || "") ? "cursor-pointer hover:bg-app-panel" : "opacity-60"} title={names.has(d.tenderId || "") ? undefined : "Its workspace was deleted by the bidder"}><td className="px-3 py-2 text-app-text">{d.name}</td><td className="px-3 py-2 text-app-muted">{(d.tenderId && names.get(d.tenderId)) || "—"}</td><td className="px-3 py-2 text-app-muted">{d.kind || "—"}</td><td className="px-3 py-2 text-app-muted">{kb(d.size)}</td><td className="px-3 py-2 text-app-muted">{d.pages ?? "—"}</td><td className="px-3 py-2"><Badge tone={d.status === "INDEXED" ? "green" : d.status === "FAILED" ? "red" : "outline"}>{d.status || "—"}</Badge></td><td className="px-3 py-2 font-mono text-[11px] text-app-muted">{when(d.uploadedAt || d.updatedAt)}</td></tr>)}</Table>}
      </div>
    );
  }
  return (
    <div className="font-sans">
      <PageHeader title="Bidders" sub="Every bidder account in your organisation and the workspaces and documents saved for each one. Bidders cannot see each other's work; only administrators can see this page." />
      {err && <p className="mb-3 text-xs text-app-red">{err}</p>}
      {list === null ? <p className="text-xs text-app-muted">Loading…</p> : list.length === 0 ? <Empty icon={<Briefcase size={18} />} title="No bidders yet" body="Go to Users & Roles, create an invite with the role “Bidder” and share the link." /> :
        <Table head={["Bidder", "Company", "Workspaces", "Documents", "Last sign-in", "Status"]}>{list.map((b) => <tr key={b.id} onClick={() => open(b.id)} className="cursor-pointer hover:bg-app-panel"><td className="px-3 py-2 text-app-text">{b.name}<span className="block text-[11px] text-app-dim">{b.email}</span></td><td className="px-3 py-2 text-app-muted">{b.company || "—"}</td><td className="px-3 py-2 text-app-muted">{b.workspaces}</td><td className="px-3 py-2 text-app-muted">{b.documents} <span className="text-[11px] text-app-dim">({kb(b.bytes)})</span></td><td className="px-3 py-2 font-mono text-[11px] text-app-muted">{when(b.lastLoginAt)}</td><td className="px-3 py-2"><Badge tone={b.active ? "green" : "red"}>{b.active ? "Active" : "Deactivated"}</Badge></td></tr>)}</Table>}
    </div>
  );
}
