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
      <div className="mt-1 flex items-center gap-3">
        <p className="text-lg font-medium text-zinc-900">{movie}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-300 hover:bg-zinc-100"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-2" noValidate>
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
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900 aria-[invalid=true]:border-red-500"
      />
      {state.error && (
        <p id="edit-movie-error" role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
