import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentServerAppSession } from "@/modules/provider-boundaries/auth/server-session";

export default async function AppHomePage() {
  const session = await getCurrentServerAppSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-10 sm:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Authenticated app area
          </p>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Welcome{session.email ? `, ${session.email}` : ""}.
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            This protected route proves the Field Ledger session boundary before
            account setup and the full app shell land in later slices.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </section>
    </main>
  );
}
