import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

function getAuthErrorMessage(
  error: { message?: string | undefined } | null | undefined,
) {
  return error?.message ?? "Field Ledger could not complete that auth request.";
}

export async function signInWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { error } = await authClient.signIn.email({ email, password });

  if (error) {
    return { ok: false as const, message: getAuthErrorMessage(error) };
  }

  return { ok: true as const };
}

export async function signUpWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { error } = await authClient.signUp.email({
    email,
    password,
    name: email,
  });

  if (error) {
    return { ok: false as const, message: getAuthErrorMessage(error) };
  }

  return { ok: true as const };
}
