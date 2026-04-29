"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState, type ReactNode } from "react";
import superjson from "superjson";

import { trpc } from "@/trpc/react";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
