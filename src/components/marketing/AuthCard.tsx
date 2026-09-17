"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { brand } from "@/config/brand";

export function AuthCard({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock session; swap for a real auth provider later.
    localStorage.setItem("vq.session", JSON.stringify({ email, name: name || email.split("@")[0], at: Date.now() }));
    router.push("/app");
  };
  const field = "w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink";
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md border border-line bg-white/60 p-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center border border-ink font-display text-lg">{brand.logoLetter}</span>
          <span className="eyebrow">{brand.company.toUpperCase()}</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl">{mode === "sign-in" ? "Welcome back." : "Start your 3-day trial."}</h1>
        <p className="mt-2 text-sm text-muted">{mode === "sign-in" ? `Sign in to your ${brand.company} workspace.` : "No charge until the trial ends. Cancel anytime."}</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "sign-up" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={field} />}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" className={field} />
          <input required type="password" placeholder="Password" className={field} />
          <button className="w-full rounded-sm bg-navy py-2.5 text-sm text-cream hover:bg-ink">{mode === "sign-in" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="mt-6 text-sm text-muted">
          {mode === "sign-in" ? <>No account? <Link href="/sign-up" className="text-accent underline">Start free</Link></> : <>Already have an account? <Link href="/sign-in" className="text-accent underline">Sign in</Link></>}
        </p>
      </div>
    </div>
  );
}
