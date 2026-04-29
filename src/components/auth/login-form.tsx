"use client";

import { KeyRound, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import {
  requestMagicLink,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/modules/provider-boundaries/auth";
import { Button } from "@/components/ui/button";

type AuthMode = "password" | "magic";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";
  const authError = searchParams.get("error");
  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "/auth/callback";
    }

    return `${window.location.origin}/auth/callback`;
  }, []);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await signInWithEmailPassword({ email, password });

    setIsSubmitting(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function handleLocalSignup() {
    setIsSubmitting(true);
    setMessage(null);

    const result = await signUpWithEmailPassword({ email, password });

    setIsSubmitting(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function handleMagicSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await requestMagicLink({
      email,
      redirectTo: callbackUrl,
    });

    setIsSubmitting(false);
    setMessage(
      result.ok
        ? "Check the local Inbucket inbox for your sign-in link."
        : result.message,
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Field Ledger
        </p>
        <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Use your local Supabase account to enter the authenticated app area.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-background px-3 text-sm font-medium data-[active=false]:bg-transparent data-[active=false]:text-muted-foreground"
          data-active={mode === "password"}
          onClick={() => setMode("password")}
          type="button"
        >
          <KeyRound aria-hidden="true" />
          Password
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-background px-3 text-sm font-medium data-[active=false]:bg-transparent data-[active=false]:text-muted-foreground"
          data-active={mode === "magic"}
          onClick={() => setMode("magic")}
          type="button"
        >
          <Mail aria-hidden="true" />
          Magic link
        </button>
      </div>

      {mode === "password" ? (
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
              autoComplete="current-password"
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button disabled={isSubmitting} type="submit">
              Sign in
            </Button>
            <Button
              disabled={isSubmitting || !email || password.length < 6}
              onClick={handleLocalSignup}
              type="button"
              variant="outline"
            >
              Create local user
            </Button>
          </div>
        </form>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleMagicSubmit}>
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
          <Button disabled={isSubmitting} type="submit">
            Send magic link
          </Button>
        </form>
      )}

      {(message || authError) && (
        <p className="mt-4 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {message ?? authError}
        </p>
      )}
    </div>
  );
}
