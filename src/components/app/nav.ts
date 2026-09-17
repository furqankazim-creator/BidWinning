import { Gauge, Building2, Users, Kanban, Inbox, Layers, Handshake, Target, BadgeCheck, LayoutGrid, FileText, Sparkles, ListChecks, ShieldCheck, MessageSquare, ShieldAlert, Scale, ShoppingCart, AlertTriangle, DraftingCompass, CheckSquare, Coins, SlidersHorizontal, Swords, FileSignature, Receipt, ClipboardCheck, Stamp, Presentation, Upload, Trophy, RotateCcw, FileBadge, FolderKanban, BarChart3, BookOpen, Factory, UserCog, History, Bot, type LucideIcon } from "lucide-react";

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
      { label: "Competitors", href: "/app/competitors", icon: Target },
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
      { label: "Setup & Milestones", href: "/app/setup", icon: FileBadge },
      { label: "Clarifications", href: "/app/clarifications", icon: MessageSquare, countKey: "clarifications", children: [{ label: "Clarification Register", href: "/app/clarifications/register" }, { label: "Latest", href: "/app/clarifications/latest" }] },
      { label: "Contract Analysis", href: "/app/contract", icon: ShieldAlert, countKey: "contract", children: [{ label: "Contract Register", href: "/app/contract/register" }, { label: "Qualifications", href: "/app/contract/qualifications" }] },
      { label: "Risks & Opportunities", href: "/app/risks", icon: AlertTriangle, children: [{ label: "Risk register", href: "/app/risks/register" }, { label: "5×5 Matrix", href: "/app/risks/matrix" }, { label: "Contingency", href: "/app/risks/contingency" }, { label: "Guide", href: "/app/risks/guide" }] },
      { label: "Engineering", href: w("/engineering"), icon: DraftingCompass },
      { label: "Procurement", href: "/app/procurement", icon: ShoppingCart, children: [{ label: "Proposals", href: "/app/procurement/proposals" }, { label: "Tabulation", href: "/app/procurement/tabulation" }, { label: "Evaluate & Rank", href: "/app/procurement/evaluate" }, { label: "Benchmark", href: "/app/procurement/benchmark" }] },
      { label: "Costing", href: "/app/cost-summary", icon: Coins, children: [{ label: "Cost Summary", href: "/app/cost-summary" }, { label: "Price build-up", href: "/app/pricing/build-up" }, { label: "Milestones", href: "/app/pricing/milestones" }, { label: "Cashflow", href: "/app/pricing/cashflow" }] },
      { label: "Pricing", href: w("/pricing"), icon: SlidersHorizontal, children: [{ label: "Price versions", href: w("/pricing") }, { label: "Price-to-win", href: "/app/pricing/price-to-win" }] },
      { label: "Competition", href: "/app/competition", icon: Swords, children: [{ label: "Profiles", href: "/app/competition/profiles" }, { label: "Matrix", href: "/app/competition/matrix" }, { label: "Vessel chart", href: "/app/competition/vessel-chart" }, { label: "Scorecard", href: "/app/competition/scorecard" }] },
      { label: "Technical Proposal", href: w("/technical"), icon: FileSignature },
      { label: "Commercial Proposal", href: w("/commercial"), icon: Receipt },
      { label: "Deliverables", href: "/app/deliverables", icon: CheckSquare, countKey: "deliverables", children: [{ label: "Commercial", href: "/app/deliverables/commercial" }, { label: "Technical", href: "/app/deliverables/technical" }] },
      { label: "Reviews", href: w("/reviews"), icon: ClipboardCheck, countKey: "reviews" },
      { label: "Presentations", href: "/app/presentations", icon: Presentation, children: [{ label: "Tender Overview", href: "/app/presentations/tender-overview" }, { label: "Technical Overview", href: "/app/presentations/technical-overview" }, { label: "Approval", href: "/app/presentations/approval" }, { label: "Competitive Intelligence", href: "/app/presentations/competitive-intelligence" }] },
      { label: "Submission", href: "/app/submission", icon: Upload },
      { label: "Result", href: w("/result"), icon: Trophy },
      { label: "Lessons Learned", href: "/app/lessons-learned", icon: RotateCcw },
    ] },
    { label: "Governance", items: [
      { label: "Approvals", href: "/app/approvals", icon: Stamp, countKey: "approvals" },
    ] },
    { label: "ERP", items: [
      { label: "Contracts", href: "/app/contracts", icon: FileBadge },
      { label: "Projects", href: "/app/projects", icon: FolderKanban },
    ] },
    { label: "Intelligence", items: [
      { label: "Reports & Analytics", href: "/app/reports", icon: BarChart3 },
      { label: "Knowledge Base", href: "/app/knowledge", icon: BookOpen },
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
