import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionUser } from "@/lib/session";
import { getTrial } from "@/server/queries";
import { TrialReport, type ReportData } from "@/pdf/TrialReport";
import { formatNpk } from "@/lib/npk";
import { fmtNum, fmtDate } from "@/lib/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const trial = await getTrial(user, id); // scoped — technicians only get own-nursery trials
  if (!trial) return new Response("Not found", { status: 404 });

  const data: ReportData = {
    code: trial.code,
    seedName: trial.seedName,
    stateLabel: trial.state,
    season: trial.season?.name ?? null,
    category: trial.category?.name ?? null,
    germination: fmtNum(trial.germinationRate),
    purity: fmtNum(trial.purity),
    npk: formatNpk(
      trial.npkN?.toString(),
      trial.npkP?.toString(),
      trial.npkK?.toString(),
    ),
    shelfLife: trial.shelfLife,
    country: trial.country?.nameEn ?? null,
    supplier: trial.supplier?.name ?? null,
    batch: trial.supplierBatchNumber,
    avgGermination: fmtNum(trial.avgGermination),
    avgGrowth: fmtNum(trial.avgGrowth),
    avgProduction: fmtNum(trial.avgProduction),
    decidedBy: trial.decisionUser?.name ?? null,
    decisionDate: trial.decisionDate ? fmtDate(trial.decisionDate) : null,
    rejectionReason: trial.rejectionReason,
    followups: [...trial.followups].reverse().map((f) => ({
      date: fmtDate(f.measurementDate),
      nursery: f.distribution.nursery.name,
      germination: fmtNum(f.germinationRate),
      growth: fmtNum(f.growthCm),
      production: fmtNum(f.productionQty),
      notes: f.notes,
    })),
  };

  const buffer = await renderToBuffer(
    createElement(TrialReport, { data }) as Parameters<typeof renderToBuffer>[0],
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Seed Trial - ${trial.code.replace(/\//g, "-")}.pdf"`,
    },
  });
}
