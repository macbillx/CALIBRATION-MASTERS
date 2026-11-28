import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { normalizeEmail, validatePassword } from "../src/lib/auth-security";

export async function ensureBootstrapAdmin(prisma: PrismaClient) {
  if (await prisma.user.count({ where: { role: "ADMIN" } })) return false;

  const rawEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!rawEmail || !password) {
    throw new Error("No administrator exists. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to provision the first administrator.");
  }
  const email = normalizeEmail(rawEmail);
  if (!email) throw new Error("Set a valid BOOTSTRAP_ADMIN_EMAIL.");
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(`Invalid bootstrap administrator password: ${passwordError}`);

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, emailVerified: new Date(), role: "ADMIN", authVersion: { increment: 1 } },
    });
  } else {
    await prisma.user.create({
      data: { name: "Administrator", email, passwordHash, emailVerified: new Date(), role: "ADMIN" },
    });
  }
  console.log(`Provisioned the initial administrator account for ${email}.`);
  return true;
}
