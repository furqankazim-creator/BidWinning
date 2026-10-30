/**
 * Gives an account realistic dummy workspaces (tender + documents with text + requirements + compliance + risks + actions),
 * saved exactly as the app saves them, so dashboards and the admin's bidder view have content.
 *   npm run seed:demo -- bidder@bidwinning.local      → 1 workspace for a Bidder
 *   npm run seed:demo -- timeglobaltech@gmail.com     → 5 workspaces + CRM pipeline for an admin
 * Safe to re-run: it replaces only the dummy records it created (ids start with "demo-" or "adm<n>-").
 */
import "dotenv/config";
import mongoose from "mongoose";
import { User, Record as DataRecord } from "./models/index.js";
import { mirrorRecords } from "./mirror.js";

const iso = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const day = (d: number) => iso(d).slice(0, 10);
type Row = Record<string, unknown>;
interface Spec {
  p: string; // id prefix
  tender: Row;
  docs: { name: string; kind: string; text: string; size: number; pages: number }[];
  reqs: [text: string, category: string, priority: "Must" | "Should" | "Could", clause: string, status: string, docIdx: number, page: number][];
  comps: [item: string, status: string, evidence: string, owner: string, expiry?: number][];
  risks: [kind: "Risk" | "Opportunity", title: string, description: string, category: string, p: number, i: number, mitigation: string, contingency: number][];
  acts: [title: string, status: string, due: number, priority: string][];
  clarification: { ref: string; category: string; title: string; analysis: string };
}

const scores = (v: number[]) => Object.fromEntries(["Strategic fit", "Technical capability", "Experience", "Compliance", "Financial attractiveness", "Expected margin", "Resource availability", "Schedule", "Location", "Competition", "Client relationship", "Contract risk", "Payment terms", "Probability of winning", "Required investment"].map((k, i) => [k, v[i]]));
const base = { progress: 0, status: "Active Campaign", scope: "Full scope", clientTerm: "Employer", bidder: "Sole bidder" };

