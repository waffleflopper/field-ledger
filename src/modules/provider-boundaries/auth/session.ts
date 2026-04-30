import type { BetterAuthSession } from "@/modules/provider-boundaries/auth/better-auth";

export type AppSession = {
  userId: string;
  email: string | null;
};

export class MissingAppSessionError extends Error {
  constructor() {
    super("An authenticated Field Ledger session is required.");
    this.name = "MissingAppSessionError";
  }
}

function toAppSession(user: BetterAuthSession["user"]): AppSession {
  return {
    userId: user.id,
    email: user.email ?? null,
  };
}

export async function getAppSession(
  authSession: BetterAuthSession | null,
): Promise<AppSession | null> {
  if (!authSession?.user) {
    return null;
  }

  return toAppSession(authSession.user);
}

export async function requireAppSession(authSession: BetterAuthSession | null) {
  const session = await getAppSession(authSession);

  if (!session) {
    throw new MissingAppSessionError();
  }

  return session;
}
