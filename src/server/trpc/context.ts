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
  createUnavailableContactRepository,
  type ContactRepository,
} from "@/modules/contacts";
import { createDrizzleContactRepository } from "@/modules/contacts/infrastructure/drizzle-contact-repository";
import {
  createUnavailableHandReceiptRepository,
  type HandReceiptRepository,
} from "@/modules/hand-receipts";
import { createDrizzleHandReceiptRepository } from "@/modules/hand-receipts/infrastructure/drizzle-hand-receipt-repository";
import {
  createUnavailableItemRepository,
  type ItemRepository,
} from "@/modules/items";
import { createDrizzleItemRepository } from "@/modules/items/infrastructure/drizzle-item-repository";
import {
  createUnavailableLocationRepository,
  type LocationRepository,
} from "@/modules/locations";
import { createDrizzleLocationRepository } from "@/modules/locations/infrastructure/drizzle-location-repository";
import {
  createUnavailableRequirementCompletionRepository,
  createUnavailableRequirementRepository,
  type RequirementCompletionRepository,
  type RequirementRepository,
} from "@/modules/requirements";
import { createDrizzleRequirementCompletionRepository } from "@/modules/requirements/infrastructure/drizzle-requirement-completion-repository";
import { createDrizzleRequirementRepository } from "@/modules/requirements/infrastructure/drizzle-requirement-repository";
import { type AppSession } from "@/modules/provider-boundaries/auth";
import { getCurrentServerAppSession } from "@/modules/provider-boundaries/auth/server-session";
import {
  createDrizzleAppUnitOfWork,
  createUnavailableAppUnitOfWork,
  type AppUnitOfWork,
} from "@/modules/provider-boundaries/database/app-unit-of-work";
import { getDrizzleClient } from "@/modules/provider-boundaries/database/drizzle";

export async function createTRPCContext(): Promise<{
  session: AppSession | null;
  account: AccountRecord | null;
  accountRepository: ReturnType<typeof createDrizzleAccountRepository>;
  auditRepository: AuditRepository;
  contactRepository: ContactRepository;
  handReceiptRepository: HandReceiptRepository;
  itemRepository: ItemRepository;
  locationRepository: LocationRepository;
  requirementCompletionRepository?: RequirementCompletionRepository;
  requirementRepository: RequirementRepository;
  unitOfWork: AppUnitOfWork;
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
      contactRepository: createUnavailableContactRepository(),
      handReceiptRepository: createUnavailableHandReceiptRepository(),
      itemRepository: createUnavailableItemRepository(),
      locationRepository: createUnavailableLocationRepository(),
      requirementCompletionRepository:
        createUnavailableRequirementCompletionRepository(),
      requirementRepository: createUnavailableRequirementRepository(),
      unitOfWork: createUnavailableAppUnitOfWork(),
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
    contactRepository: createDrizzleContactRepository(db, {
      authSubject: session.userId,
    }),
    handReceiptRepository: createDrizzleHandReceiptRepository(db, {
      authSubject: session.userId,
    }),
    itemRepository: createDrizzleItemRepository(db, {
      authSubject: session.userId,
    }),
    locationRepository: createDrizzleLocationRepository(db, {
      authSubject: session.userId,
    }),
    requirementCompletionRepository:
      createDrizzleRequirementCompletionRepository(db, {
        authSubject: session.userId,
      }),
    requirementRepository: createDrizzleRequirementRepository(db, {
      authSubject: session.userId,
    }),
    unitOfWork: createDrizzleAppUnitOfWork(db, {
      authSubject: session.userId,
    }),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
