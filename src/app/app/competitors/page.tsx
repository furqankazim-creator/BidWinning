"use client";
import { useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, Badge, Button, Input, Textarea, Label, PageHeader, Select } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { useIndustries } from "@/lib/useIndustries";

export default function Competitors() {
  const s = useStore(); const industries = useIndustries();
  const [name, setName] = useState("");
  const list = s.companies.filter((c) => c.type === "Competitor");
  const intel = s.competitors;
  return (
    <div className="font-sans">
      <PageHeader title="Competitor intelligence" sub="Profiles are records with sources, confidence and dates. Where information is unavailable the system says so — nothing is fabricated." right={<form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name) { s.addCompany({ name, type: "Competitor" }); s.addCompetitor(name); } setName(""); }}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Competitor name" /><Button variant="outline"><Plus size={13} /> Add</Button></form>} />
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((c) => { const ci = intel.find((x) => x.name === c.name); const bids = s.opportunities.filter((o) => o.competitors.includes(c.name)); const results = s.bidResults.filter((r) => r.competitor === c.name); return (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between"><div><h2 className="text-[15px] font-semibold text-app-text">{c.name}</h2><p className="text-xs text-app-muted">{industries.find((i) => i.id === c.industry)?.name} · {c.country || c.region}</p></div><button onClick={() => { s.deleteCompany(c.id); if (ci) s.deleteCompetitor(ci.id); }} className="text-app-dim hover:text-app-red"><Trash2 size={13} /></button></div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div><Label>Industry</Label><Select className="mt-1 w-full py-1" value={c.industry} onChange={(e) => s.updateCompany(c.id, { industry: e.target.value })}>{industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></div>
              <div><Label>Markets / capabilities</Label><Input className="mt-1 w-full py-1" value={c.services.join(", ")} onChange={(e) => s.updateCompany(c.id, { services: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div>
              <div><Label>Known clients</Label><Input className="mt-1 w-full py-1" value={c.certifications.join(", ")} onChange={(e) => s.updateCompany(c.id, { certifications: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="verified only" /></div>
              <div><Label>Encountered in</Label><p className="mt-1 text-app-text">{bids.length} opportunities · {results.filter((r) => r.status === "Rejected").length} wins against us</p></div>
            </div>
            <Label className="mt-3">Strengths / weaknesses / pricing intelligence</Label>
            <Textarea className="mt-1 w-full min-h-[70px]" value={c.notes} onChange={(e) => s.updateCompany(c.id, { notes: e.target.value })} placeholder="Record source, date and confidence with every claim." />
            {ci ? <div className="mt-2 flex flex-wrap gap-1.5"><Badge tone="outline">Capability {ci.capability}/5</Badge><Badge tone="outline">Pricing posture {ci.pricing}/5</Badge><Badge tone="outline">Track record {ci.track}/5</Badge><Badge tone="yellow">Source: internal assessment · confidence medium</Badge></div>
              : <p className="mt-2 flex items-center gap-1 text-[11px] text-app-dim"><AlertCircle size={11} /> Insufficient verified information for scoring.</p>}
          </Card>
        ); })}
      </div>
      <p className="mt-4 text-xs text-app-dim">Tender-specific scoring, matrix and scorecards live in the active workspace under Competition.</p>
    </div>
  );
}
