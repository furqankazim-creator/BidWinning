# Deploying BidWinning

Two processes: the **API** (`server/`, Express + MongoDB) and the **website** (Next.js, repo root).
Use HTTPS for both. Replace `YOUR-DOMAIN` / `YOUR-API-DOMAIN` below with your real addresses.

## 1. Before you start
- [ ] Free disk space on the host (the app writes OCR caches and logs).
- [ ] A managed MongoDB with authentication (e.g. Atlas) and automatic backups switched on. Do not use a local, password-less MongoDB.
- [ ] Rotate every password that was used during development (Super Admin, demo bidder). Delete the demo bidder `bidder@bidwinning.local`.

## 2. API
```
cd server
cp .env.production.example .env      # then fill in every value
npm ci && npm run build
npm start                            # node dist/index.js
```
With `NODE_ENV=production` the API **refuses to start** (and says why) if: `JWT_SECRET` is under 32 characters, MongoDB is local or has no credentials, `CORS_ORIGIN` is not an https address, the Super Admin password is under 12 characters, or a dev/test flag (`ALLOW_OPEN_SIGNUP`, `DISABLE_RATE_LIMIT`, `DEV_AUTH_BYPASS`) is set.

Put it behind a reverse proxy / load balancer that terminates TLS (the API trusts one proxy hop in production for rate limiting).
Health check: `GET /health` returns `{"ok":true}`.

## 3. Website
```
cp .env.production.example .env.production.local     # fill in the API address and AI key(s)
npm ci && npm run build
npm start
```
`NEXT_PUBLIC_API_URL` is baked in at build time: rebuild after changing it. If it is missing, the app silently falls back to offline demo mode.

## 4. Accounts and access
- The Super Admin is created from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` on first start, and is the only admin. To hand the role to someone else, change `SUPER_ADMIN_EMAIL` and restart.
- Sign-up is invitation-only: the Super Admin creates invite links (Platform Console → organisation, or Users & Roles).
- Bidders see only their own workspaces and documents; the Super Admin reviews them under Administration → Bidders.

## 5. Smoke-check after deploy
1. `GET https://YOUR-API-DOMAIN/health` → ok.
2. Sign in as the Super Admin; Platform Console and Bidders open.
3. Create a Bidder invite, sign up in a private window, upload a PDF, wait for INDEXED, run AI Analysis.
4. Confirm the Bidder cannot open `/app/platform` or `/app/admin/bidders`.

## 6. Operations
- Back up MongoDB (database `bidwinning`). Compass can browse the `workspaces` and `bid_documents` collections.
- Scanned-PDF OCR takes about 2–3 minutes per 100 pages; the upload request must be allowed to stay open that long (set proxy timeouts to at least 10 minutes).
