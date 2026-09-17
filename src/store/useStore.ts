"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as seed from "./seed";
import * as seed2 from "./seed2";
import * as seed3 from "./seed3";
import { goNoGoCriteria, type IndustryTemplate } from "@/lib/industries";
import type * as T from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

interface State {
  tenders: T.Tender[]; activeTenderId: string;
  actions: T.ActionItem[]; projects: T.Project[]; vendors: T.Vendor[]; docs: T.Doc[];
  clarifications: T.Clarification[]; clauses: T.Clause[]; qualifications: T.Qualification[];
  risks: T.Risk[]; deliverables: T.Deliverable[]; costLines: T.CostLine[]; milestones: T.Milestone[];
  competitors: T.Competitor[]; lessons: T.Lesson[]; chat: T.ChatMsg[]; profile: T.Profile;
  margin: number; lastExtraction: string;
  industryFilter: string; setIndustryFilter: (id: string) => void;
  org: T.Org; users: T.User[]; currentUser: string;
  companies: T.Company[]; contacts: T.Contact[]; opportunities: T.Opportunity[]; activities: T.Activity[];
  requirements: T.Requirement[]; complianceItems: T.ComplianceItem[]; capabilities: T.Capability[]; aiSummaries: T.AISummary[];
  reviews: T.Review[]; approvals: T.Approval[]; priceVersions: T.PriceVersion[]; proposalSections: T.ProposalSection[]; bidResults: T.BidResult[];
  inquiries: T.Inquiry[]; contracts: T.Contract[]; auditLog: T.AuditEntry[]; aiLog: T.AILogEntry[]; notifications: T.Notification[];
  customIndustries: IndustryTemplate[];

  audit: (action: string, entity: string, entityId: string, detail: string) => void;
  logAI: (e: Omit<T.AILogEntry, "id" | "at" | "user">) => void;
  notify: (kind: string, text: string, href: string) => void; markRead: (id?: string) => void;
  addUser: (u: Omit<T.User, "id">) => void; updateUser: (id: string, p: Partial<T.User>) => void;
  addCompany: (c: Partial<T.Company> & { name: string }) => string; updateCompany: (id: string, p: Partial<T.Company>) => void; deleteCompany: (id: string) => void;
  addContact: (c: Omit<T.Contact, "id">) => void; updateContact: (id: string, p: Partial<T.Contact>) => void; deleteContact: (id: string) => void;
  addOpportunity: (o: Partial<T.Opportunity> & { name: string; companyId: string }) => string; updateOpportunity: (id: string, p: Partial<T.Opportunity>) => void; deleteOpportunity: (id: string) => void;
  convertOpportunityToTender: (id: string) => string;
  addActivity: (a: Omit<T.Activity, "id" | "at" | "by">) => void;
  addRequirement: (r: Partial<T.Requirement> & { tenderId: string; text: string }) => void; updateRequirement: (id: string, p: Partial<T.Requirement>) => void; deleteRequirement: (id: string) => void; extractRequirements: (tenderId: string) => void;
  addComplianceItem: (c: Partial<T.ComplianceItem> & { tenderId: string; item: string }) => void; updateComplianceItem: (id: string, p: Partial<T.ComplianceItem>) => void; deleteComplianceItem: (id: string) => void; applyComplianceTemplate: (tenderId: string, items: string[]) => void;
  addCapability: (c: Omit<T.Capability, "id">) => void; updateCapability: (id: string, p: Partial<T.Capability>) => void; deleteCapability: (id: string) => void;
  generateSummary: (tenderId: string) => void;
  setGoNoGo: (tenderId: string, scores: Record<string, number>, verdict: T.GoNoGo, reason: string) => void;
  addReview: (r: Omit<T.Review, "id" | "at">) => void; updateReview: (id: string, p: Partial<T.Review>) => void;
  requestApproval: (a: Omit<T.Approval, "id" | "at" | "status">) => void; decideApproval: (id: string, status: "Approved" | "Rejected", reason: string) => void;
  createPriceVersion: (tenderId: string, p: Omit<T.PriceVersion, "id" | "tenderId" | "version" | "locked" | "createdAt">) => void; lockPrice: (id: string) => void;
  addProposalSection: (s: Omit<T.ProposalSection, "id" | "order">) => void; updateProposalSection: (id: string, p: Partial<T.ProposalSection>) => void; deleteProposalSection: (id: string) => void; draftProposal: (tenderId: string, kind: "technical" | "commercial", titles: string[]) => void;
  setBidResult: (r: T.BidResult) => void;
  markInquiry: (id: string, status: T.Inquiry["status"], link?: { tenderId?: string; opportunityId?: string }) => void;
  createContract: (tenderId: string) => string; updateContract: (id: string, p: Partial<T.Contract>) => void;
  updateProject: (id: string, p: Partial<T.Project>) => void;
  addCustomIndustry: (i: State["customIndustries"][number]) => void; updateCustomIndustry: (id: string, p: Partial<State["customIndustries"][number]>) => void; deleteCustomIndustry: (id: string) => void;

  setActiveTender: (id: string) => void;
  addTender: (t: Partial<T.Tender> & { name: string }) => string;
  updateTender: (id: string, patch: Partial<T.Tender>) => void;
  deleteTender: (id: string) => void;
  convertToProject: (tenderId: string) => void;

  addAction: (title: string, agent: string) => void;
  moveAction: (id: string, status: T.ActionStatus) => void;
  deleteAction: (id: string) => void;

  addVendor: (v: Omit<T.Vendor, "id" | "ratings">) => void;
  procPackages: T.ProcPackage[]; quotations: T.Quotation[]; submissions: T.SubmissionRecord[];
  recordSubmission: (r: Omit<T.SubmissionRecord, "id" | "at" | "by" | "version">) => void;
  addPackage: (p: Partial<T.ProcPackage> & { name: string }) => void; updatePackage: (id: string, p: Partial<T.ProcPackage>) => void; deletePackage: (id: string) => void;
  addQuotation: (q: Omit<T.Quotation, "id" | "receivedAt">) => void; updateQuotation: (id: string, p: Partial<T.Quotation>) => void; deleteQuotation: (id: string) => void;
  awardPackage: (id: string, vendorId: string) => void;
  updateVendor: (id: string, patch: Partial<T.Vendor>) => void;
  deleteVendor: (id: string) => void;
  addRating: (vendorId: string, r: Omit<T.VendorRating, "id">) => void;
  deleteRating: (vendorId: string, ratingId: string) => void;