const WATER: Spec = {
  p: "demo",
  tender: { ...base, id: "demo-t1", name: "Smart Water Metering — Riyadh Phase 2", reference: "RFP-RMS-2026-014", client: "Riyadh Municipal Water Authority", description: "Supply, installation and commissioning of 48,000 ultrasonic smart water meters with an AMI head-end system.", value: 18500000, currency: "SAR", closing: day(21), progress: 45, stage: "Bid Preparation", industry: "infrastructure", service: "Smart metering", tenderType: "RFP", region: "Middle East", goNoGo: "CONDITIONAL GO", goNoGoReason: "Strong fit; liability clause and 40% local content need a mitigation plan.", goNoGoScores: scores([5, 4, 4, 3, 4, 3, 3, 3, 4, 3, 3, 2, 4, 3, 3]), metadata: { "Bid bond": "2%", "Contract duration": "24 months" }, createdAt: iso(-12) },
  docs: [
    { name: "RFP-RMS-2026-014 Main Document.pdf", kind: "RFP", size: 2_480_000, pages: 86, text: `REQUEST FOR PROPOSAL — RFP-RMS-2026-014\nRiyadh Municipal Smart Water Metering Programme (Phase 2)\n\n1. SCOPE OF WORK\n1.1 The Contractor shall supply, install and commission 48,000 ultrasonic smart water meters (DN15–DN50) across the northern districts of Riyadh.\n1.2 The Contractor shall deliver an AMI head-end system with 15-minute reading intervals and integrate it with the Employer's SCADA via IEC 60870-5-104.\n1.3 All meters shall comply with ISO 4064 Class R160 and carry SASO conformity certification.\n\n2. COMMERCIAL TERMS\n2.1 Prices shall be quoted in SAR, fixed for the full contract duration (24 months).\n2.2 Performance security of 10% of the contract value shall be provided within 14 days of award.\n2.3 Liquidated damages: 0.5% of contract value per week of delay, capped at 10%.\n2.4 Payment: 30% advance against bank guarantee, 60% on delivery milestones, 10% after final acceptance.\n\n3. QUALIFICATION\n3.1 Bidders shall have completed at least two projects of 20,000+ smart meters in the last five years.\n3.2 Bidders shall hold valid ISO 9001 and ISO 14001 certificates.\n3.3 Minimum 40% local content (IKTVA) shall be demonstrated.\n\n4. SUBMISSION\n4.1 Proposals are due 12:00 noon on the closing date. Late submissions will not be considered.\n4.2 Technical and commercial envelopes shall be submitted separately.` },
    { name: "Special Conditions of Contract.pdf", kind: "Contract", size: 640_000, pages: 24, text: `SPECIAL CONDITIONS OF CONTRACT\n14. Warranty: 36 months from final acceptance; defective meters replaced within 10 working days.\n15. Limitation of liability: Contractor liability is unlimited for gross negligence; otherwise capped at 100% of the contract value.\n16. Termination: Employer may terminate for convenience with 30 days notice; no loss of profit payable.\n17. Data ownership: all meter data and AMI configuration belong to the Employer.` },
    { name: "Bill of Quantities.xlsx", kind: "BOQ", size: 310_000, pages: 6, text: `BILL OF QUANTITIES (summary)\nItem 1  Ultrasonic meter DN15  — 36,000 pcs\nItem 2  Ultrasonic meter DN20  — 8,000 pcs\nItem 3  Ultrasonic meter DN25–DN50 — 4,000 pcs\nItem 4  AMI head-end software licence — 1 lot\nItem 5  Data concentrators / gateways — 220 pcs\nItem 6  Installation, commissioning and training — 1 lot` },
  ],
  reqs: [
    ["Supply, install and commission 48,000 ultrasonic smart water meters (DN15–DN50).", "Technical", "Must", "1.1", "Approved", 0, 12],
    ["AMI head-end with 15-minute reading intervals, integrated with SCADA via IEC 60870-5-104.", "Technical", "Must", "1.2", "Needs Verification", 0, 13],
    ["Meters shall comply with ISO 4064 Class R160 and carry SASO certification.", "Compliance", "Must", "1.3", "Compliant", 0, 14],
    ["Prices in SAR, fixed for the 24-month contract duration.", "Commercial", "Must", "2.1", "Approved", 0, 20],
    ["Performance security of 10% of contract value within 14 days of award.", "Commercial", "Must", "2.2", "Needs Verification", 0, 21],
    ["At least two projects of 20,000+ smart meters completed in the last five years.", "Qualification", "Must", "3.1", "Partial", 0, 30],
    ["Demonstrate minimum 40% local content (IKTVA).", "Qualification", "Must", "3.3", "Non-Compliant", 0, 31],
    ["Contractor liability capped at 100% of contract value except gross negligence.", "Contractual", "Should", "15", "Needs Verification", 1, 3],
  ],
  comps: [["ISO 9001 Quality Management certificate", "Compliant", "Cert #QMS-2291, Bureau Veritas", "Quality Lead", 240], ["ISO 14001 Environmental certificate", "Expired", "Cert expired — renewal in progress", "HSE Lead", -20], ["SASO conformity certificate for meters", "Compliant", "SASO-2026-5521", "Technical Lead", 300], ["IKTVA local content plan (40%)", "Missing", "Plan not yet drafted", "Bid Manager"], ["Two reference projects, 20,000+ meters", "Partially Compliant", "One reference verified (Jeddah, 32,000 meters)", "Bid Manager"]],
  risks: [["Risk", "Unlimited liability for gross negligence", "Clause 15 exposes the contractor beyond the 100% cap.", "Contractual", 3, 4, "Request clarification; propose mutual cap and insurance cover.", 150000], ["Risk", "Local content below 40%", "Current plan reaches ~28%; meter assembly is imported.", "Commercial", 4, 4, "Partner with a local assembler; claim installation labour toward IKTVA.", 250000], ["Risk", "Fixed pricing for 24 months", "Component cost inflation on ultrasonic transducers.", "Commercial", 3, 3, "Forward-buy transducers; add 3% escalation contingency.", 120000], ["Opportunity", "Follow-on O&M contract", "Phase 2 award positions the bidder for a 5-year O&M contract.", "Strategic", 3, 4, "Include O&M option pricing in the commercial envelope.", 0]],
  acts: [["Request clarification on liability clause 15", "To Do", 3, "High"], ["Draft IKTVA local content plan", "In Progress", 7, "High"], ["Renew ISO 14001 certificate", "In Progress", 10, "Medium"], ["Finalise pricing and bid bond", "To Do", 15, "Medium"]],
  clarification: { ref: "SCC §15", category: "Contractual", title: "Liability cap for gross negligence", analysis: "Clause 15 makes liability unlimited for gross negligence; request a cap aligned to 100% of contract value." },
};

