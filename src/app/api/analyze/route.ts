import { NextRequest } from "next/server";
import { completeJSON, provider, providerLabel } from "@/lib/server/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_CHARS = 180_000; // ~45k tokens; enough for typical tender volumes, chunk beyond this

/** Extract plain text from an uploaded file (PDF, DOCX, TXT/MD/CSV). Returns text plus page markers for PDFs. */
async function extractText(file: File): Promise<{ text: string; pages: number }> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (b: Buffer, o?: object) => Promise<{ text: string; numpages: number }>;
    let pageNo = 0;
    const data = await pdfParse(buf, { pagerender: (page: { getTextContent: () => Promise<{ items: { str: string }[] }> }) => page.getTextContent().then((tc) => `\n\n[[PAGE ${++pageNo}]]\n` + tc.items.map((i) => i.str).join(" ")) });
    return { text: data.text, pages: data.numpages };
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: buf });
    return { text: r.value, pages: Math.max(1, Math.round(r.value.length / 3000)) };
  }
  return { text: buf.toString("utf8"), pages: 1 };
}

const SYSTEM = `You are the document-intelligence engine of VendorIQ, a tender & bid platform used by contractors across industries.
You read tender documents (ITT/RFP/RFQ/SOW/contracts) and return STRICT JSON only — no prose outside the JSON.
Rules: every finding must cite where it comes from (page marker [[PAGE n]] and the section/clause number as written). Never invent facts; if something is not stated, write "not stated". Flag ambiguities, conflicts, missing information and copy-paste errors in the document. Quantities and numbers must be quoted exactly. Keep each text field concise (max ~60 words).`;

const TENDER_SCHEMA = `Return JSON with exactly these keys:
{
 "general": {"title":"","reference":"","client":"","issuer":"","project":"","industry":"one of: oil-gas, infrastructure, construction, manufacturing, engineering, energy, renewables, utilities, telecom, it, government, healthcare, pharma, transport, logistics, mining, real-estate, fm, industrial, water, defense, education, consulting, professional, trading, other","service":"","location":"","tenderType":"one of: Tender, RFP, RFQ, RFI, ITT, EOI, Prequalification, Framework Agreement, Government Procurement, Private Procurement, Direct Opportunity, Subcontract Opportunity, Vendor Registration, Partner Opportunity","contractType":"","pricingBasis":"","submissionDeadline":"YYYY-MM-DD or not stated","duration":"","value":"","currency":"","keyDates":[""]},
 "summary": {"Executive Summary":[""],"Scope Summary":[""],"Key Requirements":[""],"Important Dates":[""],"Commercial Requirements":[""],"Technical Requirements":[""],"Legal Requirements":[""],"Compliance Requirements":[""],"Missing Information":[""],"Potential Risks":[""],"Questions for Client":[""]},
 "requirements":[{"text":"","category":"one of: Technical, Commercial, Legal, Financial, Administrative, Compliance, HSE, Quality, Experience, Personnel, Equipment, Material, Delivery, Schedule, Warranty, Insurance, Licensing, Certification, Local content, Security, Data/privacy, Environmental, Sustainability, Other","priority":"Must|Should|Could","page":1,"section":"","clause":"","evidence":"what evidence the bidder must provide","confidence":"High|Medium|Low"}],
 "contractTerms":[{"term":"one of: Payment Terms, Payment Milestones, Retention, Warranty, Liability, Indemnity, Insurance, Performance Bond, Advance Payment, Liquidated Damages, Termination, Dispute Resolution, Governing Law, Intellectual Property, Confidentiality, Change Orders, Force Majeure, Subcontracting, Penalty Clauses, Delivery Obligations, Acceptance Criteria","finding":"","risk":"High|Medium|Low","source":"section + page"}],
 "clauses":[{"ref":"","title":"","category":"Liability|Payment|LD & Delay|Insurance|Variations|Termination|IP|Scope|Other","relevance":"High|Medium|Low","markup":"proposed qualification/redline","analysis":"why it matters","page":1}],
 "clarifications":[{"ref":"section","category":"Technical|Commercial|Contractual","title":"","question":"precise question to the client","page":1,"confidence":"High|Medium|Low"}],
 "risks":[{"title":"","description":"","category":"Technical|Commercial|Financial|Legal|Contract|Procurement|Schedule|Operational|HSE|Environmental|Cybersecurity|Resource|Reputation|Supply Chain","probability":1,"impact":1,"mitigation":""}],
 "compliance":[{"item":"","evidence":"","source":"section + page"}],
 "deliverables":[{"name":"","type":"Technical|Commercial","source":"section + page"}],
 "quantities":[{"item":"","qty":0,"unit":"","source":"section + page"}],
 "recommendation":{"verdict":"GO|CONDITIONAL GO|NO-GO","reasoning":"3-5 sentences with the decisive factors","conditions":[""]}
}
Aim for 12-30 requirements, 6-12 clarifications, 6-12 risks, 8-15 compliance items. Probability/impact are 1-5.`;

