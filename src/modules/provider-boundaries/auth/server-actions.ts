import { headers } from "next/headers";

import { auth } from "@/modules/provider-boundaries/auth/better-auth";

export async function signOutCurrentSession() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  return { ok: true as const };
}
