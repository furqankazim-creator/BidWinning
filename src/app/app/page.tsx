"use client";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, Label, SectionTitle, Badge } from "@/components/ui";
import { BarChart, Donut, Kpi, money, ColumnChart, AreaChart } from "@/components/app/charts";
import { useStore, filterByIndustry, daysLeft, tenderHealth } from "@/store/useStore";
import { useIndustries } from "@/lib/useIndustries";
import { cn } from "@/lib/cn";

const stageOrder = ["Lead", "Prospect", "Qualified", "Opportunity", "Tender", "Bid", "Won", "Lost"];
function cumulative(opps: { createdAt: string; value: number }[]) {
  const byMonth = new Map<string, number>();
  [...opps].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((o) => { const k = o.createdAt.slice(0, 7); byMonth.set(k, (byMonth.get(k) || 0) + o.value); });
  let acc = 0; return Array.from(byMonth.entries()).map(([k, v]) => { acc += v; const d = new Date(k + "-01"); return { label: d.toLocaleDateString("en", { month: "short", year: "2-digit" }), value: acc }; });
}
function forecast(opps: { expectedAward: string; value: number; probability: number; stage: string }[]) {
  const q = new Map<string, number>();
  opps.filter((o) => o.expectedAward && o.stage !== "Lost").forEach((o) => { const d = new Date(o.expectedAward); const k = `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`; q.set(k, (q.get(k) || 0) + o.value * o.probability / 100); });
  return Array.from(q.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ label: k.slice(5) + " " + k.slice(2, 4), value: Math.round(v) }));
}

