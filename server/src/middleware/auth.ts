import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser { uid: string; orgId: string; role: string; name: string; email: string; }
declare global { namespace Express { interface Request { user?: AuthUser } } }

const secret = () => process.env.JWT_SECRET || "dev-secret-change-me";
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
