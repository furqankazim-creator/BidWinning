"use client";
import { useEffect, useState } from "react";
import { useUI } from "./ui-state";
import { ChatPanel } from "./ChatPanel";

// Client-only wrapper: waits for the persisted store to hydrate to avoid SSR/localStorage mismatch,
// and swaps the main content for the agent chat when the sidebar is in Chat mode.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { mode } = useUI();
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return <main className="flex-1 bg-app-bg" />;
  return <main className="app-scroll flex-1 overflow-y-auto bg-app-bg">{mode === "chat" ? <ChatPanel /> : <div className="fade-up mx-auto max-w-[1400px] px-6 py-6">{children}</div>}</main>;
}
