import { prisma } from "@/lib/prisma";

/** Wipe the test database between tests (Fact/Session/Account cascade from User). */
export async function resetDb() {
  await prisma.user.deleteMany();
}

export function makeUser(id: string, favoriteMovie: string | null = "Interstellar") {
  return prisma.user.create({
    data: { id, name: id, email: `${id}@example.test`, favoriteMovie },
  });
}

/** Insert a fact that is `ageMs` old, so we can test the cache window without waiting. */
export function makeFact(userId: string, movie: string, content: string, ageMs: number) {
  return prisma.fact.create({
    data: { userId, movie, content, createdAt: new Date(Date.now() - ageMs) },
  });
}

/** The shape of an OpenAI chat completion, trimmed to what our code reads. */
export function aiReply(content: string) {
  return { choices: [{ message: { content } }] };
}