const PLATFORM: Spec = {
  p: "adm1",
  tender: { ...base, id: "adm1-t1", name: "Offshore Platform Maintenance — Jubail Field", reference: "ITT-GE-2026-203", client: "Gulf Energy Company", description: "Five-year integrated maintenance, inspection and shutdown support for 6 offshore wellhead platforms.", value: 64000000, currency: "USD", closing: day(34), progress: 30, stage: "Qualification", industry: "oil-gas", service: "Maintenance & inspection", tenderType: "ITT", region: "Middle East", goNoGo: "Pending", goNoGoScores: scores([4, 4, 5, 3, 4, 3, 3, 3, 4, 2, 4, 3, 3, 3, 2]), metadata: { "Bid bond": "1.5%", "Contract duration": "60 months" }, createdAt: iso(-8) },
  docs: [
    { name: "ITT-GE-2026-203 Invitation to Tender.pdf", kind: "ITT", size: 3_100_000, pages: 112, text: `INVITATION TO TENDER — ITT-GE-2026-203\nIntegrated Offshore Maintenance Services, Jubail Field\n\n1. SCOPE\n1.1 Planned and corrective maintenance for six (6) offshore wellhead platforms (JWP-1 to JWP-6).\n1.2 Annual inspection campaign including NDT, structural integrity assessment and corrosion monitoring.\n1.3 Support for two major shutdowns (turnarounds) of up to 28 days each during the contract term.\n\n2. TERM AND PRICING\n2.1 Initial term of 60 months with an option to extend for 24 months.\n2.2 Pricing as a lump-sum for planned work plus a schedule of rates for corrective work.\n2.3 Annual price adjustment limited to 70% of the published labour index.\n\n3. QUALIFICATION\n3.1 Minimum TRIR of 0.5 over the last three years.\n3.2 At least five years of offshore maintenance experience in the Arabian Gulf.\n3.3 ISO 45001 certified HSE management system.` },
    { name: "HSE and Offshore Safety Requirements.pdf", kind: "Specification", size: 1_240_000, pages: 38, text: `HSE AND OFFSHORE SAFETY REQUIREMENTS\n4.1 All offshore personnel shall hold valid BOSIET/FOET and medical certification.\n4.2 Permit-to-work system compliant with the Company's PTW standard; no hot work without gas testing.\n4.3 Contractor shall submit a project HSE plan within 30 days of award and report incidents within 2 hours.\n4.4 Zero-tolerance policy for stop-work-authority violations.` },
    { name: "Commercial Terms and Conditions.pdf", kind: "Contract", size: 880_000, pages: 41, text: `COMMERCIAL TERMS AND CONDITIONS\n9. Payment: net 60 days from approved invoice.\n10. Liquidated damages for shutdown overrun: USD 25,000 per day, capped at 8% of the shutdown value.\n11. Insurance: contractor to carry USD 20M general liability and full marine cover.\n12. Parent company guarantee required.` },
  ],
  reqs: [
    ["Planned and corrective maintenance for six offshore wellhead platforms.", "Technical", "Must", "1.1", "Approved", 0, 14],
    ["Annual NDT and structural integrity inspection campaign.", "Technical", "Must", "1.2", "Needs Verification", 0, 15],
    ["Support two shutdowns of up to 28 days each.", "Technical", "Must", "1.3", "Needs Verification", 0, 16],
    ["Annual price adjustment limited to 70% of the labour index.", "Commercial", "Must", "2.3", "Needs Verification", 0, 22],
    ["TRIR not exceeding 0.5 over the last three years.", "Qualification", "Must", "3.1", "Partial", 0, 30],
    ["ISO 45001 certified HSE management system.", "Compliance", "Must", "3.3", "Compliant", 0, 31],
    ["All offshore personnel hold BOSIET/FOET and valid medical.", "HSE", "Must", "4.1", "Compliant", 1, 4],
    ["Shutdown overrun LDs of USD 25,000/day capped at 8%.", "Contractual", "Should", "10", "Needs Verification", 2, 6],
    ["Parent company guarantee.", "Contractual", "Must", "12", "Needs Verification", 2, 8],
  ],
  comps: [["ISO 45001 HSE management certificate", "Compliant", "Cert #OHS-7710", "HSE Manager", 410], ["BOSIET/FOET register (offshore crew)", "Needs Review", "14 of 62 certificates expire within 90 days", "HSE Manager", 60], ["TRIR 3-year record ≤ 0.5", "Partially Compliant", "2025 TRIR 0.62 — explanation letter needed", "HSE Manager"], ["Parent company guarantee", "Missing", "Draft with legal", "Legal"], ["General liability insurance USD 20M", "Compliant", "Policy GL-5521", "Finance", 200]],
  risks: [["Risk", "Shutdown overrun liquidated damages", "USD 25k/day LDs for overruns across two 28-day shutdowns.", "Schedule", 3, 5, "Early materials procurement; dedicated shutdown planner; add schedule float.", 600000], ["Risk", "Labour index adjustment capped at 70%", "Wage inflation above the index erodes margin over 60 months.", "Commercial", 4, 3, "Price in a 2% annual escalation reserve.", 900000], ["Risk", "TRIR above threshold in 2025", "Bid could be marked non-compliant at qualification.", "Compliance", 3, 4, "Submit incident analysis and corrective-action evidence.", 0], ["Opportunity", "Extension option and adjacent fields", "24-month extension and two adjacent fields could lift value above USD 90M.", "Strategic", 3, 5, "Offer fixed extension rates in the commercial offer.", 0]],
  acts: [["Prepare TRIR explanation letter", "To Do", 5, "High"], ["Confirm crew certificate renewals", "In Progress", 12, "Medium"], ["Obtain parent company guarantee draft", "To Do", 14, "High"], ["Complete Go/No-Go scoring with leadership", "To Do", 9, "High"]],
  clarification: { ref: "T&C §10", category: "Contractual", title: "Shutdown LD cap and exclusions", analysis: "Request exclusion of client-caused delays and weather downtime from the LD calculation." },
};

