"use client";

import { AlertTriangle, ClipboardList, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/trpc/react";

type AccessState = "trialing" | "active" | "paused_read_only";

type OnboardingStatus = {
  completed: boolean;
  completedAt: Date | null;
  accessState: AccessState;
  isReadOnly: boolean;
};

function getAccessStateCopy(accessState: AccessState, isReadOnly: boolean) {
  if (accessState === "paused_read_only" || isReadOnly) {
    return "Your account is currently read-only. You can still review existing accountable records, but new hand receipt work waits until access is restored.";
  }

  return "When the hand receipt workflow lands, the dashboard will point you toward creating your first hand receipt.";
}

export function OnboardingNotice({
  initialStatus,
}: {
  initialStatus: OnboardingStatus;
}) {
  const status = trpc.accounts.getOnboardingStatus.useQuery(undefined, {
    initialData: initialStatus,
    staleTime: 60_000,
  });
  const utils = trpc.useUtils();
  const [dismissedForSession, setDismissedForSession] = useState(false);
  const completeOnboarding = trpc.accounts.completeOnboarding.useMutation({
    async onSuccess() {
      setDismissedForSession(true);
      await utils.accounts.getOnboardingStatus.invalidate();
    },
  });

  if (status.data.completed || dismissedForSession) {
    return null;
  }

  return (
    <Dialog open>
      <DialogContent
        className="gap-5 sm:p-6"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </div>
          <DialogTitle>Property accountability only</DialogTitle>
          <DialogDescription>
            Field Ledger helps you manage personal hand receipts, assigned
            property, active 2062s, and item requirements. It is not an official
            Army system of record.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="flex gap-3 rounded-lg border bg-muted/60 p-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-amber-700"
            />
            <p className="text-sm leading-6 text-foreground">
              Do not store classified information, PHI, or sensitive operational
              details in Field Ledger.
            </p>
          </div>
          <div className="flex gap-3 rounded-lg border bg-card p-3">
            <ClipboardList
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <p className="text-sm leading-6 text-muted-foreground">
              {getAccessStateCopy(
                status.data.accessState,
                status.data.isReadOnly,
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={completeOnboarding.isPending}
            onClick={() => completeOnboarding.mutate()}
            type="button"
          >
            I understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
