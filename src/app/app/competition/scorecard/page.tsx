"use client";
import { PageHeader, Card, Label, ProgressBar } from "@/components/ui";
import { useScopedStore } from "@/store/useStore";

export default function Scorecard() {
  const { competitors } = useScopedStore();
  const weights = { capability: 0.4, pricing: 0.4, track: 0.2 };
  const score = (c: { capability: number; pricing: number; track: number }) => Math.round(((c.capability * weights.capability + c.pricing * weights.pricing + c.track * weights.track) / 5) * 100);
  const all = [{ id: "us", name: "Us", capability: 4, pricing: 4, track: 4 }, ...competitors].map((c) => ({ ...c, s: score(c) })).sort((a, b) => b.s - a.s);
  return (
    <div className="font-sans">
      <PageHeader title="Scorecard" sub="Weighted win-probability proxy: capability 40% · pricing 40% · track record 20%." />
      <div className="space-y-2">{all.map((c, i) => <Card key={c.id} className="flex items-center gap-4 px-4 py-3"><span className="w-6 font-display text-xl text-app-muted">{i + 1}</span><div className="flex-1"><div className="flex justify-between text-[13px]"><span className={c.id === "us" ? "text-app-accent" : "text-app-text"}>{c.name}</span><span className="text-app-muted">{c.s}</span></div><ProgressBar value={c.s} tone={c.id === "us" ? "accent" : "green"} className="mt-1.5" /></div></Card>)}</div>
      <Label className="mt-4">Adjust individual scores under Competition → Profiles.</Label>
    </div>
  );
}
