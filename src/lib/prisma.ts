import { PrismaClient } from "@prisma/client";

// In dev, Next.js hot-reloads modules on every save. Without this guard each
// reload would create a NEW PrismaClient and eventually exhaust Postgres
// connections. We stash one instance on globalThis and reuse it.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
