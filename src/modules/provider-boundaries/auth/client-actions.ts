import { createBrowserSupabaseClient } from "@/modules/provider-boundaries/auth/supabase-browser";

function isSameOriginRedirect(redirectTo: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return new URL(redirectTo).origin === window.location.origin;
  } catch {
    return false;
  }
}

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
  if (!isSameOriginRedirect(redirectTo)) {
    return {
      ok: false as const,
      message: "Magic-link redirects must stay on this Field Ledger origin.",
    };
  }

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