  addDocs: (files: { name: string; size: number }[]) => void;
  deleteDoc: (id: string) => void; updateDoc: (id: string, p: Partial<T.Doc>) => void;
  runExtraction: () => void;

  updateClarification: (id: string, patch: Partial<T.Clarification>) => void;
  acceptClarification: (id: string) => void; rejectClarification: (id: string) => void;
  acceptAllClarifications: () => void; rejectAllClarifications: () => void;
  addClarification: (c: Partial<T.Clarification>) => void; generateClarifications: () => void; deleteClarification: (id: string) => void;

  updateClause: (id: string, patch: Partial<T.Clause>) => void;
  acceptClause: (id: string) => void; rejectClause: (id: string) => void; acceptAllClauses: () => void; rejectAllClauses: () => void;
  addClause: (c: Partial<T.Clause>) => void; generateClauses: () => void;

  updateQualification: (id: string, patch: Partial<T.Qualification>) => void;
  acceptQualification: (id: string) => void; rejectQualification: (id: string) => void; acceptAllQualifications: () => void; rejectAllQualifications: () => void;
  addQualification: (q: Partial<T.Qualification>) => void;

  addRisk: (r: Partial<T.Risk>) => void; updateRisk: (id: string, patch: Partial<T.Risk>) => void; deleteRisk: (id: string) => void; generateRisks: () => void;
  updateDeliverable: (id: string, patch: Partial<T.Deliverable>) => void; addDeliverable: (name: string, type: T.Deliverable["type"]) => void; deleteDeliverable: (id: string) => void;
  updateCostLine: (id: string, patch: Partial<T.CostLine>) => void; addCostLine: () => void; deleteCostLine: (id: string) => void; setMargin: (m: number) => void;
  updateMilestone: (id: string, patch: Partial<T.Milestone>) => void; addMilestone: () => void; deleteMilestone: (id: string) => void;
  updateCompetitor: (id: string, patch: Partial<T.Competitor>) => void; addCompetitor: (name: string) => void; deleteCompetitor: (id: string) => void;
  addLesson: (l: Omit<T.Lesson, "id">) => void; deleteLesson: (id: string) => void;
  sendChat: (agent: string, text: string) => void; clearChat: (agent: string) => void; chatBusy: boolean;
  updateProfile: (p: Partial<T.Profile>) => void;
  reset: () => void;
}

const initial = () => ({
  tenders: [...seed.tenders, seed3.tender4], activeTenderId: "t1", actions: [...seed.actions, ...seed3.actions], projects: seed3.projects, vendors: seed.vendors, docs: [...seed.docs, ...seed3.docs],
  clarifications: [...seed.clarifications, ...seed3.clarifications], clauses: [...seed.clauses, ...seed3.clauses], qualifications: [...seed.qualifications, ...seed3.qualifications], risks: [...seed.risks, ...seed3.risks], deliverables: [...seed.deliverables, ...seed3.deliverables],
  costLines: [...seed.costLines, ...seed3.costLines], milestones: [...seed.milestones, ...seed3.milestones], competitors: [...seed.competitors, ...seed3.competitors], lessons: [...seed3.lessons, ...seed.lessons], procPackages: [...seed.procPackages, ...seed3.procPackages], quotations: [...seed.quotations, ...seed3.quotations], submissions: seed3.submissions, chat: [] as T.ChatMsg[], chatBusy: false,
  profile: { name: "Jordan Reyes", email: "j.reyes@northstar.example", model: "Lite" as const }, margin: 12, lastExtraction: new Date("2026-09-16T14:33:18").toISOString(),
  industryFilter: "all", org: seed2.org, users: seed2.users, currentUser: "Jordan Reyes",
  companies: seed2.companies, contacts: seed2.contacts, opportunities: seed2.opportunities, activities: seed2.activities,
  requirements: seed2.requirements, complianceItems: seed2.complianceItems, capabilities: seed2.capabilities, aiSummaries: seed2.aiSummaries,
  reviews: [...seed2.reviews, ...seed3.reviews], approvals: [...seed2.approvals, ...seed3.approvals], priceVersions: [...seed2.priceVersions, ...seed3.priceVersions], proposalSections: [...seed2.proposalSections, ...seed3.proposalSections], bidResults: seed3.bidResults,
  inquiries: seed2.inquiries, contracts: seed3.contracts, auditLog: seed2.auditLog, aiLog: seed2.aiLog, notifications: seed2.notifications, customIndustries: [],
});

