import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { Hero } from "@/components/marketing/Hero";
import { Section, Eyebrow, NumberedCard } from "@/components/marketing/Section";
import { DemoForm } from "@/components/marketing/Forms";
import { howItWorks, modules, landingIndustries } from "@/lib/marketing-data";
import { brand } from "@/config/brand";

export default function Home() {
  return (
    <>
      <Hero />

      <Section dark>
        <Eyebrow>HOW IT WORKS</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">One lifecycle. From discovery to lessons learned.</h2>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((h, i) => <NumberedCard key={h.n} dark n={h.n} title={h.title} body={h.body} delay={(i % 4) + 1} />)}
        </div>
      </Section>

      <Section>
        <Eyebrow>INDUSTRIES</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">Industry-agnostic at the core. Specialised through templates.</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">Each industry template configures services, compliance requirements, document types, risk and cost categories, engineering sections and proposal structure. Adding a new industry never requires rewriting the platform.</p>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {landingIndustries.map(([icon, name, body], i) => <Link key={name} href="/industries" data-delay={String((i % 5) + 1)} className="reveal card-lift group rounded-lg border border-line bg-white/60 p-4"><span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-xl">{icon}</span><p className="mt-3 font-display text-lg group-hover:text-accent">{name}</p><p className="mt-1 text-xs leading-relaxed text-muted">{body}</p></Link>)}
        </div>
      </Section>

      <Section dark>
        <Eyebrow>THE PLATFORM</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">CRM · Tender Intelligence · Compliance · Bid Production · ERP</h2>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => <NumberedCard key={m.n} dark {...m} delay={(i % 3) + 1} />)}
        </div>
        <Link href="/platform" className="mt-10 inline-flex items-center gap-2 text-accent hover:underline">Explore the full platform <ArrowRight size={16} /></Link>
      </Section>

      <Section>
        <div className="reveal grid gap-6 md:grid-cols-3">
          {[["We stopped losing bids to missed clauses. Every AI finding points at the page.", "Head of Tendering, infrastructure contractor"], ["Go / No-Go used to be a meeting. Now it is a scorecard with a reason on file.", "Commercial Director, EPC"], ["One workspace per RFP, from CRM to submission. Our Excel sprawl is gone.", "Bid Manager, IT services"]].map(([q, who], i) => (
            <figure key={who} data-delay={String(i + 1)} className="reveal card-lift rounded-xl border border-line bg-white/50 p-6 dark-card"><Quote size={18} className="text-accent" /><blockquote className="mt-3 font-display text-xl leading-snug">{q}</blockquote><figcaption className="mt-4 text-xs uppercase tracking-wider text-muted">{who}</figcaption></figure>
          ))}
        </div>
        <div className="reveal mt-16 overflow-hidden rounded-2xl bg-navy p-10 text-cream md:p-14" style={{ backgroundImage: "radial-gradient(ellipse at 20% 0%, color-mix(in oklab, var(--bravo-accent) 55%, transparent), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(91,147,196,.45), transparent 55%)" }}>
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div><p className="eyebrow text-cream/70">START IN MINUTES</p><h2 className="mt-3 font-display text-4xl md:text-5xl">Your next tender, analysed before lunch.</h2><p className="mt-4 max-w-xl text-cream/75">Upload the RFP. Get cited requirements, a compliance check against your capabilities and a Go / No-Go scorecard — then build the bid in the same workspace.</p></div>
            <div className="flex flex-col gap-3 md:items-end"><Link href="/sign-up" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-white transition-transform hover:scale-[1.03]">Start free, 3 days <ArrowRight size={16} /></Link><Link href="/pricing" className="text-sm text-cream/80 hover:text-cream">See pricing →</Link></div>
          </div>
        </div>
      </Section>

      <Section>
        <div id="demo" className="reveal grid gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>REQUEST A DEMO</Eyebrow>
            <h2 className="mt-4 font-display text-4xl">See {brand.company} on your own tender.</h2>
            <p className="mt-4 text-muted">Bring an RFP, RFQ or ITT from your industry. We&apos;ll walk you from upload to a cited requirement list, a compliance check and a scored Go / No-Go in one session.</p>
            <ul className="mt-6 space-y-2 text-sm text-muted"><li>• Built for government contractors, construction companies, manufacturers, engineering and technology companies.</li><li>• Multi-tenant, role-based, fully audited.</li><li>• AI that shows its sources and waits for a human.</li></ul>
          </div>
          <DemoForm />
        </div>
      </Section>
    </>
  );
}
