import bcrypt from "bcryptjs";
import { Org, User } from "./models/index.js";

/** Creates (once) the platform Super Admin from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD. An existing account keeps its password but is promoted. */
export async function ensureSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase(); const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return;
  // Exactly one admin: the Super Admin. The old "Organization Admin" role no longer exists; its holders (and any extra Super Admin) become Tender Managers.
  const moved = await User.updateMany({ $or: [{ role: "Organization Admin" }, { role: "Super Admin", email: { $ne: email } }] }, { role: "Tender Manager" });
  if (moved.modifiedCount) console.log(`[auth] ${moved.modifiedCount} account(s) moved from admin roles to Tender Manager`);
  const existing = await User.findOne({ email });
  if (existing) { if (existing.role !== "Super Admin" || !existing.active) { existing.role = "Super Admin"; existing.active = true; await existing.save(); console.log(`[auth] ${email} promoted to Super Admin`); } return; }
  const org = await Org.create({ name: process.env.SUPER_ADMIN_ORG || "BidWinning Platform", industries: [], seeded: true });
  await User.create({ orgId: org._id, name: process.env.SUPER_ADMIN_NAME || "Platform Admin", email, passwordHash: await bcrypt.hash(password, 10), role: "Super Admin" });
  console.log(`[auth] Super Admin created: ${email}`);
}