const patchIn = <X extends { id: string }>(arr: X[], id: string, patch: Partial<X>) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      setActiveTender: (id) => set({ activeTenderId: id }),
      addTender: (t) => {
        const id = uid();
        set((s) => ({ tenders: [...s.tenders, { id, name: t.name, reference: t.reference || "", client: t.client || "", companyId: t.companyId, opportunityId: t.opportunityId, description: t.description || "", value: t.value || 0, currency: t.currency || s.org.currency, closing: t.closing || "", progress: 0, status: "Active Campaign", stage: "Analysis", industry: t.industry || "other", service: t.service || "", tenderType: t.tenderType || "Tender", region: t.region || "Global", owner: t.owner || s.currentUser, goNoGo: "Pending", goNoGoScores: {}, scope: t.scope || "Full scope", clientTerm: "Client", bidder: "Sole bidder", metadata: {}, createdAt: new Date().toISOString() }], activeTenderId: id }));
        get().audit("Created", "Tender", id, t.name);
        return id;
      },
      updateTender: (id, patch) => set((s) => ({ tenders: patchIn(s.tenders, id, patch) })),
      deleteTender: (id) => set((s) => ({ tenders: s.tenders.filter((t) => t.id !== id), activeTenderId: s.tenders.find((t) => t.id !== id)?.id || "" })),
      convertToProject: (tenderId) => set((s) => {
        const t = s.tenders.find((x) => x.id === tenderId); if (!t) return {};
        return { projects: [...s.projects, { id: uid(), name: t.name, tenderId, contractId: s.contracts.find((c) => c.tenderId === tenderId)?.id, createdAt: new Date().toISOString(), status: "Mobilising" as const, progress: 0 }] };
      }),

      addAction: (title, agent) => set((s) => ({ actions: [...s.actions, { id: uid(), tenderId: s.activeTenderId, title, agent, status: "backlog", createdAt: new Date().toISOString() }] })),
      moveAction: (id, status) => set((s) => ({ actions: patchIn(s.actions, id, { status }) })),
      deleteAction: (id) => set((s) => ({ actions: s.actions.filter((a) => a.id !== id) })),

      addVendor: (v) => set((s) => ({ vendors: [...s.vendors, { ...v, id: uid(), ratings: [] }] })),
      recordSubmission: (r) => { set((s) => { const v = s.submissions.filter((x) => x.tenderId === r.tenderId).length + 1; return { submissions: [...s.submissions, { ...r, id: uid(), version: v, at: new Date().toISOString(), by: s.currentUser }], tenders: patchIn(s.tenders, r.tenderId, { stage: "Submitted" }) }; }); get().audit("Submitted", "Tender", r.tenderId, `Package v${get().submissions.filter((x) => x.tenderId === r.tenderId).length} via ${r.method}`); get().notify("Bid submitted", `Submission package recorded for ${get().tenders.find((t) => t.id === r.tenderId)?.name}`, `/app/tenders/${r.tenderId}/result`); },
      addPackage: (p) => set((s) => ({ procPackages: [...s.procPackages, { id: uid(), tenderId: s.activeTenderId, name: p.name, category: p.category || "Material", requirement: p.requirement || "", status: "Requirement", weights: { price: 50, lead: 20, quality: 15, compliance: 15 } }] })),
      updatePackage: (id, p) => set((s) => ({ procPackages: patchIn(s.procPackages, id, p) })),
      deletePackage: (id) => set((s) => ({ procPackages: s.procPackages.filter((x) => x.id !== id), quotations: s.quotations.filter((q) => q.packageId !== id) })),
      addQuotation: (q) => set((s) => ({ quotations: [...s.quotations, { ...q, id: uid(), receivedAt: new Date().toISOString() }], procPackages: s.procPackages.map((p) => (p.id === q.packageId && (p.status === "Requirement" || p.status === "RFQ sent") ? { ...p, status: "Quotations" } : p)) })),
      updateQuotation: (id, p) => set((s) => ({ quotations: patchIn(s.quotations, id, p) })),
      deleteQuotation: (id) => set((s) => ({ quotations: s.quotations.filter((q) => q.id !== id) })),
      awardPackage: (id, vendorId) => { const pk = get().procPackages.find((p) => p.id === id); const v = get().vendors.find((x) => x.id === vendorId); set((s) => ({ procPackages: patchIn(s.procPackages, id, { recommendedVendorId: vendorId, status: "Approval" }) })); if (pk) get().requestApproval({ tenderId: pk.tenderId || get().activeTenderId, subject: `Procurement award — ${pk.name} → ${v?.name || vendorId}`, kind: "Procurement award", requestedBy: get().currentUser, approver: get().users.find((u) => u.role === "Procurement Manager")?.name || "Procurement Manager", reason: "" }); get().audit("Recommended award", "Package", id, v?.name || vendorId); },
      updateVendor: (id, patch) => set((s) => ({ vendors: patchIn(s.vendors, id, patch) })),
      deleteVendor: (id) => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })),
      addRating: (vendorId, r) => set((s) => ({ vendors: s.vendors.map((v) => (v.id === vendorId ? { ...v, ratings: [{ ...r, id: uid() }, ...v.ratings] } : v)) })),
      deleteRating: (vendorId, ratingId) => set((s) => ({ vendors: s.vendors.map((v) => (v.id === vendorId ? { ...v, ratings: v.ratings.filter((r) => r.id !== ratingId) } : v)) })),

      addDocs: (files) => {
        const ids = files.map(() => uid());
        set((s) => ({ docs: [...s.docs, ...files.map((f, i) => ({ id: ids[i], tenderId: s.activeTenderId, name: f.name, size: f.size, rev: 0, kind: guessKind(f.name), status: "PROCESSING" as const, uploadedAt: new Date().toISOString(), uploadedBy: s.currentUser, language: "English", confidentiality: "Internal" as const }))] }));
        setTimeout(() => set((s) => ({ docs: s.docs.map((d) => (ids.includes(d.id) ? { ...d, status: "INDEXED" } : d)) })), 1800);
      },
      deleteDoc: (id) => { set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })); get().audit("Deleted", "Document", id, ""); },
      updateDoc: (id, p) => set((s) => ({ docs: patchIn(s.docs, id, p) })),
      runExtraction: () => set({ lastExtraction: new Date().toISOString() }),

      updateClarification: (id, patch) => set((s) => ({ clarifications: patchIn(s.clarifications, id, patch) })),
      acceptClarification: (id) => set((s) => ({ clarifications: patchIn(s.clarifications, id, { pending: false, status: "Approved" }) })),
      rejectClarification: (id) => set((s) => ({ clarifications: s.clarifications.filter((c) => c.id !== id) })),
      acceptAllClarifications: () => set((s) => ({ clarifications: s.clarifications.map((c) => (c.pending ? { ...c, pending: false, status: "Approved" } : c)) })),
      rejectAllClarifications: () => set((s) => ({ clarifications: s.clarifications.filter((c) => !c.pending) })),
      deleteClarification: (id) => set((s) => ({ clarifications: s.clarifications.filter((c) => c.id !== id) })),
      addClarification: (c) => set((s) => ({ clarifications: [...s.clarifications, { id: uid(), tenderId: s.activeTenderId, n: s.clarifications.length + 1, ref: c.ref || "ITT", round: 1, category: c.category || "Technical", title: c.title || "New clarification", analysis: c.analysis || "", status: "Draft", confidence: "High", assignee: "", due: "", author: get().profile.name, createdAt: new Date().toISOString(), pending: false }] })),
      generateClarifications: () => set((s) => ({ clarifications: [...s.clarifications, ...[
        { ref: "ITT §12.2", category: "Commercial" as const, title: "Currency of payment", analysis: "The ITT is silent on whether payment is in CAD or USD for offshore-procured items. Please confirm the contract currency and any exchange-rate adjustment mechanism.", confidence: "High" as const },
        { ref: "SPC §6.1", category: "Technical" as const, title: "Free-span acceptance criteria", analysis: "SPC §6.1 references DNV-RP-F105 but does not state the allowable free-span length for the rocky section KP 12–15. Please provide the acceptance criteria or confirm tenderer may propose.", confidence: "Medium" as const },
      ].map((g, i) => ({ id: uid(), tenderId: s.activeTenderId, n: s.clarifications.length + i + 1, round: 1, status: "Draft" as const, assignee: "", due: "", author: "TenderOS", createdAt: new Date().toISOString(), pending: true, ...g }))] })),

      updateClause: (id, patch) => set((s) => ({ clauses: patchIn(s.clauses, id, patch) })),
      acceptClause: (id) => set((s) => ({ clauses: patchIn(s.clauses, id, { pending: false, status: "Approved" }) })),
      rejectClause: (id) => set((s) => ({ clauses: s.clauses.filter((c) => c.id !== id) })),
      acceptAllClauses: () => set((s) => ({ clauses: s.clauses.map((c) => (c.pending ? { ...c, pending: false, status: "Approved" } : c)) })),
      rejectAllClauses: () => set((s) => ({ clauses: s.clauses.filter((c) => !c.pending) })),
      addClause: (c) => set((s) => ({ clauses: [...s.clauses, { id: uid(), tenderId: s.activeTenderId, n: s.clauses.length + 1, ref: c.ref || "§", title: c.title || "New clause", category: c.category || "Other", relevance: c.relevance || "Medium", markup: c.markup || "", analysis: c.analysis || "", status: "Pending", confidence: "High", pending: false, author: get().profile.name, createdAt: new Date().toISOString() }] })),
      generateClauses: () => set((s) => ({ clauses: [...s.clauses, { id: uid(), tenderId: s.activeTenderId, n: s.clauses.length + 1, ref: "§21.4", title: "Termination for Convenience - No Compensation", category: "Termination", relevance: "High", markup: "Insert compensation for demobilisation, committed subcontracts and 10% of unperformed Work on termination for convenience.", analysis: "§21.4 allows Company to terminate for convenience with payment only for Work performed. Committed long-lead procurement (umbilicals, flexibles) would be stranded.", status: "Pending", confidence: "High", pending: true, author: "TenderOS", createdAt: new Date().toISOString() }] })),

      updateQualification: (id, patch) => set((s) => ({ qualifications: patchIn(s.qualifications, id, patch) })),
      acceptQualification: (id) => set((s) => ({ qualifications: patchIn(s.qualifications, id, { pending: false, draft: false }) })),
      rejectQualification: (id) => set((s) => ({ qualifications: s.qualifications.filter((q) => q.id !== id) })),
      acceptAllQualifications: () => set((s) => ({ qualifications: s.qualifications.map((q) => (q.pending ? { ...q, pending: false, draft: false } : q)) })),
      rejectAllQualifications: () => set((s) => ({ qualifications: s.qualifications.filter((q) => !q.pending) })),
      addQualification: (q) => set((s) => ({ qualifications: [...s.qualifications, { id: uid(), tenderId: s.activeTenderId, n: s.qualifications.length + 1, ref: q.ref || "§", text: q.text || "", rationale: q.rationale || "", category: q.category || "Technical", type: q.type || "Qualification", status: "Open", trust: "High", pending: false, draft: false, assignee: "", due: "", task: "To do" }] })),

      addRisk: (r) => set((s) => ({ risks: [...s.risks, { id: uid(), tenderId: s.activeTenderId, n: s.risks.length + 1, kind: r.kind || "Risk", title: r.title || "New risk", description: r.description || "", category: r.category || "Commercial", probability: r.probability ?? 3, impact: r.impact ?? 3, postProbability: r.postProbability ?? 2, postImpact: r.postImpact ?? 2, owner: r.owner || "", status: "Open", mitigation: r.mitigation || "", contingency: r.contingency ?? 0 }] })),
      updateRisk: (id, patch) => set((s) => ({ risks: patchIn(s.risks, id, patch) })),
      deleteRisk: (id) => set((s) => ({ risks: s.risks.filter((r) => r.id !== id) })),
      generateRisks: () => set((s) => ({ risks: [...s.risks, { id: uid(), tenderId: s.activeTenderId, n: s.risks.length + 1, kind: "Risk", title: "Flexible pipe supplier capacity", description: "Only two qualified suppliers for 8\" dynamic flexibles with slots in 2028; award delay pushes delivery into 2029 season.", category: "Procurement", probability: 4, impact: 4, postProbability: 2, postImpact: 4, owner: "", status: "Open", mitigation: "Reserve slot with LOI at award; qualify alternate supplier.", contingency: 1800000 }] })),

      updateDeliverable: (id, patch) => set((s) => ({ deliverables: patchIn(s.deliverables, id, patch) })),
      addDeliverable: (name, type) => set((s) => ({ deliverables: [...s.deliverables, { id: uid(), tenderId: s.activeTenderId, n: s.deliverables.length + 1, name, type, owner: "", status: "Not started", due: "" }] })),
      deleteDeliverable: (id) => set((s) => ({ deliverables: s.deliverables.filter((d) => d.id !== id) })),

      updateCostLine: (id, patch) => set((s) => ({ costLines: patchIn(s.costLines, id, patch) })),
      addCostLine: () => set((s) => ({ costLines: [...s.costLines, { id: uid(), tenderId: s.activeTenderId, wbs: `${s.costLines.length + 1}.1`, description: "New line", category: "Other", qty: 1, unit: "lump sum", rate: 0, contingency: 5 }] })),
      deleteCostLine: (id) => set((s) => ({ costLines: s.costLines.filter((c) => c.id !== id) })),
      setMargin: (margin) => set({ margin }),
      updateMilestone: (id, patch) => set((s) => ({ milestones: patchIn(s.milestones, id, patch) })),
      addMilestone: () => set((s) => ({ milestones: [...s.milestones, { id: uid(), tenderId: s.activeTenderId, name: "New milestone", pct: 0, date: "" }] })),
      deleteMilestone: (id) => set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) })),
      updateCompetitor: (id, patch) => set((s) => ({ competitors: patchIn(s.competitors, id, patch) })),
      addCompetitor: (name) => set((s) => ({ competitors: [...s.competitors, { id: uid(), tenderId: s.activeTenderId, name, capability: 3, pricing: 3, track: 3, vessels: [], note: "" }] })),
      deleteCompetitor: (id) => set((s) => ({ competitors: s.competitors.filter((c) => c.id !== id) })),
      addLesson: (l) => set((s) => ({ lessons: [{ ...l, id: uid() }, ...s.lessons] })),
      deleteLesson: (id) => set((s) => ({ lessons: s.lessons.filter((l) => l.id !== id) })),

      clearChat: (agent) => set((s) => ({ chat: s.chat.filter((m) => !(m.agent === agent && (m.tenderId ?? "t1") === s.activeTenderId)) })),
      sendChat: async (agent, text) => {
        const s0 = get(); const tid = s0.activeTenderId; const now = new Date().toISOString();
        const history = s0.chat.filter((m) => m.agent === agent && (m.tenderId ?? "t1") === tid && !m.streaming).map((m) => ({ role: m.role, text: m.text }));
        const replyId = uid();
        set((s) => ({ chatBusy: true, chat: [...s.chat, { id: uid(), tenderId: tid, agent, role: "user", text, at: now }, { id: replyId, tenderId: tid, agent, role: "assistant", text: "", at: now, streaming: true }] }));
        const append = (chunk: string, done = false, simulated = false) => set((s) => ({ chat: s.chat.map((m) => (m.id === replyId ? { ...m, text: m.text + chunk, streaming: !done, simulated: simulated || m.simulated } : m)), chatBusy: !done }));
        try {
          const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agent, messages: [...history, { role: "user", text }], context: chatContext(get()) }) });
          if (res.status === 503) { append(mockReply(agent, text, get()), true, true); return; }
          if (!res.ok || !res.body) { append(`[Chat service error ${res.status}]`, true); return; }
          const provider = res.headers.get("x-provider") || "unknown";
          const reader = res.body.getReader(); const dec = new TextDecoder();
          for (;;) { const { value, done } = await reader.read(); if (done) break; append(dec.decode(value, { stream: true })); }
          append("", true);
          get().logAI({ model: provider, promptVersion: "agent-chat v1", task: `Agent chat · ${agent}`, sources: scoped(get().docs, tid).map((d) => d.name), input: text.slice(0, 120), outputSummary: "Streamed reply", confidence: "Medium", reviewStatus: "Pending" });
        } catch { append(mockReply(agent, text, get()), true, true); }
      },
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setIndustryFilter: (industryFilter) => set({ industryFilter }),
      audit: (action, entity, entityId, detail) => set((s) => ({ auditLog: [{ id: uid(), at: new Date().toISOString(), user: s.currentUser, action, entity, entityId, detail }, ...s.auditLog] })),
      logAI: (e) => set((s) => ({ aiLog: [{ ...e, id: uid(), at: new Date().toISOString(), user: s.currentUser }, ...s.aiLog] })),
      notify: (kind, text, href) => set((s) => ({ notifications: [{ id: uid(), at: new Date().toISOString(), kind, text, href, read: false }, ...s.notifications] })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (!id || n.id === id ? { ...n, read: true } : n)) })),
      addUser: (u) => set((s) => ({ users: [...s.users, { ...u, id: uid() }] })),
      updateUser: (id, p) => set((s) => ({ users: patchIn(s.users, id, p) })),

      addCompany: (c) => { const id = uid(); set((s) => ({ companies: [...s.companies, { id, name: c.name, industry: c.industry || "other", subIndustry: c.subIndustry || "", country: c.country || "", region: c.region || "Global", website: c.website || "", type: c.type || "Prospect", services: c.services || [], certifications: c.certifications || [], notes: c.notes || "", createdAt: new Date().toISOString() }] })); get().audit("Created", "Company", id, c.name); return id; },
      updateCompany: (id, p) => set((s) => ({ companies: patchIn(s.companies, id, p) })),
      deleteCompany: (id) => set((s) => ({ companies: s.companies.filter((c) => c.id !== id) })),
      addContact: (c) => set((s) => ({ contacts: [...s.contacts, { ...c, id: uid() }] })),
      updateContact: (id, p) => set((s) => ({ contacts: patchIn(s.contacts, id, p) })),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      addOpportunity: (o) => { const id = uid(); const co = get().companies.find((c) => c.id === o.companyId); set((s) => ({ opportunities: [...s.opportunities, { id, name: o.name, companyId: o.companyId, industry: o.industry || co?.industry || "other", service: o.service || "", region: o.region || co?.region || "Global", value: o.value || 0, currency: o.currency || s.org.currency, probability: o.probability ?? 10, expectedAward: o.expectedAward || "", expectedStart: o.expectedStart || "", owner: o.owner || s.currentUser, source: o.source || "", stage: o.stage || "Lead", competitors: o.competitors || [], notes: o.notes || "", createdAt: new Date().toISOString() }] })); get().audit("Created", "Opportunity", id, o.name); return id; },
      updateOpportunity: (id, p) => set((s) => ({ opportunities: patchIn(s.opportunities, id, p) })),
      deleteOpportunity: (id) => set((s) => ({ opportunities: s.opportunities.filter((o) => o.id !== id) })),
      convertOpportunityToTender: (id) => {
        const o = get().opportunities.find((x) => x.id === id); if (!o) return "";
        if (o.tenderId) return o.tenderId;
        const co = get().companies.find((c) => c.id === o.companyId);
        const tid = get().addTender({ name: o.name, client: co?.name || "", companyId: o.companyId, opportunityId: o.id, industry: o.industry, service: o.service, region: o.region, value: o.value, currency: o.currency, owner: o.owner, description: o.notes });
        set((s) => ({ opportunities: patchIn(s.opportunities, id, { stage: "Tender", tenderId: tid }) }));
        return tid;
      },
      addActivity: (a) => set((s) => ({ activities: [{ ...a, id: uid(), at: new Date().toISOString(), by: s.currentUser }, ...s.activities] })),

      addRequirement: (r) => set((s) => ({ requirements: [...s.requirements, { id: uid(), tenderId: r.tenderId, text: r.text, category: r.category || "Other", priority: r.priority || "Must", sourceDoc: r.sourceDoc || "Manual", page: r.page || 0, section: r.section || "", clause: r.clause || "", evidence: r.evidence || "", status: r.status || "Needs Verification", reviewer: r.reviewer || "", comments: r.comments || "", ai: r.ai ?? false, confidence: r.confidence || "High" }] })),
      updateRequirement: (id, p) => { set((s) => ({ requirements: patchIn(s.requirements, id, p) })); if (p.status) get().audit("Requirement status", "Requirement", id, p.status); },
      deleteRequirement: (id) => set((s) => ({ requirements: s.requirements.filter((r) => r.id !== id) })),
      extractRequirements: (tenderId) => {
        const doc = get().docs[0]?.name || "Tender document";
        const gen = [
          { text: "Bidder shall provide a parent company guarantee if bidding through a subsidiary.", category: "Financial", section: "17.2", page: 84 },
          { text: "All correspondence and deliverables in English.", category: "Administrative", section: "1.4", page: 4 },
          { text: "Key personnel CVs for project manager, HSE manager and lead engineer.", category: "Personnel", section: "6.1", page: 47 },
        ];
        set((s) => ({ requirements: [...s.requirements, ...gen.map((g) => ({ id: uid(), tenderId, text: g.text, category: g.category, priority: "Must" as const, sourceDoc: doc, page: g.page, section: g.section, clause: g.section, evidence: "", status: "Needs Verification" as const, reviewer: "", comments: "", ai: true, confidence: "Medium" as const }))] }));
        get().logAI({ model: get().profile.model, promptVersion: "req-extract v2", task: "Requirement extraction", sources: [doc], input: "Extract requirements", outputSummary: `${gen.length} requirements`, confidence: "Medium", reviewStatus: "Pending" });
        get().notify("AI finding requires review", `${gen.length} AI-extracted requirements need verification.`, `/app/tenders/${tenderId}/requirements`);
      },
      addComplianceItem: (c) => set((s) => ({ complianceItems: [...s.complianceItems, { id: uid(), tenderId: c.tenderId, item: c.item, status: c.status || "Unknown", evidence: c.evidence || "", expiry: c.expiry, owner: c.owner || "", notes: c.notes || "" }] })),
      updateComplianceItem: (id, p) => set((s) => ({ complianceItems: patchIn(s.complianceItems, id, p) })),
      deleteComplianceItem: (id) => set((s) => ({ complianceItems: s.complianceItems.filter((c) => c.id !== id) })),
      applyComplianceTemplate: (tenderId, items) => set((s) => { const have = new Set(s.complianceItems.filter((c) => c.tenderId === tenderId).map((c) => c.item)); return { complianceItems: [...s.complianceItems, ...items.filter((i) => !have.has(i)).map((item) => ({ id: uid(), tenderId, item, status: "Unknown" as const, evidence: "", owner: "", notes: "" }))] }; }),
      addCapability: (c) => set((s) => ({ capabilities: [...s.capabilities, { ...c, id: uid() }] })),
      updateCapability: (id, p) => set((s) => ({ capabilities: patchIn(s.capabilities, id, p) })),
      deleteCapability: (id) => set((s) => ({ capabilities: s.capabilities.filter((c) => c.id !== id) })),
      generateSummary: (tenderId) => {
        const t = get().tenders.find((x) => x.id === tenderId); if (!t) return;
        const reqs = get().requirements.filter((r) => r.tenderId === tenderId);
        const sum: T.AISummary = { tenderId, generatedAt: new Date().toISOString(), model: get().profile.model, sections: {
          "Executive Summary": [`${t.tenderType} from ${t.client} for ${t.name}; indicative value ${t.currency} ${t.value.toLocaleString()}; submission ${t.closing || "TBC"}.`],
          "Scope Summary": [t.description || "Scope not yet described."],
          "Key Requirements": reqs.slice(0, 6).map((r) => `${r.text} (§${r.section})`),
          "Important Dates": [`Submission ${t.closing || "TBC"}`],
          "Missing Information": ["Generated from indexed documents only — verify against addenda."],
          "Questions for Client": reqs.filter((r) => r.status === "Needs Verification").slice(0, 3).map((r) => `Clarify §${r.section}: ${r.text}`),
        }, recommendation: { verdict: "Pending", reasoning: "Complete the Go/No-Go scorecard; the recommendation is derived from scored criteria, not from the summary." }, contractTerms: [] };
        set((s) => ({ aiSummaries: [...s.aiSummaries.filter((x) => x.tenderId !== tenderId), sum] }));
        get().logAI({ model: sum.model, promptVersion: "summary v4", task: "AI summary", sources: get().docs.map((d) => d.name), input: "Summarise tender", outputSummary: "Summary regenerated", confidence: "Medium", reviewStatus: "Pending" });
      },
      setGoNoGo: (tenderId, scores, verdict, reason) => { set((s) => ({ tenders: patchIn(s.tenders, tenderId, { goNoGoScores: scores, goNoGo: verdict, goNoGoReason: reason, stage: verdict === "NO-GO" ? "Cancelled" : "Bid Preparation" }) })); get().audit("Go/No-Go", "Tender", tenderId, `${verdict} — ${reason}`); },
      addReview: (r) => set((s) => ({ reviews: [...s.reviews, { ...r, id: uid(), at: new Date().toISOString() }] })),
      updateReview: (id, p) => { set((s) => ({ reviews: patchIn(s.reviews, id, { ...p, at: new Date().toISOString() }) })); if (p.status) get().audit(`Review ${p.status}`, "Review", id, p.comment || ""); },
      requestApproval: (a) => { set((s) => ({ approvals: [{ ...a, id: uid(), status: "Pending", at: new Date().toISOString() }, ...s.approvals] })); get().notify("Management approval required", a.subject, "/app/approvals"); },
      decideApproval: (id, status, reason) => {
        set((s) => ({ approvals: patchIn(s.approvals, id, { status, reason, at: new Date().toISOString() }) }));
        const a = get().approvals.find((x) => x.id === id); if (a) get().audit(status, "Approval", id, `${a.kind}: ${a.subject}${reason ? " — " + reason : ""}`);
      },
      createPriceVersion: (tenderId, p) => set((s) => { const v = s.priceVersions.filter((x) => x.tenderId === tenderId).length + 1; get().audit("Price version", "Tender", tenderId, `v${v} ${p.price.toLocaleString()}`); return { priceVersions: [...s.priceVersions, { ...p, id: uid(), tenderId, version: v, locked: false, createdAt: new Date().toISOString() }] }; }),
      lockPrice: (id) => { set((s) => ({ priceVersions: s.priceVersions.map((p) => (p.id === id ? { ...p, locked: true, approvedBy: s.currentUser } : p)) })); get().audit("Price locked", "PriceVersion", id, ""); },
      addProposalSection: (sec) => set((s) => ({ proposalSections: [...s.proposalSections, { ...sec, id: uid(), order: s.proposalSections.filter((x) => x.tenderId === sec.tenderId && x.kind === sec.kind).length + 1 }] })),
      updateProposalSection: (id, p) => set((s) => ({ proposalSections: patchIn(s.proposalSections, id, p.body !== undefined && !p.status ? { ...p, status: "Human Edited" } : p) })),
      deleteProposalSection: (id) => set((s) => ({ proposalSections: s.proposalSections.filter((x) => x.id !== id) })),
      draftProposal: (tenderId, kind, titles) => {
        const t = get().tenders.find((x) => x.id === tenderId);
        set((s) => { const have = new Set(s.proposalSections.filter((x) => x.tenderId === tenderId && x.kind === kind).map((x) => x.title)); let n = have.size; return { proposalSections: [...s.proposalSections, ...titles.filter((ti) => !have.has(ti)).map((title) => ({ id: uid(), tenderId, kind, title, body: `[AI DRAFT — cite sources before approval] ${title} for ${t?.name || "this tender"}: draft based on indexed documents and approved requirements.`, status: "AI Draft" as const, order: ++n }))] }; });
        get().logAI({ model: get().profile.model, promptVersion: `${kind}-proposal v2`, task: `${kind} proposal draft`, sources: get().docs.map((d) => d.name), input: titles.join(", "), outputSummary: `${titles.length} sections drafted`, confidence: "Medium", reviewStatus: "Pending" });
      },
      setBidResult: (r) => { set((s) => ({ bidResults: [...s.bidResults.filter((x) => x.tenderId !== r.tenderId), r], tenders: patchIn(s.tenders, r.tenderId, { stage: r.status, status: r.status === "Awarded" ? "Won" : r.status === "Rejected" ? "Lost" : "Active Campaign" }), opportunities: s.opportunities.map((o) => (o.tenderId === r.tenderId ? { ...o, stage: r.status === "Awarded" ? "Won" : r.status === "Rejected" ? "Lost" : o.stage } : o)) })); get().audit("Bid result", "Tender", r.tenderId, r.status); },
      markInquiry: (id, status, link) => set((s) => ({ inquiries: patchIn(s.inquiries, id, { status, linkedTenderId: link?.tenderId, linkedOpportunityId: link?.opportunityId }) })),
      createContract: (tenderId) => { const t = get().tenders.find((x) => x.id === tenderId); if (!t) return ""; const ex = get().contracts.find((c) => c.tenderId === tenderId); if (ex) return ex.id; const id = uid(); const pv = [...get().priceVersions].reverse().find((p) => p.tenderId === tenderId); set((s) => ({ contracts: [...s.contracts, { id, tenderId, name: `${t.name} — Contract`, client: t.client, value: pv?.price || t.value, currency: t.currency, signed: "", start: "", end: "", status: "Draft", terms: Object.fromEntries((s.aiSummaries.find((a) => a.tenderId === tenderId)?.contractTerms || []).map((c) => [c.term, c.finding])) }] })); get().audit("Created", "Contract", id, t.name); return id; },
      updateContract: (id, p) => set((s) => ({ contracts: patchIn(s.contracts, id, p) })),
      updateProject: (id, p) => set((s) => ({ projects: patchIn(s.projects, id, p) })),
      addCustomIndustry: (i) => set((s) => ({ customIndustries: [...s.customIndustries, i] })),
      updateCustomIndustry: (id, p) => set((s) => ({ customIndustries: patchIn(s.customIndustries, id, p) })),
      deleteCustomIndustry: (id) => set((s) => ({ customIndustries: s.customIndustries.filter((c) => c.id !== id) })),
      reset: () => set(initial()),
    }),
    { name: "vendoriq-tenderos", storage: createJSONStorage(() => localStorage), version: 3, migrate: () => initial() as unknown as State }
  )
);

