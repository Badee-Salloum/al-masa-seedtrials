import { PrismaClient, Role, TrialState } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const d = (n: number) => n; // Prisma accepts number for Decimal inputs

async function main() {
  // Idempotent reset (children first).
  await prisma.auditLog.deleteMany();
  await prisma.followupAttachment.deleteMany();
  await prisma.followup.deleteMany();
  await prisma.distribution.deleteMany();
  await prisma.trial.deleteMany();
  await prisma.product.deleteMany();
  await prisma.trialCounter.deleteMany();
  await prisma.nursery.deleteMany();
  await prisma.season.deleteMany();
  await prisma.seedCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.country.deleteMany();
  await prisma.user.deleteMany();

  // Countries
  const jo = await prisma.country.create({ data: { code: "JO", nameAr: "الأردن", nameEn: "Jordan" } });
  const sy = await prisma.country.create({ data: { code: "SY", nameAr: "سوريا", nameEn: "Syria" } });

  // Seasons
  const spring = await prisma.season.create({
    data: { name: "Spring 2026", code: "SP26", dateStart: new Date("2026-03-01"), dateEnd: new Date("2026-05-31") },
  });
  const autumn = await prisma.season.create({
    data: { name: "Autumn 2025", code: "AU25", dateStart: new Date("2025-09-01"), dateEnd: new Date("2025-11-30") },
  });

  // Categories
  const veg = await prisma.seedCategory.create({ data: { name: "Vegetables", code: "VEG" } });
  const cer = await prisma.seedCategory.create({ data: { name: "Cereals", code: "CER" } });

  // Suppliers
  const green = await prisma.supplier.create({ data: { name: "Green Seeds Co." } });
  const agri = await prisma.supplier.create({ data: { name: "AgriSource Ltd." } });

  // Users (password: Passw0rd!). Manager/Owner must enroll 2FA on first login.
  const pw = await bcrypt.hash("Passw0rd!", 10);
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@almasa.test", passwordHash: pw, role: Role.OWNER },
  });
  const manager = await prisma.user.create({
    data: { name: "Manager", email: "manager@almasa.test", passwordHash: pw, role: Role.MANAGER },
  });
  const tech = await prisma.user.create({
    data: { name: "Sara (Technician)", email: "tech@almasa.test", passwordHash: pw, role: Role.TECHNICIAN },
  });

  // Nurseries (tech assigned to North)
  const north = await prisma.nursery.create({
    data: { name: "North Nursery", code: "N-01", location: "Irbid", areaHectare: d(3.5), technicians: { connect: { id: tech.id } } },
  });
  const south = await prisma.nursery.create({
    data: { name: "South Nursery", code: "N-02", location: "Karak", areaHectare: d(2.0) },
  });
  const valley = await prisma.nursery.create({
    data: { name: "Valley Nursery", code: "N-03", location: "Jordan Valley", areaHectare: d(5.0) },
  });

  // Counters
  await prisma.trialCounter.createMany({ data: [{ year: 2026, lastValue: 1 }, { year: 2025, lastValue: 1 }] });

  // Trials
  const tomato = await prisma.trial.create({
    data: {
      code: "ST/2026/0001", seedName: "Roma Tomato", state: TrialState.IN_TRIAL,
      categoryId: veg.id, seasonId: spring.id, countryId: jo.id, supplierId: green.id,
      germinationRate: d(92), purity: d(98.5), npkN: d(12), npkP: d(8), npkK: d(10),
      shelfLife: 24, supplierBatchNumber: "TOM-2026-001", dateStart: new Date("2026-03-05"),
      managerId: manager.id, createdById: manager.id,
    },
  });
  const wheat = await prisma.trial.create({
    data: {
      code: "ST/2025/0001", seedName: "Durum Wheat", state: TrialState.REVIEW,
      categoryId: cer.id, seasonId: autumn.id, countryId: sy.id, supplierId: agri.id,
      germinationRate: d(85), purity: d(96), npkN: d(15), npkP: d(10), npkK: d(5),
      shelfLife: 36, supplierBatchNumber: "WHT-2025-014", dateStart: new Date("2025-09-10"),
      managerId: manager.id, createdById: manager.id,
    },
  });

  // Distributions
  const dTomNorth = await prisma.distribution.create({
    data: { trialId: tomato.id, nurseryId: north.id, seasonId: spring.id, distributedQty: d(500), distributionDate: new Date("2026-03-06") },
  });
  const dTomSouth = await prisma.distribution.create({
    data: { trialId: tomato.id, nurseryId: south.id, seasonId: spring.id, distributedQty: d(300), distributionDate: new Date("2026-03-06") },
  });
  const dWheatValley = await prisma.distribution.create({
    data: { trialId: wheat.id, nurseryId: valley.id, seasonId: autumn.id, distributedQty: d(1000), distributionDate: new Date("2025-09-12") },
  });

  // Followups
  const fu = [
    { dist: dTomNorth, trial: tomato, date: "2026-03-15", g: 90, gr: 5, p: 0, notes: "Seedlings emerging well." },
    { dist: dTomNorth, trial: tomato, date: "2026-04-15", g: 91, gr: 12, p: 0 },
    { dist: dTomSouth, trial: tomato, date: "2026-03-20", g: 88, gr: 4, p: 0 },
    { dist: dWheatValley, trial: wheat, date: "2025-09-25", g: 84, gr: 8, p: 0 },
    { dist: dWheatValley, trial: wheat, date: "2025-10-25", g: 86, gr: 25, p: 500 },
  ];
  for (const f of fu) {
    await prisma.followup.create({
      data: {
        distributionId: f.dist.id, trialId: f.trial.id, nurseryId: f.dist.nurseryId, seasonId: f.dist.seasonId,
        measurementDate: new Date(f.date), germinationRate: d(f.g), growthCm: d(f.gr), productionQty: d(f.p),
        notes: f.notes ?? null, recordedById: tech.id,
      },
    });
  }

  // Recompute stored aggregates (distribution + trial).
  for (const dist of [dTomNorth, dTomSouth, dWheatValley]) {
    const rows = await prisma.followup.findMany({ where: { distributionId: dist.id }, select: { germinationRate: true, growthCm: true, productionQty: true } });
    await prisma.distribution.update({
      where: { id: dist.id },
      data: {
        avgGermination: d(mean(rows.map((r) => Number(r.germinationRate ?? 0)))),
        avgGrowth: d(mean(rows.map((r) => Number(r.growthCm ?? 0)))),
        avgProduction: d(mean(rows.map((r) => Number(r.productionQty ?? 0)))),
      },
    });
  }
  for (const tr of [tomato, wheat]) {
    const rows = await prisma.followup.findMany({ where: { trialId: tr.id }, select: { germinationRate: true, growthCm: true, productionQty: true } });
    await prisma.trial.update({
      where: { id: tr.id },
      data: {
        avgGermination: d(mean(rows.map((r) => Number(r.germinationRate ?? 0)))),
        avgGrowth: d(mean(rows.map((r) => Number(r.growthCm ?? 0)))),
        avgProduction: d(mean(rows.map((r) => Number(r.productionQty ?? 0)))),
      },
    });
  }

  // Seed creation audit rows for the two trials.
  for (const tr of [tomato, wheat]) {
    await prisma.auditLog.create({
      data: { action: "CREATE", resModel: "Trial", resId: tr.id, resName: tr.code, trialId: tr.id, newValue: "DRAFT", userId: manager.id, description: "create" },
    });
  }

  console.log("Seed complete. Logins (password: Passw0rd!):");
  console.log("  owner@almasa.test / manager@almasa.test / tech@almasa.test");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
