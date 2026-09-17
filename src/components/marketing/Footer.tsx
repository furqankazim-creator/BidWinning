import Link from "next/link";
import { brand } from "@/config/brand";

export function Footer() {
  return (
    <footer className="bg-navy text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <span className="flex h-10 w-10 items-center justify-center border border-cream/40 font-display text-xl">{brand.logoLetter}</span>
            <p className="eyebrow mt-4 text-cream/60">{brand.tagline}</p>
            <a href="https://x.com" className="mt-2 inline-block text-sm text-cream/60 hover:text-cream">{brand.handle}</a>
          </div>
          <div>
            <p className="font-display text-2xl">Build a winning strategy.</p>
            <p className="mt-2 text-cream/60">CRM · Tender Intelligence · Compliance · Bid Production · ERP</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-cream/70 md:items-end">
            <Link href="/pricing" className="hover:text-cream">Pricing</Link>
            <Link href="/refund" className="hover:text-cream">Refund Policy</Link>
            <Link href="/privacy" className="hover:text-cream">Privacy Policy</Link>
            <Link href="/dpa" className="hover:text-cream">DPA</Link>
            <Link href="/terms" className="hover:text-cream">Terms of Service</Link>
            <a href={`mailto:${brand.email}`} className="hover:text-cream">{brand.email}</a>
          </div>
        </div>
        <p className="mt-12 text-xs text-cream/40">© {new Date().getFullYear()} {brand.company}. All rights reserved.</p>
      </div>
    </footer>
  );
}