function guessKind(name: string) {
  const n = name.toLowerCase();
  if (n.includes("itt") || n.includes("instruction")) return "ITT/Instructions";
  if (n.includes("contract") || n.includes("gcc")) return "Contract";
  if (n.includes("spec")) return "Specification";
  if (n.endsWith(".xlsx") || n.endsWith(".csv")) return "Schedule/Pricing";
  return "Annex";
}

/** Compact, per-tender snapshot sent to the model as context. Kept small and deterministic for prompt caching. */
function chatContext(s: State) {
  const id = s.activeTenderId; const t = s.tenders.find((x) => x.id === id);
  const pick = <X extends object>(arr: X[], n: number) => arr.slice(0, n);
  return {
    organisation: s.org.name, user: s.currentUser,
    tender: t && { name: t.name, reference: t.reference, client: t.client, industry: t.industry, service: t.service, type: t.tenderType, region: t.region, value: t.value, currency: t.currency, deadline: t.closing, stage: t.stage, goNoGo: t.goNoGo, goNoGoReason: t.goNoGoReason, description: t.description, metadata: t.metadata },
    documents: scoped(s.docs, id).map((d) => ({ name: d.name, type: d.kind, status: d.status, rev: d.rev })),
    aiSummary: s.aiSummaries.find((a) => a.tenderId === id)?.sections,
    requirements: pick(s.requirements.filter((r) => r.tenderId === id), 40).map((r) => ({ id: r.id, text: r.text, category: r.category, priority: r.priority, source: `${r.sourceDoc} p.${r.page} §${r.clause}`, status: r.status })),
    compliance: s.complianceItems.filter((c) => c.tenderId === id).map((c) => ({ item: c.item, status: c.status, evidence: c.evidence, expiry: c.expiry })),
    capabilities: s.capabilities.map((c) => ({ name: c.name, value: c.value, expiry: c.expiry })),
    clarifications: pick(scoped(s.clarifications, id), 30).map((c) => ({ n: c.n, ref: c.ref, title: c.title, status: c.status, pending: c.pending, clientAnswer: c.clientAnswer })),
    contractClauses: pick(scoped(s.clauses, id), 30).map((c) => ({ ref: c.ref, title: c.title, relevance: c.relevance, markup: c.markup, status: c.status, pending: c.pending })),
    qualifications: scoped(s.qualifications, id).map((q) => ({ ref: q.ref, text: q.text, type: q.type, status: q.status, pending: q.pending })),
    risks: scoped(s.risks, id).map((r) => ({ n: r.n, kind: r.kind, title: r.title, category: r.category, p: r.probability, i: r.impact, postP: r.postProbability, postI: r.postImpact, owner: r.owner, status: r.status, mitigation: r.mitigation, contingency: r.contingency })),
    deliverables: scoped(s.deliverables, id).map((d) => ({ name: d.name, type: d.type, status: d.status, owner: d.owner })),
    costLines: scoped(s.costLines, id).map((l) => ({ wbs: l.wbs, description: l.description, category: l.category, qty: l.qty, unit: l.unit, rate: l.rate, contingencyPct: l.contingency })),
    margin: s.margin,
    priceVersions: s.priceVersions.filter((p) => p.tenderId === id).map((p) => ({ v: p.version, cost: p.cost, margin: p.margin, price: p.price, locked: p.locked })),
    procurement: scoped(s.procPackages, id).map((p) => ({ name: p.name, status: p.status, quotes: s.quotations.filter((q) => q.packageId === p.id).map((q) => ({ vendor: s.vendors.find((v) => v.id === q.vendorId)?.name, price: q.price, leadWeeks: q.leadWeeks, compliance: q.compliance })) })),
    competitors: s.companies.filter((c) => c.type === "Competitor").map((c) => ({ name: c.name, notes: c.notes, note: "recorded intelligence only; do not extrapolate" })),
    reviews: s.reviews.filter((r) => r.tenderId === id).map((r) => ({ stage: r.stage, reviewer: r.reviewer, status: r.status, comment: r.comment })),
    approvals: s.approvals.filter((a) => a.tenderId === id).map((a) => ({ kind: a.kind, subject: a.subject, status: a.status })),
    lessonsLearned: s.lessons.map((l) => ({ tender: l.tender, outcome: l.outcome, lesson: l.lesson })),
  };
}

