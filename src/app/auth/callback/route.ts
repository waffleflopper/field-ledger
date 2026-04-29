import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { exchangeAuthCodeForSession } from "@/modules/provider-boundaries/auth";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing-code", request.url),
    );
  }

  const result = await exchangeAuthCodeForSession({
    code,
    cookieStore: await cookies(),
  });

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(result.message)}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(new URL("/app", request.url));
}
