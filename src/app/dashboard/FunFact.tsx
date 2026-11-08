import { getOrCreateFact, type FactSource } from "@/lib/facts";

const SOURCE_LABEL: Record<FactSource, string> = {
  generated: "Freshly generated",
  cache: "Cached · new fact after 60s",
  fallback: "AI unavailable · showing your latest fact",
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
      // key = fact id, so the fade-in replays whenever a NEW fact arrives
      <div key={fact.id} className="animate-fade-up">
        <p className="mt-4 text-lg leading-relaxed text-white sm:text-xl">{fact.content}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-violet-50 ring-1 ring-white/20">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              source === "generated" ? "bg-emerald-300" : source === "cache" ? "bg-white" : "bg-amber-300"
            }`}
          />
          {SOURCE_LABEL[source]}
        </span>
      </div>
    );
  } catch (err) {
    // Log the real error for us; show a friendly message to the user.
    console.error("[fact] no fact available:", err);
    return (
      <p role="alert" className="animate-fade-in mt-4 text-violet-50">
        We couldn&apos;t fetch a fun fact right now. Please try again in a moment.
      </p>
    );
  }
}

export function FunFactSkeleton() {
  const bar =
    "h-4 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(255,255,255,0.35),rgba(255,255,255,0.12))] bg-[length:200%_100%] animate-shimmer";
  return (
    <div className="mt-5 space-y-3" aria-label="Loading fun fact">
      <div className={`${bar} w-full`} />
      <div className={`${bar} w-11/12`} />
      <div className={`${bar} w-2/3`} />
    </div>
  );
}
