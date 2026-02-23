import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  const log: ["error"] | [] = process.env.NODE_ENV === "development" ? ["error"] : [];

  if (url.startsWith("file:")) {
    // Local SQLite development
    const adapter = new PrismaLibSql({ url });
    return new PrismaClient({ adapter, log });
  }

  // PostgreSQL (Vercel production)
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
