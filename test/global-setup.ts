import { execSync } from "node:child_process";

// Runs once before the whole test suite: bring the TEST database's schema up
// to date with our migrations. Tests never touch the dev database.
export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST ?? defaultTestUrl() },
  });
}

export function defaultTestUrl() {
  return `postgresql://${process.env.USER}@localhost:5432/movie_memory_test`;
}
