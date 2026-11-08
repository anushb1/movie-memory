"use client";

import { useActionState, useRef } from "react";
import { saveFavoriteMovie, type OnboardingState } from "./actions";
import { MOVIE_MAX } from "@/lib/validation";

const SUGGESTIONS = ["Interstellar", "Spirited Away", "The Dark Knight", "La La Land"];

// Client component: it only handles the UI (pending + error display + the
// suggestion chips). Saving and validation happen in the server action.
export function MovieForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    saveFavoriteMovie,
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Clicking a chip just fills the input; the user still presses Save.
  const pick = (title: string) => {
    if (!inputRef.current) return;
    inputRef.current.value = title;
    inputRef.current.focus();
  };

  return (
    <form action={formAction} className="mt-8" noValidate>
      <label htmlFor="movie" className="text-sm font-semibold text-zinc-800">
        What&apos;s your favorite movie?
      </label>
      <input
        ref={inputRef}
        id="movie"
        name="movie"
        defaultValue={state.value}
        placeholder="e.g. Interstellar"
        maxLength={MOVIE_MAX} // a UX hint only; the server enforces the real limit
        autoFocus
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? "movie-error" : undefined}
        className="mt-2 w-full rounded-xl border-2 border-zinc-200 px-4 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-100"
      />
      {state.error && (
        <p id="movie-error" role="alert" className="animate-fade-in mt-2 text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggestions">
        {SUGGESTIONS.map((title) => (
          <button
            key={title}
            type="button"
            onClick={() => pick(title)}
            className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-100 active:scale-95"
          >
            {title}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/30 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70"
      >
        {pending && <Spinner />}
        {pending ? "Saving…" : "Save my favorite movie"}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
