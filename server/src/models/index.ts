import mongoose, { Schema } from "mongoose";

export const ROLES = ["Super Admin", "Organization Admin", "Business Development", "Tender Manager", "Technical Manager", "Engineer", "Procurement Manager", "Commercial Manager", "Finance", "Legal", "Compliance", "Project Manager", "Reviewer", "Executive", "Viewer", "Contractor/Vendor"] as const;

const orgSchema = new Schema({ name: { type: String, required: true }, industries: [String], plan: { type: String, default: "Team" }, currency: { type: String, default: "USD" }, seeded: { type: Boolean, default: false } }, { timestamps: true });
export const Org = mongoose.model("Org", orgSchema);

const userSchema = new Schema({ orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true, index: true }, name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true }, passwordHash: { type: String, required: true }, role: { type: String, enum: ROLES, default: "Viewer" }, active: { type: Boolean, default: true }, lastLoginAt: Date }, { timestamps: true });
export const User = mongoose.model("User", userSchema);

const inviteSchema = new Schema({ orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true, index: true }, email: { type: String, required: true, lowercase: true, trim: true }, role: { type: String, enum: ROLES, default: "Viewer" }, token: { type: String, required: true, unique: true }, invitedBy: String, acceptedAt: Date, expiresAt: { type: Date, required: true } }, { timestamps: true });
export const Invite = mongoose.model("Invite", inviteSchema);

/** Generic org-scoped record. Every business collection (tenders, requirements, risks, …) is stored as {collection, id, data}. */
const recordSchema = new Schema({ orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true }, collection: { type: String, required: true }, id: { type: String, required: true }, data: { type: Schema.Types.Mixed, required: true }, updatedBy: String }, { timestamps: true, minimize: false });
recordSchema.index({ orgId: 1, collection: 1, id: 1 }, { unique: true });
recordSchema.index({ orgId: 1, collection: 1, updatedAt: -1 });
export const Record = mongoose.model("Record", recordSchema);

/** Immutable audit trail (append-only; no update/delete routes exist). */
const auditSchema = new Schema({ orgId: { type: Schema.Types.ObjectId, required: true, index: true }, at: { type: Date, default: Date.now }, user: String, action: String, entity: String, entityId: String, detail: String }, { timestamps: false });
export const Audit = mongoose.model("Audit", auditSchema);

/** Org-wide singleton settings (margin, profile prefs, active tender per user is client-side). */
const settingsSchema = new Schema({ orgId: { type: Schema.Types.ObjectId, required: true, unique: true }, data: { type: Schema.Types.Mixed, default: {} } }, { timestamps: true, minimize: false });
export const Settings = mongoose.model("Settings", settingsSchema);

export const COLLECTIONS = ["tenders", "actions", "projects", "vendors", "docs", "clarifications", "clauses", "qualifications", "risks", "deliverables", "costLines", "milestones", "lessons", "companies", "contacts", "opportunities", "activities", "requirements", "complianceItems", "capabilities", "aiSummaries", "reviews", "approvals", "priceVersions", "proposalSections", "bidResults", "inquiries", "contracts", "aiLog", "notifications", "customIndustries", "procPackages", "quotations", "submissions", "chat"] as const;
export type CollectionName = (typeof COLLECTIONS)[number];
/** Collections whose records are keyed by tenderId rather than id. */
export const KEYED_BY_TENDER = new Set(["aiSummaries", "bidResults"]);
