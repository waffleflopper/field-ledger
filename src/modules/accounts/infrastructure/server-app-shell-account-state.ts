import { getAppShellAccountState } from "@/modules/accounts/application/app-shell-account-state";
import { createDrizzleAccountRepository } from "@/modules/accounts/infrastructure/drizzle-account-repository";
import { getCurrentServerAppSession } from "@/modules/provider-boundaries/auth/server-session";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

export async function getServerAppShellAccountState() {
  const session = await getCurrentServerAppSession();

  if (!session) {
    return null;
  }

  return getAppShellAccountState({
    session,
    repository: createDrizzleAccountRepository(getDrizzleClient()),
  });
}
