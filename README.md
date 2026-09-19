# VendorIQ — AI-Powered Multi-Industry Tender, Bid & Procurement Intelligence Platform

CRM + Tender Intelligence + AI Document Intelligence + Compliance + Bid Qualification + Risk + Engineering + Procurement + Costing + Pricing + Proposals + Submission + Competitor Intelligence + Project ERP.

**Industry-agnostic at the core, industry-specialised through configurable templates.** Full product spec: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md). Invoices & payments are deliberately out of scope for now.

Built with Next.js 15 (App Router), TypeScript, Tailwind v4, lucide-react, zustand.

## Run
```bash
npm install
npm run dev      # http://localhost:3000  (landing)  ·  /app  (platform)
npm run build
```

## Architecture

| Path | What |
|---|---|
| `src/lib/industries.ts` | **Industry template layer.** 25 industries × services, compliance items, cost/risk categories, engineering sections, proposal sections, document types. Plus tender types, requirement categories, contract terms, Go/No-Go criteria, review stages, roles. The core never branches on an industry name. |
| `src/lib/useIndustries.ts` | Built-in templates merged with org-defined overrides from Administration → Industry Templates. |
| `src/store/types.ts` | Domain model: Tender (industry, tenderType, stage, goNoGo…), Company, Contact, Opportunity, Requirement (with source doc/page/clause), ComplianceItem, Capability, AISummary, Review, Approval, PriceVersion, ProposalSection, BidResult, Inquiry, Contract, Project, AuditEntry, AILogEntry, Notification, User, Org. |
| `src/store/seed.ts`, `seed2.ts` | Demo data across Oil & Gas, Infrastructure and IT tenders. |
| `src/store/useStore.ts` | zustand store (persisted in `localStorage`, key `vendoriq-tenderos`, v2). All CRUD actions, audit logging, AI logging, notifications, `tenderHealth()` and `goNoGoVerdict()` computed from real records. |
| `src/components/app/nav.ts` | Grouped navigation: Dashboard · CRM · Tender Intelligence · Active Workspace · Governance · ERP · Intelligence · Administration. |
| `src/app/app/tenders/[id]/` | **Tender Workspace**: header (ref, client, industry, type, deadline, value, owner, status, Go/No-Go, health), 20 tabs, right sidebar (deadline, health factors, Go/No-Go, AI review, missing docs, risk, pricing, readiness). |
| `src/app/(marketing)/` | Industry-neutral landing: Home, Platform, Industries, CRM, Pricing, About, legal. |
| `src/config/brand.ts` | Company / product names — change once. |

## Key behaviours implemented
- **Global industry filter** (top bar) applied to dashboard, tenders, opportunities, companies and reports.
- **Source-based AI**: requirements carry source doc, page, section, clause, confidence and enter as *Needs Verification*; approve / reject / edit / assign reviewer. AI summary and contract-terms review cite sources and flag terms not found. Every run is logged in AI Governance.
- **Capability matching**: tender requirements and compliance items vs. *Our Capabilities* → MATCHED / MISSING / EXPIRED / UNKNOWN / PARTIAL / NEEDS VERIFICATION.
- **Go/No-Go engine**: 15 scored criteria → GO / CONDITIONAL GO / NO-GO with management override + reason → approval request.
- **Pricing**: versioned; approval → lock; any change = new version.
- **Reviews & approvals**: 7 review stages; approvals for Go/No-Go, pricing, proposals, submission; all audited.
- **Bid result → win/loss analytics → lessons learned → contract → project.**
- **Inquiry intake**: Mark as Inquiry / attach to existing tender or opportunity / create new opportunity (no duplicates).
- **Administration**: Industry Template Builder, Users & Roles (16 roles, permission matrix), immutable Audit Trail, AI Governance log.
- Legacy Bravo-style modules (clarifications, contract register, qualifications, risk register & 5×5, deliverables, cost build-up, procurement tabulation, competition, presentations, submission, action board, agent chat) live under the active workspace.

