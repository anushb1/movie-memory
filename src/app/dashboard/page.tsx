import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/session";
import { Blobs, Logo } from "@/components/Brand";
import { FunFact, FunFactSkeleton } from "./FunFact";
import { EditMovie } from "./EditMovie";
import { RefreshFact } from "./RefreshFact";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Logged out and visiting /dashboard -> back to login (PDF requirement).
  if (!user) redirect("/");
  if (!user.favoriteMovie) redirect("/onboarding");

  // Google may omit name or photo: fall back instead of crashing.
  const displayName = user.name ?? user.email ?? "Movie fan";
  const firstName = user.name?.split(" ")[0] ?? displayName;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-white">
      {/* ---- Purple header block ---- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 pb-28 text-white">
        <Blobs />
        <div className="relative mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-semibold tracking-tight">Movie Memory</span>
          </div>
          <form
            action={async () => {
              "use server";
              // Deletes the Session row and clears the cookie.
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25 active:scale-95"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="animate-fade-up relative mx-auto flex max-w-4xl items-center gap-5 px-6 pt-6">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 rounded-full ring-4 ring-white/80 shadow-xl"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-violet-700 ring-4 ring-white/40 shadow-xl">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm text-violet-200">Welcome back</p>
            <h1 className="truncate text-3xl font-bold tracking-tight">{firstName}</h1>
            {user.email && <p className="truncate text-sm text-violet-100">{user.email}</p>}
          </div>
        </div>
      </section>

      {/* ---- White cards overlapping the purple block ---- */}
      <section className="relative mx-auto -mt-20 grid max-w-4xl gap-5 px-6 pb-16 md:grid-cols-5">
        <div
          className="animate-fade-up rounded-3xl bg-white p-7 shadow-xl shadow-purple-900/10 ring-1 ring-zinc-100 md:col-span-2"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
            Favorite movie
          </p>
          <EditMovie movie={user.favoriteMovie} />
        </div>

        <div
          className="animate-fade-up relative overflow-hidden rounded-3xl bg-violet-600 p-7 text-white shadow-xl shadow-violet-600/30 md:col-span-3"
          style={{ animationDelay: "200ms" }}
        >
          <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-100">
              ✦ Did you know?
            </p>
            <RefreshFact />
          </div>
          <div className="relative">
            <Suspense key={user.favoriteMovie} fallback={<FunFactSkeleton />}>
              <FunFact userId={user.id} />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
