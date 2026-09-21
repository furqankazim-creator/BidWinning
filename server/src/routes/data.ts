import { Router } from "express";
import { z } from "zod";
import { Record, Settings, COLLECTIONS, KEYED_BY_TENDER, type CollectionName } from "../models/index.js";
import { requireAuth, requireWrite } from "../middleware/auth.js";

export const data = Router();
data.use(requireAuth);

const isCollection = (c: string): c is CollectionName => (COLLECTIONS as readonly string[]).includes(c);
const keyOf = (c: string, doc: Record<string, unknown>) => String(KEYED_BY_TENDER.has(c) ? doc.tenderId : doc.id);

/** Full org snapshot: every collection + settings. Used by the client on login. */
data.get("/state", async (req, res) => {
  const rows = await Record.find({ orgId: req.user!.orgId }).select("collection data").lean();
  const out: Record<string, unknown[]> = {}; for (const c of COLLECTIONS) out[c] = [];
  for (const r of rows) (out[r.collection] ||= []).push(r.data);
  const settings = await Settings.findOne({ orgId: req.user!.orgId }).lean();
  res.json({ collections: out, settings: settings?.data || {}, serverTime: new Date().toISOString() });
});

data.get("/settings", async (req, res) => { const s = await Settings.findOne({ orgId: req.user!.orgId }).lean(); res.json(s?.data || {}); });
data.put("/settings", requireWrite, async (req, res) => {
  const s = await Settings.findOneAndUpdate({ orgId: req.user!.orgId }, { $set: Object.fromEntries(Object.entries(req.body || {}).map(([k, v]) => [`data.${k}`, v])) }, { new: true, upsert: true }).lean();
  res.json(s?.data || {});
});

/** Bulk sync of one collection: upsert every document given, delete what the client no longer has (when `full` is true). */
data.put("/:collection/sync", requireWrite, async (req, res) => {
  const c = req.params.collection; if (!isCollection(c)) return res.status(404).json({ error: "unknown collection" });
  const body = z.object({ docs: z.array(z.record(z.unknown())), full: z.boolean().default(true) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "docs[] required" });
  const orgId = req.user!.orgId; const ids = body.data.docs.map((d) => keyOf(c, d));
  if (body.data.docs.length) await Record.bulkWrite(body.data.docs.map((d) => ({ updateOne: { filter: { orgId, collection: c, id: keyOf(c, d) }, update: { $set: { data: d, updatedBy: req.user!.name } }, upsert: true } })), { ordered: false });
  let deleted = 0; if (body.data.full) deleted = (await Record.deleteMany({ orgId, collection: c, id: { $nin: ids } })).deletedCount;
  res.json({ upserted: body.data.docs.length, deleted });
});

/** Per-entity REST for other clients / integrations. */
data.get("/:collection", async (req, res) => {
  const c = req.params.collection; if (!isCollection(c)) return res.status(404).json({ error: "unknown collection" });
  const filter: Record<string, unknown> = { orgId: req.user!.orgId, collection: c };
  if (req.query.tenderId) filter["data.tenderId"] = String(req.query.tenderId);
  const rows = await Record.find(filter).sort({ updatedAt: -1 }).limit(Math.min(Number(req.query.limit) || 2000, 5000)).lean();
  res.json(rows.map((r) => r.data));
});
data.get("/:collection/:id", async (req, res) => {
  const c = req.params.collection; if (!isCollection(c)) return res.status(404).json({ error: "unknown collection" });
  const r = await Record.findOne({ orgId: req.user!.orgId, collection: c, id: req.params.id }).lean();
  return r ? res.json(r.data) : res.status(404).json({ error: "not found" });
});
data.post("/:collection", requireWrite, async (req, res) => {
  const c = req.params.collection; if (!isCollection(c)) return res.status(404).json({ error: "unknown collection" });
  const doc = { ...(req.body || {}) }; if (!doc.id && !KEYED_BY_TENDER.has(c)) doc.id = Math.random().toString(36).slice(2, 10);
  const r = await Record.findOneAndUpdate({ orgId: req.user!.orgId, collection: c, id: keyOf(c, doc) }, { $set: { data: doc, updatedBy: req.user!.name } }, { new: true, upsert: true }).lean();
  res.status(201).json(r!.data);
});
data.put("/:collection/:id", requireWrite, async (req, res) => {
  const c = req.params.collection; if (!isCollection(c)) return res.status(404).json({ error: "unknown collection" });
  const existing = await Record.findOne({ orgId: req.user!.orgId, collection: c, id: req.params.id });
  if (!existing) return res.status(404).json({ error: "not found" });
  existing.data = { ...(existing.data as object), ...(req.body || {}) }; existing.updatedBy = req.user!.name; existing.markModified("data"); await existing.save();
  res.json(existing.data);
});
data.delete("/:collection/:id", requireWrite, async (req, res) => {
  const c = req.params.collection; if (!isCollection(c)) return res.status(404).json({ error: "unknown collection" });
  const r = await Record.deleteOne({ orgId: req.user!.orgId, collection: c, id: req.params.id });
  res.json({ deleted: r.deletedCount });
});