function mockReply(agent: string, text: string, s: State) {
  const id = s.activeTenderId; const t = s.tenders.find((x) => x.id === id);
  const pend = scoped(s.clarifications, id).filter((c) => c.pending).length + scoped(s.clauses, id).filter((c) => c.pending).length + scoped(s.qualifications, id).filter((q) => q.pending).length;
  const reqs = s.requirements.filter((r) => r.tenderId === id); const nv = reqs.filter((r) => r.status === "Needs Verification").length;
  const risks = scoped(s.risks, id).filter((r) => r.kind === "Risk" && r.status === "Open").sort((a, b) => b.probability * b.impact - a.probability * a.impact);
  return `**Offline mode — no ANTHROPIC_API_KEY or GROQ_API_KEY configured, so this is a local summary, not a model reply.**\n\nOn "${text.slice(0, 80)}" for ${t?.name || "this tender"} (${t?.reference || "no ref"}):\n• ${scoped(s.docs, id).length} document(s) indexed; ${reqs.length} requirements captured, ${nv} still need verification.\n• ${pend} AI draft(s) wait in the review queue — drafts only count once a human accepts them.\n• Top open risks: ${risks.slice(0, 3).map((r) => `${r.title} (P${r.probability}×I${r.impact})`).join("; ") || "none recorded"}.\n• Go/No-Go: ${t?.goNoGo || "Pending"}${t?.goNoGoReason ? ` — ${t.goNoGoReason}` : ""}.\n\nAdd a key to .env.local to get a real ${agent.replace("-", " ")} reply grounded in this context.`;
}

