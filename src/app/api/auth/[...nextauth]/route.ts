// Mounts Auth.js at /api/auth/* (e.g. /api/auth/callback/google, which is
// the redirect URI registered in Google Cloud Console).
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
