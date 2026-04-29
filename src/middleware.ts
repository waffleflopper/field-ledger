import { NextResponse, type NextRequest } from "next/server";

import {
  createMiddlewareSupabaseClient,
  getAppSession,
} from "@/modules/provider-boundaries/auth";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });
  const supabase = createMiddlewareSupabaseClient({ request, response });
  const session = await getAppSession(supabase);

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