// Derived helpers
export const severity = (p: number, i: number): T.Severity => { const s = p * i; return s >= 16 ? "Very High" : s >= 10 ? "High" : s >= 5 ? "Medium" : "Low"; };
export const fmtMoney = (n: number, cur = "CAD") => new Intl.NumberFormat("en-CA", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
export const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));


/** Tender Health — every factor is computed from real records; nothing is hard-coded. */
export function tenderHealth(s: State, tenderId: string) {
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const reqs = s.requirements.filter((r) => r.tenderId === tenderId);
  const comp = s.complianceItems.filter((c) => c.tenderId === tenderId);
  const revs = s.reviews.filter((r) => r.tenderId === tenderId);
  const tech = s.proposalSections.filter((p) => p.tenderId === tenderId && p.kind === "technical");
  const comm = s.proposalSections.filter((p) => p.tenderId === tenderId && p.kind === "commercial");
  const pv = s.priceVersions.filter((p) => p.tenderId === tenderId);
  const docs = scoped(s.docs, tenderId), risks = scoped(s.risks, tenderId);
  const factors = [
    { label: "Requirements", value: pct(reqs.filter((r) => r.status !== "Needs Verification").length, reqs.length) },
    { label: "Compliance", value: pct(comp.filter((c) => c.status === "Compliant").length, comp.length) },
    { label: "Documents", value: pct(docs.filter((d) => d.status === "INDEXED").length, Math.max(docs.length, 3)) },
    { label: "Technical", value: pct(tech.filter((p) => p.status === "Approved" || p.status === "Human Edited" || p.status === "In Review").length, tech.length) },
    { label: "Commercial", value: pct(comm.filter((p) => p.status !== "AI Draft").length, comm.length) },
    { label: "Pricing", value: pv.some((p) => p.locked) ? 100 : pv.length ? 60 : 0 },
    { label: "Risk", value: pct(risks.filter((r) => r.status !== "Open" || r.mitigation).length, risks.length) },
    { label: "Submission", value: pct(revs.filter((r) => r.status === "Approved").length, Math.max(revs.length, 3)) },
  ];
  const score = Math.round(factors.reduce((a, f) => a + f.value, 0) / factors.length);
  return { score, factors };
}

