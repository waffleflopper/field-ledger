import type { ReactNode } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { BottomNav } from "@/components/shell/bottom-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingNotice } from "@/modules/accounts/ui/onboarding-notice";
import type { getOnboardingStatus } from "@/modules/accounts/application/ensure-account";

type InitialOnboardingStatus = ReturnType<typeof getOnboardingStatus>;

export function AppShell({
  children,
  initialOnboardingStatus,
}: {
  children: ReactNode;
  initialOnboardingStatus: InitialOnboardingStatus;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-svh bg-background">
          <div className="flex min-h-svh flex-col">
            <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 md:px-8 md:pb-8 md:pt-6">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
            <BottomNav />
            <OnboardingNotice initialStatus={initialOnboardingStatus} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
