import { describe, expect, it } from "vitest";
import { movieSchema, MOVIE_MAX } from "@/lib/validation";

describe("movieSchema", () => {
  it("trims and collapses whitespace", () => {
    expect(movieSchema.parse("   The   Matrix  ")).toBe("The Matrix");
  });

  it("rejects empty and whitespace-only input", () => {
    expect(movieSchema.safeParse("").success).toBe(false);
    expect(movieSchema.safeParse("     ").success).toBe(false);
  });

  it("rejects non-strings (e.g. a missing form field)", () => {
    expect(movieSchema.safeParse(undefined).success).toBe(false);
  });

  it("accepts exactly the max length and rejects one over", () => {
    expect(movieSchema.safeParse("a".repeat(MOVIE_MAX)).success).toBe(true);
    expect(movieSchema.safeParse("a".repeat(MOVIE_MAX + 1)).success).toBe(false);
  });

  it("measures length AFTER trimming", () => {
    // 100 real chars padded with spaces is still valid
    expect(movieSchema.safeParse(`  ${"a".repeat(MOVIE_MAX)}  `).success).toBe(true);
  });
});
