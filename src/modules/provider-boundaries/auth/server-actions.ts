import {
  createServerSupabaseClient,
  type CookieStore,
} from "@/modules/provider-boundaries/auth/supabase-server";

export async function exchangeAuthCodeForSession({
  code,
  cookieStore,
}: {
  code: string;
  cookieStore: CookieStore;
}) {
  const supabase = createServerSupabaseClient(cookieStore);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}

export async function signOutCurrentSession(cookieStore: CookieStore) {
  const supabase = createServerSupabaseClient(cookieStore);
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}
