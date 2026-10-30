/** In production, refuse to start with settings that would be unsafe on the public internet. Does nothing in development. */
export function assertProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;
  const e = process.env; const problems: string[] = [];
  if ((e.JWT_SECRET || "").length < 32) problems.push("JWT_SECRET must be at least 32 random characters");
  if (/localhost|127\.0\.0\.1/.test(e.MONGODB_URI || "")) problems.push("MONGODB_URI points at a local database; use a managed/authenticated MongoDB");
  if (!/^mongodb(\+srv)?:\/\/[^/]*@/.test(e.MONGODB_URI || "")) problems.push("MONGODB_URI has no username/password (database authentication is off)");
  if (!e.CORS_ORIGIN || /localhost|127\.0\.0\.1|\*/.test(e.CORS_ORIGIN)) problems.push("CORS_ORIGIN must list only your real https:// website address");
  if (e.CORS_ORIGIN && !e.CORS_ORIGIN.split(",").every((o) => o.trim().startsWith("https://"))) problems.push("CORS_ORIGIN must use https://");
  if (!e.SUPER_ADMIN_EMAIL || (e.SUPER_ADMIN_PASSWORD || "").length < 12) problems.push("SUPER_ADMIN_EMAIL is required and SUPER_ADMIN_PASSWORD must be at least 12 characters");
  if (e.ALLOW_OPEN_SIGNUP === "1" || e.DISABLE_RATE_LIMIT === "1" || e.DEV_AUTH_BYPASS === "1") problems.push("ALLOW_OPEN_SIGNUP, DISABLE_RATE_LIMIT and DEV_AUTH_BYPASS must not be set in production");
  if (problems.length) { console.error("[config] Refusing to start in production:\n - " + problems.join("\n - ")); process.exit(1); }
}
