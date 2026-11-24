import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.CALI_DATABASE_URL_POOLED ??
  process.env.CALI_DATABASE_URL ??
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function isDatabaseConfigured() {
  return Boolean(
    process.env.DATABASE_URL ??
    process.env.CALI_DATABASE_URL_POOLED ??
    process.env.CALI_DATABASE_URL
  );
}

export function assertDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("Database connection is not configured. Add a PostgreSQL connection to your environment.");
  }
}
