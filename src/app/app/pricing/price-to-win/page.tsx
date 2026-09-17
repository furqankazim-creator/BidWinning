"use client";
import { useState } from "react";
import { PageHeader, Card, Label, Input, Field } from "@/components/ui";
import { useScopedStore, fmtMoney } from "@/store/useStore";
import { totals } from "@/lib/pricing";

export default function PriceToWin() {
  const { costLines, margin, competitors } = useScopedStore();
  const t = totals(costLines, margin);
  const [market, setMarket] = useState({ low: Math.round(t.cost * 1.04), mid: Math.round(t.cost * 1.12), high: Math.round(t.cost * 1.22) });
  const est = competitors.map((c) => ({ ...c, est: t.cost * (1 + (0.22 - c.pricing * 0.035)) })).sort((a, b) => a.est - b.est);
  const ptw = Math.min(est[0]?.est ?? t.price, market.mid) * 0.985;
  const W = 900, H = 120; const lo = Math.min(t.cost, market.low, ...est.map((e) => e.est)) * 0.97, hi = Math.max(t.price, market.high, ...est.map((e) => e.est)) * 1.03;
  const x = (v: number) => 20 + ((v - lo) / (hi - lo)) * (W - 40);
  return (
    <div className="font-sans">
      <PageHeader title="Price-to-win" sub="Where your price lands against market day-rates, historical awards and estimated competitor positions." />
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4"><Label>Your cost</Label><p className="mt-1 font-display text-xl text-app-text">{fmtMoney(t.cost)}</p></Card>
        <Card className="p-4"><Label>Your price ({margin}%)</Label><p className="mt-1 font-display text-xl text-app-text">{fmtMoney(t.price)}</p></Card>
        <Card className="border-app-accent/50 p-4"><Label>Price-to-win</Label><p className="mt-1 font-display text-xl text-app-accent">{fmtMoney(ptw)}</p><p className="text-[11px] text-app-dim">implied margin {(((ptw - t.cost) / ptw) * 100).toFixed(1)}%</p></Card>
        <Card className="p-4"><Label>Gap</Label><p className={`mt-1 font-display text-xl ${t.price > ptw ? "text-app-red" : "text-app-green"}`}>{t.price > ptw ? "+" : ""}{(((t.price - ptw) / ptw) * 100).toFixed(1)}%</p></Card>
      </div>
      <Card className="mt-4 p-4"><svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <rect x={x(market.low)} width={x(market.high) - x(market.low)} y={40} height={20} fill="#5b93c4" opacity="0.25" /><text x={x(market.low)} y={34} fontSize="10" fill="#5b93c4" fontFamily="monospace">market range</text>
        {est.map((e) => <g key={e.id}><line x1={x(e.est)} x2={x(e.est)} y1={40} y2={60} stroke="#8a877f" /><text x={x(e.est)} y={78} fontSize="9" fill="#8a877f" textAnchor="middle" fontFamily="monospace">{e.name}</text></g>)}
        <line x1={x(t.price)} x2={x(t.price)} y1={30} y2={70} stroke="#ece7dd" strokeWidth="2" /><text x={x(t.price)} y={96} fontSize="10" fill="#ece7dd" textAnchor="middle" fontFamily="monospace">you</text>
        <line x1={x(ptw)} x2={x(ptw)} y1={30} y2={70} stroke="#c8772e" strokeWidth="2" strokeDasharray="4 3" /><text x={x(ptw)} y={112} fontSize="10" fill="#c8772e" textAnchor="middle" fontFamily="monospace">PTW</text>
      </svg></Card>
      <Card className="mt-4 grid gap-3 p-4 md:grid-cols-3">
        <Field label="Market low (historical award)"><Input type="number" className="w-full" value={market.low} onChange={(e) => setMarket({ ...market, low: +e.target.value })} /></Field>
        <Field label="Market mid"><Input type="number" className="w-full" value={market.mid} onChange={(e) => setMarket({ ...market, mid: +e.target.value })} /></Field>
        <Field label="Market high"><Input type="number" className="w-full" value={market.high} onChange={(e) => setMarket({ ...market, high: +e.target.value })} /></Field>
      </Card>
    </div>
  );
}
