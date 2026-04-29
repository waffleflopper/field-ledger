import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import { createServerSupabaseClient } from "@/modules/provider-boundaries/auth/supabase-server";

export async function exchangeAuthCodeForSession({
  code,
  cookieStore,
}: {
  code: string;
  cookieStore: ReadonlyRequestCookies;
}) {
  const supabase = createServerSupabaseClient(cookieStore);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}

export async function signOutCurrentSession(
  cookieStore: ReadonlyRequestCookies,
) {
  const supabase = createServerSupabaseClient(cookieStore);
  await supabase.auth.signOut();
}
