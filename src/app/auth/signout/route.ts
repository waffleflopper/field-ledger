import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { signOutCurrentSession } from "@/modules/provider-boundaries/auth";

export async function POST(request: NextRequest) {
  await signOutCurrentSession(await cookies());

  return NextResponse.redirect(new URL("/auth/login", request.url));
}
