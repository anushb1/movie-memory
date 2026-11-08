import { z } from "zod";

export const MOVIE_MIN = 1;
export const MOVIE_MAX = 100;

/**
 * The ONE definition of a valid movie title, used by every server path that
 * saves a movie (onboarding now, any later "edit movie" endpoint too).
 *
 * 1. Normalize: trim the ends and collapse inner runs of whitespace,
 *    so "  The   Matrix " and "The Matrix" are stored identically.
 *    That matters later: the fact cache is keyed by (user, movie).
 * 2. Then check length on the CLEANED value, so "     " (only spaces)
 *    becomes "" and is rejected as empty.
 */
export const movieSchema = z
  .string({ error: "Please enter a movie title." })
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(MOVIE_MIN, "Please enter a movie title.")
      .max(MOVIE_MAX, `Keep it under ${MOVIE_MAX} characters.`),
  );

export type ValidMovie = z.infer<typeof movieSchema>;
