import { deriveAccountCapabilities } from "@/modules/billing";
import type { AppSession } from "@/modules/provider-boundaries/auth";
import {
  ensureAccount,
  getOnboardingStatus,
  type AccountRepository,
} from "@/modules/accounts/application/ensure-account";

type GetAppShellAccountStateInput = {
  session: AppSession;
  repository: AccountRepository;
  now?: Date;
  createAccountId?: () => string;
};

export async function getAppShellAccountState({
  session,
  repository,
  now,
  createAccountId,
}: GetAppShellAccountStateInput) {
  const ensureInput: Parameters<typeof ensureAccount>[0] = {
    userId: session.userId,
    repository,
  };

  if (now) {
    ensureInput.now = now;
  }

  if (createAccountId) {
    ensureInput.createAccountId = createAccountId;
  }

  const account = await ensureAccount(ensureInput);
  const capabilities = deriveAccountCapabilities(account, now);
  const onboardingStatus = now
    ? getOnboardingStatus({ account, now })
    : getOnboardingStatus({ account });

  return {
    account,
    capabilities,
    onboardingStatus,
  };
}
