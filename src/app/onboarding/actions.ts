"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { movieSchema } from "@/lib/validation";

export type OnboardingState = { error?: string; value?: string };

/**
 * Runs on the SERVER when the onboarding form is submitted.
 * Anything the browser sends is untrusted, so we re-check everything here,
 * even though the form also has a maxLength hint.
 */
export async function saveFavoriteMovie(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // 1. Who is this? Taken from the session cookie, never from the form.
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // 2. Validate + normalize the input.
  const raw = formData.get("movie");
  const parsed = movieSchema.safeParse(typeof raw === "string" ? raw : undefined);
  if (!parsed.success) {
    // Send the message back to the form, and keep what they typed.
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid movie.",
      value: typeof raw === "string" ? raw : "",
    };
  }

  // 3. Save it, scoped to THIS user. `favoriteMovie: null` in the filter
  //    makes onboarding first-time only even if someone replays the request:
  //    it can set a movie, but never overwrite one.
  await prisma.user.updateMany({
    where: { id: user.id, favoriteMovie: null },
    data: { favoriteMovie: parsed.data },
  });

  // 4. Done (or already onboarded): go to the dashboard.
  redirect("/dashboard");
}
