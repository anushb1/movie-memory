import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { getCurrentUser, homeFor } from "@/lib/session";

export default async function LandingPage() {
  // Already logged in? Skip the landing page.
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
        <h1 className="text-2xl font-semibold text-zinc-900">Movie Memory</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Save your favorite movie and get a fun fact about it.
        </p>
        {/* A server action: the click posts to the server, which starts the
            Google OAuth redirect. After Google, we come back to "/" and the
            redirect above sends the user to onboarding or the dashboard. */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
