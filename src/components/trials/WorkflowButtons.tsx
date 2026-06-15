"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TrialState, type Role } from "@prisma/client";
import {
  startTrial,
  sendToReview,
  acceptTrial,
  rejectTrial,
  resetToDraft,
} from "@/server/trials";
import { canStart, canToReview, canAccept, canReject, canReset } from "@/lib/workflow";
import { canAcceptTrial } from "@/lib/authz";
import { Button } from "@/components/ui";

export function WorkflowButtons({
  trialId,
  state,
  role,
}: {
  trialId: string;
  state: TrialState;
  role: Role;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startT] = useTransition();
  const isMgr = canAcceptTrial(role);

  function run(fn: () => Promise<unknown>, okMsg: string) {
    startT(async () => {
      try {
        await fn();
        toast.success(okMsg);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const key = msg.startsWith("errors.") ? msg : "errors.denied";
        toast.error(t(key));
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canStart(state) && (
        <Button disabled={pending} onClick={() => run(() => startTrial(trialId), t("actions.start"))}>
          {t("actions.start")}
        </Button>
      )}
      {canToReview(state) && (
        <Button disabled={pending} onClick={() => run(() => sendToReview(trialId), t("actions.toReview"))}>
          {t("actions.toReview")}
        </Button>
      )}
      {isMgr && canAccept(state) && (
        <Button
          disabled={pending}
          onClick={() => {
            if (confirm(t("confirm.acceptBody"))) run(() => acceptTrial(trialId), t("actions.accept"));
          }}
        >
          {t("actions.accept")}
        </Button>
      )}
      {isMgr && canReject(state) && (
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => {
            const reason = prompt(t("trial.rejectionReason"));
            if (reason && reason.trim()) run(() => rejectTrial(trialId, reason), t("actions.reject"));
            else if (reason !== null) toast.error(t("errors.rejectReason"));
          }}
        >
          {t("actions.reject")}
        </Button>
      )}
      {isMgr && canReset(state) && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (confirm(t("confirm.resetBody"))) run(() => resetToDraft(trialId), t("actions.reset"));
          }}
        >
          {t("actions.reset")}
        </Button>
      )}
    </div>
  );
}