const METRO: Spec = {
  p: "adm2",
  tender: { ...base, id: "adm2-t1", name: "Metro Line Signalling Upgrade — Phase 1", reference: "RFQ-MTA-2026-087", client: "Metropolitan Transit Authority", description: "Supply and installation of CBTC signalling equipment for 14 stations including testing and training.", value: 27500000, currency: "USD", closing: day(-9), progress: 100, stage: "Submitted", industry: "infrastructure", service: "Rail signalling", tenderType: "RFQ", region: "Middle East", goNoGo: "GO", goNoGoReason: "Core competence and strong client relationship.", goNoGoScores: scores([5, 5, 5, 4, 4, 4, 4, 4, 5, 3, 5, 3, 4, 4, 3]), metadata: { "Bid bond": "2%", "Validity": "180 days" }, createdAt: iso(-55) },
  docs: [
    { name: "RFQ-MTA-2026-087 Request for Quotation.pdf", kind: "RFQ", size: 1_900_000, pages: 64, text: `REQUEST FOR QUOTATION — RFQ-MTA-2026-087\nMetro Line 2 CBTC Signalling Upgrade — Phase 1\n\n1. The Supplier shall supply and install CBTC wayside and onboard equipment for 14 stations.\n2. Equipment shall meet EN 50126/50128/50129 and be certified SIL 4.\n3. Bid validity: 180 days. Bid security: 2% of the bid price.\n4. Delivery: first equipment on site within 9 months of notice to proceed; completion within 22 months.\n5. Evaluation: 60% technical, 40% price. Minimum technical score of 70 to qualify.` },
    { name: "Technical Specification — CBTC.pdf", kind: "Specification", size: 2_700_000, pages: 95, text: `TECHNICAL SPECIFICATION — CBTC\n3.1 Headway: 90 seconds minimum design headway at line capacity.\n3.2 Availability: system availability of 99.98%.\n3.3 Interfaces: interlocking, ATS, SCADA and platform screen doors per Annex B.\n3.4 Cybersecurity: IEC 62443 SL-2 for all networked components.` },
  ],
  reqs: [
    ["Supply and install CBTC wayside and onboard equipment for 14 stations.", "Technical", "Must", "1", "Compliant", 0, 5],
    ["Equipment certified SIL 4 per EN 50126/50128/50129.", "Compliance", "Must", "2", "Compliant", 0, 6],
    ["Design headway of 90 seconds.", "Technical", "Must", "3.1", "Compliant", 1, 8],
    ["System availability 99.98%.", "Technical", "Must", "3.2", "Partial", 1, 9],
    ["IEC 62443 SL-2 cybersecurity.", "Compliance", "Should", "3.4", "Compliant", 1, 12],
  ],
  comps: [["SIL 4 product certificates", "Compliant", "TÜV certificate 2025", "Technical Lead", 500], ["Bid security 2%", "Compliant", "Issued by National Bank", "Finance", 180]],
  risks: [["Risk", "Availability target 99.98%", "Target is above the proven fleet average of 99.95%.", "Technical", 2, 4, "Offer redundant onboard units; document MTBF evidence.", 200000], ["Opportunity", "Phase 2 and 3 extensions", "Award positions for the two follow-on phases.", "Strategic", 4, 5, "Keep unit rates valid for 3 years.", 0]],
  acts: [["Respond to evaluation clarification questions", "In Progress", 4, "High"], ["Prepare presentation for technical evaluation", "To Do", 8, "Medium"]],
  clarification: { ref: "Spec §3.2", category: "Technical", title: "Availability measurement method", analysis: "Clarify whether availability excludes planned maintenance windows." },
};

