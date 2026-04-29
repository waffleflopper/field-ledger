import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { NextRequest, NextResponse } from "next/server";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/modules/provider-boundaries/auth/config";

type MutableCookieStore = ReadonlyRequestCookies & {
  set?: unknown;
};

export function createServerSupabaseClient(cookieStore: MutableCookieStore) {
  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (typeof cookieStore.set !== "function") {
          return;
        }

        const setCookie = cookieStore.set as (
          name: string,
          value: string,
          options?: CookieOptions,
        ) => void;

        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options);
        });
      },
    },
  });
}

export function createMiddlewareSupabaseClient({
  request,
  response,
}: {
  request: NextRequest;
  response: NextResponse;
}) {
  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });
}
