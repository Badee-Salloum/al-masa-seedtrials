import { PrismaClient } from "@prisma/client";
import { seed } from "./seed-logic";

const prisma = new PrismaClient();

seed(prisma)
  .then(() => {
    console.log("Seed complete. Logins (password: Passw0rd!): owner@ / manager@ / tech@almasa.test");
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
