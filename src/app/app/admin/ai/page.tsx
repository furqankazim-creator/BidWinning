"use client";
import { Card, Table, PageHeader, Badge, Label, confidenceTone } from "@/components/ui";
import { Kpi } from "@/components/app/charts";
import { useStore } from "@/store/useStore";

export default function AIGovernance() {
  const s = useStore();
  return (
    <div className="font-sans">
      <PageHeader title="AI Governance" sub="Every AI action records model, prompt version, timestamp, user, source documents, input, output, confidence, review status and approver. AI never silently changes approved business data." />
      <div className="mb-4 grid gap-3 sm:grid-cols-4"><Kpi label="AI runs" value={s.aiLog.length} /><Kpi label="Pending human review" value={s.aiLog.filter((a) => a.reviewStatus === "Pending").length} tone="accent" /><Kpi label="Accepted" value={s.aiLog.filter((a) => a.reviewStatus === "Accepted").length} tone="green" /><Kpi label="Default model" value={s.profile.model} /></div>
      <Table head={["Timestamp", "Task", "Model / prompt", "User", "Sources", "Output", "Confidence", "Review", "Approver"]}>
        {s.aiLog.map((a) => <tr key={a.id}><td className="px-3 py-2 font-mono text-[11px] text-app-muted">{new Date(a.at).toLocaleString()}</td><td className="px-3 py-2 text-app-text">{a.task}</td><td className="px-3 py-2 text-xs text-app-muted">{a.model} · {a.promptVersion}</td><td className="px-3 py-2 text-app-muted">{a.user}</td><td className="px-3 py-2 text-xs text-app-muted">{a.sources.join(", ")}</td><td className="px-3 py-2 text-xs text-app-text">{a.outputSummary}</td><td className="px-3 py-2"><Badge tone={confidenceTone(a.confidence)}>{a.confidence}</Badge></td><td className="px-3 py-2"><Badge tone={a.reviewStatus === "Accepted" ? "green" : a.reviewStatus === "Rejected" ? "red" : "yellow"}>{a.reviewStatus}</Badge></td><td className="px-3 py-2 text-xs text-app-muted">{a.approver || "—"}</td></tr>)}
      </Table>
      <Card className="mt-4 p-4 text-xs text-app-muted"><Label className="mb-1">Policy</Label>AI outputs enter as Draft / Needs Verification. Human acceptance is required before they count in registers, proposals, Tender Health or Go/No-Go. Competitor data is never generated — only recorded with source and confidence.</Card>
    </div>
  );
}
