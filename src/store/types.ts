export type ActionStatus = "backlog" | "ready" | "in_progress" | "waiting" | "complete";
export interface ActionItem { tenderId?: string; id: string; title: string; agent: string; suggested?: boolean; status: ActionStatus; createdAt: string; }

export type TenderStage = "Analysis" | "Qualification" | "Go/No-Go" | "Bid Preparation" | "Review" | "Approval" | "Submitted" | "Under Evaluation" | "Clarification" | "Negotiation" | "Awarded" | "Rejected" | "Withdrawn" | "Cancelled";
export type GoNoGo = "Pending" | "GO" | "CONDITIONAL GO" | "NO-GO";
export interface Tender {
  id: string; name: string; reference: string; client: string; companyId?: string; opportunityId?: string; description: string; value: number; currency: string; closing: string; progress: number;
  status: "Active Campaign" | "Won" | "Lost" | "Archived";
  stage: TenderStage; industry: string; service: string; tenderType: string; region: string; owner: string;
  goNoGo: GoNoGo; goNoGoReason?: string; goNoGoScores: Record<string, number>;
  scope: string; clientTerm: string; bidder: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface Project { id: string; name: string; tenderId: string; contractId?: string; createdAt: string; status: "Mobilising" | "In progress" | "On hold" | "Complete"; progress: number; }
export interface Contract { id: string; tenderId: string; name: string; client: string; value: number; currency: string; signed: string; start: string; end: string; status: "Draft" | "Signed" | "Active" | "Closed"; terms: Record<string, string>; }

export interface Company { id: string; name: string; industry: string; subIndustry: string; country: string; region: string; website: string; type: "Client" | "Partner" | "Competitor" | "Prospect"; services: string[]; certifications: string[]; notes: string; createdAt: string; }
export interface Contact { id: string; companyId: string; name: string; title: string; email: string; phone: string; role: string; notes: string; }
export type OppStage = "Lead" | "Prospect" | "Qualified" | "Opportunity" | "Tender" | "Bid" | "Won" | "Lost";
export interface Opportunity { id: string; name: string; companyId: string; industry: string; service: string; region: string; value: number; currency: string; probability: number; expectedAward: string; expectedStart: string; owner: string; source: string; stage: OppStage; competitors: string[]; notes: string; tenderId?: string; createdAt: string; }
export interface Activity { id: string; entity: "company" | "opportunity" | "tender"; entityId: string; kind: "Note" | "Call" | "Meeting" | "Email" | "WhatsApp"; text: string; by: string; at: string; }

export interface Requirement { id: string; tenderId: string; text: string; category: string; priority: "Must" | "Should" | "Could"; sourceDoc: string; page: number; section: string; clause: string; deadline?: string; evidence: string; status: "Needs Verification" | "Approved" | "Rejected" | "Compliant" | "Non-Compliant" | "Partial"; reviewer: string; comments: string; ai: boolean; confidence: Confidence; }
export type ComplianceStatus = "Compliant" | "Non-Compliant" | "Partially Compliant" | "Missing" | "Expired" | "Unknown" | "Needs Review";
export interface ComplianceItem { id: string; tenderId: string; item: string; status: ComplianceStatus; evidence: string; expiry?: string; owner: string; notes: string; }
export interface Capability { id: string; name: string; category: string; value: string; expiry?: string; evidence: string; }
export interface AISummary { tenderId: string; generatedAt: string; model: string; sections: Record<string, string[]>; recommendation: { verdict: GoNoGo; reasoning: string }; contractTerms: { term: string; finding: string; risk: "High" | "Medium" | "Low"; source: string }[]; }

export interface Review { id: string; tenderId: string; stage: string; reviewer: string; status: "Pending" | "Approved" | "Rejected" | "Revision requested"; comment: string; at: string; }
export interface Approval { id: string; tenderId: string; subject: string; kind: "Go/No-Go" | "Pricing" | "Technical proposal" | "Commercial proposal" | "Submission" | "Procurement award"; requestedBy: string; approver: string; status: "Pending" | "Approved" | "Rejected"; reason: string; at: string; }
export interface PriceVersion { id: string; tenderId: string; version: number; cost: number; margin: number; discount: number; tax: number; price: number; validity: string; paymentTerms: string; assumptions: string; locked: boolean; approvedBy?: string; createdAt: string; }
export interface ProposalSection { id: string; tenderId: string; kind: "technical" | "commercial"; title: string; body: string; status: "AI Draft" | "Human Edited" | "In Review" | "Approved"; order: number; }
export interface BidResult { tenderId: string; status: "Submitted" | "Under Evaluation" | "Clarification" | "Negotiation" | "Awarded" | "Rejected" | "Withdrawn" | "Cancelled"; finalPrice: number; feedback: string; competitor: string; reason: string; resultDate: string; winningFactors: string[]; lossReasons: string[]; }
export interface Inquiry { id: string; channel: "WhatsApp" | "Email" | "Website"; from: string; company: string; subject: string; body: string; receivedAt: string; status: "New" | "Inquiry" | "Attached" | "Ignored"; extracted?: { client?: string; industry?: string; requirement?: string; reference?: string; deadline?: string; value?: number; location?: string }; linkedTenderId?: string; linkedOpportunityId?: string; }

export interface AuditEntry { id: string; at: string; user: string; action: string; entity: string; entityId: string; detail: string; }
export interface AILogEntry { id: string; at: string; user: string; model: string; promptVersion: string; task: string; sources: string[]; input: string; outputSummary: string; confidence: Confidence; reviewStatus: "Pending" | "Accepted" | "Rejected" | "Edited"; approver?: string; }
export interface Notification { id: string; at: string; kind: string; text: string; href: string; read: boolean; }
export interface User { id: string; name: string; email: string; role: string; active: boolean; }
export interface Org { id: string; name: string; industries: string[]; plan: string; currency: string; }

export interface VendorRating { id: string; project: string; date: string; price: number; quality: number; schedule: number; hse: number; comment: string; }
export interface Vendor { id: string; name: string; type?: string; industry?: string; country?: string; categories: string[]; products?: string[]; notes: string; ratings: VendorRating[];
  certifications?: { name: string; expiry?: string }[]; licences?: string[]; equipment?: string[]; employees?: number; revenue?: number; previousBids?: number; contracts?: number; }

export interface ProcPackage { id: string; tenderId?: string; name: string; category: "Material" | "Equipment" | "Software" | "Services" | "Subcontractors" | "Logistics" | "Other"; requirement: string; status: "Requirement" | "RFQ sent" | "Quotations" | "Evaluation" | "Approval" | "Purchased"; recommendedVendorId?: string; weights: { price: number; lead: number; quality: number; compliance: number }; }
export interface Quotation { id: string; packageId: string; vendorId: string; price: number; currency: string; leadWeeks: number; quality: 1 | 2 | 3 | 4 | 5; compliance: number; scope: string; notes: string; receivedAt: string; }

export interface Doc { tenderId?: string; id: string; name: string; size: number; rev: number; kind: string; status: "INDEXED" | "PROCESSING" | "FAILED"; uploadedAt: string; uploadedBy?: string; language?: string; confidentiality?: "Public" | "Internal" | "Confidential" | "Restricted"; permissions?: string[]; history?: { rev: number; at: string; by: string; note: string }[]; analysis?: Record<string, string>; }

export type ReviewStatus = "Draft" | "Internal Review" | "Approved" | "Answered" | "Closed" | "Pending" | "Rejected";
export type Confidence = "High" | "Medium" | "Low";
export interface Clarification { tenderId?: string;
  id: string; n: number; ref: string; round: number; category: "Technical" | "Commercial" | "Contractual";
  title: string; analysis: string; status: ReviewStatus; confidence: Confidence; flag?: string;
  assignee: string; due: string; author: string; createdAt: string; pending: boolean; clientAnswer?: string; ourReply?: string;
}

export interface Clause { tenderId?: string;
  id: string; n: number; ref: string; title: string; category: string; relevance: "High" | "Medium" | "Low";
  markup: string; analysis: string; status: ReviewStatus; confidence: Confidence; pending: boolean; author: string; createdAt: string;
}

export interface Qualification { tenderId?: string;
  id: string; n: number; ref: string; text: string; rationale: string; category: "Technical" | "Commercial" | "Contractual";
  type: "Qualification" | "Deviation"; status: "Open" | "Closed"; trust: Confidence; linked?: string; pending: boolean; draft: boolean;
  technicalImpact?: string; commercialImpact?: string; risk?: "High" | "Medium" | "Low"; approval?: "Not requested" | "Pending" | "Approved" | "Rejected";
  assignee: string; due: string; task: "To do" | "In progress" | "Done";
}

export type Severity = "Very High" | "High" | "Medium" | "Low";
export interface Risk { tenderId?: string;
  id: string; n: number; kind: "Risk" | "Opportunity"; title: string; description: string; category: string;
  probability: number; impact: number; postProbability: number; postImpact: number; owner: string; status: "Open" | "Closed" | "Mitigated";
  mitigation: string; contingency: number;
}

export interface Deliverable { tenderId?: string; id: string; n: number; name: string; type: "Technical" | "Commercial"; owner: string; status: "Not started" | "Drafting" | "Review" | "Approved"; due: string; }

export interface CostLine { tenderId?: string; id: string; wbs: string; description: string; category: string; qty: number; unit: string; rate: number; hours?: number; contingency: number; }
export interface Milestone { tenderId?: string; id: string; name: string; pct: number; date: string; }

export interface Competitor { tenderId?: string; id: string; name: string; capability: number; pricing: number; track: number; vessels: string[]; note: string; }
export interface Lesson { id: string; tender: string; outcome: "Won" | "Lost" | "No bid"; lesson: string; date: string; }

export interface ChatMsg { id: string; tenderId?: string; agent: string; role: "user" | "assistant"; text: string; at: string; streaming?: boolean; simulated?: boolean; }
export interface Profile { name: string; email: string; model: "Lite" | "Max"; }

export interface SubmissionRecord { id: string; tenderId: string; version: number; at: string; by: string; method: "Portal" | "Email" | "Hand delivery" | "Courier"; confirmation: string; files: string[]; checklist: { label: string; ok: boolean }[]; }
