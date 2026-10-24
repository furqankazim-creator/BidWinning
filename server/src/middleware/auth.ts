import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface AuthUser { uid: string; orgId: string; role: string; name: string; email: string; }
declare global { namespace Express { interface Request { user?: AuthUser } } }

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  // A public fallback secret would let anyone forge tokens, so refuse to run without one in production.
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be set in production");
  return "dev-secret-change-me";
};
export const signToken = (u: AuthUser) => jwt.sign(u, secret(), { expiresIn: "30d" });

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "unauthenticated" });
  try { req.user = jwt.verify(token, secret()) as AuthUser; next(); } catch { return res.status(401).json({ error: "invalid_token" }); }
}

const ADMIN_ROLES = new Set(["Super Admin", "Organization Admin"]);
const WRITE_DENIED = new Set(["Viewer", "Contractor/Vendor"]);
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => (req.user && ADMIN_ROLES.has(req.user.role) ? next() : res.status(403).json({ error: "admin_only" }));
export const requireWrite = (req: Request, res: Response, next: NextFunction) => (req.user && !WRITE_DENIED.has(req.user.role) ? next() : res.status(403).json({ error: "read_only_role" }));

/** Browser users send a JWT; the Next.js server calls the API with INTERNAL_API_KEY. Either one is accepted. */
export function requireAuthOrService(req: Request, res: Response, next: NextFunction) {
  const key = process.env.INTERNAL_API_KEY;
  const sent = req.headers["x-service-key"];
  if (key && typeof sent === "string") {
    const a = Buffer.from(sent), b = Buffer.from(key);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  }
  return requireAuth(req, res, next);
}
