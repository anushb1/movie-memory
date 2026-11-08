"use client";

import { useActionState } from "react";
import { saveFavoriteMovie, type OnboardingState } from "./actions";
import { MOVIE_MAX } from "@/lib/validation";

// Client component: it only handles the UI (pending + error display).
// The actual saving and validation happen in the server action.
export function MovieForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    saveFavoriteMovie,
    {},
  );

  return (
    <form action={formAction} className="mt-6" noValidate>
      <label htmlFor="movie" className="text-sm font-medium text-zinc-800">
        What&apos;s your favorite movie?
      </label>
      <input
        id="movie"
        name="movie"
        defaultValue={state.value}
        placeholder="e.g. Interstellar"
        maxLength={MOVIE_MAX} // a UX hint only; the server enforces the real limit
        autoFocus
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? "movie-error" : undefined}
        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900 aria-[invalid=true]:border-red-500"
      />
      {state.error && (
        <p id="movie-error" role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save my favorite movie"}
      </button>
    </form>
  );
}
