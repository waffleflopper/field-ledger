"use client";

import { useEffect, useState } from "react";

import { ItemSearchInput } from "@/modules/items/ui/item-search-input";
import {
  ItemSearchNoResultsState,
  ItemSearchStartState,
} from "@/modules/items/ui/item-search-empty-state";
import { ItemSearchResults } from "@/modules/items/ui/item-search-results";
import { trpc } from "@/trpc/react";

export function ItemsSearchWorkspace() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const capabilitiesQuery = trpc.billing.capabilities.useQuery();
  const trimmedQuery = debouncedQuery.trim();
  const searchQuery = trpc.items.search.useQuery(
    {
      query: trimmedQuery,
      includeArchived,
    },
    {
      enabled: trimmedQuery.length > 0,
    },
  );
  const results = searchQuery.data ?? [];
  const isReadOnly = capabilitiesQuery.data?.isReadOnly ?? false;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  function renderSearchState() {
    if (trimmedQuery.length === 0) {
      return <ItemSearchStartState />;
    }

    if (searchQuery.isLoading || query !== debouncedQuery) {
      return (
        <div className="space-y-2">
          <div className="h-24 rounded-lg border bg-card" />
          <div className="h-24 rounded-lg border bg-card" />
        </div>
      );
    }

    if (searchQuery.error) {
      return (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {searchQuery.error.message}
        </div>
      );
    }

    if (results.length > 0) {
      return <ItemSearchResults results={results} />;
    }

    return <ItemSearchNoResultsState includeArchived={includeArchived} />;
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Global search
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Items
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Search across active hand receipts without choosing the bucket first.
          Results keep hand receipt context visible.
        </p>
      </div>

      {isReadOnly ? (
        <p className="rounded-lg border bg-secondary px-4 py-3 text-sm text-muted-foreground">
          This account is read-only. Search and item detail remain available,
          but record changes are paused until access is restored.
        </p>
      ) : null}

      <div className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <ItemSearchInput onChange={setQuery} value={query} />
        <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
          <input
            checked={includeArchived}
            className="size-4 rounded border-border accent-primary"
            onChange={(event) => setIncludeArchived(event.target.checked)}
            type="checkbox"
          />
          Include archived item records
        </label>
      </div>

      {renderSearchState()}
    </section>
  );
}
