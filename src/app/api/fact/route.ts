import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { FactUnavailableError, getOrCreateFact, NoFavoriteMovieError } from "@/lib/facts";

/**
 * GET /api/fact: the current user's fun fact (cached for 60s).
 *
 * Deliberately takes NO userId parameter: the user is whoever the session
 * cookie says. There's no way to ask for someone else's facts.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { fact, source } = await getOrCreateFact(userId);
    return NextResponse.json({
      fact: { movie: fact.movie, content: fact.content, createdAt: fact.createdAt },
      source,
    });
  } catch (err) {
    if (err instanceof FactUnavailableError) {
      return NextResponse.json(
        { error: "Couldn't get a fun fact right now. Please try again shortly." },
        { status: 503 },
      );
    }
    if (err instanceof NoFavoriteMovieError) {
      return NextResponse.json({ error: "Finish onboarding first" }, { status: 409 });
    }
    console.error("[api/fact] unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
