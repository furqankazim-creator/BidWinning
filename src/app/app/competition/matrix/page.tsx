"use client";
import { PageHeader, Card, Table } from "@/components/ui";
import { useScopedStore } from "@/store/useStore";
import { cn } from "@/lib/cn";

const crit = [["Capability", "capability"], ["Pricing posture", "pricing"], ["Track record", "track"]] as const;
export default function Matrix() {
  const { competitors } = useScopedStore();
  const us = { capability: 4, pricing: 4, track: 4 };
  const dot = (v: number) => <span className={cn("inline-block h-3 w-3 rounded-full", v >= 5 ? "bg-app-green" : v >= 4 ? "bg-app-green/60" : v >= 3 ? "bg-app-yellow" : "bg-app-red")} title={`${v}/5`} />;
  return (
    <div className="font-sans">
      <PageHeader title="Competition matrix" sub="Harvey-ball view across evaluation criteria. Green = strong, red = weak." />
      <Card className="overflow-hidden"><Table head={["Competitor", ...crit.map((c) => c[0]), "Total"]}>
        <tr className="bg-app-panel-2"><td className="px-3 py-2 font-semibold text-app-accent">Us</td>{crit.map((c) => <td key={c[1]} className="px-3 py-2">{dot(us[c[1]])} <span className="ml-1 text-xs text-app-muted">{us[c[1]]}</span></td>)}<td className="px-3 py-2 text-app-text">{us.capability + us.pricing + us.track}</td></tr>
        {competitors.map((c) => <tr key={c.id}><td className="px-3 py-2 text-app-text">{c.name}</td>{crit.map((k) => <td key={k[1]} className="px-3 py-2">{dot(c[k[1]])} <span className="ml-1 text-xs text-app-muted">{c[k[1]]}</span></td>)}<td className="px-3 py-2 text-app-text">{c.capability + c.pricing + c.track}</td></tr>)}
      </Table></Card>
    </div>
  );
}
