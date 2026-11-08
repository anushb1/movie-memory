import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Blobs, Logo } from "@/components/Brand";
import { MovieForm } from "./MovieForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  // Onboarding is first-time only: anyone who already has a movie skips it.
  if (user.favoriteMovie) redirect("/dashboard");

  const firstName = user.name?.split(" ")[0];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 px-4 py-12">
      <Blobs />
      <div className="animate-pop relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-purple-950/40 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Logo className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
          Welcome to Movie Memory{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="mt-2 text-zinc-600">
          One question to get started. You can change it later.
        </p>
        <MovieForm />
      </div>
    </main>
  );
}
