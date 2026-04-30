"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  getSafeAuthRedirectPath,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/modules/provider-boundaries/auth";
import { Button } from "@/components/ui/button";

type AuthMode = "sign-in" | "sign-up";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeAuthRedirectPath(searchParams.get("next"));
  const authError = searchParams.get("error");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result =
        mode === "sign-up"
          ? await signUpWithEmailPassword({ email, password })
          : await signInWithEmailPassword({ email, password });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
  }

  const isSignUp = mode === "sign-up";
  const title = isSignUp ? "Create account" : "Sign in";
  const description = isSignUp
    ? "Start a Field Ledger account for your personal property records."
    : "Use your Field Ledger account to enter the authenticated app area.";

  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Field Ledger
        </p>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div
        aria-label="Auth mode"
        className="mt-5 grid grid-cols-2 rounded-md border bg-muted p-1"
        role="tablist"
      >
        <button
          aria-selected={!isSignUp}
          className="h-9 rounded-sm text-sm font-medium text-muted-foreground transition-colors aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          onClick={() => selectMode("sign-in")}
          role="tab"
          type="button"
        >
          Sign in
        </button>
        <button
          aria-selected={isSignUp}
          className="h-9 rounded-sm text-sm font-medium text-muted-foreground transition-colors aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          onClick={() => selectMode("sign-up")}
          role="tab"
          type="button"
        >
          Register
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            autoComplete="email"
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      {(message || authError) && (
        <p className="mt-4 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {message ?? authError}
        </p>
      )}
    </div>
  );
}
