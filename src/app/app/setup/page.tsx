"use client";
import { useState } from "react";
import { Sparkles, Trash2, Calendar } from "lucide-react";
import { Button, Card, Badge, Label, Modal, PageHeader, SectionTitle, Select } from "@/components/ui";
import { RunEstimate } from "@/components/app/shared";
import { useScopedStore } from "@/store/useStore";

const fields = ["Client", "Submission deadline", "Scope summary", "Bid validity", "Clarification deadline", "Clarification channel", "Contract type", "Governing law", "Payment terms", "Local content / entity"];

export default function SetupPage() {
  const { tenders, activeTenderId, updateTender, docs, deliverables, deleteDeliverable, runExtraction, lastExtraction, profile } = useScopedStore();
  const t = tenders.find((x) => x.id === activeTenderId);
  const [open, setOpen] = useState(false); const [running, setRunning] = useState(false); const [model, setModel] = useState(profile.model);
  if (!t) return null;
  const set = (k: string, v: string) => updateTender(t.id, { metadata: { ...t.metadata, [k]: v }, ...(k === "Submission deadline" ? { closing: v } : {}), ...(k === "Client" ? { client: v } : {}) });
  const run = () => { setRunning(true); setTimeout(() => { runExtraction(); if (!Object.keys(t.metadata).length) updateTender(t.id, { metadata: Object.fromEntries(fields.map((f) => [f, f === "Client" ? t.client : ""])) }); setRunning(false); setOpen(false); }, 1600); };

  return (
    <div className="font-sans">
      <PageHeader title="Setup & Milestones" sub={`Last extracted ${new Date(lastExtraction).toLocaleString()}`} right={<Button variant="primary" onClick={() => setOpen(true)}><Sparkles size={13} /> Re-run extraction</Button>} />
      <SectionTitle>Tender metadata</SectionTitle>
      <div className="grid gap-2 md:grid-cols-2">
        {fields.map((f) => (
          <Card key={f} className="px-4 py-3">
            <Label>{f}</Label>
            <div className="relative">
              <input value={t.metadata[f] || ""} onChange={(e) => set(f, e.target.value)} placeholder="—" type={f === "Submission deadline" ? "date" : "text"} className="mt-1 w-full bg-transparent text-[13px] text-app-accent outline-none placeholder:text-app-dim" />
              {f === "Submission deadline" && <Calendar size={12} className="pointer-events-none absolute right-0 top-2 text-app-muted" />}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-8"><SectionTitle right={`${deliverables.length} accepted · manage in Deliverables`}>Required deliverables</SectionTitle></div>
      <div className="space-y-2">
        {deliverables.map((d) => (
          <Card key={d.id} className="group flex items-center justify-between px-4 py-2.5">
            <span className="flex items-center gap-2 text-[13px] text-app-text">{d.name}<Badge tone="outline">{d.type}</Badge></span>
            <button onClick={() => deleteDeliverable(d.id)} className="text-app-dim opacity-0 group-hover:opacity-100 hover:text-app-red"><Trash2 size={13} /></button>
          </Card>
        ))}
      </div>
      <div className="mt-8"><SectionTitle>Outcome</SectionTitle></div>
      <Card className="flex items-center justify-between px-4 py-3 text-[13px]"><span className="text-app-muted">Tender status</span><Select value={t.status} onChange={(e) => updateTender(t.id, { status: e.target.value as typeof t.status })}>{["Active Campaign", "Won", "Lost", "Archived"].map((s) => <option key={s}>{s}</option>)}</Select></Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Setup extraction" sub="Pulls metadata, deliverables, milestones, and evaluation criteria - each cited, missing fields flagged.">
        <Label className="mb-2">Tender profile (injected as context)</Label>
        <div className="mb-4 flex gap-1.5"><Badge>Scope: {t.scope.split(" ")[0]}</Badge><Badge>Client term: {t.clientTerm.split("/")[0]}</Badge></div>
        <RunEstimate docs={docs} model={model} setModel={(m) => setModel(m as "Lite" | "Max")} />
        <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={run} disabled={running || docs.length === 0}><Sparkles size={13} /> {running ? "Extracting…" : "Run extraction"}</Button></div>
      </Modal>
    </div>
  );
}
