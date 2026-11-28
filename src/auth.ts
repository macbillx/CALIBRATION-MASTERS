import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { allowAuthAttempt } from "@/lib/auth-service";
import { normalizeEmail } from "@/lib/auth-security";
import type { UserRole } from "@/generated/prisma/client";

const dummyPasswordHash = bcrypt.hash("unmatched-account-password", 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password || Buffer.byteLength(password, "utf8") > 72) return null;
        if (!(await allowAuthAttempt("sign-in", email, 10, 15 * 60 * 1000))) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, passwordHash: true, emailVerified: true, role: true, authVersion: true },
        });
        const matches = await bcrypt.compare(password, user?.passwordHash ?? await dummyPasswordHash);
        if (!user || !user.emailVerified || !user.passwordHash || !matches) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          authVersion: user.authVersion,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.authVersion = user.authVersion;
      }
      if (!token.sub) return token;

      const current = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true, name: true, email: true, emailVerified: true, role: true, authVersion: true },
      });
      if (!current?.emailVerified || current.authVersion !== token.authVersion) return null;
      token.name = current.name;
      token.email = current.email;
      token.role = current.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
