import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Replace the real OpenAI client with a mock we control. No network, no cost,
// and we can count calls and simulate failures.
const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/openai", () => ({
  openai: { chat: { completions: { create } } },
  FACT_MODEL: "test-model",
}));

import { prisma } from "@/lib/prisma";
import { CACHE_WINDOW_MS, FactUnavailableError, getOrCreateFact, isFresh } from "@/lib/facts";
import { aiReply, makeFact, makeUser, resetDb } from "../../../test/helpers";

const SECONDS = 1000;

beforeEach(async () => {
  create.mockReset();
  await resetDb();
  vi.spyOn(console, "error").mockImplementation(() => {}); // keep expected-failure logs quiet
});
afterAll(() => prisma.$disconnect());

describe("isFresh (the 60-second rule)", () => {
  const now = new Date("2026-01-01T10:01:00Z");
  it("is fresh just inside the window", () => {
    expect(isFresh(new Date(now.getTime() - (CACHE_WINDOW_MS - 1)), now)).toBe(true);
  });
  it("is stale at exactly 60s and after", () => {
    expect(isFresh(new Date(now.getTime() - CACHE_WINDOW_MS), now)).toBe(false);
    expect(isFresh(new Date(now.getTime() - 61 * SECONDS), now)).toBe(false);
  });
});

describe("getOrCreateFact: 60-second cache", () => {
  it("generates and stores a fact when none exists", async () => {
    await makeUser("alice");
    create.mockResolvedValue(aiReply("Fact A"));

    const r = await getOrCreateFact("alice");

    expect(r.source).toBe("generated");
    expect(r.fact.content).toBe("Fact A");
    expect(create).toHaveBeenCalledTimes(1);
    expect(await prisma.fact.count({ where: { userId: "alice" } })).toBe(1);
  });

  it("returns the cached fact if it is under 60s old (no AI call)", async () => {
    await makeUser("alice");
    await makeFact("alice", "Interstellar", "Cached fact", 10 * SECONDS);

    const r = await getOrCreateFact("alice");

    expect(r).toMatchObject({ source: "cache", fact: { content: "Cached fact" } });
    expect(create).not.toHaveBeenCalled();
  });

  it("generates a new fact once the latest is over 60s old", async () => {
    await makeUser("alice");
    await makeFact("alice", "Interstellar", "Old fact", 61 * SECONDS);
    create.mockResolvedValue(aiReply("New fact"));

    const r = await getOrCreateFact("alice");

    expect(r).toMatchObject({ source: "generated", fact: { content: "New fact" } });
    expect(await prisma.fact.count({ where: { userId: "alice" } })).toBe(2);
  });

  it("a second request right after the first is served from cache", async () => {
    await makeUser("alice");
    create.mockResolvedValue(aiReply("Fact A"));

    await getOrCreateFact("alice");
    const second = await getOrCreateFact("alice");

    expect(second.source).toBe("cache");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("changing the movie is a cache miss (cache is keyed by user + movie)", async () => {
    await makeUser("alice", "Inception");
    await makeFact("alice", "Interstellar", "Fresh fact about the OLD movie", 5 * SECONDS);
    create.mockResolvedValue(aiReply("Inception fact"));

    const r = await getOrCreateFact("alice");

    expect(r).toMatchObject({ source: "generated", fact: { movie: "Inception" } });
  });
});

describe("getOrCreateFact: burst protection", () => {
  it("5 simultaneous requests make ONE AI call and ONE fact", async () => {
    await makeUser("alice");
    // Slow model, so all 5 requests overlap while it's "thinking".
    create.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(aiReply("Only fact")), 200)),
    );

    const results = await Promise.all(Array.from({ length: 5 }, () => getOrCreateFact("alice")));

    expect(create).toHaveBeenCalledTimes(1);
    expect(await prisma.fact.count({ where: { userId: "alice" } })).toBe(1);
    expect(results.map((r) => r.source).sort()).toEqual([
      "cache", "cache", "cache", "cache", "generated",
    ]);
    expect(new Set(results.map((r) => r.fact.content))).toEqual(new Set(["Only fact"]));
  });
});

describe("getOrCreateFact: failure handling", () => {
  it("falls back to the most recent saved fact when the AI fails", async () => {
    await makeUser("alice");
    await makeFact("alice", "Interstellar", "Older fact", 10 * 60 * SECONDS);
    await makeFact("alice", "Interstellar", "Newest saved fact", 5 * 60 * SECONDS);
    create.mockRejectedValue(new Error("timeout"));

    const r = await getOrCreateFact("alice");

    expect(r).toMatchObject({ source: "fallback", fact: { content: "Newest saved fact" } });
  });

  it("throws FactUnavailableError when the AI fails and nothing is saved", async () => {
    await makeUser("alice");
    create.mockRejectedValue(new Error("500 from OpenAI"));

    await expect(getOrCreateFact("alice")).rejects.toBeInstanceOf(FactUnavailableError);
  });

  it("treats an empty AI reply as a failure", async () => {
    await makeUser("alice");
    create.mockResolvedValue(aiReply("   "));

    await expect(getOrCreateFact("alice")).rejects.toBeInstanceOf(FactUnavailableError);
    expect(await prisma.fact.count()).toBe(0);
  });
});

describe("getOrCreateFact: authorization", () => {
  it("never returns another user's fact, even a fresh one for the same movie", async () => {
    await makeUser("alice");
    await makeUser("bob");
    await makeFact("bob", "Interstellar", "Bob's private fact", 1 * SECONDS);
    create.mockResolvedValue(aiReply("Alice's own fact"));

    const r = await getOrCreateFact("alice");

    expect(r.fact.content).toBe("Alice's own fact");
    expect(r.source).toBe("generated");
  });

  it("does not fall back to another user's fact when the AI fails", async () => {
    await makeUser("alice");
    await makeUser("bob");
    await makeFact("bob", "Interstellar", "Bob's private fact", 5 * 60 * SECONDS);
    create.mockRejectedValue(new Error("down"));

    await expect(getOrCreateFact("alice")).rejects.toBeInstanceOf(FactUnavailableError);
  });
});
