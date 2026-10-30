"use client";
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Badge, Button, Card, Label, PageHeader, Stat, Table } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Rec = Record<string, any>;
export interface WsDetail { bidder: { id: string; name: string; email: string; company: string }; tender: Rec; collections: Record<string, Rec[]> }

const kb = (n = 0) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const tone = (s: string) => (/^(Compliant|Approved|Closed|Mitigated|Done|INDEXED|GO)$/.test(s) ? "green" : /^(Non-Compliant|Expired|Missing|Rejected|FAILED|NO-GO)$/.test(s) ? "red" : /^(Partial|Partially Compliant|Needs|In Progress|CONDITIONAL)/.test(s) ? "yellow" : "outline") as "green" | "red" | "yellow" | "outline";
const LABELS: Record<string, string> = { docs: "Documents", requirements: "Requirements", complianceItems: "Compliance", risks: "Risks & opportunities", actions: "Actions", clarifications: "Clarifications" };

/** Read-only view of everything a bidder has saved in one workspace. */
export function WorkspaceView({ ws, onBack }: { ws: WsDetail; onBack: () => void }) {
  const t = ws.tender; const c = ws.collections; const g = (k: string) => c[k] || [];
  const [open, setOpen] = useState<string | null>(null);
  const scores = Object.entries((t.goNoGoScores || {}) as Record<string, number>);
  const others = Object.keys(c).filter((k) => !LABELS[k]);
  return (
    <div className="font-sans">
      <Button variant="outline" size="sm" className="mb-3" onClick={onBack}><ArrowLeft size={12} /> Back to {ws.bidder.name}</Button>
      <PageHeader title={t.name} sub={<>{t.reference} · {t.client} · bidder: {ws.bidder.name}{ws.bidder.company ? ` (${ws.bidder.company})` : ""} · <span className="text-app-dim">read-only view</span></>} right={<div className="flex gap-1.5"><Badge tone="outline">{t.stage}</Badge><Badge tone={tone(t.goNoGo)}>{t.goNoGo}</Badge></div>} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat value={t.value ? `${t.currency} ${Number(t.value).toLocaleString()}` : "—"} label="Value" /><Stat value={t.closing || "—"} label="Closing" /><Stat value={g("docs").length} label="Documents" /><Stat value={g("requirements").length} label="Requirements" /><Stat value={g("complianceItems").length} label="Compliance items" /><Stat value={g("risks").length} label="Risks" />
      </div>

      <Card className="mb-4 grid gap-4 p-4 text-[13px] md:grid-cols-2">
        <div><Label>Description</Label><p className="mt-1 text-app-text">{t.description || "—"}</p><p className="mt-3 text-app-muted">Industry: {t.industry} · Service: {t.service || "—"} · Type: {t.tenderType} · Region: {t.region || "—"} · Owner: {t.owner}</p>{t.goNoGoReason && <p className="mt-2 text-app-muted">Go/No-Go: {t.goNoGoReason}</p>}</div>
        <div><Label>Go / No-Go scores</Label>{scores.length ? <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[12px]">{scores.map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-app-muted">{k}</span><span className="font-mono text-app-text">{v}/5</span></div>)}</div> : <p className="mt-1 text-app-dim">Not scored yet.</p>}</div>
      </Card>

      <Section title={`Documents (${g("docs").length})`}>
        {g("docs").length === 0 ? <Empty text="No documents uploaded to this workspace." /> : <div className="divide-y divide-app-border rounded border border-app-border">{g("docs").map((d) => { const isOpen = open === d.id; return (
          <div key={d.id}>
            <button onClick={() => setOpen(isOpen ? null : d.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-app-panel">
              <span className="flex min-w-0 items-center gap-2 text-[13px] text-app-text">{isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}<FileText size={13} className="shrink-0 text-app-muted" /><span className="truncate">{d.name}</span></span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-app-muted"><Badge tone="outline">{d.kind}</Badge>{kb(d.size)} · {d.pages ?? "?"} pp<Badge tone={tone(d.status)}>{d.status}</Badge></span>
            </button>
            {isOpen && <div className="border-t border-app-border bg-app-bg px-4 py-3 text-[12px]">
              <p className="mb-2 text-app-muted">Uploaded {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : "—"} by {d.uploadedBy || "—"} · {d.language || "—"} · {d.confidentiality || "—"} · rev {d.rev ?? 1} · {(d.textLength ?? d.text?.length ?? 0).toLocaleString()} characters extracted</p>
              {d.analysis && Object.keys(d.analysis).length > 0 && <div className="mb-2 grid gap-1">{Object.entries(d.analysis as Record<string, string>).map(([k, v]) => <p key={k}><span className="text-app-muted">{k}: </span><span className="text-app-text">{v}</span></p>)}</div>}
              {d.text ? <pre className="app-scroll max-h-72 overflow-auto whitespace-pre-wrap rounded border border-app-border bg-app-panel p-3 font-mono text-[11px] leading-5 text-app-text">{d.text}{d.textTruncated ? "\n…(truncated)" : ""}</pre> : <p className="text-app-dim">No extracted text.</p>}
            </div>}
          </div>); })}</div>}
      </Section>

      <Section title={`Requirements (${g("requirements").length})`}>
        {g("requirements").length === 0 ? <Empty text="No requirements captured." /> : <Table head={["Clause", "Requirement", "Category", "Priority", "Status", "Source"]}>{g("requirements").map((r) => <tr key={r.id}><td className="px-3 py-2 font-mono text-[11px] text-app-muted">{r.clause}</td><td className="px-3 py-2 text-app-text">{r.text}</td><td className="px-3 py-2 text-app-muted">{r.category}</td><td className="px-3 py-2"><Badge tone={r.priority === "Must" ? "accent" : "outline"}>{r.priority}</Badge></td><td className="px-3 py-2"><Badge tone={tone(r.status)}>{r.status}</Badge></td><td className="px-3 py-2 text-[11px] text-app-dim">{g("docs").find((d) => d.id === r.sourceDoc)?.name || r.sourceDoc}{r.page ? ` · p.${r.page}` : ""}</td></tr>)}</Table>}
      </Section>

      <Section title={`Compliance (${g("complianceItems").length})`}>
        {g("complianceItems").length === 0 ? <Empty text="No compliance items." /> : <Table head={["Item", "Status", "Evidence", "Owner", "Expiry"]}>{g("complianceItems").map((r) => <tr key={r.id}><td className="px-3 py-2 text-app-text">{r.item}</td><td className="px-3 py-2"><Badge tone={tone(r.status)}>{r.status}</Badge></td><td className="px-3 py-2 text-app-muted">{r.evidence}</td><td className="px-3 py-2 text-app-muted">{r.owner}</td><td className="px-3 py-2 text-app-muted">{r.expiry ? String(r.expiry).slice(0, 10) : "—"}</td></tr>)}</Table>}
      </Section>

      <Section title={`Risks & opportunities (${g("risks").length})`}>
        {g("risks").length === 0 ? <Empty text="No risks logged." /> : <Table head={["", "Title", "Category", "P × I", "Mitigation", "Status"]}>{g("risks").map((r) => <tr key={r.id}><td className="px-3 py-2"><Badge tone={r.kind === "Risk" ? "red" : "green"}>{r.kind}</Badge></td><td className="px-3 py-2 text-app-text">{r.title}<span className="block text-[11px] text-app-dim">{r.description}</span></td><td className="px-3 py-2 text-app-muted">{r.category}</td><td className="px-3 py-2 font-mono text-app-muted">{r.probability}×{r.impact}</td><td className="px-3 py-2 text-app-muted">{r.mitigation}</td><td className="px-3 py-2"><Badge tone={tone(r.status)}>{r.status}</Badge></td></tr>)}</Table>}
      </Section>

      <Section title={`Actions (${g("actions").length}) & clarifications (${g("clarifications").length})`}>
        {g("actions").length + g("clarifications").length === 0 ? <Empty text="Nothing here yet." /> : <Table head={["Type", "Title", "Status", "Due", "Assignee"]}>{([...g("actions").map((a) => ({ ...a, _t: "Action" })), ...g("clarifications").map((q) => ({ ...q, _t: "Clarification" }))] as Rec[]).map((a) => <tr key={a._t + a.id}><td className="px-3 py-2"><Badge tone="outline">{a._t}</Badge></td><td className="px-3 py-2 text-app-text">{a.title}</td><td className="px-3 py-2"><Badge tone={tone(a.status)}>{a.status}</Badge></td><td className="px-3 py-2 text-app-muted">{a.due || "—"}</td><td className="px-3 py-2 text-app-muted">{a.assignee || "—"}</td></tr>)}</Table>}
      </Section>

      {others.length > 0 && <p className="mt-4 text-[11px] text-app-dim">Also saved in this workspace: {others.map((k) => `${c[k].length} ${k}`).join(", ")}.</p>}
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="mb-5"><Label className="mb-2">{title}</Label>{children}</div>;
const Empty = ({ text }: { text: string }) => <Card className="p-4 text-[13px] text-app-muted">{text}</Card>;
