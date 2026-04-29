import { NextResponse, type NextRequest } from "next/server";

import { getMiddlewareAppSession } from "@/modules/provider-boundaries/auth/server-session";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });
  const session = await getMiddlewareAppSession({ request, response });

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
