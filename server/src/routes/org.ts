import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { Org, User, Invite, ROLES, Audit } from "../models/index.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const org = Router();
org.use(requireAuth);

org.get("/", async (req, res) => {
  const o = await Org.findById(req.user!.orgId);
  const users = await User.find({ orgId: req.user!.orgId }).select("-passwordHash").sort({ createdAt: 1 });
  const invites = await Invite.find({ orgId: req.user!.orgId, acceptedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  res.json({ org: o && { id: String(o._id), name: o.name, plan: o.plan, currency: o.currency, industries: o.industries, seeded: o.seeded }, users: users.map((u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, active: u.active, lastLoginAt: u.lastLoginAt })), invites: invites.map((i) => ({ id: String(i._id), email: i.email, role: i.role, token: i.token, expiresAt: i.expiresAt, invitedBy: i.invitedBy })) });
});

org.patch("/", requireAdmin, async (req, res) => {
  const body = z.object({ name: z.string().min(1).optional(), industries: z.array(z.string()).optional(), currency: z.string().optional(), plan: z.string().optional(), seeded: z.boolean().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "invalid" });
  const o = await Org.findByIdAndUpdate(req.user!.orgId, body.data, { new: true });
  res.json({ id: String(o!._id), name: o!.name, plan: o!.plan, currency: o!.currency, industries: o!.industries, seeded: o!.seeded });
});

org.post("/invites", requireAdmin, async (req, res) => {
  const body = z.object({ email: z.string().email(), role: z.enum(ROLES).default("Viewer") }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Valid email and role required" });
  if (await User.findOne({ email: body.data.email.toLowerCase() })) return res.status(409).json({ error: "User already exists" });
  const inv = await Invite.create({ orgId: req.user!.orgId, email: body.data.email, role: body.data.role, token: crypto.randomBytes(24).toString("hex"), invitedBy: req.user!.name, expiresAt: new Date(Date.now() + 7 * 86400000) });
  await Audit.create({ orgId: req.user!.orgId, user: req.user!.name, action: "Invited", entity: "User", entityId: inv.email, detail: inv.role });
  res.status(201).json({ id: String(inv._id), email: inv.email, role: inv.role, token: inv.token, expiresAt: inv.expiresAt, invitedBy: inv.invitedBy });
});
org.delete("/invites/:id", requireAdmin, async (req, res) => { await Invite.deleteOne({ _id: req.params.id, orgId: req.user!.orgId }); res.json({ ok: true }); });

org.patch("/users/:id", requireAdmin, async (req, res) => {
  const body = z.object({ role: z.enum(ROLES).optional(), active: z.boolean().optional(), name: z.string().min(1).optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "invalid" });
  const u = await User.findOneAndUpdate({ _id: req.params.id, orgId: req.user!.orgId }, body.data, { new: true }).select("-passwordHash");
  if (!u) return res.status(404).json({ error: "not found" });
  await Audit.create({ orgId: req.user!.orgId, user: req.user!.name, action: "Updated user", entity: "User", entityId: u.email, detail: JSON.stringify(body.data) });
  res.json({ id: String(u._id), name: u.name, email: u.email, role: u.role, active: u.active });
});

org.get("/audit", async (req, res) => {
  const rows = await Audit.find({ orgId: req.user!.orgId }).sort({ at: -1 }).limit(Number(req.query.limit) || 500);
  res.json(rows.map((a) => ({ id: String(a._id), at: a.at, user: a.user, action: a.action, entity: a.entity, entityId: a.entityId, detail: a.detail })));
});
org.post("/audit", async (req, res) => {
  const body = z.object({ action: z.string(), entity: z.string(), entityId: z.string().optional().default(""), detail: z.string().optional().default("") }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "invalid" });
  const a = await Audit.create({ orgId: req.user!.orgId, user: req.user!.name, ...body.data });
  res.status(201).json({ id: String(a._id), at: a.at, user: a.user, action: a.action, entity: a.entity, entityId: a.entityId, detail: a.detail });
});
