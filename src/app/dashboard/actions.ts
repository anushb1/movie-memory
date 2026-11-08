"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { movieSchema } from "@/lib/validation";

export type EditMovieState = { error?: string; value?: string; savedAt?: number };

/**
 * Change the logged-in user's favorite movie. Same validation as onboarding
 * (one shared schema), and scoped by the session user id.
 *
 * No cache-clearing code is needed: facts are cached per (user, movie), so a
 * new movie simply has no fresh fact yet and the next request generates one.
 */
export async function updateFavoriteMovie(
  _prev: EditMovieState,
  formData: FormData,
): Promise<EditMovieState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const raw = formData.get("movie");
  const parsed = movieSchema.safeParse(typeof raw === "string" ? raw : undefined);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid movie.",
      value: typeof raw === "string" ? raw : "",
    };
  }

  if (parsed.data !== user.favoriteMovie) {
    await prisma.user.update({
      where: { id: user.id },
      data: { favoriteMovie: parsed.data },
    });
    // Re-render the dashboard on the server with the new movie (and a fact for it).
    revalidatePath("/dashboard");
  }
  return { savedAt: Date.now() };
}
