// Create/reset a user over Neon HTTPS (443). totpEnabled=false (2FA optional under REQUIRE_2FA=false).
// Run: NEON_URL=… USER_EMAIL=… USER_PASSWORD=… USER_NAME=… USER_ROLE=OWNER npx tsx prisma/create-user.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;

const url = process.env.NEON_URL;
const email = (process.env.USER_EMAIL || "").toLowerCase().trim();
const password = process.env.USER_PASSWORD || "";
const name = process.env.USER_NAME || "User";
const role = process.env.USER_ROLE || "OWNER";
if (!url || !email || !password) {
  console.error("Set NEON_URL, USER_EMAIL, USER_PASSWORD");
  process.exit(1);
}

async function run() {
  const pool = new Pool({ connectionString: url });
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO "User" (id, email, name, "passwordHash", role, "totpEnabled", active, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4::"Role", false, true, now(), now())
     ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", role = EXCLUDED.role, "totpEnabled" = false, active = true`,
    [email, name, hash, role],
  );
  await pool.end();
  console.log("✅ user upserted:", email, role);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
