import { z } from "zod";

// Reusable scalar schemas mirroring the DB CHECK constraints (so client errors match the DB 1:1).
export const percentSchema = z.coerce.number().min(0, "errors.nonNegative").max(100);
export const nonNegativeSchema = z.coerce.number().min(0, "errors.nonNegative");
export const nonNegativeIntSchema = z.coerce.number().int().min(0, "errors.nonNegative");

const optionalId = z.string().min(1).optional().nullable();

export const trialSchema = z
  .object({
    seedName: z.string().trim().min(1),
    categoryId: optionalId,
    seasonId: optionalId,
    countryId: optionalId,
    supplierId: optionalId,
    germinationRate: percentSchema.optional().nullable(),
    purity: percentSchema.optional().nullable(),
    npkN: nonNegativeSchema.optional().nullable(),
    npkP: nonNegativeSchema.optional().nullable(),
    npkK: nonNegativeSchema.optional().nullable(),
    shelfLife: nonNegativeIntSchema.optional().nullable(),
    supplierBatchNumber: z.string().trim().optional().nullable(),
    dateStart: z.coerce.date().optional().nullable(),
    dateEnd: z.coerce.date().optional().nullable(),
    managerId: optionalId,
  })
  .refine(
    (d) => !d.dateStart || !d.dateEnd || d.dateEnd >= d.dateStart,
    { message: "errors.dateOrder", path: ["dateEnd"] },
  );

export const followupSchema = z.object({
  distributionId: z.string().min(1),
  measurementDate: z.coerce.date(),
  germinationRate: percentSchema.optional().nullable(),
  growthCm: nonNegativeSchema.optional().nullable(),
  productionQty: nonNegativeSchema.optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const distributionSchema = z.object({
  trialId: z.string().min(1),
  nurseryId: z.string().min(1),
  distributedQty: nonNegativeSchema.optional().nullable(),
  distributionDate: z.coerce.date().optional().nullable(),
  technicianId: optionalId,
});

export const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(1, "errors.rejectReason"),
});

export type TrialInput = z.infer<typeof trialSchema>;
export type FollowupInput = z.infer<typeof followupSchema>;
export type DistributionInput = z.infer<typeof distributionSchema>;
