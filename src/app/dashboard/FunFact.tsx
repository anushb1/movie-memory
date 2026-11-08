import { getOrCreateFact, type FactSource } from "@/lib/facts";

const SOURCE_LABEL: Record<FactSource, string> = {
  generated: "Freshly generated",
  cache: "Cached: a new fact is generated after 60 seconds",
  fallback: "The AI is unavailable right now, so this is your most recent fact",
};

/**
 * Async SERVER component: it gets the fact on the server and streams it into
 * the page. The dashboard wraps it in <Suspense>, so the profile shows
 * instantly and only this box waits.
 */
export async function FunFact({ userId }: { userId: string }) {
  try {
    const { fact, source } = await getOrCreateFact(userId);
    return (
      <>
        <p className="mt-2 leading-relaxed text-zinc-800">{fact.content}</p>
        <p className="mt-2 text-xs text-amber-800/80">{SOURCE_LABEL[source]}</p>
      </>
    );
  } catch (err) {
    // Log the real error for us; show a friendly message to the user.
    console.error("[fact] no fact available:", err);
    return (
      <p role="alert" className="mt-2 text-sm text-zinc-600">
        We couldn&apos;t fetch a fun fact right now. Please try again in a moment.
      </p>
    );
  }
}

export function FunFactSkeleton() {
  return (
    <div className="mt-3 space-y-2" aria-label="Loading fun fact">
      <div className="h-3 w-full animate-pulse rounded bg-zinc-200" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200" />
    </div>
  );
}
