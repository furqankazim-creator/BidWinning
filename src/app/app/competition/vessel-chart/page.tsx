"use client";
import { PageHeader, Card, Label } from "@/components/ui";
import { useScopedStore } from "@/store/useStore";

// Gantt-style vessel availability against the installation window.
export default function VesselChart() {
  const { competitors } = useScopedStore();
  const months = Array.from({ length: 18 }, (_, i) => { const d = new Date(2028, 3 + i, 1); return d.toLocaleDateString("en", { month: "short", year: "2-digit" }); });
  const window = { from: 13, to: 17 }; // our installation window (index in months)
  const rows = competitors.flatMap((c) => c.vessels.map((v, i) => ({ owner: c.name, vessel: v, busyFrom: (c.id.charCodeAt(2) + i * 5) % 12, busyLen: 4 + (i % 3) })));
  return (
    <div className="font-sans">
      <PageHeader title="Vessel chart" sub="Known commitments of competitor vessels versus our installation window. Overlap = competitor may lack a spread." />
      <Card className="overflow-x-auto p-4">
        <div className="min-w-[900px]">
          <div className="ml-[220px] grid" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>{months.map((m) => <span key={m} className="font-mono text-[9px] text-app-dim">{m}</span>)}</div>
          {rows.map((r) => (
            <div key={r.vessel} className="mt-2 flex items-center">
              <div className="w-[220px] pr-3 text-xs"><span className="text-app-text">{r.vessel}</span><span className="block text-[10px] text-app-dim">{r.owner}</span></div>
              <div className="relative grid h-6 flex-1 rounded bg-app-panel-2" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
                <div className="absolute inset-y-0 bg-app-accent/15" style={{ left: `${(window.from / months.length) * 100}%`, width: `${((window.to - window.from) / months.length) * 100}%` }} />
                <div className="absolute inset-y-1 rounded bg-app-red/50" style={{ left: `${(r.busyFrom / months.length) * 100}%`, width: `${(r.busyLen / months.length) * 100}%` }} title="Committed" />
              </div>
            </div>
          ))}
          <div className="mt-4 flex gap-4"><Label><span className="mr-1 inline-block h-2 w-4 bg-app-accent/30" /> our installation window</Label><Label><span className="mr-1 inline-block h-2 w-4 bg-app-red/50" /> committed elsewhere</Label></div>
        </div>
      </Card>
    </div>
  );
}