const SOLAR: Spec = {
  p: "adm3",
  tender: { ...base, id: "adm3-t1", name: "300 MW Solar PV Plant — Sakaka Extension", reference: "RFP-REN-2026-311", client: "National Renewable Energy Company", description: "EPC contract for a 300 MW ground-mounted solar PV plant with 33/380 kV substation and 25-year O&M option.", value: 210000000, currency: "USD", closing: day(40), progress: 55, stage: "Bid Preparation", industry: "renewables", service: "EPC", tenderType: "RFP", region: "Middle East", goNoGo: "GO", goNoGoReason: "Strong track record in utility-scale PV; grid connection date is the main schedule risk.", goNoGoScores: scores([5, 5, 4, 4, 4, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3]), metadata: { "Bid bond": "1%", "Contract duration": "20 months" }, createdAt: iso(-15) },
  docs: [
    { name: "RFP-REN-2026-311 Instructions to Bidders.pdf", kind: "RFP", size: 2_950_000, pages: 98, text: `REQUEST FOR PROPOSAL — RFP-REN-2026-311\n300 MW Solar PV Plant, Sakaka Extension\n\n1. SCOPE\n1.1 The Contractor shall design, supply, install and commission a 300 MW AC ground-mounted solar PV plant on an EPC basis.\n1.2 The works include a 33/380 kV substation and a 12 km 380 kV overhead line to the grid connection point.\n1.3 Modules shall be bifacial monocrystalline, minimum 21.5% efficiency, IEC 61215 and IEC 61730 certified.\n\n2. COMMERCIAL\n2.1 Lump-sum price in USD; 15% advance against bank guarantee.\n2.2 Liquidated damages for delay in COD: 0.1% of contract price per day, capped at 10%.\n2.3 Performance ratio guarantee of 82% measured over the first 12 months.\n\n3. QUALIFICATION\n3.1 At least one utility-scale solar project of 100 MW or more commissioned in the last five years.\n3.2 Minimum 30% local content (IKTVA).` },
    { name: "Technical Specification — PV Plant and Substation.pdf", kind: "Specification", size: 3_400_000, pages: 120, text: `TECHNICAL SPECIFICATION\n4.1 Plant availability guarantee: 99% annual.\n4.2 Inverters shall provide reactive power control and low-voltage ride-through per the grid code.\n4.3 SCADA shall be IEC 61850 compliant with a remote link to the national dispatch centre.\n4.4 Degradation guarantee: maximum 0.45% per year for the first 10 years.` },
    { name: "Draft EPC Contract Conditions.pdf", kind: "Contract", size: 1_120_000, pages: 52, text: `DRAFT EPC CONTRACT CONDITIONS\n8. Defects liability period: 24 months from COD.\n11. Liability cap: 100% of contract price; no cap for fraud or wilful misconduct.\n14. Force majeure excludes grid-operator delay unless notified within 7 days.\n18. Termination for convenience: Employer may terminate on 30 days notice with payment of work done only.` },
    { name: "Price Schedule.xlsx", kind: "BOQ", size: 420_000, pages: 8, text: `PRICE SCHEDULE (summary)\nItem 1  PV modules 300 MWp  — lump sum\nItem 2  Mounting structures and trackers — lump sum\nItem 3  Inverters and MV stations — lump sum\nItem 4  33/380 kV substation — lump sum\nItem 5  380 kV overhead line 12 km — lump sum\nItem 6  O&M years 1-5 — annual fee` },
  ],
  reqs: [
    ["Design, supply, install and commission a 300 MW AC ground-mounted solar PV plant.", "Technical", "Must", "1.1", "Approved", 0, 10],
    ["Construct a 33/380 kV substation and a 12 km 380 kV overhead line.", "Technical", "Must", "1.2", "Approved", 0, 11],
    ["Bifacial modules of at least 21.5% efficiency, IEC 61215 and IEC 61730 certified.", "Compliance", "Must", "1.3", "Compliant", 0, 12],
    ["Performance ratio guarantee of 82% over the first 12 months.", "Technical", "Must", "2.3", "Needs Verification", 0, 20],
    ["Delay LDs of 0.1% per day capped at 10% of contract price.", "Commercial", "Must", "2.2", "Needs Verification", 0, 19],
    ["One utility-scale solar project of 100 MW or more in the last five years.", "Qualification", "Must", "3.1", "Compliant", 0, 28],
    ["Minimum 30% local content (IKTVA).", "Qualification", "Must", "3.2", "Partial", 0, 29],
    ["Plant availability guarantee of 99% annually.", "Technical", "Must", "4.1", "Needs Verification", 1, 5],
    ["SCADA IEC 61850 compliant with link to national dispatch centre.", "Technical", "Should", "4.3", "Compliant", 1, 7],
    ["Force majeure excludes grid-operator delay unless notified within 7 days.", "Contractual", "Should", "14", "Needs Verification", 2, 9],
  ],
  comps: [["ISO 9001 Quality Management certificate", "Compliant", "Cert #QMS-3320", "Quality Lead", 300], ["ISO 45001 HSE certificate", "Compliant", "Cert #OHS-5512", "HSE Manager", 260], ["Bid bond 1%", "Needs Review", "Bank guarantee request submitted", "Finance", 90], ["Local content (IKTVA) certificate", "Needs Review", "Current score 24%, target 30%", "Procurement", 120], ["Module supplier Tier-1 warranty letter", "Compliant", "Letter received", "Technical Lead"]],
  risks: [["Risk", "Grid connection date slips", "Utility may not energise the 380 kV connection before COD, delaying acceptance and triggering LDs.", "Schedule", 3, 4, "Add a grid-delay relief clause; agree a connection programme at clarification stage.", 1800000], ["Risk", "Module price volatility", "Polysilicon prices could rise before the supply order is placed.", "Commercial", 3, 3, "Fix supplier price with a validity period; add escalation provision.", 2500000], ["Risk", "Local content shortfall", "Estimated 24% against the 30% requirement.", "Compliance", 4, 3, "Shift structure fabrication and cabling to local suppliers.", 600000], ["Opportunity", "25-year O&M follow-on", "Winning the EPC positions the bidder for the long-term O&M option.", "Commercial", 3, 4, "Include a competitive O&M offer in the proposal.", 0]],
  acts: [["Request clarification on grid-operator delay (clause 14)", "To Do", 4, "High"], ["Finalise module supplier price validity", "In Progress", 6, "High"], ["Prepare local content improvement plan", "In Progress", 9, "High"], ["Obtain bid bond from bank", "To Do", 15, "Medium"], ["Review LDs and performance ratio with technical team", "To Do", 12, "Medium"]],
  clarification: { ref: "EPC §14", category: "Contractual", title: "Relief for grid-operator delay", analysis: "Request time and cost relief where the grid operator delays energisation of the connection point beyond the agreed programme." },
};

