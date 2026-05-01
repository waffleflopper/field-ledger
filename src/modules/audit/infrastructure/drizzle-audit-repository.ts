import { and, desc, eq } from "drizzle-orm";

import { auditEvents } from "@/db/schema";
import type { AuditRepository } from "@/modules/audit/application/audit-repository";
import type {
  AuditAction,
  AuditEventRecord,
  AuditMetadata,
} from "@/modules/audit/application/types";
import { normalizeRecentActivityLimit } from "@/modules/audit/application/list-activity";
import type { AuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import { runWithAuthenticatedDatabaseSession } from "@/modules/provider-boundaries/database/authenticated-session";
import type { createDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type AuditEventRow = typeof auditEvents.$inferSelect;

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

export function createDrizzleAuditRepository(
  db: DrizzleClient,
  session: AuthenticatedDatabaseSession,
): AuditRepository {
  return {
    async record(event) {
      const [createdEvent] = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        (transaction) =>
          transaction.insert(auditEvents).values(event).returning(),
      );

      if (!createdEvent) {
        throw new Error("Audit event was not recorded.");
      }

      return toAuditEventRecord(createdEvent);
    },
    async listByAccountId(accountId, options = {}) {
      const limit = normalizeRecentActivityLimit(options.limit);
      const rows = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        (transaction) =>
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
      const rows = await runWithAuthenticatedDatabaseSession(
        db,
        session,
        (transaction) =>
          transaction
            .select()
            .from(auditEvents)
            .where(
              and(
                eq(auditEvents.accountId, accountId),
                eq(auditEvents.targetType, target.targetType),
                eq(auditEvents.targetId, target.targetId),
              ),
            )
            .orderBy(desc(auditEvents.occurredAt))
            .limit(limit),
      );

      return rows.map(toAuditEventRecord);
    },
  };
}