- **Per-tender scoping**: every workspace module (documents, clarifications, contract register, qualifications, risks, deliverables, costing, procurement, competition) is filtered to the active tender via `useScopedStore()`; new records inherit the active tender.
- **Document management**: type (from industry template), version history, language, confidentiality, permissions, uploader, per-document "Analyze" (AI general-information extraction, logged).
- **Vendors & Partners**: generic partner types (Contractor, Supplier, Manufacturer, Consultant, JV, Technology Partner…), industry, certifications with expiry, licences, equipment, size, track record, ratings.
- **Procurement**: store-driven Requirement → RFQ → Quotations → weighted Evaluation → Recommend award → Procurement approval, across material/equipment/software/services/subcontractors/logistics.
- **Submission**: readiness checks, management approval, assemble package, record submission (version, timestamp, by, method, confirmation), manifest + checklist export.
- **Templates** also carry custom tender fields (shown on Overview) and clarification question templates.

## Landing theme & animation
Light / dark / system toggle plus five accent themes (Ember, Ocean, Emerald, Violet, Rose) via the nav controls, persisted in `localStorage` and applied pre-paint by an inline boot script (`src/components/marketing/Theme.tsx`). URL params `?theme=dark&accent=blue` preset them for demos. Scroll-reveal (`.reveal`), floating hero cards, gradient headline, lifecycle marquee; all honour `prefers-reduced-motion`.

## Charts
`src/components/app/charts.tsx`: animated horizontal bars, columns, donut, area/line with crosshair tooltip, KPI count-up. Categorical palette is fixed-order and validated (dataviz six checks) against the dark surface.

## Real document analysis
`POST /api/analyze` (`src/app/api/analyze/route.ts`) extracts text server-side from PDF (`pdf-parse`), DOCX (`mammoth`) or text files, then asks the LLM (Anthropic → Groq fallback, `src/lib/server/llm.ts`) for strict JSON: general info, executive summary, cited requirements (page/section/clause), contract-term review, clause positions, clarifications, risks, compliance items, deliverables, quantities and a reasoned Go/No-Go recommendation. `runTenderAnalysis()` in the store writes everything as AI-pending into the registers. Uploads in Documents are indexed on the spot; "Analyze" runs per-document extraction.

Demo tender **t5 — Smart Water Meters, Dhahran Community (Saudi Aramco GSC 8142331)** ships with the real SOW text indexed and a human-verified review (31 requirements, 10 clarifications, 5 clause positions, 10 risks, 12 compliance items, CONDITIONAL GO).

## Agent chat (Claude API)
Chat mode talks to specialist agents grounded in the active tender's data. `POST /api/chat` (`src/app/api/chat/route.ts`) streams a reply from `claude-opus-5` via the official `@anthropic-ai/sdk`, with the workspace snapshot as cached system context and persona rules (cite sources, never fabricate, drafts need human acceptance). Providers (first configured wins): `ANTHROPIC_API_KEY` → Claude via the official SDK; else `GROQ_API_KEY` (+ optional `GROQ_MODEL`, default `openai/gpt-oss-120b`) → Groq's OpenAI-compatible streaming endpoint. Put keys in `.env.local` (gitignored; see `.env.example`). With neither, the UI shows a clearly labelled offline summary. Every reply is logged in AI Governance.

## Build alongside a dev server
`BUILD_DIR=.next-build npm run build` — avoids clashing with `npm run dev`'s `.next`.

## Not yet built (next steps)
1. Backend (spec: Laravel API + Postgres) replacing the zustand store; n8n intake for WhatsApp/email/website.
2. Real auth / SSO and per-organisation tenancy enforcement server-side.
3. LLM wiring for proposal drafting and the register "Generate" buttons (analysis, extraction and chat are wired).
4. True DOCX/XLSX/PPTX/ZIP package export (currently CSV / HTML-doc / JSON manifest).
5. Approval-workflow builder and configurable Go/No-Go weights in the template builder.
6. Invoices & payments (deferred by product owner).
