"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createFollowup } from "@/server/followups";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export function FollowupForm({
  distributions,
  preselect,
}: {
  distributions: { id: string; label: string }[];
  preselect?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = Object.fromEntries(
      Object.entries(Object.fromEntries(fd.entries())).map(([k, v]) => [
        k,
        v === "" ? undefined : v,
      ]),
    );
    start(async () => {
      try {
        await createFollowup(input);
        toast.success(t("actions.save"));
        router.push("/followups");
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        toast.error(t(msg.startsWith("errors.") ? msg : "errors.denied"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-4">
      <Field label={t("followup.distribution")}>
        <Select name="distributionId" defaultValue={preselect ?? ""} required>
          <option value="" disabled>
            —
          </option>
          {distributions.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("followup.measurementDate")}>
        <Input name="measurementDate" type="date" defaultValue={today} required />
      </Field>
      <Field label={t("trial.germinationRate")}>
        <Input name="germinationRate" type="number" step="0.01" min="0" max="100" inputMode="decimal" />
      </Field>
      <Field label={t("followup.growthCm")}>
        <Input name="growthCm" type="number" step="0.01" min="0" inputMode="decimal" />
      </Field>
      <Field label={t("followup.productionQty")}>
        <Input name="productionQty" type="number" step="0.01" min="0" inputMode="decimal" />
      </Field>
      <Field label={t("followup.notes")}>
        <Textarea name="notes" rows={3} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.loading") : t("actions.save")}
      </Button>
    </form>
  );
}
