import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Returns the logged-in user's DB row, or null if not logged in.
 * The id comes from the server-side session, never from the request,
 * so a client can't ask to act as someone else.
 */
export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/**
 * The one routing rule for the whole app:
 *   not logged in        -> "/"            (landing)
 *   logged in, no movie  -> "/onboarding"
 *   logged in, has movie -> "/dashboard"
 * We check "has a movie?" rather than "is this a new account?" so a user who
 * quit halfway through onboarding is sent back there, not to an empty dashboard.
 */
export function homeFor(user: { favoriteMovie: string | null } | null) {
  if (!user) return "/";
  return user.favoriteMovie ? "/dashboard" : "/onboarding";
}
