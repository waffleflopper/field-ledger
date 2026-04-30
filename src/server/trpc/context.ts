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
import {
  createUnavailableHandReceiptRepository,
  type HandReceiptRepository,
} from "@/modules/hand-receipts";
import { createDrizzleHandReceiptRepository } from "@/modules/hand-receipts/infrastructure/drizzle-hand-receipt-repository";
import { type AppSession } from "@/modules/provider-boundaries/auth";
import { getCurrentServerAppSession } from "@/modules/provider-boundaries/auth/server-session";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

export async function createTRPCContext(): Promise<{
  session: AppSession | null;
  account: AccountRecord | null;
  accountRepository: ReturnType<typeof createDrizzleAccountRepository>;
  auditRepository: AuditRepository;
  handReceiptRepository: HandReceiptRepository;
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
      handReceiptRepository: createUnavailableHandReceiptRepository(),
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
      authSubject: session.userId,
    }),
    handReceiptRepository: createDrizzleHandReceiptRepository(db, {
      authSubject: session.userId,
    }),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
