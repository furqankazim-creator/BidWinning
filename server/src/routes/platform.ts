import { Router } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import { Org, User, Invite, ROLES, Audit, Workspace, BidDocument } from "../models/index.js";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.js";

/** Platform console: cross-organisation view and control. Super Admin only. */
export const platform = Router();
platform.use(requireAuth, requireSuperAdmin);

const countBy = async (model: typeof Workspace | typeof BidDocument | typeof User, match: object = {}) => new Map((await model.aggregate([{ $match: match }, { $group: { _id: "$orgId", n: { $sum: 1 } } }])).map((x) => [String(x._id), x.n as number]));

platform.get("/overview", async (_req, res) => {
  const [orgs, users, bidders, admins, ws, docs] = await Promise.all([Org.find().sort({ createdAt: -1 }).lean(), countBy(User), countBy(User, { role: "Bidder" }), countBy(User, { role: "Super Admin" }), countBy(Workspace), countBy(BidDocument)]);
  const rows = orgs.map((o) => { const id = String(o._id); return { id, name: o.name, plan: o.plan, createdAt: (o as unknown as { createdAt: Date }).createdAt, users: users.get(id) || 0, admins: admins.get(id) || 0, bidders: bidders.get(id) || 0, workspaces: ws.get(id) || 0, documents: docs.get(id) || 0 }; });
  const sum = (k: "users" | "bidders" | "workspaces" | "documents") => rows.reduce((a, r) => a + r[k], 0);
  res.json({ totals: { organisations: rows.length, users: sum("users"), bidders: sum("bidders"), workspaces: sum("workspaces"), documents: sum("documents") }, organisations: rows });
});

platform.get("/orgs/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "not found" });
  const org = await Org.findById(req.params.id).lean(); if (!org) return res.status(404).json({ error: "not found" });
  const [users, invites] = await Promise.all([User.find({ orgId: org._id }).select("-passwordHash").sort({ createdAt: 1 }).lean(), Invite.find({ orgId: org._id, acceptedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean()]);
  res.json({ org: { id: String(org._id), name: org.name, plan: org.plan, currency: org.currency }, users: users.map((u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, active: u.active, company: u.company, lastLoginAt: u.lastLoginAt })), invites: invites.map((i) => ({ id: String(i._id), email: i.email, role: i.role, token: i.token, expiresAt: i.expiresAt })) });
});

/** Invite someone (including a Bidder) into any organisation. */
platform.post("/orgs/:id/invites", async (req, res) => {
  const body = z.object({ email: z.string().email(), role: z.enum(ROLES).default("Bidder") }).safeParse(req.body);
  if (!body.success || !mongoose.isValidObjectId(req.params.id) || !(await Org.exists({ _id: req.params.id }))) return res.status(400).json({ error: "Valid organisation, email and role required" });
  if (await User.findOne({ email: body.data.email.toLowerCase() })) return res.status(409).json({ error: "User already exists" });
  const inv = await Invite.create({ orgId: req.params.id, email: body.data.email, role: body.data.role, token: crypto.randomBytes(24).toString("hex"), invitedBy: req.user!.name, expiresAt: new Date(Date.now() + 7 * 86400000) });
  await Audit.create({ orgId: req.params.id, user: req.user!.name, action: "Invited (platform)", entity: "User", entityId: inv.email, detail: inv.role });
  res.status(201).json({ id: String(inv._id), email: inv.email, role: inv.role, token: inv.token, expiresAt: inv.expiresAt });
});

/** Change any user's role or active flag. A Super Admin cannot lock themselves out or remove the last Super Admin. */
platform.patch("/users/:id", async (req, res) => {
  const body = z.object({ role: z.enum(ROLES).optional(), active: z.boolean().optional() }).safeParse(req.body);
  if (!body.success || !mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "invalid" });
  const u = await User.findById(req.params.id); if (!u) return res.status(404).json({ error: "not found" });
  if (body.data.role === "Super Admin" && u.role !== "Super Admin") return res.status(403).json({ error: "There is only one Super Admin; it cannot be granted" });
  const losesSuper = u.role === "Super Admin" && ((body.data.role && body.data.role !== "Super Admin") || body.data.active === false);
  if (losesSuper && String(u._id) === req.user!.uid) return res.status(400).json({ error: "You cannot demote or deactivate your own Super Admin account" });
  if (losesSuper && (await User.countDocuments({ role: "Super Admin", active: true, _id: { $ne: u._id } })) === 0) return res.status(400).json({ error: "There must be at least one active Super Admin" });
  Object.assign(u, body.data); await u.save();
  await Audit.create({ orgId: u.orgId, user: req.user!.name, action: "Updated user (platform)", entity: "User", entityId: u.email, detail: JSON.stringify(body.data) });
  res.json({ id: String(u._id), name: u.name, email: u.email, role: u.role, active: u.active });
});
