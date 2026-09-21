import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Org, User, Invite } from "../models/index.js";
import { signToken, requireAuth } from "../middleware/auth.js";

export const auth = Router();
const pub = (u: InstanceType<typeof User>) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, active: u.active, orgId: String(u.orgId) });
const tokenFor = (u: InstanceType<typeof User>) => signToken({ uid: String(u._id), orgId: String(u.orgId), role: u.role, name: u.name, email: u.email });

/** Sign up: either create a new organisation (becomes Organization Admin) or join via invite token. */
auth.post("/signup", async (req, res) => {
  const body = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8), organisation: z.string().min(1).optional(), invite: z.string().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.issues[0].message });
  const { name, email, password, organisation, invite } = body.data;
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: "An account with this email already exists" });
  let orgId: unknown; let role = "Organization Admin";
  if (invite) {
    const inv = await Invite.findOne({ token: invite, acceptedAt: null, expiresAt: { $gt: new Date() } });
    if (!inv) return res.status(400).json({ error: "Invite is invalid or expired" });
    if (inv.email !== email.toLowerCase()) return res.status(400).json({ error: `This invite was issued to ${inv.email}` });
    orgId = inv.orgId; role = inv.role; inv.acceptedAt = new Date(); await inv.save();
  } else {
    if (!organisation) return res.status(400).json({ error: "Organisation name is required" });
    orgId = (await Org.create({ name: organisation, industries: [] }))._id;
  }
  const user = await User.create({ orgId, name, email, passwordHash: await bcrypt.hash(password, 10), role, lastLoginAt: new Date() });
  const org = await Org.findById(orgId);
  res.status(201).json({ token: tokenFor(user), user: pub(user), org: { id: String(org!._id), name: org!.name, plan: org!.plan, currency: org!.currency, industries: org!.industries, seeded: org!.seeded } });
});

auth.post("/login", async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Email and password required" });
  const user = await User.findOne({ email: body.data.email.toLowerCase() });
  if (!user || !(await bcrypt.compare(body.data.password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password" });
  if (!user.active) return res.status(403).json({ error: "Account deactivated" });
  user.lastLoginAt = new Date(); await user.save();
  const org = await Org.findById(user.orgId);
  res.json({ token: tokenFor(user), user: pub(user), org: { id: String(org!._id), name: org!.name, plan: org!.plan, currency: org!.currency, industries: org!.industries, seeded: org!.seeded } });
});

auth.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.uid); if (!user) return res.status(404).json({ error: "not found" });
  const org = await Org.findById(user.orgId);
  res.json({ user: pub(user), org: { id: String(org!._id), name: org!.name, plan: org!.plan, currency: org!.currency, industries: org!.industries, seeded: org!.seeded } });
});

auth.post("/change-password", requireAuth, async (req, res) => {
  const body = z.object({ current: z.string(), next: z.string().min(8) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "New password must be at least 8 characters" });
  const user = await User.findById(req.user!.uid); if (!user) return res.status(404).json({ error: "not found" });
  if (!(await bcrypt.compare(body.data.current, user.passwordHash))) return res.status(401).json({ error: "Current password is wrong" });
  user.passwordHash = await bcrypt.hash(body.data.next, 10); await user.save(); res.json({ ok: true });
});

/** Invite lookup for the sign-up page (public, token-scoped). */
auth.get("/invite/:token", async (req, res) => {
  const inv = await Invite.findOne({ token: req.params.token, acceptedAt: null, expiresAt: { $gt: new Date() } });
  if (!inv) return res.status(404).json({ error: "Invite is invalid or expired" });
  const org = await Org.findById(inv.orgId);
  res.json({ email: inv.email, role: inv.role, organisation: org?.name });
});
