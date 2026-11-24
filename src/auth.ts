import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";

function emailsFrom(name: string) {
  return (process.env[name] ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function roleForEmail(email: string): UserRole {
  const normalized = email.toLowerCase();
  if (normalized === process.env.AUTH_ADMIN_EMAIL?.trim().toLowerCase() || emailsFrom("AUTH_ADMIN_EMAILS").includes(normalized)) return "ADMIN";
  if (emailsFrom("AUTH_APPROVER_EMAILS").includes(normalized)) return "APPROVER";
  return "TECHNICIAN";
}

const allowedEmails = () => new Set([
  ...emailsFrom("AUTH_ALLOWED_EMAILS"),
  ...emailsFrom("AUTH_ADMIN_EMAILS"),
  ...emailsFrom("AUTH_APPROVER_EMAILS"),
  ...emailsFrom("AUTH_TECHNICIAN_EMAILS"),
  ...(process.env.AUTH_ADMIN_EMAIL ? [process.env.AUTH_ADMIN_EMAIL.trim().toLowerCase()] : []),
]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      return allowedEmails().has(user.email.toLowerCase());
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as typeof user & { role: UserRole }).role;
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

