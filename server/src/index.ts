import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDb } from "./db.js";
import { auth } from "./routes/auth.js";
import { org } from "./routes/org.js";
import { data } from "./routes/data.js";
import { standards } from "./routes/standards.js";
import { ocr } from "./routes/ocr.js";
import rateLimit from "express-rate-limit";
import { requireAuthOrService } from "./middleware/auth.js";

export async function createApp() {
  const app = express();
  const origins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map((s) => s.trim());
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1); // behind the host's load balancer, so limits key on the real client IP
  app.use(helmet());
  app.use(cors({ origin: (o, cb) => cb(null, !o || origins.includes(o) || origins.includes("*")), credentials: false }));
  app.use(express.json({ limit: "25mb" }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("tiny"));
  app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  const limit = (windowMs: number, max: number) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests, slow down." } });
  const off = process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "1";
  const noop = (_q: express.Request, _r: express.Response, n: express.NextFunction) => n();
  app.use("/api/auth/login", off ? noop : limit(15 * 60_000, 20));
  app.use("/api/auth/signup", off ? noop : limit(60 * 60_000, 10));
  app.use("/api", off ? noop : limit(60_000, 600));
  app.use("/api/auth", auth);
  app.use("/api/org", org);
  app.use("/api/data", data);
  app.use("/api/standards", requireAuthOrService, off ? noop : limit(60_000, 120), standards);
  app.use("/api/ocr", requireAuthOrService, off ? noop : limit(60_000, 30), ocr);
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(err); res.status(500).json({ error: err.message || "server error" }); });
  return app;
}

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  connectDb().then(async () => { const app = await createApp(); const port = Number(process.env.PORT) || 4005; app.listen(port, () => console.log(`[api] BidWinning API listening on :${port}`)); }).catch(async (e) => { console.error(e); if (process.env.NODE_ENV === "production") { console.error("[api] fatal: database unavailable, exiting"); process.exit(1); } console.log("[api] MongoDB connection failed, but starting app anyway for LanceDB."); const app = await createApp(); const port = Number(process.env.PORT) || 4005; app.listen(port, () => console.log(`[api] BidWinning API listening on :${port}`));; });
}
