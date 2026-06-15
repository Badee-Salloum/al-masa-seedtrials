import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import { STATE_PILL } from "@/lib/ui";
import type { TrialState } from "@prisma/client";

export function StateBadge({ state }: { state: TrialState }) {
  const t = useTranslations("state");
  return <Badge className={STATE_PILL[state]}>{t(state)}</Badge>;
}
