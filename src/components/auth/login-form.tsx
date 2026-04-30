"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  getSafeAuthRedirectPath,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/modules/provider-boundaries/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <Tabs
        className="mt-5"
        onValueChange={(value) => selectMode(value as AuthMode)}
        value={mode}
      >
        <TabsList aria-label="Auth mode" className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">Sign in</TabsTrigger>
          <TabsTrigger value="sign-up">Register</TabsTrigger>
        </TabsList>
      </Tabs>

      <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="field-ledger-auth-email">Email</Label>
          <Input
            autoComplete="email"
            className="h-10 bg-background"
            id="field-ledger-auth-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="field-ledger-auth-password">Password</Label>
          <Input
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="h-10 bg-background"
            id="field-ledger-auth-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
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
