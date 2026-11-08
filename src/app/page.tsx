import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { getCurrentUser, homeFor } from "@/lib/session";
import { Blobs, GoogleIcon, Logo } from "@/components/Brand";

const STEPS = [
  { n: "1", title: "Sign in", body: "One click with Google." },
  { n: "2", title: "Pick a movie", body: "Tell us your all-time favorite." },
  { n: "3", title: "Get a fun fact", body: "AI digs up something you didn't know." },
];

export default async function LandingPage() {
  // Already logged in? Skip the landing page.
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 text-white">
      <Blobs />

      <header className="relative mx-auto flex w-full max-w-5xl items-center gap-2 px-6 py-6">
        <Logo className="h-8 w-8" />
        <span className="font-semibold tracking-tight">Movie Memory</span>
      </header>

      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="animate-fade-up rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium tracking-wide ring-1 ring-white/25 backdrop-blur">
          Your favorite movie, remembered
        </p>
        <h1
          className="animate-fade-up mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          Every great movie has a story behind the story.
        </h1>
        <p
          className="animate-fade-up mt-5 max-w-md text-base text-violet-100 sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Save your favorite film and get a fun fact about it, fresh every minute.
        </p>

        {/* A server action: the click posts to the server, which starts the
            Google OAuth redirect. After Google, we come back to "/" and the
            redirect above sends the user to onboarding or the dashboard. */}
        <form
          className="animate-fade-up mt-10"
          style={{ animationDelay: "240ms" }}
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="group inline-flex items-center gap-3 rounded-2xl bg-white px-7 py-4 text-base font-semibold text-violet-800 shadow-xl shadow-purple-950/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 active:scale-[0.98]"
          >
            <GoogleIcon />
            Sign in with Google
            <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
              →
            </span>
          </button>
        </form>

        <ol className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="animate-fade-up rounded-2xl bg-white p-5 text-left text-zinc-900 shadow-lg shadow-purple-950/20 transition duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${340 + i * 90}ms` }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
                {s.n}
              </span>
              <p className="mt-3 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
