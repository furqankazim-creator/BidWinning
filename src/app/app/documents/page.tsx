"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { CloudUpload, FileText, FolderOpen, Trash2, HardDrive, Sparkles, History, Lock } from "lucide-react";
import { Button, Card, Badge, PageHeader, Select, Modal, Label, Input } from "@/components/ui";
import { useScopedStore, useStore } from "@/store/useStore";
import { useIndustry } from "@/lib/useIndustries";
import type { Doc } from "@/store/types";
import { cn } from "@/lib/cn";

export default function DocumentsPage() {
  const s = useScopedStore(); const setDocs = useStore((x) => x.updateDoc);
  const tender = s.tenders.find((t) => t.id === s.activeTenderId); const ind = useIndustry(tender?.industry || "other");
  const fileRef = useRef<HTMLInputElement>(null); const dirRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false); const [detail, setDetail] = useState<Doc | null>(null); const [analysing, setAnalysing] = useState<string | null>(null);
  const take = (files: FileList | null) => { if (!files) return; void s.uploadDocs(Array.from(files)); };
  const [err, setErr] = useState<string | null>(null);
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;
  const types = Array.from(new Set([...ind.documentTypes, ...s.docs.map((d) => d.kind)]));
  const analyse = async (d: Doc) => { setAnalysing(d.id); setErr(null); const e = await s.analyzeDocument(d.id); if (e) setErr(e); setAnalysing(null); };
  const analyseLegacy = (d: Doc) => { setAnalysing(d.id); setTimeout(() => { setDocs(d.id, { analysis: { Title: d.name.replace(/\.[^.]+$/, ""), Reference: tender?.reference || "—", Client: tender?.client || "—", Issuer: tender?.client || "—", Industry: ind.name, Location: tender?.region || "—", "Key dates": tender?.closing ? `Submission ${tender.closing}` : "not found", Value: tender?.value ? `${tender.currency} ${tender.value.toLocaleString()}` : "not found", Duration: "not found", "Tender type": tender?.tenderType || "—" } }); s.logAI({ model: s.profile.model, promptVersion: "doc-analyze v2", task: "Document analysis", sources: [d.name], input: "Extract general information", outputSummary: "10 fields; missing marked 'not found'", confidence: "Medium", reviewStatus: "Pending" }); setAnalysing(null); }, 1400); };
  const conf = (c?: Doc["confidentiality"]) => c === "Restricted" ? "red" : c === "Confidential" ? "yellow" : "outline";

  return (
    <div className="font-sans">
      <PageHeader title="Documents" sub={`${tender?.name || ""} · document types from the ${ind.name} template`} right={<span className="flex items-center gap-1 text-xs text-app-muted"><HardDrive size={12} /> {s.docs.length} document{s.docs.length !== 1 && "s"}</span>} />
      <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
        className={cn("flex flex-col items-center rounded border border-dashed py-10 text-center", over ? "border-app-accent bg-app-accent/5" : "border-app-border-2 bg-app-panel")}>
        <CloudUpload size={22} className="text-app-blue" />
        <p className="mt-2 text-xs font-semibold text-app-blue">Drag files here, or use the buttons below</p>
        <div className="mt-3 flex gap-2"><Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Files</Button><Button variant="outline" size="sm" onClick={() => dirRef.current?.click()}><FolderOpen size={12} /> Folder</Button></div>
        <p className="mt-3 text-[11px] text-app-dim">PDF, DOCX, XLSX, PPTX, images, ZIP, CAD/reference files · up to 200 MB each</p>
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => take(e.target.files)} />
        {/* @ts-expect-error webkitdirectory is non-standard */}
        <input ref={dirRef} type="file" multiple hidden webkitdirectory="" onChange={(e) => take(e.target.files)} />
      </div>
      <div className="mt-4 overflow-x-auto rounded border border-app-border">
        <table className="w-full text-left text-[13px]">
          <thead><tr className="border-b border-app-border bg-app-panel-2">{["Document", "Type", "Version", "Language", "Confidentiality", "Uploaded", "Status", ""].map((h) => <th key={h} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-app-muted">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-app-border">
            {s.docs.map((d) => (
              <tr key={d.id}>
                <td className="px-3 py-2"><button onClick={() => setDetail(d)} className="flex items-center gap-2 text-left hover:text-app-accent"><FileText size={14} className="text-app-muted" /><span><span className="block text-app-text">{d.name}</span><span className="text-[11px] text-app-muted">{mb(d.size)}</span></span></button></td>
                <td className="px-3 py-2"><Select className="py-1 text-xs" value={d.kind} onChange={(e) => setDocs(d.id, { kind: e.target.value })}>{types.map((x) => <option key={x}>{x}</option>)}</Select></td>
                <td className="px-3 py-2 font-mono text-xs text-app-muted">rev {d.rev}{d.pages ? <span className="block text-[10px] text-app-dim">{d.pages} pp · {d.text ? "indexed text" : "no text"}</span> : null}</td>
                <td className="px-3 py-2"><Select className="py-1 text-xs" value={d.language || "English"} onChange={(e) => setDocs(d.id, { language: e.target.value })}>{["English", "French", "Arabic", "Spanish", "Portuguese", "Norwegian", "Other"].map((x) => <option key={x}>{x}</option>)}</Select></td>
                <td className="px-3 py-2"><Select className={cn("py-1 text-xs", `text-app-${conf(d.confidentiality) === "outline" ? "muted" : conf(d.confidentiality)}`)} value={d.confidentiality || "Internal"} onChange={(e) => setDocs(d.id, { confidentiality: e.target.value as Doc["confidentiality"] })}>{["Public", "Internal", "Confidential", "Restricted"].map((x) => <option key={x}>{x}</option>)}</Select></td>
                <td className="px-3 py-2 text-xs text-app-muted">{new Date(d.uploadedAt).toLocaleDateString()}<br />{d.uploadedBy || s.currentUser}</td>
                <td className="px-3 py-2"><Badge tone={d.status === "INDEXED" ? "accent" : d.status === "PROCESSING" ? "yellow" : "red"}>{d.status === "PROCESSING" ? "EXTRACTING…" : d.status}</Badge>{d.status === "FAILED" && d.analysis?.Error && <p className="mt-1 max-w-[160px] text-[10px] text-app-red">{d.analysis.Error}</p>}</td>
                <td className="px-3 py-2"><div className="flex gap-2"><Button size="sm" variant="outline" disabled={d.status !== "INDEXED" || analysing === d.id} onClick={() => analyse(d)}><Sparkles size={11} /> {analysing === d.id ? "Analysing…" : d.analysis ? "Re-analyse" : "Analyze"}</Button><button onClick={() => s.deleteDoc(d.id)} className="text-app-dim hover:text-app-red"><Trash2 size={13} /></button></div></td>
              </tr>
            ))}
            {s.docs.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-xs text-app-dim">No documents in this workspace yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {err && <p className="mt-3 rounded border border-app-red/40 bg-app-red/10 px-3 py-2 text-xs text-app-red">{err}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded border border-app-accent/30 bg-app-accent/5 px-4 py-3"><Sparkles size={14} className="text-app-accent" /><p className="flex-1 text-xs text-app-text">Run the <span className="font-semibold">full AI review</span> of this tender from the indexed documents — summary, cited requirements, contract terms, clarifications, risks, compliance and deliverables.</p><Link href={`/app/tenders/${s.activeTenderId}/ai-analysis`}><Button variant="primary" size="sm"><Sparkles size={11} /> Open AI Analysis</Button></Link></div>
      <p className="mt-3 text-xs text-app-dim">Document analysis extracts general information per file. Requirements, contract terms and the summary are generated on the tender&apos;s <Link href={`/app/tenders/${s.activeTenderId}/ai-analysis`} className="text-app-accent">AI Analysis</Link> tab.</p>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} sub={detail ? `${detail.kind} · rev ${detail.rev} · ${mb(detail.size)}` : ""} wide>
        {detail && (() => { const d = s.docs.find((x) => x.id === detail.id) || detail; return (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2 flex items-center gap-1"><Sparkles size={10} /> AI-extracted general information</Label>
              {d.analysis ? <div className="space-y-1.5">{Object.entries(d.analysis).map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-app-border py-1 text-xs"><span className="text-app-muted">{k}</span><span className={cn("text-right", v === "not found" ? "italic text-app-dim" : "text-app-text")}>{v}</span></div>)}<p className="mt-2 text-[10px] text-app-dim">Needs verification · logged in AI Governance</p></div> : <p className="text-xs text-app-dim">Not analysed yet.</p>}
            </div>
            <div>
              <Label className="mb-2 flex items-center gap-1"><Lock size={10} /> Permissions</Label>
              <div className="flex flex-wrap gap-1">{["Tender Manager", "Commercial Manager", "Technical Manager", "Legal", "Finance", "Viewer"].map((r) => { const on = (d.permissions || ["Tender Manager", "Commercial Manager", "Technical Manager"]).includes(r); return <button key={r} onClick={() => { const cur = d.permissions || ["Tender Manager", "Commercial Manager", "Technical Manager"]; setDocs(d.id, { permissions: on ? cur.filter((x) => x !== r) : [...cur, r] }); }}><Badge tone={on ? "accent" : "outline"}>{r}</Badge></button>; })}</div>
              <Label className="mt-4 mb-2 flex items-center gap-1"><History size={10} /> Document history</Label>
              <div className="space-y-1 text-xs">{[...(d.history || []), { rev: d.rev, at: d.uploadedAt, by: d.uploadedBy || s.currentUser, note: "Uploaded" }].sort((a, b) => b.rev - a.rev).map((h, i) => <p key={i} className="text-app-muted"><span className="font-mono text-app-text">rev {h.rev}</span> · {new Date(h.at).toLocaleString()} · {h.by} · {h.note}</p>)}</div>
              <div className="mt-3 flex gap-2"><Input type="file" className="flex-1 text-xs" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setDocs(d.id, { rev: d.rev + 1, size: f.size, status: "INDEXED", history: [...(d.history || []), { rev: d.rev, at: d.uploadedAt, by: d.uploadedBy || s.currentUser, note: "Superseded" }], uploadedAt: new Date().toISOString(), uploadedBy: s.currentUser }); s.audit("New document version", "Document", d.id, `${d.name} → rev ${d.rev + 1}`); }} /><Label className="self-center">Upload new version</Label></div>
            </div>
          </div>
        ); })()}
      </Modal>
    </div>
  );
}
