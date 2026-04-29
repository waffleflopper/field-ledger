import type { SupabaseClient, User } from "@supabase/supabase-js";

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

function toAppSession(user: User): AppSession {
  return {
    userId: user.id,
    email: user.email ?? null,
  };
}

export async function getAppSession(
  supabaseClient: Pick<SupabaseClient, "auth">,
): Promise<AppSession | null> {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return toAppSession(data.user);
}

export async function requireAppSession(
  supabaseClient: Pick<SupabaseClient, "auth">,
) {
  const session = await getAppSession(supabaseClient);

  if (!session) {
    throw new MissingAppSessionError();
  }

  return session;
}
