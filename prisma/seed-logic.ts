import type { PrismaClient } from "@prisma/client";
import { Role, TrialState } from "@prisma/client";
import bcrypt from "bcryptjs";

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Idempotent demo seed (ported from Odoo demo_data.xml). Reused by local + Neon-HTTP provisioning.
export async function seed(prisma: PrismaClient) {
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

  const jo = await prisma.country.create({ data: { code: "JO", nameAr: "الأردن", nameEn: "Jordan" } });
  const sy = await prisma.country.create({ data: { code: "SY", nameAr: "سوريا", nameEn: "Syria" } });

  const spring = await prisma.season.create({
    data: { name: "Spring 2026", code: "SP26", dateStart: new Date("2026-03-01"), dateEnd: new Date("2026-05-31") },
  });
  const autumn = await prisma.season.create({
    data: { name: "Autumn 2025", code: "AU25", dateStart: new Date("2025-09-01"), dateEnd: new Date("2025-11-30") },
  });

  const veg = await prisma.seedCategory.create({ data: { name: "Vegetables", code: "VEG" } });
  const cer = await prisma.seedCategory.create({ data: { name: "Cereals", code: "CER" } });

  const green = await prisma.supplier.create({ data: { name: "Green Seeds Co." } });
  const agri = await prisma.supplier.create({ data: { name: "AgriSource Ltd." } });

  const pw = await bcrypt.hash("Passw0rd!", 10);
  const manager = await prisma.user.create({ data: { name: "Manager", email: "manager@almasa.test", passwordHash: pw, role: Role.MANAGER } });
  await prisma.user.create({ data: { name: "Owner", email: "owner@almasa.test", passwordHash: pw, role: Role.OWNER } });
  const tech = await prisma.user.create({ data: { name: "Sara (Technician)", email: "tech@almasa.test", passwordHash: pw, role: Role.TECHNICIAN } });

  const north = await prisma.nursery.create({
    data: { name: "North Nursery", code: "N-01", location: "Irbid", areaHectare: 3.5, technicians: { connect: { id: tech.id } } },
  });
  const south = await prisma.nursery.create({ data: { name: "South Nursery", code: "N-02", location: "Karak", areaHectare: 2.0 } });
  const valley = await prisma.nursery.create({ data: { name: "Valley Nursery", code: "N-03", location: "Jordan Valley", areaHectare: 5.0 } });

  await prisma.trialCounter.createMany({ data: [{ year: 2026, lastValue: 1 }, { year: 2025, lastValue: 1 }] });

  const tomato = await prisma.trial.create({
    data: {
      code: "ST/2026/0001", seedName: "Roma Tomato", state: TrialState.IN_TRIAL,
      categoryId: veg.id, seasonId: spring.id, countryId: jo.id, supplierId: green.id,
      germinationRate: 92, purity: 98.5, npkN: 12, npkP: 8, npkK: 10, shelfLife: 24,
      supplierBatchNumber: "TOM-2026-001", dateStart: new Date("2026-03-05"), managerId: manager.id, createdById: manager.id,
    },
  });
  const wheat = await prisma.trial.create({
    data: {
      code: "ST/2025/0001", seedName: "Durum Wheat", state: TrialState.REVIEW,
      categoryId: cer.id, seasonId: autumn.id, countryId: sy.id, supplierId: agri.id,
      germinationRate: 85, purity: 96, npkN: 15, npkP: 10, npkK: 5, shelfLife: 36,
      supplierBatchNumber: "WHT-2025-014", dateStart: new Date("2025-09-10"), managerId: manager.id, createdById: manager.id,
    },
  });

  const dTomNorth = await prisma.distribution.create({ data: { trialId: tomato.id, nurseryId: north.id, seasonId: spring.id, distributedQty: 500, distributionDate: new Date("2026-03-06") } });
  const dTomSouth = await prisma.distribution.create({ data: { trialId: tomato.id, nurseryId: south.id, seasonId: spring.id, distributedQty: 300, distributionDate: new Date("2026-03-06") } });
  const dWheatValley = await prisma.distribution.create({ data: { trialId: wheat.id, nurseryId: valley.id, seasonId: autumn.id, distributedQty: 1000, distributionDate: new Date("2025-09-12") } });

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
        measurementDate: new Date(f.date), germinationRate: f.g, growthCm: f.gr, productionQty: f.p,
        notes: f.notes ?? null, recordedById: tech.id,
      },
    });
  }

  for (const dist of [dTomNorth, dTomSouth, dWheatValley]) {
    const rows = await prisma.followup.findMany({ where: { distributionId: dist.id }, select: { germinationRate: true, growthCm: true, productionQty: true } });
    await prisma.distribution.update({
      where: { id: dist.id },
      data: {
        avgGermination: mean(rows.map((r) => Number(r.germinationRate ?? 0))),
        avgGrowth: mean(rows.map((r) => Number(r.growthCm ?? 0))),
        avgProduction: mean(rows.map((r) => Number(r.productionQty ?? 0))),
      },
    });
  }
  for (const tr of [tomato, wheat]) {
    const rows = await prisma.followup.findMany({ where: { trialId: tr.id }, select: { germinationRate: true, growthCm: true, productionQty: true } });
    await prisma.trial.update({
      where: { id: tr.id },
      data: {
        avgGermination: mean(rows.map((r) => Number(r.germinationRate ?? 0))),
        avgGrowth: mean(rows.map((r) => Number(r.growthCm ?? 0))),
        avgProduction: mean(rows.map((r) => Number(r.productionQty ?? 0))),
      },
    });
  }

  for (const tr of [tomato, wheat]) {
    await prisma.auditLog.create({
      data: { action: "CREATE", resModel: "Trial", resId: tr.id, resName: tr.code, trialId: tr.id, newValue: "DRAFT", userId: manager.id, description: "create" },
    });
  }
}
