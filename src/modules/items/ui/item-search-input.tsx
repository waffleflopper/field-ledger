"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ItemSearchInput({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label="Search items"
        className="h-11 rounded-lg bg-card pl-9 pr-10 text-sm"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search ECN, serial, item, receipt, contact, or location"
        ref={inputRef}
        type="search"
        value={value}
      />
      {value ? (
        <Button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
