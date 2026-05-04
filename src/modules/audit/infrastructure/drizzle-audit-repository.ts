import { and, desc, eq, or, sql } from "drizzle-orm";

import { auditEvents } from "@/db/schema";
import type { AuditRepository } from "@/modules/audit/application/audit-repository";
import type {
  AuditAction,
  AuditEventRecord,
  AuditMetadata,
} from "@/modules/audit/application/types";
import { normalizeRecentActivityLimit } from "@/modules/audit/application/list-activity";
import type { AuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { AuthenticatedDatabaseTransaction } from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type AuditEventRow = typeof auditEvents.$inferSelect;
type AuditOperation = <T>(
  operation: (transaction: AuthenticatedDatabaseTransaction) => Promise<T>,
) => Promise<T>;

function toAuditEventRecord(row: AuditEventRow): AuditEventRecord {
  return {
    id: row.id,
    accountId: row.accountId,
    actorId: row.actorId,
    action: row.action as AuditAction,
    targetType: row.targetType,
    targetId: row.targetId,
    occurredAt: row.occurredAt,
    metadata: row.metadata as AuditMetadata,
    createdAt: row.createdAt,
  };
}

function createAuditRepository(run: AuditOperation): AuditRepository {
  return {
    async record(event) {
      const [createdEvent] = await run((transaction) =>
        transaction.insert(auditEvents).values(event).returning(),
      );

      if (!createdEvent) {
        throw new Error("Audit event was not recorded.");
      }

      return toAuditEventRecord(createdEvent);
    },
    async listByAccountId(accountId, options = {}) {
      const limit = normalizeRecentActivityLimit(options.limit);
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(auditEvents)
          .where(eq(auditEvents.accountId, accountId))
          .orderBy(desc(auditEvents.occurredAt))
          .limit(limit),
      );

      return rows.map(toAuditEventRecord);
    },
    async listByTarget(accountId, target, options = {}) {
      const limit = normalizeRecentActivityLimit(options.limit);
      const targetFilter =
        target.targetType === "hand_receipt"
          ? or(
              and(
                eq(auditEvents.targetType, target.targetType),
                eq(auditEvents.targetId, target.targetId),
              ),
              sql`${auditEvents.metadata}->>'handReceiptId' = ${target.targetId}`,
            )
          : and(
              eq(auditEvents.targetType, target.targetType),
              eq(auditEvents.targetId, target.targetId),
            );
      const rows = await run((transaction) =>
        transaction
          .select()
          .from(auditEvents)
          .where(and(eq(auditEvents.accountId, accountId), targetFilter))
          .orderBy(desc(auditEvents.occurredAt))
          .limit(limit),
      );

      return rows.map(toAuditEventRecord);
    },
  };
}

export function createDrizzleAuditRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): AuditRepository {
  return createAuditRepository((operation) =>
    runWithAuthenticatedDatabaseSession(db, session, operation),
  );
}

export function createTransactionalDrizzleAuditRepository(
  transaction: AuthenticatedDatabaseTransaction,
): AuditRepository {
  return createAuditRepository((operation) => operation(transaction));
}
