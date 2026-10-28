import { Database, Gauge, Building2, Users, Kanban, Inbox, Layers, Handshake, BadgeCheck, LayoutGrid, FileText, Sparkles, ListChecks, ShieldCheck, MessageSquare, ShieldAlert, Scale, AlertTriangle, DraftingCompass, CheckSquare, Coins, SlidersHorizontal, Swords, FileSignature, Receipt, ClipboardCheck, Stamp, Presentation, Upload, Trophy, RotateCcw, FileBadge, FolderKanban, BarChart3, BookOpen, Factory, UserCog, History, Bot, type LucideIcon } from "lucide-react";

export interface NavItem { label: string; href: string; icon?: LucideIcon; countKey?: "clarifications" | "contract" | "deliverables" | "inquiries" | "approvals" | "reviews"; children?: { label: string; href: string }[]; }
export interface NavGroup { label?: string; items: NavItem[]; }

/** Navigation is built per active tender so tender-scoped routes carry the id. */
export function buildNav(tid: string): NavGroup[] {
  const w = (p: string) => `/app/tenders/${tid}${p}`;
  return [
    { items: [{ label: "Dashboard", href: "/app", icon: Gauge }] },
    { label: "CRM", items: [
      { label: "Companies", href: "/app/companies", icon: Building2 },
      { label: "Contacts", href: "/app/contacts", icon: Users },
      { label: "Opportunities", href: "/app/opportunities", icon: Kanban },
      { label: "Inquiries", href: "/app/inquiries", icon: Inbox, countKey: "inquiries" },
    ] },
    { label: "Tender Intelligence", items: [
      { label: "Tender Workspaces", href: "/app/tenders", icon: Layers },
      { label: "Vendors & Partners", href: "/app/vendors", icon: Handshake },
      { label: "Our Capabilities", href: "/app/capabilities", icon: BadgeCheck },
    ] },
    { label: "Active Workspace", items: [
      { label: "Overview", href: w(""), icon: LayoutGrid },
      { label: "Action Board", href: "/app/board", icon: Kanban },
      { label: "Documents", href: "/app/documents", icon: FileText },
      { label: "AI Analysis", href: w("/ai-analysis"), icon: Sparkles },
      { label: "Requirements", href: w("/requirements"), icon: ListChecks },
      { label: "Compliance", href: w("/compliance"), icon: ShieldCheck },
      { label: "Go / No-Go", href: w("/go-no-go"), icon: Scale },
      { label: "Technical Proposal", href: w("/technical"), icon: FileSignature },
      { label: "Pricing", href: w("/pricing"), icon: SlidersHorizontal },
    ] },
    { label: "Intelligence", items: [
      { label: "Reports & Analytics", href: "/app/reports", icon: BarChart3 },
      { label: "Knowledge Base", href: "/app/knowledge", icon: BookOpen },
      { label: "Master Library", href: "/app/master-library", icon: BookOpen },
      { label: "Local Database", href: "/app/database", icon: Database },
    ] },
    { label: "Administration", items: [
      { label: "Industry Templates", href: "/app/admin/templates", icon: Factory },
      { label: "Users & Roles", href: "/app/admin/users", icon: UserCog },
      { label: "Audit Trail", href: "/app/admin/audit", icon: History },
      { label: "AI Governance", href: "/app/admin/ai", icon: Bot },
    ] },
  ];
}

export function allPagesFor(tid: string) {
  return buildNav(tid).flatMap((g) => g.items.flatMap((n) => [{ label: n.label, href: n.href }, ...(n.children || []).map((c) => ({ label: `${n.label} · ${c.label}`, href: c.href }))]));
}

