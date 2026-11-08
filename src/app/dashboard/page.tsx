import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/session";
import { FunFact, FunFactSkeleton } from "./FunFact";
import { EditMovie } from "./EditMovie";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Logged out and visiting /dashboard -> back to login (PDF requirement).
  if (!user) redirect("/");
  if (!user.favoriteMovie) redirect("/onboarding");

  // Google may omit name or photo: fall back instead of crashing.
  const displayName = user.name ?? user.email ?? "Movie fan";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={56}
              height={56}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-700">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{displayName}</p>
            {user.email && (
              <p className="truncate text-sm text-zinc-600">{user.email}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Favorite movie
          </p>
          <EditMovie movie={user.favoriteMovie} />
        </div>

        <div className="mt-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Did you know?
          </p>
          <Suspense key={user.favoriteMovie} fallback={<FunFactSkeleton />}>
            <FunFact userId={user.id} />
          </Suspense>
        </div>

        <form
          className="mt-8"
          action={async () => {
            "use server";
            // Deletes the Session row and clears the cookie.
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-100"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
