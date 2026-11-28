import { randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { assertMailConfigured, sendAuthEmail, verificationEmail, passwordResetEmail } from "@/lib/auth-email";
import { digestToken, normalizeEmail, validatePassword } from "@/lib/auth-security";

const passwordRounds = 12;

export async function allowAuthAttempt(action: string, subject: string, limit: number, windowMs: number) {
  const id = `${action}:${digestToken(subject)}`;
  const now = new Date();
  const resetBefore = new Date(now.getTime() - windowMs);
  const result = await prisma.$queryRaw<{ attempts: number }[]>`
    INSERT INTO "AuthRateLimit" ("id", "windowStartedAt", "attempts")
    VALUES (${id}, ${now}, 1)
    ON CONFLICT ("id") DO UPDATE SET
      "attempts" = CASE
        WHEN "AuthRateLimit"."windowStartedAt" <= ${resetBefore} THEN 1
        ELSE "AuthRateLimit"."attempts" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "AuthRateLimit"."windowStartedAt" <= ${resetBefore} THEN ${now}
        ELSE "AuthRateLimit"."windowStartedAt"
      END
    RETURNING "attempts"
  `;
  return (result[0]?.attempts ?? limit + 1) <= limit;
}

function tokenIdentifier(purpose: "verify-email" | "password-reset", email: string) {
  return `${purpose}:${email}`;
}

async function saveToken(identifier: string, rawToken: string, expires: Date) {
  await prisma.$transaction(async (transaction) => {
    await transaction.verificationToken.deleteMany({ where: { identifier } });
    await transaction.verificationToken.create({
      data: { identifier, token: digestToken(rawToken), expires },
    });
  });
}

export async function createAccount(input: { name: unknown; email: unknown; password: unknown }) {
  const email = normalizeEmail(input.email);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const passwordError = validatePassword(input.password);
  if (!email || !name || name.length > 100 || passwordError) {
    return { error: passwordError ?? "Enter a valid name and email address." };
  }
  if (!(await allowAuthAttempt("sign-up", email, 5, 60 * 60 * 1000))) {
    return { error: "Too many sign-up attempts. Try again later." };
  }
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(input.password as string, passwordRounds);
  const code = String(randomInt(100000, 1000000));
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "TECHNICIAN" },
    select: { id: true },
  });
  try {
    await saveToken(tokenIdentifier("verify-email", email), code, new Date(Date.now() + 10 * 60 * 1000));
    const message = verificationEmail(code);
    await sendAuthEmail(email, message.subject, message.text, message.html);
  } catch (error) {
    console.error("Verification email delivery failed", error);
    await prisma.verificationToken.deleteMany({ where: { identifier: tokenIdentifier("verify-email", email) } });
    await prisma.user.delete({ where: { id: user.id } });
    return { error: "We could not send the verification email. Check the SMTP configuration and try again." };
  }
  return { email };
}

export async function verifyEmail(input: { email: unknown; code: unknown }) {
  const email = normalizeEmail(input.email);
  const code = typeof input.code === "string" ? input.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) return false;
  if (!(await allowAuthAttempt("verify-email", email, 8, 15 * 60 * 1000))) return false;

  const now = new Date();
  return prisma.$transaction(async (transaction) => {
    const token = await transaction.verificationToken.deleteMany({
      where: {
        identifier: tokenIdentifier("verify-email", email),
        token: digestToken(code),
        expires: { gt: now },
      },
    });
    if (token.count !== 1) return false;
    const user = await transaction.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: now },
    });
    return user.count === 1;
  });
}

export async function resendVerificationCode(rawEmail: unknown) {
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: "Enter a valid email address." };
  if (!(await allowAuthAttempt("resend-verification", email, 3, 60 * 60 * 1000))) {
    return { error: "Too many requests. Try again later." };
  }
  assertMailConfigured();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });
  if (user && !user.emailVerified) {
    const code = String(randomInt(100000, 1000000));
    const identifier = tokenIdentifier("verify-email", email);
    await saveToken(identifier, code, new Date(Date.now() + 10 * 60 * 1000));
    const message = verificationEmail(code);
    try {
      await sendAuthEmail(email, message.subject, message.text, message.html);
    } catch (error) {
      console.error("Verification email delivery failed", error);
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return { error: "We could not send the verification email. Check the SMTP configuration and try again." };
    }
  }
  return { message: "If the account is awaiting verification, a new code has been sent." };
}

export async function requestPasswordReset(rawEmail: unknown) {
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: "Enter a valid email address." };
  assertMailConfigured();
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) throw new Error("Set NEXTAUTH_URL before sending password reset links.");
  let resetUrl: URL;
  try {
    resetUrl = new URL("/reset-password", baseUrl);
  } catch {
    throw new Error("Set a valid NEXTAUTH_URL before sending password reset links.");
  }
  if (resetUrl.protocol !== "http:" && resetUrl.protocol !== "https:") {
    throw new Error("NEXTAUTH_URL must use HTTP or HTTPS.");
  }
  if (!(await allowAuthAttempt("password-reset", email, 3, 60 * 60 * 1000))) {
    return { error: "Too many requests. Try again later." };
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, emailVerified: true },
  });
  if (user?.emailVerified) {
    const token = randomBytes(32).toString("base64url");
    const identifier = tokenIdentifier("password-reset", email);
    await saveToken(identifier, token, new Date(Date.now() + 30 * 60 * 1000));
    resetUrl.searchParams.set("token", token);
    const message = passwordResetEmail(user.name, resetUrl.toString());
    try {
      await sendAuthEmail(email, message.subject, message.text, message.html);
    } catch (error) {
      console.error("Password reset email delivery failed", error);
      await prisma.verificationToken.deleteMany({ where: { identifier } });
    }
  }
  return { message: "If an account exists for that email, a password reset link will be sent." };
}

export async function resetPassword(input: { token: unknown; password: unknown }) {
  const token = typeof input.token === "string" ? input.token : "";
  const passwordError = validatePassword(input.password);
  if (!/^[\w-]{40,60}$/.test(token) || passwordError) {
    return { error: passwordError ?? "This password reset link is invalid or expired." };
  }
  if (!(await allowAuthAttempt("complete-password-reset", digestToken(token), 8, 15 * 60 * 1000))) {
    return { error: "Too many attempts. Request a new reset link." };
  }
  const tokenHash = digestToken(token);
  const passwordHash = await bcrypt.hash(input.password as string, passwordRounds);
  const now = new Date();
  const updated = await prisma.$transaction(async (transaction) => {
    const resetToken = await transaction.verificationToken.findUnique({ where: { token: tokenHash } });
    if (
      !resetToken ||
      resetToken.expires <= now ||
      !resetToken.identifier.startsWith("password-reset:")
    ) return false;
    const consumed = await transaction.verificationToken.deleteMany({
      where: { token: tokenHash, expires: { gt: now } },
    });
    if (consumed.count !== 1) return false;
    const email = resetToken.identifier.slice("password-reset:".length);
    const user = await transaction.user.updateMany({
      where: { email, emailVerified: { not: null } },
      data: { passwordHash, authVersion: { increment: 1 } },
    });
    return user.count === 1;
  });
  return updated
    ? { message: "Your password was reset. You can now sign in." }
    : { error: "This password reset link is invalid or expired." };
}
