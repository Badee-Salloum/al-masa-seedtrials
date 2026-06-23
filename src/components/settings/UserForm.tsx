"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { upsertUser } from "@/server/config";
import { Button, Field, Input, Select } from "@/components/ui";

export function UserForm() {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.TECHNICIAN);

  function submit() {
    start(async () => {
      try {
        await upsertUser({ name, email, role, password });
        toast.success(t("actions.save"));
        setName("");
        setEmail("");
        setPassword("");
        setRole(Role.TECHNICIAN);
        router.refresh();
      } catch {
        toast.error(t("errors.denied"));
      }
    });
  }

  return (
    <div className="grid max-w-xl gap-3 sm:grid-cols-2">
      <Field label={t("user.name")}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t("user.email")}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t("user.password")}>
        <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label={t("user.role")}>
        <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>{t(`role.${r}`)}</option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Button disabled={pending || !name || !email || !password} onClick={submit}>
          {t("actions.new")}
        </Button>
      </div>
    </div>
  );
}
