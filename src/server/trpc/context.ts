import {
  ensureAccount,
  type AccountRecord,
} from "@/modules/accounts/application/ensure-account";
import { createDrizzleAccountRepository } from "@/modules/accounts/infrastructure/drizzle-account-repository";
import {
  createUnavailableAuditRepository,
  type AuditRepository,
} from "@/modules/audit";
import { createDrizzleAuditRepository } from "@/modules/audit/infrastructure/drizzle-audit-repository";
import { type AppSession } from "@/modules/provider-boundaries/auth";
import { getCurrentServerAppSession } from "@/modules/provider-boundaries/auth/server-session";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

export async function createTRPCContext(): Promise<{
  session: AppSession | null;
  account: AccountRecord | null;
  accountRepository: ReturnType<typeof createDrizzleAccountRepository>;
  auditRepository: AuditRepository;
}> {
  const db = getDrizzleClient();
  const accountRepository = createDrizzleAccountRepository(db);
  const session = await getCurrentServerAppSession();

  if (!session) {
    return {
      session: null,
      account: null,
      accountRepository,
      auditRepository: createUnavailableAuditRepository(),
    };
  }

  const account = await ensureAccount({
    userId: session.userId,
    repository: accountRepository,
  });

  return {
    session,
    account,
    accountRepository,
    auditRepository: createDrizzleAuditRepository(db, {
      authUserId: session.userId,
    }),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