const DOC_SCHEMA = `Return JSON: {"Title":"","Reference":"","Client":"","Issuer":"","Project":"","Industry":"","Location":"","Dates":"","Value":"","Currency":"","Duration":"","Tender type":"","Document type":"","Pages":"","Key sections":""}. Use "not stated" where absent.`;

export async function POST(req: NextRequest) {
  if (!provider()) return Response.json({ error: "no_credentials" }, { status: 503 });
  const ct = req.headers.get("content-type") || "";
  let text = "", name = "document", mode = "tender", pages = 0; let context: Record<string, unknown> = {};
  try {
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file"); mode = String(form.get("mode") || "document");
      if (!(file instanceof File)) return Response.json({ error: "file missing" }, { status: 400 });
      name = file.name; const ex = await extractText(file); text = ex.text; pages = ex.pages;
      if (mode === "extract") return Response.json({ name, text, pages });
    } else {
      const body = await req.json(); text = String(body.text || ""); name = body.name || name; mode = body.mode || "tender"; context = body.context || {};
    }
  } catch (e) { return Response.json({ error: `Could not read file: ${e instanceof Error ? e.message : "unknown"}` }, { status: 400 }); }
  if (mode === "draft") {
    // Draft prose sections (proposal / engineering) grounded in the workspace context + document text.
    const body = context as { sections?: string[]; kind?: string; tender?: unknown; facts?: unknown };
    const sections = (body.sections || []).slice(0, 12);
    if (!sections.length) return Response.json({ error: "sections[] required" }, { status: 400 });
    try {
      const out = await completeJSON<{ sections: { title: string; body: string }[] }>(
        `You draft ${body.kind || "technical proposal"} sections for a bidder. Write in confident, specific, professional prose grounded ONLY in the supplied tender facts and document text; where a fact is unknown write "[to confirm: …]". 120–220 words per section, plain paragraphs (no headings inside). Return strict JSON.`,
        `Return JSON {"sections":[{"title":"","body":""}]} for these titles: ${JSON.stringify(sections)}.\n\nTENDER FACTS: ${JSON.stringify(body.tender || {})}\nWORKSPACE FACTS: ${JSON.stringify(body.facts || {})}\n\nDOCUMENT TEXT:\n${text.slice(0, 60_000) || "(none indexed)"}`, 6000);
      return Response.json({ sections: out.sections || [], provider: providerLabel() });
    } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "draft failed" }, { status: 502 }); }
  }
  if (!text.trim()) return Response.json({ error: "No extractable text (scanned PDF? run OCR first)." }, { status: 422 });
  const clipped = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + "\n\n[[TRUNCATED — document exceeds analysis window]]" : text;
  try {
    if (mode === "document") {
      const analysis = await completeJSON<Record<string, string>>(SYSTEM, `${DOC_SCHEMA}\n\nDOCUMENT "${name}":\n${clipped}`, 1500);
      return Response.json({ name, pages, text, analysis, provider: providerLabel() });
    }
    const result = await completeJSON<Record<string, unknown>>(SYSTEM, `${TENDER_SCHEMA}\n\nORGANISATION CONTEXT (bidder): ${JSON.stringify(context)}\n\nTENDER DOCUMENTS:\n${clipped}`, 12000);
    return Response.json({ result, provider: providerLabel(), chars: text.length, truncated: text.length > MAX_CHARS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return Response.json({ error: msg === "no_credentials" ? "No AI provider configured" : msg }, { status: 502 });
  }
}
