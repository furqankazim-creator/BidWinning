import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDb } from "./db.js";
import { auth } from "./routes/auth.js";
import { org } from "./routes/org.js";
import { data } from "./routes/data.js";

export async function createApp() {
  const app = express();
  const origins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map((s) => s.trim());
  app.use(helmet());
  app.use(cors({ origin: (o, cb) => cb(null, !o || origins.includes(o) || origins.includes("*")), credentials: false }));
  app.use(express.json({ limit: "25mb" }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("tiny"));
  app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use("/api/auth", auth);
  app.use("/api/org", org);
  app.use("/api/data", data);
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(err); res.status(500).json({ error: err.message || "server error" }); });
  return app;
}

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  connectDb().then(async () => { const app = await createApp(); const port = Number(process.env.PORT) || 4000; app.listen(port, () => console.log(`[api] VendorIQ API listening on :${port}`)); }).catch((e) => { console.error(e); process.exit(1); });
}
