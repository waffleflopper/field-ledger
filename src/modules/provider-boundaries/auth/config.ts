const localSupabaseUrl = "http://127.0.0.1:54331";
const localPublishableKey =
  "replace-with-local-publishable-key-from-pnpm-supabase-status";

export function getSupabaseUrl() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("getSupabaseUrl requires NEXT_PUBLIC_SUPABASE_URL.");
  }

  return localSupabaseUrl;
}

export function getSupabasePublishableKey() {
  if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "getSupabasePublishableKey requires NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return localPublishableKey;
}
