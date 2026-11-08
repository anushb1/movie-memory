"use client";

import { useActionState, useEffect, useState } from "react";
import { updateFavoriteMovie, type EditMovieState } from "./actions";
import { MOVIE_MAX } from "@/lib/validation";

// Shows the movie with an Edit button; Edit swaps in a small form.
// The server action does the real work; this only manages open/closed + errors.
export function EditMovie({ movie }: { movie: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<EditMovieState, FormData>(
    updateFavoriteMovie,
    {},
  );

  // Close the editor after a successful save (savedAt changes on each success).
  useEffect(() => {
    if (state.savedAt) setEditing(false);
  }, [state.savedAt]);

  if (!editing) {
    return (
      <div className="animate-fade-in">
        <p className="mt-3 break-words text-3xl font-bold leading-tight tracking-tight text-zinc-900">
          {movie}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-100 active:scale-95"
        >
          <span aria-hidden="true">✎</span> Change movie
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="animate-fade-in mt-3" noValidate>
      <label htmlFor="edit-movie" className="sr-only">
        Favorite movie
      </label>
      <input
        id="edit-movie"
        name="movie"
        // After a failed save keep what they typed; otherwise start from the current movie.
        defaultValue={state.error ? state.value : movie}
        maxLength={MOVIE_MAX}
        autoFocus
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? "edit-movie-error" : undefined}
        className="w-full rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-lg font-semibold text-zinc-900 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-100"
      />
      {state.error && (
        <p id="edit-movie-error" role="alert" className="animate-fade-in mt-2 text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 active:scale-95 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
