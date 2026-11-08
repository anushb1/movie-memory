"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Re-runs the dashboard's server components (router.refresh) so the fact box
 * asks the server again. Within 60s the server returns the cached fact;
 * after that it generates a new one. The cache rules live on the server,
 * not here.
 */
export function RefreshFact() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95 disabled:opacity-70"
    >
      <svg
        viewBox="0 0 20 20"
        className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M16 10a6 6 0 1 1-1.76-4.24M16 4v3.5h-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {pending ? "Checking…" : "Refresh"}
    </button>
  );
}
