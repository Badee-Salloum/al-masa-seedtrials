"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { submitAnalysis } from "@/server/trials";
import { Button, Field, Select, Textarea } from "@/components/ui";

export function AnalysisForm({
  trialId,
  note,
  recommendation,
}: {
  trialId: string;
  note: string | null;
  recommendation: "ACCEPT" | "REJECT" | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [n, setN] = useState(note ?? "");
  const [r, setR] = useState<string>(recommendation ?? "");

  function save() {
    start(async () => {
      try {
        await submitAnalysis(trialId, {
          analysisNote: n,
          recommendation: r as "ACCEPT" | "REJECT" | "",
        });
        toast.success(t("trial.saveAnalysis"));
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "";
        toast.error(t(m.startsWith("errors.") ? m : "errors.denied"));
      }
    });
  }

  return (
    <div className="space-y-3">
      <Field label={t("trial.recommendation")}>
        <Select value={r} onChange={(e) => setR(e.target.value)}>
          <option value="">{t("trial.noRecommendation")}</option>
          <option value="ACCEPT">{t("trial.recommendAccept")}</option>
          <option value="REJECT">{t("trial.recommendReject")}</option>
        </Select>
      </Field>
      <Field label={t("trial.analysisNote")}>
        <Textarea rows={4} value={n} onChange={(e) => setN(e.target.value)} />
      </Field>
      <Button disabled={pending} onClick={save}>
        {t("trial.saveAnalysis")}
      </Button>
    </div>
  );
}