const HOSPITAL: Spec = {
  p: "adm4",
  tender: { ...base, id: "adm4-t1", name: "Medical Gas & HVAC Systems — King Faisal Hospital", reference: "ITT-MOH-2026-054", client: "Ministry of Health Projects Directorate", description: "Design, supply and installation of medical gas pipeline systems and HVAC for a 600-bed hospital, including 3-year defects liability.", value: 42000000, currency: "SAR", closing: day(18), progress: 70, stage: "Final Review", industry: "healthcare", service: "MEP systems", tenderType: "ITT", region: "Middle East", goNoGo: "CONDITIONAL GO", goNoGoReason: "Good fit; operating-theatre HVAC experience needs a stronger reference.", goNoGoScores: scores([4, 4, 3, 4, 3, 3, 4, 3, 5, 3, 3, 3, 4, 3, 3]), metadata: { "Bid bond": "2%", "Contract duration": "18 months" }, createdAt: iso(-20) },
  docs: [
    { name: "ITT-MOH-2026-054 Tender Document.pdf", kind: "ITT", size: 2_200_000, pages: 76, text: `INVITATION TO TENDER — ITT-MOH-2026-054\nMedical Gas and HVAC Systems, 600-Bed Hospital\n\n1. SCOPE\n1.1 Design, supply, installation, testing and commissioning of medical gas pipeline systems (oxygen, medical air, vacuum, nitrous oxide).\n1.2 Supply and installation of HVAC systems including 24 operating theatres to ISO 14644 Class 7.\n\n2. COMMERCIAL\n2.1 Fixed price in SAR.\n2.2 Retention of 10% released after the defects liability period.\n2.3 Delay damages of 0.05% per day capped at 10%.\n\n3. QUALIFICATION\n3.1 Three hospital MEP projects of 300+ beds in the last seven years.\n3.2 Manufacturer authorisation for all medical gas equipment.` },
    { name: "Technical Specification — Medical Gas and HVAC.pdf", kind: "Specification", size: 2_050_000, pages: 84, text: `TECHNICAL SPECIFICATION\n5.1 Medical gas systems to comply with HTM 02-01 and NFPA 99.\n5.2 Operating theatres: 20 air changes per hour, HEPA H14 filtration, pressure cascade of 10 Pa.\n5.3 BMS integration via BACnet/IP with alarms to the central control room.\n5.4 Commissioning to include independent third-party verification.` },
    { name: "Contract Conditions.pdf", kind: "Contract", size: 760_000, pages: 33, text: `CONTRACT CONDITIONS\n9. Defects liability period: 36 months from handover.\n12. Contractor liability unlimited for personal injury and death.\n15. Payment: 60 days from certified invoice.\n17. Variations require written instruction; unrecorded variations are not payable.` },
  ],
  reqs: [
    ["Design, supply and install medical gas pipeline systems (O2, medical air, vacuum, N2O).", "Technical", "Must", "1.1", "Approved", 0, 8],
    ["HVAC for 24 operating theatres to ISO 14644 Class 7.", "Technical", "Must", "1.2", "Needs Verification", 0, 9],
    ["Medical gas systems comply with HTM 02-01 and NFPA 99.", "Compliance", "Must", "5.1", "Compliant", 1, 3],
    ["OT air changes of 20/h with HEPA H14 and 10 Pa pressure cascade.", "Technical", "Must", "5.2", "Compliant", 1, 4],
    ["Three hospital MEP projects of 300+ beds in the last seven years.", "Qualification", "Must", "3.1", "Partial", 0, 22],
    ["Manufacturer authorisation for all medical gas equipment.", "Qualification", "Must", "3.2", "Compliant", 0, 23],
    ["Delay damages of 0.05% per day capped at 10%.", "Commercial", "Must", "2.3", "Approved", 0, 18],
    ["Unlimited contractor liability for personal injury and death.", "Contractual", "Should", "12", "Needs Verification", 2, 5],
    ["36-month defects liability period.", "Contractual", "Should", "9", "Approved", 2, 4],
  ],
  comps: [["ISO 9001 Quality Management certificate", "Compliant", "Cert #QMS-2291", "Quality Lead", 240], ["Medical gas installer accreditation (HTM 02-01)", "Compliant", "Accreditation #MG-4410", "Technical Lead", 330], ["Manufacturer authorisation letters", "Compliant", "3 of 3 received", "Procurement"], ["Reference letter — 300+ bed hospital", "Needs Review", "2 of 3 required references available", "Bid Manager"], ["Bid bond 2%", "Compliant", "Issued, valid 120 days", "Finance", 110]],
  risks: [["Risk", "Unlimited liability for injury", "Clause 12 exposes the contractor to uncapped personal-injury claims.", "Contractual", 2, 5, "Confirm insurance limits; request mutual cap for non-fatal injury.", 400000], ["Risk", "Third reference project missing", "Only two of three required hospital references are available.", "Compliance", 4, 4, "Obtain a letter from the Dubai project owner; explain equivalent experience.", 0], ["Risk", "OT HVAC commissioning delay", "Third-party verification could delay handover of operating theatres.", "Schedule", 3, 3, "Schedule early commissioning with the verifier; add float.", 350000]],
  acts: [["Obtain third hospital reference letter", "In Progress", 5, "High"], ["Confirm insurance limits for clause 12", "To Do", 3, "High"], ["Final pricing review with Finance", "To Do", 9, "Medium"], ["Assemble and proofread tender submission", "To Do", 14, "Medium"]],
  clarification: { ref: "Conditions §12", category: "Contractual", title: "Liability for personal injury", analysis: "Request that liability for non-fatal injury be capped at the limits of the contractor insurance." },
};

