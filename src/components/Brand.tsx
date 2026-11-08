// Small presentational pieces shared by several pages.

/** Film-frame logo mark. */
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="3" y="6" width="26" height="20" rx="4" fill="currentColor" opacity="0.18" />
      <rect x="3" y="6" width="26" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M13 12.5v7l6-3.5-6-3.5z" fill="currentColor" />
      <path d="M7 6v20M25 6v20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2.5" />
    </svg>
  );
}

/** Soft, slowly drifting blobs for purple backgrounds. Purely decorative. */
export function Blobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-float absolute -left-24 -top-24 h-80 w-80 rounded-full bg-fuchsia-400/30 blur-3xl" />
      <div
        className="animate-float absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="animate-float absolute left-1/2 top-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
