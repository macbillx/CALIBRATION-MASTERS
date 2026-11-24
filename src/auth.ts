import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";

function valuesFrom(name: string) {
  return (process.env[name] ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function githubIdFromProfile(profile: unknown) {
  if (!profile || typeof profile !== "object" || !("id" in profile)) return null;
  const id = profile.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
}

function roleForEmail(email: string): UserRole {
  const normalized = email.toLowerCase();
  if (normalized === process.env.AUTH_ADMIN_EMAIL?.trim().toLowerCase() || valuesFrom("AUTH_ADMIN_EMAILS").includes(normalized)) return "ADMIN";
  if (valuesFrom("AUTH_APPROVER_EMAILS").includes(normalized)) return "APPROVER";
  return "TECHNICIAN";
}

const allowedEmails = () => new Set([
  ...valuesFrom("AUTH_ALLOWED_EMAILS"),
  ...valuesFrom("AUTH_ADMIN_EMAILS"),
  ...valuesFrom("AUTH_APPROVER_EMAILS"),
  ...valuesFrom("AUTH_TECHNICIAN_EMAILS"),
  ...(process.env.AUTH_ADMIN_EMAIL ? [process.env.AUTH_ADMIN_EMAIL.trim().toLowerCase()] : []),
]);

async function isAdminGitHubAccount(userId: string) {
  const adminIds = valuesFrom("AUTH_ADMIN_GITHUB_IDS");
  if (adminIds.length === 0) return false;
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { providerAccountId: true },
  });
  return Boolean(account && adminIds.includes(account.providerAccountId.toLowerCase()));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async signIn({ user, profile }) {
      if (user.email && allowedEmails().has(user.email.toLowerCase())) return true;
      const githubId = githubIdFromProfile(profile);
      return githubId !== null && valuesFrom("AUTH_ALLOWED_GITHUB_IDS").includes(githubId.toLowerCase());
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const storedRole = (user as typeof user & { role: UserRole }).role;
        session.user.role = await isAdminGitHubAccount(user.id) ? "ADMIN" : storedRole;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email) await prisma.user.update({ where: { id: user.id }, data: { role: roleForEmail(user.email) } });
    },
  },
});
