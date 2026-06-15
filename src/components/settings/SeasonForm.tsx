"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { upsertSeason } from "@/server/config";
import { Button, Field, Input } from "@/components/ui";

export function SeasonForm() {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      try {
        await upsertSeason({
          name: String(fd.get("name") ?? ""),
          code: (fd.get("code") as string) || null,
          dateStart: (fd.get("dateStart") as string) || null,
          dateEnd: (fd.get("dateEnd") as string) || null,
        });
        toast.success(t("actions.save"));
        form.reset();
        router.refresh();
      } catch {
        toast.error(t("errors.denied"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-3 sm:grid-cols-2">
      <Field label={t("nursery.name")}><Input name="name" required /></Field>
      <Field label={t("nursery.code")}><Input name="code" /></Field>
      <Field label={t("trial.dateStart")}><Input name="dateStart" type="date" /></Field>
      <Field label={t("trial.dateEnd")}><Input name="dateEnd" type="date" /></Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>{t("actions.new")}</Button>
      </div>
    </form>
  );
}
