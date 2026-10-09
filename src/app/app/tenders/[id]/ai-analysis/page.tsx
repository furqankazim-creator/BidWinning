"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Sparkles, FileText, AlertTriangle } from "lucide-react";
import { Card, Label, Badge, Button, SectionTitle, Modal } from "@/components/ui";
import { RunEstimate } from "@/components/app/shared";
import { useStore } from "@/store/useStore";
import Link from "next/link";
import { contractTerms } from "@/lib/industries";
import { cn } from "@/lib/cn";
import { PrintableReport } from "@/components/app/PrintableReport";

export default function AIAnalysis() {
  const { id } = useParams<{ id: string }>(); const s = useStore();
  const sum = s.aiSummaries.find((x) => x.tenderId === id);
  const [open, setOpen] = useState(false); const [running, setRunning] = useState(false); const [model, setModel] = useState(s.profile.model as string); const [err, setErr] = useState<string | null>(null);
  const docs = s.docs.filter((d) => (d.tenderId ?? "t1") === id);
  const indexed = docs.filter((d) => d.status === "INDEXED" && d.text);
  const run = async () => { setRunning(true); setErr(null); const e = await s.runTenderAnalysis(id); if (e) setErr(e); setRunning(false); if (!e) setOpen(false); };
  const gTone = (g: string) => (g === "GO" ? "green" : g === "NO-GO" ? "red" : g === "CONDITIONAL GO" ? "yellow" : "outline");
  return (
    <>
      <div className="print:hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-xl text-app-text">AI Document Intelligence</h2><p className="text-xs text-app-muted">{sum ? `Generated ${new Date(sum.generatedAt).toLocaleString()} · model ${sum.model} · every finding cites its source and needs human verification` : "No analysis yet. Upload documents, then analyse."}</p></div>
          <div className="flex gap-2">
            {sum && <Button variant="outline" onClick={() => window.print()}><FileText size={13} /> Download PDF Report</Button>}
            <Button variant="primary" onClick={() => setOpen(true)}><Sparkles size={13} /> {sum ? "Re-analyse documents" : "Analyze Documents"}</Button>
          </div>
        </div>
        {err && <Card className="mb-4 border-app-red/40 p-3 text-xs text-app-red">{err}</Card>}
        {!sum && <Card className="p-8 text-center text-xs text-app-dim">{indexed.length ? `Ready: ${indexed.length} indexed document(s), ${indexed.reduce((a, d) => a + (d.pages || 0), 0)} pages. Run analysis to produce the executive summary, cited requirements, contract-term review, clarifications, risks, compliance items and a reasoned recommendation.` : "No indexed documents yet. Upload the ITT / RFP / SOW under Documents, then run the analysis."}</Card>}
        {sum && (
          <div className="space-y-4">
            <Card className="border-app-accent/40 p-4"><div className="flex items-center justify-between"><Label>Bid recommendation (AI — requires Go/No-Go decision)</Label><Badge tone={gTone(sum.recommendation.verdict)}>{sum.recommendation.verdict}</Badge></div><p className="mt-2 text-[13px] leading-relaxed text-app-text">{sum.recommendation.reasoning}</p><p className="mt-2 text-[11px] text-app-dim">This is a recommendation with reasoning, not a decision. Record the decision in Go/No-Go; management may override with a reason.</p></Card>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(sum.sections).filter(([, v]) => v.length).map(([k, v]) => <Card key={k} className={cn("p-4", (k === "Missing Information" || k === "Potential Risks") && "border-app-yellow/30", k === "Questions for Client" && "border-app-blue/30")}><Label className="mb-2">{k}</Label><ul className="space-y-1.5 text-[13px] text-app-text">{v.map((x, i) => <li key={i} className="flex gap-2"><span className="text-app-accent">—</span>{typeof x === "object" ? JSON.stringify(x) : x}</li>)}</ul></Card>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[["Requirements", s.requirements.filter((r) => r.tenderId === id).length, `${s.requirements.filter((r) => r.tenderId === id && r.status === "Needs Verification").length} to verify`, `/app/tenders/${id}/requirements`], ["Clarifications", s.clarifications.filter((c) => (c.tenderId ?? "t1") === id).length, `${s.clarifications.filter((c) => (c.tenderId ?? "t1") === id && c.pending).length} AI drafts`, "/app/clarifications/register"], ["Contract clauses", s.clauses.filter((c) => (c.tenderId ?? "t1") === id).length, `${s.clauses.filter((c) => (c.tenderId ?? "t1") === id && c.pending).length} pending`, "/app/contract/register"], ["Risks", s.risks.filter((r) => (r.tenderId ?? "t1") === id).length, `${s.risks.filter((r) => (r.tenderId ?? "t1") === id && r.status === "Open").length} open`, "/app/risks/register"]].map(([l, n, sub, href]) => <Link key={String(l)} href={String(href)}><Card className="p-3 hover:border-app-border-2"><Label>{l}</Label><p className="font-display text-2xl text-app-text">{n}</p><p className="text-[11px] text-app-dim">{sub}</p></Card></Link>)}
            </div>
            <div><SectionTitle right={`${sum.contractTerms.length} of ${contractTerms.length} standard terms reviewed`}>Contract / terms analysis</SectionTitle>
              <Card className="divide-y divide-app-border">
                {contractTerms.map((term) => { const f = sum.contractTerms.find((x) => x.term === term); return (
                  <div key={term} className="flex items-start justify-between gap-4 px-4 py-2.5 text-[13px]">
                    <div className="w-44 shrink-0 text-app-muted">{term}</div>
                    <div className="flex-1">{f ? <><p className="text-app-text">{f.finding}</p><p className="mt-0.5 flex items-center gap-1 text-[11px] text-app-dim"><FileText size={10} /> {f.source}</p></> : <p className="text-[11px] italic text-app-dim">Not found in indexed documents — verify manually.</p>}</div>
                    {f && <Badge tone={f.risk === "High" ? "red" : f.risk === "Medium" ? "yellow" : "green"}>{f.risk}</Badge>}
                  </div>
                ); })}
              </Card></div>
            <Card className="flex items-start gap-3 p-4 text-xs text-app-muted"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-app-yellow" />The system never presents AI assumptions as confirmed facts. Extracted requirements are listed under Requirements with status <em>Needs Verification</em> until a reviewer approves, edits or rejects them. Every run is recorded in Administration → AI Governance.</Card>
          </div>
        )}
        <Modal open={open} onClose={() => setOpen(false)} title="Analyze documents" sub="Extracts general information, requirements with citations, contract terms and a reasoned recommendation.">
          <RunEstimate docs={indexed} model={model} setModel={setModel} />
          <p className="mt-3 text-[11px] text-app-muted">Outputs are written as AI drafts: requirements → Needs Verification, clauses & clarifications → pending review, risks/compliance/deliverables → open. Nothing is marked approved automatically.</p>
          <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={run} disabled={running || !indexed.length}><Sparkles size={13} /> {running ? "Analysing… (30–90 s)" : "Run analysis"}</Button></div>
        </Modal>
      </div>
      <PrintableReport tenderId={id} />
    </>
  );
}
