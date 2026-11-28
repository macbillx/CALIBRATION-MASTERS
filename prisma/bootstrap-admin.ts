import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ensureBootstrapAdmin } from "./bootstrap";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? process.env.CALI_DATABASE_URL ?? process.env.CALI_DATABASE_URL_POOLED;
if (!connectionString) throw new Error("Set a PostgreSQL connection URL before provisioning the initial administrator.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

ensureBootstrapAdmin(prisma)
  .catch((error) => {
    console.error("Initial administrator provisioning failed", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
