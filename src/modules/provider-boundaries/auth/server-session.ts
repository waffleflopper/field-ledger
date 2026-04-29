import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { getAppSession } from "@/modules/provider-boundaries/auth/session";
import {
  createMiddlewareSupabaseClient,
  createServerSupabaseClient,
} from "@/modules/provider-boundaries/auth/supabase-server";

export async function getCurrentServerAppSession() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  return getAppSession(supabase);
}

export async function getMiddlewareAppSession({
  request,
  response,
}: {
  request: NextRequest;
  response: NextResponse;
}) {
  const supabase = createMiddlewareSupabaseClient({ request, response });

  return getAppSession(supabase);
}
