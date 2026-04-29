import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { getServerAppShellAccountState } from "@/modules/accounts/infrastructure/server-app-shell-account-state";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const shellAccountState = await getServerAppShellAccountState();

  if (!shellAccountState) {
    redirect("/auth/login");
  }

  return (
    <AppShell initialOnboardingStatus={shellAccountState.onboardingStatus}>
      {children}
    </AppShell>
  );
}