export default function Dashboard() {
  const s = useStore();
  const industries = useIndustries();
  const iname = (id: string) => industries.find((i) => i.id === id)?.name || id;
  const tenders = filterByIndustry(s.tenders, s.industryFilter);
  const opps = filterByIndustry(s.opportunities, s.industryFilter);
  const open = tenders.filter((t) => t.status === "Active Campaign");
  const closingSoon = open.filter((t) => t.closing && daysLeft(t.closing) <= 60).sort((a, b) => a.closing.localeCompare(b.closing));
  const pipeline = opps.filter((o) => !["Won", "Lost"].includes(o.stage));
  const pipelineValue = pipeline.reduce((a, o) => a + o.value, 0);
  const weighted = pipeline.reduce((a, o) => a + o.value * (o.probability / 100), 0);
  const won = tenders.filter((t) => t.status === "Won").length, lost = tenders.filter((t) => t.status === "Lost").length;
  const aiPending = s.aiLog.filter((a) => a.reviewStatus === "Pending").length + s.requirements.filter((r) => r.status === "Needs Verification" && tenders.some((t) => t.id === r.tenderId)).length;
  const group = <X,>(arr: X[], key: (x: X) => string, val: (x: X) => number) => Object.entries(arr.reduce<Record<string, number>>((a, x) => { a[key(x)] = (a[key(x)] || 0) + val(x); return a; }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const byType = (k: string) => tenders.filter((t) => t.tenderType === k).length;

  return (
    <div className="font-sans">
      <div className="mb-5 flex items-end justify-between"><div><h1 className="font-display text-2xl text-app-text">Executive Dashboard</h1><p className="text-xs text-app-muted">{s.org.name} · {s.industryFilter === "all" ? "All industries" : iname(s.industryFilter)}</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Kpi label="Active opportunities" value={pipeline.length} delta={12} />
        <Kpi label="Active tenders" value={open.length} />
        <Kpi label="Closing ≤ 60 days" value={closingSoon.length} tone={closingSoon.length ? "yellow" : undefined} />
        <Kpi label="RFPs / RFQs" value={`${byType("RFP")} / ${byType("RFQ")}`} />
        <Kpi label="AI reviews pending" value={aiPending} tone={aiPending ? "accent" : undefined} />
        <Kpi label="Go / Cond. / No-Go" value={`${tenders.filter((t) => t.goNoGo === "GO").length} / ${tenders.filter((t) => t.goNoGo === "CONDITIONAL GO").length} / ${tenders.filter((t) => t.goNoGo === "NO-GO").length}`} />
        <Kpi label="Bids in preparation" value={tenders.filter((t) => ["Bid Preparation", "Review", "Approval"].includes(t.stage)).length} />
        <Kpi label="Submitted" value={tenders.filter((t) => ["Submitted", "Under Evaluation", "Clarification", "Negotiation"].includes(t.stage)).length} />
        <Kpi label="Won / Lost" value={`${won} / ${lost}`} tone="green" sub={won + lost ? `${Math.round((won / (won + lost)) * 100)}% win rate` : "no results yet"} />
        <Kpi label="Pipeline value" value={money(pipelineValue)} delta={8} />
        <Kpi label="Weighted pipeline" value={money(weighted)} tone="accent" />
        <Kpi label="Expected margin" value={`${s.margin}%`} sub={money(weighted * (s.margin / 100))} />
      </div>

      {/* Trend: cumulative pipeline value by month of creation, plus weighted forecast by expected-award quarter */}
      <div className="mt-5 grid gap-3 lg:grid-cols-[3fr_2fr]">
        <AreaChart title="Pipeline growth" sub="cumulative opportunity value by month created" data={cumulative(opps)} fmt={(n) => money(n)} />
        <ColumnChart title="Revenue forecast" data={forecast(opps)} fmt={(n) => money(n)} colorByIndex={false} accent="#c8772e" />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <BarChart title="Pipeline by industry" data={group(pipeline, (o) => iname(o.industry), (o) => o.value)} fmt={(n) => money(n)} showPct />
        <BarChart title="Pipeline by region" data={group(pipeline, (o) => o.region, (o) => o.value)} fmt={(n) => money(n)} showPct />
        <BarChart title="Pipeline by client" data={group(pipeline, (o) => s.companies.find((c) => c.id === o.companyId)?.name || "—", (o) => o.value)} fmt={(n) => money(n)} showPct />
        <ColumnChart title="Opportunities by stage" data={stageOrder.map((st) => ({ label: st, value: opps.filter((o) => o.stage === st).length })).filter((d) => d.value)} />
        <Donut title="Tenders by type" data={group(tenders, (t) => t.tenderType, () => 1)} sub="tenders" />
        <Donut title="Win / loss" data={[{ label: "Won", value: won }, { label: "Lost", value: lost }, { label: "Open", value: open.length }]} center={won + lost ? `${Math.round((won / (won + lost)) * 100)}%` : "—"} sub="win rate" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <SectionTitle right={<span className="flex items-center gap-1"><CalendarDays size={11} /> deadline calendar</span>}>Tender deadlines</SectionTitle>
          <Card className="divide-y divide-app-border">
            {open.filter((t) => t.closing).sort((a, b) => a.closing.localeCompare(b.closing)).map((t) => { const d = daysLeft(t.closing); return (
              <Link key={t.id} href={`/app/tenders/${t.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-app-panel-2">
                <div><p className="text-[13px] text-app-text">{t.name}</p><p className="text-[11px] text-app-muted">{t.client} · {iname(t.industry)} · {t.tenderType}</p></div>
                <div className="text-right"><p className={cn("font-mono text-xs", d <= 30 ? "text-app-red" : d <= 60 ? "text-app-yellow" : "text-app-muted")}>{d}d</p><p className="text-[10px] text-app-dim">{t.closing}</p></div>
              </Link>
            ); })}
            {open.length === 0 && <p className="px-4 py-6 text-xs text-app-dim">No active tenders in this view.</p>}
          </Card>
        </div>
        <div>
          <SectionTitle>Tender health</SectionTitle>
          <Card className="divide-y divide-app-border">
            {open.map((t) => { const h = tenderHealth(s, t.id); return (
              <Link key={t.id} href={`/app/tenders/${t.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-app-panel-2">
                <div><p className="text-[13px] text-app-text">{t.name}</p><div className="mt-1 flex gap-1.5"><Badge tone="outline">{t.stage}</Badge><Badge tone={t.goNoGo === "GO" ? "green" : t.goNoGo === "NO-GO" ? "red" : t.goNoGo === "CONDITIONAL GO" ? "yellow" : "outline"}>{t.goNoGo}</Badge></div></div>
                <span className={cn("font-display text-2xl", h.score >= 70 ? "text-app-green" : h.score >= 40 ? "text-app-yellow" : "text-app-red")}>{h.score}</span>
              </Link>
            ); })}
          </Card>
        </div>
      </div>
      <div className="mt-6"><Label>Industry performance</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{group(s.opportunities, (o) => o.industry, () => 1).map((g) => { const its = s.opportunities.filter((o) => o.industry === g.label); const w = its.filter((o) => o.stage === "Won").length; return <Card key={g.label} className="p-3"><p className="text-[13px] text-app-text">{iname(g.label)}</p><p className="text-[11px] text-app-muted">{its.length} opportunities · {money(its.reduce((a, o) => a + o.value, 0))} · {w} won</p></Card>; })}</div>
      </div>
    </div>
  );
}
