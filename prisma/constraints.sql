-- Raw constraints not expressible in Prisma schema. Apply AFTER `prisma migrate`/`db push`.
-- Idempotent where practical (drop-if-exists for triggers).

-- CHECK constraints (mirror the Odoo SQL constraints).
ALTER TABLE "Trial" DROP CONSTRAINT IF EXISTS trial_germination_range;
ALTER TABLE "Trial" ADD CONSTRAINT trial_germination_range
  CHECK ("germinationRate" IS NULL OR ("germinationRate" >= 0 AND "germinationRate" <= 100));
ALTER TABLE "Trial" DROP CONSTRAINT IF EXISTS trial_purity_range;
ALTER TABLE "Trial" ADD CONSTRAINT trial_purity_range
  CHECK ("purity" IS NULL OR ("purity" >= 0 AND "purity" <= 100));
ALTER TABLE "Trial" DROP CONSTRAINT IF EXISTS trial_npk_nonneg;
ALTER TABLE "Trial" ADD CONSTRAINT trial_npk_nonneg
  CHECK (("npkN" IS NULL OR "npkN" >= 0) AND ("npkP" IS NULL OR "npkP" >= 0) AND ("npkK" IS NULL OR "npkK" >= 0));
ALTER TABLE "Trial" DROP CONSTRAINT IF EXISTS trial_shelflife_nonneg;
ALTER TABLE "Trial" ADD CONSTRAINT trial_shelflife_nonneg
  CHECK ("shelfLife" IS NULL OR "shelfLife" >= 0);
ALTER TABLE "Trial" DROP CONSTRAINT IF EXISTS trial_date_order;
ALTER TABLE "Trial" ADD CONSTRAINT trial_date_order
  CHECK ("dateStart" IS NULL OR "dateEnd" IS NULL OR "dateEnd" >= "dateStart");

ALTER TABLE "Distribution" DROP CONSTRAINT IF EXISTS dist_qty_nonneg;
ALTER TABLE "Distribution" ADD CONSTRAINT dist_qty_nonneg
  CHECK ("distributedQty" IS NULL OR "distributedQty" >= 0);

ALTER TABLE "Followup" DROP CONSTRAINT IF EXISTS fu_germination_range;
ALTER TABLE "Followup" ADD CONSTRAINT fu_germination_range
  CHECK ("germinationRate" IS NULL OR ("germinationRate" >= 0 AND "germinationRate" <= 100));
ALTER TABLE "Followup" DROP CONSTRAINT IF EXISTS fu_growth_nonneg;
ALTER TABLE "Followup" ADD CONSTRAINT fu_growth_nonneg
  CHECK ("growthCm" IS NULL OR "growthCm" >= 0);
ALTER TABLE "Followup" DROP CONSTRAINT IF EXISTS fu_production_nonneg;
ALTER TABLE "Followup" ADD CONSTRAINT fu_production_nonneg
  CHECK ("productionQty" IS NULL OR "productionQty" >= 0);

-- Followup.trialId must equal its distribution's trialId (Odoo @api.constrains parity).
CREATE OR REPLACE FUNCTION enforce_followup_trial_consistency() RETURNS trigger AS $$
DECLARE dist_trial text;
BEGIN
  SELECT "trialId" INTO dist_trial FROM "Distribution" WHERE id = NEW."distributionId";
  IF dist_trial IS NULL OR dist_trial <> NEW."trialId" THEN
    RAISE EXCEPTION 'followup trial must match distribution trial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_followup_trial_consistency ON "Followup";
CREATE TRIGGER trg_followup_trial_consistency
  BEFORE INSERT OR UPDATE ON "Followup"
  FOR EACH ROW EXECUTE FUNCTION enforce_followup_trial_consistency();

-- AuditLog immutability: append-only. Block all DELETEs, and block UPDATEs that change
-- content — but ALLOW the FK-nulling updates from onDelete:SetNull so logs survive trial/user
-- deletion (Odoo parity: logs persist with trialId nulled).
CREATE OR REPLACE FUNCTION block_audit_content_update() RETURNS trigger AS $$
BEGIN
  IF NEW."action" IS DISTINCT FROM OLD."action"
     OR NEW."oldValue" IS DISTINCT FROM OLD."oldValue"
     OR NEW."newValue" IS DISTINCT FROM OLD."newValue"
     OR NEW."fieldName" IS DISTINCT FROM OLD."fieldName"
     OR NEW."logDate" IS DISTINCT FROM OLD."logDate"
     OR NEW."resModel" IS DISTINCT FROM OLD."resModel"
     OR NEW."resId" IS DISTINCT FROM OLD."resId" THEN
    RAISE EXCEPTION 'audit log is append-only';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_audit_no_content_update ON "AuditLog";
CREATE TRIGGER trg_audit_no_content_update BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION block_audit_content_update();

CREATE OR REPLACE FUNCTION block_audit_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit log is append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_audit_no_delete ON "AuditLog";
CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION block_audit_delete();