const DATACENTRE: Spec = {
  p: "adm5",
  tender: { ...base, id: "adm5-t1", name: "National Data Centre — Network & Security Refresh", reference: "RFP-GOV-2026-129", client: "Digital Government Authority", description: "Supply and integration of a core network, firewall and security monitoring platform for the national data centre, with 5 years support.", value: 31000000, currency: "SAR", closing: day(27), progress: 20, stage: "Qualification", industry: "it", service: "Network & cybersecurity", tenderType: "RFP", region: "Middle East", goNoGo: "Pending", goNoGoScores: scores([4, 4, 4, 3, 3, 3, 3, 3, 4, 3, 3, 3, 3, 3, 3]), metadata: { "Bid bond": "1%", "Contract duration": "12 months + 5 years support" }, createdAt: iso(-5) },
  docs: [
    { name: "RFP-GOV-2026-129 Request for Proposal.pdf", kind: "RFP", size: 1_780_000, pages: 58, text: `REQUEST FOR PROPOSAL — RFP-GOV-2026-129\nNational Data Centre Network and Security Refresh\n\n1. SCOPE\n1.1 Supply, install and integrate a 400G spine-leaf core network across two data halls.\n1.2 Deploy next-generation firewalls and a SIEM/SOC monitoring platform.\n1.3 Provide 5 years of 24x7 support with 4-hour on-site response.\n\n2. COMMERCIAL\n2.1 Prices in SAR; support fees fixed for 5 years.\n2.2 Payment: 40% on delivery, 40% on acceptance, 20% over support years 1-2.\n\n3. QUALIFICATION\n3.1 Bidder shall be a Saudi-registered company with NCA-compliant staff.\n3.2 Two data centre network projects of SAR 15M or more in the last five years.` },
    { name: "Security and Compliance Requirements.pdf", kind: "Specification", size: 1_340_000, pages: 44, text: `SECURITY AND COMPLIANCE REQUIREMENTS\n6.1 Solution shall comply with NCA Essential Cybersecurity Controls (ECC) and Cloud Cybersecurity Controls.\n6.2 All equipment shall be sourced from vendors approved by the national security authority.\n6.3 Data and logs shall remain within the Kingdom.\n6.4 Penetration test by an approved third party before acceptance.` },
    { name: "Bill of Materials.xlsx", kind: "BOQ", size: 290_000, pages: 5, text: `BILL OF MATERIALS (summary)\nItem 1  400G spine switches — 4 pcs\nItem 2  Leaf switches 100G — 24 pcs\nItem 3  Next-generation firewalls (HA pair) — 4 pcs\nItem 4  SIEM licence 20,000 EPS — 1 lot\nItem 5  Support, years 1-5 — annual fee` },
  ],
  reqs: [
    ["Supply and integrate a 400G spine-leaf core network across two data halls.", "Technical", "Must", "1.1", "Approved", 0, 7],
    ["Deploy next-generation firewalls and a SIEM/SOC monitoring platform.", "Technical", "Must", "1.2", "Needs Verification", 0, 8],
    ["24x7 support with 4-hour on-site response for 5 years.", "Technical", "Must", "1.3", "Needs Verification", 0, 9],
    ["Comply with NCA Essential Cybersecurity Controls.", "Compliance", "Must", "6.1", "Compliant", 1, 3],
    ["All equipment from vendors approved by the national security authority.", "Compliance", "Must", "6.2", "Needs Verification", 1, 4],
    ["Data and logs remain within the Kingdom.", "Compliance", "Must", "6.3", "Compliant", 1, 5],
    ["Saudi-registered company with NCA-compliant staff.", "Qualification", "Must", "3.1", "Compliant", 0, 20],
    ["Two data centre network projects of SAR 15M or more in the last five years.", "Qualification", "Must", "3.2", "Partial", 0, 21],
  ],
  comps: [["Commercial registration (Saudi)", "Compliant", "CR #1010-xxxx", "Legal", 280], ["NCA ECC compliance attestation", "Needs Review", "Assessment scheduled", "Security Lead", 60], ["Vendor approval — national security authority", "Needs Review", "2 of 3 vendors approved", "Technical Lead"], ["ISO 27001 certificate", "Compliant", "Cert #ISMS-8821", "Security Lead", 360]],
  risks: [["Risk", "Unapproved vendor in design", "One proposed firewall vendor is not yet on the approved list.", "Compliance", 3, 4, "Switch to an approved vendor or obtain approval before submission.", 500000], ["Risk", "Hardware lead time", "400G switches have 20-week lead times, threatening the 12-month delivery window.", "Schedule", 3, 4, "Place long-lead orders at award; negotiate allocation with the vendor.", 700000], ["Opportunity", "5-year managed security service", "The support term allows a follow-on managed SOC contract.", "Commercial", 3, 3, "Include an optional managed SOC offer.", 0]],
  acts: [["Confirm approved-vendor status for the firewall", "To Do", 4, "High"], ["Collect second data centre reference project", "In Progress", 8, "High"], ["Run Go/No-Go scoring session", "To Do", 6, "Medium"], ["Request vendor lead-time confirmation", "To Do", 10, "Medium"]],
  clarification: { ref: "Security §6.2", category: "Compliance", title: "Approved vendor list", analysis: "Request the current list of vendors approved by the national security authority and the process to add a vendor." },
};