export function goNoGoVerdict(scores: Record<string, number>): { verdict: T.GoNoGo; total: number } {
  const vals = goNoGoCriteria.map((c) => scores[c] ?? 0);
  if (vals.some((v) => v === 0)) return { verdict: "Pending", total: 0 };
  const total = Math.round((vals.reduce((a, b) => a + b, 0) / (goNoGoCriteria.length * 5)) * 100);
  const lowCritical = ["Technical capability", "Compliance", "Contract risk"].some((c) => (scores[c] ?? 0) <= 1);
  return { verdict: total >= 70 && !lowCritical ? "GO" : total >= 50 ? "CONDITIONAL GO" : "NO-GO", total };
}

export const filterByIndustry = <X extends { industry: string }>(arr: X[], f: string) => (f === "all" ? arr : arr.filter((x) => x.industry === f));

/** Legacy module records default to the first seeded tender when they carry no tenderId. */
export const scoped = <X extends { tenderId?: string }>(arr: X[], tenderId: string) => arr.filter((x) => (x.tenderId ?? "t1") === tenderId);

/** The store with every tender-scoped collection filtered to the active tender. Use in workspace modules. */
export function useScopedStore() {
  const s = useStore();
  const id = s.activeTenderId;
  return { ...s, actions: scoped(s.actions, id), docs: scoped(s.docs, id), clarifications: scoped(s.clarifications, id), clauses: scoped(s.clauses, id), qualifications: scoped(s.qualifications, id), risks: scoped(s.risks, id), deliverables: scoped(s.deliverables, id), costLines: scoped(s.costLines, id), milestones: scoped(s.milestones, id), competitors: scoped(s.competitors, id), procPackages: scoped(s.procPackages, id), chat: s.chat.filter((m) => (m.tenderId ?? "t1") === id) };
}
