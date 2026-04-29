import { createBrowserSupabaseClient } from "@/modules/provider-boundaries/auth/supabase-browser";

export async function signInWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}

export async function signUpWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}

export async function requestMagicLink({
  email,
  redirectTo,
}: {
  email: string;
  redirectTo: string;
}) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}
