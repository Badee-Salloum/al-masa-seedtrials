# Al-Masa Seed Trials — Web App

**مؤسسة الماسة والنبراس الزراعية / Moasasat Al Masa wa Al Nibras Alziraieh**

A standalone **Next.js** rebuild of the Odoo 17 `agri_seed_trials` module — seed-trial management with a
`draft → in_trial → review → accepted/rejected` workflow, per-nursery distributions, time-series follow-ups,
a per-trial PDF report, season analytics, role-based access with 2FA, and an immutable audit log.
Arabic/RTL primary, English secondary. Runs free on **Vercel + Neon** (serverless).

**🚀 Live:** https://al-masa-seedtrials.vercel.app — demo logins below (password `Passw0rd!`).

## Stack
- **Next.js 16** (App Router, TypeScript), **Tailwind v4**
- **Prisma** → **PostgreSQL** (Neon in production)
- **Auth.js v5** (credentials + bcrypt) with **TOTP 2FA** (mandatory for Manager/Owner)
- **@react-pdf/renderer** (Arabic PDF report), **Recharts** (analytics), **next-intl** (ar/en, RTL)
- **Vitest** (unit + integration), **Playwright** (E2E)

## Local development
This app uses Postgres. Two options:

### Option A — local Postgres via Docker (recommended for dev)
```bash
docker run -d --name almasa-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=almasa -p 5544:5432 postgres:16
cp .env.example .env   # then set DATABASE_URL/DIRECT_URL to postgresql://postgres:postgres@localhost:5544/almasa
npm install
npm run db:reset       # push schema + apply constraints + seed demo data
npm run dev            # http://localhost:3000
```

### Option B — Neon
Set `DATABASE_URL` (pooled `-pooler` host, `pgbouncer=true`) and `DIRECT_URL` (direct host) in `.env`, then
`npm run db:push && npm run db:constraints && npm run db:seed`.
> Some networks block outbound port 5432 — if `prisma` reports `P1001`/`ECONNRESET` against Neon locally,
> use Option A for dev; Vercel reaches Neon fine in production.

### Demo logins (password `Passw0rd!`)
- `owner@almasa.test` (Owner) · `manager@almasa.test` (Manager) — both must enroll 2FA on first login
- `tech@almasa.test` (Technician — assigned to North Nursery)

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Sync schema to the DB |
| `npm run db:constraints` | Apply raw CHECK constraints + triggers (`prisma/constraints.sql`) |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | push (force) + constraints + seed |

## Deploy (Vercel + Neon, free)
1. Push to GitHub (this repo).
2. Create a Neon project + database; copy the **pooled** and **direct** connection strings.
3. Vercel → New Project → import the repo. Set env vars: `DATABASE_URL` (pooled), `DIRECT_URL` (direct),
   `AUTH_SECRET` (`npx auth secret`), `AUTH_URL` (your URL), `BLOB_READ_WRITE_TOKEN` (for attachments).
4. One-time DB setup against Neon: `npm run db:push && npm run db:constraints && npm run db:seed`
   (run locally if your network allows 5432, or from any host that can reach Neon).
   - **If your network blocks port 5432** (some ISPs do): provision over HTTPS instead with
     `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/_init.sql`
     then `NEON_URL="<pooled-url>" npx tsx prisma/provision-neon.ts` (schema + constraints + seed over 443).
5. Deploy. The build runs `prisma generate` + `next build`.

> This instance is already deployed at the Live URL above (Neon DB provisioned over HTTPS, Vercel env:
> `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`).

## Architecture
- `src/lib/*` — pure, unit-tested domain logic ported 1:1 from Odoo: `workflow` (transition guards),
  `authz` (RBAC + record-scoping), `audit` (field diffing), `sequence` (ST/YYYY/####), `aggregates`,
  `product` (accept→catalog product), `npk`, `validation` (zod mirroring DB CHECKs).
- `src/server/*` — server actions + scoped queries (trials, followups, distributions, config, analytics,
  audit). Every mutation enforces authz first and logs audit rows in-transaction.
- `src/app/*` — App Router pages (login, 2FA, dashboard, trials, follow-ups, analytics, audit, settings)
  + the PDF route handler.
- `prisma/schema.prisma` + `prisma/constraints.sql` — data model; CHECK constraints, the followup↔
  distribution trial-consistency trigger, and audit-log append-only triggers live in the SQL file.

## Testing
- **Unit** (`npm run test`): 77 tests covering the full workflow matrix, authz scoping, audit diffing,
  validation boundaries, sequence formatting, aggregates, product mapping, NPK.
- **Integration / E2E**: see `.github/workflows/ci.yml` (Postgres service + schema + constraints + build).

## Provenance
Behavioral source of truth: the Odoo module at `agri_seed_trials`. Field names, workflow guards, the
accept→product mapping, AUDIT_FIELDS, record rules, and the report layout are ported to match.
