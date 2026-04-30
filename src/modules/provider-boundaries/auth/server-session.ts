import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

import { auth } from "@/modules/provider-boundaries/auth/better-auth";
import { getAppSession } from "@/modules/provider-boundaries/auth/session";

export async function getCurrentServerAppSession() {
  const authSession = await auth.api.getSession({
    headers: await headers(),
  });

  return getAppSession(authSession);
}

export function hasMiddlewareAppSession(request: NextRequest) {
  return Boolean(getSessionCookie(request));
}
