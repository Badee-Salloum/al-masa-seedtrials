"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createTrial } from "@/server/trials";
import { Button, Field, Input, Select } from "@/components/ui";

type Opt = { id: string; name: string };

export function TrialForm({
  categories,
  seasons,
  countries,
  suppliers,
  managers,
}: {
  categories: Opt[];
  seasons: Opt[];
  countries: { id: string; nameEn: string }[];
  suppliers: Opt[];
  managers: Opt[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();

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
        const { id } = await createTrial(input);
        toast.success(t("actions.save"));
        router.push(`/trials/${id}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        toast.error(t(msg.startsWith("errors.") ? msg : "errors.denied"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label={t("trial.seedName")}>
          <Input name="seedName" required />
        </Field>
      </div>
      <Field label={t("trial.category")}>
        <Select name="categoryId" defaultValue="">
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("trial.season")}>
        <Select name="seasonId" defaultValue="">
          <option value="">—</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("trial.germinationRate")}>
        <Input name="germinationRate" type="number" step="0.01" min="0" max="100" />
      </Field>
      <Field label={t("trial.purity")}>
        <Input name="purity" type="number" step="0.01" min="0" max="100" />
      </Field>
      <Field label="NPK N"><Input name="npkN" type="number" step="0.01" min="0" /></Field>
      <Field label="NPK P"><Input name="npkP" type="number" step="0.01" min="0" /></Field>
      <Field label="NPK K"><Input name="npkK" type="number" step="0.01" min="0" /></Field>
      <Field label={t("trial.shelfLife")}>
        <Input name="shelfLife" type="number" step="1" min="0" />
      </Field>
      <Field label={t("trial.country")}>
        <Select name="countryId" defaultValue="">
          <option value="">—</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>{c.nameEn}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("trial.supplier")}>
        <Select name="supplierId" defaultValue="">
          <option value="">—</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("trial.batch")}><Input name="supplierBatchNumber" /></Field>
      <Field label={t("trial.manager")}>
        <Select name="managerId" defaultValue="">
          <option value="">—</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      </Field>
      <Field label={t("trial.dateStart")}><Input name="dateStart" type="date" /></Field>
      <Field label={t("trial.dateEnd")}><Input name="dateEnd" type="date" /></Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.loading") : t("actions.save")}
        </Button>
      </div>
    </form>
  );
}
