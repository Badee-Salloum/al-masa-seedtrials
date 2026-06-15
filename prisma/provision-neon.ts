// One-off: provision a Neon database entirely over HTTPS/WebSocket (port 443),
// for networks that block raw Postgres (5432). Run: NEON_URL="postgres://..." tsx prisma/provision-neon.ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { seed } from "./seed-logic";

neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;

const url = process.env.NEON_URL;
if (!url) {
  console.error("Set NEON_URL");
  process.exit(1);
}

const read = (f: string) => readFileSync(path.join(process.cwd(), "prisma", f), "utf8");

async function run() {
  const pool = new Pool({ connectionString: url });
  console.log("• Applying schema DDL (additive; DB confirmed empty)…");
  await pool.query(read("_init.sql"));
  console.log("• Applying constraints + triggers…");
  await pool.query(read("constraints.sql"));
  await pool.end();

  console.log("• Seeding demo data…");
  const adapter = new PrismaNeon({ connectionString: url });
  const prisma = new PrismaClient({ adapter });
  await seed(prisma);
  await prisma.$disconnect();
  console.log("✅ Neon provisioned (schema + constraints + seed).");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
