import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MovieForm } from "./MovieForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  // Onboarding is first-time only: anyone who already has a movie skips it.
  if (user.favoriteMovie) redirect("/dashboard");

  const firstName = user.name?.split(" ")[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <h1 className="text-xl font-semibold text-zinc-900">
          Welcome to Movie Memory{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Tell us one movie and we&apos;ll keep it, plus a fun fact about it.
        </p>
        <MovieForm />
      </div>
    </main>
  );
}
