import { NextResponse, type NextRequest } from "next/server";

import { signOutCurrentSession } from "@/modules/provider-boundaries/auth/server-actions";

export async function POST(request: NextRequest) {
  const result = await signOutCurrentSession();

  if (!result.ok) {
    console.error("Sign-out failed.", { error: result.message });

    return NextResponse.redirect(
      new URL("/auth/login?error=signout-failed", request.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/auth/login", request.url), 303);
}
