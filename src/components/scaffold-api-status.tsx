"use client";

import { trpc } from "@/trpc/react";

export function ScaffoldApiStatus() {
  const health = trpc.foundation.health.useQuery();

  if (health.isPending) {
    return (
      <p className="text-sm text-muted-foreground">
        Checking typed API foundation...
      </p>
    );
  }

  if (health.isError) {
    return (
      <p className="text-sm text-destructive">
        API foundation check failed: {health.error.message}
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Typed API foundation: {health.data.api} + {health.data.queryClient}{" "}
      {health.data.status}
    </p>
  );
}
