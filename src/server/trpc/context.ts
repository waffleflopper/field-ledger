import {
  ensureAccount,
  type AccountRecord,
} from "@/modules/accounts/application/ensure-account";
import { createDrizzleAccountRepository } from "@/modules/accounts/infrastructure/drizzle-account-repository";
import { type AppSession } from "@/modules/provider-boundaries/auth";
import { getCurrentServerAppSession } from "@/modules/provider-boundaries/auth/server-session";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

export async function createTRPCContext(): Promise<{
  session: AppSession | null;
  account: AccountRecord | null;
}> {
  const session = await getCurrentServerAppSession();

  if (!session) {
    return {
      session: null,
      account: null,
    };
  }

  const db = getDrizzleClient();
  const account = await ensureAccount({
    userId: session.userId,
    repository: createDrizzleAccountRepository(db),
  });

  return {
    session,
    account,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
