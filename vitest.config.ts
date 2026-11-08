import { defineConfig } from "vitest/config";
import path from "node:path";

const testDbUrl =
  process.env.DATABASE_URL_TEST ??
  `postgresql://${process.env.USER}@localhost:5432/movie_memory_test`;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "test/empty.ts"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./test/global-setup.ts"],
    // Point Prisma at the separate test database, never the dev one.
    env: { DATABASE_URL: testDbUrl, OPENAI_API_KEY: "test-key-not-used" },
    // DB-backed test files share one database, so run files one at a time.
    fileParallelism: false,
  },
});
