const localSupabaseUrl = "http://127.0.0.1:54331";
const localPublishableKey =
  "replace-with-local-publishable-key-from-pnpm-supabase-status";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? localSupabaseUrl;
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? localPublishableKey
  );
}
