"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Card, Button, Input, Select, Textarea, Label, Badge } from "@/components/ui";
import { useScopedStore } from "@/store/useStore";

const Score = ({ v, onChange }: { v: number; onChange: (n: number) => void }) => <Select className="py-0.5 text-xs" value={v} onChange={(e) => onChange(+e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select>;

export default function Profiles() {
  const { competitors, updateCompetitor, addCompetitor, deleteCompetitor } = useScopedStore();
  const [name, setName] = useState("");
  return (
    <div className="font-sans">
      <PageHeader title="Competitor profiles" sub="Known competitors scored by capability, pricing posture and track record." right={<form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name) addCompetitor(name); setName(""); }}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Competitor name" /><Button variant="outline"><Plus size={13} /> Add</Button></form>} />
      <div className="grid gap-3 md:grid-cols-2">
        {competitors.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between"><h2 className="font-display text-lg text-app-text">{c.name}</h2><button onClick={() => deleteCompetitor(c.id)} className="text-app-dim hover:text-app-red"><Trash2 size={13} /></button></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([["Capability", "capability"], ["Pricing posture", "pricing"], ["Track record", "track"]] as const).map(([l, k]) => <div key={k}><Label>{l}</Label><div className="mt-1"><Score v={c[k]} onChange={(n) => updateCompetitor(c.id, { [k]: n })} /></div></div>)}
            </div>
            <Label className="mt-3">Vessels</Label>
            <div className="mt-1 flex flex-wrap gap-1">{c.vessels.map((v) => <Badge key={v}>{v}</Badge>)}<Input placeholder="+ vessel" className="w-28 py-0.5 text-xs" onKeyDown={(e) => { if (e.key === "Enter" && e.currentTarget.value) { updateCompetitor(c.id, { vessels: [...c.vessels, e.currentTarget.value] }); e.currentTarget.value = ""; } }} /></div>
            <Label className="mt-3">Intelligence note</Label>
            <Textarea className="mt-1 w-full min-h-[56px]" value={c.note} onChange={(e) => updateCompetitor(c.id, { note: e.target.value })} />
          </Card>
        ))}
      </div>
    </div>
  );
}
