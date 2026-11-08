import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the session: each test decides who is "logged in".
const auth = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth }));

const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/openai", () => ({
  openai: { chat: { completions: { create } } },
  FACT_MODEL: "test-model",
}));

import { prisma } from "@/lib/prisma";
import { GET } from "./route";
import { aiReply, makeFact, makeUser, resetDb } from "../../../../test/helpers";

const loginAs = (id: string | null) =>
  auth.mockResolvedValue(id ? { user: { id }, expires: "2099-01-01" } : null);

beforeEach(async () => {
  auth.mockReset();
  create.mockReset();
  await resetDb();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => prisma.$disconnect());

describe("GET /api/fact", () => {
  it("returns 401 when not signed in", async () => {
    loginAs(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns the signed-in user's own fact, never another user's", async () => {
    await makeUser("alice");
    await makeUser("bob");
    await makeFact("alice", "Interstellar", "Alice's fact", 5_000);
    await makeFact("bob", "Interstellar", "Bob's fact", 1_000); // newer, same movie

    loginAs("alice");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ source: "cache", fact: { content: "Alice's fact" } });
    // The response only exposes fact fields: no ids, no userId.
    expect(Object.keys(body.fact).sort()).toEqual(["content", "createdAt", "movie"]);
  });

  it("the route has no way to pick a user: Bob's session only ever sees Bob's facts", async () => {
    await makeUser("alice");
    await makeUser("bob");
    await makeFact("alice", "Interstellar", "Alice's fact", 1_000);
    create.mockResolvedValue(aiReply("Bob's new fact"));

    loginAs("bob");
    const body = await (await GET()).json();

    expect(body.fact.content).toBe("Bob's new fact");
  });

  it("returns a friendly 503 when the AI fails and there's no saved fact", async () => {
    await makeUser("alice");
    create.mockRejectedValue(new Error("timeout"));

    loginAs("alice");
    const res = await GET();

    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/try again/i);
  });

  it("returns 409 if the user hasn't finished onboarding", async () => {
    await makeUser("alice", null);
    loginAs("alice");
    expect((await GET()).status).toBe(409);
  });
});
