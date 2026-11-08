import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Central Auth.js config. Everything auth-related is exported from here:
//  - handlers: the /api/auth/* routes (Google redirect + callback)
//  - auth():   read the current session in server code
//  - signIn / signOut: used by server actions (buttons)
export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter makes Auth.js create/find the User + Account rows in Postgres
  // on first Google login. Google's name/email/picture land in User.
  adapter: PrismaAdapter(prisma),

  // Google reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from .env automatically.
  providers: [Google],

  // "database" sessions: the browser holds only a random session token in an
  // httpOnly cookie; the real session lives in the Session table. Logging out
  // deletes that row, so the session is truly revoked server-side.
  session: { strategy: "database" },

  // Our landing page is the sign-in page.
  pages: { signIn: "/" },

  callbacks: {
    // Expose the DB user id on the session so server code can scope every
    // query by it (this is the backbone of authorization).
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
