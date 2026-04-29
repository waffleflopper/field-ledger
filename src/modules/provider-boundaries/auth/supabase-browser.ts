import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/modules/provider-boundaries/auth/config";

export function createBrowserSupabaseClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
