import { cookies } from "next/headers";

import {
  createServerSupabaseClient,
  getAppSession,
  type AppSession,
} from "@/modules/provider-boundaries/auth";

export async function createTRPCContext(): Promise<{
  session: AppSession | null;
}> {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  return {
    session: await getAppSession(supabase),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
