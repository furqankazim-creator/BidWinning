"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, PanelLeftClose, PanelLeftOpen, Settings, LayoutPanelLeft, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { brand } from "@/config/brand";
import { useScopedStore } from "@/store/useStore";
import { buildNav, type NavItem } from "./nav";
import { agents } from "@/store/seed";
import { useUI } from "./ui-state";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed, setPalette, setSettings, mode, setMode, agent, setAgent } = useUI();
  const { tenders, activeTenderId, setActiveTender, clarifications, clauses, deliverables, inquiries, approvals, reviews } = useScopedStore();
  const counts = { clarifications: clarifications.filter((c) => c.pending || c.status === "Draft").length, contract: clauses.filter((c) => c.pending || c.status === "Pending").length + 1, deliverables: deliverables.length, inquiries: inquiries.filter((i) => i.status === "New").length, approvals: approvals.filter((a) => a.status === "Pending").length, reviews: reviews.filter((r) => r.tenderId === activeTenderId && r.status === "Pending").length };
  const groups = buildNav(activeTenderId);
  const activeTender = tenders.find((t) => t.id === activeTenderId);

  return (
    <aside className={cn("flex h-screen shrink-0 flex-col border-r border-app-border bg-app-bg font-sans transition-[width] duration-200", collapsed ? "w-14" : "w-[258px]")}>
      {/* Workspace / Chat switch */}
      <div className="p-3">
        <div className="flex rounded border border-app-border bg-app-panel p-1">
          <button onClick={() => setMode("workspace")} className={cn("flex flex-1 items-center justify-center gap-2 rounded-sm py-1.5 text-xs", mode === "workspace" ? "bg-app-panel-2 text-app-text" : "text-app-muted hover:text-app-text")}><LayoutPanelLeft size={13} />{!collapsed && "Workspace"}</button>
          <button onClick={() => setMode("chat")} className={cn("flex flex-1 items-center justify-center gap-2 rounded-sm py-1.5 text-xs", mode === "chat" ? "bg-app-panel-2 text-app-text" : "text-app-muted hover:text-app-text")}><MessageCircle size={13} />{!collapsed && "Chat"}</button>
        </div>
      </div>

      {mode === "chat" ? (
        <div className="app-scroll flex-1 overflow-y-auto px-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-app-dim">Conversations</p>
          <p className="mb-3 truncate text-xs text-app-muted">{tenders.find((t) => t.id === activeTenderId)?.name}</p>
          {agents.map((a) => (
            <button key={a.id} onClick={() => setAgent(a.id)} className={cn("mb-1 flex w-full items-start gap-2 rounded px-2 py-2 text-left", agent === a.id ? "bg-app-panel-2" : "hover:bg-app-panel")}>
              <span className="text-lg leading-5">{a.emoji}</span>
              {!collapsed && <span><span className={cn("block text-[13px]", agent === a.id ? "text-app-accent" : "text-app-text")}>{a.name}</span><span className="block text-[11px] text-app-dim">{a.sub}</span></span>}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-2">
            <Link href="/app" className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center border border-app-accent font-display text-sm text-app-accent">{brand.logoLetter}</span>
              {!collapsed && <span className="font-display text-[15px] font-semibold text-app-text">{brand.company}</span>}
            </Link>
            <button onClick={() => setCollapsed(!collapsed)} className="text-app-dim hover:text-app-text">{collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}</button>
          </div>

          {!collapsed && (
            <div className="space-y-2 px-3 py-2">
              <button onClick={() => setPalette(true)} className="flex w-full items-center justify-between rounded border border-app-border bg-app-panel px-3 py-2 text-xs text-app-muted hover:border-app-border-2">
                <span className="flex items-center gap-2"><Plus size={13} /> Create or find</span>
                <kbd className="rounded border border-app-border px-1 font-mono text-[10px]">Ctrl K</kbd>
              </button>
              <div className="relative">
                <select value={activeTenderId} onChange={(e) => setActiveTender(e.target.value)} className="w-full appearance-none rounded border border-app-border bg-app-panel px-3 py-2 pr-8 text-xs font-semibold text-app-text outline-none">
                  {tenders.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  {tenders.length === 0 && <option value="">No tender</option>}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-app-muted" />
              </div>
            </div>
          )}

          <nav className="app-scroll flex-1 overflow-y-auto px-3 pb-3">
            {groups.map((g, gi) => (
              <div key={g.label || gi}>
                {!collapsed && g.label && <p className="mb-1 mt-5 truncate px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-app-dim" title={g.label === "Active Workspace" ? activeTender?.name : undefined}>{g.label === "Active Workspace" && activeTender ? `Workspace · ${activeTender.reference || activeTender.name}` : g.label}</p>}
                <div className="space-y-0.5">{g.items.map((n) => <NavRow key={n.href} item={n} pathname={pathname} collapsed={collapsed} count={n.countKey ? counts[n.countKey] : undefined} />)}</div>
              </div>
            ))}
          </nav>
        </>
      )}

      <button onClick={() => setSettings(true)} className="flex items-center justify-between border-t border-app-border px-4 py-3 text-[13px] text-app-text hover:bg-app-panel">
        <span className="flex items-center gap-3"><Settings size={15} className="text-app-muted" />{!collapsed && "Settings"}</span>
        {!collapsed && <ChevronRight size={13} className="text-app-dim" />}
      </button>
    </aside>
  );
}

function NavRow({ item, pathname, collapsed, count }: { item: NavItem; pathname: string; collapsed: boolean; count?: number }) {
  const active = item.href === "/app" ? pathname === "/app" : /\/app\/tenders\/[^/]+$/.test(item.href) ? pathname === item.href : pathname.startsWith(item.href) && !(item.href === "/app/tenders" && /\/app\/tenders\/./.test(pathname));
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <div>
      <div className={cn("group flex items-center rounded", active && !item.children ? "bg-app-panel-2" : "hover:bg-app-panel")}>
        <Link href={item.href} className={cn("flex flex-1 items-center gap-3 px-2 py-1.5 text-[13px]", active ? "text-app-text" : "text-app-text/85")} title={item.label}>
          {Icon && <Icon size={15} className={cn(active ? "text-app-accent" : "text-app-muted")} />}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
        {!collapsed && !!count && <span className="rounded-sm border border-app-accent/40 px-1 font-mono text-[10px] text-app-accent">{count}</span>}
        {!collapsed && item.children && <button onClick={() => setOpen(!open)} className="px-2 py-1.5 text-app-dim hover:text-app-text">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button>}
      </div>
      {!collapsed && item.children && open && (
        <div className="ml-[15px] border-l border-app-border">
          {item.children.map((c) => {
            const a = pathname === c.href;
            return (
              <Link key={c.href} href={c.href} className={cn("relative ml-3 flex items-center gap-2 py-1.5 pl-3 text-[13px]", a ? "text-app-accent" : "text-app-muted hover:text-app-text")}>
                <span className={cn("absolute -left-[19px] h-1.5 w-1.5 rounded-full", a ? "bg-app-accent" : "bg-app-border-2")} />
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
