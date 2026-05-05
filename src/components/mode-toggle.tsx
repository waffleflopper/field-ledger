"use client";

import { useEffect, useState } from "react";
import { Moon, Monitor, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themeOptions = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

type ModeToggleProps = {
  className?: string;
  contentAlign?: "start" | "center" | "end";
  labelClassName?: string;
};

function ThemeIcon({ resolvedTheme }: { resolvedTheme: string | undefined }) {
  if (resolvedTheme === "dark") {
    return <Moon aria-hidden="true" className="size-4 shrink-0" />;
  }

  if (resolvedTheme === "light") {
    return <Sun aria-hidden="true" className="size-4 shrink-0" />;
  }

  return <Monitor aria-hidden="true" className="size-4 shrink-0" />;
}

export function ModeToggle({
  className,
  contentAlign = "start",
  labelClassName,
}: ModeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme, theme } = useTheme();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <Button
        aria-hidden="true"
        className={cn("pointer-events-none", className)}
        size="sm"
        tabIndex={-1}
        type="button"
        variant="ghost"
      >
        <Monitor aria-hidden="true" className="size-4 shrink-0" />
        <span className={labelClassName}>Theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Theme: ${theme ?? "system"}`}
          className={className}
          data-testid="mode-toggle"
          size="sm"
          type="button"
          variant="ghost"
        >
          <ThemeIcon resolvedTheme={resolvedTheme} />
          <span className={labelClassName}>Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={contentAlign} className="min-w-36">
        <DropdownMenuRadioGroup
          onValueChange={(value) => setTheme(value)}
          value={theme ?? "system"}
        >
          {themeOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
