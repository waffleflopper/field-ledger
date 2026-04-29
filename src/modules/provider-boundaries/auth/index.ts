export {
  requestMagicLink,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/modules/provider-boundaries/auth/client-actions";
export { getSafeAuthRedirectPath } from "@/modules/provider-boundaries/auth/redirect";
export { createBrowserSupabaseClient } from "@/modules/provider-boundaries/auth/supabase-browser";
export {
  exchangeAuthCodeForSession,
  signOutCurrentSession,
} from "@/modules/provider-boundaries/auth/server-actions";
export {
  createMiddlewareSupabaseClient,
  createServerSupabaseClient,
} from "@/modules/provider-boundaries/auth/supabase-server";
export {
  getAppSession,
  MissingAppSessionError,
  requireAppSession,
  type AppSession,
} from "@/modules/provider-boundaries/auth/session";
