"use client";
import { Deck } from "@/components/app/Deck";
import { useScopedStore } from "@/store/useStore";
export default function Page() {
  const { competitors } = useScopedStore();
  return <Deck title="Competitive Intelligence" sub="Who else is bidding and how we win." slides={[
    { title: "Competitive field", bullets: competitors.map((c) => `${c.name} — capability ${c.capability}/5, pricing ${c.pricing}/5`) },
    { title: "Intelligence notes", bullets: competitors.map((c) => `${c.name}: ${c.note}`) },
    { title: "Win themes", bullets: ["Local content above 30% via St. John's fabrication", "Proven cold-water track record (Terra Nova, Hebron)", "Price-to-win positioned below incumbent"] },
  ]} />;
}
