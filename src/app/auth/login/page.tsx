import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <Suspense
        fallback={
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            Loading sign-in...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
