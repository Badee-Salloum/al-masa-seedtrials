// Incremental, additive migration for the Engineer role — applied over Neon HTTPS/WebSocket (443).
// Idempotent. Run: NEON_URL="postgres://..." npx tsx prisma/migrate-engineer.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;

const url = process.env.NEON_URL;
if (!url) {
  console.error("Set NEON_URL");
  process.exit(1);
}

const statements = [
  `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ENGINEER'`,
  `DO $$ BEGIN CREATE TYPE "Recommendation" AS ENUM ('ACCEPT','REJECT'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `ALTER TABLE "Trial" ADD COLUMN IF NOT EXISTS "analysisNote" TEXT`,
  `ALTER TABLE "Trial" ADD COLUMN IF NOT EXISTS "recommendation" "Recommendation"`,
  `ALTER TABLE "Trial" ADD COLUMN IF NOT EXISTS "analyzedById" TEXT`,
  `ALTER TABLE "Trial" ADD COLUMN IF NOT EXISTS "analyzedAt" TIMESTAMP(3)`,
  `DO $$ BEGIN
     ALTER TABLE "Trial" ADD CONSTRAINT "Trial_analyzedById_fkey"
       FOREIGN KEY ("analyzedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN null; END $$`,
];

async function run() {
  const pool = new Pool({ connectionString: url });
  for (const s of statements) {
    console.log("•", s.replace(/\s+/g, " ").slice(0, 70), "…");
    await pool.query(s); // each statement autocommits (required for ALTER TYPE ADD VALUE)
  }
  await pool.end();
  console.log("✅ Engineer migration applied (additive).");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