const CRM = (me: string) => {
  const co = (n: number, name: string, type: string, country: string, industry: string): Row => ({ id: `adm-co${n}`, name, industry, subIndustry: "", country, region: "Middle East", website: "", type, services: [], certifications: [], notes: "", createdAt: iso(-90) });
  const opp = (n: number, name: string, c: number, industry: string, value: number, prob: number, stage: string, award: number): Row => ({ id: `adm-op${n}`, name, companyId: `adm-co${c}`, industry, service: "", region: "Middle East", value, currency: "USD", probability: prob, expectedAward: day(award), expectedStart: day(award + 60), owner: me, source: "Direct", stage, notes: "", createdAt: iso(-60 + n * 8) });
  return {
    companies: [co(1, "Gulf Energy Company", "Client", "Saudi Arabia", "oil-gas"), co(2, "Metropolitan Transit Authority", "Client", "United Arab Emirates", "infrastructure"), co(3, "Riyadh Municipal Water Authority", "Prospect", "Saudi Arabia", "infrastructure"), co(4, "Nordic Subsea AS", "Partner", "Norway", "oil-gas")],
    contacts: [{ id: "adm-ct1", companyId: "adm-co1", name: "Faisal Al-Harbi", title: "Procurement Manager", email: "f.alharbi@gulfenergy.example", phone: "+966 50 000 1111", role: "Decision maker", notes: "" }, { id: "adm-ct2", companyId: "adm-co2", name: "Mariam Al-Suwaidi", title: "Head of Contracts", email: "m.suwaidi@mta.example", phone: "+971 50 000 2222", role: "Evaluator", notes: "" }],
    opportunities: [opp(1, "Offshore Platform Maintenance — Jubail", 1, "oil-gas", 64000000, 40, "Tender", 120), opp(2, "Metro Line 2 Signalling — Phase 1", 2, "infrastructure", 27500000, 60, "Bid", 45), opp(3, "Metro Line 2 Signalling — Phase 2", 2, "infrastructure", 31000000, 25, "Qualified", 300), opp(4, "Smart Metering — Riyadh North", 3, "infrastructure", 18500000, 30, "Opportunity", 150), opp(5, "Subsea inspection framework", 4, "oil-gas", 9000000, 15, "Lead", 240), opp(6, "Compressor station overhaul", 1, "oil-gas", 12000000, 100, "Won", -30)],
  };
};

async function main() {
  const email = (process.argv[2] || "bidder@bidwinning.local").toLowerCase();
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bidwinning");
  const user = await User.findOne({ email });
  if (!user) throw new Error(`No account with email ${email}`);
  const specs = user.role === "Bidder" ? [WATER] : [PLATFORM, METRO, SOLAR, HOSPITAL, DATACENTRE];
  const out: Record<string, Row[]> = {};
  const push = (c: string, rows: Row[]) => (out[c] ||= []).push(...rows);
  for (const sp of specs) {
    const tid = String(sp.tender.id); const p = sp.p;
    push("tenders", [{ ...sp.tender, owner: user.name }]);
    const docIds = sp.docs.map((_, i) => `${p}-d${i + 1}`);
    push("docs", sp.docs.map((d, i) => ({ id: docIds[i], tenderId: tid, name: d.name, size: d.size, rev: 1, kind: d.kind, status: "INDEXED", uploadedAt: iso(-8 + i), uploadedBy: user.name, language: "English", confidentiality: "Confidential", pages: d.pages, text: d.text, history: [{ rev: 1, at: iso(-8 + i), by: user.name, note: "Uploaded" }] })));
    push("requirements", sp.reqs.map((r, i) => ({ id: `${p}-r${i + 1}`, tenderId: tid, text: r[0], category: r[1], priority: r[2], sourceDoc: docIds[r[5]], page: r[6], section: r[3].split(".")[0], clause: r[3], evidence: "", status: r[4], reviewer: user.name, comments: "", ai: true, confidence: "High" })));
    push("complianceItems", sp.comps.map((c, i) => ({ id: `${p}-c${i + 1}`, tenderId: tid, item: c[0], status: c[1], evidence: c[2], expiry: c[4] === undefined ? undefined : day(c[4]), owner: c[3], notes: "" })));
    push("risks", sp.risks.map((r, i) => ({ id: `${p}-k${i + 1}`, tenderId: tid, n: i + 1, kind: r[0], title: r[1], description: r[2], category: r[3], probability: r[4], impact: r[5], postProbability: Math.max(1, r[4] - 1), postImpact: Math.max(1, r[5] - 1), owner: user.name, status: "Open", mitigation: r[6], contingency: r[7] })));
    push("actions", sp.acts.map((a, i) => ({ id: `${p}-a${i + 1}`, tenderId: tid, title: a[0], agent: "Bid Manager", status: a[1], createdAt: iso(-4), priority: a[3], assignee: user.name, due: day(a[2]) })));
    push("clarifications", [{ id: `${p}-q1`, tenderId: tid, n: 1, ref: sp.clarification.ref, round: 1, category: sp.clarification.category, title: sp.clarification.title, analysis: sp.clarification.analysis, status: "Draft", confidence: "High", assignee: user.name, due: day(5), author: user.name, createdAt: iso(-2), pending: true }]);
  }
  if (user.role !== "Bidder") for (const [c, rows] of Object.entries(CRM(user.name))) push(c, rows as Row[]);

  const mine = { orgId: user.orgId, ownerId: user._id };
  for (const [collection, docs] of Object.entries(out)) {
    await DataRecord.deleteMany({ ...mine, collection, id: { $regex: /^(demo|adm\d*)-/ } });
    await DataRecord.insertMany(docs.map((d) => ({ orgId: user.orgId, collection, id: String(d.id), data: d, ownerId: user._id, ownerName: user.name, updatedBy: user.name })));
    await mirrorRecords(user.orgId, collection, docs.map((d) => String(d.id)));
  }
  console.log(`Saved for ${user.email} (${user.role}): ${Object.entries(out).map(([k, v]) => `${v.length} ${k}`).join(", ")}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
