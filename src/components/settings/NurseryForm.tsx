"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { upsertNursery } from "@/server/config";
import { Button, Field, Input } from "@/components/ui";

export function NurseryForm({ technicians }: { technicians: { id: string; name: string }[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function submit() {
    start(async () => {
      try {
        await upsertNursery({
          name,
          code: code || null,
          location: location || null,
          areaHectare: area ? Number(area) : null,
          technicianIds: selected,
        });
        toast.success(t("actions.save"));
        setName("");
        setCode("");
        setLocation("");
        setArea("");
        setSelected([]);
        router.refresh();
      } catch {
        toast.error(t("errors.denied"));
      }
    });
  }

  return (
    <div className="grid max-w-xl gap-3 sm:grid-cols-2">
      <Field label={t("nursery.name")}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t("nursery.code")}>
        <Input value={code} onChange={(e) => setCode(e.target.value)} />
      </Field>
      <Field label={t("nursery.location")}>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <Field label={t("nursery.area")}>
        <Input type="number" step="0.01" value={area} onChange={(e) => setArea(e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <span className="text-sm font-medium text-muted">{t("nursery.technicians")}</span>
        <div className="mt-1 flex flex-wrap gap-3">
          {technicians.map((u) => (
            <label key={u.id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
              />
              {u.name}
            </label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <Button disabled={pending || !name} onClick={submit}>
          {t("actions.new")}
        </Button>
      </div>
    </div>
  );
}
