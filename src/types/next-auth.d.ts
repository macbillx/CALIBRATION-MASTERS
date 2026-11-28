import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: UserRole;
    authVersion: number;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & NonNullable<DefaultSession["user"]>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    authVersion?: number;
  }
}

